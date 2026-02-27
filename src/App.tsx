import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import EventForm from './components/EventForm';
import PublicEventPage from './components/PublicEventPage';
import BusinessSettings from './components/BusinessSettings';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessSettingsData {
  id: number;
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  about: string | null;
  logo_url: string | null;
  updated_at: string;
}

export interface PortfolioImage {
  id: string;
  title: string | null;
  image_url: string;
  order_index: number;
  created_at: string;
}

export interface EventRecord {
  id: string;
  deceased_name: string;
  deceased_photo: string | null;
  event_type: string;
  created_at: string;
}

export interface SubProgram {
  id: string;
  event_id: string;
  name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  stream_url: string | null;
  order_index: number;
}

export interface Downloadable {
  id: string;
  event_id: string;
  title: string;
  file_url: string;
  file_type: string;
}

export interface EventDetail extends EventRecord {
  sub_programs: SubProgram[];
  downloadables: Downloadable[];
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

interface AuthContextType {
  session: Session | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ session: null, loading: true });
export const useAuth = () => useContext(AuthContext);

// ─── Route Guard ──────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-pulse text-[#5A5A40] font-serif italic text-xl">Loading…</div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/e/:id" element={<PublicEventPage />} />

          {/* Protected */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/new" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/admin/:id" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><BusinessSettings /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
