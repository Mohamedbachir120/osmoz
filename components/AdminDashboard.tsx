import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronRight,
  Layers,
  Settings,
  Activity,
  Box,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { ServiceCategory, Phase, PricingTier, Feature } from "../types";
import * as LucideIcons from "lucide-react";

const AdminDashboard: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(
    null
  );
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<Partial<ServiceCategory>>({
    name: "",
    icon: "Box",
    sort_order: 0,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddPhase = async () => {
    if (!activeCategory) return;

    const newPhase = {
      category_id: activeCategory.id,
      title: "Nouvelle Phase",
      description: "Description de la phase",
      objective: "Objectif",
      sort_order: phases.length + 1,
      is_enabled: true,
    };

    const { data, error } = await supabase
      .from("phases")
      .insert([newPhase])
      .select();

    if (error) {
      alert("Erreur Phase: " + error.message);
    } else if (data) {
      setPhases([...phases, data[0]]);
      setActivePhase(data[0]);
    }
  };
  const fetchInitialData = async () => {
    setLoading(true);
    const { data: cats } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order");
    if (cats) {
      setCategories(cats);
      if (cats.length > 0) {
        setActiveCategory(cats[0]);
        fetchPhases(cats[0].id);
      }
    }
    setLoading(false);
  };

  const fetchPhases = async (catId: string) => {
    const { data } = await supabase
      .from("phases")
      .select("*")
      .eq("category_id", catId)
      .order("sort_order");
    if (data) setPhases(data);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;

    if (categoryForm.id) {
      await supabase
        .from("service_categories")
        .update(categoryForm)
        .eq("id", categoryForm.id);
    } else {
      await supabase.from("service_categories").insert([categoryForm]);
    }

    setIsEditingCategory(false);
    setCategoryForm({ name: "", icon: "Box", sort_order: 0 });
    fetchInitialData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8 min-h-[calc(100vh-10rem)]">
      {/* Categories Sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-gray-900">Categories</h2>
          <button
            onClick={() => {
              setCategoryForm({ name: "", icon: "Box", sort_order: 0 });
              setIsEditingCategory(true);
            }}
            className="p-1 hover:bg-gray-100 rounded text-indigo-600"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {categories.map((cat) => {
            const IconComponent =
              (LucideIcons as any)[cat.icon] || LucideIcons.Layers;
            const isActive = activeCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat);
                  fetchPhases(cat.id);
                  setActivePhase(null);
                }}
                className={`flex items-center justify-between group px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent size={18} />
                  <span className="font-semibold text-sm">{cat.name}</span>
                </div>
                <div
                  className={`flex items-center gap-1 ${
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryForm(cat);
                      setIsEditingCategory(true);
                    }}
                  >
                    <Edit3
                      size={14}
                      className={isActive ? "text-indigo-200" : "text-gray-400"}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {isEditingCategory && (
          <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <input
              className="w-full border p-2 rounded-lg text-sm"
              placeholder="Category Name"
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
            />
            <input
              className="w-full border p-2 rounded-lg text-sm"
              placeholder="Lucide Icon Name"
              value={categoryForm.icon}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, icon: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveCategory}
                className="flex-grow bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingCategory(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content: Phases & Tiers */}
      <section className="flex-grow bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex">
        {/* Phase List */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Phases</h3>
            <button className="text-indigo-600 hover:text-indigo-700" onClick={handleAddPhase}>
              <Plus size={20} />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto">
            {phases.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">
                No phases found.
              </div>
            ) : (
              phases.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActivePhase(p)}
                  className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    activePhase?.id === p.id
                      ? "bg-indigo-50/50 border-l-4 border-l-indigo-600"
                      : ""
                  }`}
                >
                  <p className="font-bold text-gray-900 text-sm">{p.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {p.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Phase Editor / Tiers Manager */}
        <div className="flex-grow overflow-y-auto bg-gray-50/30 p-8">
          {activePhase ? (
            <PhaseDetailsManager phase={activePhase} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-4">
              <Activity size={64} className="opacity-20" />
              <div>
                <p className="font-semibold text-gray-600">
                  Phase Configuration
                </p>
                <p className="text-sm">
                  Select a phase from the left to manage pricing tiers and
                  features.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Internal Helper Component for Managing Tiers and Features
const PhaseDetailsManager: React.FC<{ phase: Phase }> = ({ phase }) => {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhaseData();
  }, [phase.id]);

  const fetchPhaseData = async () => {
    setLoading(true);
    const [tRes, fRes] = await Promise.all([
      supabase.from("pricing_tiers").select("*").eq("phase_id", phase.id),
      supabase.from("features").select("*"),
    ]);
    if (tRes.data) setTiers(tRes.data);
    if (fRes.data) setFeatures(fRes.data);
    setLoading(false);
  };

  const addTier = async () => {
    const newTier = {
      phase_id: phase.id,
      tier_type: "Standard",
      price: 0,
      unit_name: "Flat Fee",
      is_variable_quantity: false,
      min_quantity: 1,
    };
    const { data } = await supabase
      .from("pricing_tiers")
      .insert([newTier])
      .select();
    if (data) setTiers([...tiers, data[0]]);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-2xl font-black text-gray-900">{phase.title}</h4>
          <p className="text-gray-500">{phase.description}</p>
        </div>
        <button
          onClick={addTier}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus size={18} /> Add Tier
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tiers.map((tier) => (
          <TierEditor
            key={tier.id}
            tier={tier}
            features={features.filter((f) => f.tier_id === tier.id)}
            refresh={fetchPhaseData}
          />
        ))}
      </div>
    </div>
  );
};

const TierEditor: React.FC<{
  tier: PricingTier;
  features: Feature[];
  refresh: () => void;
}> = ({ tier, features, refresh }) => {
  const [localTier, setLocalTier] = useState(tier);
  const [newFeatureText, setNewFeatureText] = useState("");

  const saveTier = async () => {
    await supabase.from("pricing_tiers").update(localTier).eq("id", tier.id);
    refresh();
  };

  const addFeature = async () => {
    if (!newFeatureText) return;
    await supabase
      .from("features")
      .insert([
        {
          tier_id: tier.id,
          feature_text: newFeatureText,
          display_order: features.length,
        },
      ]);
    setNewFeatureText("");
    refresh();
  };

  const deleteFeature = async (id: string) => {
    await supabase.from("features").delete().eq("id", id);
    refresh();
  };

  const deleteTier = async () => {
    if (confirm("Are you sure you want to delete this pricing tier?")) {
      await supabase.from("pricing_tiers").delete().eq("id", tier.id);
      refresh();
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative group">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={saveTier}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100"
        >
          <Save size={18} />
        </button>
        <button
          onClick={deleteTier}
          className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
            Tier Name
          </label>
          <input
            className="w-full border rounded-lg p-2 font-medium"
            value={localTier.tier_type}
            onChange={(e) =>
              setLocalTier({ ...localTier, tier_type: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
            Base Price ($)
          </label>
          <input
            type="number"
            className="w-full border rounded-lg p-2 font-medium"
            value={localTier.price}
            onChange={(e) =>
              setLocalTier({ ...localTier, price: parseInt(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
            Unit Label
          </label>
          <input
            className="w-full border rounded-lg p-2 font-medium"
            value={localTier.unit_name}
            onChange={(e) =>
              setLocalTier({ ...localTier, unit_name: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col justify-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={localTier.is_variable_quantity}
              onChange={(e) =>
                setLocalTier({
                  ...localTier,
                  is_variable_quantity: e.target.checked,
                })
              }
              className="w-5 h-5 accent-indigo-600"
            />
            <span className="text-sm font-bold text-gray-700">
              Variable Qty
            </span>
          </label>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Settings size={16} /> Tier Features
        </h5>
        <div className="space-y-2 mb-4">
          {features.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm border border-gray-100"
            >
              <span className="text-gray-700">{f.feature_text}</span>
              <button
                onClick={() => deleteFeature(f.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-grow border rounded-lg px-3 py-2 text-sm"
            placeholder="Add a feature text..."
            value={newFeatureText}
            onChange={(e) => setNewFeatureText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFeature()}
          />
          <button
            onClick={addFeature}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
