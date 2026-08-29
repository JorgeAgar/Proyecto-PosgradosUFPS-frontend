/**
 * CambioContrasena.tsx
 *
 * Vista de cambio de contraseña para todos los roles del sistema UFPS.
 * Misma estructura visual que RecuperarPassword.tsx.
 *
 * Query params esperados (opcionales):
 *   ?loginRuta=/programa/login  → ruta a la que vuelve el botón "Volver al login"
 *   ?rol=Director de Programa   → label del rol para el subtítulo
 *   ?token=abc123               → token de recuperación recibido por email
 *
 * Si no se reciben loginRuta, el botón vuelve a "/".
 */

import { useState } from "react";
import { /*useNavigate,*/ useSearchParams } from "react-router";
import ufpsLogo from "../assets/logoufps.png";
import flujoabs from "../assets/flujoabs.jpg";
import { SpinnerIcon } from "../assets/icons";

// ── Íconos ─────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function LockIconSm() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// function ArrowLeftIcon() {
//   return (
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
//       <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
//     </svg>
//   );
// }

// ── Validaciones ──────────────────────────────────────────────────────────────

function validarContrasena(valor: string): string | null {
  if (valor.trim().length === 0) return "La contraseña es obligatoria";
  if (valor.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  return null;
}

function validarConfirmacion(contrasena: string, confirmacion: string): string | null {
  if (confirmacion.trim().length === 0) return "Confirma tu nueva contraseña";
  if (contrasena !== confirmacion) return "Las contraseñas no coinciden";
  return null;
}

// ── Petición API ──────────────────────────────────────────────────────────────

async function cambiarContrasenaApi(token: string, contrasena: string): Promise<void> {
  const url = `${import.meta.env.VITE_API_URL}/api/application/case/recuperarContrasena/cambiar`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, nuevaContrasena: contrasena }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = "No se pudo cambiar la contraseña. Intenta de nuevo.";
    try {
      const body = JSON.parse(text) as Record<string, unknown>;
      if (typeof body["message"] === "string") message = body["message"];
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CambioContrasena() {
  // const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // const loginRuta = searchParams.get("loginRuta") ?? "/";
  const rol = searchParams.get("rol") ?? "";
  const token = searchParams.get("token") ?? "";

  // Estado del formulario
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [errorContrasena, setErrorContrasena] = useState<string | null>(null);
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(null);

  // Estado de la petición
  const [loading, setLoading] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cambiado, setCambiado] = useState(false);

  // Derived state
  const contrasenaValida = contrasena.length >= 8;
  const contrasenasConcuerdan = confirmacion.length > 0 && contrasena === confirmacion;
  const botonDeshabilitado = loading || !contrasenaValida || !contrasenasConcuerdan;

  // ── Manejadores ──────────────────────────────────────────────────────────────

  const handleContrasenaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContrasena(val);
    setErrorGeneral(null);
    setErrorContrasena(val.length > 0 && val.length < 8 ? "La contraseña debe tener al menos 8 caracteres" : null);
    if (confirmacion.length > 0) {
      setErrorConfirmacion(val !== confirmacion ? "Las contraseñas no coinciden" : null);
    }
  };

  const handleConfirmacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmacion(val);
    setErrorGeneral(null);
    setErrorConfirmacion(val.length > 0 && val !== contrasena ? "Las contraseñas no coinciden" : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errPass = validarContrasena(contrasena);
    const errConf = validarConfirmacion(contrasena, confirmacion);
    if (errPass || errConf) {
      setErrorContrasena(errPass);
      setErrorConfirmacion(errConf);
      return;
    }

    setLoading(true);
    setErrorGeneral(null);

    try {
      await cambiarContrasenaApi(token, contrasena);
      setCambiado(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.";
      setErrorGeneral(msg);
    } finally {
      setLoading(false);
    }
  };

  // const handleVolverLogin = () => navigate(loginRuta);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="animate-fade-in min-h-screen w-full relative overflow-hidden bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: `url(${flujoabs})` }}
    >
      {/* ── Logos institucionales ── */}
      <div className="relative flex flex-col w-full min-h-30">
        <div className="animate-slide-left delay-200 flex items-center gap-5 px-8 py-5">
          <img
            src={ufpsLogo}
            alt="Universidad Francisco de Paula Santander"
            className="h-14 w-auto"
          />
        </div>
      </div>

      {/* ── Tarjeta flotante ── */}
      <div className="flex items-center justify-center px-4 pb-10">
        <div className="bg-white rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] p-8 w-full max-w-90 animate-fade-in-up delay-200">
          <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-4">

            {/* Encabezado */}
            <div className="text-center animate-fade-in-up rounded-md bg-red-700 text-white p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <LockIcon />
                <h1 className="text-2xl font-bold tracking-wide">
                  Cambiar contraseña
                </h1>
              </div>
              {rol && (
                <p className="text-xs mt-1 text-red-100">{rol}</p>
              )}
            </div>

            {/* Error general (respuesta del API) */}
            {errorGeneral && (
              <div className="px-4 py-3 rounded-md text-sm border animate-fade-in bg-red-100 border-red-200 text-red-700">
                {errorGeneral}
              </div>
            )}

            {/* ── Flujo exitoso ── */}
            {cambiado ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="flex items-start gap-3 px-4 py-3 rounded-md border bg-green-100 border-green-200 text-green-700 text-sm">
                  <span className="mt-0.5 shrink-0">
                    <CheckCircleIcon />
                  </span>
                  <p>
                    Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                  </p>
                </div>
                {/* <button
                  type="button"
                  onClick={handleVolverLogin}
                  className="flex items-center justify-center gap-2 w-full text-white font-bold bg-red-700 rounded-md p-3 hover:bg-red-800 transition-colors cursor-pointer"
                >
                  <ArrowLeftIcon />
                  Volver al login
                </button> */}
              </div>
            ) : (
              /* ── Flujo normal: dos campos de contraseña ── */
              <>
                <p className="text-sm text-gray-600 animate-fade-in-up">
                  Ingresa y confirma tu nueva contraseña. Debe tener al menos 8 caracteres.
                </p>

                {/* Campo: nueva contraseña */}
                <div className="animate-fade-in-up">
                  <label
                    htmlFor="cc-password"
                    className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700"
                  >
                    <span className="text-red-700">
                      <LockIconSm />
                    </span>
                    Nueva contraseña
                  </label>
                  <div
                    className={`rounded-md border bg-gray-50 focus-within:ring-2 focus-within:ring-red-200 flex items-center ${
                      errorContrasena ? "border-red-400" : "border-gray-200"
                    }`}
                  >
                    <input
                      id="cc-password"
                      type={mostrarContrasena ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={contrasena}
                      onChange={handleContrasenaChange}
                      autoComplete="new-password"
                      disabled={loading}
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarContrasena((v) => !v)}
                      className="px-3 py-2 text-neutral-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {mostrarContrasena ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errorContrasena && (
                    <p className="mt-1 text-xs text-red-600">{errorContrasena}</p>
                  )}
                </div>

                {/* Campo: confirmar contraseña */}
                <div className="animate-fade-in-up">
                  <label
                    htmlFor="cc-confirm"
                    className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700"
                  >
                    <span className="text-red-700">
                      <LockIconSm />
                    </span>
                    Confirmar contraseña
                  </label>
                  <div
                    className={`rounded-md border bg-gray-50 focus-within:ring-2 focus-within:ring-red-200 flex items-center ${
                      errorConfirmacion
                        ? "border-red-400"
                        : contrasenasConcuerdan
                          ? "border-green-400"
                          : "border-gray-200"
                    }`}
                  >
                    <input
                      id="cc-confirm"
                      type={mostrarConfirmacion ? "text" : "password"}
                      placeholder="Repite tu nueva contraseña"
                      value={confirmacion}
                      onChange={handleConfirmacionChange}
                      autoComplete="new-password"
                      disabled={loading}
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmacion((v) => !v)}
                      className="px-3 py-2 text-neutral-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={mostrarConfirmacion ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {mostrarConfirmacion ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errorConfirmacion && (
                    <p className="mt-1 text-xs text-red-600">{errorConfirmacion}</p>
                  )}
                  {!errorConfirmacion && contrasenasConcuerdan && (
                    <p className="mt-1 text-xs text-green-700">Las contraseñas coinciden</p>
                  )}
                </div>

                {/* Botón confirmar */}
                <div className="mt-1 animate-fade-in-up">
                  <button
                    type="submit"
                    disabled={botonDeshabilitado}
                    className="flex items-center justify-center gap-2 w-full text-white font-bold bg-red-700 rounded-md p-3 hover:bg-red-800 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-red-400"
                  >
                    {loading && <SpinnerIcon className="animate-spin h-4 w-4 text-white" />}
                    {loading ? "Guardando..." : "Confirmar nueva contraseña"}
                  </button>
                </div>

                {/* Enlace volver al login */}
                {/* <div className="text-center">
                  <button
                    type="button"
                    onClick={handleVolverLogin}
                    className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 hover:underline transition-colors"
                  >
                    <ArrowLeftIcon />
                    Volver al login
                  </button>
                </div> */}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
