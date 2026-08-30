import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router';
import { Modal } from './components/Modal';
import type { SuperadminOutletContext } from '../../layouts/SuperadminLayout';
import {
  superadminUsuariosService,
  type UsuarioOutput,
  type RolOutput,
  type ProgramaDirigibleOutput,
} from '../../services/superadmin/superadminUsuariosService';
import {
  listarCapacidadesExcepcionalesRegistro,
  listarDiscapacidadesRegistro,
  listarEstadosCivilesRegistro,
  listarGruposEtnicosRegistro,
  listarPueblosIndigenasRegistro,
  listarSexosBiologicosRegistro,
  type RegistroSelectOption,
} from '../../services/registroService';
import { SelectSA } from './components/SelectSA';
import { EyeIcon, EyeSlashIcon, PencilIcon, RefreshIcon, SearchIcon, SpinnerIcon, TrashIcon, UserPlusIcon } from "../../assets/icons";

// ── Íconos ────────────────────────────────────────────────────────────────────

// ── Tipos locales ─────────────────────────────────────────────────────────────

type UserForm = {
  nombreusuario: string;
  password: string;
  idRol: number | '';
  idPrograma: number | '';
  persona: {
    nombres: string;
    apellidos: string;
    celular: string;
    correo: string;
    fechanacimiento: string;
    telefono: string;
    idGenero: string;
    idEstadocivil: string;
    idGrupoetnico: string;
    idPoblacionindigena: string;
    idDiscapacidad: string;
    idCapacidadexepcional: string;
  };
};

type PersonaForm = UserForm['persona'];

type PersonaCatalogos = {
  generos: RegistroSelectOption[];
  estadosCiviles: RegistroSelectOption[];
  gruposEtnicos: RegistroSelectOption[];
  pueblosIndigenas: RegistroSelectOption[];
  discapacidades: RegistroSelectOption[];
  capacidadesExcepcionales: RegistroSelectOption[];
};

const EMPTY_CATALOGOS: PersonaCatalogos = {
  generos: [],
  estadosCiviles: [],
  gruposEtnicos: [],
  pueblosIndigenas: [],
  discapacidades: [],
  capacidadesExcepcionales: [],
};

const EMPTY_FORM: UserForm = {
  nombreusuario: '',
  password: '',
  idRol: '',
  idPrograma: '',
  persona: {
    nombres: '',
    apellidos: '',
    celular: '',
    correo: '',
    fechanacimiento: '',
    telefono: '',
    idGenero: '',
    idEstadocivil: '',
    idGrupoetnico: '',
    idPoblacionindigena: '',
    idDiscapacidad: '',
    idCapacidadexepcional: '',
  },
};
const PROGRAMA_NINGUNO_VALUE = '__ninguno__';

function asFormString(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== null && value !== undefined && value !== '');
}

function asOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNestedId(value: unknown): unknown {
  if (value && typeof value === 'object') {
    return (value as Record<string, unknown>).id;
  }
  return value;
}

function getPersonaField(persona: Record<string, unknown>, ...keys: string[]) {
  return firstValue(...keys.map((key) => persona[key]));
}

function getDocumentoPersonaId(persona: Record<string, unknown>) {
  const value = firstValue(
    getPersonaField(persona, 'idDocumentopersona', 'idDocumentoPersona', 'id_documento_persona'),
    getNestedId(persona.documentopersona),
    getNestedId(persona.documentoPersona),
    getNestedId(persona.documento_persona),
  );
  return asOptionalNumber(asFormString(value));
}

function buildPersonaPayloadFromForm(persona: PersonaForm) {
  return {
    nombres: persona.nombres.trim(),
    apellidos: persona.apellidos.trim(),
    celular: persona.celular.trim(),
    correo: persona.correo.trim(),
    fechanacimiento: persona.fechanacimiento.trim() || null,
    telefono: persona.telefono.trim() || null,
    idGenero: asOptionalNumber(persona.idGenero),
    idEstadocivil: asOptionalNumber(persona.idEstadocivil),
    idGrupoetnico: asOptionalNumber(persona.idGrupoetnico),
    idPoblacionindigena: asOptionalNumber(persona.idPoblacionindigena),
    idDiscapacidad: asOptionalNumber(persona.idDiscapacidad),
    idCapacidadexepcional: asOptionalNumber(persona.idCapacidadexepcional),
    promediopregrado: null,
    titulopregrado: null,
    titulosposgrados: null,
    empresa: null,
    experiencialaboral: null,
    egresadoufps: null,
  };
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function SuperadminUsuarios() {
  const { mostrarAlerta, mostrarConfirm } = useOutletContext<SuperadminOutletContext>();

  const [usuarios, setUsuarios]   = useState<UsuarioOutput[]>([]);
  const [roles, setRoles]         = useState<RolOutput[]>([]);
  const [programas, setProgramas] = useState<ProgramaDirigibleOutput[]>([]);
  const [catalogosPersona, setCatalogosPersona] = useState<PersonaCatalogos>(EMPTY_CATALOGOS);
  const [catalogosPersonaLoading, setCatalogosPersonaLoading] = useState(false);
  const [programasLoading, setProgramasLoading] = useState(false);
  const [programasLoaded, setProgramasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showUserModal, setShowUserModal]     = useState(false);
  const [editingUser, setEditingUser]         = useState<UsuarioOutput | null>(null);
  const [formData, setFormData]               = useState<UserForm>(EMPTY_FORM);
  const [submitting, setSubmitting]           = useState(false);
  const [editLoading, setEditLoading]         = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete]       = useState<UsuarioOutput | null>(null);
  const [deleting, setDeleting]               = useState(false);

  const [showPassword, setShowPassword]               = useState(false);

  const rolDirectorPrograma = roles.find((rol) => rol.nombre.trim().toLowerCase() === 'director de programa');
  const esDirectorPrograma = formData.idRol !== '' && rolDirectorPrograma ? formData.idRol === rolDirectorPrograma.id : false;
  const formBusy = submitting || editLoading;

  // ── Carga inicial ─────────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [us, rs] = await Promise.all([
        superadminUsuariosService.listar(),
        superadminUsuariosService.listarRoles(),
      ]);
      setUsuarios(us);
      setRoles(rs);
      setCatalogosPersonaLoading(true);
      try {
        const [
          generos,
          estadosCiviles,
          gruposEtnicos,
          pueblosIndigenas,
          discapacidades,
          capacidadesExcepcionales,
        ] = await Promise.all([
          listarSexosBiologicosRegistro(),
          listarEstadosCivilesRegistro(),
          listarGruposEtnicosRegistro(),
          listarPueblosIndigenasRegistro(),
          listarDiscapacidadesRegistro(),
          listarCapacidadesExcepcionalesRegistro(),
        ]);
        setCatalogosPersona({
          generos,
          estadosCiviles,
          gruposEtnicos,
          pueblosIndigenas,
          discapacidades,
          capacidadesExcepcionales,
        });
      } catch {
        setCatalogosPersona(EMPTY_CATALOGOS);
      } finally {
        setCatalogosPersonaLoading(false);
      }
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al cargar datos del servidor.');
    } finally {
      setLoading(false);
    }
  }, [mostrarAlerta]);

  const cargarProgramasDirigibles = useCallback(async () => {
    setProgramasLoading(true);
    try {
      const ps = await superadminUsuariosService.listarProgramasDirigibles();
      setProgramas(ps);
      setProgramasLoaded(true);
    } catch {
      setProgramas([]);
      setProgramasLoaded(true);
    } finally {
      setProgramasLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Handlers: modal crear/editar ──────────────────────────────────────────

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setEditLoading(false);
    setShowPassword(false);
    setShowUserModal(true);
  };

  const openEditModal = async (user: UsuarioOutput) => {
    const persona = (user.persona ?? {}) as Record<string, unknown>;
    const esUsuarioDirector = rolDirectorPrograma ? user.idRol === rolDirectorPrograma.id : false;

    setEditingUser(user);
    setFormData({
      nombreusuario: user.nombreusuario,
      password: '',
      idRol: user.idRol,
      idPrograma: esUsuarioDirector ? '' : user.idPrograma ?? user.programa?.id ?? '',
      persona: {
        nombres: asFormString(persona.nombres),
        apellidos: asFormString(persona.apellidos),
        celular: asFormString(persona.celular),
        correo: asFormString(persona.correo),
        fechanacimiento: asFormString(getPersonaField(persona, 'fechanacimiento', 'fechaNacimiento', 'fecha_nacimiento')),
        telefono: asFormString(persona.telefono),
        idGenero: asFormString(getPersonaField(persona, 'idGenero', 'id_genero')),
        idEstadocivil: asFormString(getPersonaField(persona, 'idEstadocivil', 'idEstadoCivil', 'id_estado_civil')),
        idGrupoetnico: asFormString(getPersonaField(persona, 'idGrupoetnico', 'idGrupoEtnico', 'id_grupo_etnico')),
        idPoblacionindigena: asFormString(getPersonaField(persona, 'idPoblacionindigena', 'idPoblacionIndigena', 'id_poblacion_indigena')),
        idDiscapacidad: asFormString(getPersonaField(persona, 'idDiscapacidad', 'id_discapacidad')),
        idCapacidadexepcional: asFormString(getPersonaField(persona, 'idCapacidadexepcional', 'idCapacidadExepcional', 'idCapacidadExcepcional', 'id_capacidad_exepcional')),
      },
    });
    setFormError(null);
    setShowPassword(false);
    setEditLoading(true);
    setShowUserModal(true);

    try {
      const [idCargoActual] = await Promise.all([
        esUsuarioDirector ? superadminUsuariosService.obtenerCargoDirectorActual(user.idPersona).catch(() => '' as const) : Promise.resolve('' as const),
        esUsuarioDirector && !programasLoaded ? cargarProgramasDirigibles() : Promise.resolve(),
      ]).then(([resolvedCargo]) => [resolvedCargo] as const);

      setFormData((current) => ({
        ...current,
        idPrograma: esUsuarioDirector ? idCargoActual : current.idPrograma,
        persona: current.persona,
      }));
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editLoading) {
      setFormError('Espera a que termine de cargar la información del usuario.');
      return;
    }

    if (!formData.nombreusuario.trim()) {
      setFormError('El nombre de usuario es obligatorio.');
      return;
    }
    if (formData.idRol === '') {
      setFormError('Selecciona un rol.');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setFormError('La contraseña es obligatoria al crear un usuario.');
      return;
    }
    const camposTextoLimitados = [
      { label: 'nombre de usuario', value: formData.nombreusuario },
      { label: 'contraseña', value: formData.password },
      { label: 'nombres', value: formData.persona.nombres },
      { label: 'apellidos', value: formData.persona.apellidos },
      { label: 'correo', value: formData.persona.correo },
    ];
    const campoLargo = camposTextoLimitados.find((campo) => campo.value.trim().length > 50);
    if (campoLargo) {
      setFormError(`El campo ${campoLargo.label} no puede superar 50 caracteres.`);
      return;
    }
    if (!formData.persona.nombres.trim()) {
      setFormError('Los nombres de la persona son obligatorios.');
      return;
    }
    if (!formData.persona.apellidos.trim()) {
      setFormError('Los apellidos de la persona son obligatorios.');
      return;
    }
    if (!formData.persona.celular.trim()) {
      setFormError('El celular de la persona es obligatorio.');
      return;
    }
    if (!/^\d{10,12}$/.test(formData.persona.celular.trim())) {
      setFormError('El celular debe tener entre 10 y 12 digitos.');
      return;
    }
    if (formData.persona.telefono.trim() && !/^\d{10,12}$/.test(formData.persona.telefono.trim())) {
      setFormError('El telefono debe tener entre 10 y 12 digitos.');
      return;
    }
    if (!formData.persona.correo.trim()) {
      setFormError('El correo de la persona es obligatorio.');
      return;
    }
    setSubmitting(true);
    try {
      let idPersona = editingUser?.idPersona ?? 0;
      let claveId = editingUser?.idClave ?? 0;
      const personaPayload = buildPersonaPayloadFromForm(formData.persona);

      if (editingUser) {
        const editingPersona = (editingUser.persona ?? {}) as Record<string, unknown>;
        await superadminUsuariosService.actualizarPersona({
          id: editingUser.idPersona,
          idDocumentopersona: getDocumentoPersonaId(editingPersona),
          ...personaPayload,
        });
      } else {
        const persona = await superadminUsuariosService.crearPersona(personaPayload);
        idPersona = persona.id;
      }

      if (formData.password.trim()) {
        const clave = await superadminUsuariosService.crearClave(formData.password.trim());
        claveId = clave.id;
      }

      if (esDirectorPrograma && formData.idPrograma !== '') {
        await superadminUsuariosService.asignarProgramaDirector({
          idPersona,
          idCargo: formData.idPrograma as number,
        });
      } else if (editingUser && esDirectorPrograma) {
        await superadminUsuariosService.desasignarProgramaDirector(idPersona);
      }

      if (editingUser) {
        await superadminUsuariosService.actualizar({
          id: editingUser.id,
          nombreusuario: formData.nombreusuario.trim(),
          idPersona,
          idRol: formData.idRol as number,
          idClave: claveId,
        });
      } else {
        await superadminUsuariosService.crear({
          nombreusuario: formData.nombreusuario.trim(),
          idPersona,
          idRol: formData.idRol as number,
          idClave: claveId,
        });
      }

      setShowUserModal(false);
      await cargar();
      mostrarConfirm(editingUser ? 'Usuario actualizado con éxito.' : 'Usuario creado con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al guardar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handlers: modal eliminar ──────────────────────────────────────────────

  const openDeleteModal = (user: UsuarioOutput) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await superadminUsuariosService.eliminar(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      await cargar();
      mostrarConfirm('Usuario eliminado con éxito.');
    } catch (err) {
      mostrarAlerta(err instanceof Error ? err.message : 'Error al eliminar el usuario.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const nombreCompleto = (u: UsuarioOutput) =>
    u.persona ? `${u.persona.nombres ?? ''} ${u.persona.apellidos ?? ''}`.trim() : '—';

  const handleRolChange = async (value: string) => {
    const nextRol = value === '' ? '' : Number(value);
    setFormData((current) => ({
      ...current,
      idRol: nextRol,
      idPrograma: nextRol === rolDirectorPrograma?.id ? current.idPrograma : '',
    }));

    if (nextRol === rolDirectorPrograma?.id && !programasLoaded) {
      await cargarProgramasDirigibles();
    }
  };

  const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 12);

  const updatePersona = (field: keyof PersonaForm, value: string) => {
    setFormData((current) => ({
      ...current,
      persona: {
        ...current.persona,
        [field]: value,
      },
    }));
  };

  const filtered = usuarios.filter((u) => {
    const s = searchTerm.toLowerCase();
    return (
      nombreCompleto(u).toLowerCase().includes(s) ||
      u.nombreusuario.toLowerCase().includes(s) ||
      (u.persona?.correo ?? '').toLowerCase().includes(s)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">
      {/* Encabezado */}
      <div className="animate-fade-in-up flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm">Administra los usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={cargar}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshIcon />
          </button>
          {!loading && (
            <button
              onClick={openCreateModal}
              className="animate-fade-in flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <UserPlusIcon />
              Crear Usuario
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 animate-fade-in">
          <div className="flex items-center gap-3 text-neutral-400 text-sm">
            <SpinnerIcon className="animate-spin shrink-0 h-6 w-6 text-slate-700" />
            Cargando usuarios...
          </div>
        </div>
      ) : (
        <>
          {/* Buscador */}
          <div className="animate-fade-in-up delay-100 mb-5">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <SearchIcon className="w-5 h-5 shrink-0" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, usuario o correo..."
                value={searchTerm}
                maxLength={50}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="animate-fade-in-up delay-200 bg-white border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold">Nombre</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Correo</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Usuario</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Rol</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{nombreCompleto(u)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{u.persona?.correo ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-mono text-xs">{u.nombreusuario}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                        {u.rol?.nombre ?? `Rol #${u.idRol}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                        >
                          <PencilIcon />
                          Editar
                        </button>
                        <button
                          onClick={() => openDeleteModal(u)}
                          className="flex items-center justify-center p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                No se encontraron usuarios
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Crear / Editar Usuario */}
      <Modal
        isOpen={showUserModal}
        onClose={() => { if (!formBusy) setShowUserModal(false); }}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}
          {editLoading && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />
              Cargando datos del usuario...
            </div>
          )}

          {/* Nombre de usuario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre de usuario
            </label>
            <input
              type="text"
              placeholder="usuario123"
              value={formData.nombreusuario}
              maxLength={50}
              onChange={(e) => setFormData({ ...formData, nombreusuario: e.target.value })}
              disabled={formBusy}
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {editingUser ? 'Editar persona' : 'Nueva persona'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {editingUser
                  ? 'Actualiza los datos de la persona asociada al usuario.'
                  : 'La persona se creará junto con el usuario usando solo estos datos.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombres
              </label>
              <input
                type="text"
                placeholder="Nombres"
                value={formData.persona.nombres}
                maxLength={50}
                onChange={(e) => setFormData({
                  ...formData,
                  persona: { ...formData.persona, nombres: e.target.value },
                })}
                disabled={formBusy}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Apellidos
              </label>
              <input
                type="text"
                placeholder="Apellidos"
                value={formData.persona.apellidos}
                maxLength={50}
                onChange={(e) => setFormData({
                  ...formData,
                  persona: { ...formData.persona, apellidos: e.target.value },
                })}
                disabled={formBusy}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Celular
                </label>
                <input
                  type="tel"
                  placeholder="Celular"
                  value={formData.persona.celular}
                  maxLength={12}
                  inputMode="numeric"
                  pattern="[0-9]{10,12}"
                  onChange={(e) => setFormData({
                    ...formData,
                    persona: { ...formData.persona, celular: sanitizePhone(e.target.value) },
                  })}
                  disabled={formBusy}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.persona.correo}
                  maxLength={50}
                  onChange={(e) => setFormData({
                    ...formData,
                    persona: { ...formData.persona, correo: e.target.value },
                  })}
                  disabled={formBusy}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha de nacimiento <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={formData.persona.fechanacimiento}
                  onChange={(e) => updatePersona('fechanacimiento', e.target.value)}
                  disabled={formBusy}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefono <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="Telefono"
                  value={formData.persona.telefono}
                  maxLength={12}
                  inputMode="numeric"
                  pattern="[0-9]{10,12}"
                  onChange={(e) => updatePersona('telefono', sanitizePhone(e.target.value))}
                  disabled={formBusy}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Datos opcionales</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-end">
                {[
                  { field: 'idGenero', label: 'Genero', options: catalogosPersona.generos },
                  { field: 'idEstadocivil', label: 'Estado civil', options: catalogosPersona.estadosCiviles },
                  { field: 'idGrupoetnico', label: 'Grupo etnico', options: catalogosPersona.gruposEtnicos },
                  { field: 'idPoblacionindigena', label: 'Pueblo indigena', options: catalogosPersona.pueblosIndigenas },
                  { field: 'idDiscapacidad', label: 'Discapacidad', options: catalogosPersona.discapacidades },
                  { field: 'idCapacidadexepcional', label: 'Capacidad excepcional', options: catalogosPersona.capacidadesExcepcionales },
                ].map(({ field, label, options }) => (
                  <SelectSA
                    key={field}
                    id={field}
                    label={<>{label} <span className="text-gray-400 font-normal">(opcional)</span></>}
                    value={String(formData.persona[field as keyof PersonaForm] ?? '')}
                    onChange={(value) => updatePersona(field as keyof PersonaForm, value)}
                    options={options}
                    loading={catalogosPersonaLoading}
                    disabled={formBusy}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Rol */}
          <SelectSA
            id="idRol"
            label="Rol"
            value={String(formData.idRol)}
            onChange={handleRolChange}
            options={roles.map((r) => ({ value: String(r.id), label: r.nombre }))}
            disabled={formBusy}
          />

          {esDirectorPrograma && (
            <SelectSA
              id="idPrograma"
              label="Programa a dirigir"
              value={formData.idPrograma === '' ? PROGRAMA_NINGUNO_VALUE : String(formData.idPrograma)}
              onChange={(v) => setFormData({ ...formData, idPrograma: v === PROGRAMA_NINGUNO_VALUE || v === '' ? '' : Number(v) })}
              options={[
                { value: PROGRAMA_NINGUNO_VALUE, label: 'Ninguno' },
                ...programas.map((programa) => ({ value: String(programa.id), label: programa.nombre })),
              ]}
              loading={programasLoading}
              disabled={formBusy}
            />
          )}
          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {editingUser ? <>Nueva contraseña <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span></> : 'Contraseña'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                value={formData.password}
                maxLength={50}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={formBusy}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm outline-none transition hover:border-gray-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={formBusy}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:pointer-events-none"
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={formBusy}
              className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </button>
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              disabled={formBusy}
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar eliminar */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { if (!deleting) setShowDeleteModal(false); }}
        title="Eliminar Usuario"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
              <TrashIcon />
            </div>
            <p className="text-sm text-gray-500 pt-1">
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <span className="font-semibold text-gray-800">
                {userToDelete ? userToDelete.nombreusuario : ''}
              </span>?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleting && <SpinnerIcon className="animate-spin shrink-0 h-4 w-4" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
