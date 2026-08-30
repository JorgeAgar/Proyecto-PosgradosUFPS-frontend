import { useState, useEffect } from "react";
import { CheckCircleIcon } from "../assets/icons";

export type TipoAlerta = "error" | "exito" | "advertencia";

interface AlertaProps {
  isOpen: boolean;
  mensaje: string;
  tipo?: TipoAlerta;
  onClose: () => void;
}

function ExclamationCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className ?? "w-5 h-5"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className ?? "w-4 h-4"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

const ESTILOS: Record<TipoAlerta, { contenedor: string; colorIcono: string; colorBoton: string }> = {
  error: {
    contenedor: "bg-red-50 border border-red-200 text-red-800",
    colorIcono: "text-red-600",
    colorBoton: "text-red-400 hover:text-red-700",
  },
  exito: {
    contenedor: "bg-green-50 border border-green-200 text-green-800",
    colorIcono: "text-green-600",
    colorBoton: "text-green-400 hover:text-green-700",
  },
  advertencia: {
    contenedor: "bg-amber-50 border border-amber-200 text-amber-800",
    colorIcono: "text-amber-600",
    colorBoton: "text-amber-400 hover:text-amber-700",
  },
};

export default function Alerta({ isOpen, mensaje, tipo = "error", onClose }: AlertaProps) {
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
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!visible) return null;

  const { contenedor, colorIcono, colorBoton } = ESTILOS[tipo];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4 pointer-events-none">
      <div
        className={`${closing ? "animate-alert-out" : "animate-alert-in"} ${contenedor} rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto`}
      >
        {tipo === "exito" ? (
          <CheckCircleIcon className={`w-5 h-5 shrink-0 ${colorIcono}`} />
        ) : (
          <ExclamationCircleIcon className={`w-5 h-5 shrink-0 ${colorIcono}`} />
        )}
        <p className="flex-1 text-sm font-medium">{mensaje}</p>
        <button
          onClick={onClose}
          aria-label="Cerrar alerta"
          className={`shrink-0 p-0.5 rounded transition-colors ${colorBoton}`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
