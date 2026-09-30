import { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams, useOutletContext } from "react-router";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { Badge, type BadgeColor } from "../../../components/Badge";
import BuscadorConFiltro from "../../../components/BuscadorConFiltro";
import Cargando from "../../../components/Cargando";
import EncabezadoVolver from "../../../components/EncabezadoVolver";
import { TarjetasEstadisticas, TarjetaProgreso } from "../../../components/Estadisticas";
import Paginacion from "../../../components/Paginacion";
import Tabla from "../../../components/Tabla";
import { TIPOS_PAGO, type PagoApi, type TipoPago } from "./tipoPago";

const POR_PAGINA = 10;

type EstadoGeneral = "COMPLETADO" | "RECHAZADO" | "EN_REVISION" | "PENDIENTE";

const ESTADOS: Record<EstadoGeneral, { label: string; color: BadgeColor }> = {
	COMPLETADO:  { label: "Completado",  color: "verde" },
	RECHAZADO:   { label: "Rechazado",   color: "rojo" },
	EN_REVISION: { label: "En revisión", color: "amarillo" },
	PENDIENTE:   { label: "Pendiente",   color: "gris" },
};

function resolverEstadoGeneral(pagos: PagoApi[]): EstadoGeneral {
	const estados = pagos.map((p) => p.estado.trim().toUpperCase());
	if (estados.every((e) => e === "COMPLETADO")) return "COMPLETADO";
	if (estados.some((e) => e === "RECHAZADO")) return "RECHAZADO";
	if (pagos.some((p) => p.urlfactura)) return "EN_REVISION";
	return "PENDIENTE";
}

export default function ValidacionPagos({ tipo }: { tipo: TipoPago }) {
	const { nombre, ruta, obtener } = TIPOS_PAGO[tipo];
	const navigate = useNavigate();
	const location = useLocation();
	const { cohorteId } = useParams<{ cohorteId: string }>();
	const { mostrarAlerta } = useOutletContext<ProgramaOutletContext>();

	const idCohorte = Number(cohorteId);
	const estado = location.state as { nombreCohorte?: string; activa?: boolean } | null;

	const [pagos, setPagos] = useState<PagoApi[]>([]);
	const [cargando, setCargando] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [pagina, setPagina] = useState(1);
	const [filtroEstado, setFiltroEstado] = useState<EstadoGeneral | "todos">("todos");

	useEffect(() => {
		if (!idCohorte) {
			mostrarAlerta("No se encontró el identificador de la cohorte.", "error");
			return;
		}
		const cargar = async () => {
			setCargando(true);
			try {
				setPagos(await obtener(idCohorte));
			} catch (err) {
				if (!localStorage.getItem("ufps_programa_session")) {
					navigate("/programa/login", { replace: true });
					return;
				}
				mostrarAlerta(err instanceof Error ? err.message : `No se pudieron cargar los pagos de ${nombre.toLowerCase()}.`, "error");
			} finally {
				setCargando(false);
			}
		};
		cargar();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [idCohorte, tipo]);

	useEffect(() => { setPagina(1); }, [searchTerm, filtroEstado]);

	// Agrupar por idAspirante
	const grupos = pagos.reduce<Record<number, PagoApi[]>>((acc, pago) => {
		(acc[pago.idAspirante] ??= []).push(pago);
		return acc;
	}, {});

	const aspirantes = Object.entries(grupos).map(([idStr, pagosAspirante]) => ({
		idAspirante:   Number(idStr),
		nombre:        pagosAspirante[0].aspirante,
		estadoGeneral: resolverEstadoGeneral(pagosAspirante),
		valorTotal:    pagosAspirante.reduce((s, p) => s + p.valorpago, 0),
	}));

	const contar = (e: EstadoGeneral) => aspirantes.filter((a) => a.estadoGeneral === e).length;
	const completados = contar("COMPLETADO");

	const filtrados = aspirantes.filter((a) =>
		a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
		(filtroEstado === "todos" || a.estadoGeneral === filtroEstado)
	);
	const paginaActual = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

	return (
		<div className="p-6 bg-gray-100 min-h-full" style={{ fontFamily: "Segoe UI, sans-serif" }}>
			<EncabezadoVolver
				titulo={`Validación de Pagos — ${nombre}`}
				onVolver={() => navigate(ruta)}
				nombreCohorte={estado?.nombreCohorte}
				activa={estado?.activa ?? false}
			/>

			{cargando ? (
				<Cargando texto="Cargando pagos..." />
			) : (
				<>
					<TarjetasEstadisticas
						items={[
							{ etiqueta: `Total en pago de ${nombre.toLowerCase()}`, valor: aspirantes.length },
							{ etiqueta: "Pendientes", valor: contar("PENDIENTE"), color: "text-neutral-500" },
							{ etiqueta: "En revisión", valor: contar("EN_REVISION"), color: "text-amber-500" },
							{
								etiqueta: "Completados / Rechazados",
								valor: (
									<>
										<span className="text-green-600">{completados}</span>
										<span className="text-gray-400 text-lg mx-1">/</span>
										<span className="text-red-600">{contar("RECHAZADO")}</span>
									</>
								),
							},
						]}
					/>

					<TarjetaProgreso etiqueta="Completados" actual={completados} total={aspirantes.length} />

					<BuscadorConFiltro
						busqueda={searchTerm}
						onBusqueda={setSearchTerm}
						tituloFiltro="Estado"
						filtro={filtroEstado}
						onFiltro={setFiltroEstado}
						opciones={[
							{ value: "todos", label: "Todos" },
							...(Object.keys(ESTADOS) as EstadoGeneral[]).map((e) => ({ value: e, label: ESTADOS[e].label })),
						]}
					/>

					<Tabla
						columnas={["Aspirante", "Valor total", "Estado"]}
						anchoMinimo="min-w-[560px]"
						vacia={filtrados.length === 0}
						mensajeVacio="No hay aspirantes que coincidan con la búsqueda."
						pie={<Paginacion pagina={pagina} porPagina={POR_PAGINA} totalElementos={filtrados.length} onCambiar={setPagina} />}
					>
						{paginaActual.map((aspirante) => (
							<tr
								key={aspirante.idAspirante}
								onClick={() =>
									navigate(`${ruta}/${aspirante.idAspirante}`, {
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
									<Badge color={ESTADOS[aspirante.estadoGeneral].color}>{ESTADOS[aspirante.estadoGeneral].label}</Badge>
								</td>
							</tr>
						))}
					</Tabla>
				</>
			)}
		</div>
	);
}
