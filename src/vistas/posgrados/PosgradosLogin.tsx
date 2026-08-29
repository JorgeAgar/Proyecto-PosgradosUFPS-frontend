import { useState } from "react";
import { useNavigate } from "react-router";
import { UserIcon as FieldUserIcon, LockClosedIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import InputField from "../../components/InputField";
import ufpsLogo from "../../assets/logoufps.png";
import { posgradosAuthService } from "../../services/posgrados/posgradosService.ts";
import { Link } from "react-router";
import { SpinnerIcon } from "../../assets/icons";

export default function PosgradosLogin() {
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
    if (!usuario.trim()) next.usuario = "El usuario es obligatorio.";
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
      await posgradosAuthService.login(usuario, password);
      setOkMessage("Inicio de sesión exitoso. Redirigiendo...");
      navigate("/posgrados");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in min-h-screen w-full relative overflow-hidden bg-linear-to-b from-red-50 via-white to-gray-100">
      {/* Decorative SVG background */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800" aria-hidden>
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#fff5f5" />
              <stop offset="100%" stopColor="#fff" />
            </linearGradient>
            <linearGradient id="g2" x1="0" x2="1">
              <stop offset="0%" stopColor="#ffe3e3" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#fff6f6" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g1)" />
          <g opacity="0.95">
            <circle cx="1200" cy="80" r="180" fill="url(#g2)" />
            <circle cx="200" cy="700" r="220" fill="#fff1f0" opacity="0.85" />
            <ellipse cx="900" cy="420" rx="420" ry="180" fill="#fff3f2" opacity="0.8" />
          </g>
          <g fill="#fee2e2" opacity="0.4">
            <rect x="40" y="40" width="280" height="180" rx="24" />
            <rect x="1080" y="560" width="240" height="120" rx="20" />
          </g>
        </svg>
      </div>

      <div className="relative flex flex-col w-full min-h-30">
        <div className="animate-slide-left delay-200 flex items-center gap-5 px-8 py-5">
          <img src={ufpsLogo} alt="Universidad Francisco de Paula Santander" className="h-14 w-auto" />
        </div>
      </div>

      <div className="flex items-center justify-center px-4 pb-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-[0_10px_48px_rgba(99,39,39,0.12)] p-8 w-full max-w-90 animate-fade-in-up delay-200 border border-red-100">
          <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-4">
            <div className="text-center rounded-md bg-linear-to-r from-red-700 to-red-600 p-4 text-white shadow-sm">
              <h1 className="text-2xl font-bold tracking-wide">Acceso Posgrados</h1>
              <p className="mt-1 text-sm text-red-100">Inicia sesión con tu usuario y contraseña</p>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
            )}

            {okMessage && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{okMessage}</div>
            )}

            <div>
              <label htmlFor="usuario" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FieldUserIcon className="h-4 w-4 text-red-700" />
                Usuario
              </label>
              <div className="rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-200">
                <InputField id="usuario" type="text" placeholder="director.de.posgrados" value={usuario} onChange={setUsuario} onKeyDown={handleKeyDown} autoComplete="username" disabled={loading} />
              </div>
              {mostrarErrorUsuario && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                  {fieldErrors.usuario}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <LockClosedIcon className="h-4 w-4 text-red-700" />
                Contraseña
              </label>
              <div className="rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-200">
                <InputField id="password" type="password" placeholder="tu.contraseña" value={password} onChange={setPassword} onKeyDown={handleKeyDown} autoComplete="current-password" disabled={loading} />
              </div>
              {mostrarErrorPassword && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="text-right -mt-1 -mb-2">
              <button
                type="button"
                className="text-xs text-red-700 hover:text-red-900 hover:underline transition-colors"
                onClick={() => navigate(`/recuperar-password?loginRuta=/posgrados/login&rol=Posgrados`)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full rounded-md bg-red-700 p-3 font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {loading && <SpinnerIcon className="h-4 w-4 animate-spin text-white" />}
                Iniciar sesión
              </button>
            </div>

            <SelectorTipoUsuario tipoActivo="posgrados" />
          </form>
        </div>
      </div>
    </div>
  );
}

function SelectorTipoUsuario({ tipoActivo }: { tipoActivo?: string }) {
  const tipos = [
    { nombre: "Superadmin",           rutaLogin: "/superadmin/login", tipo: "superadmin", icono: <UserShieldIcon size={40} color="currentColor" /> },
    { nombre: "Posgrados",            rutaLogin: "/posgrados/login",  tipo: "posgrados",  icono: <UserCheckIcon  size={40} color="currentColor" /> },
    { nombre: "Director de programa", rutaLogin: "/programa/login",   tipo: "programa",   icono: <UserIcon       size={40} color="currentColor" /> },
  ] as const;

  return (
    <section className="mt-2 border-t border-red-100 pt-4">
      <div className="flex items-center justify-around gap-5">
        {tipos.map((tipo) => {
          const esActivo = tipo.tipo === tipoActivo;
          return (
            <Link
              key={tipo.tipo}
              to={tipo.rutaLogin}
              aria-label={`Login ${tipo.nombre}`}
              title={`Login ${tipo.nombre}`}
              aria-current={esActivo ? "page" : undefined}
              className={[
                "group inline-flex items-center justify-center rounded-full p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                esActivo
                  ? "bg-red-50 text-red-700 shadow-sm"
                  : "text-red-500 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700",
              ].join(" ")}
            >
              {tipo.icono}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── Íconos exportados (usados en ProgramaLogin.tsx) ───────────────────────────

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  background?: string;
  opacity?: number;
  rotation?: number;
  shadow?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  padding?: number;
};

export const UserCheckIcon = ({
  size = 4,
  color = "#000000",
  strokeWidth = 2,
  background = "transparent",
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
}: IconProps) => {
  const transforms = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push("scaleX(-1)");
  if (flipVertical) transforms.push("scaleY(-1)");

  const viewBoxSize = 24 + padding * 2;
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(" ") || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== "transparent" ? background : undefined,
      }}
    >
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4m1 4l2 2l4-4" />
    </svg>
  );
};

export const UserIcon = ({
  size = 4,
  color = "#000000",
  strokeWidth = 2,
  background = "transparent",
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
}: IconProps) => {
  const transforms = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push("scaleX(-1)");
  if (flipVertical) transforms.push("scaleY(-1)");

  const viewBoxSize = 24 + padding * 2;
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(" ") || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== "transparent" ? background : undefined,
      }}
    >
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  );
};

export const UserShieldIcon = ({
  size = 4,
  color = "#000000",
  strokeWidth = 2,
  background = "transparent",
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0,
}: IconProps) => {
  const transforms = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push("scaleX(-1)");
  if (flipVertical) transforms.push("scaleY(-1)");

  const viewBoxSize = 24 + padding * 2;
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(" ") || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== "transparent" ? background : undefined,
      }}
    >
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M6 21v-2a4 4 0 0 1 4-4h2m10 1c0 4-2.5 6-3.5 6S15 20 15 16c1 0 2.5-.5 3.5-1.5c1 1 2.5 1.5 3.5 1.5M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0" />
    </svg>
  );
};
