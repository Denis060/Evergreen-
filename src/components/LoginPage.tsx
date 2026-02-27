import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../App';

export default function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Invalid email or password.');
      setSubmitting(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Evergreen Pro TV</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                placeholder="admin@evergreenprotv.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-semibold shadow-md shadow-[#5A5A40]/20 hover:bg-[#4a4a34] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/" className="hover:text-[#5A5A40] transition-colors">← Back to website</a>
        </p>
      </motion.div>
    </div>
  );
}
