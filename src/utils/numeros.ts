/** Deja solo los dígitos del texto (para campos de números enteros). */
export function soloDigitos(valor: string): string {
	return valor.replace(/\D+/g, '');
}

/** Deja solo dígitos y un punto decimal; la coma se interpreta como punto. */
export function soloDecimal(valor: string): string {
	const trimmed = valor.trim().replace(',', '.');
	let resultado = '';
	let yaTienePuntoDecimal = false;

	for (const caracter of trimmed) {
		if (/\d/.test(caracter)) {
			resultado += caracter;
			continue;
		}

		if (caracter === '.' && !yaTienePuntoDecimal) {
			resultado += caracter;
			yaTienePuntoDecimal = true;
		}
	}

	return resultado;
}
