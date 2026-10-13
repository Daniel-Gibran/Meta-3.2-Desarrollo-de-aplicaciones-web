// Validador local del openapi.yaml: comprueba que el YAML parsea, que todos
// los $ref apuntan a algo existente y que están los 18 endpoints del enunciado.
// No forma parte de la entrega.
import fs from 'node:fs';
import YAML from 'yaml';

const doc = YAML.parse(fs.readFileSync('openapi.yaml', 'utf8'));
let errores = 0;

const ok = (n, c, extra = '') => { if (c) console.log(`  OK    ${n}`); else { errores++; console.log(`  FALLA ${n} ${extra}`); } };

console.log('\n=== ESTRUCTURA ===');
ok('openapi 3.x', /^3\./.test(doc.openapi), doc.openapi);
ok('info.title', !!doc.info.title);
ok('servers con url', Array.isArray(doc.servers) && doc.servers.length > 0);
ok('components.schemas', !!doc.components?.schemas);

console.log('\n=== ENDPOINTS ESPERADOS ===');
const esperados = [
  ['get', '/api/v1/jugadores'], ['get', '/api/v1/jugadores/{id}'],
  ['post', '/api/v1/jugadores'], ['put', '/api/v1/jugadores/{id}'], ['delete', '/api/v1/jugadores/{id}'],
  ['get', '/api/v1/rosters'], ['get', '/api/v1/rosters/{id}'],
  ['post', '/api/v1/rosters'], ['put', '/api/v1/rosters/{id}'], ['delete', '/api/v1/rosters/{id}'],
  ['get', '/api/v1/rosters/{id}/jugadores'], ['post', '/api/v1/rosters/{id}/jugadores'],
  ['put', '/api/v1/rosters/{id}/jugadores/{id_jugador}'], ['delete', '/api/v1/rosters/{id}/jugadores/{id_jugador}'],
  ['get', '/api/v1/roles'], ['get', '/api/v1/estados'],
  ['get', '/api/v1/tipos-roster'], ['get', '/api/v1/health'],
];
for (const [metodo, ruta] of esperados) {
  ok(`${metodo.toUpperCase().padEnd(6)} ${ruta}`, !!doc.paths[ruta]?.[metodo], 'falta');
}

console.log('\n=== CODIGOS DOCUMENTADOS POR ENDPOINT ===');
for (const [metodo, ruta] of esperados) {
  const op = doc.paths[ruta]?.[metodo];
  const codigos = Object.keys(op.responses);
  const minimos = metodo === 'delete' ? ['204'] : metodo === 'post' ? ['201'] : ['200'];
  const faltan = minimos.filter((c) => !codigos.includes(c));
  ok(`${metodo.toUpperCase().padEnd(6)} ${ruta} -> ${codigos.join(',')}`, faltan.length === 0, `falta ${faltan}`);
}

console.log('\n=== $refs RESUELTOS ===');
const texto = fs.readFileSync('openapi.yaml', 'utf8');
const refs = [...texto.matchAll(/\$ref: '#\/([^']+)'/g)].map((m) => m[1]);
const resolver = (p) => p.split('/').reduce((o, k) => (o ?? {})[k], doc);
const rotos = [...new Set(refs)].filter((r) => resolver(r) === undefined);
ok(`${new Set(refs).size} referencias unicas`, rotos.length === 0, `rotas: ${rotos.join(', ')}`);

console.log(`\n${errores === 0 ? '✔ openapi.yaml valido' : `✖ ${errores} problemas`}\n`);
process.exit(errores === 0 ? 0 : 1);