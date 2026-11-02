# Proyecto Postgrados UFPS Frontend

Frontend web para la gestión de procesos de inscripción a programas de posgrados de la UFPS, desde la inscripción del aspirante, la validación de documentos, la calificación del aspirante, la admisión y la legalización de la matrícula. La aplicación está construida con React, TypeScript y Vite, y organiza la experiencia por roles para atender flujos de aspirante, programa, facultad y superadmin.
La aplicación comprende módulos para 4 roles: Aspirante, Director de programa, Director de facultad y Superadmin.

## Tecnologías

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Heroicons

## Requisitos

- Node.js instalado
- npm disponible en el entorno

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## Documentación relacionada

- `docs/ESTRUCTURA_ARCHIVOS.md`
- `docs/FLUJOS.md`
- `docs/REGLAS.md`
- `docs/RUTAS.md`

## Estado del proyecto

El proyecto está en evolución y varias pantallas muestran estados pendientes o placeholders. La base actual ya cubre la navegación principal y la separación de responsabilidades por módulo.

## Comprobaciones

```bash
npm test
npm run lint
npm run build
```

Las pruebas de contrato usan respuestas sanitizadas y no escriben en el backend.
Las rutas, cuerpos y tipos se basan en el [OpenAPI publicado](https://projectposgradosufps-ingsoft-production.up.railway.app/posgrados-project/api-docs).
