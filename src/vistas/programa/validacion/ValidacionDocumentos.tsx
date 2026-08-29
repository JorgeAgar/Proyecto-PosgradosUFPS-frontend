import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { obtenerCohortesPorPrograma, type CohorteValidacionApi } from "../../../services/programa/validacionService";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { SpinnerIcon } from "../../../assets/icons";

function calcularPorcentaje(validados: number, total: number) {
	if (total === 0) return 0;
	return Math.round((validados / total) * 100);
}

export function ValidacionDocumentosVista() {
	const navigate = useNavigate();
	const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();
	const [cohortes, setCohortes] = useState<CohorteValidacionApi[]>([]);
	const [cargando, setCargando] = useState(true);

	useEffect(() => {
		const cargar = async () => {
			setCargando(true);
			try {
				const datos = await obtenerCohortesPorPrograma();
				setCohortes([...datos].sort((a, b) => Number(b.activa) - Number(a.activa)));
			} catch (err) {
				mostrarAlerta(err instanceof Error ? err.message : "No se pudieron cargar las cohortes para validación.", "error");
			} finally {
				setCargando(false);
			}
		};
		cargar();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
			<div className="">
				<div className="mb-6 animate-fade-in">
					<h1 className="text-xl font-bold text-gray-900">Validación de documentos</h1>
					<h2 className="text-base font-semibold text-gray-700 mt-3">Cohortes</h2>
					<p className="text-sm text-neutral-400 mt-1">
						Selecciona una cohorte para validar los documentos de sus aspirantes.
					</p>
				</div>

				{cargando ? (
					<div className="flex items-center justify-center py-20 animate-fade-in">
						<div className="flex items-center gap-3 text-neutral-400 text-sm">
							<SpinnerIcon className="animate-spin h-6 w-6 text-red-700" />
							Cargando cohortes...
						</div>
					</div>
				) : cohortes.length === 0 ? (
					<div className="flex items-center justify-center py-20 animate-fade-in">
						<p className="text-sm text-neutral-400">No hay cohortes disponibles.</p>
					</div>
				) : (
					<div className="space-y-4 animate-fade-in-up delay-100">
						{cohortes.map((cohorte, idx) => (
							<button
								key={cohorte.id}
								type="button"
								onClick={() => navigate(`/programa/validacion/cohorte/${cohorte.id}`, { state: { nombreCohorte: cohorte.nombre, activa: cohorte.activa } })}
								className="w-full text-left p-6 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all animate-fade-in-up"
								style={{ animationDelay: `${100 + idx * 75}ms` }}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										{/* Nombre + badge */}
										<div className="flex items-center gap-3 mb-3 flex-wrap">
											<h2 className="text-lg font-semibold text-gray-900">{cohorte.nombre}</h2>
											{cohorte.activa ? (
												<span className="bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-lg shrink-0">Activa</span>
											) : (
												<span className="bg-neutral-200 text-neutral-500 text-xs font-semibold px-3 py-1 rounded-lg shrink-0">Inactiva</span>
											)}
										</div>

										{/* Inscritos y Cupos */}
										<div className="flex gap-6 flex-wrap mb-2">
											<div className="text-sm">
												<span className="text-neutral-400">Inscritos: </span>
												<span className="font-semibold text-red-700">{cohorte.totalInscritos}</span>
											</div>
											<div className="text-sm">
												<span className="text-neutral-400">Cupos: </span>
												<span className="font-semibold text-red-700">{cohorte.cupos}</span>
											</div>
										</div>

										{/* Por validar y Validados */}
										<div className="flex gap-6 flex-wrap mb-2">
											<div className="text-sm">
												<span className="text-neutral-400">Por validar: </span>
												<span className="font-semibold text-gray-800">{cohorte.totalPazysalvo}</span>
											</div>
											{cohorte.totalValidados > 0 && (
												<div className="text-sm">
													<span className="text-neutral-400">Validados: </span>
													<span className="font-semibold text-gray-800">{cohorte.totalValidados}</span>
												</div>
											)}
										</div>

										{/* Fecha límite */}
										<div className="text-sm mb-3">
											<span className="text-neutral-400">Fecha límite: </span>
											<span className="font-semibold text-gray-800">{cohorte.fechaLimiteDocs}</span>
										</div>

										{/* Barra de progreso validados */}
										{(cohorte.totalPazysalvo + cohorte.totalValidados) > 0 && (
											<div>
												<div className="text-xs text-neutral-400 mb-1">Validados / Total en validación</div>
												<div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
													<div
														className="h-2 bg-red-700 rounded-full transition-all duration-500"
														style={{ width: `${calcularPorcentaje(cohorte.totalValidados, cohorte.totalPazysalvo + cohorte.totalValidados)}%` }}
													/>
												</div>
												<div className="text-sm mt-1.5">
													<span className="text-neutral-400">Validados: </span>
													<span className="font-semibold text-red-700">{cohorte.totalValidados}</span>
													<span className="text-neutral-400"> de </span>
													<span className="font-semibold text-gray-800">{cohorte.totalPazysalvo + cohorte.totalValidados}</span>
												</div>
											</div>
										)}
									</div>

									<ChevronRightIcon className="w-5 h-5 shrink-0 text-neutral-400" />
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default function ValidacionDocumentos() {
	return <ValidacionDocumentosVista />;
}
