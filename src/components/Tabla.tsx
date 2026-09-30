export type ColumnaTabla = string | { titulo: string; alinear?: "left" | "center" };

interface TablaProps {
  columnas: ColumnaTabla[];
  /** Si es true se muestra `mensajeVacio` en lugar de las filas. */
  vacia: boolean;
  mensajeVacio?: string;
  /** Ancho mínimo antes de hacer scroll horizontal (clase Tailwind). */
  anchoMinimo?: string;
  /** Filas `<tr>` de la tabla. */
  children: React.ReactNode;
  /** Contenido bajo la tabla, típicamente `<Paginacion />`. */
  pie?: React.ReactNode;
}

/** Contenedor de tabla con cabecera gris, estado vacío y pie opcional. */
export default function Tabla({
  columnas,
  vacia,
  mensajeVacio = "No hay aspirantes que coincidan con los filtros actuales.",
  anchoMinimo = "min-w-[640px]",
  children,
  pie,
}: TablaProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up delay-500">
      <div className="overflow-x-auto">
        <table className={`w-full ${anchoMinimo}`}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columnas.map((col) => {
                const { titulo, alinear = "left" } = typeof col === "string" ? { titulo: col } : col;
                return (
                  <th
                    key={titulo}
                    className={`${alinear === "center" ? "text-center" : "text-left"} px-6 py-4 text-sm font-semibold text-gray-600`}
                  >
                    {titulo}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vacia ? (
              <tr>
                <td colSpan={columnas.length} className="px-6 py-10 text-center text-sm text-neutral-400">
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
      {pie}
    </div>
  );
}
