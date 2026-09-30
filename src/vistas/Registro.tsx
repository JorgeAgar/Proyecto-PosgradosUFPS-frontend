import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
	AcademicCapIcon,
	ArrowLeftIcon,
	ArrowRightIcon,
	BriefcaseIcon,
	CheckCircleIcon,
	ClipboardDocumentListIcon,
	ExclamationCircleIcon,
	HomeIcon,
	EyeIcon,
	EyeSlashIcon,
	UserIcon,
} from "@heroicons/react/24/outline";
import { Select } from "../components/Select.tsx";
import { DatePicker } from "../components/DatePicker.tsx";
import { useNavigate } from "react-router";
import ufpsLogo from "../assets/logoufps.png";
import { listarCapacidadesExcepcionalesRegistro, listarCohortesRegistro, listarDepartamentosPorPaisRegistro, listarDepartamentosExpedicionRegistro, listarDiscapacidadesRegistro, listarDocumentosRegistro, listarEstadosCivilesRegistro, listarGruposEtnicosRegistro, listarMunicipiosPorDepartamentoRegistro, listarPaisesRegistro, listarPueblosIndigenasRegistro, listarProgramasInscripcionRegistro, listarSiNoRegistro, listarSexosBiologicosRegistro, listarVinculacionesProgramaRegistro, listarZonasResidenciaRegistro, registrarAspiranteCompleto, type RegistroFormularioData, type RegistroSelectOption, type RegistroSelectOptions } from "../services/registroService.ts";
import { SpinnerIcon } from "../assets/icons";

type TabId = "personales" | "residencia" | "especial" | "laboral" | "academica" | "usuario";

type FormState = RegistroFormularioData & {
	confirmarContrasena: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

type MunicipioScope = "nacimiento" | "expedicion" | "residencia" | "trabajo";

type SelectCatalogKey = "documento" | "estadoCivil" | "sexoBiologico" | "paises" | "departamentosNacimiento" | "departamentos" | "departamentosResidencia" | "departamentosTrabajo" | "zonaResidencia" | "grupoEtnico" | "puebloIndigena" | "capacidadExcepcional" | "discapacidades" | "siNo" | "programaInscripcion" | "vinculacionPrograma";

async function runWithConcurrencyLimit(tasks: Array<() => Promise<void>>, limit: number) {
	const concurrency = Math.max(1, Math.min(limit, tasks.length));
	let nextIndex = 0;

	async function worker() {
		while (true) {
			const currentIndex = nextIndex;
			nextIndex += 1;
			if (currentIndex >= tasks.length) {
				return;
			}

			await tasks[currentIndex]();
		}
	}

	await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

const MUNICIPIO_POR_DEPARTAMENTO: Record<keyof Pick<FormState, "departamentoNacimiento" | "departamentoExpedicion" | "departamentoResidencia" | "departamentoTrabajo">, MunicipioScope> = {
	departamentoNacimiento: "nacimiento",
	departamentoExpedicion: "expedicion",
	departamentoResidencia: "residencia",
	departamentoTrabajo: "trabajo",
};

const MUNICIPIO_RELACION: Record<MunicipioScope, { departamento: keyof Pick<FormState, "departamentoNacimiento" | "departamentoExpedicion" | "departamentoResidencia" | "departamentoTrabajo">; municipio: keyof Pick<FormState, "municipioNacimiento" | "municipioExpedicion" | "municipioResidencia" | "municipioTrabajo">; }> = {
	nacimiento: { departamento: "departamentoNacimiento", municipio: "municipioNacimiento" },
	expedicion: { departamento: "departamentoExpedicion", municipio: "municipioExpedicion" },
	residencia: { departamento: "departamentoResidencia", municipio: "municipioResidencia" },
	trabajo: { departamento: "departamentoTrabajo", municipio: "municipioTrabajo" },
};

const TABS: Array<{
	id: TabId;
	title: string;
	icon: typeof UserIcon;
	fields: Array<keyof FormState>;
}> = [
	{
		id: "academica",
		title: "Datos académicos",
		icon: AcademicCapIcon,
		fields: [
			"programaInscripcion",
			"cohorteInscripcion",
			"vinculacionPrograma",
			"tituloPregrado",
			"promedioPregrado",
			"titulosPostgrado",
			"egresadoUFPS",
		],
	},
	{
		id: "personales",
		title: "Datos personales",
		icon: UserIcon,
		fields: [
			"nombres",
			"apellidos",
			"tipoDocumento",
			"numeroDocumento",
			"estadoCivil",
			"sexoBiologico",
			"fechaNacimiento",
			"paisNacimiento",
			"departamentoNacimiento",
			"municipioNacimiento",
			"fechaExpedicion",
			"departamentoExpedicion",
			"municipioExpedicion",
		],
	},
	{
		id: "residencia",
		title: "Residencia y contacto",
		icon: HomeIcon,
		fields: [
			"zonaResidencia",
			"paisResidencia",
			"departamentoResidencia",
			"municipioResidencia",
			"direccionResidencia",
			"correoPersonal",
			"telefonoContacto",
		],
	},
	{
		id: "especial",
		title: "Población especial",
		icon: ClipboardDocumentListIcon,
		fields: [
			"grupoEtnico",
			"puebloIndigena",
			"tipoDiscapacidad",
			"capacidadExcepcional",
		],
	},
	{
		id: "laboral",
		title: "Datos laborales",
		icon: BriefcaseIcon,
		fields: [
			"empresaTrabajo",
			"paisTrabajo",
			"departamentoTrabajo",
			"municipioTrabajo",
			"direccionTrabajo",
			"experienciaLaboral",
		],
	},
	{
		id: "usuario",
		title: "Registro de usuario",
		icon: UserIcon,
		fields: ["usuarioRegistro", "contrasenaRegistro", "confirmarContrasena"],
	},
];

const INITIAL_FORM: FormState = {
	nombres: "",
	apellidos: "",
	tipoDocumento: "",
	numeroDocumento: "",
	estadoCivil: "",
	sexoBiologico: "",
	fechaNacimiento: "",
	paisNacimiento: "",
	departamentoNacimiento: "",
	municipioNacimiento: "",
	fechaExpedicion: "",
	departamentoExpedicion: "",
	municipioExpedicion: "",
	zonaResidencia: "",
	paisResidencia: "",
	departamentoResidencia: "",
	municipioResidencia: "",
	direccionResidencia: "",
	correoPersonal: "",
	telefonoContacto: "",
	grupoEtnico: "",
	puebloIndigena: "",
	tipoDiscapacidad: "",
	capacidadExcepcional: "",
	empresaTrabajo: "",
	paisTrabajo: "",
	departamentoTrabajo: "",
	municipioTrabajo: "",
	direccionTrabajo: "",
	experienciaLaboral: "",
	programaInscripcion: "",
	cohorteInscripcion: "",
	vinculacionPrograma: "",
	tituloPregrado: "",
	promedioPregrado: "",
	titulosPostgrado: "",
	egresadoUFPS: "",
	usuarioRegistro: "",
	contrasenaRegistro: "",
	confirmarContrasena: "",
};

const SENTINEL_EXTRANJERO = "EXTRANJERO";

const _TODAY = new Date();
const TODAY_STR = `${_TODAY.getFullYear()}-${String(_TODAY.getMonth() + 1).padStart(2, "0")}-${String(_TODAY.getDate()).padStart(2, "0")}`;
const _MAX_BIRTH = new Date(_TODAY.getFullYear() - 10, _TODAY.getMonth(), _TODAY.getDate());
const MAX_BIRTH_DATE_STR = `${_MAX_BIRTH.getFullYear()}-${String(_MAX_BIRTH.getMonth() + 1).padStart(2, "0")}-${String(_MAX_BIRTH.getDate()).padStart(2, "0")}`;

function normalizarTexto(value: string) {
	return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function esPaisExtranjero(paisId: string, paisOptions: RegistroSelectOption[]) {
	if (!paisId) return false;
	const pais = paisOptions.find((o) => o.value === paisId);
	if (!pais) return false;
	return normalizarTexto(pais.label) !== "colombia";
}

function fieldClass(error?: string) {
	return [
		"mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition",
		error ? "border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-red-200",
	].join(" ");
}

function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
	return (
		<label htmlFor={htmlFor} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
			{children}
		</label>
	);
}

function Input({
	id,
	label,
	value,
	onChange,
	error,
	placeholder,
	type = "text",
	autoComplete,
	maxLength,
}: {
	id: keyof FormState;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder?: string;
	type?: string;
	autoComplete?: string;
	maxLength?: number;
}) {
	return (
		<div>
			<Label htmlFor={id}>{label}</Label>
			<input
				id={id}
				type={type}
				value={value}
				maxLength={maxLength}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				autoComplete={autoComplete}
				className={fieldClass(error)}
			/>
			{error && <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700"><ExclamationCircleIcon className="h-4 w-4 shrink-0" />{error}</p>}
		</div>
	);
}

function TextArea({
	id,
	label,
	value,
	onChange,
	error,
	placeholder,
	rows = 4,
}: {
	id: keyof FormState;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder?: string;
	rows?: number;
}) {
	return (
		<div>
			<Label htmlFor={id}>{label}</Label>
			<textarea
				id={id}
				rows={rows}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`${fieldClass(error)} resize-y`}
			/>
			{error && <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700"><ExclamationCircleIcon className="h-4 w-4 shrink-0" />{error}</p>}
		</div>
	);
}


function PasswordInput({
	id,
	label,
	value,
	onChange,
	error,
	placeholder,
	showPassword,
	onToggleShowPassword,
}: {
	id: keyof FormState;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	placeholder?: string;
	showPassword: boolean;
	onToggleShowPassword: () => void;
}) {
	return (
		<div>
			<Label htmlFor={id}>{label}</Label>
			<div className="relative mt-1">
				<input
					id={id}
					type={showPassword ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className={`${fieldClass(error)} pr-12`}
				/>
				<button
					type="button"
					onClick={onToggleShowPassword}
					className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 transition hover:text-gray-700"
					aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
				>
					{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
				</button>
			</div>
			{error && <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700"><ExclamationCircleIcon className="h-4 w-4 shrink-0" />{error}</p>}
		</div>
	);
}

export default function Registro() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<TabId>(TABS[0].id);
	const [form, setForm] = useState<FormState>(INITIAL_FORM);
	const [errors, setErrors] = useState<Errors>({});
	const [submitted, setSubmitted] = useState(false);
	const [submitAttempted, setSubmitAttempted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [selectOptionsError, setSelectOptionsError] = useState<string | null>(null);
	const [cohorteOptionsError, setCohorteOptionsError] = useState<string | null>(null);
	const [selectCatalogLoading, setSelectCatalogLoading] = useState<Record<SelectCatalogKey, boolean>>({
		documento: true,
		estadoCivil: true,
		sexoBiologico: true,
		paises: true,
		departamentosNacimiento: false,
		departamentos: true,
		departamentosResidencia: false,
		departamentosTrabajo: false,
		zonaResidencia: true,
		grupoEtnico: true,
		puebloIndigena: true,
		capacidadExcepcional: true,
		discapacidades: true,
		siNo: true,
		programaInscripcion: true,
		vinculacionPrograma: true,
	});
	const [municipioOptions, setMunicipioOptions] = useState<Record<MunicipioScope, RegistroSelectOption[]>>({
		nacimiento: [],
		expedicion: [],
		residencia: [],
		trabajo: [],
	});
	const [municipioLoading, setMunicipioLoading] = useState<Record<MunicipioScope, boolean>>({
		nacimiento: false,
		expedicion: false,
		residencia: false,
		trabajo: false,
	});
	const [municipioErrors, setMunicipioErrors] = useState<Record<MunicipioScope, string | null>>({
		nacimiento: null,
		expedicion: null,
		residencia: null,
		trabajo: null,
	});
	const [selectOptions, setSelectOptions] = useState<RegistroSelectOptions>({
		documento: [],
		estadoCivil: [],
		sexoBiologico: [],
		paisNacimiento: [],
		departamentoNacimiento: [],
		paisTrabajo: [],
		municipio: [],
		departamentoExpedicion: [],
		zonaResidencia: [],
		paisResidencia: [],
		departamentoResidencia: [],
		grupoEtnico: [],
		puebloIndigena: [],
		capacidadExcepcional: [],
		discapacidades: [],
		siNo: [],
		departamentoTrabajo: [],
		programaInscripcion: [],
		vinculacionPrograma: [],
	});
	const [cohorteOptions, setCohorteOptions] = useState<Array<RegistroSelectOption>>([]);
	const [loadingCohorteOptions, setLoadingCohorteOptions] = useState(false);
	const errorMessages = Object.values(errors).filter((message): message is string => Boolean(message));
	const visibleErrorMessages = activeTab === "usuario" && !submitAttempted ? [] : errorMessages;
	const hasErrors = visibleErrorMessages.length > 0;
	const municipioErrorMessages = Object.values(municipioErrors).filter((message): message is string => Boolean(message));
	const backendErrorMessages = [selectOptionsError, cohorteOptionsError, ...municipioErrorMessages].filter((message): message is string => Boolean(message));
	const hasBackendErrors = backendErrorMessages.length > 0;
	const {
		departamentoNacimiento,
		departamentoExpedicion,
		departamentoResidencia,
		departamentoTrabajo,
	} = form;

	const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);
	const esNacimientoExtranjero = esPaisExtranjero(form.paisNacimiento, selectOptions.paisNacimiento);
	const esResidenciaExtranjera = esPaisExtranjero(form.paisResidencia, selectOptions.paisResidencia);
	const esTrabajoExtranjero = esPaisExtranjero(form.paisTrabajo, selectOptions.paisTrabajo);
	const noHayCohortes = Boolean(form.programaInscripcion) && !loadingCohorteOptions && cohorteOptions.length === 0;

	const fechaExpedicionMinDate = (() => {
		if (!form.fechaNacimiento) return undefined;
		const d = new Date(form.fechaNacimiento + "T00:00:00");
		d.setDate(d.getDate() + 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	})();

	function updateSelectCatalog<K extends keyof RegistroSelectOptions>(key: K, value: RegistroSelectOptions[K]) {
		setSelectOptions((current) => ({ ...current, [key]: value }));
	}

	function setCatalogLoading(key: SelectCatalogKey, value: boolean) {
		setSelectCatalogLoading((current) => ({ ...current, [key]: value }));
	}

	useEffect(() => {
		let cancelled = false;

		async function loadCatalog<K extends keyof RegistroSelectOptions>(key: K, loader: () => Promise<RegistroSelectOptions[K]>, loadingKey: SelectCatalogKey) {
			setCatalogLoading(loadingKey, true);
			try {
				const options = await loader();
				if (cancelled) return;
				updateSelectCatalog(key, options);
			} catch (error) {
				console.error(`No se pudieron cargar las opciones del catálogo ${String(key)}:`, error);
				if (!cancelled) {
					setSelectOptionsError("Algunas opciones del formulario no se pudieron cargar.");
				}
			} finally {
				if (!cancelled) setCatalogLoading(loadingKey, false);
			}
		}

		void runWithConcurrencyLimit([
			() => loadCatalog("documento", listarDocumentosRegistro, "documento"),
			() => loadCatalog("estadoCivil", listarEstadosCivilesRegistro, "estadoCivil"),
			() => loadCatalog("sexoBiologico", listarSexosBiologicosRegistro, "sexoBiologico"),
			() => loadCatalog("paisNacimiento", listarPaisesRegistro, "paises"),
			() => loadCatalog("paisTrabajo", listarPaisesRegistro, "paises"),
			() => loadCatalog("paisResidencia", listarPaisesRegistro, "paises"),
			() => loadCatalog("departamentoExpedicion", listarDepartamentosExpedicionRegistro, "departamentos"),
			() => loadCatalog("zonaResidencia", listarZonasResidenciaRegistro, "zonaResidencia"),
			() => loadCatalog("grupoEtnico", listarGruposEtnicosRegistro, "grupoEtnico"),
			() => loadCatalog("puebloIndigena", listarPueblosIndigenasRegistro, "puebloIndigena"),
			() => loadCatalog("capacidadExcepcional", listarCapacidadesExcepcionalesRegistro, "capacidadExcepcional"),
			() => loadCatalog("discapacidades", listarDiscapacidadesRegistro, "discapacidades"),
			() => loadCatalog("siNo", listarSiNoRegistro, "siNo"),
			() => loadCatalog("programaInscripcion", listarProgramasInscripcionRegistro, "programaInscripcion"),
			() => loadCatalog("vinculacionPrograma", listarVinculacionesProgramaRegistro, "vinculacionPrograma"),
		], 3);

		return () => {
			cancelled = true;
		};
	}, []);

	/**
	 * Carga los departamentos del país elegido en uno de los selects de ubicación.
	 * Devuelve la función de limpieza del efecto para descartar respuestas viejas.
	 */
	function cargarDepartamentosPorPais(
		pais: string,
		departamentoActual: string,
		catalogo: "departamentoNacimiento" | "departamentoTrabajo" | "departamentoResidencia",
		loadingKey: SelectCatalogKey,
		descripcionConsola: string,
		mensajeError: string,
	) {
		let cancelled = false;

		async function cargar() {
			if (!pais || departamentoActual === SENTINEL_EXTRANJERO) {
				updateSelectCatalog(catalogo, []);
				setCatalogLoading(loadingKey, false);
				return;
			}

			setCatalogLoading(loadingKey, true);
			try {
				const options = await listarDepartamentosPorPaisRegistro(pais);
				if (cancelled) return;
				updateSelectCatalog(catalogo, options);
			} catch (error) {
				console.error(`No se pudieron cargar los departamentos del país ${descripcionConsola}:`, error);
				if (!cancelled) {
					updateSelectCatalog(catalogo, []);
					setSelectOptionsError(mensajeError);
				}
			} finally {
				if (!cancelled) setCatalogLoading(loadingKey, false);
			}
		}

		void cargar();

		return () => {
			cancelled = true;
		};
	}

	useEffect(() => cargarDepartamentosPorPais(
		form.paisNacimiento, form.departamentoNacimiento, "departamentoNacimiento", "departamentosNacimiento",
		"seleccionado", "No se pudieron cargar los departamentos del país de nacimiento.",
	), [form.paisNacimiento]);

	useEffect(() => cargarDepartamentosPorPais(
		form.paisTrabajo, form.departamentoTrabajo, "departamentoTrabajo", "departamentosTrabajo",
		"de trabajo seleccionado", "No se pudieron cargar los departamentos del país donde trabaja.",
	), [form.paisTrabajo]);

	useEffect(() => cargarDepartamentosPorPais(
		form.paisResidencia, form.departamentoResidencia, "departamentoResidencia", "departamentosResidencia",
		"de residencia seleccionado", "No se pudieron cargar los departamentos del país de residencia.",
	), [form.paisResidencia]);

	useEffect(() => {
		let cancelled = false;

		async function loadMunicipios() {
			const scopes = Object.entries(MUNICIPIO_RELACION) as Array<[
				MunicipioScope,
				(typeof MUNICIPIO_RELACION)[MunicipioScope],
			]>;

			await runWithConcurrencyLimit(
				scopes.map(([scope, relation]) => async () => {
					const departamentoId = {
						departamentoNacimiento,
						departamentoExpedicion,
						departamentoResidencia,
						departamentoTrabajo,
					}[relation.departamento];

					if (!departamentoId || departamentoId === SENTINEL_EXTRANJERO) {
						if (cancelled) return;
						setMunicipioOptions((current) => ({ ...current, [scope]: [] }));
						setMunicipioErrors((current) => ({ ...current, [scope]: null }));
						setMunicipioLoading((current) => ({ ...current, [scope]: false }));
						return;
					}

					setMunicipioLoading((current) => ({ ...current, [scope]: true }));
					setMunicipioErrors((current) => ({ ...current, [scope]: null }));

					try {
						const options = await listarMunicipiosPorDepartamentoRegistro(departamentoId);
						if (cancelled) return;
						setMunicipioOptions((current) => ({ ...current, [scope]: options }));
					} catch (error) {
						console.error("No se pudieron cargar los municipios del departamento seleccionado:", error);
						if (!cancelled) {
							setMunicipioOptions((current) => ({ ...current, [scope]: [] }));
							setMunicipioErrors((current) => ({ ...current, [scope]: "Hubo un error al cargar los municipios del departamento seleccionado." }));
						}
					} finally {
						if (!cancelled) {
							setMunicipioLoading((current) => ({ ...current, [scope]: false }));
						}
					}
				}),
				2
			);
		}

		void loadMunicipios();

		return () => {
			cancelled = true;
		};
	}, [departamentoNacimiento, departamentoExpedicion, departamentoResidencia, departamentoTrabajo]);

	useEffect(() => {
		let cancelled = false;

		async function loadCohortes() {
			if (!form.programaInscripcion) {
				setCohorteOptions([]);
				setCohorteOptionsError(null);
				setLoadingCohorteOptions(false);
				return;
			}

			setCohorteOptionsError(null);
			setLoadingCohorteOptions(true);
			try {
				const options = await listarCohortesRegistro(form.programaInscripcion);
				if (cancelled) return;
				setCohorteOptions(options);
			} catch (error) {
				console.error("No se pudieron cargar las cohortes del programa:", error);
				if (!cancelled) {
					setCohorteOptions([]);
					setCohorteOptionsError("Hubo un error al cargar las cohortes del programa.");
				}
			} finally {
				if (!cancelled) setLoadingCohorteOptions(false);
			}
		}

		loadCohortes();

		return () => {
			cancelled = true;
		};
	}, [form.programaInscripcion]);

	function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
		setForm((current) => {
			const next = { ...current, [field]: value };
			const municipioScope = MUNICIPIO_POR_DEPARTAMENTO[field as keyof typeof MUNICIPIO_POR_DEPARTAMENTO];
			if (municipioScope) {
				next[MUNICIPIO_RELACION[municipioScope].municipio] = "";
			}
			if (field === "paisNacimiento") {
				const extranjero = value && esPaisExtranjero(value as string, selectOptions.paisNacimiento);
				next.departamentoNacimiento = extranjero ? SENTINEL_EXTRANJERO : "";
				next.municipioNacimiento = extranjero ? SENTINEL_EXTRANJERO : "";
			}
			if (field === "paisResidencia") {
				const extranjero = value && esPaisExtranjero(value as string, selectOptions.paisResidencia);
				next.departamentoResidencia = extranjero ? SENTINEL_EXTRANJERO : "";
				next.municipioResidencia = extranjero ? SENTINEL_EXTRANJERO : "";
			}
			if (field === "paisTrabajo") {
				const extranjero = value && esPaisExtranjero(value as string, selectOptions.paisTrabajo);
				next.departamentoTrabajo = extranjero ? SENTINEL_EXTRANJERO : "";
				next.municipioTrabajo = extranjero ? SENTINEL_EXTRANJERO : "";
			}
			if (field === "programaInscripcion") {
				next.cohorteInscripcion = "";
			}
			if (field === "fechaNacimiento") {
				const newBirth = value as string;
				if (next.fechaExpedicion && newBirth && next.fechaExpedicion <= newBirth) {
					next.fechaExpedicion = "";
				}
			}
			return next;
		});
		setSubmitted(false);
		setErrors((current) => {
			const next = { ...current, [field]: undefined };
			const municipioScope = MUNICIPIO_POR_DEPARTAMENTO[field as keyof typeof MUNICIPIO_POR_DEPARTAMENTO];
			if (municipioScope) {
				next[MUNICIPIO_RELACION[municipioScope].municipio] = undefined;
			}
			if (field === "paisNacimiento") {
				next.departamentoNacimiento = undefined;
				next.municipioNacimiento = undefined;
			}
			if (field === "paisResidencia") {
				next.departamentoResidencia = undefined;
				next.municipioResidencia = undefined;
			}
			if (field === "paisTrabajo") {
				next.departamentoTrabajo = undefined;
				next.municipioTrabajo = undefined;
			}
			return next;
		});
		if (field === "programaInscripcion") {
			setErrors((current) => ({ ...current, cohorteInscripcion: undefined }));
		}
		if (field === "contrasenaRegistro" || field === "confirmarContrasena") {
			setErrors((current) => ({ ...current, confirmarContrasena: undefined }));
		}
		if (field === "fechaNacimiento") {
			setErrors((current) => ({ ...current, fechaExpedicion: undefined }));
		}
	}

	function validateTab(tabId: TabId) {
		const nextErrors: Errors = {};

		const requireText = (field: keyof FormState, message: string) => {
			if (!String(form[field]).trim()) nextErrors[field] = message;
		};

		const currentTab = TABS.find((tab) => tab.id === tabId);
		if (!currentTab) return nextErrors;

		currentTab.fields.forEach((field) => {
			switch (field) {
				case "nombres": requireText(field, "Ingresa los nombres."); break;
				case "apellidos": requireText(field, "Ingresa los apellidos."); break;
				case "tipoDocumento": requireText(field, "Selecciona el tipo de documento."); break;
				case "numeroDocumento": requireText(field, "Ingresa el número de documento."); break;
				case "estadoCivil": requireText(field, "Selecciona el estado civil."); break;
				case "sexoBiologico": requireText(field, "Selecciona el sexo biológico."); break;
				case "fechaNacimiento": {
					const val = String(form.fechaNacimiento).trim();
					if (!val) {
						nextErrors.fechaNacimiento = "Selecciona la fecha de nacimiento.";
					} else if (val > TODAY_STR) {
						nextErrors.fechaNacimiento = "La fecha de nacimiento no puede ser posterior a hoy.";
					} else if (val > MAX_BIRTH_DATE_STR) {
						nextErrors.fechaNacimiento = "El aspirante debe tener al menos 10 años de edad.";
					}
					break;
				}
				case "paisNacimiento": requireText(field, "Selecciona el país de nacimiento."); break;
				case "departamentoNacimiento": requireText(field, "Selecciona el departamento de nacimiento."); break;
				case "municipioNacimiento": requireText(field, "Selecciona el municipio de nacimiento."); break;
				case "fechaExpedicion": {
					const val = String(form.fechaExpedicion).trim();
					if (!val) {
						nextErrors.fechaExpedicion = "Selecciona la fecha de expedición.";
					} else if (val > TODAY_STR) {
						nextErrors.fechaExpedicion = "La fecha de expedición no puede ser posterior a hoy.";
					} else if (form.fechaNacimiento && val <= form.fechaNacimiento) {
						nextErrors.fechaExpedicion = "La fecha de expedición debe ser posterior a la de nacimiento.";
					}
					break;
				}
				case "departamentoExpedicion": requireText(field, "Selecciona el departamento de expedición."); break;
				case "municipioExpedicion": requireText(field, "Selecciona el municipio de expedición."); break;
				case "zonaResidencia": requireText(field, "Selecciona la zona de residencia."); break;
				case "paisResidencia": requireText(field, "Selecciona el país de residencia."); break;
				case "departamentoResidencia": requireText(field, "Indica el departamento de residencia."); break;
				case "municipioResidencia": requireText(field, "Indica el municipio de residencia."); break;
				case "direccionResidencia": requireText(field, "Ingresa la dirección de residencia."); break;
				case "correoPersonal": requireText(field, "Ingresa el correo personal."); break;
				case "telefonoContacto": requireText(field, "Ingresa el número de contacto."); break;
				case "grupoEtnico": requireText(field, "Selecciona el grupo étnico."); break;
				case "puebloIndigena": requireText(field, "Indica el pueblo indígena o N/A."); break;
				case "tipoDiscapacidad": requireText(field, "Selecciona el tipo de discapacidad o No aplica."); break;
				case "capacidadExcepcional": requireText(field, "Indica si presentas capacidad excepcional."); break;
				case "empresaTrabajo": requireText(field, "Indica la empresa o escribe N/A."); break;
				case "paisTrabajo": requireText(field, "Selecciona el país donde trabaja."); break;
				case "departamentoTrabajo": requireText(field, "Indica el departamento de trabajo o N/A."); break;
				case "municipioTrabajo": requireText(field, "Indica el municipio de trabajo o N/A."); break;
				case "direccionTrabajo": requireText(field, "Indica la dirección laboral o N/A."); break;
				case "experienciaLaboral": requireText(field, "Describe tu experiencia laboral más reciente."); break;
				case "programaInscripcion": requireText(field, "Indica el programa al que te inscribes."); break;
				case "cohorteInscripcion": requireText(field, "Selecciona la cohorte."); break;
				case "vinculacionPrograma": requireText(field, "Selecciona el tipo de vinculación."); break;
				case "tituloPregrado": requireText(field, "Especifica el título de pregrado."); break;
				case "promedioPregrado": requireText(field, "Ingresa el promedio ponderado acumulado."); break;
				case "titulosPostgrado": requireText(field, "Indica los títulos de posgrado o Ninguno."); break;
				case "egresadoUFPS": requireText(field, "Indica si eres egresado de la UFPS."); break;
				case "usuarioRegistro": requireText(field, "Crea un usuario para el registro."); break;
				case "contrasenaRegistro": {
					const password = String(form.contrasenaRegistro).trim();
					if (!password) {
						nextErrors.contrasenaRegistro = "Crea una contraseña.";
					} else if (password.length < 8) {
						nextErrors.contrasenaRegistro = "La contraseña debe tener 8 caracteres o más.";
					}
					break;
				}
				case "confirmarContrasena": {
					const confirm = String(form.confirmarContrasena).trim();
					if (!confirm) {
						nextErrors.confirmarContrasena = "Confirma la contraseña.";
					} else if (confirm !== String(form.contrasenaRegistro).trim()) {
						nextErrors.confirmarContrasena = "Las contraseñas no coinciden.";
					}
					break;
				}
				default:
					break;
			}
		});

		return nextErrors;
	}

	function handleNext() {
		const currentErrors = validateTab(activeTab);
		if (Object.keys(currentErrors).length > 0) {
			setErrors((current) => ({ ...current, ...currentErrors }));
			return;
		}

		if (activeIndex < TABS.length - 1) {
			setActiveTab(TABS[activeIndex + 1].id);
		}
	}

	function handleBack() {
		if (activeIndex > 0) setActiveTab(TABS[activeIndex - 1].id);
	}

	function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
		if (e.key !== "Enter") {
			return;
		}

		if (e.target instanceof HTMLTextAreaElement) {
			return;
		}

		e.preventDefault();
	}

	async function handleSubmit() {
		setSubmitError(null);
		setSubmitAttempted(true);

		const nextErrors = TABS.reduce<Errors>((acc, tab) => ({ ...acc, ...validateTab(tab.id) }), {});
		if (Object.keys(nextErrors).length > 0) {
			setErrors(nextErrors);
			const firstInvalidTab = TABS.find((tab) => tab.fields.some((field) => nextErrors[field]));
			if (firstInvalidTab) setActiveTab(firstInvalidTab.id);
			setSubmitted(false);
			return;
		}

		setSubmitting(true);
		try {
			await registrarAspiranteCompleto(form);
			setSubmitted(true);
			navigate("/aspirante/login", { replace: true });
		} catch (error) {
			console.error("No se pudo completar el registro del aspirante:", error);
			setSubmitted(false);
			setSubmitError(error instanceof Error ? error.message : "No se pudo completar el registro del aspirante.");
		} finally {
			setSubmitting(false);
		}
	}

	function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<header className="w-full border-b border-gray-200 bg-white">
				<div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<img src={ufpsLogo} alt="Universidad Francisco de Paula Santander" className="h-12 w-auto shrink-0" />
					<div>
						<p className="text-lg font-bold text-gray-900 leading-tight">Universidad Francisco de Paula Santander</p>
						<p className="text-sm text-neutral-400">Inscripciones posgrados</p>
					</div>
				</div>
			</header>

			<div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

				{hasBackendErrors && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-red-700 animate-fade-in-up">
						<ExclamationCircleIcon className="h-5 w-5 shrink-0" />
						<div>
							<p className="text-sm font-semibold">Hubo un error al cargar el formulario</p>
							<p className="text-sm text-red-700/90">{backendErrorMessages[0] ?? "Intenta recargar la vista para volver a obtener la información."}</p>
						</div>
					</div>
				)}

				{hasErrors && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-red-700 animate-fade-in-up">
						<ExclamationCircleIcon className="h-5 w-5 shrink-0" />
						<div>
							<p className="text-sm font-semibold">Hay errores en el formulario</p>
							<p className="text-sm text-red-700/90">{errorMessages[0] ?? "Revisa los campos marcados en rojo para continuar."}</p>
						</div>
					</div>
				)}

				{submitError && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-red-700 animate-fade-in-up">
						<ExclamationCircleIcon className="h-5 w-5 shrink-0" />
						<div>
							<p className="text-sm font-semibold">No se pudo completar el registro</p>
							<p className="text-sm text-red-700/90">{submitError}</p>
						</div>
					</div>
				)}

				{submitted && (
					<div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-100 px-4 py-3 text-green-700 animate-fade-in-up delay-75">
						<CheckCircleIcon className="h-5 w-5 shrink-0" />
						<div>
							<p className="text-sm font-semibold">Información validada correctamente</p>
							<p className="text-sm text-green-700/90">Puedes continuar revisando o preparar el envío final del registro.</p>
						</div>
					</div>
				)}

				<div className="space-y-6">
					<form onKeyDown={handleFormKeyDown} onSubmit={handleFormSubmit} noValidate className="space-y-6">
						<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-fade-in-up">
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
								{TABS.map((tab, index) => {
									const active = tab.id === activeTab;
									const hasError = tab.id === "usuario"
										? submitAttempted && tab.fields.some((field) => Boolean(errors[field]))
										: tab.fields.some((field) => Boolean(errors[field]));
									const complete = tab.fields.every((field) => String(form[field]).trim() !== "" && !errors[field]);
									return (
										<button
											key={tab.id}
											type="button"
											onClick={() => setActiveTab(tab.id)}
											className={[
												"rounded-lg border px-2 py-2 text-left transition-all hover:border-gray-300 sm:px-3 animate-fade-in-up",
												active ? "border-red-200 bg-red-100 shadow-sm" : "border-gray-200 bg-white",
											].join(" ")}
										>
											<div className="flex items-center gap-1.5 sm:gap-2">
												<span className="text-xs font-semibold leading-tight text-gray-900 sm:text-sm">{index + 1}. {tab.title}</span>
												{complete && <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-green-700 sm:h-4 sm:w-4" />}
												{hasError && <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0 text-red-700 sm:h-4 sm:w-4" />}
											</div>
										</button>
									);
								})}
							</div>
						</div>

						<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-fade-in-up delay-100">
							{activeTab === "personales" && (
								<div className="space-y-6">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">Datos personales</h2>
										<p className="mt-1 text-sm text-neutral-400">Captura la información básica y de identificación del aspirante.</p>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<Input id="nombres" label="Nombres" value={form.nombres} onChange={(value) => updateField("nombres", value)} error={errors.nombres} placeholder="Nombres del aspirante" autoComplete="given-name" />
										<Input id="apellidos" label="Apellidos" value={form.apellidos} onChange={(value) => updateField("apellidos", value)} error={errors.apellidos} placeholder="Apellidos del aspirante" autoComplete="family-name" />
										<Select id="tipoDocumento" label="Tipo documento" value={form.tipoDocumento} onChange={(value) => updateField("tipoDocumento", value)} error={errors.tipoDocumento} options={selectOptions.documento} loading={selectCatalogLoading.documento} />
										<Input id="numeroDocumento" label="Número de documento" value={form.numeroDocumento} onChange={(value) => updateField("numeroDocumento", value)} error={errors.numeroDocumento} placeholder="Número de identificación" autoComplete="off" />
										<Select id="estadoCivil" label="Estado civil" value={form.estadoCivil} onChange={(value) => updateField("estadoCivil", value)} error={errors.estadoCivil} options={selectOptions.estadoCivil} loading={selectCatalogLoading.estadoCivil} />
										<Select id="sexoBiologico" label="Sexo biológico" value={form.sexoBiologico} onChange={(value) => updateField("sexoBiologico", value)} error={errors.sexoBiologico} options={selectOptions.sexoBiologico} loading={selectCatalogLoading.sexoBiologico} />
										<DatePicker id="fechaNacimiento" label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(value) => updateField("fechaNacimiento", value)} error={errors.fechaNacimiento} maxDate={MAX_BIRTH_DATE_STR} />
										<Select id="paisNacimiento" label="País de nacimiento" value={form.paisNacimiento} onChange={(value) => updateField("paisNacimiento", value)} error={errors.paisNacimiento} options={selectOptions.paisNacimiento} loading={selectCatalogLoading.paises} />
										<Select id="departamentoNacimiento" label="Departamento de nacimiento" value={form.departamentoNacimiento} onChange={(value) => updateField("departamentoNacimiento", value)} error={errors.departamentoNacimiento} options={selectOptions.departamentoNacimiento} loading={selectCatalogLoading.departamentosNacimiento} disabled={!form.paisNacimiento || esNacimientoExtranjero} fixedLabel={esNacimientoExtranjero ? "Extranjero" : undefined} />
										<Select id="municipioNacimiento" label="Municipio de nacimiento" value={form.municipioNacimiento} onChange={(value) => updateField("municipioNacimiento", value)} error={errors.municipioNacimiento ?? municipioErrors.nacimiento ?? undefined} options={municipioOptions.nacimiento} loading={municipioLoading.nacimiento} disabled={!form.departamentoNacimiento || esNacimientoExtranjero} fixedLabel={esNacimientoExtranjero ? "Extranjero" : undefined} />
										<DatePicker id="fechaExpedicion" label="Fecha de expedición del documento" value={form.fechaExpedicion} onChange={(value) => updateField("fechaExpedicion", value)} error={errors.fechaExpedicion} maxDate={TODAY_STR} minDate={fechaExpedicionMinDate} />
										<Select id="departamentoExpedicion" label="Departamento de expedición del documento" value={form.departamentoExpedicion} onChange={(value) => updateField("departamentoExpedicion", value)} error={errors.departamentoExpedicion} options={selectOptions.departamentoExpedicion} loading={selectCatalogLoading.departamentos} />
										<Select id="municipioExpedicion" label="Municipio de expedición del documento" value={form.municipioExpedicion} onChange={(value) => updateField("municipioExpedicion", value)} error={errors.municipioExpedicion ?? municipioErrors.expedicion ?? undefined} options={municipioOptions.expedicion} loading={municipioLoading.expedicion} disabled={!form.departamentoExpedicion} />
									</div>
								</div>
							)}

							{activeTab === "residencia" && (
								<div className="space-y-6">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">Datos de residencia y contacto</h2>
										<p className="mt-1 text-sm text-neutral-400">Indica tu ubicación actual y la información de contacto principal.</p>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<Select id="zonaResidencia" label="Zona de residencia" value={form.zonaResidencia} onChange={(value) => updateField("zonaResidencia", value)} error={errors.zonaResidencia} options={selectOptions.zonaResidencia} loading={selectCatalogLoading.zonaResidencia} />
										<Select id="paisResidencia" label="País de residencia" value={form.paisResidencia} onChange={(value) => updateField("paisResidencia", value)} error={errors.paisResidencia} options={selectOptions.paisResidencia} loading={selectCatalogLoading.paises} />
										<Select id="departamentoResidencia" label="Departamento de residencia" value={form.departamentoResidencia} onChange={(value) => updateField("departamentoResidencia", value)} error={errors.departamentoResidencia} options={selectOptions.departamentoResidencia} loading={selectCatalogLoading.departamentosResidencia} disabled={!form.paisResidencia || esResidenciaExtranjera} fixedLabel={esResidenciaExtranjera ? "Extranjero" : undefined} />
										<Select id="municipioResidencia" label="Municipio de residencia" value={form.municipioResidencia} onChange={(value) => updateField("municipioResidencia", value)} error={errors.municipioResidencia ?? municipioErrors.residencia ?? undefined} options={municipioOptions.residencia} loading={municipioLoading.residencia} disabled={!form.departamentoResidencia || esResidenciaExtranjera} fixedLabel={esResidenciaExtranjera ? "Extranjero" : undefined} />
										<Input id="direccionResidencia" label="Dirección de residencia" value={form.direccionResidencia} onChange={(value) => updateField("direccionResidencia", value)} error={errors.direccionResidencia} placeholder="Dirección completa" />
										<Input id="correoPersonal" label="Correo electrónico personal" type="email" value={form.correoPersonal} onChange={(value) => updateField("correoPersonal", value)} error={errors.correoPersonal} placeholder="correo@dominio.com" autoComplete="email" />
										<Input id="telefonoContacto" label="Número de teléfono de contacto" value={form.telefonoContacto} onChange={(value) => updateField("telefonoContacto", value)} error={errors.telefonoContacto} placeholder="Número de contacto" autoComplete="tel" maxLength={10} />
									</div>
								</div>
							)}

							{activeTab === "especial" && (
								<div className="space-y-6">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">Datos de población especial</h2>
										<p className="mt-1 text-sm text-neutral-400">Completa los campos de inclusión y caracterización diferencial.</p>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<Select id="grupoEtnico" label="Grupo étnico" value={form.grupoEtnico} onChange={(value) => updateField("grupoEtnico", value)} error={errors.grupoEtnico} options={selectOptions.grupoEtnico} loading={selectCatalogLoading.grupoEtnico} />
										<Select id="puebloIndigena" label="Pueblo indígena" value={form.puebloIndigena} onChange={(value) => updateField("puebloIndigena", value)} error={errors.puebloIndigena} options={selectOptions.puebloIndigena} loading={selectCatalogLoading.puebloIndigena} />
										<Select id="tipoDiscapacidad" label="Tipo de discapacidad" value={form.tipoDiscapacidad} onChange={(value) => updateField("tipoDiscapacidad", value)} error={errors.tipoDiscapacidad} options={selectOptions.discapacidades} loading={selectCatalogLoading.discapacidades} />
										<Select id="capacidadExcepcional" label="Persona con capacidad excepcional" value={form.capacidadExcepcional} onChange={(value) => updateField("capacidadExcepcional", value)} error={errors.capacidadExcepcional} options={selectOptions.capacidadExcepcional} loading={selectCatalogLoading.capacidadExcepcional} />
									</div>
								</div>
							)}

							{activeTab === "laboral" && (
								<div className="space-y-6">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">Datos laborales</h2>
										<p className="mt-1 text-sm text-neutral-400">Si no estás laborando, escribe N/A en los campos correspondientes.</p>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<Input id="empresaTrabajo" label="Empresa, entidad o institución donde trabaja" value={form.empresaTrabajo} onChange={(value) => updateField("empresaTrabajo", value)} error={errors.empresaTrabajo} placeholder="Si no laboras, escribe N/A" />
										<Select id="paisTrabajo" label="País donde trabaja" value={form.paisTrabajo} onChange={(value) => updateField("paisTrabajo", value)} error={errors.paisTrabajo} options={selectOptions.paisTrabajo} loading={selectCatalogLoading.paises} />
										<Select id="departamentoTrabajo" label="Departamento donde trabaja" value={form.departamentoTrabajo} onChange={(value) => updateField("departamentoTrabajo", value)} error={errors.departamentoTrabajo} options={selectOptions.departamentoTrabajo} loading={selectCatalogLoading.departamentosTrabajo} disabled={!form.paisTrabajo || esTrabajoExtranjero} fixedLabel={esTrabajoExtranjero ? "Extranjero" : undefined} />
										<Select id="municipioTrabajo" label="Municipio donde trabaja" value={form.municipioTrabajo} onChange={(value) => updateField("municipioTrabajo", value)} error={errors.municipioTrabajo ?? municipioErrors.trabajo ?? undefined} options={municipioOptions.trabajo} loading={municipioLoading.trabajo} disabled={!form.departamentoTrabajo || esTrabajoExtranjero} fixedLabel={esTrabajoExtranjero ? "Extranjero" : undefined} />
										<Input id="direccionTrabajo" label="Dirección del lugar de trabajo" value={form.direccionTrabajo} onChange={(value) => updateField("direccionTrabajo", value)} error={errors.direccionTrabajo} placeholder="Si no laboras, escribe N/A" />
										<div className="md:col-span-2">
											<TextArea id="experienciaLaboral" label="Información de la experiencia laboral" value={form.experienciaLaboral} onChange={(value) => updateField("experienciaLaboral", value)} error={errors.experienciaLaboral} placeholder="Escriba en orden, inicie con la más reciente. Puede incluir cargo, empresa, funciones y fechas." rows={6} />
										</div>
									</div>
								</div>
							)}

							{activeTab === "academica" && (
								<div className="space-y-6">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">Datos académicos</h2>
										<p className="mt-1 text-sm text-neutral-400">Registra la relación con el programa y tus antecedentes académicos.</p>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<Select id="vinculacionPrograma" label="Tipo de vinculación al programa" value={form.vinculacionPrograma} onChange={(value) => updateField("vinculacionPrograma", value)} error={errors.vinculacionPrograma} options={selectOptions.vinculacionPrograma} loading={selectCatalogLoading.vinculacionPrograma} />
										<Input id="tituloPregrado" label="Título obtenido en pregrado" value={form.tituloPregrado} onChange={(value) => updateField("tituloPregrado", value)} error={errors.tituloPregrado} placeholder="Programa académico de pregrado" />
										<Input id="promedioPregrado" type="number" label="Promedio ponderado acumulado de pregrado" value={form.promedioPregrado} onChange={(value) => updateField("promedioPregrado", value)} error={errors.promedioPregrado} placeholder="Ej: 4.2" />
										<Input id="titulosPostgrado" label="Títulos obtenidos en posgrado" value={form.titulosPostgrado} onChange={(value) => updateField("titulosPostgrado", value)} error={errors.titulosPostgrado} placeholder="Si no tiene estudios de posgrado, escribe Ninguno" />
										<Select id="egresadoUFPS" label="¿Egresado de la UFPS Sede Central - Cúcuta?" value={form.egresadoUFPS} onChange={(value) => updateField("egresadoUFPS", value)} error={errors.egresadoUFPS} options={selectOptions.siNo} loading={selectCatalogLoading.siNo} />
										<Select id="programaInscripcion" label="Programa al que se está inscribiendo" value={form.programaInscripcion} onChange={(value) => updateField("programaInscripcion", value)} error={errors.programaInscripcion} options={selectOptions.programaInscripcion} loading={selectCatalogLoading.programaInscripcion} />
										<div>
											<Select id="cohorteInscripcion" label="Cohorte a la que se está inscribiendo" value={form.cohorteInscripcion} onChange={(value) => updateField("cohorteInscripcion", value)} error={noHayCohortes ? undefined : errors.cohorteInscripcion} options={cohorteOptions} loading={loadingCohorteOptions} disabled={!form.programaInscripcion || noHayCohortes} />
											{noHayCohortes && (
												<p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700"><ExclamationCircleIcon className="h-4 w-4 shrink-0" />No hay cohortes activas para este programa</p>
											)}
										</div>
									</div>
								</div>
							)}

							{activeTab === "usuario" && (
								<div className="space-y-6">
									<div>
										<h2 className="text-lg font-semibold text-gray-900">Registro de usuario</h2>
										<p className="mt-1 text-sm text-neutral-400">Crea las credenciales que usarás para ingresar al sistema.</p>
									</div>

									<div className="grid gap-4 md:grid-cols-2">
										<Input id="usuarioRegistro" label="Usuario" value={form.usuarioRegistro} onChange={(value) => updateField("usuarioRegistro", value)} error={submitAttempted ? errors.usuarioRegistro : undefined} placeholder="Crea un nombre de usuario" autoComplete="username" />
										<PasswordInput id="contrasenaRegistro" label="Contraseña" value={form.contrasenaRegistro} onChange={(value) => updateField("contrasenaRegistro", value)} error={form.contrasenaRegistro.length > 0 && form.contrasenaRegistro.length < 8 ? "La contraseña debe tener 8 caracteres o más." : submitAttempted ? errors.contrasenaRegistro : undefined} placeholder="Mínimo 8 caracteres" showPassword={showPassword} onToggleShowPassword={() => setShowPassword((current) => !current)} />
										<PasswordInput id="confirmarContrasena" label="Confirmar contraseña" value={form.confirmarContrasena} onChange={(value) => updateField("confirmarContrasena", value)} error={form.confirmarContrasena.length > 0 && form.confirmarContrasena !== form.contrasenaRegistro ? "Las contraseñas no coinciden." : submitAttempted ? errors.confirmarContrasena : undefined} placeholder="Repite la contraseña" showPassword={showConfirm} onToggleShowPassword={() => setShowConfirm((current) => !current)} />
									</div>
								</div>
							)}

							<div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
								<button
									type="button"
									onClick={handleBack}
									disabled={activeIndex === 0}
									aria-disabled={submitting}
									className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<ArrowLeftIcon className="h-4 w-4" />
									Anterior
								</button>

								<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
									<button
										type="button"
										onClick={() => {
											setErrors({});
											setSubmitted(false);
											setSubmitAttempted(false);
											setSubmitError(null);
											setForm(INITIAL_FORM);
											setShowPassword(false);
											setShowConfirm(false);
											setSelectOptionsError(null);
											setCohorteOptionsError(null);
											setActiveTab(TABS[0].id);
										}}
										className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
									>
										Reiniciar
									</button>

									{activeIndex < TABS.length - 1 ? (
										<button
											type="button"
											onClick={handleNext}
											disabled={submitting}
											className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
										>
											Siguiente
											<ArrowRightIcon className="h-4 w-4" />
										</button>
									) : (
										<button
											type="button"
											onClick={handleSubmit}
											disabled={submitting}
											className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-70 disabled:cursor-not-allowed"
										>
											{submitting ? <><SpinnerIcon className="animate-spin h-4 w-4 shrink-0" />Enviando inscripción...</> : <><CheckCircleIcon className="h-4 w-4" />Enviar inscripción</>}
										</button>
									)}
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}