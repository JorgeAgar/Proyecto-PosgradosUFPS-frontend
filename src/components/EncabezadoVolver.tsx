import { ArrowLeftIcon } from "../assets/icons";
import { BadgeActiva } from "./Badge";

interface EncabezadoVolverProps {
  titulo: string;
  onVolver: () => void;
  /** Línea gris bajo el título (se ignora si hay `nombreCohorte`). */
  subtitulo?: string;
  /** Nombre de la cohorte mostrado bajo el título. */
  nombreCohorte?: string;
  activa?: boolean;
  /** Contenido adicional bajo el título (acciones, …). */
  children?: React.ReactNode;
}

/** Encabezado de vista de detalle: flecha para volver, título y cohorte con badge "Activa". */
export default function EncabezadoVolver({ titulo, onVolver, subtitulo, nombreCohorte, activa = false, children }: EncabezadoVolverProps) {
  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver"
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-red-700 transition-colors"
        >
          <ArrowLeftIcon className="h-[18px] w-[18px] shrink-0" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
          {nombreCohorte ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-neutral-400">Cohorte: {nombreCohorte}</span>
              {activa && <BadgeActiva activa compacto />}
            </div>
          ) : (
            subtitulo && <p className="text-sm text-neutral-400 mt-0.5">{subtitulo}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
