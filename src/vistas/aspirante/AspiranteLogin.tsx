import LoginForm from "../../components/auth/LoginForm";
import PaginaAuth from "../../components/auth/PaginaAuth";
import { aspiranteAuthService } from "../../services/aspirante/aspiranteService";

export default function AspiranteLogin() {
  return (
    <PaginaAuth
      logoExtra={
        <>
          <div className="w-px h-10 bg-gray-200" />
          <div className="flex flex-col items-center justify-center bg-gray-100 rounded px-3 py-2 border border-gray-200">
            <span className="text-xl font-extrabold leading-none">UFPS</span>
            <span className="text-[9px] text-gray-500 font-semibold mt-0.5 text-center leading-tight">
              Universidad Francisco de<br />Paula Santander
            </span>
          </div>
        </>
      }
    >
      <LoginForm
        titulo="Acceso Aspirante"
        subtitulo="Inicia sesión con tu correo y contraseña"
        placeholderUsuario="aspirante"
        mensajeUsuarioVacio="El correo es obligatorio."
        onLogin={async (usuario, password) => { await aspiranteAuthService.login(usuario, password); }}
        rutaExito="/aspirante/inicio"
        rutaRecuperar="/recuperar-password?loginRuta=/aspirante/login&rol=Aspirante"
      />
    </PaginaAuth>
  );
}
