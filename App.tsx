
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Calculator, LayoutDashboard, LogIn, LogOut, Briefcase } from 'lucide-react';
import Estimator from './components/Estimator';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        {/* Navigation Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg text-white">
                  <Briefcase size={24} />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  Pro<span className="text-indigo-600">Estimate</span>
                </span>
              </div>
              
              <nav className="flex items-center gap-6">
                <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                  <Calculator size={18} />
                  Estimator
                </Link>
                {session ? (
                  <>
                    <Link to="/admin" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                      <LayoutDashboard size={18} />
                      Admin
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1">
                    <LogIn size={18} />
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Estimator />} />
            <Route path="/login" element={session ? <Navigate to="/admin" /> : <LoginPage />} />
            <Route 
              path="/admin/*" 
              element={session ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ProEstimate Digital Agency Tool. Powered by Gemini AI.
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
