
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

   return (
    <div className="h-screen relative overflow-hidden flex items-center justify-center p-4 bg-white">
      {/* Animated Gradient Spots with Blur */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-20 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-32 right-28 w-56 h-56 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-60 h-60 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-16 w-52 h-52 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-3000"></div>
        <div className="absolute bottom-40 right-1/3 w-48 h-48 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-5000"></div>
        <div className="absolute top-2/3 left-12 w-56 h-56 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-1000"></div>
        <div className="absolute bottom-10 right-40 w-44 h-44 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-6000"></div>
        <div className="absolute top-20 left-2/3 w-52 h-52 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-45 animate-blob animation-delay-7000"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100 border border-gray-100 overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-900">Admin Login</h2>
              <p className="text-gray-500 mt-2">Manage your service catalog and tiers.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@osmoz.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLogin(e);
                    }}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-2 border border-red-100 animate-pulse">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In to Dashboard'}
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-xs">
              Restricted Access. Unauthorized entry attempts are logged.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 3.5s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 1s;
        }
        
        .animation-delay-3000 {
          animation-delay: 1.5s;
        }
        
        .animation-delay-4000 {
          animation-delay: 2s;
        }
        
        .animation-delay-5000 {
          animation-delay: 2.5s;
        }
        
        .animation-delay-1000 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-6000 {
          animation-delay: 3s;
        }
        
        .animation-delay-7000 {
          animation-delay: 3.5s;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
