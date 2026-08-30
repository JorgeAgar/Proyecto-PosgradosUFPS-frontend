import { useState, useEffect } from "react";
import { CheckCircleIcon } from "../assets/icons";

interface ConfirmProps {
  isOpen: boolean;
  mensaje: string;
  onClose: () => void;
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className ?? "w-4 h-4"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export default function Confirm({ isOpen, mensaje, onClose }: ConfirmProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const id = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 250);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-full max-w-md px-4 pointer-events-none">
      <div
        className={`${closing ? "animate-alert-out" : "animate-alert-in"} bg-green-50 border border-green-200 text-green-800 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto`}
      >
        <CheckCircleIcon className="w-5 h-5 shrink-0 text-green-600" />
        <p className="flex-1 text-sm font-medium">{mensaje}</p>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="shrink-0 p-0.5 rounded transition-colors text-green-400 hover:text-green-700"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
