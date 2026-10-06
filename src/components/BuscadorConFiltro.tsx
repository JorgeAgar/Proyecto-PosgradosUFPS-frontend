import { useState } from "react";
import { FunnelIcon, SearchIcon } from "../assets/icons";

export type OpcionFiltro<T extends string> = { value: T; label: string };

interface BuscadorConFiltroProps<T extends string> {
  busqueda: string;
  onBusqueda: (valor: string) => void;
  placeholder?: string;
  /** Título de la sección del desplegable (p. ej. "Estado"). */
  tituloFiltro: string;
  opciones: OpcionFiltro<T>[];
  filtro: T;
  onFiltro: (valor: T) => void;
}

/** Campo de búsqueda con botón "Filtrar" y menú desplegable de opciones. */
export default function BuscadorConFiltro<T extends string>({
  busqueda,
  onBusqueda,
  placeholder = "Buscar aspirante por nombre...",
  tituloFiltro,
  opciones,
  filtro,
  onFiltro,
}: BuscadorConFiltroProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const cerrar = (nuevo?: T) => {
    setCerrando(true);
    setTimeout(() => {
      if (nuevo !== undefined) onFiltro(nuevo);
      setAbierto(false);
      setCerrando(false);
    }, 120);
  };

  return (
    <div className="relative z-10 flex gap-3 mb-6 animate-fade-in-up delay-400">
      <div className="flex-1 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent transition-colors"
        />
      </div>

      <div className="relative">
        <button
          onClick={() => (abierto ? cerrar() : setAbierto(true))}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 bg-white"
        >
          <FunnelIcon />
          <span className="text-sm font-medium">Filtrar</span>
        </button>

        {abierto && (
          <div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 ${cerrando ? "animate-dropdown-out" : "animate-dropdown-in"}`}>
            <div className="p-2">
              <div className="text-xs font-semibold text-neutral-400 uppercase px-3 py-2">{tituloFiltro}</div>
              {opciones.map((opcion) => (
                <button
                  key={opcion.value}
                  onClick={() => cerrar(opcion.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filtro === opcion.value
                      ? "bg-red-50 text-red-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {opcion.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
