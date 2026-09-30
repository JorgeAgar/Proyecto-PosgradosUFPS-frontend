import { Link } from "react-router";
import { UserCheckIcon, UserIcon, UserShieldIcon } from "../../assets/icons";

export type TipoUsuarioLogin = "superadmin" | "posgrados" | "programa";

const TIPOS = [
  { nombre: "Superadmin", rutaLogin: "/superadmin/login", tipo: "superadmin", Icono: UserShieldIcon },
  { nombre: "Posgrados", rutaLogin: "/posgrados/login", tipo: "posgrados", Icono: UserCheckIcon },
  { nombre: "Director de programa", rutaLogin: "/programa/login", tipo: "programa", Icono: UserIcon },
] as const;

const TEMAS = {
  rojo: {
    borde: "border-red-100",
    foco: "focus-visible:ring-red-500",
    activo: "bg-red-50 text-red-700 shadow-sm",
    inactivo: "text-red-500 hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700",
  },
  oscuro: {
    borde: "border-slate-200",
    foco: "focus-visible:ring-slate-500",
    activo: "bg-slate-100 text-slate-900 shadow-sm",
    inactivo: "text-slate-500 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900",
  },
};

/** Accesos rápidos entre los logins administrativos (superadmin, posgrados, director). */
export default function SelectorTipoUsuario({ tipoActivo, tema = "rojo" }: { tipoActivo: TipoUsuarioLogin; tema?: keyof typeof TEMAS }) {
  const t = TEMAS[tema];
  return (
    <section className={`mt-2 border-t pt-4 ${t.borde}`}>
      <div className="flex items-center justify-around gap-5">
        {TIPOS.map(({ nombre, rutaLogin, tipo, Icono }) => {
          const esActivo = tipo === tipoActivo;
          return (
            <Link
              key={tipo}
              to={rutaLogin}
              aria-label={`Login ${nombre}`}
              title={`Login ${nombre}`}
              aria-current={esActivo ? "page" : undefined}
              className={`group inline-flex items-center justify-center rounded-full p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${t.foco} ${esActivo ? t.activo : t.inactivo}`}
            >
              <Icono size={40} color="currentColor" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
