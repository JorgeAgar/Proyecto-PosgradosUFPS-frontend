/** Piezas compartidas para mostrar entrevistas y pruebas agendadas. */

const ESTADOS_AGENDA: Record<string, { label: string; clases: string }> = {
  confirmada:            { label: "Confirmada",                clases: "bg-blue-100 text-blue-700 border border-blue-200" },
  pendiente:             { label: "Pendiente de confirmación", clases: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  "solicitud de cambio": { label: "Solicitud de cambio",       clases: "bg-amber-100 text-amber-600 border border-amber-200" },
  cancelada:             { label: "Cancelada",                 clases: "bg-red-100 text-red-700 border border-red-200" },
  completada:            { label: "Completada",                clases: "bg-green-100 text-green-700 border border-green-200" },
};

/** Estado de una entrevista o prueba. Acepta "solicitud_de_cambio" y "solicitud de cambio". */
export function EstadoAgendaBadge({ estado }: { estado: string }) {
  const config = ESTADOS_AGENDA[estado.replace(/_/g, " ")];
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${config?.clases ?? "bg-gray-100 text-gray-700"}`}>
      {config?.label ?? estado}
    </span>
  );
}

/** Motivo de un cambio o cancelación, citado bajo la tarjeta. */
export function Motivo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs font-semibold text-neutral-400 mb-1">{titulo}</div>
      <div className="text-sm text-gray-700 italic">"{texto}"</div>
    </div>
  );
}
