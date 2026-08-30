import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router';
import { Modal } from './components/Modal';
import { SelectSA } from './components/SelectSA';
import { DatePickerSA } from './components/DatePickerSA';
import type { SuperadminOutletContext } from '../../layouts/SuperadminLayout';
import {
  superadminFacultadesService,
  superadminProgramasService,
  superadminCohortesService,
  superadminSemestresService,
  superadminModalidadesService,
  superadminPlazosService,
  superadminSedesService,
  superadminOtrosValoresService,
  type FacultadOutput,
  type ProgramaOutput,
  type CohorteOutput,
  type EstadoOutput,
  type SemestreOutput,
  type ModalidadOutput,
  type PlazoOutput,
  type SedeOutput,
  type OtrosValoresOutput,
} from '../../services/superadmin/superadminCohortesService';
import { superadminDocumentosService } from '../../services/superadmin/superadminDocumentosService';
import { AcademicCapIcon, BuildingLibraryIcon, ChevronRightIcon, PencilIcon, SpinnerIcon, TrashIcon } from "../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function FolderPlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

// ── Tipos de formulario ───────────────────────────────────────────────────────

type FacultadForm = {
  nombre: string;
  correo: string;
};

type ProgramaForm = {
  codigo: number | '';
  nombre: string;
  duracion: number | '';
  correo: string;
  registrosnies: string;
  nivelformacion: string;
  titulo: string;
  rcmineducacion: string;
  creditos: number | '';
  periodicidad: string;
  valormatricula: number | '';
  idSede: number | '';
  idTiporegistro: number | '';
  idModalidad: number | '';
  idFacultad: number | '';
  idOtros: number | '';
};

type PlazoDates = { fechainicio: string; fechafin: string };

type CohorteForm = {
  nombre: string;
  cupos: number | '';
  idEstado: number | '';
  idSemestre: number | '';
  idModalidad: number | '';
  plazodocumentacion: PlazoDates;
  plazoinscripcion: PlazoDates;
  plazopago: PlazoDates;
};

const EMPTY_FAC: FacultadForm = { nombre: '', correo: '' };
const EMPTY_PROG: ProgramaForm = {
  codigo: '', nombre: '', duracion: '', correo: '', registrosnies: '',
  nivelformacion: '', titulo: '', rcmineducacion: '', creditos: '',
  periodicidad: '', valormatricula: '', idSede: '', idTiporegistro: '',
  idModalidad: '', idFacultad: '', idOtros: '',
};
const EMPTY_PLAZO: PlazoDates = { fechainicio: '', fechafin: '' };

const EMPTY_COH: CohorteForm = {
  nombre: '', cupos: '',
  idEstado: '', idSemestre: '', idModalidad: '',
  plazodocumentacion: { ...EMPTY_PLAZO },
  plazoinscripcion:   { ...EMPTY_PLAZO },
  plazopago:          { ...EMPTY_PLAZO },
};

// ── CohorteCard ───────────────────────────────────────────────────────────────

interface CohorteCardProps {
  cohorte: CohorteOutput;
  onEdit: (c: CohorteOutput, e: React.MouseEvent) => void;
  onDelete: (c: CohorteOutput, e: React.MouseEvent) => void;
}

function CohorteCard({ cohorte, onEdit, onDelete }: CohorteCardProps) {
  const estadoLabel = typeof cohorte.estado === 'object' && cohorte.estado !== null
    ? cohorte.estado.tipo
    : cohorte.estado;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className="bg-slate-900 p-2 rounded-lg shrink-0 text-white mt-0.5">
          <UsersIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">{cohorte.nombre}</h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span><span className="font-medium text-gray-700">Cupos:</span> {cohorte.cupos}</span>
            {cohorte.modalidad?.nombre && (
              <><span>·</span><span><span className="font-medium text-gray-700">Modalidad:</span> {cohorte.modalidad.nombre}</span></>
            )}
            {cohorte.semestre?.nombre && (
              <><span>·</span><span><span className="font-medium text-gray-700">Semestre:</span> {cohorte.semestre.nombre}</span></>
            )}
            {estadoLabel && (
              <><span>·</span><span><span className="font-medium text-gray-700">Estado:</span> {estadoLabel}</span></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => onEdit(cohorte, e)} title="Editar cohorte"
            className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <PencilIcon />
          </button>
          <button onClick={(e) => onDelete(cohorte, e)} title="Eliminar cohorte"
            className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProgramaItem ──────────────────────────────────────────────────────────────

interface ProgramaItemProps {
  programa: ProgramaOutput;
  cohortes: CohorteOutput[];
  onEdit: (p: ProgramaOutput, e: React.MouseEvent) => void;
  onDelete: (p: ProgramaOutput, e: React.MouseEvent) => void;
  onAddCohorte: (programaId: number, e: React.MouseEvent) => void;
  onEditCohorte: (c: CohorteOutput, e: React.MouseEvent) => void;
  onDeleteCohorte: (c: CohorteOutput, e: React.MouseEvent) => void;
}

function ProgramaItem({
  programa, cohortes, onEdit, onDelete,
  onAddCohorte, onEditCohorte, onDeleteCohorte,
}: ProgramaItemProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animClass, setAnimClass] = useState('animate-accordion-open');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = () => {
    if (!open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setVisible(true);
      setAnimClass('animate-accordion-open');
      setOpen(true);
    } else {
      setAnimClass('animate-accordion-close');
      setOpen(false);
      closeTimer.current = setTimeout(() => setVisible(false), 340);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className={['flex items-center justify-between px-5 py-3.5 transition-colors duration-200', open ? 'bg-slate-800 text-white' : 'bg-gray-50 text-gray-900'].join(' ')}>
        <button onClick={toggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <span className={open ? 'text-slate-300' : 'text-gray-400'}><AcademicCapIcon /></span>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{programa.nombre}</div>
            <div className={`text-xs ${open ? 'text-slate-300' : 'text-gray-400'}`}>
              Cód. {programa.codigo}
              {programa.nivelformacion ? ` · ${programa.nivelformacion}` : ''}
              {programa.sede?.nombre ? ` · Sede: ${programa.sede.nombre}` : ''}
              {` · ${cohortes.length} cohorte${cohortes.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button onClick={(e) => onEdit(programa, e)} title="Editar programa"
            className={`p-1.5 rounded-lg transition-colors ${open ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-200'}`}>
            <PencilIcon />
          </button>
          <button onClick={(e) => onDelete(programa, e)} title="Eliminar programa"
            className={`p-1.5 rounded-lg transition-colors ${open ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-200'}`}>
            <TrashIcon />
          </button>
          <button onClick={toggle}
            className={`p-1.5 rounded-lg transition-colors ${open ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:bg-gray-200'}`}>
            <ChevronRightIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`} />
          </button>
        </div>
      </div>

      {visible && (
        <div className={animClass}>
          <div className="border-t border-gray-200 bg-white p-4 space-y-3">
            <button
              onClick={(e) => onAddCohorte(programa.id, e)}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <PlusIcon />Nueva Cohorte
            </button>

            {cohortes.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay cohortes registradas en este programa</p>
            )}

            {cohortes.map((c) => (
              <CohorteCard
                key={c.id}
                cohorte={c}
                onEdit={onEditCohorte}
                onDelete={onDeleteCohorte}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FacultadItem ──────────────────────────────────────────────────────────────

interface FacultadItemProps {
  facultad: FacultadOutput;
  programas: ProgramaOutput[];
  cohortes: CohorteOutput[];
  delay: string;
  onEditFacultad: (f: FacultadOutput, e: React.MouseEvent) => void;
  onDeleteFacultad: (f: FacultadOutput, e: React.MouseEvent) => void;
  onAddPrograma: (facultadId: number, e: React.MouseEvent) => void;
  onEditPrograma: (p: ProgramaOutput, e: React.MouseEvent) => void;
  onDeletePrograma: (p: ProgramaOutput, e: React.MouseEvent) => void;
  onAddCohorte: (programaId: number, e: React.MouseEvent) => void;
  onEditCohorte: (c: CohorteOutput, e: React.MouseEvent) => void;
  onDeleteCohorte: (c: CohorteOutput, e: React.MouseEvent) => void;
}

function FacultadItem({
  facultad, programas, cohortes, delay,
  onEditFacultad, onDeleteFacultad,
  onAddPrograma, onEditPrograma, onDeletePrograma,
  onAddCohorte, onEditCohorte, onDeleteCohorte,
}: FacultadItemProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animClass, setAnimClass] = useState('animate-accordion-open');
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = () => {
    if (!open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setVisible(true);
      setAnimClass('animate-accordion-open');
      setOpen(true);
    } else {
      setAnimClass('animate-accordion-close');
      setOpen(false);
      closeTimer.current = setTimeout(() => setVisible(false), 340);
    }
  };

  return (
    <div className={`animate-fade-in-up ${delay} border border-gray-200 rounded-lg overflow-hidden bg-white`}>
      <div className={['flex items-center justify-between px-5 py-4 transition-colors duration-200', open ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'].join(' ')}>
        <button onClick={toggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <span className={open ? 'text-slate-300' : 'text-gray-400'}><BuildingLibraryIcon /></span>
          <div className="min-w-0">
            <div className="font-semibold">{facultad.nombre}</div>
            <div className={`text-xs ${open ? 'text-slate-300' : 'text-gray-400'}`}>
              {facultad.correo}
              {` · ${programas.length} programa${programas.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button onClick={(e) => onEditFacultad(facultad, e)} title="Editar facultad"
            className={`p-2 rounded-lg transition-colors ${open ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100'}`}>
            <PencilIcon />
          </button>
          <button onClick={(e) => onDeleteFacultad(facultad, e)} title="Eliminar facultad"
            className={`p-2 rounded-lg transition-colors ${open ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100'}`}>
            <TrashIcon />
          </button>
          <button onClick={toggle}
            className={`p-2 rounded-lg transition-colors ${open ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:bg-gray-100'}`}>
            <ChevronRightIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`} />
          </button>
        </div>
      </div>

      {visible && (
        <div className={animClass}>
          <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
            <button
              onClick={(e) => onAddPrograma(facultad.id, e)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <PlusIcon />Nuevo Programa
            </button>

            {programas.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay programas en esta facultad</p>
            )}

            {programas.map((p) => (
              <ProgramaItem
                key={p.id}
                programa={p}
                cohortes={cohortes.filter((c) => c.idPrograma === p.id)}
                onEdit={onEditPrograma}
                onDelete={onDeletePrograma}
                onAddCohorte={onAddCohorte}
                onEditCohorte={onEditCohorte}
                onDeleteCohorte={onDeleteCohorte}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SuperadminCohortes() {
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<SuperadminOutletContext>();

  // ── Datos ─────────────────────────────────────────────────────────────────
  const [facultades, setFacultades]       = useState<FacultadOutput[]>([]);
  const [programas, setProgramas]         = useState<ProgramaOutput[]>([]);
  const [cohortes, setCohortes]           = useState<CohorteOutput[]>([]);
  const [estados, setEstados]             = useState<EstadoOutput[]>([]);
  const [semestres, setSemestres]         = useState<SemestreOutput[]>([]);
  const [modalidades, setModalidades]     = useState<ModalidadOutput[]>([]);
  const [plazos, setPlazos]               = useState<PlazoOutput[]>([]);
  const [sedes, setSedes]                 = useState<SedeOutput[]>([]);
  const [otrosValores, setOtrosValores]   = useState<OtrosValoresOutput[]>([]);
  const [loading, setLoading] = useState(true);

  const tiporegistros = useMemo(() => {
    const map = new Map<number, { id: number; tipo: string }>();
    programas.forEach((p) => { if (p.tiporegistro) map.set(p.tiporegistro.id, p.tiporegistro); });
    return [...map.values()];
  }, [programas]);

  // ── Modal: Facultad ───────────────────────────────────────────────────────
  const [showFacModal, setShowFacModal]     = useState(false);
  const [editingFac, setEditingFac]         = useState<FacultadOutput | null>(null);
  const [facForm, setFacForm]               = useState<FacultadForm>(EMPTY_FAC);
  const [facSubmitting, setFacSubmitting]   = useState(false);
  const [facFormError, setFacFormError]     = useState<string | null>(null);

  const [showDelFacModal, setShowDelFacModal] = useState(false);
  const [facToDelete, setFacToDelete]         = useState<FacultadOutput | null>(null);
  const [delFacming, setDelFacming]           = useState(false);

  // ── Modal: Programa ───────────────────────────────────────────────────────
  const [showProgModal, setShowProgModal]     = useState(false);
  const [editingProg, setEditingProg]         = useState<ProgramaOutput | null>(null);
  const [progForm, setProgForm]               = useState<ProgramaForm>(EMPTY_PROG);
  const [progSubmitting, setProgSubmitting]   = useState(false);
  const [progFormError, setProgFormError]     = useState<string | null>(null);

  const programaRequiereSeleccionModalidad = useMemo(() => {
    const tiporegistro = tiporegistros.find((t) => t.id === progForm.idTiporegistro);
    const tipoNormalizado = tiporegistro?.tipo
      ?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return tipoNormalizado?.includes('estandar') ?? false;
  }, [progForm.idTiporegistro, tiporegistros]);

  const [showDelProgModal, setShowDelProgModal] = useState(false);
  const [progToDelete, setProgToDelete]         = useState<ProgramaOutput | null>(null);
  const [delProgming, setDelProgming]           = useState(false);

  // ── Modal: Cohorte ────────────────────────────────────────────────────────
  const [showCohModal, setShowCohModal]     = useState(false);
  const [editingCoh, setEditingCoh]         = useState<CohorteOutput | null>(null);
  const [cohForm, setCohForm]               = useState<CohorteForm>(EMPTY_COH);
  const [cohSubmitting, setCohSubmitting]   = useState(false);
  const [cohFormError, setCohFormError]     = useState<string | null>(null);
  const [cohContextProgId, setCohContextProgId] = useState<number | null>(null);

  const [showDelCohModal, setShowDelCohModal] = useState(false);
  const [cohToDelete, setCohToDelete]         = useState<CohorteOutput | null>(null);
  const [delCohming, setDelCohming]           = useState(false);

  // ── Carga ─────────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [facs, progs, cohs, ests, sems, mods, plzs, sds, otros] = await Promise.all([
        superadminFacultadesService.listar(),
        superadminProgramasService.listar(),
        superadminCohortesService.listar(),
        superadminCohortesService.listarEstados(),
        superadminSemestresService.listar(),
        superadminModalidadesService.listar(),
        superadminPlazosService.listar(),
        superadminSedesService.listar(),
        superadminOtrosValoresService.listar(),
      ]);
      setFacultades(facs);
      setProgramas(progs);
      setCohortes(cohs);
      setEstados(ests);
      setSemestres(sems);
      setModalidades(mods);
      setPlazos(plzs);
      setSedes(sds);
      setOtrosValores(otros);
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al cargar datos del servidor.');
    } finally {
      setLoading(false);
    }
  }, [mostrarAlerta]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const numVal = (v: string) => {
    if (v === '') return '';
    const value = Number(v);
    if (!Number.isFinite(value)) return '';
    return Math.max(0, value);
  };

  const hasNegativeNumber = (...values: Array<number | ''>) =>
    values.some((value) => value !== '' && value < 0);
  const setP = <K extends keyof ProgramaForm>(k: K, v: ProgramaForm[K]) =>
    setProgForm((f) => ({ ...f, [k]: v }));
  const setC = <K extends keyof CohorteForm>(k: K, v: CohorteForm[K]) =>
    setCohForm((f) => ({ ...f, [k]: v }));

  const otrosLabel = (o: OtrosValoresOutput) =>
    `#${o.id} — Carnet: ${o.carnet ? 'Sí' : 'No'} · Estampilla: ${o.estampilla ? 'Sí' : 'No'} · Seguro: ${o.seguro ? 'Sí' : 'No'}`;

  const setPlazo = (
    tipo: 'plazodocumentacion' | 'plazoinscripcion' | 'plazopago',
    campo: keyof PlazoDates,
    val: string,
  ) => setCohForm((f) => ({ ...f, [tipo]: { ...f[tipo], [campo]: val } }));

  const buildPlazoPayload = (plazo: PlazoDates, idTipoplazo: number) => ({
    fechainicio: plazo.fechainicio,
    fechafin: plazo.fechafin,
    idTipoplazo,
  });

  const isTipoRegistroUnico = (idTiporegistro: number | '') => {
    const tiporegistro = tiporegistros.find((t) => t.id === idTiporegistro);
    const tipoNormalizado = tiporegistro?.tipo
      ?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return tipoNormalizado?.includes('unico') ?? false;
  };

  const handleTipoRegistroChange = (value: string) => {
    const idTiporegistro = value === '' ? '' : Number(value);
    setP('idTiporegistro', idTiporegistro);

    if (idTiporegistro === '') {
      setP('idModalidad', '');
      return;
    }

    if (isTipoRegistroUnico(idTiporegistro)) {
      setP('idModalidad', 3);
    } else {
      setP('idModalidad', '');
    }
  };

  // ── Handlers: Facultad ────────────────────────────────────────────────────

  const openCreateFac = () => {
    setEditingFac(null);
    setFacForm(EMPTY_FAC);
    setFacFormError(null);
    setShowFacModal(true);
  };

  const openEditFac = (f: FacultadOutput, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFac(f);
    setFacForm({ nombre: f.nombre, correo: f.correo });
    setFacFormError(null);
    setShowFacModal(true);
  };

  const handleSaveFac = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFacFormError(null);
    if (!facForm.nombre.trim()) { setFacFormError('El nombre es obligatorio.'); return; }
    if (!facForm.correo.trim()) { setFacFormError('El correo es obligatorio.'); return; }
    setFacSubmitting(true);
    try {
      const payload = {
        nombre: facForm.nombre.trim(),
        correo: facForm.correo.trim(),
      };
      if (editingFac) {
        await superadminFacultadesService.actualizar({ id: editingFac.id, ...payload });
      } else {
        await superadminFacultadesService.crear(payload);
      }
      setShowFacModal(false);
      await cargar();
      mostrarConfirm(editingFac ? 'Facultad actualizada con éxito.' : 'Facultad creada con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al guardar la facultad.');
    } finally {
      setFacSubmitting(false);
    }
  };

  const openDeleteFac = (f: FacultadOutput, e: React.MouseEvent) => {
    e.stopPropagation();
    setFacToDelete(f);
    setShowDelFacModal(true);
  };

  const confirmDeleteFac = async () => {
    if (!facToDelete) return;
    setDelFacming(true);
    try {
      await superadminFacultadesService.eliminar(facToDelete.id);
      setShowDelFacModal(false);
      setFacToDelete(null);
      await cargar();
      mostrarConfirm('Facultad eliminada con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al eliminar la facultad.');
      setShowDelFacModal(false);
    } finally {
      setDelFacming(false);
    }
  };

  // ── Handlers: Programa ────────────────────────────────────────────────────

  const openCreateProg = (facultadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProg(null);
    setProgForm({ ...EMPTY_PROG, idFacultad: facultadId });
    setProgFormError(null);
    setShowProgModal(true);
  };

  const openEditProg = (p: ProgramaOutput, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProg(p);
    setProgForm({
      codigo: p.codigo ?? '',
      nombre: p.nombre ?? '',
      duracion: p.duracion ?? '',
      correo: p.correo ?? '',
      registrosnies: p.registrosnies ?? '',
      nivelformacion: p.nivelformacion ?? '',
      titulo: p.titulo ?? '',
      rcmineducacion: p.rcmineducacion ?? '',
      creditos: p.creditos ?? '',
      periodicidad: p.periodicidad ?? '',
      valormatricula: p.valormatricula ?? '',
      idSede: p.idSede ?? '',
      idTiporegistro: p.idTiporegistro ?? '',
      idModalidad: p.idModalidad ?? '',
      idFacultad: p.idFacultad ?? '',
      idOtros: p.idOtros ?? '',
    });
    setProgFormError(null);
    setShowProgModal(true);
  };

  const handleSaveProg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProgFormError(null);
    if (!progForm.nombre.trim()) { setProgFormError('El nombre es obligatorio.'); return; }
    if (progForm.codigo === '')   { setProgFormError('El código es obligatorio.'); return; }
    if (hasNegativeNumber(progForm.codigo, progForm.duracion, progForm.creditos, progForm.valormatricula)) {
      setProgFormError('Los campos numéricos no pueden ser negativos.');
      return;
    }
    if (progForm.idFacultad === '') { setProgFormError('Selecciona una facultad.'); return; }
    if (programaRequiereSeleccionModalidad && progForm.idModalidad === '') {
      setProgFormError('Selecciona una modalidad para el tipo de registro estándar.');
      return;
    }
    setProgSubmitting(true);
    try {
      const idModalidad = isTipoRegistroUnico(progForm.idTiporegistro)
        ? 3
        : (progForm.idModalidad as number) || 0;

      const payload = {
        codigo: progForm.codigo as number,
        nombre: progForm.nombre.trim(),
        duracion: (progForm.duracion as number) || 0,
        correo: progForm.correo.trim(),
        registrosnies: progForm.registrosnies.trim(),
        nivelformacion: progForm.nivelformacion.trim(),
        titulo: progForm.titulo.trim(),
        rcmineducacion: progForm.rcmineducacion.trim(),
        creditos: (progForm.creditos as number) || 0,
        periodicidad: progForm.periodicidad.trim(),
        valormatricula: (progForm.valormatricula as number) || 0,
        idSede: (progForm.idSede as number) || 0,
        idTiporegistro: (progForm.idTiporegistro as number) || 0,
        idModalidad,
        idFacultad: progForm.idFacultad as number,
        idOtros: (progForm.idOtros as number) || 0,
      };
      if (editingProg) {
        await superadminProgramasService.actualizar({ id: editingProg.id, ...payload });
      } else {
        await superadminProgramasService.crear(payload);
      }
      setShowProgModal(false);
      await cargar();
      mostrarConfirm(editingProg ? 'Programa actualizado con éxito.' : 'Programa creado con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al guardar el programa.');
    } finally {
      setProgSubmitting(false);
    }
  };

  const openDeleteProg = (p: ProgramaOutput, e: React.MouseEvent) => {
    e.stopPropagation();
    setProgToDelete(p);
    setShowDelProgModal(true);
  };

  const confirmDeleteProg = async () => {
    if (!progToDelete) return;
    setDelProgming(true);
    try {
      await superadminProgramasService.eliminar(progToDelete.id);
      setShowDelProgModal(false);
      setProgToDelete(null);
      await cargar();
      mostrarConfirm('Programa eliminado con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al eliminar el programa.');
      setShowDelProgModal(false);
    } finally {
      setDelProgming(false);
    }
  };

  // ── Handlers: Cohorte ─────────────────────────────────────────────────────

  const openCreateCoh = (programaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCoh(null);
    setCohForm(EMPTY_COH);
    setCohFormError(null);
    setCohContextProgId(programaId);
    setShowCohModal(true);
  };

  const openEditCoh = (c: CohorteOutput, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCoh(c);
    const fp = (id: number) => plazos.find((p) => p.id === id);
    const docP  = fp(c.idPlazodocumentacion);
    const inscP = fp(c.idPlazoinscripcion);
    const pagoP = fp(c.idPlazopago);
    setCohForm({
      nombre: c.nombre ?? '',
      cupos: c.cupos ?? '',
      idEstado: c.idEstado ?? '',
      idSemestre: c.idSemestre ?? '',
      idModalidad: c.idModalidad ?? '',
      plazodocumentacion: { fechainicio: docP?.fechainicio ?? '', fechafin: docP?.fechafin  ?? '' },
      plazoinscripcion:   { fechainicio: inscP?.fechainicio ?? '', fechafin: inscP?.fechafin ?? '' },
      plazopago:          { fechainicio: pagoP?.fechainicio ?? '', fechafin: pagoP?.fechafin ?? '' },
    });
    setCohContextProgId(c.idPrograma);
    setCohFormError(null);
    setShowCohModal(true);
  };

  const handleSaveCoh = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCohFormError(null);
    if (!cohForm.nombre.trim())  { setCohFormError('El nombre es obligatorio.'); return; }
    if (hasNegativeNumber(cohForm.cupos)) { setCohFormError('Los cupos no pueden ser negativos.'); return; }
    if (cohForm.cupos === '' || (cohForm.cupos as number) <= 0) { setCohFormError('Los cupos deben ser mayor a 0.'); return; }
    if (cohForm.idEstado === '')  { setCohFormError('Selecciona un estado.'); return; }
    if (cohForm.idSemestre === '') { setCohFormError('Selecciona un semestre.'); return; }
    if (cohForm.idModalidad === '') { setCohFormError('Selecciona una modalidad.'); return; }
    if (!cohForm.plazodocumentacion.fechainicio || !cohForm.plazodocumentacion.fechafin)
      { setCohFormError('Completa las fechas del plazo de documentación.'); return; }
    if (!cohForm.plazoinscripcion.fechainicio || !cohForm.plazoinscripcion.fechafin)
      { setCohFormError('Completa las fechas del plazo de inscripción.'); return; }
    if (!cohForm.plazopago.fechainicio || !cohForm.plazopago.fechafin)
      { setCohFormError('Completa las fechas del plazo de pago.'); return; }

    const idProg = editingCoh ? editingCoh.idPrograma : cohContextProgId;
    if (!idProg) { setCohFormError('Error interno: programa no definido.'); return; }

    setCohSubmitting(true);
    try {
      if (editingCoh) {
        await Promise.all([
          superadminPlazosService.actualizar({ id: editingCoh.idPlazodocumentacion, ...buildPlazoPayload(cohForm.plazodocumentacion, 3) }),
          superadminPlazosService.actualizar({ id: editingCoh.idPlazoinscripcion, ...buildPlazoPayload(cohForm.plazoinscripcion, 4) }),
          superadminPlazosService.actualizar({ id: editingCoh.idPlazopago, ...buildPlazoPayload(cohForm.plazopago, 7) }),
        ]);

        await superadminCohortesService.actualizar({
          id: editingCoh.id,
          nombre: cohForm.nombre.trim(),
          cupos: cohForm.cupos as number,
          idEstado:    cohForm.idEstado    as number,
          idSemestre:  cohForm.idSemestre  as number,
          idModalidad: cohForm.idModalidad as number,
          idPlazodocumentacion: editingCoh.idPlazodocumentacion,
          idPlazoinscripcion: editingCoh.idPlazoinscripcion,
          idPlazopago: editingCoh.idPlazopago,
          idPrograma: idProg,
        });
      } else {
        const documentosConsejo = await superadminDocumentosService.listar();

        await superadminCohortesService.crearPorPrograma(idProg, {
          nombre: cohForm.nombre.trim(),
          cupos: cohForm.cupos as number,
          idSemestre: cohForm.idSemestre as number,
          idModalidad: cohForm.idModalidad as number,
          fechaInicioDocumentacion: cohForm.plazodocumentacion.fechainicio,
          fechaFinDocumentacion: cohForm.plazodocumentacion.fechafin,
          fechaInicioInscripcion: cohForm.plazoinscripcion.fechainicio,
          fechaFinInscripcion: cohForm.plazoinscripcion.fechafin,
          fechaInicioPago: cohForm.plazopago.fechainicio,
          fechaFinPago: cohForm.plazopago.fechafin,
          documentosConsejo: documentosConsejo.map((documento) => ({
            id: 0,
            idDocrequisito: documento.id,
            idCohorte: 0,
            nombre: documento.nombre,
          })),
          documentosPrograma: [],
          criteriosCohorte: [],
        });
      }
      setShowCohModal(false);
      await cargar();
      mostrarConfirm(editingCoh ? 'Cohorte actualizada con éxito.' : 'Cohorte creada con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al guardar la cohorte.');
    } finally {
      setCohSubmitting(false);
    }
  };

  const openDeleteCoh = (c: CohorteOutput, e: React.MouseEvent) => {
    e.stopPropagation();
    setCohToDelete(c);
    setShowDelCohModal(true);
  };

  const confirmDeleteCoh = async () => {
    if (!cohToDelete) return;
    setDelCohming(true);
    try {
      await superadminCohortesService.eliminar(cohToDelete.id);
      setShowDelCohModal(false);
      setCohToDelete(null);
      await cargar();
      mostrarConfirm('Cohorte eliminada con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al eliminar la cohorte.');
      setShowDelCohModal(false);
    } finally {
      setDelCohming(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">
      {/* Encabezado */}
      <div className="animate-fade-in-up flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programas</h1>
          <p className="text-gray-500 text-sm">Gestiona facultades, programas y cohortes académicas</p>
        </div>
        {!loading && (
          <button
            onClick={openCreateFac}
            className="animate-fade-in flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shrink-0"
          >
            <FolderPlusIcon />
            Nueva Facultad
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20 animate-fade-in">
          <div className="flex items-center gap-3 text-neutral-400 text-sm">
            <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-slate-700" />
            Cargando datos...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {facultades.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No hay facultades creadas. Crea una con el botón de arriba.
            </div>
          )}
          {facultades.map((f, idx) => (
            <FacultadItem
              key={f.id}
              facultad={f}
              programas={programas.filter((p) => p.idFacultad === f.id)}
              cohortes={cohortes}
              delay={`delay-${Math.min((idx + 1) * 100, 500)}`}
              onEditFacultad={openEditFac}
              onDeleteFacultad={openDeleteFac}
              onAddPrograma={openCreateProg}
              onEditPrograma={openEditProg}
              onDeletePrograma={openDeleteProg}
              onAddCohorte={openCreateCoh}
              onEditCohorte={openEditCoh}
              onDeleteCohorte={openDeleteCoh}
            />
          ))}
        </div>
      )}

      {/* ── Modal: Facultad (crear / editar) ────────────────────────────────── */}
      <Modal
        isOpen={showFacModal}
        onClose={() => setShowFacModal(false)}
        title={editingFac ? 'Editar Facultad' : 'Nueva Facultad'}
      >
        <form onSubmit={handleSaveFac} className="space-y-4">
          {facFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{facFormError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input
              type="text"
              placeholder="Facultad de Ingeniería"
              value={facForm.nombre}
              onChange={(e) => setFacForm({ ...facForm, nombre: e.target.value })}
              disabled={facSubmitting}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo</label>
            <input
              type="email"
              placeholder="facultad@ufps.edu.co"
              value={facForm.correo}
              onChange={(e) => setFacForm({ ...facForm, correo: e.target.value })}
              disabled={facSubmitting}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={facSubmitting}
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {facSubmitting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              {editingFac ? 'Actualizar' : 'Crear'} Facultad
            </button>
            <button
              type="button"
              onClick={() => setShowFacModal(false)}
              disabled={facSubmitting}
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Eliminar Facultad ─────────────────────────────────────────── */}
      <Modal isOpen={showDelFacModal} onClose={() => setShowDelFacModal(false)} title="Eliminar Facultad">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
              <TrashIcon />
            </div>
            <p className="text-sm text-gray-500 pt-1">
              ¿Eliminar la facultad <span className="font-semibold text-gray-800">{facToDelete?.nombre}</span>?
              Esta acción también eliminará sus programas y cohortes asociadas.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDelFacModal(false)} disabled={delFacming}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60">
              Cancelar
            </button>
            <button onClick={confirmDeleteFac} disabled={delFacming}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {delFacming && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Programa (crear / editar) ────────────────────────────────── */}
      <Modal
        isOpen={showProgModal}
        onClose={() => setShowProgModal(false)}
        title={editingProg ? 'Editar Programa' : 'Nuevo Programa'}
        size="lg"
      >
        <form onSubmit={handleSaveProg} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 -mx-1">
          {progFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{progFormError}</div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
              <input type="number" min="0" placeholder="12345" value={progForm.codigo}
                onChange={(e) => setP('codigo', numVal(e.target.value))}
                disabled={progSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración (semestres)</label>
              <input type="number" min="0" placeholder="4" value={progForm.duracion}
                onChange={(e) => setP('duracion', numVal(e.target.value))}
                disabled={progSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del programa</label>
            <input type="text" placeholder="Maestría en Ingeniería de Software" value={progForm.nombre}
              onChange={(e) => setP('nombre', e.target.value)} autoFocus
              disabled={progSubmitting}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título otorgado</label>
            <input type="text" placeholder="Magíster en Ingeniería de Software" value={progForm.titulo}
              onChange={(e) => setP('titulo', e.target.value)}
              disabled={progSubmitting}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectSA
              id="progNivel"
              label="Nivel de formación"
              value={progForm.nivelformacion}
              onChange={(v) => setP('nivelformacion', v)}
              options={["Maestría","Doctorado","Especialización","Especialización Médico-Quirúrgica"].map((n) => ({ value: n, label: n }))}
              disabled={progSubmitting}
            />
            <SelectSA
              id="progPeriodicidad"
              label="Periodicidad"
              value={progForm.periodicidad}
              onChange={(v) => setP('periodicidad', v)}
              options={["Semestral","Anual"].map((n) => ({ value: n, label: n }))}
              disabled={progSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo del programa</label>
            <input type="email" placeholder="programa@ufps.edu.co" value={progForm.correo}
              onChange={(e) => setP('correo', e.target.value)}
              disabled={progSubmitting}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Registro SNIES</label>
              <input type="text" placeholder="12345" value={progForm.registrosnies}
                onChange={(e) => setP('registrosnies', e.target.value)}
                disabled={progSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">RC Mineducación</label>
              <input type="text" placeholder="RC-001-2024" value={progForm.rcmineducacion}
                onChange={(e) => setP('rcmineducacion', e.target.value)}
                disabled={progSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Créditos</label>
              <input type="number" min="0" placeholder="60" value={progForm.creditos}
                onChange={(e) => setP('creditos', numVal(e.target.value))}
                disabled={progSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor matrícula (SMMLV)</label>
              <input type="number" min="0" placeholder="5" value={progForm.valormatricula}
                onChange={(e) => setP('valormatricula', numVal(e.target.value))}
                disabled={progSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
          </div>

          <SelectSA
            id="progFacultad"
            label="Facultad"
            value={String(progForm.idFacultad)}
            onChange={(v) => setP('idFacultad', v === '' ? '' : Number(v))}
            options={facultades.map((f) => ({ value: String(f.id), label: f.nombre }))}
            disabled={progSubmitting}
          />

          <SelectSA
            id="progSede"
            label="Sede"
            value={String(progForm.idSede)}
            onChange={(v) => setP('idSede', v === '' ? '' : Number(v))}
            options={sedes.map((s) => ({ value: String(s.id), label: s.nombre }))}
            disabled={progSubmitting}
          />

          <SelectSA
            id="progTipoRegistro"
            label="Tipo de registro"
            value={String(progForm.idTiporegistro)}
            onChange={handleTipoRegistroChange}
            options={tiporegistros.map((t) => ({ value: String(t.id), label: t.tipo }))}
            disabled={progSubmitting}
          />

          {programaRequiereSeleccionModalidad && (
            <SelectSA
              id="progModalidad"
              label="Modalidad"
              value={String(progForm.idModalidad)}
              onChange={(v) => setP('idModalidad', v === '' ? '' : Number(v))}
              options={modalidades.map((m) => ({ value: String(m.id), label: m.nombre }))}
              disabled={progSubmitting}
            />
          )}

          <SelectSA
            id="progOtros"
            label="Otros valores"
            value={String(progForm.idOtros)}
            onChange={(v) => setP('idOtros', v === '' ? '' : Number(v))}
            options={otrosValores.map((o) => ({ value: String(o.id), label: otrosLabel(o) }))}
            disabled={progSubmitting}
          />

          <div className="flex gap-3 pt-1 sticky bottom-0 bg-white pb-1">
            <button type="submit" disabled={progSubmitting}
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {progSubmitting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              {editingProg ? 'Actualizar' : 'Crear'} Programa
            </button>
            <button type="button" onClick={() => setShowProgModal(false)}
              disabled={progSubmitting}
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-60">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Eliminar Programa ─────────────────────────────────────────── */}
      <Modal isOpen={showDelProgModal} onClose={() => setShowDelProgModal(false)} title="Eliminar Programa">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
              <TrashIcon />
            </div>
            <p className="text-sm text-gray-500 pt-1">
              ¿Eliminar el programa <span className="font-semibold text-gray-800">{progToDelete?.nombre}</span>?
              Sus cohortes asociadas también serán eliminadas.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDelProgModal(false)} disabled={delProgming}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60">
              Cancelar
            </button>
            <button onClick={confirmDeleteProg} disabled={delProgming}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {delProgming && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Cohorte (crear / editar) ─────────────────────────────────── */}
      <Modal
        isOpen={showCohModal}
        onClose={() => setShowCohModal(false)}
        title={editingCoh ? 'Editar Cohorte' : 'Nueva Cohorte'}
        size="lg"
      >
        <form onSubmit={handleSaveCoh} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 -mx-1">
          {cohFormError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{cohFormError}</div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input
                type="text"
                placeholder="Cohorte 2026-1"
                value={cohForm.nombre}
                onChange={(e) => setC('nombre', e.target.value)}
                autoFocus
                disabled={cohSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cupos</label>
              <input
                type="number"
                min="0"
                placeholder="30"
                value={cohForm.cupos}
                onChange={(e) => setC('cupos', numVal(e.target.value))}
                disabled={cohSubmitting}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectSA
              id="cohEstado"
              label="Estado"
              value={String(cohForm.idEstado)}
              onChange={(v) => setC('idEstado', v === '' ? '' : Number(v))}
              options={estados.map((e) => ({
                value: String(e.id),
                label: e.entidad ? `${e.tipo} · ${e.entidad}` : e.tipo,
              }))}
              disabled={cohSubmitting}
            />
            <SelectSA
              id="cohSemestre"
              label="Semestre"
              value={String(cohForm.idSemestre)}
              onChange={(v) => setC('idSemestre', v === '' ? '' : Number(v))}
              options={semestres.map((s) => ({ value: String(s.id), label: s.nombre }))}
              disabled={cohSubmitting}
            />
          </div>

          <SelectSA
            id="cohModalidad"
            label="Modalidad"
            value={String(cohForm.idModalidad)}
            onChange={(v) => setC('idModalidad', v === '' ? '' : Number(v))}
            options={modalidades.map((m) => ({ value: String(m.id), label: m.nombre }))}
            disabled={cohSubmitting}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePickerSA id="docInicio" label="Inicio documentación"
              value={cohForm.plazodocumentacion.fechainicio}
              onChange={(v) => setPlazo('plazodocumentacion', 'fechainicio', v)}
              disabled={cohSubmitting} />
            <DatePickerSA id="docFin" label="Fin documentación"
              value={cohForm.plazodocumentacion.fechafin}
              onChange={(v) => setPlazo('plazodocumentacion', 'fechafin', v)}
              disabled={cohSubmitting} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePickerSA id="inscInicio" label="Inicio inscripción"
              value={cohForm.plazoinscripcion.fechainicio}
              onChange={(v) => setPlazo('plazoinscripcion', 'fechainicio', v)}
              disabled={cohSubmitting} />
            <DatePickerSA id="inscFin" label="Fin inscripción"
              value={cohForm.plazoinscripcion.fechafin}
              onChange={(v) => setPlazo('plazoinscripcion', 'fechafin', v)}
              disabled={cohSubmitting} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePickerSA id="pagoInicio" label="Inicio pago"
              value={cohForm.plazopago.fechainicio}
              onChange={(v) => setPlazo('plazopago', 'fechainicio', v)}
              disabled={cohSubmitting} />
            <DatePickerSA id="pagoFin" label="Fin pago"
              value={cohForm.plazopago.fechafin}
              onChange={(v) => setPlazo('plazopago', 'fechafin', v)}
              disabled={cohSubmitting} />
          </div>

          <div className="flex gap-3 pt-1 sticky bottom-0 bg-white pb-1">
            <button type="submit" disabled={cohSubmitting}
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {cohSubmitting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              {editingCoh ? 'Actualizar' : 'Crear'} Cohorte
            </button>
            <button type="button" onClick={() => setShowCohModal(false)}
              disabled={cohSubmitting}
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-60">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Eliminar Cohorte ──────────────────────────────────────────── */}
      <Modal isOpen={showDelCohModal} onClose={() => setShowDelCohModal(false)} title="Eliminar Cohorte">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
              <TrashIcon />
            </div>
            <p className="text-sm text-gray-500 pt-1">
              ¿Eliminar la cohorte <span className="font-semibold text-gray-800">{cohToDelete?.nombre}</span>?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowDelCohModal(false)} disabled={delCohming}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60">
              Cancelar
            </button>
            <button onClick={confirmDeleteCoh} disabled={delCohming}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {delCohming && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
