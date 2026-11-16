# Flujos

Describe los flujos de usuario por rol. Los pasos marcados con *cursiva* están pendientes de implementar en el frontend.

---

## Aspirante

1. Desde la página de la UFPS el aspirante accede al formulario de inscripción en `/registro`.
2. En `/registro` llena el formulario y le da a registrarse. El sistema le muestra un mensaje indicando que revise su correo para verificarlo.
3. El aspirante verifica el correo (el backend lo valida y redirige al login).
4. En `/aspirante/login` inicia sesión y es redirigido a `/aspirante/inicio`.
5. En `/aspirante/inicio` la tarjeta de acción requerida y la tarjeta de pago le indican que debe pagar la inscripción.
6. En `/aspirante/pagos` ve el resumen de pagos y navega a `/aspirante/pagos/inscripcion` para:
    - **Pago en línea:** a través de Wompi.
    - **Descargar recibo:** descarga el PDF para pago físico.
7. El pago es verificado de forma transparente al aspirante.
8. El aspirante recibe un correo confirmando el pago de inscripción.
9. En `/aspirante/inicio` la tarjeta de pago cambia a "pago confirmado".
10. La tarjeta de acción requerida le indica que debe cargar los documentos.
11. El aspirante va a `/aspirante/documentos` (desde la tarjeta o la sidebar).
12. Carga todos los documentos y le da a "enviar documentos".
13. El estado de los documentos pasa a "enviado a revisión".
14. Al revisar los documentos, el aspirante recibe un correo. Los aprobados cambian a estado aprobado y los rechazados muestran la razón de rechazo.
15. El aspirante corrige y vuelve a subir los documentos rechazados.
16. Se repite el proceso hasta que todos los documentos estén aprobados.
17. Si el comité decide hacer entrevista o prueba, el aspirante recibe un correo con la solicitud.
18. En `/aspirante/entrevista` o `/aspirante/prueba` ve la solicitud y puede aceptar la fecha/lugar o pedir un cambio.
19. El aspirante realiza la entrevista o prueba. El resultado es privado (lo maneja el director de programa).
20. Pueden haber varias entrevistas o pruebas; se repite desde el paso 17.
21. Al final del proceso, el aspirante recibe un correo indicando si fue admitido o rechazado.
22. Si fue admitido:
    - En `/aspirante/inicio` aparece una tarjeta de pago mínimo de matrícula.
    - En `/aspirante/pagos` se activa la opción de pago mínimo de matrícula; navega a `/aspirante/pagos/matricula` (mismo flujo que el pago de inscripción).
23. Se valida el pago de matrícula.
24. El aspirante recibe el correo de bienvenida y se le habilitan los sistemas institucionales.

### Notas
- Se realizan 2 pagos: inscripción (todos los aspirantes) y matrícula (solo los admitidos).
- Si el aspirante ya está registrado, entra a `/aspirante/login` y es redirigido a `/aspirante/inicio` directamente.
- En `/aspirante/criterios` puede consultar los criterios de evaluación del proceso.

---

## Director de Programa

### Flujo común
1. En `/programa/login` inicia sesión y es redirigido a `/programa/inicio`.
2. En `/programa/inicio` ve un resumen de la cohorte activa: fechas límite y el avance de aspirantes por etapas (inscritos → paz y salvo → validados → calificados → admitidos).

### Flujo de gestión de cohortes
1. En la sidebar le da click a "Cohortes", eso lo lleva a `/programa/cohortes`.
2. En `/programa/cohortes` ve el listado de cohortes. Puede:
    - **Seleccionar una cohorte:** Se expande el detalle en la misma página (nombre, fechas, criterios, admitidos). Puede editar los datos y guardar.
    - **Crear nueva cohorte:** Le da al botón "Nueva cohorte", lo lleva a `/programa/crear-cohorte`. Llena los datos y los guarda.

### Flujo de calificación de aspirantes
1. En la sidebar le da click a "Admisión → Calificación", lo lleva a `/programa/admision/calificacion`.
2. En `/programa/admision/calificacion` ve el listado de cohortes disponibles para calificar.
3. Le da click a una cohorte, lo lleva a `/programa/admision/calificacion/cohorte/:cohorteId`.
4. En la vista de cohorte ve el listado de aspirantes con su estado de calificación y puntaje total.
5. Le da click a un aspirante, lo lleva a `/programa/admision/calificacion/:id`.
6. En `/programa/admision/calificacion/:id` ve el perfil del aspirante, sus documentos y la tabla de criterios. Asigna un puntaje por cada criterio y guarda.

### Flujo de validación de documentos
1. En la sidebar le da click a "Validación", lo lleva a `/programa/validacion`.
2. En `/programa/validacion` ve el listado de cohortes con porcentaje de validación. Le da click a una.
3. En `/programa/validacion/cohorte/:cohorteId` ve los aspirantes de esa cohorte. Le da click a uno.
4. En `/programa/validacion/aspirantes/:cohorteId/:aspiranteId` revisa los documentos del aspirante y los aprueba o rechaza (con razón de rechazo si aplica).

### Flujo de validación de pagos
1. En la sidebar accede a "Pagos → Inscripción" (`/programa/pagos/inscripcion`) o "Pagos → Matrícula" (`/programa/pagos/matricula`).
2. Ve el listado de cohortes disponibles. Le da click a una cohorte.
3. Ve el listado de aspirantes de esa cohorte con su estado de pago (`/programa/pagos/inscripcion/cohorte/:cohorteId` o `/programa/pagos/matricula/cohorte/:cohorteId`).
4. Le da click a un aspirante, lo lleva al detalle (`/programa/pagos/inscripcion/:aspiranteId` o `/programa/pagos/matricula/:aspiranteId`).
5. Revisa el comprobante de pago y lo aprueba o rechaza.

### Flujo de admitidos
1. En la sidebar le da click a "Admisión → Admitidos", lo lleva a `/programa/admision/admitidos`.
2. Ve el listado de cohortes. Le da click a una, lo lleva a `/programa/admision/admitidos/cohorte/:cohorteId`.
3. Ve el listado de aspirantes admitidos con su información y estado de pago de matrícula.

### Flujo de gestión de criterios
1. En la sidebar le da click a "Criterios", lo lleva a `/programa/criterios`.
2. En `/programa/criterios` ve los criterios definidos con sus pesos, puede editarlos y guardar los cambios.

### Flujo de documentos del programa
1. En la sidebar accede a "Documentos", lo lleva a `/programa/documentos`.
2. Gestiona los documentos requeridos para el proceso de admisión del programa.

---

## Superadmin

### Flujo común
1. En `/superadmin/login` inicia sesión y es redirigido a `/superadmin/inicio`.

### Gestión de usuarios
1. En la sidebar le da click a "Usuarios", lo lleva a `/superadmin/usuarios`.
2. Puede ver, crear, editar y eliminar usuarios del sistema.

### Gestión de programas
1. En la sidebar le da click a "Programas", lo lleva a `/superadmin/programas`.
2. Puede ver y gestionar los programas/cohortes del sistema.

### Gestión de semestres
1. En la sidebar le da click a "Semestres", lo lleva a `/superadmin/semestres`.
2. Puede ver, crear, editar y eliminar semestres académicos.

### Gestión de valores globales
1. En la sidebar le da click a "Valores globales", lo lleva a `/superadmin/valores-globales`.
2. Configura valores globales del sistema (costos, parámetros, etc.).

### Gestión de documentos del consejo
1. En la sidebar le da click a "Documentos consejo", lo lleva a `/superadmin/documentos-consejo`.
2. Gestiona los documentos emitidos por el consejo.

### Gestión de últimos códigos
1. En la sidebar le da click a "Últimos códigos", lo lleva a `/superadmin/ultimos-codigos`.
2. Gestiona los últimos códigos asignados por programa.

---

## Secretaría *(pendiente de implementar)*

1. En `/secretaria/login` inicia sesión y es redirigido a `/secretaria/inicio`.
2. Entra a `/secretaria/validacion` y selecciona la cohorte.
3. En `/secretaria/validacion/:cohorteId` ve el listado de aspirantes por estado.
4. Selecciona un aspirante y lo lleva a `/secretaria/validacion/:aspiranteId`.
5. Aprueba o rechaza cada documento (si rechaza debe poner la razón).

---

## Comité curricular *(pendiente de implementar)*

### Flujo común
1. En `/comite/login` inicia sesión y es redirigido a `/comite/inicio`.

### Flujo de criterios
1. Va a `/comite/criterios` desde la sidebar.
2. Puede crear, editar o eliminar criterios de evaluación.

### Flujo de calificación de aspirantes
1. Va a `/comite/admision` desde la sidebar.
2. Selecciona el aspirante a calificar, revisa documentos y asigna calificación por criterio.
