import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, MapPin, Phone, Mail, Video, Film, Tv, Mic2,
  GraduationCap, Heart, Music, Users, Church, Star,
  ArrowRight, X, Play
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import type { BusinessSettingsData, PortfolioImage } from '../App';

// ─── Marquee ──────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  'Memorial Services', 'Weddings', 'Funerals', 'Church Services',
  'Concerts', 'Conferences', 'Graduations', 'Birthday Celebrations',
  'Thanksgiving Services', 'Anniversaries', 'Live Performances', 'Celebrations of Life',
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-5 border-y border-white/5 bg-[#111109]">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: 'marquee 28s linear infinite',
          width: 'max-content',
        }}
      >
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-sm text-white/30 uppercase tracking-widest font-light">
            {item}
            <span className="text-[#5A5A40]/60">✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [settings, setSettings] = useState<BusinessSettingsData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<PortfolioImage | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    fetch('/api/business-settings')
      .then(r => r.json())
      .then(({ settings, portfolio }) => {
        setSettings(settings);
        setPortfolio(portfolio || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const businessName = settings?.name || 'Evergreen Pro TV';
  const tagline = settings?.tagline || 'Professional Event Coverage';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a07] flex items-center justify-center">
        <div className="animate-pulse text-[#a8a870] font-serif italic text-xl">Loading…</div>
      </div>
    );
  }

  const eventTypes = [
    { icon: Heart,        label: 'Memorial Services',      desc: 'Dignified coverage for memorial and funeral services', wide: true },
    { icon: Film,         label: 'Weddings',               desc: 'Cinematic wedding videography and photography' },
    { icon: Church,       label: 'Church Services',        desc: 'Sunday services, revivals, and special programs' },
    { icon: Music,        label: 'Concerts & Performances',desc: 'Live music and performing arts events' },
    { icon: GraduationCap,label: 'Graduations',            desc: 'Celebrate academic milestones in full detail' },
    { icon: Users,        label: 'Conferences & Seminars', desc: 'Corporate and professional event coverage' },
    { icon: Star,         label: 'Birthday Celebrations',  desc: 'Milestone birthdays and special occasions' },
    { icon: Mic2,         label: 'Thanksgiving Services',  desc: 'Worship and thanksgiving event coverage' },
  ];

  const featured = portfolio[0] ?? null;
  const rest = portfolio.slice(1);

  return (
    <div className="min-h-screen bg-[#0a0a07] text-white font-sans">

      {/* ── Nav ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0a0a07]/95 backdrop-blur border-b border-white/5 py-4' : 'py-7'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#5A5A40] rounded-lg flex items-center justify-center">
              <Camera style={{ width: 14, height: 14 }} className="text-white" />
            </div>
            <span className="font-semibold text-sm tracking-wide">{businessName}</span>
          </div>
          <nav className="flex items-center gap-8">
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} className="hidden md:block text-xs text-white/40 hover:text-white transition-colors tracking-wide">
                {settings.phone}
              </a>
            )}
            <Link to="/login" className="text-xs text-white/25 hover:text-white/50 transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-end overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a10] via-[#0a0a07] to-[#0a0a07]" />
          <motion.div style={{ y: heroY }} className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-[700px] h-[700px] rounded-full bg-[#5A5A40]/8 blur-[140px]" />
            <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#3a3a28]/10 blur-[100px]" />
          </motion.div>
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-6 pb-24 pt-40">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 border border-[#5A5A40]/30 bg-[#5A5A40]/8 text-[#a8a870] text-[11px] uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#a8a870] animate-pulse" />
            {tagline}
          </motion.div>

          <div className="overflow-hidden mb-3">
            <motion.h1
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(3.5rem,10vw,9rem)] font-light font-serif leading-[0.85] tracking-tight text-white"
            >
              Every Moment,
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-12">
            <motion.h1
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(3.5rem,10vw,9rem)] font-light font-serif leading-[0.85] tracking-tight text-[#a8a870]"
            >
              Captured.
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <p className="text-white/35 text-base max-w-sm leading-relaxed">
              From intimate memorials to grand celebrations — we cover every program with care, quality, and heart.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              {settings?.phone && (
                <a href={`tel:${settings.phone}`}
                  className="group flex items-center gap-2.5 bg-[#5A5A40] hover:bg-[#6b6b48] text-white text-sm px-6 py-3 rounded-full font-medium transition-all shadow-lg shadow-[#5A5A40]/25"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Now
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`}
                  className="flex items-center gap-2.5 border border-white/10 text-white/50 hover:text-white hover:border-white/25 text-sm px-6 py-3 rounded-full transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 right-8 flex items-center gap-2 text-white/15"
        >
          <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
          <div className="w-8 h-px bg-white/15" />
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── What We Cover ── */}
      <section className="bg-[#f7f7f2] text-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#5A5A40]/50 mb-3">Services</p>
              <h2 className="text-4xl md:text-5xl font-light font-serif text-[#1a1a1a]">What We Cover</h2>
            </div>
            <p className="text-gray-400 max-w-xs text-sm leading-relaxed">
              We bring professional-grade production to every type of event, big or small.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {eventTypes.map((et, i) => (
              <motion.div
                key={et.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group relative bg-white rounded-3xl p-6 border border-gray-100 hover:border-[#5A5A40]/25 hover:shadow-2xl hover:shadow-[#5A5A40]/8 transition-all duration-300 cursor-default
                  ${i === 0 ? 'md:col-span-2 md:row-span-1' : ''}
                `}
              >
                <div className="w-10 h-10 bg-[#5A5A40]/8 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#5A5A40]/15 transition-colors">
                  <et.icon className="w-4.5 h-4.5 text-[#5A5A40]" style={{ width: 18, height: 18 }} />
                </div>
                <h3 className="font-semibold text-[#1a1a1a] text-sm mb-1.5 leading-snug">{et.label}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{et.desc}</p>
                <div className="absolute bottom-5 right-5 w-6 h-6 rounded-full bg-[#5A5A40]/0 group-hover:bg-[#5A5A40]/8 flex items-center justify-center transition-all">
                  <ArrowRight className="w-3 h-3 text-[#5A5A40] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      {settings?.about && (
        <section className="bg-[#131310]">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <div className="grid md:grid-cols-[200px_1fr] gap-16 items-start">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="pt-2"
              >
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#5A5A40]/50 mb-4">Our Story</p>
                <div className="w-8 h-0.5 bg-[#5A5A40]" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-white/55 text-xl md:text-2xl font-light font-serif leading-relaxed">
                  {settings.about}
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── Portfolio / Gallery ── */}
      {portfolio.length > 0 && (
        <section className="bg-[#0a0a07]">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#5A5A40]/40 mb-3">Portfolio</p>
                <h2 className="text-4xl md:text-5xl font-light font-serif text-white">Our Work</h2>
              </div>
              <p className="text-white/25 text-sm max-w-xs leading-relaxed">
                A glimpse of the moments we've been trusted to capture.
              </p>
            </motion.div>

            {/* Featured first image */}
            {featured && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={() => setLightbox(featured)}
                className="relative w-full rounded-3xl overflow-hidden group mb-3 block"
                style={{ aspectRatio: '16/7' }}
              >
                <img
                  src={featured.image_url}
                  alt={featured.title || 'Featured work'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full border border-white/30 backdrop-blur-sm bg-black/20 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                  </div>
                </div>
                {featured.title && (
                  <div className="absolute bottom-6 left-6">
                    <p className="text-white font-medium">{featured.title}</p>
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-[#5A5A40]/80 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Featured
                </div>
              </motion.button>
            )}

            {/* Rest of gallery */}
            {rest.length > 0 && (
              <div className="columns-2 md:columns-3 gap-3 space-y-3">
                {rest.map((img, i) => (
                  <motion.button
                    key={img.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setLightbox(img)}
                    className="relative w-full rounded-2xl overflow-hidden group bg-white/5 break-inside-avoid block"
                  >
                    <img
                      src={img.image_url}
                      alt={img.title || ''}
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full border border-white/40 flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    {img.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-white text-xs font-medium text-left">{img.title}</p>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Stats ── */}
      <section className="bg-[#5A5A40]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Events Covered' },
              { value: '100%', label: 'Client Satisfaction' },
              { value: 'HD', label: 'Live Streaming' },
              { value: '24/7', label: 'Support Available' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-light font-serif text-white mb-2">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-white/50">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      {(settings?.address || settings?.phone || settings?.email) && (
        <section className="bg-[#f7f7f2] text-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#5A5A40]/50 mb-4">Contact</p>
                <h2 className="text-5xl md:text-6xl font-light font-serif text-[#1a1a1a] leading-tight mb-6">
                  Let's cover<br />your event.
                </h2>
                <p className="text-gray-400 leading-relaxed max-w-sm text-sm">
                  Whether it's a memorial, wedding, concert, or church service — reach out and we'll make it unforgettable.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-3"
              >
                {settings?.phone && (
                  <a href={`tel:${settings.phone}`}
                    className="flex items-center gap-5 bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#5A5A40]/20 hover:shadow-xl hover:shadow-[#5A5A40]/8 transition-all group"
                  >
                    <div className="w-12 h-12 bg-[#5A5A40]/8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#5A5A40] transition-colors">
                      <Phone className="text-[#5A5A40] group-hover:text-white transition-colors" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <p className="font-semibold text-[#1a1a1a]">{settings.phone}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#5A5A40] group-hover:translate-x-0.5 transition-all" />
                  </a>
                )}
                {settings?.email && (
                  <a href={`mailto:${settings.email}`}
                    className="flex items-center gap-5 bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#5A5A40]/20 hover:shadow-xl hover:shadow-[#5A5A40]/8 transition-all group"
                  >
                    <div className="w-12 h-12 bg-[#5A5A40]/8 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#5A5A40] transition-colors">
                      <Mail className="text-[#5A5A40] group-hover:text-white transition-colors" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">Email</p>
                      <p className="font-semibold text-[#1a1a1a]">{settings.email}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#5A5A40] group-hover:translate-x-0.5 transition-all" />
                  </a>
                )}
                {settings?.address && (
                  <div className="flex items-center gap-5 bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="w-12 h-12 bg-[#5A5A40]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-[#5A5A40]" style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Location</p>
                      <p className="font-semibold text-[#1a1a1a]">{settings.address}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-[#070705] border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#5A5A40] rounded-md flex items-center justify-center">
              <Camera style={{ width: 11, height: 11 }} className="text-white" />
            </div>
            <span className="text-white/30 text-xs font-medium">{businessName}</span>
          </div>
          <p className="text-white/15 text-xs">© {new Date().getFullYear()} All rights reserved.</p>
          <Link to="/login" className="text-white/15 text-xs hover:text-white/40 transition-colors">Admin Login</Link>
        </div>
      </footer>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 w-10 h-10 bg-white/8 hover:bg-white/15 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="max-w-5xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lightbox.image_url}
                alt={lightbox.title || ''}
                className="w-full rounded-2xl shadow-2xl"
              />
              {lightbox.title && (
                <p className="text-white/40 text-sm text-center mt-4">{lightbox.title}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
