import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams, useLocation } from "react-router";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import {
	obtenerAspirantesPorCohorte,
	type AspiranteValidacionApi,
} from "../../../services/programa/validacionCohorteService";
import { Badge, type BadgeColor } from "../../../components/Badge";
import BuscadorConFiltro from "../../../components/BuscadorConFiltro";
import Cargando from "../../../components/Cargando";
import EncabezadoVolver from "../../../components/EncabezadoVolver";
import { TarjetasEstadisticas, TarjetaProgreso } from "../../../components/Estadisticas";
import Paginacion from "../../../components/Paginacion";
import Tabla from "../../../components/Tabla";

const POR_PAGINA = 10;

// ── Estado de documentos ──────────────────────────────────────────────────────

type EstadoDoc = "pendiente" | "en-progreso" | "validado";

const ESTADOS: Record<EstadoDoc, { label: string; color: BadgeColor }> = {
	"pendiente":   { label: "Pendiente",   color: "gris" },
	"en-progreso": { label: "En progreso", color: "amarillo" },
	"validado":    { label: "Validado",    color: "verde" },
};

function resolverEstadoDoc({ totalDocumentos, documentosValidados }: AspiranteValidacionApi): EstadoDoc {
	if (totalDocumentos === 0) return "pendiente";
	if (documentosValidados === totalDocumentos) return "validado";
	return "en-progreso";
}

export default function ValidacionCohorteDetalle() {
	const navigate = useNavigate();
	const location = useLocation();
	const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();
	const { cohorteId } = useParams();
	const cohorteIdNumerico = cohorteId ? Number(cohorteId) : undefined;

	const estadoRuta = location.state as { nombreCohorte?: string; activa?: boolean } | null;
	const nombreCohorte = estadoRuta?.nombreCohorte;
	const activa = estadoRuta?.activa ?? false;

	const [aspirantes, setAspirantes] = useState<AspiranteValidacionApi[]>([]);
	const [cargando, setCargando] = useState(true);
	const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoDoc>("todos");
	const [searchTerm, setSearchTerm] = useState("");
	const [pagina, setPagina] = useState(1);


	useEffect(() => {
		if (!cohorteIdNumerico || Number.isNaN(cohorteIdNumerico)) {
			mostrarAlerta("La cohorte solicitada no es válida.", "error");
			navigate("/programa/validacion");
			return;
		}
		const cargar = async () => {
			setCargando(true);
			try {
				setAspirantes(await obtenerAspirantesPorCohorte(cohorteIdNumerico));
			} catch (err) {
				mostrarAlerta(err instanceof Error ? err.message : "No se pudieron cargar los aspirantes de la cohorte.", "error");
			} finally {
				setCargando(false);
			}
		};
		cargar();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cohorteIdNumerico]);

	const contar = (e: EstadoDoc) => aspirantes.filter((a) => resolverEstadoDoc(a) === e).length;
	const validados = contar("validado");

	const aspirantesFiltrados = aspirantes.filter((aspirante) =>
		(filtroEstado === "todos" || resolverEstadoDoc(aspirante) === filtroEstado) &&
		aspirante.nombre.toLowerCase().includes(searchTerm.toLowerCase())
	);
	const aspirantesPagina = aspirantesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

	return (
		<div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
			<EncabezadoVolver
				titulo="Validación de Documentos"
				onVolver={() => navigate("/programa/validacion")}
				nombreCohorte={nombreCohorte}
				activa={activa}
			/>

			{cargando ? (
				<Cargando texto="Cargando aspirantes..." />
			) : (
				<>
					<TarjetasEstadisticas
						items={[
							{ etiqueta: "Total en validación", valor: aspirantes.length },
							{ etiqueta: "Pendientes", valor: contar("pendiente"), color: "text-neutral-500" },
							{ etiqueta: "En progreso", valor: contar("en-progreso"), color: "text-amber-500" },
							{ etiqueta: "Validados", valor: validados, color: "text-green-600" },
						]}
					/>

					<TarjetaProgreso etiqueta="Validados" actual={validados} total={aspirantes.length} />

					<BuscadorConFiltro
						busqueda={searchTerm}
						onBusqueda={(v) => { setSearchTerm(v); setPagina(1); }}
						tituloFiltro="Estado de documentos"
						filtro={filtroEstado}
						onFiltro={(v) => { setFiltroEstado(v); setPagina(1); }}
						opciones={[
							{ value: "todos", label: "Todos" },
							...(Object.keys(ESTADOS) as EstadoDoc[]).map((e) => ({ value: e, label: ESTADOS[e].label })),
						]}
					/>

					<Tabla
						columnas={["Nombre", "Cédula", "Correo", "Estado"]}
						vacia={aspirantesFiltrados.length === 0}
						pie={<Paginacion pagina={pagina} porPagina={POR_PAGINA} totalElementos={aspirantesFiltrados.length} onCambiar={setPagina} />}
					>
						{aspirantesPagina.map((aspirante) => {
							const estado = ESTADOS[resolverEstadoDoc(aspirante)];
							return (
								<tr
									key={aspirante.id}
									onClick={() => navigate(`/programa/validacion/aspirantes/${cohorteId}/${aspirante.id}`, { state: { nombreCohorte, activa } })}
									className="hover:bg-gray-50 transition-colors cursor-pointer"
								>
									<td className="px-6 py-4 text-sm text-gray-900">{aspirante.nombre}</td>
									<td className="px-6 py-4 text-sm text-gray-600">{aspirante.cedula}</td>
									<td className="px-6 py-4 text-sm text-gray-600">{aspirante.correo}</td>
									<td className="px-6 py-4 text-sm">
										<Badge color={estado.color}>{estado.label}</Badge>
									</td>
								</tr>
							);
						})}
					</Tabla>
				</>
			)}
		</div>
	);
}
