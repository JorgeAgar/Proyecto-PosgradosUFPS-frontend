const DELAYS = ["delay-100", "delay-200", "delay-300", "delay-400"];

export type Estadistica = {
  etiqueta: string;
  valor: React.ReactNode;
  /** Clase de color del valor (p. ej. "text-amber-500"). */
  color?: string;
};

/** Fila de tarjetas con indicadores numéricos (total, pendientes, completados…). */
export function TarjetasEstadisticas({ items }: { items: Estadistica[] }) {
  const columnas = items.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 mb-4 ${columnas}`}>
      {items.map((item, idx) => (
        <div
          key={item.etiqueta}
          className={`bg-white border border-gray-200 rounded-lg p-4 animate-fade-in-up ${DELAYS[Math.min(idx, DELAYS.length - 1)]}`}
        >
          <div className="text-xs text-neutral-400 mb-1">{item.etiqueta}</div>
          <div className={`text-2xl font-semibold ${item.color ?? "text-gray-900"}`}>{item.valor}</div>
        </div>
      ))}
    </div>
  );
}

function porcentaje(actual: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0;
}

/** Barra fina de progreso roja. */
export function BarraProgreso({ actual, total }: { actual: number; total: number }) {
  return (
    <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 bg-red-700 rounded-full transition-all duration-500"
        style={{ width: `${porcentaje(actual, total)}%` }}
      />
    </div>
  );
}

interface TarjetaProgresoProps {
  /** Texto antes del conteo, p. ej. "Validados". */
  etiqueta: string;
  actual: number;
  total: number;
}

/** Tarjeta con porcentaje, barra de progreso y "Etiqueta: X de Y". No se renderiza si total es 0. */
export function TarjetaProgreso({ etiqueta, actual, total }: TarjetaProgresoProps) {
  if (total <= 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-up delay-300">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-red-700 whitespace-nowrap">{porcentaje(actual, total)}%</span>
        <div className="flex-1">
          <BarraProgreso actual={actual} total={total} />
        </div>
      </div>
      <div className="text-xs text-neutral-400 mt-2">
        <span>{etiqueta}: </span>
        <span className="font-semibold text-red-700">{actual}</span>
        <span> de </span>
        <span className="font-semibold text-gray-800">{total}</span>
      </div>
    </div>
  );
}
