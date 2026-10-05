import ufpsLogoPorDefecto from "../../assets/logoufps.png";
import flujoabs from "../../assets/flujoabs.jpg";

const TARJETA = {
  degradado:
    "bg-white/80 backdrop-blur-sm rounded-xl shadow-[0_10px_48px_rgba(99,39,39,0.12)] border border-red-100",
  imagen:
    "bg-white rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.15)]",
};

function FondoDecorativo() {
  return (
    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
      <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800" aria-hidden>
        <defs>
          <linearGradient id="auth-g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#fff5f5" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <linearGradient id="auth-g2" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffe3e3" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#fff6f6" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-g1)" />
        <g opacity="0.95">
          <circle cx="1200" cy="80" r="180" fill="url(#auth-g2)" />
          <circle cx="200" cy="700" r="220" fill="#fff1f0" opacity="0.85" />
          <ellipse cx="900" cy="420" rx="420" ry="180" fill="#fff3f2" opacity="0.8" />
        </g>
        <g fill="#fee2e2" opacity="0.4">
          <rect x="40" y="40" width="280" height="180" rx="24" />
          <rect x="1080" y="560" width="240" height="120" rx="20" />
        </g>
      </svg>
    </div>
  );
}

interface PaginaAuthProps {
  /** "degradado": fondo rojo claro con formas SVG. "imagen": fotografía de fondo. */
  fondo?: keyof typeof TARJETA;
  logo?: string;
  /** Contenido adicional junto al logo. */
  logoExtra?: React.ReactNode;
  /** Contenido de la tarjeta central (normalmente un formulario). */
  children: React.ReactNode;
}

/** Página de autenticación: fondo, logos institucionales y tarjeta flotante centrada. */
export default function PaginaAuth({ fondo = "degradado", logo = ufpsLogoPorDefecto, logoExtra, children }: PaginaAuthProps) {
  const esImagen = fondo === "imagen";
  return (
    <div
      className={`animate-fade-in min-h-screen w-full relative overflow-hidden ${
        esImagen ? "bg-no-repeat bg-cover bg-center" : "bg-linear-to-b from-red-50 via-white to-gray-100"
      }`}
      style={esImagen ? { backgroundImage: `url(${flujoabs})` } : undefined}
    >
      {!esImagen && <FondoDecorativo />}

      {/* Logos institucionales */}
      <div className="relative flex flex-col w-full min-h-30">
        <div className="animate-slide-left delay-200 flex items-center gap-5 px-8 py-5">
          <img src={logo} alt="Universidad Francisco de Paula Santander" className="h-14 w-auto" />
          {logoExtra}
        </div>
      </div>

      {/* Tarjeta flotante */}
      <div className="flex items-center justify-center px-4 pb-10">
        <div className={`${TARJETA[fondo]} p-8 w-full max-w-90 animate-fade-in-up delay-200`}>{children}</div>
      </div>
    </div>
  );
}
