import React, { useState, useEffect } from "react";
import { Plus, X, Layers, Save, Loader2 } from "lucide-react";
import { fetchTiersAndFeatures, createTier } from "@/services/adminService";
import { Phase, PricingTier, Feature } from "@/types";
import { showToast } from "../ui/Toast";
import { PricingTierCard } from "./PricingTierCard";
 
const TIER_OPTIONS = ["STARTER", "STANDARD_PLUS", "PRO", "ENTREPRISE"];

interface Props {
  phase: Phase;
}

export const PhaseDetail: React.FC<Props> = ({ phase }) => {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTier, setNewTier] = useState({ tier_type: TIER_OPTIONS[0], price: 0, unit_name: "Projet" });

  const fetchData = async () => {
    setLoading(true);
    const { tiers, features } = await fetchTiersAndFeatures(phase.id);
    setTiers(tiers);
    setFeatures(features);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [phase.id]);

  const handleCreate = async () => {
    if(tiers.some(t => t.tier_type === newTier.tier_type)) {
      showToast("Ce type de palier existe déjà pour cette phase.", "error");
      return;
    }
    
    setIsCreating(true);
    const { data, error } = await createTier({
      phase_id: phase.id,
      ...newTier,
      is_variable_quantity: false,
      min_quantity: 1
    });
    
    setIsCreating(false);

    if (error) {
        showToast("Erreur base de données: " + error.message, "error");
    } else if (data) {
      setIsModalOpen(false);
      setNewTier({ tier_type: TIER_OPTIONS[0], price: 0, unit_name: "Projet" });
      fetchData();
      showToast("Palier de prix créé avec succès");
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 lg:pb-0">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end border-b border-gray-100 pb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">{phase.title}</h1>
          <p className="text-sm lg:text-base text-gray-500 mt-2 max-w-2xl">{phase.description || "Gérer les paliers de prix et les fonctionnalités."}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 shadow-xl shadow-gray-200 transition-transform active:scale-95 w-full lg:w-auto">
          <Plus size={20} /> <span>Nouveau Prix</span>
        </button>
      </div>

      {loading ? (
         <div className="grid gap-8"><div className="bg-gray-50 rounded-[2rem] h-64 animate-pulse"/><div className="bg-gray-50 rounded-[2rem] h-64 animate-pulse"/></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:gap-8">
            {tiers.length === 0 && <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-[2rem] border border-dashed">Aucun palier pour le moment.</div>}
            {tiers.map(tier => (
                <PricingTierCard 
                    key={tier.id} 
                    tier={tier} 
                    features={features.filter(f => f.tier_id === tier.id)} 
                    onRefresh={fetchData} 
                />
            ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-black text-gray-800">Ajouter un palier</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                </div>
                <div className="p-6 lg:p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Type de palier</label>
                        <div className="relative">
                            <select className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 pr-10 appearance-none font-bold" value={newTier.tier_type} onChange={e => setNewTier({...newTier, tier_type: e.target.value})}>
                                {TIER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <Layers className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        </div>
                    </div>
                     <button disabled={isCreating} onClick={handleCreate} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl mt-4 flex justify-center items-center gap-2">
                        {isCreating ? <Loader2 className="animate-spin" /> : <Save size={20} />} Créer le palier
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};