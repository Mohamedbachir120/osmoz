import React, { useState, useEffect, useRef,useMemo } from 'react';
import {
  Check,
  Info,
  CreditCard,
  FileDown,
  Loader2,
  PackageCheck,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ServiceCategory, Phase, PricingTier, Feature, SelectionMap, Selection } from '../types';
import * as LucideIcons from 'lucide-react';
import { RowInput } from 'jspdf-autotable'
// Import jsPDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Estimator: React.FC = () => {
    const summaryRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const formatPriceForPDF = (price: number) => {
    return price.toLocaleString('fr-FR').replace(/\s/g, ' ');
  };
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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryPhases = useMemo(() => {
    return phases.filter(p => p.category_id === activeCategoryId);
  }, [phases, activeCategoryId]);

  const totalCost = useMemo(() => {
    return (Object.values(selections) as Selection[]).reduce((sum, sel) => {
      const tier = tiers.find(t => t.id === sel.tierId);
      if (!tier) return sum;
      return sum + (tier.price * (tier.is_variable_quantity ? sel.quantity : 1));
    }, 0);
  }, [selections, tiers]);

  const handleTierSelect = (phaseId: string, tierId: string) => {
    const tier = tiers.find(t => t.id === tierId);
    setSelections(prev => {
      // Toggle logic: if clicking the same tier, deselect it
      if (prev[phaseId]?.tierId === tierId) {
        const newSelections = { ...prev };
        delete newSelections[phaseId];
        return newSelections;
      }
      return {
        ...prev,
        [phaseId]: {
          tierId,
          quantity: tier?.min_quantity || 1
        }
      };
    });
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

  // --- ENHANCED PDF GENERATION ---
  const generatePDF = () => {
    if (Object.keys(selections).length === 0) return;
    setIsGeneratingPdf(true);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // FIX 1: Explicitly type the color tuple
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo 600

    // -- Header Section --
    // Background Strip
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo Placeholder (White Circle + Text)
    doc.setFillColor(255, 255, 255);
    doc.circle(25, 20, 12, 'F');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("OZ", 21, 22);

    // Agency Name & Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Osmoz Digital", 45, 18);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Estimation de Projet", 45, 26);

    // Date & Ref (Top Right)
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, 15, { align: 'right' });
    doc.text(`Ref: EST-${Math.floor(Math.random() * 10000)}`, pageWidth - 15, 22, { align: 'right' });

    // -- Info Section --
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Émetteur:", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text("Osmoz Digital Agency", 14, 61);
    doc.text("contact@osmoz-digital.com", 14, 66);
    doc.text("Alger, Algérie", 14, 71);

    doc.setFont("helvetica", "bold");
    doc.text("Pour le compte de:", pageWidth - 80, 55);
    doc.setFont("helvetica", "normal");
    doc.text("[Nom du Client]", pageWidth - 80, 61);
    doc.text("Projet Digital", pageWidth - 80, 66);

    // -- Table Data Preparation --
    // FIX 2: Explicitly type tableRows as RowInput[] and use 'as const' for styles
    const tableRows: RowInput[] = (Object.entries(selections) as [string, Selection][]).map(([phaseId, sel]) => {
      const phase = phases.find(p => p.id === phaseId);
      const tier = tiers.find(t => t.id === sel.tierId);

      const tierFeatures = features
        .filter(f => f.tier_id === tier?.id)
        .map(f => `• ${f.feature_text}`)
        .join('\n');

      const quantityText = tier?.is_variable_quantity
        ? `${sel.quantity} ${tier.unit_name}`
        : `Forfait`;

      const total = tier ? tier.price * (tier.is_variable_quantity ? sel.quantity : 1) : 0;

      return [
        {
          content: phase?.title || 'Service',
          styles: { fontStyle: 'bold' as const } // Fixed
        },
        `${tier?.tier_type || 'Standard'}\n\n${tierFeatures}`,
        quantityText,
        {
          content: `${total.toLocaleString('fr-FR').replace(/\s/g, ' ')} DZD`,
          styles: { halign: 'right' as const, fontStyle: 'bold' as const } // Fixed
        }
      ];
    });

    // -- Table Generation --
    autoTable(doc, {
      startY: 85,
      head: [['Description du Service', 'Détails & Inclus', 'Qté / Type', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor, // This now matches the expected Tuple type
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 6
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35 }
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        valign: 'middle',
        overflow: 'linebreak',
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      }
    });

    // -- Total & Summary --
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // Total Box
    doc.setFillColor(243, 244, 246);
    doc.rect(pageWidth - 85, finalY - 5, 71, 25, 'F');

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text("Total Estimé:", pageWidth - 80, finalY + 5);

    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`${totalCost.toLocaleString('fr-FR').replace(/\s/g, ' ')} DZD`, pageWidth - 20, finalY + 12, { align: 'right' });
    // -- Footer --
    const footerY = pageHeight - 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setFont("helvetica", "italic");
    const disclaimer = "Ce document est une estimation indicative basée sur les paramètres sélectionnés. Le montant final peut varier selon les spécifications techniques détaillées.";

    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - 30);
    doc.text(splitDisclaimer, 14, footerY);

    doc.setFont("helvetica", "normal");
    doc.text("Osmoz Digital Agency - Devis généré automatiquement", 14, footerY + 10);

    // Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }

    doc.save(`Estimation_Osmoz_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsGeneratingPdf(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
          <Loader2 className="relative animate-spin text-indigo-600" size={48} />
        </div>
        <p className="mt-6 text-gray-500 font-medium tracking-wide animate-pulse">Chargement de l'estimateur...</p>
      </div>
    );
  }

 const scrollToSummary = () => {
    summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32"> {/* Added pb-32 to prevent content being hidden behind sticky footer */}
      
      {/* Top Banner Area */}
      <div className="bg-indigo-900 text-white py-12 px-6 lg:px-24 shadow-lg mb-8">
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">Estimateur de Projet</h1>
        <p className="text-indigo-200 max-w-2xl">
          Sélectionnez les services et fonctionnalités souhaités pour obtenir une estimation immédiate de votre investissement digital.
        </p>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Categories Navigation (Pills) */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 sticky top-4 z-30 overflow-x-auto no-scrollbar flex gap-2 mb-10">
          {categories.map(cat => {
            const IconComponent = (LucideIcons as any)[cat.icon] || Layers;
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg transition-all whitespace-nowrap text-sm font-medium ${isActive
                  ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
              >
                <IconComponent size={18} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="space-y-16">
          {currentCategoryPhases.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <PackageCheck className="mx-auto text-indigo-100 mb-6" size={80} />
              <p className="text-gray-500 font-medium text-lg">Aucun service disponible pour cette catégorie.</p>
            </div>
          ) : (
            currentCategoryPhases.map(phase => (
              <section key={phase.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-28">
                <div className="mb-6 border-l-4 border-indigo-500 pl-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {phase.title}
                  </h2>
                  <p className="text-gray-500 mt-1 text-sm lg:text-base">{phase.description}</p>

                  {phase.objective && (
                    <div className="inline-flex items-center gap-2 mt-3 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                      <Sparkles size={14} />
                      <span>Objectif : {phase.objective}</span>
                    </div>
                  )}
                </div>

                {/* Grid Layout for Cards - Adjusted grid for better responsiveness */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tiers
                    .filter(t => t.phase_id === phase.id)
                    .map(tier => {
                      const isSelected = selections[phase.id]?.tierId === tier.id;
                      const tierFeatures = features.filter(f => f.tier_id === tier.id);

                      return (
                        <div
                          key={tier.id}
                          onClick={() => handleTierSelect(phase.id, tier.id)}
                          className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${isSelected
                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-600 ring-offset-2 shadow-xl scale-[1.01]'
                            : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1'
                            }`}
                        >
                          {/* Background Accent for Selection */}
                          {isSelected && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0 transition-all"></div>
                          )}

                          <div className="relative z-10 flex justify-between items-start mb-4">
                            <div>
                              <span className={`inline-block text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded-md mb-2 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {tier.tier_type}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-bold ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                                  {tier.price.toLocaleString('fr-FR')}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">DZD</span>
                              </div>
                              <span className="text-xs text-gray-400">/ {tier.unit_name}</span>
                            </div>

                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-300 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                              }`}>
                              <Check size={18} strokeWidth={3} />
                            </div>
                          </div>

                          <div className="relative z-10 flex-grow">
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>
                            <ul className="space-y-3">
                              {tierFeatures.map(f => (
                                <li key={f.id} className="flex items-start gap-3 text-sm text-gray-600 group-hover:text-gray-900">
                                  <div className="mt-1 min-w-[16px]">
                                    <Check size={16} className="text-indigo-500" />
                                  </div>
                                  <span className="leading-snug">{f.feature_text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* 
                              FIX: Quantity Selector Overflow 
                              1. Reduced negative margins slightly
                              2. Added min-w-0 to flex container
                              3. Added shrink-0 to buttons
                          */}
                          {tier.is_variable_quantity && isSelected && (
                            <div className="relative z-10 mt-6 pt-4 border-t border-dashed border-indigo-200 bg-indigo-50/50 -mx-6 -mb-6 px-4 pb-4">
                              <label className="flex items-center justify-between text-xs font-bold text-indigo-800 uppercase mb-2">
                                <span>Quantité</span>
                                <span className="bg-white px-2 py-0.5 rounded text-indigo-600 shadow-sm border border-indigo-100 text-[10px]">{tier.unit_name}</span>
                              </label>
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  className="shrink-0 w-8 h-8 rounded-lg bg-white border border-indigo-200 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors font-bold"
                                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(phase.id, selections[phase.id].quantity - 1); }}
                                >-</button>
                                <input
                                  type="number"
                                  min={tier.min_quantity || 1}
                                  value={selections[phase.id].quantity}
                                  onChange={(e) => handleQuantityChange(phase.id, parseInt(e.target.value))}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 min-w-0 bg-white border border-indigo-200 rounded-lg h-8 text-center text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                  className="shrink-0 w-8 h-8 rounded-lg bg-white border border-indigo-200 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors font-bold"
                                  onClick={(e) => { e.stopPropagation(); handleQuantityChange(phase.id, selections[phase.id].quantity + 1); }}
                                >+</button>
                              </div>
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

        {/* BOTTOM SECTION: Detailed Summary */}
        <div ref={summaryRef} className="mt-24 mb-12">
           <div className="bg-gray-900 text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
              {/* Abstract decorative circles */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-2xl"></div>

              <div className="relative z-10 grid lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <CreditCard className="text-indigo-400" />
                    Détail du Devis
                  </h3>
                  <div className="space-y-4 bg-white/5 rounded-xl p-6 border border-white/10">
                    {Object.entries(selections).length === 0 ? (
                      <div className="text-center text-gray-400 italic py-4">
                        Sélectionnez des services ci-dessus pour générer le détail.
                      </div>
                    ) : (
                      (Object.entries(selections) as [string, any][]).map(([phaseId, sel]) => {
                        const phase = phases.find(p => p.id === phaseId);
                        const tier = tiers.find(t => t.id === sel.tierId);
                        const lineTotal = tier ? tier.price * (tier.is_variable_quantity ? sel.quantity : 1) : 0;
                        return (
                          <div key={phaseId} className="flex justify-between items-center border-b border-gray-700/50 pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="font-semibold text-gray-200">{phase?.title}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span className="text-indigo-300">{tier?.tier_type}</span>
                                {tier?.is_variable_quantity && <span>x {sel.quantity}</span>}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-indigo-300">
                              {lineTotal.toLocaleString('fr-FR')} DZD
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="text-right mb-8">
                    <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Estimé (HT)</span>
                    <div className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight mt-2">
                      {totalCost.toLocaleString('fr-FR')} <span className="text-2xl text-indigo-400">DZD</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={generatePDF}
                      disabled={isGeneratingPdf || Object.keys(selections).length === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-5 px-8 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                    >
                      {isGeneratingPdf ? <Loader2 className="animate-spin" size={24} /> : <FileDown size={24} />}
                      <span className="text-lg">Télécharger le Devis PDF</span>
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      Document non contractuel. Prix soumis à validation finale.
                    </p>
                  </div>
                </div>
              </div>
           </div>
        </div>

      </div>

      {/* STICKY BOTTOM BAR (New Feature) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 px-4 py-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase font-bold">Total Actuel</span>
            <div className="text-2xl font-extrabold text-indigo-900">
              {totalCost.toLocaleString('fr-FR')} <span className="text-sm font-medium text-gray-500">DZD</span>
            </div>
          </div>
          
          <button 
            onClick={scrollToSummary}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-semibold shadow-md"
          >
            <span>Voir Détails</span>
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default Estimator;