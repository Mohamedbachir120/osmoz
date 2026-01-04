// services/adminService.ts
import { supabase } from "../supabaseClient";
import { ServiceCategory, Phase, PricingTier, Feature } from "../types";

// --- FETCHING ---
export const fetchCategories = async () => {
  return await supabase.from("service_categories").select("*").order("sort_order");
};

export const fetchPhases = async (categoryId: string) => {
  return await supabase.from("phases").select("*").eq("category_id", categoryId).order("sort_order");
};

export const fetchTiersAndFeatures = async (phaseId: string) => {
  const [tiers, features] = await Promise.all([
    supabase.from("pricing_tiers").select("*").eq("phase_id", phaseId).order('price'),
    supabase.from("features").select("*").order('display_order'),
  ]);
  return { tiers: tiers.data || [], features: features.data || [] };
};

// --- CREATION ---
export const createCategory = async (name: string, icon: string, sortOrder: number) => {
  return await supabase.from("service_categories").insert([{ name, icon, sort_order: sortOrder }]).select();
};

export const createPhase = async (phase: Partial<Phase>) => {
  return await supabase.from("phases").insert([phase]).select();
};

export const createTier = async (tier: Partial<PricingTier>) => {
  return await supabase.from("pricing_tiers").insert([tier]).select();
};

export const createFeature = async (tierId: string, text: string, order: number) => {
  return await supabase.from("features").insert([{ tier_id: tierId, feature_text: text, display_order: order }]);
};

// --- UPDATING ---
export const updateTier = async (id: string, updates: Partial<PricingTier>) => {
  return await supabase.from("pricing_tiers").update(updates).eq("id", id);
};

// --- DELETION (With Manual Cascade) ---

export const deleteFeature = async (id: string) => {
  return await supabase.from("features").delete().eq("id", id);
};

// services/adminService.ts

export const deleteTierWithCascade = async (tierId: string) => {
  console.log("Attempting to delete tier:", tierId);

  // 1. Delete Features first (Wait for this to finish!)
  const { error: featError } = await supabase
    .from("features")
    .delete()
    .eq("tier_id", tierId);

  if (featError) {
    console.error("Failed to delete features:", featError.message);
    return { error: featError };
  }

  // 2. Delete Tier
  // IMPORTANT: Add select() or count: 'exact' to verify it actually deleted something
  const { error, count, data } = await supabase
    .from("pricing_tiers")
    .delete({ count: 'exact' }) // <--- Ask for the count
    .eq("id", tierId)
    .select(); // <--- Ask for the deleted data back

  console.log("Tier Delete Result:", { id: tierId, count, error, data });

  if (count === 0) {
    console.warn("⚠️ Operation successful, but 0 rows were deleted. Check RLS policies.");
  }

  return { error, data };
};

export const deletePhaseWithCascade = async (phaseId: string) => {
  // 1. Find Tiers
  const { data: pTiers } = await supabase.from('pricing_tiers').select('id').eq('phase_id', phaseId);
  const tierIds = pTiers?.map(t => t.id) || [];

  if (tierIds.length > 0) {
    // 2. Delete Features
    await supabase.from('features').delete().in('tier_id', tierIds);
    // 3. Delete Tiers
    await supabase.from('pricing_tiers').delete().in('id', tierIds);
  }
  // 4. Delete Phase
 return await supabase
    .from("phases")
    .delete({ count: 'exact' })
    .eq("id", phaseId);
};

export const deleteCategoryWithCascade = async (categoryId: string) => {
  // 1. Find Phases
  const { data: catPhases } = await supabase.from('phases').select('id').eq('category_id', categoryId);
  const phaseIds = catPhases?.map(p => p.id) || [];

  if (phaseIds.length > 0) {
    // 2. Find Tiers
    const { data: phasesTiers } = await supabase.from('pricing_tiers').select('id').in('phase_id', phaseIds);
    const tierIds = phasesTiers?.map(t => t.id) || [];

    if (tierIds.length > 0) {
      // 3. Delete Features & Tiers
      await supabase.from('features').delete().in('tier_id', tierIds);
      await supabase.from('pricing_tiers').delete().in('id', tierIds);
    }
    // 4. Delete Phases
    await supabase.from('phases').delete().in('id', phaseIds);
  }
  // 5. Delete Category
   return await supabase
    .from("service_categories")
    .delete({ count: 'exact' })
    .eq("id", categoryId);
};