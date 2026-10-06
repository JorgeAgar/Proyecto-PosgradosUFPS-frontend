import { ChevronLeftIcon, ChevronRightIcon } from "../assets/icons";

interface PaginacionProps {
  pagina: number;
  porPagina: number;
  totalElementos: number;
  onCambiar: (pagina: number) => void;
  /** Sustantivo plural mostrado en el resumen ("1–10 de 25 aspirantes"). */
  etiqueta?: string;
}

const BOTON =
  "flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700";

/** Pie de tabla con "Anterior / Siguiente". No se renderiza si solo hay una página. */
export default function Paginacion({ pagina, porPagina, totalElementos, onCambiar, etiqueta = "aspirantes" }: PaginacionProps) {
  const totalPaginas = Math.ceil(totalElementos / porPagina);
  if (totalPaginas <= 1) return null;

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
      <span className="text-xs text-neutral-400">
        {(pagina - 1) * porPagina + 1}–{Math.min(pagina * porPagina, totalElementos)} de {totalElementos} {etiqueta}
      </span>
      <div className="flex items-center gap-2">
        <button onClick={() => onCambiar(pagina - 1)} disabled={pagina === 1} className={BOTON}>
          <ChevronLeftIcon className="h-4 w-4" />
          Anterior
        </button>
        <span className="text-sm font-medium text-gray-600 px-1">{pagina} / {totalPaginas}</span>
        <button onClick={() => onCambiar(pagina + 1)} disabled={pagina === totalPaginas} className={BOTON}>
          Siguiente
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
