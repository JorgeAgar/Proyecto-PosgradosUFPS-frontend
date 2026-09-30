import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams, useOutletContext } from "react-router";
import {
  getAspirantes,
  getCountPorCalificar,
  getCountCalificados,
  type AspiranteCalificacion,
} from "../../../services/programa/programaCalificacionCohorteService";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { Badge, type BadgeColor } from "../../../components/Badge";
import BuscadorConFiltro from "../../../components/BuscadorConFiltro";
import Cargando from "../../../components/Cargando";
import EncabezadoVolver from "../../../components/EncabezadoVolver";
import { TarjetasEstadisticas, TarjetaProgreso } from "../../../components/Estadisticas";
import Paginacion from "../../../components/Paginacion";
import Tabla from "../../../components/Tabla";

const POR_PAGINA = 10;

// ── Tipos ─────────────────────────────────────────────────────────────────────

type EstadoCalificacion = "por calificar" | "en progreso" | "calificado";

interface Aspirante {
  id: string;
  nombre: string;
  estado: EstadoCalificacion;
  correo: string;
  numerodocumento: number;
  puntaje: number | null;
}

const ESTADOS: Record<EstadoCalificacion, { label: string; color: BadgeColor }> = {
  "por calificar": { label: "Por calificar", color: "gris" },
  "en progreso":   { label: "En progreso",   color: "amarillo" },
  "calificado":    { label: "Calificado",    color: "verde" },
};

// ── Helpers de mapeo ──────────────────────────────────────────────────────────

function mapEstado(estado: string): EstadoCalificacion {
  const m: Record<string, EstadoCalificacion> = {
    "VALIDADO_CALIFICADO":    "calificado",
    "VALIDADO_EN_PROGRESO":   "en progreso",
    "VALIDADO_POR_CALIFICAR": "por calificar",
  };
  return m[estado] ?? "por calificar";
}

function mapAspirante(a: AspiranteCalificacion): Aspirante {
  const estado = mapEstado(a.estado);
  return {
    id: String(a.id),
    nombre: a.nombreCompleto,
    estado,
    correo: a.correo,
    numerodocumento: a.numerodocumento,
    puntaje: (estado === "calificado" || a.puntajeTotal > 0) ? a.puntajeTotal : null,
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CalificacionCohorte() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cohorteId } = useParams<{ cohorteId: string }>();
  const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();

  const idCohorte = Number(cohorteId);
  const estadoRuta = location.state as { nombreCohorte?: string; activa?: boolean } | null;
  const nombreCohorte = estadoRuta?.nombreCohorte;

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoCalificacion>("todos");
  const [pagina, setPagina] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [aspirantes, setAspirantes] = useState<Aspirante[]>([]);
  const [countPorCalificar, setCountPorCalificar] = useState(0);
  const [countCalificados, setCountCalificados] = useState(0);


  useEffect(() => {
    if (!idCohorte) {
      mostrarAlerta("No se encontró el identificador de la cohorte.", "error");
      return;
    }
    const cargar = async () => {
      setCargando(true);
      try {
        const [datos, porCalificar, calificados] = await Promise.all([
          getAspirantes(idCohorte),
          getCountPorCalificar(idCohorte),
          getCountCalificados(idCohorte),
        ]);
        setAspirantes((datos ?? []).map(mapAspirante));
        setCountPorCalificar(porCalificar ?? 0);
        setCountCalificados(calificados ?? 0);
      } catch (err) {
        mostrarAlerta(err instanceof Error ? err.message : "Error al cargar los aspirantes. Intenta de nuevo.", "error");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCohorte]);

  const totalEnCalificacion = aspirantes.length;

  const aspirantesFiltrados = aspirantes.filter(a => {
    const termino = searchTerm.toLowerCase();
    const coincideBusqueda = a.nombre.toLowerCase().includes(termino) || a.correo.toLowerCase().includes(termino);
    return coincideBusqueda && (filtroEstado === "todos" || a.estado === filtroEstado);
  });
  const aspirantesPagina = aspirantesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const handleSeleccionarAspirante = (aspirante: Aspirante) => {
    navigate(`/programa/admision/calificacion/${aspirante.id}`, {
      state: { nombre: aspirante.nombre, correo: aspirante.correo, documento: aspirante.numerodocumento, cohorteId: idCohorte, nombreCohorte },
    });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
      <EncabezadoVolver
        titulo="Calificación de Aspirantes"
        onVolver={() => navigate("/programa/admision/calificacion")}
        nombreCohorte={nombreCohorte}
        activa={estadoRuta?.activa ?? false}
      />

      {cargando ? (
        <Cargando texto="Cargando aspirantes..." />
      ) : (
        <>
          <TarjetasEstadisticas
            items={[
              { etiqueta: "Total en calificación", valor: totalEnCalificacion },
              { etiqueta: "Por calificar", valor: countPorCalificar, color: "text-amber-400" },
              { etiqueta: "Calificados", valor: countCalificados, color: "text-green-700" },
            ]}
          />

          <TarjetaProgreso etiqueta="Calificados" actual={countCalificados} total={totalEnCalificacion} />

          <BuscadorConFiltro
            busqueda={searchTerm}
            onBusqueda={(v) => { setSearchTerm(v); setPagina(1); }}
            placeholder="Buscar aspirante por nombre o correo..."
            tituloFiltro="Estado"
            filtro={filtroEstado}
            onFiltro={(v) => { setFiltroEstado(v); setPagina(1); }}
            opciones={[
              { value: "todos", label: "Todos" },
              ...(Object.keys(ESTADOS) as EstadoCalificacion[]).map((e) => ({ value: e, label: ESTADOS[e].label })),
            ]}
          />

          <Tabla
            columnas={["Nombre", "Documento", "Estado", "Correo", "Puntaje"]}
            vacia={aspirantesPagina.length === 0}
            mensajeVacio="No se encontraron aspirantes."
            pie={<Paginacion pagina={pagina} porPagina={POR_PAGINA} totalElementos={aspirantesFiltrados.length} onCambiar={setPagina} />}
          >
            {aspirantesPagina.map(aspirante => (
              <tr
                key={aspirante.id}
                onClick={() => handleSeleccionarAspirante(aspirante)}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{aspirante.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{aspirante.numerodocumento}</td>
                <td className="px-6 py-4 text-sm">
                  <Badge color={ESTADOS[aspirante.estado].color}>{ESTADOS[aspirante.estado].label}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{aspirante.correo}</td>
                <td className="px-6 py-4 text-sm">
                  {aspirante.puntaje !== null ? (
                    <span className="font-semibold text-red-700">{aspirante.puntaje.toFixed(1)}</span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </Tabla>
        </>
      )}
    </div>
  );
}
