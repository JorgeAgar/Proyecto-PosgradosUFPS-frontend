# Reglas

## Nombres

- Las carpetas usan kebab-case
- Los archivos de componentes (y los componentes) usan PascalCase
- Los archivos TS puros (servicios, utils, etc.) usan camelCase
- Variables de entorno en SCREAMING_SNAKE_CASE
- Constantes, variables y funciones que no quepan en lo anterior: camelCase
- Ramas de git en kebab-case
    - Las ramas de arreglar algo empiezan con `fix/[nombre]`
    - Las ramas normales se nombran según lo que se está trabajando (nombres cortos)
- Commits en español

## Estructura de servicios

Cada rol tiene su propia subcarpeta en `src/services/`:
- Los servicios de auth (login, logout y refresh) y la instancia de `ApiClient` van en el archivo principal del rol: ej. `programa/programaService.ts`, `superadmin/superadminService.ts`.
- Los servicios de features específicas van en archivos separados dentro de la subcarpeta: ej. `programa/programaCalificacionService.ts`.
- Los clientes autenticados de cada rol (`programaApiClient`, `superadminApiClient`, etc.) manejan automáticamente el refresh del token y deben usarse mediante `.fetch()` en lugar de `fetch` directo.

## Archivos que no se suben en los commits normalmente (pero que no están en el gitignore)

- `main.tsx`
- `index.css`
- Archivos que no sean específicamente de lo que se está trabajando en la rama (ser super específico)
- Archivos de configuración de TypeScript (no se deberían cambiar)
- `eslint.config.js` (no se debería cambiar)
- `vite.config.ts` (no se debería cambiar)

## Git

**Repositorio:** [https://github.com/JorgeAgar/Proyecto-Postgrados-UFPS-frontend](https://github.com/JorgeAgar/Proyecto-Postgrados-UFPS-frontend)

### Flujo de trabajo

1. Tener la `dev` actualizada (`git pull`)
2. Crear una rama desde `dev` para lo que se va a trabajar
3. Trabajar sobre esa rama
4. Hacer Pull Request a `dev` (base: `dev` — compare: rama de trabajo)
5. Si todo está bien, mergear la PR y borrar la rama

### Reglas de git

- Las ramas son para **una sola cosa**; si se va a hacer algo diferente, se crea otra rama
- Solo realizar cambios a lo que se está haciendo en la rama (modificar los mínimos archivos posibles)
- Solo se puede hacer push a las ramas de trabajo
- **No se puede hacer push directo a `dev` ni a `main` bajo ninguna circunstancia**
- `main` solo se actualiza con PRs desde `dev`
- Tratar de no hacer push en cada commit, porque cada push dispara un build de preview en el deploy
- Si no se han podido mergear cambios a `dev` y se va a trabajar en otra cosa, se puede crear la nueva rama desde la rama en la que se está trabajando
- Pueden coexistir varias ramas de trabajo al tiempo
- Idealmente las PRs las evalúa otro miembro del equipo, pero se entiende que por tiempo esto no siempre es posible
- No hacer `--force-push`
- No hacer `git reset` a una rama que esté en remote, salvo algo completamente extraordinario

## Diseño

Modo claro con color rojo y blanco (los definidos en Figma).

Guiarse con el proyecto de Figma: [Link](https://www.figma.com/files/team/1545929088682205352/project/594308804?fuid=1545929086424815616)
