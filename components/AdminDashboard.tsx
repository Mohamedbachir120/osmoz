import React, { useState, useEffect } from "react";
import { Activity, Loader2, Menu, ChevronLeft, X } from "lucide-react";
import { ServiceCategory, Phase } from "../types";
import { fetchCategories, fetchPhases } from "../services/adminService";
import { CategorySidebar } from "./admin_components/CategorySideBar";
import { PhaseDetail } from "./admin_components/PhaseDetail";
import { PhaseList } from "./admin_components/PhaseList";

const AdminDashboard: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const [activePhase, setActivePhase] = useState<Phase | null>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingPhases, setLoadingPhases] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  const [showMobileDetail, setShowMobileDetail] = useState(false); 

  const loadInitialData = async () => {
    setLoadingInitial(true);
    const { data } = await fetchCategories();
    if (data) {
      setCategories(data);
      if (data.length > 0 && !activeCategory) {
        handleCategorySelect(data[0]);
      }
    }
    setLoadingInitial(false);
  };

  const loadPhases = async (catId: string) => {
    setLoadingPhases(true);
    const { data } = await fetchPhases(catId);
    if (data) setPhases(data);
    setLoadingPhases(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCategorySelect = (cat: ServiceCategory) => {
    if (activeCategory?.id !== cat.id) {
      setActiveCategory(cat);
      setActivePhase(null);
      loadPhases(cat.id);
    }
    setIsMobileMenuOpen(false);
    setShowMobileDetail(false); 
  };

  const handlePhaseSelect = (phase: Phase) => {
    setActivePhase(phase);
    setShowMobileDetail(true); 
  };

  const handleBackToPhases = () => {
    setShowMobileDetail(false);
  };

  const handleCategoryRefresh = async () => {
    const { data } = await fetchCategories();
    if (data) setCategories(data);
  };

  const handlePhaseRefresh = () => {
    if (activeCategory) loadPhases(activeCategory.id);
  };

  if (loadingInitial) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
  }

  return (
    <div className="h-[100dvh] lg:min-h-screen lg:h-auto bg-gray-50/50 font-sans flex flex-col lg:block overflow-hidden lg:overflow-visible">
      
      {/* ================= MOBILE HEADER ================= */}
      <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-30 relative">
        <div className="flex items-center gap-3 overflow-hidden">
          {showMobileDetail ? (
            <button onClick={handleBackToPhases} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-800">
              <Menu size={24} />
            </button>
          )}
          
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {showMobileDetail ? activeCategory?.name : "Catalogue"}
            </span>
            <span className="font-bold text-gray-900 truncate text-sm">
               {showMobileDetail ? (activePhase?.title || "Détails") : (activeCategory?.name || "Sélectionnez une catégorie")}
            </span>
          </div>
        </div>
      </header>

      {/* ================= MOBILE SIDEBAR DRAWER ================= */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`
        fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
         <div className="h-full flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
               <span className="font-black text-lg text-gray-800">Catalogue</span>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-grow overflow-hidden p-4">
               <CategorySidebar 
                 categories={categories}
                 activeCategory={activeCategory}
                 onSelect={handleCategorySelect}
                 onRefresh={handleCategoryRefresh}
               />
            </div>
         </div>
      </div>

      {/* ================= DESKTOP LAYOUT ================= */}
      <div className="flex-grow lg:max-w-7xl lg:mx-auto lg:px-4 lg:py-8 lg:flex lg:gap-8 overflow-hidden">
        
        <div className="hidden lg:block lg:w-72 shrink-0">
           <CategorySidebar 
            categories={categories}
            activeCategory={activeCategory}
            onSelect={handleCategorySelect}
            onRefresh={handleCategoryRefresh}
          />
        </div>

        <main className="flex-grow flex flex-col lg:flex-row bg-white lg:rounded-[2.5rem] lg:border border-gray-200 lg:shadow-xl overflow-hidden h-full">
          
          <div className={`
             lg:w-80 border-r border-gray-100 flex flex-col h-full bg-white transition-all duration-300
             ${showMobileDetail ? 'hidden lg:flex' : 'flex w-full'} 
          `}>
             <div className="flex-grow overflow-hidden relative">
               <PhaseList 
                category={activeCategory}
                phases={phases}
                activePhase={activePhase}
                isLoading={loadingPhases}
                onSelect={handlePhaseSelect}
                onRefresh={handlePhaseRefresh}
              />
            </div>
          </div>

          <div className={`
              flex-grow flex flex-col h-full bg-white relative
              ${showMobileDetail ? 'flex w-full' : 'hidden lg:flex'}
          `}>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 lg:p-10 pb-24 lg:pb-10">
              {activePhase ? (
                <PhaseDetail key={activePhase.id} phase={activePhase} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <div className="bg-gray-50 p-6 rounded-full mb-4">
                      <Activity size={60} strokeWidth={1} />
                  </div>
                  <p className="font-medium text-lg text-center px-4">Sélectionnez une phase pour gérer les prix</p>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;