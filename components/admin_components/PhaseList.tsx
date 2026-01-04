import React, { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createPhase, deletePhaseWithCascade } from "@/services/adminService";
import { ServiceCategory, Phase } from "@/types";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Skeleton } from "../ui/Skeleton";
import { showToast } from "../ui/Toast";
 
interface Props {
  category: ServiceCategory | null;
  phases: Phase[];
  activePhase: Phase | null;
  isLoading: boolean;
  onSelect: (phase: Phase) => void;
  onRefresh: () => void;
}

export const PhaseList: React.FC<Props> = ({ category, phases, activePhase, isLoading, onSelect, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phaseToDelete, setPhaseToDelete] = useState<Phase | null>(null);

  const handleSave = async () => {
    if (!category || !form.title) return;
    setSaving(true);
    const { data, error } = await createPhase({
      category_id: category.id,
      title: form.title,
      description: form.description,
      sort_order: phases.length + 1,
     });
    setSaving(false);

    if (error) {
       showToast("Échec de la création de la phase", "error");
    } else if (data) {
      setForm({ title: "", description: "" });
      setIsAdding(false);
      onRefresh();
      onSelect(data[0]);
      showToast("Phase créée avec succès");
    }
  };

  const confirmDelete = async () => {
    if (!phaseToDelete) return;
    setIsDeleting(true);
    const { error, count } = await deletePhaseWithCascade(phaseToDelete.id);
    setIsDeleting(false);
    setPhaseToDelete(null);

    if (error) {
      showToast("Erreur de base de données", "error");
    } else if (count === 0) {
      showToast("Permission refusée.", "error");
    } else {
      showToast("Phase supprimée avec succès");
      onRefresh();
    }
  };

  return (
    <>
      <ConfirmModal 
        isOpen={!!phaseToDelete}
        title="Supprimer la phase ?"
        description={`Êtes-vous sûr de vouloir supprimer "${phaseToDelete?.title}" ?`}
        confirmText="Supprimer"
        isProcessing={isDeleting}
        onClose={() => setPhaseToDelete(null)}
        onConfirm={confirmDelete}
      />

      <div className="w-full flex flex-col h-full bg-gray-50/30">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-extrabold text-gray-800 text-lg">Phases</h3>
          <button onClick={() => setIsAdding(true)} disabled={!category} className="text-indigo-600 hover:scale-110 transition-transform p-2 hover:bg-indigo-50 rounded-full disabled:opacity-50">
            <Plus size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
          {isAdding && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-3 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2 mb-3">
                <input
                  autoFocus
                  className="w-full border-none bg-white rounded-lg p-3 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                  placeholder="Titre..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <textarea
                  className="w-full border-none bg-white rounded-lg p-3 text-xs shadow-sm resize-none h-20"
                  placeholder="Description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button disabled={saving} onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold shadow-md">
                  {saving ? <Loader2 className="animate-spin mx-auto" size={14} /> : "Enregistrer"}
                </button>
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-white text-gray-500 py-2 rounded-lg text-xs border">Annuler</button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="p-3 space-y-4">
              {[1, 2, 3].map(i => <div key={i}><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>)}
            </div>
          ) : (
            phases.length === 0 && !isAdding ? (
                <div className="text-center text-gray-400 py-10 text-sm">Aucune phase trouvée.</div>
            ) :
            phases.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                className={`group relative p-4 mb-2 rounded-xl cursor-pointer transition-all border ${
                  activePhase?.id === p.id 
                    ? "bg-white shadow-md border-indigo-200" 
                    : "hover:bg-white hover:shadow-sm border-transparent hover:border-gray-200"
                }`}
              >
                <div className="pr-8">
                  <p className={`font-bold ${activePhase?.id === p.id ? "text-indigo-900" : "text-gray-800"}`}>{p.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setPhaseToDelete(p); }}
                  className="absolute right-2 top-3 p-2 text-gray-300 hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};