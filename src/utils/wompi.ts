/**
 * Resultado de normalizar la URL de redirección que el backend entrega para el widget de Wompi.
 * - `{ valida: true, url: null }`: no hay URL configurada; se omite `data-redirect-url`.
 * - `{ valida: true, url }`: URL absoluta http(s) lista para el widget.
 * - `{ valida: false, valor }`: hay un valor configurado pero mal formado.
 */
export type RedirectUrlWompi =
  | { valida: true; url: string | null }
  | { valida: false; valor: string };

/**
 * Normaliza la URL de redirección de Wompi. El widget trata `redirectUrl` como opcional,
 * pero si el atributo existe (aunque esté vacío) lo valida y exige un prefijo exacto
 * `http://` o `https://`; por eso un valor vacío debe omitirse y no enviarse como "".
 */
export function normalizarRedirectUrlWompi(valor: unknown): RedirectUrlWompi {
  if (valor === null || valor === undefined) return { valida: true, url: null };
  if (typeof valor !== 'string') return { valida: false, valor: String(valor) };

  const url = valor.trim();
  if (url === '') return { valida: true, url: null };
  if (!/^https?:\/\//.test(url)) return { valida: false, valor: url };

  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return { valida: false, valor: url };
  } catch {
    return { valida: false, valor: url };
  }
  return { valida: true, url };
}
