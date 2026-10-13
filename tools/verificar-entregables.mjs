// Replica en secuencia las 5 colecciones .http de /test y comprueba que cada
// aserción se cumple. Sirve para verificar la entrega sin abrir VS Code.
// No forma parte de los entregables: es la herramienta con la que se validaron.
const B = 'http://localhost:3000/api/v1';
let ok = 0, fail = 0;
const globals = {};

async function req (m, u, body) {
  const r = await fetch(B + u, {
    method: m,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let b; try { b = JSON.parse(t); } catch { b = t; }
  return { status: r.status, body: b, headers: r.headers, raw: t };
}
const ck = (n, c, x = '') => { if (c) { ok++; } else { fail++; console.log(`  FALLA ${n} ${x}`); } };
const sec = (t) => console.log(`\n--- ${t}`);

// Cuerpo sin pasar por JSON.stringify: necesario para probar el JSON malformado
// y el body sobredimensionado, que por definición no se pueden enviar como objeto.
async function raw (m, u, cuerpo, ctype = 'application/json') {
  const r = await fetch(B + u, { method: m, headers: { 'Content-Type': ctype }, body: cuerpo });
  const t = await r.text();
  let b; try { b = JSON.parse(t); } catch { b = t; }
  return { status: r.status, body: b, raw: t };
}

const J = (n, rol, e = {}) => ({ nickname: n, nombre_real: `Real ${n}`, pais: 'Mexico', rol, estado: 'activo', ...e });

// ============================================================ COLECCIÓN 0
sec('00-preparacion');
let r = await req('GET', '/health');
ck('0.1', r.status === 200 && r.body.status === 'activo');
ck('0.2', r.body.baseDeDatos === 'conectada');
ck('0.3', r.body.reglas.maximoTitularesPorRoster === 5);
r = await req('GET', '/jugadores');
ck('0.4 count=7', r.body.count === 7, r.body.count);
ck('0.5 Faker Mid', r.body.data.find(j => j.nickname === 'Faker')?.rol === 'Mid');
ck('0.6 CoreJJ inactivo', r.body.data.find(j => j.nickname === 'CoreJJ')?.estado === 'inactivo');
r = await req('GET', '/rosters');
ck('0.7 count=2', r.body.count === 2, r.body.count);
const tl = r.body.data.find(x => x.nombre === 'TL Principal');
ck('0.8 TL 6 jugadores', tl.cantidadJugadores === 6, tl.cantidadJugadores);
ck('0.9 TL 5 titulares', tl.cantidadTitulares === 5, tl.cantidadTitulares);
r = await req('GET', '/rosters/1/jugadores');
ck('0.10 roster1 = 6', r.body.count === 6, r.body.count);
ck('0.11 5 titulares', r.body.data.filter(j => j.rol_en_roster === 'Titular').length === 5);
ck('0.12 1 suplente', r.body.data.filter(j => j.rol_en_roster === 'Suplente').length === 1);
// La base sembrada debe cumplir RN-03: sin roles de titular repetidos.
const rolesT = r.body.data.filter(j => j.rol_en_roster === 'Titular').map(j => j.rol);
ck('0.13 RN-03 en datos semilla', new Set(rolesT).size === rolesT.length, rolesT.join(','));

// ============================================================ COLECCIÓN 1
sec('01-jugadores');
r = await req('POST', '/jugadores', J('Rekkles', 'ADC', { nombre_real: 'Martin Larsson', pais: 'Suecia' }));
ck('[1] 201', r.status === 201, r.status);
ck('[1b] id>7', r.body.data.id > 7, r.body.data.id);
globals.creado = r.body.data.id;
ck('[1c] campos', r.body.data.nickname === 'Rekkles' && r.body.data.rol === 'ADC' && r.body.data.pais === 'Suecia');
ck('[1d] Location', !!r.headers.get('location'));

r = await req('POST', '/jugadores', { nickname: 'Santorin', rol: 'Support' });
ck('[2] 201', r.status === 201, r.status);
ck('[2b] estado default', r.body.data.estado === 'activo');
ck('[2c] nulls', r.body.data.nombre_real === null && r.body.data.pais === null);

r = await req('GET', '/jugadores');
ck('[3] 200 count=9', r.status === 200 && r.body.count === 9, r.body.count);
ck('[3c] sin createdAt', r.body.data[0].createdAt === undefined);
r = await req('GET', '/jugadores/1');
ck('[4] sin dataValues', r.body.data.dataValues === undefined && r.body.data.updatedAt === undefined);
r = await req('GET', '/jugadores/1');
ck('[5] 200 Faker', r.status === 200 && r.body.data.nickname === 'Faker');
r = await req('GET', '/jugadores/9999');
ck('[6] 404 msg 9999', r.status === 404 && r.body.message.includes('9999'));
r = await req('GET', '/jugadores/abc');
ck('[7] 400 no 404', r.status === 400 && r.status !== 404);

r = await req('PUT', '/jugadores/2', J('Impact', 'Support', { estado: 'inactivo' }));
ck('[8] 200 inactivo', r.status === 200 && r.body.data.estado === 'inactivo', r.status);
r = await req('PUT', '/jugadores/9999', J('NoExiste', 'Top'));
ck('[9] 404', r.status === 404, r.status);
r = await req('PUT', '/jugadores/2', { rol: 'Support', estado: 'activo' });
ck('[10] 400 details.nickname', r.status === 400 && r.body.details.nickname !== undefined, r.status);

r = await req('DELETE', `/jugadores/${globals.creado}`);
ck('[11] 204', r.status === 204, r.status);
ck('[11b] sin cuerpo', r.raw === '', JSON.stringify(r.raw));
r = await req('DELETE', `/jugadores/${globals.creado}`);
ck('[12] 404', r.status === 404, r.status);

r = await req('GET', '/jugadores?rol=Mid');
ck('[13] 200 count=1 Mid', r.status === 200 && r.body.count === 1 && r.body.data.every(j => j.rol === 'Mid'), r.body.count);
r = await req('GET', '/jugadores?estado=inactivo');
ck('[14] 200', r.status === 200 && r.body.data.every(j => j.estado === 'inactivo'));
r = await req('GET', '/jugadores?search=lic');
ck('[15] Licorice', r.body.count === 1 && r.body.data[0].nickname === 'Licorice', r.body.count);
r = await req('GET', '/jugadores?search=LIC');
ck('[16] case-insensitive', r.body.count === 1 && r.body.data[0].nickname === 'Licorice', r.body.count);
r = await req('GET', '/jugadores?search=zzzznoexiste');
ck('[17] 200 vacio', r.status === 200 && r.body.count === 0, r.body.count);
r = await req('GET', '/jugadores?rol=Capa');
ck('[18] 400 msg Mid', r.status === 400 && r.body.message.includes('Mid'), r.status);
r = await req('GET', '/jugadores?rol=Mid&estado=activo');
ck('[19] combinados', r.status === 200 && r.body.data.every(j => j.rol === 'Mid' && j.estado === 'activo'));

r = await req('POST', '/jugadores', J('Faker', 'Mid'));
ck('[20] RN-01 409', r.status === 409, r.status);
ck('[20c] details id=1', r.body.details?.jugador_id === 1, JSON.stringify(r.body.details));
r = await req('POST', '/jugadores', { nickname: 'RolInvalido', rol: 'Capa' });
ck('[21] 400 details.rol', r.status === 400 && r.body.details.rol !== undefined, r.status);
r = await req('POST', '/jugadores', { pais: 'Mexico' });
ck('[22] 400 ambos', r.status === 400 && r.body.details.nickname !== undefined && r.body.details.rol !== undefined, r.status);
r = await req('PUT', '/jugadores/3', J('Faker', 'Jungle'));
ck('[23] RN-01 en PUT 409', r.status === 409, r.status);
r = await req('PUT', '/jugadores/3', J('CuVee', 'Jungle'));
ck('[24] mismo nickname 200', r.status === 200, r.status);
r = await req('GET', '/ruta-inexistente');
ck('[25] 404', r.status === 404, r.status);

// ============================================================ COLECCIÓN 2
sec('02-rosters');
r = await req('GET', '/rosters');
ck('[1] 200 count=2', r.status === 200 && r.body.count === 2, r.body.count);
ck('[1c] cantidades', r.body.data.every(x => typeof x.cantidadJugadores === 'number'));
const tl2 = r.body.data.find(x => x.nombre === 'TL Principal');
ck('[2] TL 6/5', tl2.cantidadJugadores === 6 && tl2.cantidadTitulares === 5, `${tl2.cantidadJugadores}/${tl2.cantidadTitulares}`);
r = await req('GET', '/rosters?tipo=Principal');
ck('[3] filtro tipo', r.status === 200 && r.body.count === 1 && r.body.data.every(x => x.tipo === 'Principal'));
r = await req('GET', '/rosters?temporada=2026');
ck('[4] filtro temporada', r.status === 200 && r.body.data.every(x => x.temporada === '2026'));
r = await req('GET', '/rosters?tipo=Inventado');
ck('[5] tipo invalido 400', r.status === 400, r.status);
r = await req('GET', '/rosters?temporada=abcd');
ck('[6] temporada invalida 400', r.status === 400, r.status);

r = await req('GET', '/rosters/1');
ck('[7] 200 6 jugadores', r.status === 200 && r.body.data.jugadores.length === 6, r.body.data.jugadores?.length);
ck('[7c] rol y rol_en_roster', r.body.data.jugadores.every(j => j.rol && ['Titular','Suplente'].includes(j.rol_en_roster)));
ck('[7d] sin campos técnicos', r.body.data.jugadores.every(j => j.roster_id === undefined && j.jugador_id === undefined));
r = await req('GET', '/rosters/1/jugadores');
ck('[8] subrecurso 6', r.body.count === 6, r.body.count);
r = await req('GET', '/rosters/9999');
ck('[9] 404', r.status === 404, r.status);

r = await req('POST', '/rosters', { nombre: 'Team Solo Mide', juego: 'League of Legends', tipo: 'Principal', temporada: '2026' });
ck('[10] 201 id=3', r.status === 201 && r.body.data.id === 3, `${r.status} id=${r.body?.data?.id}`);
globals.roster3 = r.body?.data?.id;
ck('[10c] Location', !!r.headers.get('location'));
r = await req('POST', '/rosters', { nombre: 'Roster Sin Juego', tipo: 'Academy', temporada: '2027' });
ck('[11] 201 juego default', r.status === 201 && r.body.data.juego === 'League of Legends', `${r.status} ${r.body?.data?.juego}`);
r = await req('POST', '/rosters', { nombre: 'Roster Mal', tipo: 'Principal', temporada: 'abc' });
ck('[12] 400 details.temporada', r.status === 400 && r.body.details.temporada !== undefined, r.status);
r = await req('POST', '/rosters', { nombre: 'Roster Mal', tipo: 'Amateur', temporada: '2026' });
ck('[13] 400 tipo', r.status === 400, r.status);

r = await req('PUT', '/rosters/2', { nombre: 'TL Academy Renombrado', juego: 'League of Legends', tipo: 'Academy', temporada: '2027' });
ck('[14] 200', r.status === 200 && r.body.data.temporada === '2027', r.status);
r = await req('PUT', '/rosters/9999', { nombre: 'NoExiste', tipo: 'Principal', temporada: '2026' });
ck('[15] 404', r.status === 404, r.status);
r = await req('PUT', '/rosters/2', { tipo: 'Academy', temporada: '2026' });
ck('[16] 400 sin nombre', r.status === 400, r.status);
r = await req('GET', '/rosters/2');
ck('[17] persistido 2027', r.body.data.temporada === '2027', r.body.data.temporada);

r = await req('DELETE', `/rosters/${globals.roster3}`);
ck('[18] 204', r.status === 204, r.status);
ck('[18b] sin cuerpo', r.raw === '');
r = await req('GET', `/rosters/${globals.roster3}`);
ck('[19] 404', r.status === 404, r.status);
r = await req('DELETE', '/rosters/9999');
ck('[20] 404', r.status === 404, r.status);
r = await req('GET', '/jugadores');
ck('[21] siguen habiendo jugadores', r.body.count > 0);
const nombres = r.body.data.map(j => j.nickname);
ck('[22b] 7 iniciales vivos', ['Faker','Impact','CuVee','Licorice','CoreJJ','Aatrox','Elyoya'].every(n => nombres.includes(n)), nombres.join(','));

// ============================================================ COLECCIÓN 3
sec('03-asignaciones');
r = await req('GET', '/rosters/1/jugadores');
ck('[1] 6', r.status === 200 && r.body.count === 6, r.body.count);
r = await req('GET', '/rosters/9999/jugadores');
ck('[2] 404', r.status === 404, r.status);
r = await req('GET', '/rosters/abc/jugadores');
ck('[3] 400', r.status === 400, r.status);

r = await req('POST', '/rosters/2/jugadores', { jugador_id: 1, rol_en_roster: 'Titular' });
ck('[4] 201', r.status === 201, `${r.status} ${r.raw.slice(0,120)}`);
ck('[4b] datos', r.body.data.roster_id === 2 && r.body.data.jugador_id === 1 && r.body.data.rol_en_roster === 'Titular');
ck('[4c] jugador completo', r.body.data.jugador.nickname === 'Faker');
r = await req('POST', '/rosters/2/jugadores', { jugador_id: 9999, rol_en_roster: 'Titular' });
ck('[5] 404 msg 9999', r.status === 404 && r.body.message.includes('9999'), r.status);
r = await req('POST', '/rosters/9999/jugadores', { jugador_id: 1, rol_en_roster: 'Titular' });
ck('[6] 404', r.status === 404, r.status);
r = await req('POST', '/rosters/2/jugadores', { jugador_id: 2, rol_en_roster: 'Capitan' });
ck('[7] 400 details.rol_en_roster', r.status === 400 && r.body.details.rol_en_roster !== undefined, r.status);

r = await req('POST', '/rosters/1/jugadores', { jugador_id: 5, rol_en_roster: 'Titular' });
ck('[8] RN-02 409', r.status === 409, `${r.status} ${r.raw.slice(0,140)}`);
ck('[8c] details 5/5', r.body.details?.maximoTitulares === 5 && r.body.details?.titularesActuales === 5, JSON.stringify(r.body.details));
r = await req('POST', '/rosters/1/jugadores', { jugador_id: 5, rol_en_roster: 'Suplente' });
ck('[9] suplente 201', r.status === 201, `${r.status} ${r.raw.slice(0,120)}`);
r = await req('POST', '/rosters/1/jugadores', { jugador_id: 1, rol_en_roster: 'Titular' });
ck('[10] duplicado 409', r.status === 409 && r.body.message.includes('ya está asignado'), `${r.status} ${r.body?.message}`);
r = await req('GET', '/rosters/1');
ck('[11] siguen 5 titulares', r.body.data.jugadores.filter(j => j.rol_en_roster === 'Titular').length === 5,
  r.body.data.jugadores.filter(j => j.rol_en_roster === 'Titular').length);

r = await req('POST', '/rosters/2/jugadores', { jugador_id: 2, rol_en_roster: 'Titular' });
ck('[12] Support titular 201', r.status === 201, `${r.status} ${r.raw.slice(0,120)}`);
r = await req('POST', '/rosters/2/jugadores', { jugador_id: 5, rol_en_roster: 'Titular' });
ck('[13] RN-03 409', r.status === 409, `${r.status} ${r.raw.slice(0,160)}`);
ck('[13c] conflicto con Impact', r.body.details?.rol === 'Support' && r.body.details?.jugadorActual?.nickname === 'Impact',
  JSON.stringify(r.body.details));
r = await req('POST', '/rosters/2/jugadores', { jugador_id: 5, rol_en_roster: 'Suplente' });
ck('[14] suplente 201', r.status === 201, `${r.status} ${r.raw.slice(0,120)}`);
r = await req('GET', '/rosters/2');
{
  const roles = r.body.data.jugadores.filter(j => j.rol_en_roster === 'Titular').map(j => j.rol);
  ck('[15] sin roles repetidos', new Set(roles).size === roles.length, roles.join(','));
}
r = await req('GET', '/jugadores/1');
ck('[16] 200 Faker', r.status === 200 && r.body.data.nickname === 'Faker');
r = await req('POST', '/rosters/2/jugadores', { jugador_id: 3, rol_en_roster: 'Suplente' });
ck('[17] RN-04 201', r.status === 201, `${r.status} ${r.raw.slice(0,120)}`);
r = await req('GET', '/rosters/2/jugadores');
ck('[18] CuVee suplente', r.body.data.find(j => j.nickname === 'CuVee')?.rol_en_roster === 'Suplente');

r = await req('PUT', '/rosters/1/jugadores/1', { rol_en_roster: 'Titular' });
ck('[19] 200 mismo rol', r.status === 200 && r.body.data.rol_en_roster === 'Titular', r.status);
r = await req('PUT', '/rosters/2/jugadores/5', { rol_en_roster: 'Titular' });
ck('[20] RN-03 en PUT 409', r.status === 409, r.status);
ck('[20b] 409 sin data', r.body.data === undefined || r.body.data === null);
r = await req('PUT', '/rosters/1/jugadores/9999', { rol_en_roster: 'Titular' });
ck('[21] 404', r.status === 404, r.status);
r = await req('PUT', '/rosters/2/jugadores/5', { rol_en_roster: 'Lider' });
ck('[22] 400', r.status === 400, r.status);

r = await req('DELETE', '/rosters/1/jugadores/7');
ck('[23] 204', r.status === 204, r.status);
ck('[23b] sin cuerpo', r.raw === '');
r = await req('GET', '/jugadores/7');
ck('[24] Elyoya sobrevive', r.status === 200 && r.body.data.nickname === 'Elyoya', r.status);
r = await req('DELETE', '/rosters/1/jugadores/9999');
ck('[25] 404', r.status === 404, r.status);
r = await req('GET', '/rosters/1/jugadores');
ck('[26] roster1 = 6', r.body.count === 6, r.body.count);

// ============================================================ COLECCIÓN 4
sec('04-auxiliares');
r = await req('GET', '/roles');
ck('[1] 5 roles', r.status === 200 && ['Top','Jungle','Mid','ADC','Support'].every(x => r.body.data.includes(x)), r.body.count);
r = await req('GET', '/estados');
ck('[2] 2 estados', r.status === 200 && r.body.data.includes('activo') && r.body.data.includes('inactivo'), r.body.count);
r = await req('GET', '/tipos-roster');
ck('[3] 2 tipos', r.status === 200 && r.body.data.includes('Principal') && r.body.data.includes('Academy'));
r = await req('GET', '/roles');
ck('[4] catalogo', r.body.count === 5);
r = await req('GET', '/health');
ck('[5] 200 activo', r.status === 200 && r.body.status === 'activo');
ck('[5c] conectada', r.body.baseDeDatos === 'conectada');
ck('[6] reglas', r.body.reglas.maximoTitularesPorRoster === 5 && r.body.reglas.juegoPorDefecto === 'League of Legends');
ck('[7] RNF-03 <500ms', r.body.latenciaMs < 500, `${r.body.latenciaMs}ms`);
ck('[8] version', r.body.version === '1.0.0');

r = await req('DELETE', '/jugadores/1');
ck('[9] DELETE jugador en roster 409', r.status === 409, r.status);
ck('[9b] solucion en details', !!r.body.details?.solucion);
ck('[9c] rostersIds', Array.isArray(r.body.details?.rostersIds) && r.body.details.rostersIds.length >= 1, JSON.stringify(r.body.details?.rostersIds));
r = await req('GET', '/jugadores/1');
ck('[10] no se borró', r.status === 200 && r.body.data.nickname === 'Faker');
r = await req('DELETE', '/rosters/1/jugadores/1');
ck('[11] 204', r.status === 204, r.status);
r = await req('DELETE', '/rosters/2/jugadores/1');
ck('[12] 204', r.status === 204, r.status);
r = await req('DELETE', '/jugadores/1');
ck('[13] ahora 204', r.status === 204, r.status);

r = await req('POST', '/jugadores', J('PruebaReemplazo', 'Top', { pais: 'Argentina' }));
ck('[14] 201', r.status === 201, r.status);
globals.reemplazo = r.body.data?.id;
r = await req('PUT', `/jugadores/${globals.reemplazo}`, { nickname: 'PruebaReemplazo', rol: 'Top' });
ck('[15] 200', r.status === 200, r.status);
ck('[15b] reinicios a null/default', r.body.data.nombre_real === null && r.body.data.pais === null && r.body.data.estado === 'activo',
  JSON.stringify(r.body.data));
r = await req('PUT', `/jugadores/${globals.reemplazo}`, { rol: 'Support' });
ck('[16] 400 sin nickname', r.status === 400, r.status);
r = await req('DELETE', `/jugadores/${globals.reemplazo}`);
ck('[17] 204', r.status === 204, r.status);

r = await req('GET', '/jugadores/9999');
ck('[18] forma de error', r.body.success === false && typeof r.body.error === 'string' && typeof r.body.message === 'string' && r.body.data === undefined);
r = await req('GET', '/jugadores/0');
ck('[19] id 0 -> 400', r.status === 400, r.status);
r = await req('GET', '/jugadores/-5');
ck('[20] id negativo -> 400', r.status === 400, r.status);
r = await req('GET', '/jugadores/12abc');
ck('[21] id con letras -> 400', r.status === 400, r.status);

// JSON malformado y body sobredimensionado: el middleware que lee el cuerpo ya
// asigna el código correcto (400 / 413) en err.status. El handler debe respetarlo;
// si no, ambos caen en el 500 genérico, que no dice al cliente qué corregir.
r = await raw('POST', '/jugadores', '{ "nickname": ');
ck('[22] JSON malformado -> 400', r.status === 400, r.status);
ck('[22b] mensaje sobre JSON', String(r.body.message).includes('JSON'), r.body.message);

const sobredimensionado = JSON.stringify({ nickname: 'A'.repeat(120 * 1024), rol: 'Top' });
ck('[23-pre] el cuerpo supera 100 KB', sobredimensionado.length > 100 * 1024, sobredimensionado.length);
r = await raw('POST', '/jugadores', sobredimensionado);
ck('[23] cuerpo > 100 KB -> 413', r.status === 413, r.status);
ck('[23b] mensaje sobre el límite', String(r.body.message).includes('100 KB'), r.body.message);
ck('[23c] NO es 500', r.status !== 500, r.status);

console.log(`\n================  OK: ${ok}   FALLAS: ${fail}  ================\n`);
process.exit(fail === 0 ? 0 : 1);