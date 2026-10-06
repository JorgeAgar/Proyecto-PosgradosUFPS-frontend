import { useState } from "react";
import { useNavigate } from "react-router";
import { UserIcon, LockClosedIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import InputField from "../InputField";
import { SpinnerIcon } from "../../assets/icons";

interface LoginFormProps {
  titulo: string;
  subtitulo: string;
  placeholderUsuario: string;
  /** Mensaje cuando el campo usuario está vacío. */
  mensajeUsuarioVacio?: string;
  /** Autentica al usuario; debe lanzar un Error con mensaje si falla. */
  onLogin: (usuario: string, password: string) => Promise<void>;
  /** Ruta a la que se navega tras iniciar sesión. */
  rutaExito: string;
  /** Ruta de "¿Olvidaste tu contraseña?". */
  rutaRecuperar: string;
  /** Contenido bajo el botón (p. ej. el selector de tipo de usuario). */
  pie?: React.ReactNode;
}

const CAMPO = "rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-200";

function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
      <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
      {mensaje}
    </p>
  );
}

/** Formulario de inicio de sesión usuario + contraseña con validación básica. */
export default function LoginForm({
  titulo,
  subtitulo,
  placeholderUsuario,
  mensajeUsuarioVacio = "El usuario es obligatorio.",
  onLogin,
  rutaExito,
  rutaRecuperar,
  pie,
}: LoginFormProps) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ usuario?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget.closest("form") as HTMLFormElement | null)?.requestSubmit();
    }
  };

  const validate = () => {
    const next: { usuario?: string; password?: string } = {};
    if (!usuario.trim()) next.usuario = mensajeUsuarioVacio;
    if (!password.trim()) next.password = "La contraseña es obligatoria.";
    else if (password.trim().length < 8) next.password = "La contraseña debe tener mínimo 8 caracteres.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!validate()) {
      setError("Revisa los campos marcados para continuar.");
      return;
    }

    setLoading(true);
    try {
      await onLogin(usuario, password);
      setOkMessage("Inicio de sesión exitoso. Redirigiendo...");
      navigate(rutaExito);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-4">
      <div className="text-center rounded-md bg-linear-to-r from-red-700 to-red-600 p-4 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-wide">{titulo}</h1>
        <p className="mt-1 text-sm text-red-100">{subtitulo}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      )}

      {okMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{okMessage}</div>
      )}

      <div>
        <label htmlFor="usuario" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
          <UserIcon className="h-4 w-4 text-red-700" />
          Usuario
        </label>
        <div className={CAMPO}>
          <InputField id="usuario" type="text" placeholder={placeholderUsuario} value={usuario} onChange={setUsuario} onKeyDown={handleKeyDown} autoComplete="username" disabled={loading} />
        </div>
        <ErrorCampo mensaje={fieldErrors.usuario} />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
          <LockClosedIcon className="h-4 w-4 text-red-700" />
          Contraseña
        </label>
        <div className={CAMPO}>
          <InputField id="password" type="password" placeholder="tu.contraseña" value={password} onChange={setPassword} onKeyDown={handleKeyDown} autoComplete="current-password" disabled={loading} />
        </div>
        <ErrorCampo mensaje={fieldErrors.password} />
      </div>

      <div className="text-right -mt-1 -mb-2">
        <button
          type="button"
          className="text-xs text-red-700 hover:text-red-900 hover:underline transition-colors"
          onClick={() => navigate(rutaRecuperar)}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full rounded-md bg-red-700 p-3 font-bold text-white hover:bg-red-800 transition-colors disabled:cursor-not-allowed disabled:bg-red-400"
        >
          {loading && <SpinnerIcon className="h-4 w-4 animate-spin text-white" />}
          Iniciar sesión
        </button>
      </div>

      {pie}
    </form>
  );
}
