import LoginForm from "../../components/auth/LoginForm";
import PaginaAuth from "../../components/auth/PaginaAuth";
import SelectorTipoUsuario from "../../components/auth/SelectorTipoUsuario";
import { programaAuthService } from "../../services/programa/programaService";

export default function ProgramaLogin() {
  return (
    <PaginaAuth>
      <LoginForm
        titulo="Acceso Director de Programa"
        subtitulo="Inicia sesión con tu usuario y contraseña"
        placeholderUsuario="director.de.programa"
        onLogin={async (usuario, password) => { await programaAuthService.login(usuario, password, "Director de programa"); }}
        rutaExito="/programa"
        rutaRecuperar="/recuperar-password?loginRuta=/programa/login&rol=Director"
        pie={<SelectorTipoUsuario tipoActivo="programa" />}
      />
    </PaginaAuth>
  );
}
