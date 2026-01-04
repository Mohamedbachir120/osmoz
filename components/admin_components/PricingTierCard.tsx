import React, { useState } from "react";
import { Trash2, Save, Loader2, Layers, Check, X, Plus } from "lucide-react";
import { updateTier, createFeature, deleteFeature, deleteTierWithCascade } from "@/services/adminService";
import { PricingTier, Feature } from "@/types";
import { ConfirmModal } from "../ui/ConfirmModal";
import { showToast } from "../ui/Toast";

interface Props {
  tier: PricingTier;
  features: Feature[];
  onRefresh: () => void;
}

export const PricingTierCard: React.FC<Props> = ({ tier, features, onRefresh }) => {
  const [localTier, setLocalTier] = useState(tier);
  const [newFeature, setNewFeature] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateTier(tier.id, localTier);
    setIsSaving(false);
    if (error) {
      showToast("Échec de l'enregistrement.", "error");
    } else {
      showToast("Palier mis à jour avec succès !");
      onRefresh();
    }
  };

  const handleAddFeature = async () => {
    if (!newFeature) return;
    setIsAddingFeature(true);
    const { error } = await createFeature(tier.id, newFeature, features.length);
    setIsAddingFeature(false);
    if (error) {
      showToast("Impossible d'ajouter la fonctionnalité.", "error");
    } else {
      setNewFeature("");
      onRefresh();
    }
  };

  const handleDeleteFeature = async (id: string) => {
    const { error } = await deleteFeature(id);
    if (error) showToast("Impossible de supprimer la fonctionnalité.", "error");
    else onRefresh();
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    const { error } = await deleteTierWithCascade(tier.id);
    setIsDeleting(false);
    setShowDeleteModal(false);
    if (error) {
      showToast("Erreur lors de la suppression.", "error");
    } else {
      showToast("Palier supprimé avec succès !");
      onRefresh();
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le palier ?"
        description="Cette action est irréversible. Cela supprimera définitivement ce palier de prix et toutes ses fonctionnalités associées."
        confirmText="Oui, supprimer"
        isProcessing={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-gray-100 shadow-sm relative group transition-all hover:shadow-xl hover:border-indigo-100">

        <div className="grid grid-cols-12 gap-4 lg:gap-6 mb-8">
          
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Type</label>
            <div className="w-full bg-gray-100/50 border border-gray-100 rounded-xl p-3 shadow-sm font-bold text-gray-500 cursor-not-allowed flex items-center gap-2 text-sm">
              <Layers size={14} /> {localTier.tier_type}
            </div>
          </div>
          
          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Prix (DZD)</label>
            <input
              type="number"
              className="w-full bg-gray-50 focus:bg-white border-none focus:ring-2 focus:ring-indigo-100 rounded-xl p-3 shadow-sm font-bold text-indigo-600 transition-all text-sm"
              value={localTier.price}
              onChange={e => setLocalTier({ ...localTier, price: Number(e.target.value) })}
            />
          </div>

          <div className="col-span-12 md:col-span-6 lg:col-span-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Unité</label>
            <input
              className="w-full bg-gray-50 focus:bg-white border-none focus:ring-2 focus:ring-indigo-100 rounded-xl p-3 shadow-sm font-bold text-gray-800 transition-all text-sm"
              value={localTier.unit_name}
              onChange={e => setLocalTier({ ...localTier, unit_name: e.target.value })}
            />
          </div>

          <div className="col-span-12 md:col-span-6 lg:col-span-3 flex items-end justify-end gap-2 mt-2 lg:mt-0">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-white text-red-400 p-3 rounded-xl border border-red-50 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            >
              <Trash2 size={20} />
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 text-white p-3 px-5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95 text-sm font-medium w-full justify-center lg:w-auto"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {features.map(f => (
            <div key={f.id} className="flex items-center justify-between group/feature gap-3 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-xl border border-transparent hover:border-gray-200">
              <div className="flex items-center gap-3 w-full">
                <div className="p-1 bg-green-100 text-green-600 rounded-full shrink-0"><Check size={12} strokeWidth={3} /></div>
                <span className="font-medium break-all">{f.feature_text}</span>
              </div>
              <button onClick={() => handleDeleteFeature(f.id)} className="text-gray-300 hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover/feature:opacity-100 transition-opacity p-2">
                <X size={16} />
              </button>
            </div>
          ))}

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
            <input
              className="flex-grow bg-white border border-gray-200 focus:border-indigo-300 rounded-xl p-3 text-sm shadow-sm outline-none transition-all w-full"
              placeholder="Ajouter une fonctionnalité..."
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFeature()}
            />
            <button disabled={isAddingFeature} onClick={handleAddFeature} className="bg-gray-100 text-gray-600 px-4 rounded-xl hover:bg-gray-200 transition-colors shrink-0">
              {isAddingFeature ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};