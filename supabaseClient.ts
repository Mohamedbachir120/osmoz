
import { createClient } from '@supabase/supabase-js';

/**
 * These values should ideally come from env variables.
 * In this sandbox environment, they are placeholders.
 */
const supabaseUrl = 'https://oufcolmwabtgntejtmao.supabase.co';
const supabaseKey = 'sb_publishable_k2SPJcfU4RPcoIe0YtPaMw_rxVT88Im';

export const supabase = createClient(supabaseUrl, supabaseKey);
