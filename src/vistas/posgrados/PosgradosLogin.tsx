import LoginForm from "../../components/auth/LoginForm";
import PaginaAuth from "../../components/auth/PaginaAuth";
import SelectorTipoUsuario from "../../components/auth/SelectorTipoUsuario";
import { posgradosAuthService } from "../../services/posgrados/posgradosService.ts";

export default function PosgradosLogin() {
  return (
    <PaginaAuth>
      <LoginForm
        titulo="Acceso Posgrados"
        subtitulo="Inicia sesión con tu usuario y contraseña"
        placeholderUsuario="director.de.posgrados"
        onLogin={async (usuario, password) => { await posgradosAuthService.login(usuario, password); }}
        rutaExito="/posgrados"
        rutaRecuperar="/recuperar-password?loginRuta=/posgrados/login&rol=Posgrados"
        pie={<SelectorTipoUsuario tipoActivo="posgrados" />}
      />
    </PaginaAuth>
  );
}
