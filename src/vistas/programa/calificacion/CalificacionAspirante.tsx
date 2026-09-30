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
import { DialogoConfirmacion } from "../../../components/Dialogo";
import SeccionAgenda from "./SeccionAgenda";
import { ArrowLeftIcon, BroomIcon, RefreshIcon, SpinnerIcon } from "../../../assets/icons";

// ── Íconos (Heroicons) ────────────────────────────────────────────────────────

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
          <ArrowLeftIcon className="h-4.5 w-4.5 shrink-0" />
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
              <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
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
        <SeccionAgenda
          titulo="Entrevistas"
          singular="entrevista"
          items={entrevistas}
          cargando={cargandoEntrevistas}
          onRecargar={cargarEntrevistas}
          textoNuevo="Agendar entrevista"
          onNuevo={() => {
            setEntrevistaEditando(null);
            setNuevaEntrevista({ fecha: "", hora: "", modalidad: "virtual", lugar: "" });
            setErroresAgendar({});
            setMostrarFormulario(true);
          }}
          textoCompletar="Completar reunión"
          onCompletar={handleCompletarReunion}
          onCancelar={(id) => { setEntrevistaCancelarId(id); setMostrarDialogoCancelar(true); }}
          onReagendar={handleReagendar}
          onEditar={handleEditarEntrevista}
          mensajeVacio="No hay entrevistas agendadas."
          className="delay-300"
        />

        {/* Sección pruebas */}
        <SeccionAgenda
          titulo="Pruebas"
          singular="prueba"
          items={pruebas}
          cargando={cargandoPruebas}
          onRecargar={cargarPruebas}
          textoNuevo="Crear prueba"
          onNuevo={() => {
            setPruebaEditando(null);
            setNuevaPrueba({ nombre: "", descripcion: "", fecha: "", hora: "", modalidad: "virtual", lugar: "" });
            setErroresPrueba({});
            setMostrarFormularioPrueba(true);
          }}
          textoCompletar="Completar prueba"
          onCompletar={handleCompletarPrueba}
          onCancelar={(id) => { setPruebaCancelarId(id); setMostrarDialogoCancelarPrueba(true); }}
          onReagendar={handleReagendarPrueba}
          onEditar={handleEditarPrueba}
          mensajeVacio="No hay pruebas registradas."
          className="delay-300"
        />

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
              {cargandoCriterios ? <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" /> : <RefreshIcon />}
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
                      <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />
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
                        {cargandoLimpiar === c.id ? <SpinnerIcon className="animate-spin h-4 w-4 shrink-0" /> : <><BroomIcon />Limpiar</>}
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
              {cargandoGuardar ? <><SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />Guardando...</> : "Guardar calificación"}
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Agendar / Reagendar entrevista */}
      <DialogoConfirmacion
        abierto={mostrarFormulario}
        cerrando={cerrandoFormulario}
        tamano="lg"
        titulo={entrevistaEditando
          ? (modoEdicionEntrevista === "editar" ? "Editar entrevista" : "Reagendar entrevista")
          : "Agendar entrevista"}
        onCancelar={cerrarModalAgendar}
        onConfirmar={handleAgendar}
        textoConfirmar={entrevistaEditando ? (modoEdicionEntrevista === "editar" ? "Guardar cambios" : "Reagendar") : "Agendar"}
        textoProcesando={entrevistaEditando ? (modoEdicionEntrevista === "editar" ? "Guardando..." : "Reagendando...") : "Agendando..."}
        procesando={cargandoEntrevista}
      >
        <CamposAgenda
          idPrefijo="Entrevista"
          valores={nuevaEntrevista}
          errores={erroresAgendar}
          deshabilitado={cargandoEntrevista}
          onCambio={(campo, valor) => {
            setNuevaEntrevista(p => ({ ...p, [campo]: valor, ...(campo === "modalidad" ? { lugar: "" } : {}) }));
            setErroresAgendar(p => ({ ...p, [campo]: undefined }));
          }}
        />
      </DialogoConfirmacion>

      {/* Modal: Confirmar guardar calificación */}
      <DialogoConfirmacion
        abierto={mostrarConfirmarGuardar}
        cerrando={cerrandoConfirmarGuardar}
        titulo="Confirmar calificación"
        onCancelar={cerrarConfirmarGuardar}
        onConfirmar={handleGuardarCalificacion}
        textoConfirmar="Sí, guardar"
      >
        ¿Está seguro de guardar las calificaciones para este aspirante? Esta acción actualizará el puntaje registrado.
      </DialogoConfirmacion>

      {/* Modal: Cancelar entrevista */}
      <DialogoConfirmacion
        abierto={mostrarDialogoCancelar}
        cerrando={cerrandoDialogoCancelar}
        tamano="lg"
        titulo="Cancelar entrevista"
        onCancelar={cerrarDialogoCancelar}
        onConfirmar={handleCancelarConfirmada}
        textoCancelar="Volver"
        textoConfirmar="Cancelar entrevista"
        textoProcesando="Cancelando..."
        procesando={cargandoCancelar}
        confirmarDeshabilitado={!motivoCancelacion.trim()}
      >
        <CampoMotivoCancelacion
          valor={motivoCancelacion}
          onCambio={setMotivoCancelacion}
          placeholder="Ingrese el motivo por el cual se cancela la entrevista..."
          deshabilitado={cargandoCancelar}
        />
      </DialogoConfirmacion>

      {/* Modal: Crear / Reagendar prueba */}
      <DialogoConfirmacion
        abierto={mostrarFormularioPrueba}
        cerrando={cerrandoFormularioPrueba}
        tamano="lg"
        titulo={pruebaEditando
          ? (modoEdicionPrueba === "editar" ? "Editar prueba" : "Reagendar prueba")
          : "Crear prueba"}
        onCancelar={cerrarModalPrueba}
        onConfirmar={handleCrearPrueba}
        textoConfirmar={pruebaEditando ? (modoEdicionPrueba === "editar" ? "Guardar cambios" : "Reagendar") : "Crear"}
        textoProcesando={pruebaEditando ? (modoEdicionPrueba === "editar" ? "Guardando..." : "Reagendando...") : "Creando..."}
        procesando={cargandoPrueba}
      >
        <div className="space-y-4">
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
                  className={claseCampo(!!erroresPrueba.nombre)}
                />
                <ErrorCampo mensaje={erroresPrueba.nombre} />
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
                  className={`${claseCampo(!!erroresPrueba.descripcion)} resize-none`}
                />
                <ErrorCampo mensaje={erroresPrueba.descripcion} />
              </div>
            </>
          )}
          <CamposAgenda
            idPrefijo="Prueba"
            valores={nuevaPrueba}
            errores={erroresPrueba}
            deshabilitado={cargandoPrueba}
            onCambio={(campo, valor) => {
              setNuevaPrueba(p => ({ ...p, [campo]: valor, ...(campo === "modalidad" ? { lugar: "" } : {}) }));
              setErroresPrueba(p => ({ ...p, [campo]: undefined }));
            }}
          />
        </div>
      </DialogoConfirmacion>

      {/* Modal: Confirmar completar entrevista */}
      <DialogoConfirmacion
        abierto={mostrarConfirmarCompletar}
        cerrando={cerrandoConfirmarCompletar}
        titulo="Completar reunión"
        onCancelar={cerrarConfirmarCompletar}
        onConfirmar={handleCompletarReunionConfirmado}
        textoConfirmar="Sí, completar"
        textoProcesando="Completando..."
        procesando={cargandoCompletar}
      >
        ¿Está seguro de marcar esta entrevista como completada? Esta acción no se puede deshacer.
      </DialogoConfirmacion>

      {/* Modal: Confirmar completar prueba */}
      <DialogoConfirmacion
        abierto={mostrarConfirmarCompletarPrueba}
        cerrando={cerrandoConfirmarCompletarPrueba}
        titulo="Completar prueba"
        onCancelar={cerrarConfirmarCompletarPrueba}
        onConfirmar={handleCompletarPruebaConfirmado}
        textoConfirmar="Sí, completar"
        textoProcesando="Completando..."
        procesando={cargandoCompletarPrueba}
      >
        ¿Está seguro de marcar esta prueba como completada? Esta acción no se puede deshacer.
      </DialogoConfirmacion>

      {/* Modal: Confirmar limpiar criterio */}
      <DialogoConfirmacion
        abierto={mostrarConfirmarLimpiar}
        cerrando={cerrandoConfirmarLimpiar}
        titulo="Limpiar calificación"
        onCancelar={cerrarConfirmarLimpiar}
        onConfirmar={handleLimpiarCriterioConfirmado}
        textoConfirmar="Sí, limpiar"
      >
        ¿Está seguro de limpiar la calificación de este criterio? El puntaje obtenido será eliminado.
      </DialogoConfirmacion>

      {/* Modal: Cancelar prueba */}
      <DialogoConfirmacion
        abierto={mostrarDialogoCancelarPrueba}
        cerrando={cerrandoDialogoCancelarPrueba}
        tamano="lg"
        titulo="Cancelar prueba"
        onCancelar={cerrarDialogoCancelarPrueba}
        onConfirmar={handleCancelarPruebaConfirmada}
        textoCancelar="Volver"
        textoConfirmar="Cancelar prueba"
        textoProcesando="Cancelando..."
        procesando={cargandoCancelarPrueba}
        confirmarDeshabilitado={!motivoCancelacionPrueba.trim()}
      >
        <CampoMotivoCancelacion
          valor={motivoCancelacionPrueba}
          onCambio={setMotivoCancelacionPrueba}
          placeholder="Ingrese el motivo por el cual se cancela la prueba..."
          deshabilitado={cargandoCancelarPrueba}
        />
      </DialogoConfirmacion>
    </div>
  );
}

// ── Campos compartidos de los formularios de entrevista y prueba ─────────────

function claseCampo(conError: boolean) {
  return `mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${conError ? "border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200"}`;
}

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">{mensaje}</p>;
}

type CampoAgenda = "fecha" | "hora" | "modalidad" | "lugar";

interface CamposAgendaProps {
  /** Sufijo para los id/name de los campos ("Entrevista", "Prueba"). */
  idPrefijo: string;
  valores: { fecha: string; hora: string; modalidad: "virtual" | "presencial"; lugar: string };
  errores: Partial<Record<CampoAgenda, string>>;
  deshabilitado: boolean;
  onCambio: (campo: CampoAgenda, valor: string) => void;
}

/** Fecha, hora, modalidad y lugar/enlace de una entrevista o prueba. */
function CamposAgenda({ idPrefijo, valores, errores, deshabilitado, onCambio }: CamposAgendaProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <DatePicker
          id={`fecha${idPrefijo}`}
          label="Fecha"
          value={valores.fecha}
          onChange={(value) => onCambio("fecha", value)}
          error={errores.fecha}
        />
        <TimePicker
          id={`hora${idPrefijo}`}
          label="Hora"
          value={valores.hora}
          onChange={(value) => onCambio("hora", value)}
          error={errores.hora}
          disabled={deshabilitado}
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1 block">Modalidad</label>
        <div className="mt-1 flex gap-4">
          {(["virtual", "presencial"] as const).map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`modalidad${idPrefijo}`}
                value={m}
                checked={valores.modalidad === m}
                onChange={() => onCambio("modalidad", m)}
                disabled={deshabilitado}
                className="accent-red-700 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-700 capitalize">{m}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-1 block">
          {valores.modalidad === "virtual" ? "Enlace virtual" : "Lugar"}
        </label>
        <input
          type="text"
          value={valores.lugar}
          onChange={e => onCambio("lugar", e.target.value)}
          placeholder={valores.modalidad === "virtual" ? "meet.google.com/xxx" : "Edificio, Sala..."}
          disabled={deshabilitado}
          className={claseCampo(!!errores.lugar)}
        />
        <ErrorCampo mensaje={errores.lugar} />
      </div>
    </div>
  );
}

interface CampoMotivoCancelacionProps {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder: string;
  deshabilitado: boolean;
}

function CampoMotivoCancelacion({ valor, onCambio, placeholder, deshabilitado }: CampoMotivoCancelacionProps) {
  return (
    <>
      <label className="text-sm font-semibold text-gray-700 mb-1 block">
        Motivo de cancelación <span className="text-red-700">*</span>
      </label>
      <textarea
        value={valor}
        onChange={e => onCambio(e.target.value)}
        placeholder={placeholder}
        rows={4}
        disabled={deshabilitado}
        className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition resize-none hover:border-gray-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {!valor.trim() && (
        <p className="text-xs text-neutral-400 mt-1">El motivo es obligatorio para cancelar.</p>
      )}
    </>
  );
}
