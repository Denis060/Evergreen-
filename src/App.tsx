import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Calendar, 
  MapPin, 
  ArrowLeft,
  Camera,
  Video,
  Share2,
  Music,
  Mic2,
  PartyPopper
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Program {
  id: string;
  name: string;
  type: string;
  flyer_url: string;
  links: string; // JSON string
  other_details: string; // JSON string
  created_at: string;
}

interface ProgramLinks {
  viewing?: string;
  repass?: string;
  burial?: string;
  stream?: string;
  tickets?: string;
  location?: string;
}

export default function App() {
  const [view, setView] = useState<"admin" | "public">("admin");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentProgram, setCurrentProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "memorial",
    flyer_base64: "",
    link1: "", // viewing / stream
    link2: "", // repass / tickets
    link3: "", // burial / location
    viewing_date: "",
    viewing_time: "",
    viewing_location: "",
    repass_date: "",
    repass_time: "",
    repass_location: "",
    burial_date: "",
    burial_time: "",
    burial_location: "",
  });

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/m/")) {
      const id = path.split("/m/")[1];
      fetchProgram(id);
      setView("public");
    } else {
      fetchPrograms();
      setView("admin");
    }
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/programs");
      const data = await res.json();
      setPrograms(data);
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgram = async (id: string) => {
    try {
      const res = await fetch(`/api/programs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentProgram(data);
      }
    } catch (err) {
      console.error("Error fetching program:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, flyer_base64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substring(2, 15);
    
    const links: ProgramLinks = {};
    if (formData.type === 'memorial') {
      links.viewing = formData.link1;
      links.repass = formData.link2;
      links.burial = formData.link3;
    } else {
      links.stream = formData.link1;
      links.tickets = formData.link2;
      links.location = formData.link3;
    }

    const payload = {
      id,
      name: formData.name,
      type: formData.type,
      flyer_url: formData.flyer_base64,
      links,
      other_details: {
        viewing: {
          date: formData.viewing_date,
          time: formData.viewing_time,
          location: formData.viewing_location,
        },
        repass: {
          date: formData.repass_date,
          time: formData.repass_time,
          location: formData.repass_location,
        },
        burial: {
          date: formData.burial_date,
          time: formData.burial_time,
          location: formData.burial_location,
        }
      }
    };

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFormData({ 
          name: "", 
          type: "memorial", 
          flyer_base64: "", 
          link1: "", 
          link2: "", 
          link3: "",
          viewing_date: "",
          viewing_time: "",
          viewing_location: "",
          repass_date: "",
          repass_time: "",
          repass_location: "",
          burial_date: "",
          burial_time: "",
          burial_location: "",
        });
        fetchPrograms();
      }
    } catch (err) {
      console.error("Error creating program:", err);
    }
  };

  const deleteProgram = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await fetch(`/api/programs/${id}`, { method: "DELETE" });
      fetchPrograms();
    } catch (err) {
      console.error("Error deleting program:", err);
    }
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/m/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProgramIcon = (type: string) => {
    switch (type) {
      case 'memorial': return <Camera className="w-5 h-5" />;
      case 'wedding': return <PartyPopper className="w-5 h-5" />;
      case 'concert': return <Music className="w-5 h-5" />;
      case 'conference': return <Mic2 className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-pulse text-[#5A5A40] font-serif italic text-xl">Loading...</div>
      </div>
    );
  }

  if (view === "public") {
    if (!currentProgram) {
      return (
        <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
          <h1 className="font-serif text-3xl text-[#5A5A40] mb-4">Program Not Found</h1>
          <p className="text-gray-600 mb-8">The link you followed may be broken or the file has been removed.</p>
          <a href="/" className="bg-[#5A5A40] text-white px-6 py-2 rounded-full hover:bg-[#4a4a34] transition-colors">
            Go to Home
          </a>
        </div>
      );
    }

    const links: ProgramLinks = JSON.parse(currentProgram.links || '{}');
    const otherDetails = JSON.parse(currentProgram.other_details || '{}');

    const handleShare = async () => {
      const shareData = {
        title: currentProgram.name,
        text: currentProgram.type === 'memorial' ? `In loving memory of ${currentProgram.name}` : `Check out ${currentProgram.name}`,
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.error("Error sharing:", err);
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopiedId('public-share');
        setTimeout(() => setCopiedId(null), 2000);
      }
    };

    return (
      <div className="min-h-screen bg-[#f5f5f0] font-serif text-[#1a1a1a]">
        {/* Header */}
        <header className="max-w-4xl mx-auto pt-12 pb-8 px-6 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex justify-center mb-4">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 text-[#5A5A40] text-sm font-sans hover:shadow-md transition-all"
              >
                {copiedId === 'public-share' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copiedId === 'public-share' ? "Link Copied" : "Share Program"}
              </button>
            </div>
            <span className="text-sm uppercase tracking-widest text-[#5A5A40] opacity-70">
              {currentProgram.type === 'memorial' ? 'In Loving Memory of' : 'Welcome to'}
            </span>
            <h1 className="text-5xl md:text-7xl font-light mt-2 mb-4">{currentProgram.name}</h1>
            <div className="w-24 h-px bg-[#5A5A40] mx-auto opacity-30"></div>
          </motion.div>
        </header>

        <main className="max-w-4xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Flyer Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              {currentProgram.flyer_url ? (
                <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                  <img 
                    src={currentProgram.flyer_url} 
                    alt="Program Flyer" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] bg-white rounded-3xl flex items-center justify-center border-2 border-dashed border-[#5A5A40]/20">
                  <ImageIcon className="w-12 h-12 text-[#5A5A40]/20" />
                </div>
              )}
            </motion.div>

            {/* Links Section */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-light mb-6 border-b border-[#5A5A40]/10 pb-2">Program Details</h2>
                
                <div className="space-y-4">
                  {Object.entries(links).map(([key, value]) => {
                    if (!value && !otherDetails[key]) return null;
                    const details = otherDetails[key] || {};
                    
                    return (
                      <div 
                        key={key}
                        className="p-6 bg-white rounded-2xl shadow-sm border border-transparent hover:border-[#5A5A40]/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#5A5A40]">
                              {key === 'viewing' || key === 'stream' ? <Video className="w-6 h-6" /> : 
                               key === 'repass' || key === 'location' ? <MapPin className="w-6 h-6" /> : 
                               <Calendar className="w-6 h-6" />}
                            </div>
                            <div>
                              <p className="font-medium capitalize">{key} Service</p>
                              <p className="text-xs text-gray-400 font-sans uppercase tracking-widest">Details & Links</p>
                            </div>
                          </div>
                          {value && (
                            <a 
                              href={value} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#5A5A40] hover:scale-110 transition-transform"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          )}
                        </div>

                        {(details.date || details.time || details.location) && (
                          <div className="space-y-2 text-sm text-gray-600 font-sans pl-16">
                            {details.date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 opacity-50" />
                                <span>{details.date}</span>
                              </div>
                            )}
                            {details.time && (
                              <div className="flex items-center gap-2">
                                <Video className="w-3 h-3 opacity-50" />
                                <span>{details.time}</span>
                              </div>
                            )}
                            {details.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 opacity-50" />
                                <span>{details.location}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {Object.keys(links).length === 0 && (
                    <p className="text-gray-500 italic">No links provided yet.</p>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-8 text-center"
              >
                <p className="text-xs uppercase tracking-widest text-[#5A5A40] opacity-50 mb-4">Professional Coverage by</p>
                <div className="flex items-center justify-center gap-2 text-[#5A5A40]">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-semibold tracking-tighter">PROGRAM MEDIA</span>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans text-[#1a1a1a]">
      {/* Admin Sidebar/Top Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Program Manager</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Dashboard</p>
            </div>
          </div>
          <button 
            onClick={() => window.scrollTo({ top: document.getElementById('new-program')?.offsetTop, behavior: 'smooth' })}
            className="bg-[#5A5A40] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#4a4a34] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Program
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List of Programs */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Recent Programs
            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {programs.length}
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {programs.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                        {p.flyer_url ? (
                          <img src={p.flyer_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{p.name}</h3>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                            {p.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Created {new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteProgram(p.id)}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => copyLink(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#f5f5f0] text-[#5A5A40] rounded-lg text-sm font-medium hover:bg-[#ebebe4] transition-colors"
                    >
                      {copiedId === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedId === p.id ? "Copied" : "Copy Link"}
                    </button>
                    <a 
                      href={`/m/${p.id}`}
                      target="_blank"
                      className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {programs.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No programs yet</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-1">Create your first program file using the form on the right.</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Form */}
        <div id="new-program" className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Create New Program</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Program Type</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="memorial">Memorial / Funeral</option>
                  <option value="wedding">Wedding</option>
                  <option value="concert">Concert / Performance</option>
                  <option value="conference">Conference / Seminar</option>
                  <option value="other">Other Event</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Program Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. John Doe Memorial"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Flyer / Image</label>
                <div className="relative group cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${formData.flyer_base64 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 group-hover:border-[#5A5A40]/40'}`}>
                    {formData.flyer_base64 ? (
                      <img src={formData.flyer_base64} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                        <span className="text-xs text-gray-400">Click to upload flyer</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Program Details</p>
                
                {/* Viewing Section */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">Viewing / Stream</p>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="url" 
                      placeholder="Link"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.link1}
                      onChange={(e) => setFormData({ ...formData, link1: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Date"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.viewing_date}
                      onChange={(e) => setFormData({ ...formData, viewing_date: e.target.value })}
                    />
                    <input 
                      type="text" 
                      placeholder="Time"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.viewing_time}
                      onChange={(e) => setFormData({ ...formData, viewing_time: e.target.value })}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Location"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                    value={formData.viewing_location}
                    onChange={(e) => setFormData({ ...formData, viewing_location: e.target.value })}
                  />
                </div>

                {/* Repass Section */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">Repass / Tickets</p>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="url" 
                      placeholder="Link"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.link2}
                      onChange={(e) => setFormData({ ...formData, link2: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Date"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.repass_date}
                      onChange={(e) => setFormData({ ...formData, repass_date: e.target.value })}
                    />
                    <input 
                      type="text" 
                      placeholder="Time"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.repass_time}
                      onChange={(e) => setFormData({ ...formData, repass_time: e.target.value })}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Location"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                    value={formData.repass_location}
                    onChange={(e) => setFormData({ ...formData, repass_location: e.target.value })}
                  />
                </div>

                {/* Burial Section */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">Burial / Location</p>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="url" 
                      placeholder="Link"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.link3}
                      onChange={(e) => setFormData({ ...formData, link3: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Date"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.burial_date}
                      onChange={(e) => setFormData({ ...formData, burial_date: e.target.value })}
                    />
                    <input 
                      type="text" 
                      placeholder="Time"
                      className="px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                      value={formData.burial_time}
                      onChange={(e) => setFormData({ ...formData, burial_time: e.target.value })}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Location"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                    value={formData.burial_location}
                    onChange={(e) => setFormData({ ...formData, burial_location: e.target.value })}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4a4a34] hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Program File
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto p-12 text-center text-gray-400 text-sm">
        <p>© 2026 Media Program Manager. Built for Photographers.</p>
      </footer>
    </div>
  );
}
