import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams, useLocation } from "react-router";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import {
	obtenerAspirantesPorCohorte,
	type AspiranteValidacionApi,
	type PaginaApi,
} from "../../../services/programa/validacionCohorteService";
import { obtenerCohortesPorPrograma, type CohorteValidacionApi } from "../../../services/programa/validacionService";
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

	const [resultado, setResultado] = useState<PaginaApi<AspiranteValidacionApi> | null>(null);
	const [resumen, setResumen] = useState<CohorteValidacionApi | null>(null);
	const [cargando, setCargando] = useState(true);
	const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoDoc>("todos");
	const [searchTerm, setSearchTerm] = useState("");
	const [pagina, setPagina] = useState(1);
	// El backend no busca ni filtra: al usar el buscador se trae la cohorte completa una sola vez.
	const [todos, setTodos] = useState<AspiranteValidacionApi[] | null>(null);
	const [paginaBusqueda, setPaginaBusqueda] = useState(1);

	const totalElementos = resultado?.totalElements ?? 0;
	const buscando = searchTerm.trim() !== "" || filtroEstado !== "todos";

	useEffect(() => {
		if (!cohorteIdNumerico || Number.isNaN(cohorteIdNumerico)) {
			mostrarAlerta("La cohorte solicitada no es válida.", "error");
			navigate("/programa/validacion");
			return;
		}
		let cancelado = false;
		const cargar = async () => {
			setCargando(true);
			try {
				const datos = await obtenerAspirantesPorCohorte(cohorteIdNumerico, pagina, POR_PAGINA);
				if (cancelado) return;
				// La cohorte pudo reducirse: una página que ya no existe llega vacía.
				if (datos.content.length === 0 && pagina > 1) {
					setPagina(Math.max(datos.totalPages, 1));
					return;
				}
				setResultado(datos);
			} catch (err) {
				if (cancelado) return;
				mostrarAlerta(err instanceof Error ? err.message : "No se pudieron cargar los aspirantes de la cohorte.", "error");
			} finally {
				if (!cancelado) setCargando(false);
			}
		};
		cargar();
		return () => { cancelado = true; };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cohorteIdNumerico, pagina]);

	useEffect(() => {
		if (!cohorteIdNumerico || Number.isNaN(cohorteIdNumerico)) return;
		let cancelado = false;
		obtenerCohortesPorPrograma()
			.then((cohortes) => {
				if (!cancelado) setResumen(cohortes.find((c) => c.id === cohorteIdNumerico) ?? null);
			})
			.catch((err) => {
				if (!cancelado) mostrarAlerta(err instanceof Error ? err.message : "No se pudo cargar el resumen de la cohorte.", "error");
			});
		return () => { cancelado = true; };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cohorteIdNumerico]);

	useEffect(() => {
		if (!cohorteIdNumerico || !buscando || todos || totalElementos === 0) return;
		let cancelado = false;
		obtenerAspirantesPorCohorte(cohorteIdNumerico, 1, totalElementos)
			.then((datos) => {
				if (!cancelado) setTodos(datos.content);
			})
			.catch((err) => {
				if (cancelado) return;
				mostrarAlerta(err instanceof Error ? err.message : "No se pudo buscar en la cohorte.", "error");
				setSearchTerm("");
				setFiltroEstado("todos");
			});
		return () => { cancelado = true; };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cohorteIdNumerico, buscando, todos, totalElementos]);

	const aspirantesFiltrados = (todos ?? []).filter((aspirante) =>
		(filtroEstado === "todos" || resolverEstadoDoc(aspirante) === filtroEstado) &&
		aspirante.nombre.toLowerCase().includes(searchTerm.trim().toLowerCase())
	);
	const aspirantesPagina = buscando
		? aspirantesFiltrados.slice((paginaBusqueda - 1) * POR_PAGINA, paginaBusqueda * POR_PAGINA)
		: resultado?.content ?? [];

	const porValidar = resumen?.totalPazysalvo ?? 0;
	const validados = resumen?.totalValidados ?? 0;

	return (
		<div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
			<EncabezadoVolver
				titulo="Validación de Documentos"
				onVolver={() => navigate("/programa/validacion")}
				nombreCohorte={nombreCohorte}
				activa={activa}
			/>

			{cargando && !resultado ? (
				<Cargando texto="Cargando aspirantes..." />
			) : (
				<>
					<TarjetasEstadisticas
						items={[
							{ etiqueta: "Total en validación", valor: totalElementos },
							{ etiqueta: "Por validar", valor: resumen ? porValidar : "—", color: "text-amber-500" },
							{ etiqueta: "Validados", valor: resumen ? validados : "—", color: "text-green-600" },
						]}
					/>

					<TarjetaProgreso etiqueta="Validados" actual={validados} total={porValidar + validados} />

					<BuscadorConFiltro
						busqueda={searchTerm}
						onBusqueda={(v) => { setSearchTerm(v); setPaginaBusqueda(1); }}
						tituloFiltro="Estado de documentos"
						filtro={filtroEstado}
						onFiltro={(v) => { setFiltroEstado(v); setPaginaBusqueda(1); }}
						opciones={[
							{ value: "todos", label: "Todos" },
							...(Object.keys(ESTADOS) as EstadoDoc[]).map((e) => ({ value: e, label: ESTADOS[e].label })),
						]}
					/>

					{buscando && !todos && totalElementos > 0 ? (
						<Cargando texto="Buscando en toda la cohorte..." />
					) : (
						<div aria-busy={cargando} className={`transition-opacity ${cargando ? "opacity-60" : ""}`}>
							<Tabla
								columnas={["Nombre", "Cédula", "Correo", "Estado"]}
								vacia={aspirantesPagina.length === 0}
								pie={
									<Paginacion
										pagina={buscando ? paginaBusqueda : pagina}
										porPagina={POR_PAGINA}
										totalElementos={buscando ? aspirantesFiltrados.length : totalElementos}
										onCambiar={buscando ? setPaginaBusqueda : setPagina}
									/>
								}
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
						</div>
					)}
				</>
			)}
		</div>
	);
}
