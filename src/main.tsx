import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import "./index.css";

// Layout global del aspirante (incluye Sidebar)
import AspiranteLayout from "./layouts/AspiranteLayout.tsx";

// Vistas del aspirante (se renderizan dentro del layout)
import AspiranteLogin from "./vistas/aspirante/AspiranteLogin.tsx";
import AspiranteInicio from "./vistas/aspirante/AspiranteInicio.tsx";
import AspiranteEstado from "./vistas/aspirante/AspiranteEstado.tsx";
import AspiranteDocumentos from "./vistas/aspirante/AspiranteDocumentos.tsx";
import AspiranteActividades from "./vistas/aspirante/AspiranteActividades.tsx";
import AspiranteCriterios from "./vistas/aspirante/AspiranteCriterios.tsx";
// import Registro from "./vistas/Registro"; agregar cuando este listo el registro

// Vistas del superadmin
import LoginSuperAdmin from "./vistas/superadmin/SuperadminLogin.tsx";
import SuperadminLayout from "./layouts/SuperadminLayout.tsx";
import SuperadminInicio from "./vistas/superadmin/SuperadminInicio.tsx";
import SuperadminUsuarios from "./vistas/superadmin/SuperadminUsuarios.tsx";
import SuperadminCohortes from "./vistas/superadmin/SuperadminCohortes.tsx";
import SuperadminSemestres from "./vistas/superadmin/SuperadminSemestres.tsx";
import SuperadminValoresGlobales from "./vistas/superadmin/SuperadminValoresGlobales.tsx";
import SuperadminDocumentos from "./vistas/superadmin/SuperadminDocumentos.tsx";
import SuperadminUltimosCodigos from "./vistas/superadmin/SuperadminUltimosCodigos.tsx";

// Recuperación y cambio de contraseña (rutas compartidas por todos los roles)
import RecuperarPassword from "./vistas/RecuperarPassword.tsx";
import CambiarPassword from "./vistas/CambiarPassword.tsx";

// Vistas del director de programa
import ProgramaLogin from "./vistas/programa/ProgramaLogin.tsx";
import ProgramaInicio from "./vistas/programa/ProgramaInicio.tsx";
import CrearCohorte from "./vistas/programa/cohorte/CrearCohorte.tsx";
import ProgramaDocumentos from "./vistas/programa/documentos/ProgramaDocumentos.tsx";
import ProgramaLayout from "./layouts/ProgramaLayout.tsx";
import Cohortes from "./vistas/programa/cohorte/Cohortes.tsx";
import Criterios from "./vistas/programa/Criterios.tsx";
import ValidacionDocumentos from "./vistas/programa/validacion/ValidacionDocumentos.tsx";
import ValidacionCohorteDetalle from "./vistas/programa/validacion/ValidacionCohorteDetalle.tsx";
import ValidacionAspiranteDetalle from "./vistas/programa/validacion/ValidacionAspiranteDetalle.tsx";
import ValidacionCohortesPagos from "./vistas/programa/pagos/ValidacionCohortesPagos.tsx";
import ValidacionPagos from "./vistas/programa/pagos/ValidacionPagos.tsx";
import ValidacionPagosDetalle from "./vistas/programa/pagos/ValidacionPagosDetalle.tsx";
import Calificacion from "./vistas/programa/calificacion/Calificacion.tsx";
import CalificacionCohorte from "./vistas/programa/calificacion/CalificacionCohorte.tsx";
import CalificacionAspirante from "./vistas/programa/calificacion/CalificacionAspirante.tsx";
import Admitidos from "./vistas/programa/admitidos/Admitidos.tsx";
import AdmitidosCohorte from "./vistas/programa/admitidos/AdmitidosCohorte.tsx";

// Vistas de posgrados
import Posgrados from "./vistas/posgrados/Posgrados.tsx";
import PosgradosLogin from "./vistas/posgrados/PosgradosLogin.tsx";
import PosgradosLayout from "./layouts/PosgradosLayout.tsx";
import Registro from "./vistas/Registro.tsx";
import AspirantePagos from "./vistas/aspirante/pagos/AspirantePagos.tsx";
import AspirantePagoDetalle from "./vistas/aspirante/pagos/AspirantePagoDetalle.tsx";

/**
 * Punto de entrada de la aplicación.
 *
 * Rutas definidas:
 *   /                        → Vista de login (autenticación)
 *   /funcionario/home        → Home del funcionario
 *   /funcionario/dashboard   → Dashboard del funcionario
 *
 *   /aspirante/*             → Rutas anidadas bajo AspiranteLayout (con Sidebar)
 *     /aspirante/inicio      → Home del aspirante
 *     /aspirante/estado      → Estado del proceso del aspirante
 *     /aspirante/documentos  → Gestión de documentos
 *     /aspirante/entrevista  → Información de entrevista
 *     /aspirante/prueba      → Prueba de admisión
 *
 *    /registro                   → Formulario de inscripción (público)
 * TODO: agregar /recuperar-clave cuando estén listos.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ── Raíz: redirige al login del aspirante ── */}
        <Route path="/" element={<Navigate to="/programa/login" replace />} />
        {/* ── Rutas públicas ── */}
        <Route path="aspirante/login" element={<AspiranteLogin />} />
        <Route path="registro" element={<Registro />} />
        {/* Recuperación de contraseña — ruta compartida por todos los roles        */}
        {/* Recibe query params: ?loginRuta=/ruta-del-login&rol=NombreRol            */}
        {/* Ejemplo: /recuperar-password?loginRuta=/comite/login&rol=... */}
        <Route path="recuperar-password" element={<RecuperarPassword />} />
        <Route path="cambiar-password" element={<CambiarPassword />} />

        {/* ── Rutas del superadmin ── */}
        <Route path="superadmin/login" element={<LoginSuperAdmin />} />
        <Route path="superadmin" element={<SuperadminLayout />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<SuperadminInicio />} />
          <Route path="usuarios" element={<SuperadminUsuarios />} />
          <Route path="programas" element={<SuperadminCohortes />} />
          <Route path="semestres" element={<SuperadminSemestres />} />
          <Route path="valores-globales" element={<SuperadminValoresGlobales />} />
          <Route path="ultimos-codigos" element={<SuperadminUltimosCodigos />} />
          <Route path="documentos-consejo" element={<SuperadminDocumentos />} />
        </Route>

        {/* Rutas del director de programa ── */}
        <Route path="programa/login" element={<ProgramaLogin />} />
        <Route path="programa" element={<ProgramaLayout />}>
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<ProgramaInicio />} />
          <Route path="crear-cohorte" element={<CrearCohorte />} />
          <Route path="cohortes" element={<Cohortes />} />
          <Route path="documentos" element={<ProgramaDocumentos />} />
          <Route path="criterios" element={<Criterios />} />
          <Route path="pagos/inscripcion" element={<ValidacionCohortesPagos key="inscripcion" tipo="inscripcion" />} />
          <Route path="pagos/inscripcion/cohorte/:cohorteId" element={<ValidacionPagos key="inscripcion" tipo="inscripcion" />} />
          <Route path="pagos/inscripcion/:aspiranteId" element={<ValidacionPagosDetalle key="inscripcion" tipo="inscripcion" />} />
          <Route path="pagos/matricula" element={<ValidacionCohortesPagos key="matricula" tipo="matricula" />} />
          <Route path="pagos/matricula/cohorte/:cohorteId" element={<ValidacionPagos key="matricula" tipo="matricula" />} />
          <Route path="pagos/matricula/:aspiranteId" element={<ValidacionPagosDetalle key="matricula" tipo="matricula" />} />
          <Route path="validacion" element={<ValidacionDocumentos />} />
          <Route path="validacion/cohorte/:cohorteId" element={<ValidacionCohorteDetalle />} />
          <Route path="validacion/aspirantes/:cohorteId/:aspiranteId" element={<ValidacionAspiranteDetalle />} />
          <Route path="admision/calificacion" element={<Calificacion />} />
          <Route path="admision/calificacion/cohorte/:cohorteId" element={<CalificacionCohorte />} />
          <Route path="admision/calificacion/:id" element={<CalificacionAspirante />} />
          <Route path="admision/admitidos" element={<Admitidos />} />
          <Route path="admision/admitidos/cohorte/:cohorteId" element={<AdmitidosCohorte />} />
        </Route>

        {/* ── Rutas del aspirante: layout con Sidebar ── */}
        <Route path="/aspirante" element={<AspiranteLayout />}>
          {/* /aspirante → redirige automáticamente a /aspirante/inicio */}
          <Route index element={<Navigate to="inicio" replace />} />
          <Route path="inicio" element={<AspiranteInicio />} />
          <Route path="estado" element={<AspiranteEstado />} />
          <Route path="documentos" element={<AspiranteDocumentos />} />
          <Route path="entrevista" element={<AspiranteActividades key="entrevista" tipo="entrevista" />} />
          <Route path="pagos" element={<AspirantePagos />} />
          <Route path="pagos/inscripcion" element={<AspirantePagoDetalle key="inscripcion" tipo="inscripcion" />} />
          <Route path="pagos/matricula" element={<AspirantePagoDetalle key="matricula" tipo="matricula" />} />
          <Route path="prueba" element={<AspiranteActividades key="prueba" tipo="prueba" />} />
          <Route path="criterios" element={<AspiranteCriterios />} />
          {/* <Route path="/registro" element={<Registro />} />
          descomentar y conectar cuando estén listas:
          <Route path="/recuperar-clave" element={<RecuperarClave />} />
          <Route path="/dashboard" element={<Dashboard />} /> */}
        </Route>

        {/* Rutas del usuario posgrados */}
        <Route path="posgrados/login" element={<PosgradosLogin />} />
        <Route path="posgrados" element={<PosgradosLayout />}>
          <Route index element={<Posgrados />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
