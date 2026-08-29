import { useState } from "react";
import { useNavigate } from "react-router";
import { UserIcon, LockClosedIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import InputField from "../../components/InputField";
import ufpsLogo from "../../assets/logoufps.png";
import { aspiranteAuthService } from "../../services/aspirante/aspiranteService";
import { SpinnerIcon } from "../../assets/icons";

export default function AspiranteLogin() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ usuario?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const mostrarErrorUsuario = !!fieldErrors.usuario;
  const mostrarErrorPassword = !!fieldErrors.password;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget.closest("form") as HTMLFormElement | null)?.requestSubmit();
    }
  };

  const validate = () => {
    const next: { usuario?: string; password?: string } = {};
    if (!usuario.trim()) next.usuario = "El correo es obligatorio.";
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
      await aspiranteAuthService.login(usuario, password);
      setOkMessage("Inicio de sesión exitoso. Redirigiendo...");
      navigate("/aspirante/inicio");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen w-full relative overflow-hidden bg-gradient-to-b from-red-50 via-white to-gray-100">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800" aria-hidden>
          <defs>
            <linearGradient id="al1" x1="0" x2="1">
              <stop offset="0%" stopColor="#fff5f5" />
              <stop offset="100%" stopColor="#fff" />
            </linearGradient>
            <linearGradient id="al2" x1="0" x2="1">
              <stop offset="0%" stopColor="#ffe3e3" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#fff6f6" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#al1)" />
          <g opacity="0.95">
            <circle cx="1200" cy="80" r="180" fill="url(#al2)" />
            <circle cx="200" cy="700" r="220" fill="#fff1f0" opacity="0.85" />
            <ellipse cx="900" cy="420" rx="420" ry="180" fill="#fff3f2" opacity="0.8" />
          </g>
          <g fill="#fee2e2" opacity="0.4">
            <rect x="40" y="40" width="280" height="180" rx="24" />
            <rect x="1080" y="560" width="240" height="120" rx="20" />
          </g>
        </svg>
      </div>

      {/* Encabezado con logo */}
      <div className="relative flex flex-col w-full min-h-[120px]">
        <div className="animate-slide-left delay-200 flex items-center gap-5 px-8 py-5">
          <img src={ufpsLogo} alt="Universidad Francisco de Paula Santander" className="h-14 w-auto" />
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex flex-col items-center justify-center bg-gray-100 rounded px-3 py-2 border border-gray-200">
            <span className="text-xl font-extrabold leading-none">UFPS</span>
            <span className="text-[9px] text-gray-500 font-semibold mt-0.5 text-center leading-tight">
              Universidad Francisco de<br />Paula Santander
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de login */}
      <div className="flex items-center justify-center px-4 pb-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-[0_10px_48px_rgba(99,39,39,0.12)] p-8 w-full max-w-[360px] animate-fade-in-up delay-200 border border-red-100">
          <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-4">

            {/* Cabecera del formulario */}
            <div className="text-center rounded-lg bg-gradient-to-r from-red-700 to-red-600 p-4 text-white shadow-sm">
              <h1 className="text-2xl font-bold tracking-wide">Acceso Aspirante</h1>
              <p className="mt-1 text-sm text-red-200">Inicia sesión con tu correo y contraseña</p>
            </div>

            {/* Alerta de error general */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Mensaje de éxito */}
            {okMessage && (
              <div className="rounded-lg border border-green-200 bg-green-100 px-4 py-3 text-sm text-green-700">
                {okMessage}
              </div>
            )}

            {/* Campo: usuario */}
            <div>
              <label htmlFor="usuario" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <UserIcon className="h-4 w-4 text-red-700" />
                Usuario
              </label>
              <div className="rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-200">
                <InputField
                  id="usuario"
                  type="text"
                  placeholder="aspirante"
                  value={usuario}
                  onChange={setUsuario}
                  onKeyDown={handleKeyDown}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              {mostrarErrorUsuario && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">
                  <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                  {fieldErrors.usuario}
                </p>
              )}
            </div>

            {/* Campo: contraseña */}
            <div>
              <label htmlFor="password" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <LockClosedIcon className="h-4 w-4 text-red-700" />
                Contraseña
              </label>
              <div className="rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-200">
                <InputField
                  id="password"
                  type="password"
                  placeholder="tu.contraseña"
                  value={password}
                  onChange={setPassword}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              {mostrarErrorPassword && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">
                  <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* ¿Olvidaste tu contraseña? */}
            <div className="text-right -mt-1 -mb-2">
              <button
                type="button"
                className="text-xs text-red-700 hover:text-red-900 hover:underline transition-colors"
                onClick={() => navigate(`/recuperar-password?loginRuta=/aspirante/login&rol=Aspirante`)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-700 p-3 font-bold text-white hover:bg-red-800 transition-colors disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {loading && <SpinnerIcon className="h-4 w-4 animate-spin text-white" />}
                Iniciar sesión
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
