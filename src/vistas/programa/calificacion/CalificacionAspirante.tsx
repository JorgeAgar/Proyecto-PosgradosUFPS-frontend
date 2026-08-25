import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams, useOutletContext } from "react-router";
import {
  getEntrevistasByAspirante,
  agendarEntrevista,
  reagendarEntrevista,
  editarEntrevista,
  completarEntrevista,
  cancelarEntrevista,
  getCriteriosByAspirante,
  updateCriterio,
  getPruebasByAspirante,
  crearPrueba,
  reagendarPrueba,
  editarPrueba,
  completarPrueba,
  cancelarPrueba,
  getDatosAspirante,
} from "../../../services/programa/programaCalificacionAspiranteService";
import type { DatosAspiranteResponse } from "../../../services/programa/programaCalificacionAspiranteService";
import type { ProgramaOutletContext } from "../../../layouts/ProgramaLayout";
import { DatePicker } from "../../../components/DatePicker";
import { TimePicker } from "../../../components/TimePicker";
import { CalendarIcon, ClockIcon, MapPinIcon } from "../../../assets/icons";

// ── Íconos (Heroicons) ────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4.5 w-4.5 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function BroomIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 3 9 15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15c0 0-3 1-4 3-1 1.5-.5 3.5 1.5 3.5s4-1 4-3.5V15Z" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-300 ease-in-out ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Criterio {
  id: number;
  nombre: string;
  peso: number;
  puntaje: number | null;
  puntajeGuardado: number | null;
}

interface Entrevista {
  id: string;
  fecha: string;
  hora: string;
  modalidad: "virtual" | "presencial";
  lugar: string;
  estado: "pendiente" | "confirmada" | "solicitud de cambio" | "cancelada" | "completada";
  motivo?: string;
}

interface Prueba {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  hora: string;
  modalidad: "virtual" | "presencial";
  lugar: string;
  estado: "pendiente" | "confirmada" | "solicitud de cambio" | "cancelada" | "completada";
  motivo?: string;
}

// ── Helpers de mapeo backend → frontend ──────────────────────────────────────

function mapEstadoEntrevista(estado: string): Entrevista["estado"] {
  const m: Record<string, Entrevista["estado"]> = {
    "CONFIRMADA":                "confirmada",
    "PENDIENTE DE CONFIRMACION": "pendiente",
    "SOLICITUD DE CAMBIO":       "solicitud de cambio",
    "COMPLETADA":                "completada",
    "CANCELADA":                 "cancelada",
  };
  return m[estado] ?? "pendiente";
}

function mapModalidad(idTipoentrevista: number): "virtual" | "presencial" {
  return idTipoentrevista === 1 ? "presencial" : "virtual";
}

function modalidadToId(modalidad: "virtual" | "presencial"): number {
  return modalidad === "presencial" ? 1 : 2;
}

// ── Helper: badge de estado entrevista ────────────────────────────────────────

function EntrevistaBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    confirmada:            "bg-blue-100 text-blue-700 border border-blue-200",
    "solicitud de cambio": "bg-amber-100 text-amber-600 border border-amber-200",
    pendiente:             "bg-yellow-100 text-yellow-600 border border-yellow-200",
    cancelada:             "bg-red-100 text-red-700 border border-red-200",
    completada:            "bg-green-100 text-green-700 border border-green-200",
  };
  const labels: Record<string, string> = {
    confirmada:            "Confirmada",
    "solicitud de cambio": "Solicitud de cambio",
    pendiente:             "Pendiente de confirmación",
    cancelada:             "Cancelada",
    completada:            "Completada",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${map[estado] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[estado] ?? estado}
    </span>
  );
}

function ModalidadBadge({ modalidad }: { modalidad: string }) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-lg ${
      modalidad === "virtual" ? "bg-blue-100 text-blue-700" : "bg-neutral-200 text-neutral-700"
    }`}>
      {modalidad === "virtual" ? "Virtual" : "Presencial"}
    </span>
  );
}

// ── Helpers de formato ────────────────────────────────────────────────────────

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function formatFecha(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${parseInt(day)} de ${MESES[parseInt(month) - 1]} de ${year}`;
}

function formatHora(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CalificacionAspirante() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<ProgramaOutletContext>();
  const aspiranteId = parseInt(id ?? "0");

  const state = location.state as { cohorteId?: number; nombreCohorte?: string } | null;
  const cohorteId = state?.cohorteId ?? null;
  const nombreCohorte = state?.nombreCohorte ?? null;

  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [puntajeTotalBackend, setPuntajeTotalBackend] = useState(0);
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [entrevistaEditando, setEntrevistaEditando] = useState<string | null>(null);
  const [modoEdicionEntrevista, setModoEdicionEntrevista] = useState<"reagendar" | "editar">("reagendar");
  const [nuevaEntrevista, setNuevaEntrevista] = useState({
    fecha: "",
    hora: "",
    modalidad: "virtual" as "virtual" | "presencial",
    lugar: "",
  });
  const [erroresAgendar, setErroresAgendar] = useState<{ fecha?: string; hora?: string; lugar?: string }>({});

  const [mostrarDialogoCancelar, setMostrarDialogoCancelar] = useState(false);
  const [entrevistaCancelarId, setEntrevistaCancelarId] = useState<string | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const [datosAspirante, setDatosAspirante] = useState<DatosAspiranteResponse | null>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const [cargandoEntrevistas, setCargandoEntrevistas] = useState(true);
  const [cargandoCriterios, setCargandoCriterios] = useState(true);
  const [cargandoPruebas, setCargandoPruebas] = useState(true);

  const [cargandoEntrevista, setCargandoEntrevista] = useState(false);
  const [cargandoCompletar, setCargandoCompletar] = useState(false);
  const [cargandoCancelar, setCargandoCancelar] = useState(false);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);
  const [mostrarConfirmarGuardar, setMostrarConfirmarGuardar] = useState(false);

  // ── Estado de pruebas ─────────────────────────────────────────────────────
  const [pruebas, setPruebas] = useState<Prueba[]>([]);
  const [mostrarFormularioPrueba, setMostrarFormularioPrueba] = useState(false);
  const [pruebaEditando, setPruebaEditando] = useState<string | null>(null);
  const [modoEdicionPrueba, setModoEdicionPrueba] = useState<"reagendar" | "editar">("reagendar");
  const [nuevaPrueba, setNuevaPrueba] = useState({
    nombre: "",
    descripcion: "",
    fecha: "",
    hora: "",
    modalidad: "virtual" as "virtual" | "presencial",
    lugar: "",
  });
  const [erroresPrueba, setErroresPrueba] = useState<{
    nombre?: string;
    descripcion?: string;
    fecha?: string;
    hora?: string;
    lugar?: string;
  }>({});
  const [mostrarDialogoCancelarPrueba, setMostrarDialogoCancelarPrueba] = useState(false);
  const [pruebaCancelarId, setPruebaCancelarId] = useState<string | null>(null);
  const [motivoCancelacionPrueba, setMotivoCancelacionPrueba] = useState("");
  const [cargandoPrueba, setCargandoPrueba] = useState(false);
  const [cargandoCompletarPrueba, setCargandoCompletarPrueba] = useState(false);
  const [cargandoCancelarPrueba, setCargandoCancelarPrueba] = useState(false);

  const [cerrandoFormulario, setCerrandoFormulario] = useState(false);
  const [cerrandoDialogoCancelar, setCerrandoDialogoCancelar] = useState(false);
  const [cerrandoConfirmarGuardar, setCerrandoConfirmarGuardar] = useState(false);
  const [cerrandoFormularioPrueba, setCerrandoFormularioPrueba] = useState(false);
  const [cerrandoDialogoCancelarPrueba, setCerrandoDialogoCancelarPrueba] = useState(false);

  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [historialPruebasAbierto, setHistorialPruebasAbierto] = useState(false);

  const [mostrarConfirmarCompletar, setMostrarConfirmarCompletar] = useState(false);
  const [entrevistaCompletarId, setEntrevistaCompletarId] = useState<string | null>(null);
  const [cerrandoConfirmarCompletar, setCerrandoConfirmarCompletar] = useState(false);

  const [mostrarConfirmarCompletarPrueba, setMostrarConfirmarCompletarPrueba] = useState(false);
  const [pruebaCompletarId, setPruebaCompletarId] = useState<string | null>(null);
  const [cerrandoConfirmarCompletarPrueba, setCerrandoConfirmarCompletarPrueba] = useState(false);

  const [criterioLimpiarId, setCriterioLimpiarId] = useState<number | null>(null);
  const [mostrarConfirmarLimpiar, setMostrarConfirmarLimpiar] = useState(false);
  const [cerrandoConfirmarLimpiar, setCerrandoConfirmarLimpiar] = useState(false);
  const [cargandoLimpiar, setCargandoLimpiar] = useState<number | null>(null);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const cargarDatos = useCallback(async () => {
    if (!aspiranteId) return;
    setCargandoDatos(true);
    try {
      const data = await getDatosAspirante(aspiranteId);
      setDatosAspirante(data);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoDatos(false);
    }
  }, [aspiranteId, mostrarAlerta]);

  const cargarEntrevistas = useCallback(async () => {
    if (!aspiranteId) return;
    setCargandoEntrevistas(true);
    setEntrevistas([]);
    try {
      const data = await getEntrevistasByAspirante(aspiranteId);
      setEntrevistas(
        (data ?? []).map(e => ({
          id: String(e.id),
          fecha: e.fecha ?? "",
          hora: e.tiempo ?? "",
          modalidad: mapModalidad(e.idTipoentrevista),
          lugar: e.ubicacion ?? "",
          estado: mapEstadoEntrevista(e.estado),
          motivo: e.motivocambio ?? undefined,
        }))
      );
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoEntrevistas(false);
    }
  }, [aspiranteId, mostrarAlerta]);

  const cargarCriterios = useCallback(async () => {
    if (!aspiranteId) return;
    setCargandoCriterios(true);
    setCriterios([]);
    setPuntajeTotalBackend(0);
    try {
      const res = await getCriteriosByAspirante(aspiranteId);
      setCriterios(
        (res?.criterios ?? []).map(c => ({
          id: c.id,
          nombre: c.nombreCriterio,
          peso: c.peso,
          puntaje: c.puntajeObtenido,
          puntajeGuardado: c.puntajeObtenido,
        }))
      );
      setPuntajeTotalBackend(res?.puntajeTotal ?? 0);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoCriterios(false);
    }
  }, [aspiranteId, mostrarAlerta]);

  const cargarPruebas = useCallback(async () => {
    if (!aspiranteId) return;
    setCargandoPruebas(true);
    setPruebas([]);
    try {
      const data = await getPruebasByAspirante(aspiranteId);
      setPruebas(
        (data ?? []).map(p => ({
          id: String(p.id),
          nombre: p.nombre ?? "",
          descripcion: p.descripcion ?? "",
          fecha: p.fecha ?? "",
          hora: p.tiempo ?? "",
          modalidad: mapModalidad(p.idTipoprueba),
          lugar: p.ubicacion ?? "",
          estado: mapEstadoEntrevista(p.estado),
          motivo: p.motivocambio ?? undefined,
        }))
      );
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoPruebas(false);
    }
  }, [aspiranteId, mostrarAlerta]);

  useEffect(() => {
    cargarDatos();
    cargarEntrevistas();
    cargarCriterios();
    cargarPruebas();
  }, [cargarDatos, cargarEntrevistas, cargarCriterios, cargarPruebas]);

  // ── Handlers entrevista ───────────────────────────────────────────────────

  const cerrarModalAgendar = () => {
    setCerrandoFormulario(true);
    setTimeout(() => {
      setMostrarFormulario(false);
      setCerrandoFormulario(false);
      setEntrevistaEditando(null);
      setModoEdicionEntrevista("reagendar");
      setErroresAgendar({});
      setNuevaEntrevista({ fecha: "", hora: "", modalidad: "virtual", lugar: "" });
    }, 170);
  };

  const cerrarDialogoCancelar = () => {
    setCerrandoDialogoCancelar(true);
    setTimeout(() => {
      setMostrarDialogoCancelar(false);
      setCerrandoDialogoCancelar(false);
      setMotivoCancelacion("");
      setEntrevistaCancelarId(null);
    }, 170);
  };

  const cerrarConfirmarGuardar = () => {
    setCerrandoConfirmarGuardar(true);
    setTimeout(() => {
      setMostrarConfirmarGuardar(false);
      setCerrandoConfirmarGuardar(false);
    }, 170);
  };

  const handleAgendar = async () => {
    const errs: typeof erroresAgendar = {};
    if (!nuevaEntrevista.fecha) errs.fecha = "La fecha es obligatoria";
    if (!nuevaEntrevista.hora) errs.hora = "La hora es obligatoria";
    if (!nuevaEntrevista.lugar.trim()) errs.lugar = "Este campo es obligatorio";
    if (Object.keys(errs).length > 0) { setErroresAgendar(errs); return; }
    setErroresAgendar({});

    const idTipoentrevista = modalidadToId(nuevaEntrevista.modalidad);
    setCargandoEntrevista(true);
    try {
      if (entrevistaEditando) {
        const payload = {
          fecha: nuevaEntrevista.fecha,
          tiempo: nuevaEntrevista.hora,
          idTipoentrevista,
          ubicacion: nuevaEntrevista.lugar,
        };
        if (modoEdicionEntrevista === "editar") {
          await editarEntrevista(parseInt(entrevistaEditando), payload);
        } else {
          await reagendarEntrevista(parseInt(entrevistaEditando), payload);
        }
        setEntrevistaEditando(null);
      } else {
        await agendarEntrevista(aspiranteId, {
          fecha: nuevaEntrevista.fecha,
          tiempo: nuevaEntrevista.hora,
          idTipoentrevista,
          ubicacion: nuevaEntrevista.lugar,
        });
      }
      const mensajeExito = entrevistaEditando
        ? (modoEdicionEntrevista === "editar" ? "Entrevista editada con éxito." : "Entrevista reagendada con éxito.")
        : "Entrevista agendada con éxito.";
      cerrarModalAgendar();
      await cargarEntrevistas();
      mostrarConfirm(mensajeExito);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoEntrevista(false);
    }
  };

  const handleReagendar = (e: Entrevista) => {
    setNuevaEntrevista({ fecha: e.fecha, hora: e.hora, modalidad: e.modalidad, lugar: e.lugar });
    setEntrevistaEditando(e.id);
    setModoEdicionEntrevista("reagendar");
    setErroresAgendar({});
    setMostrarFormulario(true);
  };

  const handleEditarEntrevista = (e: Entrevista) => {
    setNuevaEntrevista({ fecha: e.fecha, hora: e.hora, modalidad: e.modalidad, lugar: e.lugar });
    setEntrevistaEditando(e.id);
    setModoEdicionEntrevista("editar");
    setErroresAgendar({});
    setMostrarFormulario(true);
  };

  const cerrarConfirmarCompletar = () => {
    setCerrandoConfirmarCompletar(true);
    setTimeout(() => {
      setMostrarConfirmarCompletar(false);
      setCerrandoConfirmarCompletar(false);
      setEntrevistaCompletarId(null);
    }, 170);
  };

  const handleCompletarReunion = (entrevistaId: string) => {
    setEntrevistaCompletarId(entrevistaId);
    setMostrarConfirmarCompletar(true);
  };

  const handleCompletarReunionConfirmado = async () => {
    if (!entrevistaCompletarId) return;
    const id = entrevistaCompletarId;
    setCargandoCompletar(true);
    try {
      await completarEntrevista(parseInt(id));
      cerrarConfirmarCompletar();
      await cargarEntrevistas();
      mostrarConfirm("Reunión completada con éxito.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
      cerrarConfirmarCompletar();
    } finally {
      setCargandoCompletar(false);
    }
  };

  const handleCancelarConfirmada = async () => {
    if (!entrevistaCancelarId || !motivoCancelacion.trim()) return;
    setCargandoCancelar(true);
    try {
      await cancelarEntrevista(parseInt(entrevistaCancelarId), `El director de programa canceló la entrevista por el motivo: ${motivoCancelacion.trim()}`);
      cerrarDialogoCancelar();
      await cargarEntrevistas();
      mostrarConfirm("Entrevista cancelada con éxito.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
      cerrarDialogoCancelar();
    } finally {
      setCargandoCancelar(false);
    }
  };

  // ── Criterios ─────────────────────────────────────────────────────────────

  const handlePuntajeChange = (id: number, valor: string) => {
    const max = criterios.find(c => c.id === id)?.peso ?? 100;
    const n: number | null = valor === "" ? null : Math.min(max, Math.max(0, parseFloat(valor) || 0));
    setCriterios(prev => prev.map(c => (c.id === id ? { ...c, puntaje: n } : c)));
  };

  const handleGuardarCalificacion = async () => {
    cerrarConfirmarGuardar();
    setCargandoGuardar(true);
    try {
      const conValor = criterios.filter(c => c.puntaje !== null);
      await Promise.all(
        conValor.map(c =>
          updateCriterio({
            idAspirante: aspiranteId,
            idCriterio: c.id,
            puntajeObtenido: c.puntaje as number,
          })
        )
      );
      await cargarCriterios();
      mostrarConfirm("Calificación guardada con éxito.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoGuardar(false);
    }
  };

  const cerrarConfirmarLimpiar = () => {
    setCerrandoConfirmarLimpiar(true);
    setTimeout(() => {
      setMostrarConfirmarLimpiar(false);
      setCerrandoConfirmarLimpiar(false);
      setCriterioLimpiarId(null);
    }, 170);
  };

  const handleLimpiarCriterio = (idCriterio: number) => {
    setCriterioLimpiarId(idCriterio);
    setMostrarConfirmarLimpiar(true);
  };

  const handleLimpiarCriterioConfirmado = async () => {
    if (!criterioLimpiarId) return;
    const id = criterioLimpiarId;
    cerrarConfirmarLimpiar();
    setCargandoLimpiar(id);
    try {
      await updateCriterio({ idAspirante: aspiranteId, idCriterio: id, puntajeObtenido: null });
      await cargarCriterios();
      mostrarConfirm("Calificación del criterio limpiada con éxito.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoLimpiar(null);
    }
  };

  // ── Handlers prueba ───────────────────────────────────────────────────────

  const cerrarModalPrueba = () => {
    setCerrandoFormularioPrueba(true);
    setTimeout(() => {
      setMostrarFormularioPrueba(false);
      setCerrandoFormularioPrueba(false);
      setPruebaEditando(null);
      setModoEdicionPrueba("reagendar");
      setErroresPrueba({});
      setNuevaPrueba({ nombre: "", descripcion: "", fecha: "", hora: "", modalidad: "virtual", lugar: "" });
    }, 170);
  };

  const cerrarDialogoCancelarPrueba = () => {
    setCerrandoDialogoCancelarPrueba(true);
    setTimeout(() => {
      setMostrarDialogoCancelarPrueba(false);
      setCerrandoDialogoCancelarPrueba(false);
      setMotivoCancelacionPrueba("");
      setPruebaCancelarId(null);
    }, 170);
  };

  const handleCrearPrueba = async () => {
    const errs: typeof erroresPrueba = {};
    if (!nuevaPrueba.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!nuevaPrueba.descripcion.trim()) errs.descripcion = "La descripción es obligatoria";
    if (!nuevaPrueba.fecha) errs.fecha = "La fecha es obligatoria";
    if (!nuevaPrueba.hora) errs.hora = "La hora es obligatoria";
    if (!nuevaPrueba.lugar.trim()) errs.lugar = "Este campo es obligatorio";
    if (Object.keys(errs).length > 0) { setErroresPrueba(errs); return; }
    setErroresPrueba({});

    const idTipoprueba = modalidadToId(nuevaPrueba.modalidad);
    setCargandoPrueba(true);
    try {
      if (pruebaEditando) {
        if (modoEdicionPrueba === "editar") {
          await editarPrueba(parseInt(pruebaEditando), {
            nombre: nuevaPrueba.nombre.trim(),
            descripcion: nuevaPrueba.descripcion.trim(),
            fecha: nuevaPrueba.fecha,
            tiempo: nuevaPrueba.hora,
            idTipoprueba,
            ubicacion: nuevaPrueba.lugar,
          });
        } else {
          await reagendarPrueba(parseInt(pruebaEditando), {
            fecha: nuevaPrueba.fecha,
            tiempo: nuevaPrueba.hora,
            idTipoprueba,
            ubicacion: nuevaPrueba.lugar,
          });
        }
        setPruebaEditando(null);
      } else {
        await crearPrueba(aspiranteId, {
          nombre: nuevaPrueba.nombre.trim(),
          descripcion: nuevaPrueba.descripcion.trim(),
          fecha: nuevaPrueba.fecha,
          tiempo: nuevaPrueba.hora,
          idTipoprueba,
          ubicacion: nuevaPrueba.lugar,
        });
      }
      const mensajeExitoPrueba = pruebaEditando
        ? (modoEdicionPrueba === "editar" ? "Prueba editada con éxito." : "Prueba reagendada con éxito.")
        : "Prueba creada con éxito.";
      cerrarModalPrueba();
      await cargarPruebas();
      mostrarConfirm(mensajeExitoPrueba);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
    } finally {
      setCargandoPrueba(false);
    }
  };

  const handleReagendarPrueba = (p: Prueba) => {
    setNuevaPrueba({ nombre: p.nombre, descripcion: p.descripcion, fecha: p.fecha, hora: p.hora, modalidad: p.modalidad, lugar: p.lugar });
    setPruebaEditando(p.id);
    setModoEdicionPrueba("reagendar");
    setErroresPrueba({});
    setMostrarFormularioPrueba(true);
  };

  const handleEditarPrueba = (p: Prueba) => {
    setNuevaPrueba({ nombre: p.nombre, descripcion: p.descripcion, fecha: p.fecha, hora: p.hora, modalidad: p.modalidad, lugar: p.lugar });
    setPruebaEditando(p.id);
    setModoEdicionPrueba("editar");
    setErroresPrueba({});
    setMostrarFormularioPrueba(true);
  };

  const cerrarConfirmarCompletarPrueba = () => {
    setCerrandoConfirmarCompletarPrueba(true);
    setTimeout(() => {
      setMostrarConfirmarCompletarPrueba(false);
      setCerrandoConfirmarCompletarPrueba(false);
      setPruebaCompletarId(null);
    }, 170);
  };

  const handleCompletarPrueba = (pruebaId: string) => {
    setPruebaCompletarId(pruebaId);
    setMostrarConfirmarCompletarPrueba(true);
  };

  const handleCompletarPruebaConfirmado = async () => {
    if (!pruebaCompletarId) return;
    const id = pruebaCompletarId;
    setCargandoCompletarPrueba(true);
    try {
      await completarPrueba(parseInt(id));
      cerrarConfirmarCompletarPrueba();
      await cargarPruebas();
      mostrarConfirm("Prueba completada con éxito.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
      cerrarConfirmarCompletarPrueba();
    } finally {
      setCargandoCompletarPrueba(false);
    }
  };

  const handleCancelarPruebaConfirmada = async () => {
    if (!pruebaCancelarId || !motivoCancelacionPrueba.trim()) return;
    setCargandoCancelarPrueba(true);
    try {
      await cancelarPrueba(parseInt(pruebaCancelarId), `El director de programa canceló la prueba por el motivo: ${motivoCancelacionPrueba.trim()}`);
      cerrarDialogoCancelarPrueba();
      await cargarPruebas();
      mostrarConfirm("Prueba cancelada con éxito.");
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : "Hubo un error");
      cerrarDialogoCancelarPrueba();
    } finally {
      setCargandoCancelarPrueba(false);
    }
  };

  // ── Grupos de entrevistas ─────────────────────────────────────────────────

  const confirmadas = entrevistas.filter(e => e.estado === "confirmada");
  const activas     = [
    ...entrevistas.filter(e => e.estado === "solicitud de cambio"),
    ...entrevistas.filter(e => e.estado === "pendiente"),
  ];
  const historial   = [
    ...entrevistas.filter(e => e.estado === "completada"),
    ...entrevistas.filter(e => e.estado === "cancelada"),
  ];

  const confirmadasPruebas = pruebas.filter(p => p.estado === "confirmada");
  const activasPruebas     = [
    ...pruebas.filter(p => p.estado === "solicitud de cambio"),
    ...pruebas.filter(p => p.estado === "pendiente"),
  ];
  const historialPruebas   = [
    ...pruebas.filter(p => p.estado === "completada"),
    ...pruebas.filter(p => p.estado === "cancelada"),
  ];

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-gray-100 min-h-full">
      <div className="">

        {/* Volver */}
        <button
          onClick={() => navigate(
            cohorteId
              ? `/programa/admision/calificacion/cohorte/${cohorteId}`
              : "/programa/admision/calificacion",
            cohorteId && nombreCohorte ? { state: { nombreCohorte } } : undefined
          )}
          className="flex items-center gap-2 text-red-700 hover:text-red-800 mb-6 transition-colors animate-fade-in group"
        >
          <ArrowLeftIcon />
          <div className="flex flex-col items-start">
            <span className="font-medium text-sm leading-tight">Volver</span>
            {nombreCohorte && (
              <span className="text-xs text-neutral-400 group-hover:text-red-700/70 transition-colors leading-tight">
                Cohorte: {nombreCohorte}
              </span>
            )}
          </div>
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-6 animate-fade-in delay-100">
          Calificar aspirante
        </h1>

        {/* Información del aspirante */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 animate-fade-in-up delay-200">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            Información del aspirante
          </h2>
          {cargandoDatos ? (
            <div className="flex items-center gap-2 py-4 text-sm text-neutral-400">
              <Spinner />
              Cargando información...
            </div>
          ) : datosAspirante ? (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4">
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Nombres y apellidos</div>
                <div className="text-sm font-semibold text-gray-900 break-words">
                  {datosAspirante.nombres} {datosAspirante.apellidos}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Tipo de documento</div>
                <div className="text-sm text-gray-900 break-words">{datosAspirante.tipodocumento || "—"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Documento</div>
                <div className="text-sm text-gray-900 break-all">{datosAspirante.documento || "—"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Correo</div>
                <div className="text-sm text-gray-900 break-all">{datosAspirante.correo || "—"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Celular</div>
                <div className="text-sm text-gray-900 break-words">{datosAspirante.celular || "—"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Egresado UFPS</div>
                <div className="text-sm text-gray-900">{datosAspirante.egresadoufps ? "Sí" : "No"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Empresa</div>
                <div className="text-sm text-gray-900 break-words">{datosAspirante.empresa || "—"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Promedio pregrado</div>
                <div className="text-sm text-gray-900">
                  {datosAspirante.promediopregrado != null ? datosAspirante.promediopregrado : "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Título pregrado</div>
                <div className="text-sm text-gray-900 break-words">{datosAspirante.titulopregrado || "—"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Títulos posgrados</div>
                <div className="text-sm text-gray-900 break-words">{datosAspirante.titulosposgrados || "—"}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-400 mb-1">Ubicación trabajo</div>
                <div className="text-sm text-gray-900 break-words">{datosAspirante.ubicaciontrabajo || "—"}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs text-neutral-400 mb-1">Experiencia laboral</div>
              <div className="text-sm text-gray-900 whitespace-pre-line break-words">{datosAspirante.experiencialaboral || "—"}</div>
            </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400">No se pudo cargar la información del aspirante.</p>
          )}
        </div>

        {/* Sección entrevistas */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Entrevistas
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={cargarEntrevistas}
                disabled={cargandoEntrevistas}
                title="Recargar entrevistas"
                className="p-2 text-neutral-400 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoEntrevistas ? <Spinner /> : <RefreshIcon />}
              </button>
              <button
                onClick={() => {
                  setEntrevistaEditando(null);
                  setNuevaEntrevista({ fecha: "", hora: "", modalidad: "virtual", lugar: "" });
                  setErroresAgendar({});
                  setMostrarFormulario(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium"
              >
                <PlusIcon />
                Agendar entrevista
              </button>
            </div>
          </div>

          {/* Confirmadas */}
          {confirmadas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-600 mb-3">Entrevistas confirmadas</h3>
              <div className="space-y-3">
                {confirmadas.map(e => (
                  <div key={e.id} className="border border-blue-200 bg-blue-50/30 rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <EntrevistaBadge estado={e.estado} />
                      <ModalidadBadge modalidad={e.modalidad} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CalendarIcon /><span>{formatFecha(e.fecha)}</span>
                        <ClockIcon /><span>{formatHora(e.hora)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPinIcon />
                        <span>{e.modalidad === "virtual" ? "Enlace: " : "Lugar: "}{e.lugar}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
                      <button
                        onClick={() => handleCompletarReunion(e.id)}
                        className="flex-1 px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium"
                      >
                        Completar reunión
                      </button>
                      <button
                        onClick={() => { setEntrevistaCancelarId(e.id); setMostrarDialogoCancelar(true); }}
                        className="flex-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pendientes / solicitud de cambio */}
          {activas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-600 mb-3">Otras entrevistas</h3>
              <div className="space-y-3">
                {activas.map(e => (
                  <div key={e.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <EntrevistaBadge estado={e.estado} />
                      <ModalidadBadge modalidad={e.modalidad} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CalendarIcon /><span>{formatFecha(e.fecha)}</span>
                        <ClockIcon /><span>{formatHora(e.hora)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPinIcon />
                        <span>{e.modalidad === "virtual" ? "Enlace: " : "Lugar: "}{e.lugar}</span>
                      </div>
                      {e.estado === "solicitud de cambio" && e.motivo && (
                        <>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-neutral-400 mb-1">Motivo de solicitud:</div>
                            <div className="text-sm text-gray-700 italic">"{e.motivo}"</div>
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={() => handleReagendar(e)}
                              className="px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium"
                            >
                              Reagendar entrevista
                            </button>
                          </div>
                        </>
                      )}
                      {e.estado === "pendiente" && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleEditarEntrevista(e)}
                            className="px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium"
                          >
                            Editar entrevista
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          {historial.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setHistorialAbierto(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors group focus:outline-none"
              >
                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                  Historial
                  <span className="ml-2 text-neutral-400 font-normal">({historial.length})</span>
                </span>
                <ChevronDownIcon open={historialAbierto} />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  historialAbierto ? "max-h-1000 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 space-y-3">
                  {historial.map(e => (
                    <div key={e.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <EntrevistaBadge estado={e.estado} />
                        <ModalidadBadge modalidad={e.modalidad} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <CalendarIcon /><span>{formatFecha(e.fecha)}</span>
                          <ClockIcon /><span>{formatHora(e.hora)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPinIcon />
                          <span>{e.modalidad === "virtual" ? "Enlace: " : "Lugar: "}{e.lugar}</span>
                        </div>
                        {e.estado === "cancelada" && e.motivo && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-neutral-400 mb-1">Motivo de cancelación:</div>
                            <div className="text-sm text-gray-700 italic">"{e.motivo}"</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cargandoEntrevistas ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400">
              <Spinner />
              Cargando entrevistas...
            </div>
          ) : entrevistas.length === 0 && (
            <p className="text-center py-8 text-sm text-neutral-400">No hay entrevistas agendadas.</p>
          )}
        </div>

        {/* Sección pruebas */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 animate-fade-in-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Pruebas
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={cargarPruebas}
                disabled={cargandoPruebas}
                title="Recargar pruebas"
                className="p-2 text-neutral-400 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoPruebas ? <Spinner /> : <RefreshIcon />}
              </button>
              <button
                onClick={() => {
                  setPruebaEditando(null);
                  setNuevaPrueba({ nombre: "", descripcion: "", fecha: "", hora: "", modalidad: "virtual", lugar: "" });
                  setErroresPrueba({});
                  setMostrarFormularioPrueba(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium"
              >
                <PlusIcon />
                Crear prueba
              </button>
            </div>
          </div>

          {/* Confirmadas */}
          {confirmadasPruebas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-600 mb-3">Pruebas confirmadas</h3>
              <div className="space-y-3">
                {confirmadasPruebas.map(p => (
                  <div key={p.id} className="border border-blue-200 bg-blue-50/30 rounded-lg p-4">
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-900">{p.nombre}</div>
                      {p.descripcion && <div className="text-xs text-gray-500 mt-0.5">{p.descripcion}</div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <EntrevistaBadge estado={p.estado} />
                      <ModalidadBadge modalidad={p.modalidad} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CalendarIcon /><span>{formatFecha(p.fecha)}</span>
                        <ClockIcon /><span>{formatHora(p.hora)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPinIcon />
                        <span>{p.modalidad === "virtual" ? "Enlace: " : "Lugar: "}{p.lugar}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
                      <button
                        onClick={() => handleCompletarPrueba(p.id)}
                        className="flex-1 px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium"
                      >
                        Completar prueba
                      </button>
                      <button
                        onClick={() => { setPruebaCancelarId(p.id); setMostrarDialogoCancelarPrueba(true); }}
                        className="flex-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pendientes / solicitud de cambio */}
          {activasPruebas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-600 mb-3">Otras pruebas</h3>
              <div className="space-y-3">
                {activasPruebas.map(p => (
                  <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-900">{p.nombre}</div>
                      {p.descripcion && <div className="text-xs text-gray-500 mt-0.5">{p.descripcion}</div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <EntrevistaBadge estado={p.estado} />
                      <ModalidadBadge modalidad={p.modalidad} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CalendarIcon /><span>{formatFecha(p.fecha)}</span>
                        <ClockIcon /><span>{formatHora(p.hora)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MapPinIcon />
                        <span>{p.modalidad === "virtual" ? "Enlace: " : "Lugar: "}{p.lugar}</span>
                      </div>
                      {p.estado === "solicitud de cambio" && p.motivo && (
                        <>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-neutral-400 mb-1">Motivo de solicitud:</div>
                            <div className="text-sm text-gray-700 italic">"{p.motivo}"</div>
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={() => handleReagendarPrueba(p)}
                              className="px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium"
                            >
                              Reagendar prueba
                            </button>
                          </div>
                        </>
                      )}
                      {p.estado === "pendiente" && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleEditarPrueba(p)}
                            className="px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 transition-colors font-medium"
                          >
                            Editar prueba
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          {historialPruebas.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setHistorialPruebasAbierto(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors group focus:outline-none"
              >
                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                  Historial
                  <span className="ml-2 text-neutral-400 font-normal">({historialPruebas.length})</span>
                </span>
                <ChevronDownIcon open={historialPruebasAbierto} />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  historialPruebasAbierto ? "max-h-1000 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 space-y-3">
                  {historialPruebas.map(p => (
                    <div key={p.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-gray-900">{p.nombre}</div>
                        {p.descripcion && <div className="text-xs text-gray-500 mt-0.5">{p.descripcion}</div>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <EntrevistaBadge estado={p.estado} />
                        <ModalidadBadge modalidad={p.modalidad} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <CalendarIcon /><span>{formatFecha(p.fecha)}</span>
                          <ClockIcon /><span>{formatHora(p.hora)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPinIcon />
                          <span>{p.modalidad === "virtual" ? "Enlace: " : "Lugar: "}{p.lugar}</span>
                        </div>
                        {p.estado === "cancelada" && p.motivo && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-semibold text-neutral-400 mb-1">Motivo de cancelación:</div>
                            <div className="text-sm text-gray-700 italic">"{p.motivo}"</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cargandoPruebas ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400">
              <Spinner />
              Cargando pruebas...
            </div>
          ) : pruebas.length === 0 && (
            <p className="text-center py-8 text-sm text-neutral-400">No hay pruebas registradas.</p>
          )}
        </div>

        {/* Tabla criterios */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in-up delay-400">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Criterios de evaluación
            </h2>
            <button
              onClick={cargarCriterios}
              disabled={cargandoCriterios}
              title="Recargar criterios"
              className="p-2 text-neutral-400 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargandoCriterios ? <Spinner /> : <RefreshIcon />}
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Criterio</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Puntaje Máximo</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Puntaje obtenido</th>
                <th className="py-4 w-36" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cargandoCriterios ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-400">
                      <Spinner />
                      Cargando criterios...
                    </div>
                  </td>
                </tr>
              ) : criterios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-neutral-400">
                    No hay criterios de evaluación registrados.
                  </td>
                </tr>
              ) : (
                criterios.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{c.nombre}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{c.peso}</td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={c.peso}
                        step="0.1"
                        value={c.puntaje ?? ""}
                        onChange={e => handlePuntajeChange(c.id, e.target.value)}
                        placeholder="-"
                        disabled={cargandoGuardar || cargandoLimpiar === c.id}
                        className="w-24 text-sm text-center text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 outline-none transition hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="py-4 w-36 text-center">
                      <button
                        onClick={() => handleLimpiarCriterio(c.id)}
                        disabled={cargandoGuardar || cargandoLimpiar === c.id || c.puntajeGuardado === null}
                        className="inline-flex items-center justify-center gap-1.5 w-24 px-3 py-2 text-neutral-400 enabled:hover:text-red-700 border border-gray-200 rounded-lg enabled:hover:bg-red-50 enabled:hover:border-red-200 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cargandoLimpiar === c.id ? <Spinner /> : <><BroomIcon />Limpiar</>}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {criterios.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">Total</td>
                  <td />
                  <td className="px-6 py-4 text-center">
                    {criterios.every(c => c.puntajeGuardado === null)
                      ? <span className="text-lg font-bold text-neutral-400">—</span>
                      : <span className="text-lg font-bold text-red-700">{puntajeTotalBackend.toFixed(1)}</span>
                    }
                  </td>
                  <td className="w-36" />
                </tr>
              </tfoot>
            )}
          </table>
          </div>
          <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-4">
            <button
              onClick={() => { (document.activeElement as HTMLElement)?.blur(); setMostrarConfirmarGuardar(true); }}
              disabled={cargandoGuardar || criterios.length === 0 || criterios.every(c => c.puntaje === null)}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-700 text-white text-sm rounded-lg enabled:hover:bg-red-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargandoGuardar ? <><Spinner />Guardando...</> : "Guardar calificación"}
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Agendar / Reagendar entrevista */}
      {mostrarFormulario && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoFormulario ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full mx-4 ${cerrandoFormulario ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {entrevistaEditando
                  ? (modoEdicionEntrevista === "editar" ? "Editar entrevista" : "Reagendar entrevista")
                  : "Agendar entrevista"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  id="fechaEntrevista"
                  label="Fecha"
                  value={nuevaEntrevista.fecha}
                  onChange={(value) => {
                    setNuevaEntrevista(p => ({ ...p, fecha: value }));
                    setErroresAgendar(p => ({ ...p, fecha: undefined }));
                  }}
                  error={erroresAgendar.fecha}
                />
                <TimePicker
                  id="horaEntrevista"
                  label="Hora"
                  value={nuevaEntrevista.hora}
                  onChange={(value) => {
                    setNuevaEntrevista(p => ({ ...p, hora: value }));
                    setErroresAgendar(p => ({ ...p, hora: undefined }));
                  }}
                  error={erroresAgendar.hora}
                  disabled={cargandoEntrevista}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Modalidad</label>
                <div className="mt-1 flex gap-4">
                  {(["virtual", "presencial"] as const).map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="modalidad"
                        value={m}
                        checked={nuevaEntrevista.modalidad === m}
                        onChange={() => setNuevaEntrevista(p => ({ ...p, modalidad: m, lugar: "" }))}
                        disabled={cargandoEntrevista}
                        className="accent-red-700 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  {nuevaEntrevista.modalidad === "virtual" ? "Enlace virtual" : "Lugar"}
                </label>
                <input
                  type="text"
                  value={nuevaEntrevista.lugar}
                  onChange={e => {
                    setNuevaEntrevista(p => ({ ...p, lugar: e.target.value }));
                    setErroresAgendar(p => ({ ...p, lugar: undefined }));
                  }}
                  placeholder={nuevaEntrevista.modalidad === "virtual" ? "meet.google.com/xxx" : "Edificio, Sala..."}
                  disabled={cargandoEntrevista}
                  className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${erroresAgendar.lugar ? "border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200"}`}
                />
                {erroresAgendar.lugar && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">{erroresAgendar.lugar}</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarModalAgendar}
                disabled={cargandoEntrevista}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgendar}
                disabled={cargandoEntrevista}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoEntrevista
                  ? <><Spinner />{entrevistaEditando ? (modoEdicionEntrevista === "editar" ? "Guardando..." : "Reagendando...") : "Agendando..."}</>
                  : (entrevistaEditando ? (modoEdicionEntrevista === "editar" ? "Guardar cambios" : "Reagendar") : "Agendar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar guardar calificación */}
      {mostrarConfirmarGuardar && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoConfirmarGuardar ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${cerrandoConfirmarGuardar ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar calificación</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Está seguro de guardar las calificaciones para este aspirante? Esta acción actualizará el puntaje registrado.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarConfirmarGuardar}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCalificacion}
                className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium text-center"
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancelar entrevista */}
      {mostrarDialogoCancelar && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoDialogoCancelar ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full mx-4 ${cerrandoDialogoCancelar ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cancelar entrevista</h3>
            </div>
            <div className="p-6">
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Motivo de cancelación <span className="text-red-700">*</span>
              </label>
              <textarea
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                placeholder="Ingrese el motivo por el cual se cancela la entrevista..."
                rows={4}
                disabled={cargandoCancelar}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition resize-none hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!motivoCancelacion.trim() && (
                <p className="text-xs text-neutral-400 mt-1">El motivo es obligatorio para cancelar.</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarDialogoCancelar}
                disabled={cargandoCancelar}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Volver
              </button>
              <button
                onClick={handleCancelarConfirmada}
                disabled={!motivoCancelacion.trim() || cargandoCancelar}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoCancelar ? <><Spinner />Cancelando...</> : "Cancelar entrevista"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear / Reagendar prueba */}
      {mostrarFormularioPrueba && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoFormularioPrueba ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full mx-4 ${cerrandoFormularioPrueba ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {pruebaEditando
                  ? (modoEdicionPrueba === "editar" ? "Editar prueba" : "Reagendar prueba")
                  : "Crear prueba"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {(!pruebaEditando || modoEdicionPrueba === "editar") && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Nombre</label>
                    <input
                      type="text"
                      value={nuevaPrueba.nombre}
                      onChange={e => {
                        setNuevaPrueba(p => ({ ...p, nombre: e.target.value }));
                        setErroresPrueba(p => ({ ...p, nombre: undefined }));
                      }}
                      placeholder="Nombre de la prueba"
                      disabled={cargandoPrueba}
                      className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${erroresPrueba.nombre ? "border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200"}`}
                    />
                    {erroresPrueba.nombre && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">{erroresPrueba.nombre}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Descripción</label>
                    <textarea
                      value={nuevaPrueba.descripcion}
                      onChange={e => {
                        setNuevaPrueba(p => ({ ...p, descripcion: e.target.value }));
                        setErroresPrueba(p => ({ ...p, descripcion: undefined }));
                      }}
                      placeholder="Descripción de la prueba"
                      rows={3}
                      disabled={cargandoPrueba}
                      className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition resize-none disabled:opacity-50 disabled:cursor-not-allowed ${erroresPrueba.descripcion ? "border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200"}`}
                    />
                    {erroresPrueba.descripcion && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">{erroresPrueba.descripcion}</p>
                    )}
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  id="fechaPrueba"
                  label="Fecha"
                  value={nuevaPrueba.fecha}
                  onChange={(value) => {
                    setNuevaPrueba(p => ({ ...p, fecha: value }));
                    setErroresPrueba(p => ({ ...p, fecha: undefined }));
                  }}
                  error={erroresPrueba.fecha}
                />
                <TimePicker
                  id="horaPrueba"
                  label="Hora"
                  value={nuevaPrueba.hora}
                  onChange={(value) => {
                    setNuevaPrueba(p => ({ ...p, hora: value }));
                    setErroresPrueba(p => ({ ...p, hora: undefined }));
                  }}
                  error={erroresPrueba.hora}
                  disabled={cargandoPrueba}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Modalidad</label>
                <div className="mt-1 flex gap-4">
                  {(["virtual", "presencial"] as const).map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="modalidadPrueba"
                        value={m}
                        checked={nuevaPrueba.modalidad === m}
                        onChange={() => setNuevaPrueba(p => ({ ...p, modalidad: m, lugar: "" }))}
                        disabled={cargandoPrueba}
                        className="accent-red-700 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">
                  {nuevaPrueba.modalidad === "virtual" ? "Enlace virtual" : "Lugar"}
                </label>
                <input
                  type="text"
                  value={nuevaPrueba.lugar}
                  onChange={e => {
                    setNuevaPrueba(p => ({ ...p, lugar: e.target.value }));
                    setErroresPrueba(p => ({ ...p, lugar: undefined }));
                  }}
                  placeholder={nuevaPrueba.modalidad === "virtual" ? "meet.google.com/xxx" : "Edificio, Sala..."}
                  disabled={cargandoPrueba}
                  className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${erroresPrueba.lugar ? "border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200"}`}
                />
                {erroresPrueba.lugar && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">{erroresPrueba.lugar}</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarModalPrueba}
                disabled={cargandoPrueba}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearPrueba}
                disabled={cargandoPrueba}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoPrueba
                  ? <><Spinner />{pruebaEditando ? (modoEdicionPrueba === "editar" ? "Guardando..." : "Reagendando...") : "Creando..."}</>
                  : (pruebaEditando ? (modoEdicionPrueba === "editar" ? "Guardar cambios" : "Reagendar") : "Crear")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar completar entrevista */}
      {mostrarConfirmarCompletar && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoConfirmarCompletar ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${cerrandoConfirmarCompletar ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Completar reunión</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Está seguro de marcar esta entrevista como completada? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarConfirmarCompletar}
                disabled={cargandoCompletar}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompletarReunionConfirmado}
                disabled={cargandoCompletar}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoCompletar ? <><Spinner />Completando...</> : "Sí, completar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar completar prueba */}
      {mostrarConfirmarCompletarPrueba && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoConfirmarCompletarPrueba ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${cerrandoConfirmarCompletarPrueba ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Completar prueba</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Está seguro de marcar esta prueba como completada? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarConfirmarCompletarPrueba}
                disabled={cargandoCompletarPrueba}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompletarPruebaConfirmado}
                disabled={cargandoCompletarPrueba}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoCompletarPrueba ? <><Spinner />Completando...</> : "Sí, completar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar limpiar criterio */}
      {mostrarConfirmarLimpiar && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoConfirmarLimpiar ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full mx-4 ${cerrandoConfirmarLimpiar ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Limpiar calificación</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700">
                ¿Está seguro de limpiar la calificación de este criterio? El puntaje obtenido será eliminado.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarConfirmarLimpiar}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center"
              >
                Cancelar
              </button>
              <button
                onClick={handleLimpiarCriterioConfirmado}
                className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium text-center"
              >
                Sí, limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancelar prueba */}
      {mostrarDialogoCancelarPrueba && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${cerrandoDialogoCancelarPrueba ? "animate-overlay-out" : "animate-overlay-in"}`}>
          <div className={`bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full mx-4 ${cerrandoDialogoCancelarPrueba ? "animate-modal-out" : "animate-modal-in"}`}>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cancelar prueba</h3>
            </div>
            <div className="p-6">
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Motivo de cancelación <span className="text-red-700">*</span>
              </label>
              <textarea
                value={motivoCancelacionPrueba}
                onChange={e => setMotivoCancelacionPrueba(e.target.value)}
                placeholder="Ingrese el motivo por el cual se cancela la prueba..."
                rows={4}
                disabled={cargandoCancelarPrueba}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition resize-none hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {!motivoCancelacionPrueba.trim() && (
                <p className="text-xs text-neutral-400 mt-1">El motivo es obligatorio para cancelar.</p>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cerrarDialogoCancelarPrueba}
                disabled={cargandoCancelarPrueba}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium text-center disabled:opacity-60"
              >
                Volver
              </button>
              <button
                onClick={handleCancelarPruebaConfirmada}
                disabled={!motivoCancelacionPrueba.trim() || cargandoCancelarPrueba}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargandoCancelarPrueba ? <><Spinner />Cancelando...</> : "Cancelar prueba"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
