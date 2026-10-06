import { SpinnerIcon } from "../assets/icons";

interface CargandoProps {
  texto?: string;
}

/** Indicador de carga centrado usado mientras se obtienen datos de una vista. */
export default function Cargando({ texto = "Cargando..." }: CargandoProps) {
  return (
    <div className="flex items-center justify-center py-20 animate-fade-in">
      <div className="flex items-center gap-3 text-neutral-400 text-sm">
        <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-red-700" />
        {texto}
      </div>
    </div>
  );
}
