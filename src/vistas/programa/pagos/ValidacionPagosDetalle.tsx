import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useOutletContext, useParams, useLocation } from "react-router";
import {
	ArrowTopRightOnSquareIcon,
	CheckCircleIcon,
	ExclamationTriangleIcon,
	XCircleIcon,
	DocumentTextIcon,
	PrinterIcon,
	UserIcon,
	CurrencyDollarIcon,
	CalendarIcon,
	InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { SpinnerIcon } from "../../../assets/icons";
import { Badge, type BadgeColor } from "../../../components/Badge";
import Cargando from "../../../components/Cargando";
import { DialogoConfirmacion } from "../../../components/Dialogo";
import EncabezadoVolver from "../../../components/EncabezadoVolver";
import { TIPOS_PAGO, type PagoApi, type TipoPago } from "./tipoPago";

const ESTADOS_PAGO: Record<string, { label: string; color: BadgeColor }> = {
	COMPLETADO: { label: "Completado", color: "verde" },
	RECHAZADO:  { label: "Rechazado",  color: "rojo" },
	"EN CURSO": { label: "En curso",   color: "amarillo" },
	PENDIENTE:  { label: "Pendiente",  color: "gris" },
};

function EstadoBadge({ estado }: { estado: string }) {
	const config = ESTADOS_PAGO[estado.trim().toUpperCase()];
	return <Badge color={config?.color ?? "gris"}>{config?.label ?? estado}</Badge>;
}

interface FacturaEstilo {
	container: string;
	iconBg: string;
	icono: ReactNode;
	titulo: string;
	tituloText: string;
	subtitulo: string;
	subtituloText: string;
	botonVer: string;
}

function resolverEstiloFactura(estado: string): FacturaEstilo {
	const norm = estado.trim().toUpperCase();
	if (norm === "COMPLETADO") {
		return {
			container:    "bg-green-50 border border-green-200",
			iconBg:       "p-2 bg-green-100 rounded-lg shrink-0",
			icono:        <CheckCircleIcon className="w-6 h-6 text-green-600" />,
			titulo:       "text-green-700",
			tituloText:   "Factura aprobada",
			subtitulo:    "text-green-600",
			subtituloText: "El pago ha sido verificado exitosamente.",
			botonVer:     "bg-green-700 hover:bg-green-800 text-white",
		};
	}
	if (norm === "RECHAZADO") {
		return {
			container:    "bg-red-50 border border-red-200",
			iconBg:       "p-2 bg-red-100 rounded-lg shrink-0",
			icono:        <XCircleIcon className="w-6 h-6 text-red-600" />,
			titulo:       "text-red-700",
			tituloText:   "Factura rechazada",
			subtitulo:    "text-red-600",
			subtituloText: "El pago fue rechazado.",
			botonVer:     "bg-red-700 hover:bg-red-800 text-white",
		};
	}
	return {
		container:    "bg-amber-50 border border-amber-200",
		iconBg:       "p-2 bg-amber-100 rounded-lg shrink-0",
		icono:        <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />,
		titulo:       "text-amber-700",
		tituloText:   "Factura en verificación",
		subtitulo:    "text-amber-600",
		subtituloText: "La factura ha sido recibida y está pendiente de revisión.",
		botonVer:     "bg-amber-400 hover:bg-amber-500 text-white",
	};
}

export default function ValidacionPagosDetalle({ tipo }: { tipo: TipoPago }) {
	const { nombre, ruta, obtener, aprobar, rechazar } = TIPOS_PAGO[tipo];
	const navigate = useNavigate();
	const location = useLocation();
	const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();
	const { aspiranteId } = useParams<{ aspiranteId: string }>();
	const aspiranteIdNum = aspiranteId ? Number(aspiranteId) : Number.NaN;

	const aspiranteNombreState = (location.state as { aspiranteNombre?: string; cohorteId?: number } | null)?.aspiranteNombre;
	const cohorteId = (location.state as { aspiranteNombre?: string; cohorteId?: number } | null)?.cohorteId;

	const [pagos, setPagos] = useState<PagoApi[]>([]);
	const [cargando, setCargando] = useState(true);
	const [accionEnviando, setAccionEnviando] = useState<{ id: number; tipo: "APROBAR" | "RECHAZAR" } | null>(null);
	const [downloadingId, setDownloadingId] = useState<number | null>(null);

	// Modales
	const [modalAprobar, setModalAprobar] = useState<number | null>(null);
	const [cerrandoAprobar, setCerrandoAprobar] = useState(false);
	const [modalRechazar, setModalRechazar] = useState<number | null>(null);
	const [cerrandoRechazar, setCerrandoRechazar] = useState(false);

	const rutaVolver = cohorteId
		? `${ruta}/cohorte/${cohorteId}`
		: ruta;

	const cargarPagos = async () => {
		if (!cohorteId) {
			mostrarAlerta("No se encontró el identificador de la cohorte.", "error");
			navigate(ruta);
			return;
		}
		setCargando(true);
		try {
			const todos = await obtener(cohorteId);
			const filtrados = todos.filter((p) => p.idAspirante === aspiranteIdNum);
			if (filtrados.length === 0) {
				mostrarAlerta("No se encontraron pagos para este aspirante.", "error");
				navigate(rutaVolver);
				return;
			}
			setPagos(filtrados);
		} catch (err) {
			if (!localStorage.getItem("ufps_programa_session")) {
				navigate("/programa/login", { replace: true });
				return;
			}
			mostrarAlerta(err instanceof Error ? err.message : "No se pudieron cargar los pagos.", "error");
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		if (Number.isNaN(aspiranteIdNum)) {
			mostrarAlerta("El identificador del aspirante no es válido.", "error");
			navigate(ruta);
			return;
		}
		cargarPagos();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [aspiranteIdNum]);

	const cerrarModalAprobar = () => {
		setCerrandoAprobar(true);
		setTimeout(() => { setModalAprobar(null); setCerrandoAprobar(false); }, 170);
	};

	const cerrarModalRechazar = () => {
		setCerrandoRechazar(true);
		setTimeout(() => { setModalRechazar(null); setCerrandoRechazar(false); }, 170);
	};

	const confirmarAprobar = async (idRecibo: number) => {
		setAccionEnviando({ id: idRecibo, tipo: "APROBAR" });
		try {
			await aprobar(idRecibo);
			cerrarModalAprobar();
			mostrarConfirm(`Pago de ${nombre.toLowerCase()} aprobado con éxito.`);
			await cargarPagos();
		} catch (err) {
			if (!localStorage.getItem("ufps_programa_session")) {
				navigate("/programa/login", { replace: true });
				return;
			}
			mostrarAlerta(err instanceof Error ? err.message : "No se pudo aprobar el pago.", "error");
		} finally {
			setAccionEnviando(null);
		}
	};

	const confirmarRechazar = async (idRecibo: number) => {
		setAccionEnviando({ id: idRecibo, tipo: "RECHAZAR" });
		try {
			await rechazar(idRecibo);
			cerrarModalRechazar();
			mostrarConfirm(`Pago de ${nombre.toLowerCase()} rechazado.`);
			await cargarPagos();
		} catch (err) {
			if (!localStorage.getItem("ufps_programa_session")) {
				navigate("/programa/login", { replace: true });
				return;
			}
			mostrarAlerta(err instanceof Error ? err.message : "No se pudo rechazar el pago.", "error");
		} finally {
			setAccionEnviando(null);
		}
	};


	return (
		<div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
			<EncabezadoVolver
				titulo={`Validación de Pagos — ${nombre}`}
				onVolver={() => navigate(rutaVolver)}
				subtitulo={aspiranteNombreState ?? "Detalle del aspirante"}
			/>

			{cargando ? (
				<Cargando texto="Cargando pagos..." />
			) : (
				<div className="space-y-6">
					{/* Tarjeta resumen por pago */}
					{pagos.map((pago, idx) => (
						<div key={`resumen-${pago.id}`} className="bg-white rounded-lg border border-gray-200 p-6 animate-fade-in-up" style={{ animationDelay: `${(idx + 1) * 100}ms` }}>
							<h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
								Información del pago
							</h2>
							<div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
								<div className="flex items-center gap-3">
									<UserIcon className="w-5 h-5 text-red-700 shrink-0" />
									<div>
										<p className="text-xs text-neutral-400">Aspirante</p>
										<p className="text-sm font-semibold text-gray-900">{pago.aspirante}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<CalendarIcon className="w-5 h-5 text-red-700 shrink-0" />
									<div>
										<p className="text-xs text-neutral-400">Fecha de vencimiento</p>
										<p className="text-sm font-medium text-gray-900">
											{new Date(pago.fechavencimiento).toLocaleDateString("es-CO")}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<CurrencyDollarIcon className="w-5 h-5 text-red-700 shrink-0" />
									<div>
										<p className="text-xs text-neutral-400">Valor del pago</p>
										<p className="text-lg font-bold text-red-700">${pago.valorpago.toLocaleString("es-CO")} COP</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<InformationCircleIcon className="w-5 h-5 text-red-700 shrink-0" />
									<div>
										<p className="text-xs text-neutral-400">Estado</p>
										<EstadoBadge estado={pago.estado} />
									</div>
								</div>
							</div>
						</div>
					))}

					{/* Un bloque por pago */}
					{pagos.map((pago, index) => {
						const estilo = resolverEstiloFactura(pago.estado);
						const estadoNorm = pago.estado.trim().toUpperCase();
						const aprobado = estadoNorm === "COMPLETADO";
						const rechazado = estadoNorm === "RECHAZADO";
						const enviandoAprobar = accionEnviando?.id === pago.id && accionEnviando.tipo === "APROBAR";
						const enviandoRechazar = accionEnviando?.id === pago.id && accionEnviando.tipo === "RECHAZAR";

						return (
							<div key={pago.id} className="space-y-3 animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 150}ms` }}>
								{pagos.length > 1 && (
									<p className="text-sm font-semibold text-gray-600">Pago #{index + 1}</p>
								)}

								{/* Recibo */}
								<div className="space-y-2">
									<h3 className="flex text-sm font-semibold text-gray-900 gap-2 items-center">
										<PrinterIcon className="w-5 h-5" /> Recibo de Pago
									</h3>
									<div className="bg-white rounded-lg border border-gray-200 p-6">
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
											<div className="space-y-1.5">
												<div className="text-sm flex items-center gap-2">
													<span className="text-neutral-400">Referencia:</span>
													<span className="font-medium text-gray-900">{pago.referenciapago || "—"}</span>
												</div>
												<div className="text-sm flex items-center gap-2">
													<span className="text-neutral-400">Valor:</span>
													<span className="font-bold text-red-700">${pago.valorpago.toLocaleString("es-CO")} COP</span>
												</div>
												<div className="text-sm flex items-center gap-2">
													<span className="text-neutral-400">Vencimiento:</span>
													<span className="font-medium text-gray-900">
														{new Date(pago.fechavencimiento).toLocaleDateString("es-CO")}
													</span>
												</div>
											</div>
											{pago.urlrecibo && (
												<button
													type="button"
													onClick={() => {
														setDownloadingId(pago.id);
														window.open(pago.urlrecibo, "_blank");
														setTimeout(() => setDownloadingId(null), 800);
													}}
													disabled={downloadingId === pago.id}
													className="relative shrink-0 flex items-center justify-center px-5 py-2.5 font-semibold text-sm text-red-700 border border-red-200 bg-white rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<span className={`flex items-center gap-2 ${downloadingId === pago.id ? "invisible" : ""}`}>
														<ArrowTopRightOnSquareIcon className="w-4 h-4 shrink-0" /> Ver recibo
													</span>
													{downloadingId === pago.id && (
														<span className="absolute inset-0 flex items-center justify-center gap-2">
															<SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-red-700" /> Abriendo...
														</span>
													)}
												</button>
											)}
										</div>
									</div>
								</div>

								{/* Factura */}
								<div className="space-y-2">
									<h3 className="flex text-sm font-semibold text-gray-900 gap-2 items-center">
										<DocumentTextIcon className="w-5 h-5" />
										{!pago.urlfactura && aprobado ? "Pago Virtual" : "Factura de Pago"}
									</h3>
									{pago.urlfactura ? (
										<div className={`rounded-lg p-6 ${estilo.container}`}>
											<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
												<div className="flex items-center gap-3">
													<div className={estilo.iconBg}>{estilo.icono}</div>
													<div>
														<p className={`font-semibold ${estilo.titulo}`}>{estilo.tituloText}</p>
														<p className={`text-sm ${estilo.subtitulo}`}>{estilo.subtituloText}</p>
													</div>
												</div>
												<button
													type="button"
													onClick={() => window.open(pago.urlfactura, "_blank")}
													className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg transition-colors ${estilo.botonVer}`}
												>
													<DocumentTextIcon className="w-4 h-4 shrink-0" /> Ver Factura
												</button>
											</div>

											{/* Botones aprobar / rechazar */}
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-black/10">
												<button
													type="button"
													onClick={() => setModalRechazar(pago.id)}
													disabled={rechazado || accionEnviando !== null}
													className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-red-700 border-2 border-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{enviandoRechazar ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-red-700" /> Rechazando...</> : "Rechazar"}
												</button>
												<button
													type="button"
													onClick={() => setModalAprobar(pago.id)}
													disabled={aprobado || accionEnviando !== null}
													className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
												>
													{enviandoAprobar ? <><SpinnerIcon className="animate-spin shrink-0 h-4 w-4 text-white" /> Aprobando...</> : "Aprobar"}
												</button>
											</div>
										</div>
									) : aprobado ? (
										<div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center gap-3">
											<div className="p-2 bg-green-100 rounded-lg shrink-0">
												<CheckCircleIcon className="w-6 h-6 text-green-600" />
											</div>
											<div>
												<p className="font-semibold text-green-700">Pago realizado vía Wompi</p>
												<p className="text-sm text-green-600">El pago fue completado de forma virtual a través de la plataforma Wompi.</p>
											</div>
										</div>
									) : (
										<div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
											<DocumentTextIcon className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
											<p className="text-sm text-neutral-400">El aspirante no ha subido ninguna factura.</p>
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Modal: Confirmar aprobación */}
			<DialogoConfirmacion
				abierto={modalAprobar !== null}
				cerrando={cerrandoAprobar}
				titulo="Confirmar aprobación"
				onCancelar={cerrarModalAprobar}
				onConfirmar={() => modalAprobar !== null && confirmarAprobar(modalAprobar)}
				textoConfirmar="Sí, aprobar"
				textoProcesando="Aprobando..."
				procesando={accionEnviando !== null}
			>
				<p className="text-sm text-gray-700">
					¿Está seguro de <strong>aprobar</strong> esta factura de pago de {nombre.toLowerCase()}?
				</p>
			</DialogoConfirmacion>

			{/* Modal: Confirmar rechazo */}
			<DialogoConfirmacion
				abierto={modalRechazar !== null}
				cerrando={cerrandoRechazar}
				titulo="Confirmar rechazo"
				onCancelar={cerrarModalRechazar}
				onConfirmar={() => modalRechazar !== null && confirmarRechazar(modalRechazar)}
				textoConfirmar="Sí, rechazar"
				textoProcesando="Rechazando..."
				procesando={accionEnviando !== null}
			>
				<p className="text-sm text-gray-700">
					¿Está seguro de <strong>rechazar</strong> esta factura de pago de {nombre.toLowerCase()}?
				</p>
			</DialogoConfirmacion>
		</div>
	);
}
