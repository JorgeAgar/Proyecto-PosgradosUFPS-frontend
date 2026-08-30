import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, useOutletContext } from "react-router";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import {
	obtenerPagosInscripcion,
	type PagoInscripcionApi,
} from "../../../services/programa/validacionPagosInscripcionService";
import { ArrowLeftIcon, SpinnerIcon } from "../../../assets/icons";

const POR_PAGINA = 10;

type EstadoGeneral = "COMPLETADO" | "RECHAZADO" | "EN_REVISION" | "PENDIENTE";

function resolverEstadoGeneral(pagos: PagoInscripcionApi[]): EstadoGeneral {
	const estados = pagos.map((p) => p.estado.trim().toUpperCase());
	if (estados.every((e) => e === "COMPLETADO")) return "COMPLETADO";
	if (estados.some((e) => e === "RECHAZADO")) return "RECHAZADO";
	if (pagos.some((p) => p.urlfactura)) return "EN_REVISION";
	return "PENDIENTE";
}

function EstadoBadge({ estado }: { estado: EstadoGeneral }) {
	const config: Record<EstadoGeneral, { label: string; className: string }> = {
		COMPLETADO:  { label: "Completado",  className: "bg-green-100 text-green-700" },
		RECHAZADO:   { label: "Rechazado",   className: "bg-red-100 text-red-700" },
		EN_REVISION: { label: "En revisión", className: "bg-yellow-100 text-yellow-700" },
		PENDIENTE:   { label: "Pendiente",   className: "bg-neutral-200 text-neutral-600" },
	};
	const { label, className } = config[estado];
	return (
		<span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${className}`}>
			{label}
		</span>
	);
}

export default function ValidacionPagosInscripcion() {
	const navigate = useNavigate();
	const location = useLocation();
	const { cohorteId } = useParams<{ cohorteId: string }>();
	const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();

	const idCohorte = Number(cohorteId);
	const nombreCohorte = (location.state as { nombreCohorte?: string; activa?: boolean } | null)?.nombreCohorte;
	const activa        = (location.state as { nombreCohorte?: string; activa?: boolean } | null)?.activa ?? false;

	const [pagos, setPagos] = useState<PagoInscripcionApi[]>([]);
	const [cargando, setCargando] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [pagina, setPagina] = useState(1);
	const [filtroEstado, setFiltroEstado] = useState<EstadoGeneral | "todos">("todos");
	const [mostrarFiltros, setMostrarFiltros] = useState(false);
	const [filtroCerrando, setFiltroCerrando] = useState(false);

	useEffect(() => {
		if (!idCohorte) {
			mostrarAlerta("No se encontró el identificador de la cohorte.", "error");
			return;
		}
		const cargar = async () => {
			setCargando(true);
			try {
				const datos = await obtenerPagosInscripcion(idCohorte);
				setPagos(datos);
			} catch (err) {
				if (!localStorage.getItem("ufps_programa_session")) {
					navigate("/programa/login", { replace: true });
					return;
				}
				mostrarAlerta(err instanceof Error ? err.message : "No se pudieron cargar los pagos de inscripción.", "error");
			} finally {
				setCargando(false);
			}
		};
		cargar();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idCohorte]);

	useEffect(() => { setPagina(1); }, [searchTerm, filtroEstado]);

	const cerrarFiltro = (nuevoEstado?: string) => {
		setFiltroCerrando(true);
		setTimeout(() => {
			if (nuevoEstado !== undefined) setFiltroEstado(nuevoEstado as EstadoGeneral | "todos");
			setMostrarFiltros(false);
			setFiltroCerrando(false);
		}, 120);
	};

	// Agrupar por idAspirante
	const grupos = pagos.reduce<Record<number, PagoInscripcionApi[]>>((acc, pago) => {
		if (!acc[pago.idAspirante]) acc[pago.idAspirante] = [];
		acc[pago.idAspirante].push(pago);
		return acc;
	}, {});

	const aspirantes = Object.entries(grupos).map(([idStr, pagosAspirante]) => ({
		idAspirante:   Number(idStr),
		nombre:        pagosAspirante[0].aspirante,
		pagos:         pagosAspirante,
		estadoGeneral: resolverEstadoGeneral(pagosAspirante),
		valorTotal:    pagosAspirante.reduce((s, p) => s + p.valorpago, 0),
	}));

	const totalAspirantes = aspirantes.length;
	const pendientes     = aspirantes.filter((a) => a.estadoGeneral === "PENDIENTE").length;
	const enRevision     = aspirantes.filter((a) => a.estadoGeneral === "EN_REVISION").length;
	const completados    = aspirantes.filter((a) => a.estadoGeneral === "COMPLETADO").length;
	const rechazados     = aspirantes.filter((a) => a.estadoGeneral === "RECHAZADO").length;

	const porcentajePagados = totalAspirantes > 0
		? Math.round((completados / totalAspirantes) * 100)
		: 0;

	const filtrados = aspirantes.filter((a) =>
		a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
		(filtroEstado === "todos" || a.estadoGeneral === filtroEstado)
	);

	const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
	const paginaActual = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

	return (
		<div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
			{/* Encabezado */}
			<div className="flex items-center gap-3 mb-6 animate-fade-in">
				<button
					onClick={() => navigate("/programa/pagos/inscripcion")}
					className="flex items-center gap-1 text-sm text-neutral-400 hover:text-red-700 transition-colors"
				>
					<ArrowLeftIcon className="h-[18px] w-[18px] shrink-0" />
				</button>
				<div>
					<h1 className="text-xl font-bold text-gray-900">Validación de Pagos — Inscripción</h1>
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
						Cargando pagos...
					</div>
				</div>
			) : (
				<>
					{/* Tarjetas de estadísticas */}
					<div className="grid grid-cols-2 gap-4 mb-4 xl:grid-cols-4">
						<div className="bg-white rounded-lg shadow p-4 animate-fade-in-up delay-100">
							<div className="text-xs text-gray-800 mb-1">Total en pago de inscripción</div>
							<div className="text-2xl font-semibold text-gray-950">{totalAspirantes}</div>
						</div>
						<div className="bg-white rounded-lg shadow p-4 animate-fade-in-up delay-200">
							<div className="text-xs text-gray-800 mb-1">Pendientes</div>
							<div className="text-2xl font-semibold text-neutral-500">{pendientes}</div>
						</div>
						<div className="bg-white rounded-lg shadow p-4 animate-fade-in-up delay-300">
							<div className="text-xs text-gray-800 mb-1">En revisión</div>
							<div className="text-2xl font-semibold text-amber-500">{enRevision}</div>
						</div>
						<div className="bg-white rounded-lg shadow p-4 animate-fade-in-up delay-400">
							<div className="text-xs text-gray-800 mb-1">Completados / Rechazados</div>
							<div className="text-2xl font-semibold">
								<span className="text-green-600">{completados}</span>
								<span className="text-gray-400 text-lg mx-1">/</span>
								<span className="text-red-600">{rechazados}</span>
							</div>
						</div>
					</div>

					{/* Barra de progreso */}
					{totalAspirantes > 0 && (
						<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 animate-fade-in-up delay-300">
							<div className="flex items-center gap-4">
								<span className="text-sm font-semibold text-red-700 whitespace-nowrap">
									{porcentajePagados}%
								</span>
								<div className="flex-1 bg-neutral-200 rounded-full h-2">
									<div
										className="bg-red-700 h-2 rounded-full transition-all duration-500"
										style={{ width: `${porcentajePagados}%` }}
									/>
								</div>
							</div>
							<div className="text-xs text-neutral-400 mt-2">
								<span>Completados: </span>
								<span className="font-semibold text-red-700">{completados}</span>
								<span> de </span>
								<span className="font-semibold text-gray-800">{totalAspirantes}</span>
							</div>
						</div>
					)}

					{/* Búsqueda y filtros */}
					<div className="relative z-10 flex gap-3 mb-6 animate-fade-in-up delay-400">
						<div className="flex-1 relative">
							<MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 pointer-events-none" />
							<input
								type="text"
								placeholder="Buscar aspirante por nombre..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-700 focus:border-transparent text-sm transition-colors"
							/>
						</div>

						<div className="relative">
							<button
								onClick={() => mostrarFiltros ? cerrarFiltro() : setMostrarFiltros(true)}
								className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600 bg-white"
							>
								<FunnelIcon className="h-[18px] w-[18px]" />
								<span className="text-sm font-medium">Filtrar</span>
							</button>

							{mostrarFiltros && (
								<div className={`absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50 ${filtroCerrando ? "animate-dropdown-out" : "animate-dropdown-in"}`}>
									<div className="p-2">
										<div className="text-xs font-semibold text-neutral-400 uppercase px-3 py-2">Estado</div>
										{[
											{ value: "todos",       label: "Todos" },
											{ value: "PENDIENTE",   label: "Pendiente" },
											{ value: "EN_REVISION", label: "En revisión" },
											{ value: "COMPLETADO",  label: "Completado" },
											{ value: "RECHAZADO",   label: "Rechazado" },
										].map(opcion => (
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
							<table className="w-full min-w-[560px]">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										<th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Aspirante</th>
										<th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Valor total</th>
										<th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{filtrados.length === 0 ? (
										<tr>
											<td className="px-6 py-8 text-sm text-gray-500" colSpan={3}>
												No hay aspirantes que coincidan con la búsqueda.
											</td>
										</tr>
									) : (
										paginaActual.map((aspirante) => (
											<tr
												key={aspirante.idAspirante}
												onClick={() =>
													navigate(`/programa/pagos/inscripcion/${aspirante.idAspirante}`, {
														state: { aspiranteNombre: aspirante.nombre, cohorteId: idCohorte },
													})
												}
												className="hover:bg-gray-50 transition-colors cursor-pointer"
											>
												<td className="px-6 py-4 text-sm font-medium text-gray-900">{aspirante.nombre}</td>
												<td className="px-6 py-4 text-sm text-gray-600">
													${aspirante.valorTotal.toLocaleString("es-CO")} COP
												</td>
												<td className="px-6 py-4 text-sm">
													<EstadoBadge estado={aspirante.estadoGeneral} />
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
									{(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, filtrados.length)} de {filtrados.length} aspirantes
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
	);
}
