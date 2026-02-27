import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Video, Download, Share2,
  Check, Image as ImageIcon, FileText, Camera, MessageCircle, CalendarPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { EventDetail, SubProgram } from '../App';

// ─── Countdown Hook ───────────────────────────────────────────────────────────

function useCountdown(subPrograms: SubProgram[]) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [nextService, setNextService] = useState<SubProgram | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!subPrograms.length) return;

    const upcoming = subPrograms
      .filter(sp => sp.date && sp.time)
      .map(sp => ({ sp, dt: new Date(`${sp.date}T${sp.time}`) }))
      .filter(({ dt }) => !isNaN(dt.getTime()) && dt > new Date())
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());

    if (!upcoming.length) { setNextService(null); setTimeLeft(null); return; }

    const { sp, dt } = upcoming[0];
    setNextService(sp);

    const tick = () => {
      const diff = dt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); clearInterval(timerRef.current!); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [subPrograms]);

  return { timeLeft, nextService };
}

// ─── iCal generator ───────────────────────────────────────────────────────────

function buildICS(sp: SubProgram, eventName: string): string {
  const start = new Date(`${sp.date}T${sp.time}`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Evergreen Pro TV//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${sp.name} — ${eventName}`,
    sp.location ? `LOCATION:${sp.location}` : '',
    sp.stream_url ? `URL:${sp.stream_url}` : '',
    `DESCRIPTION:${window.location.href}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

function downloadICS(sp: SubProgram, eventName: string) {
  const blob = new Blob([buildICS(sp, eventName)], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sp.name.replace(/\s+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PublicEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const { timeLeft, nextService } = useCountdown(event?.sub_programs || []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events/${id}`)
      .then(res => {
        if (!res.ok) { setNotFound(true); setLoading(false); return null; }
        return res.json();
      })
      .then(data => {
        if (data) {
          setEvent(data);
          document.title = `${data.deceased_name} — Evergreen Pro TV`;
          // Fire-and-forget view count increment
          fetch(`/api/events/${id}/view`, { method: 'POST' }).catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
    return () => { document.title = 'Evergreen Pro TV'; };
  }, [id]);

  const handleShare = async () => {
    const shareData = { title: event?.deceased_name, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${event?.deceased_name}\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return dateStr; }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(); d.setHours(h, m);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return timeStr; }
  };

  const mapsUrl = (location: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  const CountDown = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-bold text-[#5A5A40] tabular-nums w-12 text-center">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1">{label}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-pulse text-[#5A5A40] font-serif italic text-xl">Loading…</div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#5A5A40]/10 rounded-full flex items-center justify-center mb-6">
          <ImageIcon className="w-8 h-8 text-[#5A5A40]/40" />
        </div>
        <h1 className="font-serif text-3xl text-[#1a1a1a] mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-xs">This link may be broken or the program has been removed.</p>
        <Link to="/" className="bg-[#5A5A40] text-white px-6 py-2.5 rounded-full text-sm hover:bg-[#4a4a34] transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  const typeLabel = {
    memorial: 'In Loving Memory of',
    funeral: 'A Funeral Service for',
    celebration: 'Celebrating the Life of',
    wedding: 'Join Us in Celebrating',
    birthday: 'Happy Birthday to',
    graduation: 'Congratulations to',
    concert: 'Live Performance by',
    conference: 'Welcome to',
    church: 'A Church Service for',
    thanksgiving: 'A Thanksgiving Service for',
    anniversary: 'Celebrating the Anniversary of',
    other: 'A Program for',
  }[event.event_type] ?? 'A Program for';

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-serif text-[#1a1a1a]">

      {/* ── Header ── */}
      <header className="max-w-3xl mx-auto pt-12 pb-8 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Share buttons */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 text-[#5A5A40] text-xs font-sans hover:shadow-md transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Link Copied' : 'Share'}
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366] rounded-full shadow-sm text-white text-xs font-sans hover:bg-[#20ba5a] hover:shadow-md transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          </div>

          {/* Portrait */}
          <div className="flex justify-center mb-6">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-[#5A5A40]/10">
              {event.deceased_photo ? (
                <img src={event.deceased_photo} alt={event.deceased_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#5A5A40]/10 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-[#5A5A40]/30" />
                </div>
              )}
            </div>
          </div>

          <p className="text-xs uppercase tracking-widest text-[#5A5A40]/60 mb-2 font-sans">{typeLabel}</p>
          <h1 className="text-4xl md:text-6xl font-light text-[#1a1a1a] mb-4">{event.deceased_name}</h1>
          <div className="w-20 h-px bg-[#5A5A40]/20 mx-auto" />
        </motion.div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-24 space-y-10">

        {/* ── Obituary ── */}
        {(event as any).obituary && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-gray-600 leading-relaxed text-base font-serif italic whitespace-pre-line">
              {(event as any).obituary}
            </p>
          </motion.section>
        )}

        {/* ── Countdown ── */}
        <AnimatePresence>
          {timeLeft && nextService && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center"
            >
              <p className="text-xs uppercase tracking-widest text-[#5A5A40]/60 font-sans mb-1">Next Service</p>
              <p className="font-serif text-lg text-[#1a1a1a] mb-5">{nextService.name}</p>
              <div className="flex items-center justify-center gap-4">
                <CountDown label="Days" value={timeLeft.days} />
                <span className="text-2xl text-[#5A5A40]/30 font-light mb-3">:</span>
                <CountDown label="Hours" value={timeLeft.hours} />
                <span className="text-2xl text-[#5A5A40]/30 font-light mb-3">:</span>
                <CountDown label="Min" value={timeLeft.minutes} />
                <span className="text-2xl text-[#5A5A40]/30 font-light mb-3">:</span>
                <CountDown label="Sec" value={timeLeft.seconds} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Services ── */}
        {event.sub_programs.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xs uppercase tracking-widest text-[#5A5A40]/60 font-sans mb-4">Services</h2>
            <div className="space-y-3">
              {event.sub_programs.map((sp, i) => (
                <motion.div
                  key={sp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-transparent hover:border-[#5A5A40]/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-[#1a1a1a]">{sp.name}</h3>
                      <div className="mt-2 space-y-1.5 font-sans text-sm text-gray-500">
                        {sp.date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#5A5A40]/50 shrink-0" />
                            <span>{formatDate(sp.date)}</span>
                          </div>
                        )}
                        {sp.time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#5A5A40]/50 shrink-0" />
                            <span>{formatTime(sp.time)}</span>
                          </div>
                        )}
                        {sp.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#5A5A40]/50 shrink-0" />
                            <a
                              href={mapsUrl(sp.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#5A5A40] hover:underline transition-colors"
                            >
                              {sp.location}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* iCal button — only if date + time are set */}
                      {sp.date && sp.time && (
                        <button
                          onClick={() => downloadICS(sp, event.deceased_name)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-sans text-[#5A5A40]/70 hover:text-[#5A5A40] border border-[#5A5A40]/20 hover:border-[#5A5A40]/40 px-3 py-1.5 rounded-full transition-all"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          Add to Calendar
                        </button>
                      )}
                    </div>

                    {sp.stream_url && (
                      <a
                        href={sp.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white rounded-full text-xs font-sans font-medium hover:bg-[#4a4a34] transition-colors shadow-md shadow-[#5A5A40]/20"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Watch Live
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Programs & Tributes ── */}
        {event.downloadables.length > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h2 className="text-xs uppercase tracking-widest text-[#5A5A40]/60 font-sans mb-4">Programs & Tributes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {event.downloadables.map(dl => {
                const isPdf = dl.file_url.toLowerCase().endsWith('.pdf') || dl.file_type === 'program';
                return (
                  <a
                    key={dl.id}
                    href={dl.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={!isPdf ? dl.title : undefined}
                    className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:border-[#5A5A40]/20 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#5A5A40]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#5A5A40]/20 transition-colors">
                      {isPdf ? (
                        <FileText className="w-5 h-5 text-[#5A5A40]" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#5A5A40]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium text-sm text-gray-900 truncate">{dl.title}</p>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{dl.file_type}</p>
                    </div>
                    <Download className="w-4 h-4 text-[#5A5A40]/40 group-hover:text-[#5A5A40] transition-colors shrink-0" />
                  </a>
                );
              })}
            </div>
          </motion.section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#5A5A40]/10 py-10 text-center">
        <p className="text-xs uppercase tracking-widest text-[#5A5A40]/40 font-sans mb-2">Professional Coverage by</p>
        <Link to="/" className="inline-flex items-center gap-2 text-[#5A5A40] hover:text-[#4a4a34] transition-colors">
          <Camera className="w-4 h-4" />
          <span className="text-sm font-sans font-semibold tracking-tight">Evergreen Pro TV</span>
        </Link>
      </footer>
    </div>
  );
}
