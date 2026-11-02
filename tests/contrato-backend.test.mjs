import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const { schemas } = JSON.parse(await readFile(new URL('./fixtures/contract.json', import.meta.url), 'utf8'));
let server, cohortes, detalle, pagos, entrevistas, usuarios, admin, documentos, fechas;
const originalFetch = globalThis.fetch;
const originalStorage = globalThis.localStorage;
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const cohorte = {
  id: 7, nombre: 'Cohorte QA', activa: false, cupos: 5, inscritos: 0, admitidos: 0,
  idSemestre: 3, nombreSemestre: '2027-1', idModalidad: 1, nombreModalidad: 'Presencial',
  fechaInicio: '2027-01-01', fechaLimiteDocumentos: '2027-01-20', fechaLimitePago: '2027-01-25',
  criterios: [], documentosAsignados: { documentosConsejo: [], documentosPrograma: [] }, inscritosData: [], admitidosData: [],
};
const nueva = {
  nombre: cohorte.nombre, cupos: 5, idSemestre: 3, idModalidad: 1,
  fechaInicio: cohorte.fechaInicio, fechaLimiteDocumentos: cohorte.fechaLimiteDocumentos, fechaLimitePago: cohorte.fechaLimitePago,
  documentosConsejo: [], documentosPrograma: [], criteriosCohorte: [{ idCriterio: 1, pesoSnapshot: 100 }],
};

// Valida los cuerpos contra un recorte literal del OpenAPI, sin depender de tipos TS.
function validar(value, suffixOrSchema, path = 'body') {
  let schema = typeof suffixOrSchema === 'string' ? schemas[Object.keys(schemas).find((key) => key.endsWith(suffixOrSchema))] : suffixOrSchema;
  assert.ok(schema, `Schema inexistente: ${suffixOrSchema}`);
  if (schema.$ref) schema = schemas[schema.$ref.split('/').at(-1)];
  if (value === null) return; // Los DTO de Spring no anotan todos los campos anulables.
  if (schema.type === 'object') {
    assert.equal(typeof value, 'object', path);
    for (const key of schema.required ?? []) assert.ok(value[key] !== undefined && value[key] !== null, `${path}.${key} obligatorio`);
    for (const [key, item] of Object.entries(value)) {
      assert.ok(schema.properties[key], `${path}.${key} no pertenece al contrato`);
      validar(item, schema.properties[key], `${path}.${key}`);
    }
  } else if (schema.type === 'array') {
    assert.ok(Array.isArray(value), path);
    value.forEach((item, i) => validar(item, schema.items, `${path}[${i}]`));
  } else if (schema.type === 'integer') assert.ok(Number.isInteger(value), `${path} debe ser entero`);
  else if (schema.type) assert.equal(typeof value, schema.type, path);
}

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  cohortes = await server.ssrLoadModule('/src/services/programa/programaCohorteService.ts');
  detalle = await server.ssrLoadModule('/src/services/programa/programaCohorteDetalleService.ts');
  pagos = await server.ssrLoadModule('/src/services/programa/validacionPagosService.ts');
  entrevistas = await server.ssrLoadModule('/src/services/aspirante/aspiranteEntrevistaService.ts');
  usuarios = (await server.ssrLoadModule('/src/services/superadmin/superadminUsuariosService.ts')).superadminUsuariosService;
  admin = await server.ssrLoadModule('/src/services/superadmin/superadminCohortesService.ts');
  documentos = (await server.ssrLoadModule('/src/services/superadmin/superadminDocumentosService.ts')).superadminDocumentosService;
  fechas = await server.ssrLoadModule('/src/vistas/programa/cohorte/fechasCohorte.ts');
});
beforeEach(async () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) };
  for (const rol of ['programa', 'superadmin', 'aspirante']) localStorage.setItem(`ufps_${rol}_access_token`, 'token-de-prueba');
  (await server.ssrLoadModule('/src/services/programa/programaService.ts')).seleccionarPrograma(16);
});
after(async () => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; await server?.close(); });

test('creación de cohorte envía las tres fechas y obtiene un id compatible con la vista', async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/programa/16/cohortes'));
    validar(JSON.parse(options.body), 'COHORTE_DIRECTOR_CREATE');
    return response(cohorte);
  };
  const creado = await cohortes.createCohorte(nueva);
  assert.equal(creado.id, '7');
  assert.equal(creado.fechaInicio, nueva.fechaInicio);
  assert.equal(creado.fechaLimiteDocumentos, nueva.fechaLimiteDocumentos);
});

test('el detalle y abrir/cerrar conservan las fechas publicadas e id de vista', async () => {
  globalThis.fetch = async (url) => response({ ...cohorte, activa: url.endsWith('/abrir') });
  const actual = await detalle.fetchCohorteDetalle('7');
  assert.equal(actual.fechaInicio, '2027-01-01');
  assert.equal(actual.fechaLimitePago, '2027-01-25');
  assert.equal((await detalle.abrirCohorte('7')).id, actual.id);
  assert.equal((await detalle.cerrarCohorte('7')).id, actual.id);
});

test('editar asigna un criterio nuevo y un reintento no duplica la asociación', async () => {
  const asociados = [];
  let posts = 0, puts = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/criteriocohorte') && options.method === 'POST') {
      const body = JSON.parse(options.body); validar(body, 'CRITERIOCOHORTE_ASSIGN_BODY');
      assert.equal(body.pesoSnapshot, 0, 'Asignar sin exceder el 100% existente');
      posts++; asociados.push({ id: 90, idCriterio: body.idCriterio }); return response({ id: 90 });
    }
    if (url.endsWith('/criteriocohorte')) return response(asociados);
    const body = JSON.parse(options.body); validar(body, 'COHORTE_DIRECTOR_UPDATE');
    assert.equal(body.criteriosCohorte[0].id, 90);
    if (++puts === 1) return response({ message: 'Fallo temporal' }, 500);
    return response(cohorte);
  };
  const payload = { ...nueva, id: 7 };
  await assert.rejects(detalle.updateCohorte('7', payload), /Fallo temporal/);
  await detalle.updateCohorte('7', payload);
  assert.equal(posts, 1);
});

for (const tipo of ['inscripcion', 'matricula']) {
  test(`pagos de ${tipo} consulta por programa y excluye aspirantes de otra cohorte`, async () => {
    globalThis.fetch = async (url) => {
      if (url.endsWith('/cohortes/7/aspirantes')) return response([{ id: 11 }]);
      const parsed = new URL(url, 'http://localhost');
      assert.equal(parsed.pathname, `/api/application/case/director-programa/pagos/${tipo}`);
      assert.equal(parsed.searchParams.get('idPrograma'), '16');
      return response([{ id: 1, idAspirante: 11 }, { id: 2, idAspirante: 12 }]);
    };
    assert.deepEqual((await pagos.obtenerPagosPorCohorte(tipo, 7)).map((p) => p.id), [1]);
  });
}

test('listado de pagos procesa todas las páginas antes de filtrar la cohorte', async () => {
  globalThis.fetch = async (url) => {
    if (url.endsWith('/aspirantes')) return response([{ id: 11 }]);
    const page = Number(new URL(url, 'http://localhost').searchParams.get('page'));
    return response({ content: [{ id: page + 1, idAspirante: 11 }], totalPages: 2 });
  };
  assert.deepEqual((await pagos.obtenerPagosPorCohorte('matricula', 7)).map((p) => p.id), [1, 2]);
});

test('solicitud de cambio de entrevista incluye id numérico en el cuerpo', async () => {
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body); validar(body, 'ENTREVISTA_REQUEST_CHANGE');
    assert.equal(body.id, 42); return response({ idEntrevista: 42 });
  };
  await entrevistas.solicitarCambioEntrevista('42', 'Cambio de horario');
});

test('crear persona utiliza el DTO publicado y no envía ubicaciones anidadas inventadas', async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/api/dev/endpoint/persona/create'));
    validar(JSON.parse(options.body), 'PERSONA_CREATE');
    return response({ id: 20 });
  };
  assert.equal((await usuarios.crearPersona({ nombres: 'QA', apellidos: 'Contrato', celular: '3000000000', correo: 'qa@example.invalid' })).id, 20);
});

test('facultades envían administrativo y programas conservan código textual', async () => {
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/facultad/create')) validar(JSON.parse(options.body), 'FACULTAD_CREATE');
    else if (url.endsWith('/facultad/update')) validar(JSON.parse(options.body), 'FACULTAD_UPDATE');
    else if (url.endsWith('/programa/listbyfacultad')) { assert.equal(options.method, 'POST'); assert.deepEqual(JSON.parse(options.body), { id: 3 }); return response([]); }
    else if (url.endsWith('/programa/create')) {
      const body = JSON.parse(options.body); validar(body, 'PROGRAMA_CREATE'); assert.equal(body.codigo, '001A');
    }
    return response({ id: 99 });
  };
  await admin.superadminFacultadesService.crear({ nombre: 'QA', correo: 'qa@example.invalid', idAdministrativo: 2 });
  await admin.superadminFacultadesService.actualizar({ id: 3, nombre: 'QA', correo: 'qa@example.invalid', idAdministrativo: 2 });
  await admin.superadminProgramasService.listarPorFacultad(3);
  await admin.superadminProgramasService.crear({ codigo: '001A', nombre: 'QA', duracion: 2, idSede: 1, idFacultad: 3, idTiporegistro: 1, idOtros: 1 });
});

test('editar metadatos de un documento conserva el formato y solo envía campos del DTO', async () => {
  const doc = { id: 1, nombre: 'Documento', tamanomaximo: 5, urlformato: 'https://example.invalid/formato.pdf' };
  globalThis.fetch = async (url, options) => {
    if (options.method === 'PUT') {
      assert.ok(url.endsWith('/documentosrequisitoconsejo/update'));
      assert.deepEqual(JSON.parse(options.body), { id: 1, nombre: 'Documento', tamanomaximo: 5 });
    }
    return response(url.endsWith('/listall') ? [doc] : doc);
  };
  const [actualizado] = await documentos.actualizar({ id: 1, nombre: 'Documento', tamanomaximo: 5 });
  assert.equal(actualizado.urlformato, doc.urlformato);
});

test('fechas valida tres campos del contrato y admite un detalle válido sin campos de plazos', () => {
  assert.deepEqual(fechas.validarFechasCohorte(nueva, { requeridas: true, fechaInicioSemestre: '2027-01-01' }), {});
  assert.deepEqual(Object.keys(fechas.validarFechasCohorte({}, { requeridas: true })).sort(), ['fechaInicio', 'fechaLimiteDocumentos', 'fechaLimitePago'].sort());
});

test('reemplazar formato usa multipart con body JSON y conserva el archivo recibido del servidor', async () => {
  const file = new File(['%PDF-1.4\nQA'], 'qa.pdf', { type: 'application/pdf' });
  globalThis.fetch = async (url, options) => {
    if (options.method === 'PUT') {
      assert.ok(url.endsWith('/documentosrequisitoconsejo/superadmin/1'));
      assert.ok(options.body instanceof FormData);
      assert.equal(options.headers.has('Content-Type'), false, 'El navegador debe generar el boundary');
      assert.deepEqual(JSON.parse(await options.body.get('body').text()), { id: 1, nombre: 'Documento', tamanomaximo: 5 });
      assert.equal(options.body.get('file').name, 'qa.pdf');
    }
    return response(url.endsWith('/listall') ? [{ id: 1, nombre: 'Documento', tamanomaximo: 5, urlformato: 'https://example.invalid/nuevo.pdf' }] : {});
  };
  assert.equal((await documentos.actualizar({ id: 1, nombre: 'Documento', tamanomaximo: 5 }, file))[0].urlformato, 'https://example.invalid/nuevo.pdf');
});

test('eliminar cohorte vacía retira sus asociaciones sin borrar los documentos y criterios originales', async () => {
  const deletes = [];
  globalThis.fetch = async (url, options) => {
    if (options.method === 'DELETE') { deletes.push(url); return new Response(null, { status: 204 }); }
    if (url.endsWith('/aspirantes')) return response([]);
    return response({ criterios: [{ id: 12 }], documentosAsignados: { documentosConsejo: [{ id: 20 }], documentosPrograma: [{ id: 30 }] } });
  };
  await admin.superadminCohortesService.eliminar(7);
  assert.ok(deletes[0].endsWith('/documentosrequisitoconsejocohorte/delete'));
  assert.ok(deletes[1].endsWith('/documentosrequisitoprogramacohorte/delete'));
  assert.ok(deletes[2].endsWith('/api/v1/criteriocohorte/12'));
  assert.ok(deletes[3].endsWith('/cohortes/delete'));
});

test('eliminar cohorte con aspirantes no modifica ninguna asociación', async () => {
  globalThis.fetch = async (url, options) => {
    assert.notEqual(options.method, 'DELETE', 'No debe borrar datos de una cohorte con inscritos');
    return response(url.endsWith('/aspirantes') ? [{ id: 1 }] : { criterios: [], documentosAsignados: { documentosConsejo: [], documentosPrograma: [] } });
  };
  await assert.rejects(admin.superadminCohortesService.eliminar(7), /aspirantes inscritos/);
});
