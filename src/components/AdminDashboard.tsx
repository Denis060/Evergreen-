import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera, Plus, Trash2, ExternalLink, Copy, Check,
  Image as ImageIcon, Settings, LogOut, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { authHeader } from '../lib/auth';
import type { EventRecord } from '../App';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [showQr, setShowQr] = useState<string | null>(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const headers = await authHeader();
      const res = await fetch('/api/events', { headers });
      const data = await res.json();
      setEvents(data);
      // Generate QR codes for all events
      data.forEach(async (ev: EventRecord) => {
        const url = `${window.location.origin}/e/${ev.id}`;
        const qr = await QRCode.toDataURL(url, { width: 200, margin: 1 });
        setQrCodes(prev => ({ ...prev, [ev.id]: qr }));
      });
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const headers = await authHeader();
      await fetch(`/api/events/${id}`, { method: 'DELETE', headers });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/e/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">Evergreen Pro TV</h1>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <Link
              to="/admin/new"
              className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white text-sm font-medium rounded-lg hover:bg-[#4a4a34] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            All Events
            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {events.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-56 border border-gray-100" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No events yet</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">Create your first event to get started.</p>
            <Link
              to="/admin/new"
              className="inline-flex items-center gap-2 bg-[#5A5A40] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#4a4a34] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {events.map((ev) => (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative h-32 bg-gradient-to-br from-[#5A5A40]/10 to-[#5A5A40]/5 overflow-hidden">
                    {ev.deceased_photo ? (
                      <img
                        src={ev.deceased_photo}
                        alt={ev.deceased_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-[#5A5A40]/20" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-1 bg-white/90 backdrop-blur-sm text-[#5A5A40] rounded-full">
                        {ev.event_type}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteEvent(ev.id, ev.deceased_name)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 truncate">{ev.deceased_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Created {new Date(ev.created_at).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-1.5 mt-3">
                      <button
                        onClick={() => copyLink(ev.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-[#f5f5f0] text-[#5A5A40] rounded-lg text-xs font-medium hover:bg-[#ebebE4] transition-colors"
                      >
                        {copiedId === ev.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === ev.id ? 'Copied' : 'Copy Link'}
                      </button>

                      <button
                        onClick={() => setShowQr(showQr === ev.id ? null : ev.id)}
                        className="p-2 bg-[#f5f5f0] text-[#5A5A40] rounded-lg hover:bg-[#ebebE4] transition-colors"
                        title="Show QR code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        to={`/e/${ev.id}`}
                        target="_blank"
                        className="p-2 bg-[#f5f5f0] text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="View public page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        to={`/admin/${ev.id}`}
                        className="p-2 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg hover:bg-[#5A5A40]/20 transition-colors text-xs font-medium px-3"
                        title="Edit event"
                      >
                        Edit
                      </Link>
                    </div>

                    {/* QR Code panel */}
                    <AnimatePresence>
                      {showQr === ev.id && qrCodes[ev.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="bg-[#f5f5f0] rounded-xl p-3 flex flex-col items-center gap-2">
                            <img src={qrCodes[ev.id]} alt="QR Code" className="w-28 h-28" />
                            <p className="text-[10px] text-gray-400 text-center">Scan to open family page</p>
                            <a
                              href={qrCodes[ev.id]}
                              download={`qr-${ev.deceased_name.replace(/\s+/g, '-')}.png`}
                              className="text-[10px] text-[#5A5A40] font-medium hover:underline"
                            >
                              Download QR
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
