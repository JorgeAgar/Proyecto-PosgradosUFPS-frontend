import { useState } from "react";
import { useNavigate } from "react-router";
import InputField from "../../components/InputField";
import PaginaAuth from "../../components/auth/PaginaAuth";
import SelectorTipoUsuario from "../../components/auth/SelectorTipoUsuario";
import ufpsLogo from "../../assets/NEGROufps.png";
import { superadminAuthService } from "../../services/superadmin/superadminService";
import {
  ExclamationCircleIcon,
  LockBoxIcon,
  SpinnerIcon,
  ShieldIcon,
  UserIconLabel,
} from "../../assets/icons";

export default function LoginSuperAdmin() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ usuario?: string; password?: string }>({});

  // Muestra error bajo el input si hay un error en ese campo (cubre campo vacío al submit).
  const mostrarErrorUsuario  = !!fieldErrors.usuario;
  const mostrarErrorPassword = !!fieldErrors.password;

  const validate = () => {
    const errs: { usuario?: string; password?: string } = {};
    if (!usuario.trim()) errs.usuario = "El usuario es obligatorio.";
    if (!password.trim()) errs.password = "La contraseña es obligatoria.";
    else if (password.trim().length < 6) errs.password = "Mínimo 6 caracteres.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setError("Revisa los campos marcados para continuar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await superadminAuthService.login(usuario.trim(), password);
      navigate("/superadmin/inicio");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Credenciales inválidas.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaginaAuth fondo="imagen" logo={ufpsLogo}>
      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-4">
        <div className="text-center animate-fade-in-up bg-slate-900 text-white rounded-md p-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShieldIcon />
            <h1 className="text-2xl font-bold tracking-wide">Administrador</h1>
          </div>
          <p className="text-xs mt-1 text-slate-300">Acceso restringido al panel administrativo</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-md text-sm border animate-fade-in bg-red-50 border-red-200 text-red-900">
            {error}
          </div>
        )}

        <div className="animate-fade-in-up">
          <label htmlFor="usuario" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <UserIconLabel />
            Usuario
          </label>
          <div className="bg-white rounded-lg border border-gray-300 hover:border-gray-400 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
            <InputField
              id="usuario"
              type="text"
              placeholder="administrador"
              value={usuario}
              onChange={(v) => { setUsuario(v); setFieldErrors((p) => ({ ...p, usuario: undefined })); setError(null); }}
              autoComplete="username"
              disabled={loading}
            />
          </div>
          {mostrarErrorUsuario && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
              <ExclamationCircleIcon strokeWidth="1.8" />
              {fieldErrors.usuario}
            </p>
          )}
        </div>

        <div className="animate-fade-in-up">
          <label htmlFor="sa-password" className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <LockBoxIcon />
            Contraseña
          </label>
          <div className="bg-white rounded-lg border border-gray-300 hover:border-gray-400 focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200">
            <InputField
              id="sa-password"
              type="password"
              placeholder="tu.contraseña"
              value={password}
              onChange={(v) => { setPassword(v); setFieldErrors((p) => ({ ...p, password: undefined })); setError(null); }}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          {mostrarErrorPassword && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-600">
              <ExclamationCircleIcon strokeWidth="1.8" />
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* ¿Olvidaste tu contraseña? — navega sin recargar la página (SPA) */}
        <div className="text-right -mt-1 -mb-2">
          <button
            type="button"
            className="text-xs text-slate-600 hover:text-slate-900 hover:underline transition-colors"
            onClick={() =>
              navigate(
                "/recuperar-password?loginRuta=/superadmin/login&rol=Superadmin"
              )
            }
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <div className="mt-1 animate-fade-in-up">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full text-white font-bold bg-slate-900 rounded-md p-3 hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading && <SpinnerIcon className="animate-spin h-4 w-4 text-white" />}
            {loading ? "Validando..." : "Iniciar sesión"}
          </button>
        </div>

        <SelectorTipoUsuario tipoActivo="superadmin" tema="oscuro" />
      </form>
    </PaginaAuth>
  );
}
