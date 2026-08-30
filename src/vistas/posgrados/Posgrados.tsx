import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  superadminFacultadesService,
  superadminProgramasService,
  superadminCohortesService,
  type FacultadOutput,
  type ProgramaOutput,
  type CohorteOutput,
} from '../../services/posgrados/posgradosProgramasService';
import { AcademicCapIcon, BuildingLibraryIcon, ChevronRightIcon, SpinnerIcon } from "../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

// ── ProgramaItem ──────────────────────────────────────────────────────────────

interface ProgramaItemProps {
  programa: ProgramaOutput;
  cohortes: CohorteOutput[];
}

function getProgramaNombre(programa: ProgramaOutput): string {
  return programa.nombre?.trim() || programa.titulo?.trim() || `Programa #${programa.id}`;
}

function getProgramaCodigo(programa: ProgramaOutput): string {
  return Number.isFinite(programa.codigo) && programa.codigo !== 0 ? String(programa.codigo) : `ID ${programa.id}`;
}

function getProgramaSede(programa: ProgramaOutput): string {
  const sedeNombre = programa.sede?.nombre?.trim();
  return sedeNombre ? ` · Sede: ${sedeNombre}` : '';
}

function copiarAutenticacionPosgradosAPrograma() {
  const paresClaves: Array<[string, string]> = [
    ['ufps_posgrados_access_token', 'ufps_programa_access_token'],
    ['ufps_posgrados_refresh_token', 'ufps_programa_refresh_token'],
    ['ufps_posgrados_session', 'ufps_programa_session'],
  ];

  for (const [origen, destino] of paresClaves) {
    const valor = localStorage.getItem(origen);
    if (valor !== null) {
      localStorage.setItem(destino, valor);
    }
  }
}

function ProgramaItem({
  programa, cohortes,
}: ProgramaItemProps) {
  const navigate = useNavigate();

  const irAlPrograma = () => {
    copiarAutenticacionPosgradosAPrograma();
    localStorage.setItem('ufps_programa_id', String(programa.id));
    navigate('/programa/inicio');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 text-gray-900 transition-all">
        <button onClick={irAlPrograma} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <span className="text-gray-400"><AcademicCapIcon /></span>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{getProgramaNombre(programa)}</div>
            <div className="text-xs text-gray-400">
              Cód. {getProgramaCodigo(programa)}
              {programa.nivelformacion ? ` · ${programa.nivelformacion}` : ''}
              {getProgramaSede(programa)}
              {` · ${cohortes.length} cohorte${cohortes.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </button>
        <button onClick={irAlPrograma} title="Ir al programa"
          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:bg-gray-200 shrink-0 ml-2">
          <ChevronRightIcon className="w-5 h-5 shrink-0 transition-transform duration-300 rotate-0" />
        </button>
      </div>
    </div>
  );
}

// ── FacultadItem ──────────────────────────────────────────────────────────────

interface FacultadItemProps {
  facultad: FacultadOutput;
  programas: ProgramaOutput[];
  cohortes: CohorteOutput[];
  delay: string;
}

function FacultadItem({
  facultad, programas, cohortes, delay,
}: FacultadItemProps) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (!open) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className={`animate-fade-in-up ${delay} bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all`}>
      <div className={['flex items-center justify-between px-5 py-4 transition-colors duration-200', open ? 'bg-red-700 text-white' : 'bg-white text-gray-900'].join(' ')}>
        <button onClick={toggle} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <span className={open ? 'text-red-100' : 'text-gray-400'}><BuildingLibraryIcon /></span>
          <div className="min-w-0">
            <div className="font-semibold">{facultad.nombre}</div>
            <div className={`text-xs ${open ? 'text-red-100' : 'text-gray-400'}`}>
              {facultad.correo}
              {` · ${programas.length} programa${programas.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </button>
        <button onClick={toggle}
          className={`p-2 rounded-lg transition-colors ${open ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:bg-gray-100'} shrink-0 ml-2`}>
          <ChevronRightIcon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`} />
        </button>
      </div>

      <div
        className={`border-t border-gray-200 bg-gray-50 p-4 space-y-3 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-250 opacity-100' : 'max-h-0 opacity-0 pointer-events-none py-0'}`}
        aria-hidden={!open}
      >
        {programas.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No hay programas en esta facultad</p>
        )}

        {programas.map((p) => (
          <ProgramaItem
            key={p.id}
            programa={p}
            cohortes={cohortes.filter((c) => c.idPrograma === p.id)}
          />
        ))}
        </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Posgrados() {
  // ── Datos ─────────────────────────────────────────────────────────────────
  const [facultades, setFacultades]       = useState<FacultadOutput[]>([]);
  const [programas, setProgramas]         = useState<ProgramaOutput[]>([]);
  const [cohortes, setCohortes]           = useState<CohorteOutput[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pageError, setPageError]   = useState<string | null>(null);

  const programasPorFacultad = useMemo(() => {
    const resultado = new Map<number, ProgramaOutput[]>();

    for (const facultad of facultades) {
      const programasDeFacultad = new Map<number, ProgramaOutput>();

      for (const programa of facultad.programaList ?? []) {
        programasDeFacultad.set(programa.id, programa);
      }

      for (const programa of programas.filter((item) => item.idFacultad === facultad.id)) {
        programasDeFacultad.set(programa.id, programa);
      }

      resultado.set(facultad.id, Array.from(programasDeFacultad.values()));
    }

    return resultado;
  }, [facultades, programas]);

  // ── Carga ─────────────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [facs, progs, cohs] = await Promise.all([
        superadminFacultadesService.listar(),
        superadminProgramasService.listar(),
        superadminCohortesService.listar(),
      ]);
      setFacultades(facs);
      setProgramas(progs);
      setCohortes(cohs);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Error al cargar datos del servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      {/* Encabezado */}
      <div className="animate-fade-in-up flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Programas</h1>
          <p className="text-gray-500 text-sm">Consulta facultades y programas</p>
        </div>
      </div>

      {/* Error de página */}
      {pageError && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {pageError}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <SpinnerIcon className="animate-spin h-4 w-4" />
          Cargando datos...
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto">
          {facultades.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">
              No hay facultades creadas.
            </div>
          )}
          {facultades.map((f, idx) => (
            <FacultadItem
              key={f.id}
              facultad={f}
              programas={programasPorFacultad.get(f.id) ?? []}
              cohortes={cohortes}
              delay={`delay-${Math.min((idx + 1) * 100, 500)}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
