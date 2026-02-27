import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { authHeader } from '../lib/auth';
import type { BusinessSettingsData, PortfolioImage } from '../App';

export default function BusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettingsData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');

  // Portfolio upload
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  useEffect(() => {
    fetch('/api/business-settings')
      .then(r => r.json())
      .then(({ settings, portfolio }) => {
        if (settings) {
          setSettings(settings);
          setName(settings.name || '');
          setTagline(settings.tagline || '');
          setAddress(settings.address || '');
          setPhone(settings.phone || '');
          setEmail(settings.email || '');
          setAbout(settings.about || '');
        }
        setPortfolio(portfolio || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await authHeader();
      await fetch('/api/business-settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name, tagline, address, phone, email, about }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortfolio(true);
    e.target.value = '';

    try {
      // Upload to Supabase Storage
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('portfolio').getPublicUrl(filePath);
      const imageUrl = data.publicUrl;

      // Save record via API
      const headers = await authHeader();
      const res = await fetch('/api/portfolio-images', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image_url: imageUrl, order_index: portfolio.length }),
      });
      const newImg = await res.json();
      setPortfolio(prev => [...prev, newImg]);
    } catch (err) {
      console.error('Portfolio upload failed:', err);
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const deletePortfolioImage = async (img: PortfolioImage) => {
    if (!confirm(`Remove this image?`)) return;
    try {
      const headers = await authHeader();
      await fetch(`/api/portfolio-images/${img.id}`, { method: 'DELETE', headers });
      setPortfolio(prev => prev.filter(p => p.id !== img.id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-pulse text-[#5A5A40] font-serif italic text-xl">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-bold text-base">Business Settings</h1>
          <div className="w-24" />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-8">

        {/* ── Business Info ── */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Business Information</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Evergreen Pro TV"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="Professional Memorial Coverage"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="hello@evergreenprotv.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">About</label>
                <textarea
                  rows={4}
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  placeholder="Tell families about your photography and coverage services…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none text-sm resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#5A5A40] text-white rounded-xl font-semibold shadow-md shadow-[#5A5A40]/20 hover:bg-[#4a4a34] transition-colors disabled:opacity-60"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* ── Portfolio Images ── */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Portfolio Gallery</h2>
              <p className="text-xs text-gray-500 mt-0.5">Images shown on your public landing page.</p>
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg text-sm font-medium hover:bg-[#5A5A40]/20 transition-colors">
              {uploadingPortfolio ? (
                <span className="animate-pulse">Uploading…</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Image
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePortfolioUpload}
                disabled={uploadingPortfolio}
                className="hidden"
              />
            </label>
          </div>

          {portfolio.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
              <ImageIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No portfolio images yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence>
                {portfolio.map(img => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100"
                  >
                    <img
                      src={img.image_url}
                      alt={img.title || 'Portfolio'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => deletePortfolioImage(img)}
                        className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {img.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-[10px] truncate">{img.title}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
