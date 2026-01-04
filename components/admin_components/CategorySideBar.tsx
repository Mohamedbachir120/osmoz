import React, { useState } from "react";
import { Plus, Layers, Trash2, Loader2 } from "lucide-react";
import { createCategory, deleteCategoryWithCascade } from "@/services/adminService";
import { ServiceCategory } from "@/types";
import { ConfirmModal } from "../ui/ConfirmModal";
import { showToast } from "../ui/Toast";
 
interface Props {
  categories: ServiceCategory[];
  activeCategory: ServiceCategory | null;
  onSelect: (cat: ServiceCategory) => void;
  onRefresh: () => void;
}

export const CategorySidebar: React.FC<Props> = ({ categories, activeCategory, onSelect, onRefresh }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "Box" });
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error } = await createCategory(form.name, form.icon, categories.length + 1);
    
    setSaving(false);
    if (error) {
      showToast("Échec de la création de la catégorie", "error");
    } else if (data) {
      setForm({ name: "", icon: "Box" });
      setIsAdding(false);
      onRefresh();
      onSelect(data[0]);
      showToast("Catégorie créée avec succès");
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    
    const { error, count } = await deleteCategoryWithCascade(categoryToDelete.id);
    
    setIsDeleting(false);
    setCategoryToDelete(null);

    if (error) {
      showToast("Erreur de base de données", "error");
    } else if (count === 0) {
      showToast("Permission refusée.", "error");
    } else {
      showToast("Catalogue supprimé avec succès");
      onRefresh();
    }
  };

  return (
    <>
      <ConfirmModal 
        isOpen={!!categoryToDelete}
        title="Supprimer le catalogue ?"
        description={`Êtes-vous sûr de vouloir supprimer "${categoryToDelete?.name}" ?`}
        confirmText="Supprimer"
        isProcessing={isDeleting}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
      />

      <aside className="w-full h-full flex flex-col space-y-4">
        <div className="flex items-center justify-between px-2 shrink-0">
          <h2 className="text-xl font-black text-gray-900">Catalogue</h2>
          <button 
            onClick={() => setIsAdding(true)} 
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-transform active:scale-95"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-grow space-y-2 overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
          {isAdding && (
            <div className="p-3 mb-3 bg-white border border-indigo-200 rounded-xl shadow-lg animate-in fade-in slide-in-from-left-2">
              <input
                autoFocus
                className="w-full text-sm border-gray-200 rounded-lg mb-2 p-2 bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Nom..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <div className="flex gap-2">
                <button disabled={saving} onClick={handleSave} className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-md">
                  {saving ? <Loader2 className="animate-spin mx-auto" size={14} /> : "Ajouter"}
                </button>
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 rounded-md">Annuler</button>
              </div>
            </div>
          )}

          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelect(cat)}
              className={`group p-4 rounded-2xl cursor-pointer transition-all border relative ${
                activeCategory?.id === cat.id 
                  ? "bg-white border-indigo-200 shadow-md lg:translate-x-2" 
                  : "bg-transparent border-transparent hover:bg-white hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3 pr-8">
                <span className={`p-2 rounded-lg transition-colors shrink-0 ${activeCategory?.id === cat.id ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
                    <Layers size={18} />
                </span>
                <span className={`font-bold truncate ${activeCategory?.id === cat.id ? "text-indigo-600" : "text-gray-600"}`}>{cat.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setCategoryToDelete(cat); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="h-10 lg:hidden"></div>
        </div>
      </aside>
    </>
  );
};