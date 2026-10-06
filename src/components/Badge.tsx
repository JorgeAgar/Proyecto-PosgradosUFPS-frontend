export type BadgeColor = "verde" | "rojo" | "amarillo" | "gris";

const COLORES: Record<BadgeColor, string> = {
  verde:    "bg-green-100 text-green-700",
  rojo:     "bg-red-100 text-red-700",
  amarillo: "bg-yellow-100 text-yellow-700",
  gris:     "bg-neutral-200 text-neutral-600",
};

interface BadgeProps {
  color: BadgeColor;
  children: React.ReactNode;
}

/** Etiqueta de estado (Pendiente, Validado, Rechazado, …). */
export function Badge({ color, children }: BadgeProps) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${COLORES[color]}`}>
      {children}
    </span>
  );
}

/** Etiqueta "Activa" / "Inactiva" de una cohorte. */
export function BadgeActiva({ activa, compacto = false }: { activa: boolean; compacto?: boolean }) {
  const tamano = compacto ? "px-2.5 py-0.5" : "px-3 py-1";
  return activa ? (
    <span className={`bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 animate-fade-in ${tamano}`}>
      Activa
    </span>
  ) : (
    <span className={`bg-neutral-200 text-neutral-500 text-xs font-semibold rounded-lg shrink-0 ${tamano}`}>
      Inactiva
    </span>
  );
}
