function primerTexto(...valores: unknown[]): string | undefined {
  for (const valor of valores) {
    if (typeof valor === 'string' && valor.trim()) return valor.trim();
  }
  return undefined;
}

/**
 * Mensaje legible para un error al crear o guardar una cohorte.
 * `mensajesPorEstado` permite fijar el texto para ciertos códigos HTTP.
 */
export function mensajeErrorCohorte(error: unknown, porDefecto: string, mensajesPorEstado: Record<number, string> = {}): string {
  if (error instanceof Error) {
    const { body, status } = error as Error & { body?: unknown; status?: number };
    if (body && typeof body === 'object') {
      const registro = body as Record<string, unknown>;
      const estado = [status, registro.status, registro.statusCode].find(
        (codigo): codigo is number => typeof codigo === 'number' && codigo in mensajesPorEstado,
      );
      if (estado !== undefined) return mensajesPorEstado[estado];
      const texto = primerTexto(registro.message, registro.mensaje, status === 409 ? registro.error : undefined);
      if (texto) return texto;
    }
    if (status !== undefined && status in mensajesPorEstado) return mensajesPorEstado[status];
    return error.message.trim() || porDefecto;
  }

  if (typeof error === 'string' && error.trim()) return error.trim();

  if (error && typeof error === 'object') {
    const registro = error as Record<string, unknown>;
    const texto = primerTexto(registro.message, registro.mensaje);
    if (texto) return texto;
  }

  return porDefecto;
}
