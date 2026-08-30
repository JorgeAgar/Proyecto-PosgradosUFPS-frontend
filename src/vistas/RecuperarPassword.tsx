/**
 * RecuperarPassword.tsx
 *
 * Vista de recuperación de contraseña para todos los roles del sistema UFPS.
 *
 * Características:
 *  - Misma estructura visual (fondo, logos, tarjeta centrada) que los demás logins.
 *  - Recibe el rol (origenRol) y la ruta de regreso (loginRuta) via query params
 *    para que el botón "Volver al login" lleve al login correcto según el rol.
 *  - Validaciones de email en frontend (vacío + formato).
 *  - Mock del envío de correo (preparado para conexión real con API).
 *  - Estado de éxito reemplaza el botón "Enviar" por "Volver al login".
 *
 * Query params esperados (opcionales):
 *   ?loginRuta=/comite/login   → ruta a la que vuelve el botón
 *   ?rol=Comité Curricular                → label del rol para el subtítulo
 *
 * Si no se reciben, el botón vuelve a "/" (login general).
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ufpsLogo from "../assets/logoufps.png";
import flujoabs from "../assets/flujoabs.jpg";
import { ArrowLeftIcon, CheckCircleIcon, SpinnerIcon } from "../assets/icons";

// ── Íconos inline (misma convención que los otros logins) ──────────────────────

function EnvelopeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

// ── Utilidades de validación ───────────────────────────────────────────────────

/** Verifica que el string no esté vacío. */
function esVacio(valor: string): boolean {
  return valor.trim().length === 0;
}

/** Verifica que el string contenga al menos un "@". */
function tieneArroba(valor: string): boolean {
  return valor.includes("@");
}

/**
 * Validación completa del campo correo.
 * Retorna el mensaje de error o null si todo está bien.
 */
function validarCorreo(valor: string): string | null {
  if (esVacio(valor)) return "El correo es obligatorio";
  if (!tieneArroba(valor)) return "Ingrese un correo válido";
  return null;
}

async function enviarCorreoRecuperacion(correo: string): Promise<void> {
  const url = `${import.meta.env.VITE_API_URL}/api/application/case/recuperarContrasena/solicitar`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = 'No se pudo enviar el correo. Intenta de nuevo.';
    try {
      const body = JSON.parse(text) as Record<string, unknown>;
      if (typeof body['message'] === 'string') message = body['message'];
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RecuperarPassword() {
  const navigate = useNavigate();

  // Lee query params para saber a qué login volver según el rol
  const [searchParams] = useSearchParams();
  const loginRuta = searchParams.get("loginRuta") ?? "/";
  const rol = searchParams.get("rol") ?? "";

  // Estado del formulario
  const [correo, setCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);

  // Estado de la petición
  const [loading, setLoading] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  // ── Manejadores ─────────────────────────────────────────────────────────────

  /** Actualiza el campo y limpia el error de ese campo. */
  const handleCorreoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCorreo(e.target.value);
    setErrorCorreo(null);
    setErrorGeneral(null);
  };

  /** Valida y ejecuta el envío del correo de recuperación. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación frontend
    const errorValidacion = validarCorreo(correo);
    if (errorValidacion) {
      setErrorCorreo(errorValidacion);
      return;
    }

    setLoading(true);
    setErrorGeneral(null);

    try {
      await enviarCorreoRecuperacion(correo.trim());
      setEnviado(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.";
      setErrorGeneral(msg);
    } finally {
      setLoading(false);
    }
  };

  /** Navega de regreso al login correspondiente al rol. */
  const handleVolverLogin = () => {
    navigate(loginRuta);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="animate-fade-in min-h-screen w-full relative overflow-hidden bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: `url(${flujoabs})` }}
    >
      {/* ── Logos institucionales (idénticos al resto de logins) ── */}
      <div className="relative flex flex-col w-full min-h-30">
        <div className="animate-slide-left delay-200 flex items-center gap-5 px-8 py-5">
          <img
            src={ufpsLogo}
            alt="Universidad Francisco de Paula Santander"
            className="h-14 w-auto"
          />
        </div>
      </div>

      {/* ── Tarjeta flotante (misma estructura que los logins) ── */}
      <div className="flex items-center justify-center px-4 pb-10">
        <div className="bg-white rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.15)] p-8 w-full max-w-90 animate-fade-in-up delay-200">
          <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-4">

            {/* Encabezado del formulario */}
            <div className="text-center animate-fade-in-up rounded-md bg-red-700 text-white p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <KeyIcon />
                <h1 className="text-2xl font-bold tracking-wide">
                  Recuperación de contraseña
                </h1>
              </div>
              {rol && (
                <p className="text-xs mt-1 text-red-100">
                  {rol}
                </p>
              )}
            </div>

            {/* Mensaje de error general (ej: correo no registrado) */}
            {errorGeneral && (
              <div className="px-4 py-3 rounded-md text-sm border animate-fade-in bg-red-50 border-red-200 text-red-900">
                {errorGeneral}
              </div>
            )}

            {/* ── Flujo exitoso: mensaje + botón volver ── */}
            {enviado ? (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Mensaje de éxito */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-md border bg-emerald-50 border-emerald-200 text-emerald-900 text-sm">
                  <span className="mt-0.5 text-emerald-600 shrink-0">
                    <CheckCircleIcon className="h-5 w-5" strokeWidth="1.8" />
                  </span>
                  <p>
                    Se envió un correo electrónico con el enlace de recuperación a la dirección:{" "}
                    <span className="font-semibold break-all">{correo.trim()}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVolverLogin}
                  className="flex items-center justify-center gap-2 w-full text-white font-bold bg-red-700 rounded-md p-3 hover:bg-red-800 transition-colors cursor-pointer"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Volver al login
                </button>
              </div>
            ) : (
              /* ── Flujo normal: campo de correo + botón enviar ── */
              <>
                {/* Descripción breve */}
                <p className="text-sm text-gray-600 animate-fade-in-up">
                  Ingresa tu correo electrónico y te enviaremos una nueva contraseña generada.
                </p>

                {/* Campo correo */}
                <div className="animate-fade-in-up">
                  <label
                    htmlFor="rp-email"
                    className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-gray-700"
                  >
                    <span className="text-red-700">
                      <EnvelopeIcon />
                    </span>
                    Correo electrónico
                  </label>
                  <div
                    className={`rounded-md border bg-gray-50 focus-within:ring-2 focus-within:ring-red-200 ${
                      errorCorreo ? "border-red-400" : "border-gray-200"
                    }`}
                  >
                    <input
                      id="rp-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={correo}
                      onChange={handleCorreoChange}
                      autoComplete="email"
                      disabled={loading}
                      className="w-full bg-transparent px-3 py-2 text-sm outline-none text-gray-800 placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  {/* Mensaje de error de validación */}
                  {errorCorreo && (
                    <p className="mt-1 text-xs text-red-600">{errorCorreo}</p>
                  )}
                </div>

                {/* Botón enviar */}
                <div className="mt-1 animate-fade-in-up">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 w-full text-white font-bold bg-red-700 rounded-md p-3 hover:bg-red-800 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-red-400"
                  >
                    {loading && <SpinnerIcon className="animate-spin h-4 w-4 text-white" />}
                    {loading ? "Enviando..." : "Enviar nueva contraseña"}
                  </button>
                </div>

                {/* Enlace volver al login */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleVolverLogin}
                    className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 hover:underline transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Volver al login
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
