import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = "Delete",
  isProcessing,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!isProcessing ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>
          
          <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">{description}</p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={18} /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};