
export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface Phase {
  id: string;
  category_id: string;
  title: string;
  description: string;
  objective: string;
  sort_order: number;
}

export interface PricingTier {
  id: string;
  phase_id: string;
  tier_type: string; // e.g., 'Starter', 'Professional', 'Enterprise'
  price: number;
  unit_name: string; // e.g., 'Page', 'Hour', 'Flat Fee'
  is_variable_quantity: boolean;
  min_quantity: number;
}

export interface Feature {
  id: string;
  tier_id: string;
  feature_text: string;
  display_order: number;
}

export interface Selection {
  tierId: string;
  quantity: number;
}

export type SelectionMap = Record<string, Selection>; // phaseId -> Selection
