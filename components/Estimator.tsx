
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  ChevronRight, 
  Info, 
  CreditCard, 
  Sparkles,
  ArrowRight,
  Loader2,
  PackageCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';
// Added Selection to imports from ../types
import { ServiceCategory, Phase, PricingTier, Feature, SelectionMap, Selection } from '../types';
import * as LucideIcons from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const Estimator: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProposal, setAiProposal] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, phsRes, tierRes, featRes] = await Promise.all([
        supabase.from('service_categories').select('*').order('sort_order'),
        supabase.from('phases').select('*').order('sort_order'),
        supabase.from('pricing_tiers').select('*'),
        supabase.from('features').select('*').order('display_order'),
      ]);

      if (catRes.data) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) setActiveCategoryId(catRes.data[0].id);
      }
      if (phsRes.data) setPhases(phsRes.data);
      if (tierRes.data) setTiers(tierRes.data);
      if (featRes.data) setFeatures(featRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryPhases = useMemo(() => {
    return phases.filter(p => p.category_id === activeCategoryId);
  }, [phases, activeCategoryId]);

  const totalCost = useMemo(() => {
    // Explicitly casting to Selection[] to fix 'unknown' property access errors
    return (Object.values(selections) as Selection[]).reduce((sum, sel) => {
      const tier = tiers.find(t => t.id === sel.tierId);
      if (!tier) return sum;
      return sum + (tier.price * (tier.is_variable_quantity ? sel.quantity : 1));
    }, 0);
  }, [selections, tiers]);

  const handleTierSelect = (phaseId: string, tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    setSelections(prev => ({
      ...prev,
      [phaseId]: {
        tierId,
        quantity: tier?.min_quantity || 1
      }
    }));
  };

  const handleQuantityChange = (phaseId: string, qty: number) => {
    setSelections(prev => ({
      ...prev,
      [phaseId]: {
        ...prev[phaseId],
        quantity: Math.max(1, qty)
      }
    }));
  };

  const generateAIProposal = async () => {
    if (Object.keys(selections).length === 0) return;
    
    setAiGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      
      // Explicitly casting Object.entries to fix 'unknown' property access errors
      const selectedDetails = (Object.entries(selections) as [string, Selection][]).map(([phaseId, sel]) => {
        const phase = phases.find(p => p.id === phaseId);
        const tier = tiers.find(t => t.id === sel.tierId);
        return `- ${phase?.title}: ${tier?.tier_type} Plan (${sel.quantity} ${tier?.unit_name})`;
      }).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the following project scope selections, write a professional 2-paragraph executive summary for a digital agency proposal. 
        Total Estimated Cost: DZD${totalCost.toLocaleString()}.
        Selected Services:
        ${selectedDetails}
        
        Keep it persuasive, highlighting the value of the selected tiers.`,
      });

      setAiProposal(response.text || "Unable to generate proposal at this time.");
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Initializing your estimator...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12 flex flex-col lg:flex-row gap-8">
      {/* Selection Area */}
      <div className="flex-grow space-y-8">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-4 no-scrollbar">
          {categories.map(cat => {
            const IconComponent = (LucideIcons as any)[cat.icon] || LucideIcons.Layers;
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all whitespace-nowrap shadow-sm border ${
                  isActive 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                <IconComponent size={20} />
                <span className="font-semibold">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Phases for Current Category */}
        <div className="space-y-12">
          {currentCategoryPhases.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <PackageCheck className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 font-medium">No phases added to this category yet.</p>
            </div>
          ) : (
            currentCategoryPhases.map(phase => (
              <section key={phase.id} className="animate-in fade-in duration-500">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{phase.title}</h2>
                  <p className="text-gray-500 mt-1">{phase.description}</p>
                  {phase.objective && (
                    <div className="flex items-start gap-2 mt-3 bg-indigo-50 p-3 rounded-lg text-indigo-700 text-sm">
                      <Info size={18} className="shrink-0 mt-0.5" />
                      <span><strong>Objective:</strong> {phase.objective}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiers
                    .filter(t => t.phase_id === phase.id)
                    .map(tier => {
                      const isSelected = selections[phase.id]?.tierId === tier.id;
                      const tierFeatures = features.filter(f => f.tier_id === tier.id);
                      
                      return (
                        <div 
                          key={tier.id}
                          onClick={() => handleTierSelect(phase.id, tier.id)}
                          className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-indigo-50 border-indigo-600 shadow-lg' 
                              : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {tier.tier_type}
                              </span>
                              <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900">DZD{tier.price.toLocaleString()}</span>
                                <span className="text-gray-500 text-sm">/ {tier.unit_name}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="bg-indigo-600 text-white p-1 rounded-full">
                                <Check size={16} />
                              </div>
                            )}
                          </div>

                          <ul className="space-y-2 mb-6 flex-grow">
                            {tierFeatures.map(f => (
                              <li key={f.id} className="flex items-start gap-2 text-sm text-gray-600 leading-tight">
                                <Check size={14} className="text-indigo-500 shrink-0 mt-1" />
                                <span>{f.feature_text}</span>
                              </li>
                            ))}
                          </ul>

                          {tier.is_variable_quantity && isSelected && (
                            <div className="mt-auto pt-4 border-t border-indigo-100">
                              <label className="block text-xs font-semibold text-indigo-700 uppercase mb-2">
                                Quantity ({tier.unit_name})
                              </label>
                              <input 
                                type="number"
                                min={tier.min_quantity || 1}
                                value={selections[phase.id].quantity}
                                onChange={(e) => handleQuantityChange(phase.id, parseInt(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* Sticky Summary Sidebar */}
      <aside className="w-full lg:w-[400px] shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="bg-gray-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCard size={120} />
            </div>
            
            <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-6">Investment Summary</h3>
            
            <div className="space-y-4 mb-8">
              {Object.entries(selections).length === 0 ? (
                <p className="text-gray-400 text-sm italic">Start selecting services to build your project estimate.</p>
              ) : (
                // Explicitly casting Object.entries to fix 'unknown' property access errors
                (Object.entries(selections) as [string, Selection][]).map(([phaseId, sel]) => {
                  const phase = phases.find(p => p.id === phaseId);
                  const tier = tiers.find(t => t.id === sel.tierId);
                  const lineTotal = tier ? tier.price * (tier.is_variable_quantity ? sel.quantity : 1) : 0;
                  return (
                    <div key={phaseId} className="flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <p className="font-semibold text-sm leading-tight">{phase?.title}</p>
                        <p className="text-xs text-gray-400">
                          {tier?.tier_type} ({sel.quantity} {tier?.unit_name})
                        </p>
                      </div>
                      <span className="font-mono text-sm">DZD{lineTotal.toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-800 pt-6 mt-6">
              <div className="flex justify-between items-center mb-8">
                <span className="text-gray-400 font-medium">Total Estimate</span>
                <span className="text-4xl font-bold text-white">DZD{totalCost.toLocaleString()}</span>
              </div>

              <button 
                onClick={generateAIProposal}
                disabled={aiGenerating || Object.keys(selections).length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/20"
              >
                {aiGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Generate AI Proposal
              </button>
            </div>
          </div>

          {aiProposal && (
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Sparkles size={18} />
                </div>
                <h4 className="font-bold text-gray-900">Project Strategy</h4>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {aiProposal}
              </p>
              <button className="mt-6 w-full flex items-center justify-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                Download Proposal (PDF) <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Estimator;
