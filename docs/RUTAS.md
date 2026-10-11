# Rutas

Este documento describe todas las rutas activas de la aplicación. Está basado directamente en `src/main.tsx`.

> Los parámetros usan la sintaxis `:paramName` (ej. `/programa/validacion/cohorte/:cohorteId`).

## Resumen rápido

| Ruta | Rol | Auth | Componente |
|---|---|:---:|---|
| `/` | — | No | Redirige a `/programa/login` |
| `/404` | Público | No | `NoEncontrado` |
| `*` (rutas inexistentes) | Público | No | Redirige a `/404` |
| `/registro` | Público | No | `Registro` |
| `/recuperar-password` | Todos los roles | No | `RecuperarPassword` |
| `/cambiar-password` | Todos los roles | No | `CambiarPassword` |
| `/aspirante/login` | Aspirante | No | `AspiranteLogin` |
| `/aspirante/inicio` | Aspirante | Sí | `AspiranteInicio` |
| `/aspirante/estado` | Aspirante | Sí | `AspiranteEstado` |
| `/aspirante/documentos` | Aspirante | Sí | `AspiranteDocumentos` |
| `/aspirante/entrevista` | Aspirante | Sí | `AspiranteEntrevista` |
| `/aspirante/prueba` | Aspirante | Sí | `AspirantePrueba` |
| `/aspirante/criterios` | Aspirante | Sí | `AspiranteCriterios` |
| `/aspirante/pagos` | Aspirante | Sí | `AspirantePagos` |
| `/aspirante/pagos/inscripcion` | Aspirante | Sí | `AspirantePagosInscripcion` |
| `/aspirante/pagos/matricula` | Aspirante | Sí | `AspirantePagosMatricula` |
| `/superadmin/login` | Superadmin | No | `SuperadminLogin` |
| `/superadmin/inicio` | Superadmin | Sí | `SuperadminInicio` |
| `/superadmin/usuarios` | Superadmin | Sí | `SuperadminUsuarios` |
| `/superadmin/programas` | Superadmin | Sí | `SuperadminCohortes` |
| `/superadmin/semestres` | Superadmin | Sí | `SuperadminSemestres` |
| `/superadmin/valores-globales` | Superadmin | Sí | `SuperadminValoresGlobales` |
| `/superadmin/ultimos-codigos` | Superadmin | Sí | `SuperadminUltimosCodigos` |
| `/superadmin/documentos-consejo` | Superadmin | Sí | `SuperadminDocumentos` |
| `/programa/login` | Director de programa | No | `ProgramaLogin` |
| `/programa/inicio` | Director de programa | Sí | `ProgramaInicio` |
| `/programa/cohortes` | Director de programa | Sí | `Cohortes` |
| `/programa/crear-cohorte` | Director de programa | Sí | `CrearCohorte` |
| `/programa/criterios` | Director de programa | Sí | `Criterios` |
| `/programa/documentos` | Director de programa | Sí | `ProgramaDocumentos` |
| `/programa/pagos/inscripcion` | Director de programa | Sí | `ValidacionCohortesInscripcion` |
| `/programa/pagos/inscripcion/cohorte/:cohorteId` | Director de programa | Sí | `ValidacionPagosInscripcion` |
| `/programa/pagos/inscripcion/:aspiranteId` | Director de programa | Sí | `ValidacionPagosInscripcionDetalle` |
| `/programa/pagos/matricula` | Director de programa | Sí | `ValidacionCohortesMatricula` |
| `/programa/pagos/matricula/cohorte/:cohorteId` | Director de programa | Sí | `ValidacionPagosMatricula` |
| `/programa/pagos/matricula/:aspiranteId` | Director de programa | Sí | `ValidacionPagosMatriculaDetalle` |
| `/programa/validacion` | Director de programa | Sí | `ValidacionDocumentos` |
| `/programa/validacion/cohorte/:cohorteId` | Director de programa | Sí | `ValidacionCohorteDetalle` |
| `/programa/validacion/aspirantes/:cohorteId/:aspiranteId` | Director de programa | Sí | `ValidacionAspiranteDetalle` |
| `/programa/admision/calificacion` | Director de programa | Sí | `Calificacion` |
| `/programa/admision/calificacion/cohorte/:cohorteId` | Director de programa | Sí | `CalificacionCohorte` |
| `/programa/admision/calificacion/:id` | Director de programa | Sí | `CalificacionAspirante` |
| `/programa/admision/admitidos` | Director de programa | Sí | `Admitidos` |
| `/programa/admision/admitidos/cohorte/:cohorteId` | Director de programa | Sí | `AdmitidosCohorte` |
| `/posgrados/login` | Posgrados | No | `PosgradosLogin` |
| `/posgrados` | Posgrados | Sí | `Posgrados` |

---

## Rutas por rol

### Público

- **`/`**
    - Redirige automáticamente a `/programa/login`.

- **`/404`**
    - Página no encontrada con un enlace para volver al inicio.
    - Las rutas inexistentes, incluidas las de los módulos de cada rol, redirigen a esta vista sin requerir sesión.
    - La redirección reemplaza la entrada del historial para evitar volver a la dirección inválida.
    - Componente: [src/vistas/NoEncontrado.tsx](src/vistas/NoEncontrado.tsx)

- **`/registro`**
    - Formulario de inscripción para nuevos aspirantes.
    - Componente: [src/vistas/Registro.tsx](src/vistas/Registro.tsx)

- **`/recuperar-password`**
    - Página de recuperación de contraseña compartida por todos los roles.
    - Recibe query params: `?loginRuta=/ruta-del-login&rol=NombreRol`
    - Componente: [src/vistas/RecuperarPassword.tsx](src/vistas/RecuperarPassword.tsx)

- **`/cambiar-password`**
    - Página de cambio de contraseña compartida por todos los roles.
    - Componente: [src/vistas/CambiarPassword.tsx](src/vistas/CambiarPassword.tsx)

---

### Aspirante

Rutas anidadas bajo `AspiranteLayout` (con sidebar). Redirige a `/aspirante/inicio` si entra a `/aspirante`.

- **`/aspirante/login`**
    - Componente: [src/vistas/aspirante/AspiranteLogin.tsx](src/vistas/aspirante/AspiranteLogin.tsx)

- **`/aspirante/inicio`**
    - Panel principal del aspirante con tarjetas de acción requerida y estado de pagos.
    - Componente: [src/vistas/aspirante/AspiranteInicio.tsx](src/vistas/aspirante/AspiranteInicio.tsx)

- **`/aspirante/estado`**
    - Estado detallado del proceso de inscripción.
    - Componente: [src/vistas/aspirante/AspiranteEstado.tsx](src/vistas/aspirante/AspiranteEstado.tsx)

- **`/aspirante/documentos`**
    - Carga y listado de documentos requeridos.
    - Componente: [src/vistas/aspirante/AspiranteDocumentos.tsx](src/vistas/aspirante/AspiranteDocumentos.tsx)

- **`/aspirante/entrevista`**
    - Información y gestión de entrevistas.
    - Componente: [src/vistas/aspirante/AspiranteEntrevista.tsx](src/vistas/aspirante/AspiranteEntrevista.tsx)

- **`/aspirante/prueba`**
    - Información y gestión de pruebas.
    - Componente: [src/vistas/aspirante/AspirantePrueba.tsx](src/vistas/aspirante/AspirantePrueba.tsx)

- **`/aspirante/criterios`**
    - Criterios de evaluación del proceso de admisión.
    - Componente: [src/vistas/aspirante/AspiranteCriterios.tsx](src/vistas/aspirante/AspiranteCriterios.tsx)

- **`/aspirante/pagos`**
    - Resumen y opciones de pago (inscripción y matrícula).
    - Componente: [src/vistas/aspirante/pagos/AspirantePagos.tsx](src/vistas/aspirante/pagos/AspirantePagos.tsx)

- **`/aspirante/pagos/inscripcion`**
    - Flujo de pago de inscripción (Wompi o descarga de recibo).
    - Componente: [src/vistas/aspirante/pagos/AspirantePagosInscripcion.tsx](src/vistas/aspirante/pagos/AspirantePagosInscripcion.tsx)

- **`/aspirante/pagos/matricula`**
    - Flujo de pago mínimo de matrícula (solo para aspirantes admitidos).
    - Componente: [src/vistas/aspirante/pagos/AspirantePagosMatricula.tsx](src/vistas/aspirante/pagos/AspirantePagosMatricula.tsx)

---

### Superadmin

Rutas anidadas bajo `SuperadminLayout`. Redirige a `/superadmin/inicio` si entra a `/superadmin`.

- **`/superadmin/login`**
    - Componente: [src/vistas/superadmin/SuperadminLogin.tsx](src/vistas/superadmin/SuperadminLogin.tsx)

- **`/superadmin/inicio`**
    - Dashboard del superadmin.
    - Componente: [src/vistas/superadmin/SuperadminInicio.tsx](src/vistas/superadmin/SuperadminInicio.tsx)

- **`/superadmin/usuarios`**
    - Gestión de usuarios del sistema.
    - Componente: [src/vistas/superadmin/SuperadminUsuarios.tsx](src/vistas/superadmin/SuperadminUsuarios.tsx)

- **`/superadmin/programas`**
    - Gestión de cohortes desde el superadmin.
    - Componente: [src/vistas/superadmin/SuperadminCohortes.tsx](src/vistas/superadmin/SuperadminCohortes.tsx)

- **`/superadmin/semestres`**
    - Gestión de semestres académicos.
    - Componente: [src/vistas/superadmin/SuperadminSemestres.tsx](src/vistas/superadmin/SuperadminSemestres.tsx)

- **`/superadmin/valores-globales`**
    - Configuración de valores globales del sistema.
    - Componente: [src/vistas/superadmin/SuperadminValoresGlobales.tsx](src/vistas/superadmin/SuperadminValoresGlobales.tsx)

- **`/superadmin/ultimos-codigos`**
    - Gestión de últimos códigos de programas.
    - Componente: [src/vistas/superadmin/SuperadminUltimosCodigos.tsx](src/vistas/superadmin/SuperadminUltimosCodigos.tsx)

- **`/superadmin/documentos-consejo`**
    - Gestión de documentos del consejo.
    - Componente: [src/vistas/superadmin/SuperadminDocumentos.tsx](src/vistas/superadmin/SuperadminDocumentos.tsx)

---

### Director de Programa

Rutas anidadas bajo `ProgramaLayout` (con sidebar). Redirige a `/programa/inicio` si entra a `/programa`.

- **`/programa/login`**
    - Componente: [src/vistas/programa/ProgramaLogin.tsx](src/vistas/programa/ProgramaLogin.tsx)

- **`/programa/inicio`**
    - Dashboard con resumen de cohorte activa, estado de validación y calificación.
    - Componente: [src/vistas/programa/ProgramaInicio.tsx](src/vistas/programa/ProgramaInicio.tsx)

- **`/programa/cohortes`**
    - Listado de cohortes. Desde aquí se puede seleccionar una para ver su detalle o crear una nueva.
    - Componente: [src/vistas/programa/cohorte/Cohortes.tsx](src/vistas/programa/cohorte/Cohortes.tsx)

- **`/programa/crear-cohorte`**
    - Formulario para crear una nueva cohorte.
    - Componente: [src/vistas/programa/cohorte/CrearCohorte.tsx](src/vistas/programa/cohorte/CrearCohorte.tsx)

- **`/programa/criterios`**
    - Gestión de criterios de evaluación.
    - Componente: [src/vistas/programa/Criterios.tsx](src/vistas/programa/Criterios.tsx)

- **`/programa/documentos`**
    - Gestión de documentos del programa académico.
    - Componente: [src/vistas/programa/documentos/ProgramaDocumentos.tsx](src/vistas/programa/documentos/ProgramaDocumentos.tsx)

- **`/programa/pagos/inscripcion`**
    - Listado de cohortes para validar pago de inscripción.
    - Componente: [src/vistas/programa/pagos/ValidacionCohortesInscripcion.tsx](src/vistas/programa/pagos/ValidacionCohortesInscripcion.tsx)

- **`/programa/pagos/inscripcion/cohorte/:cohorteId`**
    - Aspirantes de una cohorte con su estado de pago de inscripción.
    - Componente: [src/vistas/programa/pagos/ValidacionPagosInscripcion.tsx](src/vistas/programa/pagos/ValidacionPagosInscripcion.tsx)

- **`/programa/pagos/inscripcion/:aspiranteId`**
    - Detalle del pago de inscripción de un aspirante.
    - Componente: [src/vistas/programa/pagos/ValidacionPagosInscripcionDetalle.tsx](src/vistas/programa/pagos/ValidacionPagosInscripcionDetalle.tsx)

- **`/programa/pagos/matricula`**
    - Listado de cohortes para validar pago de matrícula.
    - Componente: [src/vistas/programa/pagos/ValidacionCohortesMatricula.tsx](src/vistas/programa/pagos/ValidacionCohortesMatricula.tsx)

- **`/programa/pagos/matricula/cohorte/:cohorteId`**
    - Aspirantes de una cohorte con su estado de pago de matrícula.
    - Componente: [src/vistas/programa/pagos/ValidacionPagosMatricula.tsx](src/vistas/programa/pagos/ValidacionPagosMatricula.tsx)

- **`/programa/pagos/matricula/:aspiranteId`**
    - Detalle del pago de matrícula de un aspirante.
    - Componente: [src/vistas/programa/pagos/ValidacionPagosMatriculaDetalle.tsx](src/vistas/programa/pagos/ValidacionPagosMatriculaDetalle.tsx)

- **`/programa/validacion`**
    - Listado de cohortes para revisión de documentos.
    - Componente: [src/vistas/programa/validacion/ValidacionDocumentos.tsx](src/vistas/programa/validacion/ValidacionDocumentos.tsx)

- **`/programa/validacion/cohorte/:cohorteId`**
    - Listado de aspirantes de una cohorte para validar documentos.
    - Componente: [src/vistas/programa/validacion/ValidacionCohorteDetalle.tsx](src/vistas/programa/validacion/ValidacionCohorteDetalle.tsx)

- **`/programa/validacion/aspirantes/:cohorteId/:aspiranteId`**
    - Revisión de documentos de un aspirante específico.
    - Componente: [src/vistas/programa/validacion/ValidacionAspiranteDetalle.tsx](src/vistas/programa/validacion/ValidacionAspiranteDetalle.tsx)

- **`/programa/admision/calificacion`**
    - Listado de cohortes para calificar.
    - Componente: [src/vistas/programa/calificacion/Calificacion.tsx](src/vistas/programa/calificacion/Calificacion.tsx)

- **`/programa/admision/calificacion/cohorte/:cohorteId`**
    - Aspirantes de una cohorte a calificar.
    - Componente: [src/vistas/programa/calificacion/CalificacionCohorte.tsx](src/vistas/programa/calificacion/CalificacionCohorte.tsx)

- **`/programa/admision/calificacion/:id`**
    - Calificación individual de un aspirante por criterio.
    - Componente: [src/vistas/programa/calificacion/CalificacionAspirante.tsx](src/vistas/programa/calificacion/CalificacionAspirante.tsx)

- **`/programa/admision/admitidos`**
    - Listado de cohortes para ver aspirantes admitidos.
    - Componente: [src/vistas/programa/admitidos/Admitidos.tsx](src/vistas/programa/admitidos/Admitidos.tsx)

- **`/programa/admision/admitidos/cohorte/:cohorteId`**
    - Aspirantes admitidos de una cohorte.
    - Componente: [src/vistas/programa/admitidos/AdmitidosCohorte.tsx](src/vistas/programa/admitidos/AdmitidosCohorte.tsx)

---

### Posgrados

Rutas anidadas bajo `PosgradosLayout`. El índice carga la vista principal directamente.

- **`/posgrados/login`**
    - Componente: [src/vistas/posgrados/PosgradosLogin.tsx](src/vistas/posgrados/PosgradosLogin.tsx)

- **`/posgrados`**
    - Vista principal del módulo de posgrados.
    - Componente: [src/vistas/posgrados/Posgrados.tsx](src/vistas/posgrados/Posgrados.tsx)

---

## Convenciones de rutas

- Parámetros: usar `:nombreParam` (ej. `/programa/validacion/cohorte/:cohorteId`).
- No usar trailing slash: `/registro`, no `/registro/`.
- Rutas públicas: accesibles sin autenticación. Rutas privadas: requieren token válido en localStorage, el layout correspondiente redirige al login si no hay sesión.
- Rutas CRUD: seguir patrón `/entidad` (listar), `/entidad/nuevo` (crear), `/entidad/:id` (ver/editar).

## Historial de cambios

- 2026-04-30 — Versión inicial.
- 2026-05-20 — Actualización completa con rutas implementadas para programa, facultad y superadmin.
- 2026-06-03 — Actualización completa: se agregan rutas de pagos aspirante, criterios, posgrados, validación pagos programa, admitidos, calificación por cohorte; se corrigen rutas de validación y superadmin; se elimina módulo facultad (no implementado). Se agrega `/cambiar-password`.
- 2026-06-11 — Se agrega `/superadmin/ultimos-codigos`. Se refactorizan rutas de pagos del programa: se añaden vistas intermedias de selección de cohorte (`/cohorte/:cohorteId`) para inscripción y matrícula.
