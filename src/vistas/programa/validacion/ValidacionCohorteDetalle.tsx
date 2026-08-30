import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams, useLocation } from "react-router";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import {
	obtenerAspirantesPorCohorte,
	type AspiranteValidacionApi,
} from "../../../services/programa/validacionCohorteService";
import { FunnelIcon, SpinnerIcon } from "../../../assets/icons";

const POR_PAGINA = 10;

// ── Badge de estado de documentos ─────────────────────────────────────────────

type EstadoDoc = "pendiente" | "en-progreso" | "validado";

function resolverEstadoDoc(totalDocumentos: number, documentosValidados: number): EstadoDoc {
	if (totalDocumentos === 0) return "pendiente";
	if (documentosValidados === totalDocumentos) return "validado";
	return "en-progreso";
}

function EstadoBadge({ totalDocumentos, documentosValidados }: { totalDocumentos: number; documentosValidados: number }) {
	const estado = resolverEstadoDoc(totalDocumentos, documentosValidados);
	if (estado === "validado") {
		return (
			<span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-lg">
				Validado
			</span>
		);
	}
	if (estado === "en-progreso") {
		return (
			<span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-lg">
				En progreso
			</span>
		);
	}
	return (
		<span className="inline-block bg-neutral-200 text-neutral-600 text-xs font-semibold px-3 py-1 rounded-lg">
			Pendiente
		</span>
	);
}

export default function ValidacionCohorteDetalle() {
	const navigate = useNavigate();
	const location = useLocation();
	const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();
	const { cohorteId } = useParams();
	const cohorteIdNumerico = cohorteId ? Number(cohorteId) : undefined;

	const nombreCohorte = (location.state as { nombreCohorte?: string; activa?: boolean } | null)?.nombreCohorte;
	const activa = (location.state as { nombreCohorte?: string; activa?: boolean } | null)?.activa ?? false;

	const [aspirantes, setAspirantes] = useState<AspiranteValidacionApi[]>([]);
	const [cargando, setCargando] = useState(true);
	const [filtroEstado, setFiltroEstado] = useState<"todos" | "pendiente" | "en-progreso" | "validado">("todos");
	const [mostrarFiltros, setMostrarFiltros] = useState(false);
	const [filtroCerrando, setFiltroCerrando] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [pagina, setPagina] = useState(1);

	useEffect(() => { setPagina(1); }, [searchTerm, filtroEstado]);

	useEffect(() => {
		if (!cohorteIdNumerico || Number.isNaN(cohorteIdNumerico)) {
			mostrarAlerta("La cohorte solicitada no es válida.", "error");
			navigate("/programa/validacion");
			return;
		}
		const cargar = async () => {
			setCargando(true);
			try {
				const datos = await obtenerAspirantesPorCohorte(cohorteIdNumerico);
				setAspirantes(datos);
			} catch (err) {
				mostrarAlerta(err instanceof Error ? err.message : "No se pudieron cargar los aspirantes de la cohorte.", "error");
			} finally {
				setCargando(false);
			}
		};
		cargar();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cohorteIdNumerico]);

	const cerrarFiltro = (nuevoEstado?: "todos" | "pendiente" | "en-progreso" | "validado") => {
		setFiltroCerrando(true);
		setTimeout(() => {
			if (nuevoEstado !== undefined) setFiltroEstado(nuevoEstado);
			setMostrarFiltros(false);
			setFiltroCerrando(false);
		}, 120);
	};

	const porValidar = aspirantes.filter((a) => resolverEstadoDoc(a.totalDocumentos, a.documentosValidados) === "pendiente").length;
	const enProgreso = aspirantes.filter((a) => resolverEstadoDoc(a.totalDocumentos, a.documentosValidados) === "en-progreso").length;
	const validados  = aspirantes.filter((a) => resolverEstadoDoc(a.totalDocumentos, a.documentosValidados) === "validado").length;
	const totalAspirantes = aspirantes.length;
	const porcentajeValidados = totalAspirantes > 0 ? Math.round((validados / totalAspirantes) * 100) : 0;

	const aspirantesFiltrados = aspirantes.filter((aspirante) => {
		const estado = resolverEstadoDoc(aspirante.totalDocumentos, aspirante.documentosValidados);
		const coincideEstado = filtroEstado === "todos" || estado === filtroEstado;
		const coincideBusqueda = aspirante.nombre.toLowerCase().includes(searchTerm.toLowerCase());
		return coincideEstado && coincideBusqueda;
	});

	const totalPaginas = Math.ceil(aspirantesFiltrados.length / POR_PAGINA);
	const aspirantesPagina = aspirantesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

	return (
		<div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
			<div className="">
				<div className="flex items-center gap-3 mb-6 animate-fade-in">
					<button
						onClick={() => navigate("/programa/validacion")}
						className="flex items-center gap-1 text-sm text-neutral-400 hover:text-red-700 transition-colors"
					>
						<ArrowLeftIcon className="h-[18px] w-[18px] shrink-0" />
					</button>
					<div>
						<h1 className="text-xl font-bold text-gray-900">Validación de Documentos</h1>
						{nombreCohorte && (
							<div className="flex items-center gap-2 mt-0.5">
								<span className="text-sm text-neutral-400">Cohorte: {nombreCohorte}</span>
								{activa && (
									<span className="bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg animate-fade-in">Activa</span>
								)}
							</div>
						)}
					</div>
				</div>

				{cargando ? (
					<div className="flex items-center justify-center py-20 animate-fade-in">
						<div className="flex items-center gap-3 text-neutral-400 text-sm">
							<SpinnerIcon className="animate-spin h-6 w-6 text-red-700" />
							Cargando aspirantes...
						</div>
					</div>
				) : (
					<>
						{/* Tarjetas de estadísticas (solo informativas) */}
						<div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
							<div className="bg-white rounded-lg shadow p-4 text-left animate-fade-in-up delay-100">
								<div className="text-xs text-gray-800 mb-1">Total en validación</div>
								<div className="text-2xl font-semibold text-gray-950">{totalAspirantes}</div>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-left animate-fade-in-up delay-200">
								<div className="text-xs text-gray-800 mb-1">Pendientes</div>
								<div className="text-2xl font-semibold text-neutral-500">{porValidar}</div>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-left animate-fade-in-up delay-300">
								<div className="text-xs text-gray-800 mb-1">En progreso</div>
								<div className="text-2xl font-semibold text-amber-500">{enProgreso}</div>
							</div>
							<div className="bg-white rounded-lg shadow p-4 text-left animate-fade-in-up delay-400">
								<div className="text-xs text-gray-800 mb-1">Validados</div>
								<div className="text-2xl font-semibold text-green-600">{validados}</div>
							</div>
						</div>

						{/* Barra de progreso */}
						{totalAspirantes > 0 && (
							<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-up delay-300">
								<div className="flex items-center gap-4">
									<span className="text-sm font-semibold text-red-700 whitespace-nowrap">
										{porcentajeValidados}%
									</span>
									<div className="flex-1 bg-neutral-200 rounded-full h-2">
										<div
											className="bg-red-700 h-2 rounded-full transition-all duration-500"
											style={{ width: `${porcentajeValidados}%` }}
										/>
									</div>
								</div>
								<div className="text-xs text-neutral-400 mt-2">
									<span>Validados: </span>
									<span className="font-semibold text-red-700">{validados}</span>
									<span> de </span>
									<span className="font-semibold text-gray-800">{totalAspirantes}</span>
								</div>
							</div>
						)}

						{/* Barra de búsqueda y filtro */}
						<div className="relative z-10 flex gap-3 mb-6 animate-fade-in-up delay-400">
							<div className="flex-1 relative">
								<MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
								<input
									type="text"
									placeholder="Buscar aspirante por nombre..."
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
									className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent text-sm transition-colors"
								/>
							</div>

							<div className="relative">
								<button
									onClick={() => mostrarFiltros ? cerrarFiltro() : setMostrarFiltros(true)}
									className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 bg-white"
								>
									<FunnelIcon />
									<span className="text-sm font-medium">Filtrar</span>
								</button>

								{mostrarFiltros && (
									<div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 ${filtroCerrando ? "animate-dropdown-out" : "animate-dropdown-in"}`}>
										<div className="p-2">
											<div className="text-xs font-semibold text-neutral-400 uppercase px-3 py-2">
												Estado de documentos
											</div>
											{([
												{ value: "todos" as const,       label: "Todos" },
												{ value: "pendiente" as const,   label: "Pendiente" },
												{ value: "en-progreso" as const, label: "En progreso" },
												{ value: "validado" as const,    label: "Validado" },
											]).map((opcion) => (
												<button
													key={opcion.value}
													onClick={() => cerrarFiltro(opcion.value)}
													className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
														filtroEstado === opcion.value
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

						{/* Tabla */}
						<div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in-up delay-500">
							<div className="overflow-x-auto">
								<table className="w-full min-w-[640px]">
									<thead className="bg-gray-50 border-b border-gray-200">
										<tr>
											<th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
											<th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Cédula</th>
											<th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Correo</th>
											<th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{aspirantesFiltrados.length === 0 ? (
											<tr>
												<td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
													No hay aspirantes que coincidan con los filtros actuales.
												</td>
											</tr>
										) : (
											aspirantesPagina.map((aspirante) => (
												<tr
													key={aspirante.id}
													onClick={() => navigate(`/programa/validacion/aspirantes/${cohorteId}/${aspirante.id}`, { state: { nombreCohorte, activa } })}
													className="hover:bg-gray-50 transition-colors cursor-pointer"
												>
													<td className="px-6 py-4 text-sm text-gray-900">{aspirante.nombre}</td>
													<td className="px-6 py-4 text-sm text-gray-600">{aspirante.cedula}</td>
													<td className="px-6 py-4 text-sm text-gray-600">{aspirante.correo}</td>
													<td className="px-6 py-4 text-sm">
														<EstadoBadge totalDocumentos={aspirante.totalDocumentos} documentosValidados={aspirante.documentosValidados} />
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
							{totalPaginas > 1 && (
								<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
									<span className="text-xs text-neutral-400">
										{(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, aspirantesFiltrados.length)} de {aspirantesFiltrados.length} aspirantes
									</span>
									<div className="flex items-center gap-2">
										<button
											onClick={() => setPagina((p) => p - 1)}
											disabled={pagina === 1}
											className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
										>
											<ChevronLeftIcon className="h-4 w-4" />
											Anterior
										</button>
										<span className="text-sm font-medium text-gray-600 px-1">{pagina} / {totalPaginas}</span>
										<button
											onClick={() => setPagina((p) => p + 1)}
											disabled={pagina === totalPaginas}
											className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
										>
											Siguiente
											<ChevronRightIcon className="h-4 w-4" />
										</button>
									</div>
								</div>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
