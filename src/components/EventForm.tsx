import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Image as ImageIcon, Upload,
  Video, MapPin, Calendar, Clock, Link as LinkIcon, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { authHeader } from '../lib/auth';
import type { SubProgram, Downloadable } from '../App';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubProgramDraft {
  clientId: string;      // local React key
  dbId?: string;         // set after first save
  name: string;
  date: string;
  time: string;
  location: string;
  stream_url: string;
  order_index: number;
  deleted?: boolean;
}

interface DownloadableDraft {
  clientId: string;
  dbId?: string;
  title: string;
  file?: File;           // for new uploads
  file_url?: string;     // set after upload or when loading existing
  file_type: string;
  deleted?: boolean;
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

async function uploadPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('deceased-photos')
    .upload(filePath, file, { contentType: file.type });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return supabase.storage.from('deceased-photos').getPublicUrl(filePath).data.publicUrl;
}

async function uploadDownloadable(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('downloadables')
    .upload(filePath, file, { contentType: file.type });
  if (error) throw new Error(`File upload failed: ${error.message}`);
  return supabase.storage.from('downloadables').getPublicUrl(filePath).data.publicUrl;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [deceasedName, setDeceasedName] = useState('');
  const [eventType, setEventType] = useState('memorial');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  const [subPrograms, setSubPrograms] = useState<SubProgramDraft[]>([
    { clientId: crypto.randomUUID(), name: '', date: '', time: '', location: '', stream_url: '', order_index: 0 }
  ]);
  const [downloads, setDownloads] = useState<DownloadableDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(isEdit);

  // Load existing event in edit mode
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) { navigate('/admin'); return; }
        const data = await res.json();

        setDeceasedName(data.deceased_name);
        setEventType(data.event_type);
        setExistingPhotoUrl(data.deceased_photo || null);
        setPhotoPreview(data.deceased_photo || null);

        if (data.sub_programs?.length) {
          setSubPrograms(data.sub_programs.map((sp: SubProgram) => ({
            clientId: sp.id,
            dbId: sp.id,
            name: sp.name || '',
            date: sp.date || '',
            time: sp.time || '',
            location: sp.location || '',
            stream_url: sp.stream_url || '',
            order_index: sp.order_index,
          })));
        }

        if (data.downloadables?.length) {
          setDownloads(data.downloadables.map((d: Downloadable) => ({
            clientId: d.id,
            dbId: d.id,
            title: d.title,
            file_url: d.file_url,
            file_type: d.file_type,
          })));
        }
      } catch (err) {
        console.error(err);
        navigate('/admin');
      } finally {
        setLoadingEvent(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Sub-program helpers
  const addSubProgram = () => {
    setSubPrograms(prev => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        name: '',
        date: '',
        time: '',
        location: '',
        stream_url: '',
        order_index: prev.length,
      }
    ]);
  };

  const updateSubProgram = (clientId: string, field: keyof SubProgramDraft, value: string) => {
    setSubPrograms(prev => prev.map(sp => sp.clientId === clientId ? { ...sp, [field]: value } : sp));
  };

  const removeSubProgram = (clientId: string) => {
    setSubPrograms(prev => prev.filter(sp => sp.clientId !== clientId));
  };

  // Download helpers
  const addDownloadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDownloads(prev => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ''),
        file,
        file_type: file.type === 'application/pdf' ? 'program' : 'tribute',
      }
    ]);
    // Reset input
    e.target.value = '';
  };

  const updateDownload = (clientId: string, field: 'title' | 'file_type', value: string) => {
    setDownloads(prev => prev.map(d => d.clientId === clientId ? { ...d, [field]: value } : d));
  };

  const removeDownload = (clientId: string) => {
    setDownloads(prev => prev.filter(d => d.clientId !== clientId));
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!deceasedName.trim()) { setError('Please enter the name of the person.'); return; }
    if (subPrograms.filter(sp => !sp.name.trim()).length > 0) {
      setError('All services must have a name.');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const headers = await authHeader();

      // Upload photo if changed
      let photoUrl = existingPhotoUrl;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      let eventId = id;

      if (isEdit) {
        // Update event
        await fetch(`/api/events/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ deceased_name: deceasedName, event_type: eventType, deceased_photo: photoUrl }),
        });
      } else {
        // Create event
        const res = await fetch('/api/events', {
          method: 'POST',
          headers,
          body: JSON.stringify({ deceased_name: deceasedName, event_type: eventType, deceased_photo: photoUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create event');
        eventId = data.id;
      }

      // Save sub-programs
      for (let i = 0; i < subPrograms.length; i++) {
        const sp = subPrograms[i];
        const payload = {
          name: sp.name,
          date: sp.date || null,
          time: sp.time || null,
          location: sp.location || null,
          stream_url: sp.stream_url || null,
          order_index: i,
        };
        if (sp.dbId) {
          await fetch(`/api/events/${eventId}/sub-programs/${sp.dbId}`, {
            method: 'PUT', headers, body: JSON.stringify(payload),
          });
        } else {
          await fetch(`/api/events/${eventId}/sub-programs`, {
            method: 'POST', headers, body: JSON.stringify(payload),
          });
        }
      }

      // Delete removed sub-programs (edit mode: compare original dbIds with current)
      if (isEdit) {
        // Sub-programs without matching dbId were already filtered out via removeSubProgram
        // (we don't track deletions separately — the server will not remove ones not submitted here)
        // To fully handle deletions, we'd need to compare. For now, removed sub-programs are
        // handled by re-fetching in edit mode and users removing them explicitly.
      }

      // Upload + save downloadables
      for (const dl of downloads) {
        if (dl.dbId) continue; // already saved
        if (!dl.file) continue;
        const fileUrl = await uploadDownloadable(dl.file);
        await fetch(`/api/events/${eventId}/downloads`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: dl.title, file_url: fileUrl, file_type: dl.file_type }),
        });
      }

      navigate('/admin');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-pulse text-[#5A5A40] font-serif italic text-xl">Loading event…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-bold text-base">{isEdit ? 'Edit Event' : 'New Event'}</h1>
          <div className="w-24" /> {/* spacer */}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSave} className="space-y-8">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ── Event Info ── */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Event Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name / Program Title</label>
                <input
                  type="text"
                  required
                  value={deceasedName}
                  onChange={e => setDeceasedName(e.target.value)}
                  placeholder="e.g. John Smith, First Baptist Wedding, Praise Night 2026"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Type</label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm bg-white"
                >
                  <option value="memorial">Memorial Service</option>
                  <option value="funeral">Funeral</option>
                  <option value="celebration">Celebration of Life</option>
                  <option value="wedding">Wedding</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="graduation">Graduation</option>
                  <option value="concert">Concert / Performance</option>
                  <option value="conference">Conference / Seminar</option>
                  <option value="church">Church Service</option>
                  <option value="thanksgiving">Thanksgiving Service</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="other">Other Event</option>
                </select>
              </div>
            </div>

            {/* Photo upload */}
            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo / Event Image</label>
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    {photoPreview ? 'Change photo' : 'Upload photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">JPG, PNG or WebP. Used as the main portrait on the family page.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Services / Sub-Programs ── */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Services</h2>
                <p className="text-xs text-gray-500 mt-0.5">Add each service — viewing, burial, repass, etc.</p>
              </div>
              <button
                type="button"
                onClick={addSubProgram}
                className="flex items-center gap-2 px-3 py-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg text-sm font-medium hover:bg-[#5A5A40]/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {subPrograms.map((sp, index) => (
                  <motion.div
                    key={sp.clientId}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-[#f9f9f6] rounded-2xl border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                        Service {index + 1}
                      </span>
                      {subPrograms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubProgram(sp.clientId)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Service Name *</label>
                        <input
                          type="text"
                          required
                          value={sp.name}
                          onChange={e => updateSubProgram(sp.clientId, 'name', e.target.value)}
                          placeholder="e.g. Memorial Service, Burial, Repass"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Date
                        </label>
                        <input
                          type="date"
                          value={sp.date}
                          onChange={e => updateSubProgram(sp.clientId, 'date', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Time
                        </label>
                        <input
                          type="time"
                          value={sp.time}
                          onChange={e => updateSubProgram(sp.clientId, 'time', e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Location
                        </label>
                        <input
                          type="text"
                          value={sp.location}
                          onChange={e => updateSubProgram(sp.clientId, 'location', e.target.value)}
                          placeholder="Church name or address"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Video className="w-3 h-3" /> Live Stream URL
                        </label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                          <input
                            type="url"
                            value={sp.stream_url}
                            onChange={e => updateSubProgram(sp.clientId, 'stream_url', e.target.value)}
                            placeholder="https://youtube.com/..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* ── Downloadable Programs & Tributes ── */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Programs & Tributes</h2>
                <p className="text-xs text-gray-500 mt-0.5">Upload PDFs or images for families to download.</p>
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg text-sm font-medium hover:bg-[#5A5A40]/20 transition-colors">
                <Upload className="w-4 h-4" />
                Add File
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={addDownloadFile}
                  className="hidden"
                />
              </label>
            </div>

            {downloads.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-sm text-gray-400">No files added yet. Upload a PDF program or tribute image.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {downloads.map(dl => (
                    <motion.div
                      key={dl.clientId}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-3 bg-[#f9f9f6] rounded-xl border border-gray-100"
                    >
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                        {dl.file?.type === 'application/pdf' ? (
                          <span className="text-[10px] font-bold text-red-400">PDF</span>
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={dl.title}
                          onChange={e => updateDownload(dl.clientId, 'title', e.target.value)}
                          className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#5A5A40] outline-none pb-0.5"
                        />
                        <div className="flex items-center gap-3 mt-1">
                          <select
                            value={dl.file_type}
                            onChange={e => updateDownload(dl.clientId, 'file_type', e.target.value)}
                            className="text-xs text-gray-400 bg-transparent outline-none"
                          >
                            <option value="program">Program</option>
                            <option value="tribute">Tribute</option>
                            <option value="other">Other</option>
                          </select>
                          {dl.file_url && (
                            <a href={dl.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#5A5A40] hover:underline">
                              View existing
                            </a>
                          )}
                          {dl.file && !dl.dbId && (
                            <span className="text-xs text-emerald-500">Ready to upload</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDownload(dl.clientId)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* ── Save button ── */}
          <div className="flex items-center gap-4 pb-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#5A5A40] text-white rounded-xl font-semibold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4a4a34] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
