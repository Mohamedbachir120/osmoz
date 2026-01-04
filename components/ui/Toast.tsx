import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { createRoot } from "react-dom/client";

// --- THE TOAST COMPONENT ---
const ToastContainer = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    setTimeout(() => setVisible(true), 10);
    // Slide out
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for animation to finish before unmounting
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border transition-all duration-300 transform ${
      visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
    } ${
      type === 'success' ? "bg-white border-green-100 text-gray-800" : "bg-red-50 border-red-100 text-red-900"
    }`}>
      <div className={`p-2 rounded-full ${type === 'success' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
        {type === 'success' ? <CheckCircle2 size={20} strokeWidth={3} /> : <XCircle size={20} strokeWidth={3} />}
      </div>
      <div>
        <h4 className="font-bold text-sm">{type === 'success' ? "Success" : "Error"}</h4>
        <p className="text-xs text-gray-500 font-medium">{message}</p>
      </div>
      <button onClick={() => setVisible(false)} className="ml-4 text-gray-400 hover:text-gray-600"><X size={16} /></button>
    </div>
  );
};

// --- THE UTILITY FUNCTION ---
export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);

  const handleClose = () => {
    root.unmount();
    if (document.body.contains(div)) {
      document.body.removeChild(div);
    }
  };

  root.render(<ToastContainer message={message} type={type} onClose={handleClose} />);
};