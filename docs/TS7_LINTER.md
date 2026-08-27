# Linter al migrar a TypeScript 7

Investigación realizada el 27 de agosto de 2026 para este proyecto. La migración de esta rama adopta TypeScript 7 y Oxlint.

## Lo que bloquea la migración directa

TypeScript 7.0 no publica todavía una API programática compatible. `typescript-eslint` depende de esa API y su rango de soporte vigente es `>=4.8.4 <6.1.0`; TypeScript 7 queda fuera. Por tanto, subir solo `typescript` a 7 rompe la combinación soportada por el linter actual.

Microsoft propone ejecutar ambos compiladores: TypeScript 7 para `tsc` y TypeScript 6, mediante un alias, para las herramientas que importan `typescript`, entre ellas `typescript-eslint`. Es la forma de conservar ESLint, `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh` sin cambiar el conjunto de reglas.

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

En esa disposición, `tsc` es el binario de TypeScript 7 y ESLint resuelve el alias de TypeScript 6. No es una sustitución del type-checker: `tsc` seguirá siendo la comprobación de tipos y ESLint seguirá aplicando reglas de código.

- [Rango de soporte de typescript-eslint](https://typescript-eslint.io/users/dependency-versions/)
- [Guía de Microsoft para ejecutar TS 6 y TS 7 lado a lado](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)

## Alternativas

| Opción | TypeScript 7 | Hooks de React | Veredicto |
| --- | --- | --- | --- |
| ESLint + `typescript-eslint` con alias TS 6 | TS 7 compila; el linter usa TS 6 | Conserva las reglas actuales | Opción conservadora |
| Oxlint + `oxlint-tsgolint` | Soporte explícito mediante `typescript-go` | `react/rules-of-hooks` y `react/exhaustive-deps` nativas | Alternativa para una migración deliberada |
| Biome 2.5 | Solo declara soporte para TS 5.9 | `useExhaustiveDependencies`, equivalente y recomendado | No migrar a Biome por TS 7 aún |

Oxlint ofrece lint sintáctico para TypeScript y reglas React nativas. Para reglas que necesitan información de tipos hay que añadir `oxlint-tsgolint` y ejecutar `oxlint --type-aware`; su documentación indica que usa `typescript-go` y apunta a TypeScript 7. El proyecto ya se probó localmente con Oxlint 1.79 sin configuración: procesó los archivos `.ts` y `.tsx` y reprodujo los tres hallazgos actuales de dependencias exhaustivas, aunque emitió avisos adicionales. Antes de sustituir ESLint hay que migrar la configuración y comparar todos los resultados, especialmente `react-refresh`.

Biome también detectó los archivos del proyecto y tiene un equivalente directo de `react-hooks/exhaustive-deps`, pero su documentación declara soporte hasta TypeScript 5.9. No hay respaldo oficial para tratarlo como solución a la compatibilidad con TS 7.

- [Lint con tipos de Oxlint y tsgolint](https://oxc.rs/docs/guide/usage/linter/type-aware.html)
- [Regla `react/exhaustive-deps` de Oxlint](https://oxc.rs/docs/guide/usage/linter/rules/react/exhaustive-deps)
- [Compatibilidad de lenguajes de Biome](https://biomejs.dev/internals/language-support/)
- [Regla `useExhaustiveDependencies` de Biome](https://next.biomejs.dev/linter/rules/use-exhaustive-dependencies/)

## Decisión del proyecto

El proyecto adopta Oxlint junto con TypeScript 7. La configuración actual no usa reglas de ESLint que requieran información de tipos, por lo que Oxlint cubre el conjunto de reglas migrado sin `oxlint-tsgolint`. Las reglas de React Compiler que Oxlint diagnostica de forma más estricta quedan como advertencias. Corregirlas requiere cambios funcionales y se tratará en una tarea separada.

La combinación oficial TS 7 + alias de TS 6 sigue siendo válida para proyectos que necesiten conservar ESLint. Biome no es una alternativa para esta migración hasta que declare soporte para TypeScript 7.
