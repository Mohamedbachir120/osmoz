import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Calculator, LayoutDashboard, LogIn, LogOut, Briefcase, Menu, X } from 'lucide-react';
import Estimator from './components/Estimator';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import { supabase } from './supabaseClient';

const AppLayout: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

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
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Briefcase size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                Osm<span className="text-indigo-600">Moz</span>
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
                <Calculator size={18} />
                Estimateur
              </Link>
              {session ? (
                <>
                  <Link to="/admin" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
                    <LayoutDashboard size={18} />
                    Admin
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors">
                  <LogIn size={18} />
                  Connexion
                </Link>
              )}
            </nav>

            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 absolute w-full left-0 z-50 animate-in slide-in-from-top-2">
            <div className="px-4 py-3 space-y-3 shadow-xl">
              <Link to="/" className="block text-gray-600 hover:text-indigo-600 font-medium py-2 flex items-center gap-2">
                <Calculator size={18} /> Estimateur
              </Link>
              {session ? (
                <>
                  <Link to="/admin" className="block text-gray-600 hover:text-indigo-600 font-medium py-2 flex items-center gap-2">
                    <LayoutDashboard size={18} /> Tableau de bord
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left text-red-500 hover:text-red-600 font-medium py-2 flex items-center gap-2"
                  >
                    <LogOut size={18} /> Déconnexion
                  </button>
                </>
              ) : (
                <Link to="/login" className="block text-gray-600 hover:text-indigo-600 font-medium py-2 flex items-center gap-2">
                  <LogIn size={18} /> Connexion
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Estimator />} />
          <Route path="/login" element={session ? <Navigate to="/admin" /> : <LoginPage />} />
          <Route 
            path="/admin/*" 
            element={session ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>

      {!isAdminRoute && (
        <footer className="bg-white border-t border-gray-200 py-6 shrink-0">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Osmoz Digital Agency.
          </div>
        </footer>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
};

export default App;