# API REST: Perfiles de Jugadores y Rosters

**Metodología de Desarrollo de Aplicaciones Web — Meta 3.2**

API REST para gestionar jugadores de eSports y armar rosters de equipos.
Construida con **Node.js, Express, Sequelize y MySQL**, documentada en
**OpenAPI 3.0** y verificada con colecciones de **REST Client**.

- **Base URL:** `http://localhost:3000/api/v1`
- **Documentación interactiva:** http://localhost:3000/docs
- **OpenAPI (YAML crudo):** http://localhost:3000/docs/openapi.yaml

---

## 1. Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|-------------|----------------|---------------|
| Node.js     | 18             | `node --version` |
| MySQL       | 8.0            | `mysql --version` |
| npm         | 9              | `npm --version` |

---

## 2. Instalación

### Paso 1 — Crear la base de datos y el usuario

El proyecto usa una base y un usuario propios, con principio de mínimo
privilegio: solo accede a la base `esports`.

```bash
# Windows (PowerShell)
mysql -u root -p < db/setup.sql
```

```bash
# Linux / macOS
mysql -u root -p < db/setup.sql
```

Esto crea la base `esports` y el usuario `esports_user` con contraseña
`esports_pass`. El script es idempotente: ejecutarlo dos veces no rompe nada.

### Paso 2 — Instalar dependencias

```bash
npm install
```

### Paso 3 — Configurar las variables de entorno

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Revisa que los valores coincidan con los que creaste en el paso 1. El archivo
`.env` está en `.gitignore`: **nunca se versiona con credenciales reales**.

### Paso 4 — Crear las tablas y los datos iniciales

```bash
npm run migrate     # crea las tablas
npm run seed        # inserta los datos de ejemplo
```

### Paso 5 — Arrancar el servidor

```bash
npm run dev         # con recarga automática (nodemon)
# o
npm start           # sin recarga
```

Salida esperada:

```
✔ Conexión con la base de datos "esports" establecida

  🚀 API de Jugadores y Rosters
  Servidor:     http://localhost:3000
  Swagger UI:   http://localhost:3000/docs
  Health check: http://localhost:3000/api/v1/health
```

Comprobación rápida:

```bash
curl http://localhost:3000/api/v1/health
```

---

## 3. Estructura del proyecto

```text
Meta3.2/
├── server.js                      # Punto de entrada: verifica la BD y escucha
├── openapi.yaml                   # Documentación OpenAPI 3.0 (RNF-01)
├── src/
│   ├── app.js                     # Configuración de Express y middlewares
│   ├── config/
│   │   └── database.js            # Instancia única de Sequelize
│   ├── routes/
│   │   ├── index.js               # Montaje bajo /api/v1
│   │   ├── jugadores.routes.js
│   │   ├── rosters.routes.js
│   │   ├── asignaciones.routes.js
│   │   └── auxiliares.routes.js
│   ├── controllers/               # Traducen HTTP <-> servicios
│   │   ├── jugadores.controller.js
│   │   ├── rosters.controller.js
│   │   ├── asignaciones.controller.js
│   │   └── auxiliares.controller.js
│   ├── services/                  # Reglas de negocio (no conocen Express)
│   │   ├── jugadores.service.js
│   │   ├── rosters.service.js
│   │   └── asignaciones.service.js
│   ├── models/                    # Modelos Sequelize
│   │   ├── index.js
│   │   ├── jugador.model.js
│   │   ├── roster.model.js
│   │   └── rosterJugador.model.js
│   ├── middlewares/
│   │   ├── notFound.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── ApiError.js            # Error con código HTTP incorporado
│       ├── catalogos.js           # Fuente única de valores válidos
│       ├── asyncHandler.js
│       ├── validarId.js
│       ├── serializar.js          # Forma pública de los recursos
│       └── validaciones.js
├── migrations/                    # 3 migraciones
├── seeders/                       # 3 seeders
├── test/                          # 5 colecciones REST Client
├── tools/                         # Scripts de verificación
├── config/config.cjs              # Configuración de sequelize-cli
├── db/setup.sql                   # Creación de base y usuario
└── docs/                          # Material de apoyo
```

### Cómo se distribuyen las responsabilidades

El flujo de una petición nunca se invierte, y cada capa tiene una sola
responsabilidad:

```text
Petición HTTP
     │
     ▼
┌────────────────────────┐
│  RUTAS                 │  ¿Qué verbo y qué ruta existen?
│  jugadores.routes.js   │  Solo declaran. Cero lógica.
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│  CONTROLADOR           │  Extrae y valida la entrada, elige el
│  jugadores.controller  │  código de estado, arma la respuesta.
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│  SERVICE               │  REGLAS DE NEGOCIO. No conoce Express:
│  jugadores.service.js  │  no recibe req ni res, lanza ApiError.
└──────────┬─────────────┘
           ▼
┌────────────────────────┐
│  MODELO                │  Estructura del dato y persistencia.
│  jugador.model.js      │  Unknown to HTTP.
└────────────────────────┘
```

El punto clave está en la flecha del service hacia el controlador: el service
**nunca elige un código HTTP**. Lanza un `ApiError` que ya describe el
problema, y `errorHandler.js` lo traduce a una respuesta. Si un service
llamara a `res.status(409)`, la lógica de negocio quedaría atada al framework y
dejaría de poder reutilizarse.

---

## 4. Endpoints

18 endpoints: 14 principales + 4 auxiliares.

### Jugadores

| Método | Endpoint | Respuesta |
|--------|----------|-----------|
| `GET` | `/api/v1/jugadores` | `200` — admite `?rol`, `?estado`, `?search` |
| `GET` | `/api/v1/jugadores/:id` | `200` / `400` / `404` |
| `POST` | `/api/v1/jugadores` | `201` / `400` / `409` |
| `PUT` | `/api/v1/jugadores/:id` | `200` / `400` / `404` / `409` |
| `DELETE` | `/api/v1/jugadores/:id` | `204` / `400` / `404` / `409` |

### Rosters

| Método | Endpoint | Respuesta |
|--------|----------|-----------|
| `GET` | `/api/v1/rosters` | `200` — admite `?tipo`, `?temporada` |
| `GET` | `/api/v1/rosters/:id` | `200` / `400` / `404` |
| `POST` | `/api/v1/rosters` | `201` / `400` |
| `PUT` | `/api/v1/rosters/:id` | `200` / `400` / `404` |
| `DELETE` | `/api/v1/rosters/:id` | `204` / `400` / `404` |

### Asignación de jugadores a rosters

| Método | Endpoint | Respuesta |
|--------|----------|-----------|
| `GET` | `/api/v1/rosters/:id/jugadores` | `200` / `400` / `404` |
| `POST` | `/api/v1/rosters/:id/jugadores` | `201` / `400` / `404` / `409` |
| `PUT` | `/api/v1/rosters/:id/jugadores/:id_jugador` | `200` / `400` / `404` / `409` |
| `DELETE` | `/api/v1/rosters/:id/jugadores/:id_jugador` | `204` / `400` / `404` |

### Auxiliares

| Método | Endpoint | Respuesta |
|--------|----------|-----------|
| `GET` | `/api/v1/roles` | `200` — Top, Jungle, Mid, ADC, Support |
| `GET` | `/api/v1/estados` | `200` — activo, inactivo |
| `GET` | `/api/v1/tipos-roster` | `200` — Principal, Academy |
| `GET` | `/api/v1/health` | `200` / `503` |

### Ejemplos

```bash
# Crear un jugador
curl -X POST http://localhost:3000/api/v1/jugadores \
  -H "Content-Type: application/json" \
  -d '{"nickname":"Faker","nombre_real":"Lee Sang-hyeok","pais":"Corea del Sur","rol":"Mid"}'

# Crear un roster
curl -X POST http://localhost:3000/api/v1/rosters \
  -H "Content-Type: application/json" \
  -d '{"nombre":"TL Principal","tipo":"Principal","temporada":"2026"}'

# Asignar un jugador al roster
curl -X POST http://localhost:3000/api/v1/rosters/1/jugadores \
  -H "Content-Type: application/json" \
  -d '{"jugador_id":1,"rol_en_roster":"Titular"}'
```

---

## 5. Reglas de negocio

| Regla | Descripción | Dónde se aplica | Respuesta |
|-------|-------------|-----------------|-----------|
| **RN-01** | El `nickname` debe ser único | `jugadores.service.js` + índice `UNIQUE` | `409` |
| **RN-02** | Máximo **5 titulares** por roster | `asignaciones.service.js` | `409` |
| **RN-03** | No puede haber dos titulares con el mismo rol | `asignaciones.service.js` | `409` |
| **RN-04** | Un jugador puede estar en varios rosters | Índice `UNIQUE(roster_id, jugador_id)` | `201` |
| **RN-05** | Al eliminar un roster, los jugadores permanecen | `ON DELETE CASCADE` en la tabla intermedia | `204` |

### RN-01 — Nickname único

Se valida en dos niveles. Primero el service busca el nickname y devuelve
`409` con un mensaje claro. Segundo, la columna tiene un índice `UNIQUE`, de
modo que si dos peticiones simultáneas pasan ambas la comprobación, es la base
de datos la que rechaza la segunda. La segunda capa no es redundante: cubre la
carrera entre peticiones concurrentes, que una comprobación previa no puede
detectar.

### RN-02 — Máximo de 5 titulares

Antes de agregar o promover a un titular se cuentan los titulares del roster.
Si ya hay 5, se devuelve `409` indicando cuántos hay y cuál es la solución.

**El detalle importante:** al cambiar el rol con `PUT`, el conteo **excluye al
propio jugador**. Si no lo excluyera, un titular ya registrado contaría dentro
del máximo, y el quinto titular no podría cambiar de rol nunca: su propio
registro bloquearía la operación.

### RN-03 — Un titular por rol

Se compara el `rol` del jugador en el juego, no su `rol_en_roster`. La regla
habla de la posición que ocupa en el juego: un equipo no puede tener dos Mids
titulares. Dos suplentes del mismo rol sí son válidos.

La comprobación requiere unir la tabla intermedia con la de jugadores, porque
el rol vive en `jugadores` y el filtro de titular en `roster_jugador`.

### RN-04 — Un jugador en varios rosters

No es una validación sino una **ausencia deliberada** de restricción. La
restricción de unicidad está sobre el **par** `(roster_id, jugador_id)`, nunca
sobre `jugador_id` sola. Eso permite que un jugador esté en todos los rosters
que quiera, pero impide repetirlo dentro del mismo roster.

### RN-05 — Los jugadores sobreviven al roster

La clave foránea hacia `rosters` usa `ON DELETE CASCADE`, que borra las filas
de la tabla intermedia. La clave foránea hacia `jugadores` usa
`ON DELETE RESTRICT`, que impide borrar un jugador que todavía tenga
asignaciones. Los jugadores nunca se borran en cascada.

---

## 6. Códigos de estado

| Código | Cuándo se devuelve |
|--------|-------------------|
| `200 OK` | Lectura, filtro o actualización correcta |
| `201 Created` | Recurso creado. Incluye la cabecera `Location` |
| `204 No Content` | Eliminación correcta. Sin cuerpo |
| `400 Bad Request` | Campo obligatorio faltante, valor fuera del catálogo, id no numérico, filtro inválido, JSON malformado |
| `404 Not Found` | El jugador, roster o asignación no existe; ruta no definida |
| `409 Conflict` | RN-01, RN-02, RN-03, jugador ya asignado, jugador con asignaciones al borrarse |
| `500 Internal Server Error` | Fallo no previsto. El detalle se registra en consola y no se filtra al cliente |

### Por qué `400` y no `404` para un id mal formado

`GET /jugadores/abc` devuelve `400`, no `404`. Un id no numérico no es un
recurso que no existe: es una petición mal formada. La distinción importa
porque `404` le dice al cliente "cambia la URL", mientras que `400` le dice
"corrige el dato". Incluso se rechaza `12abc` (y no se interpreta como 12),
porque aceptar un id parcialmente numérico es un clásico de los APIs que luego
produce errores difíciles de rastrear.

### Por qué `409` para las reglas de negocio

`409` significa "la petición es sintácticamente válida, pero choca con el estado
actual del sistema". Un sexto titular no es una petición incorrecta: es
imposible de satisfacer. `400` sugeriría que el cliente podría arreglarlo
cambiando un valor, cuando en realidad tiene que liberar un cupo o cambiar el
rol del jugador.

### Formato de las respuestas

```jsonc
// Éxito
{ "success": true, "count": 3, "data": [ ... ] }
{ "success": true, "message": "Jugador creado exitosamente", "data": { ... } }

// Error
{ "success": false, "error": "Bad Request", "message": "Los datos del jugador no son válidos",
  "details": { "nickname": "El nickname es obligatorio" } }

// Conflicto por regla de negocio
{ "success": false, "error": "Conflict",
  "message": "El roster ya tiene el máximo de 5 titulares",
  "details": { "maximoTitulares": 5, "titularesActuales": 5,
               "solucion": "Agrega al jugador como Suplente, o quita a un titular antes de agregarlo" } }
```

`details` convierte los errores en accionables: no dicen solo qué falló, sino
cómo resolverlo.

---

## 7. Modelo de datos

```text
jugadores                    rosters                    roster_jugador
┌──────────────────────┐     ┌──────────────────────┐    ┌────────────────────────┐
│ id         PK        │     │ id         PK        │    │ id            PK        │
│ nickname   UNIQUE    │     │ nombre               │    │ roster_id     FK ──────┼──┐
│ nombre_real          │◄────┤ tipo                 │    │ jugador_id    FK ───┐  │  │
│ pais                 │ N:M │ temporada            │    │ rol_en_roster        │  │  │
│ rol       ENUM       │     │ juego                │    │ UNIQUE(roster,       │  │  │
│ estado    ENUM       │     └──────────────────────┘    │        jugador)       │  │  │
└──────────────────────┘                               └───────────────────────┘  │  │
                                                                        ON DELETE │  │
                          ┌──────────────────────────────────────────────┐      │  │
                          │ jugador_id → jugadores.id                    │◄─────┘  │
                          │ ON DELETE RESTRICT (no borra al jugador)      │         │
                          └──────────────────────────────────────────────┘         │
                          ┌──────────────────────────────────────────────┐         │
                          │ roster_id → rosters.id                        │◄────────┘
                          │ ON DELETE CASCADE (no borra a los jugadores) │
                          └──────────────────────────────────────────────┘
```

### Catálogos

| Campo | Valores |
|-------|---------|
| `jugadores.rol` | `Top`, `Jungle`, `Mid`, `ADC`, `Support` |
| `jugadores.estado` | `activo`, `inactivo` |
| `rosters.tipo` | `Principal`, `Academy` |
| `roster_jugador.rol_en_roster` | `Titular`, `Suplente` |

`rol` y `rol_en_roster` son cosas distintas y no deben confundirse: un suplente
de Mid sigue siendo Mid en el juego, solo que no juega de titular. Los
catálogos están definidos en `src/utils/catalogos.js`, que es la fuente única
tanto para validar como para exponer los endpoints auxiliares.

### Validación en tres capas

| Capa | Qué valida | Error resultante |
|------|-----------|------------------|
| `validaciones.js` | Campos obligatorios y catálogos, con mensajes claros | `400` con `details` por campo |
| Modelos Sequelize | Tipos y restricciones del modelo | `400` con lista de `errors` |
| MySQL | `NOT NULL`, `UNIQUE`, `ENUM`, claves foráneas | `409` o `400` según la restricción |

Cada capa cubre lo que la anterior no puede: la primera da mensajes útiles, la
última impide datos sucios aunque alguien se salte el service.

---

## 8. Pruebas

Las pruebas están en `test/` como colecciones de **REST Client** para VS Code.

| Archivo | Cobertura |
|---------|-----------|
| `00-preparacion.http` | Verifica el estado inicial de la base |
| `01-jugadores.http` | RF-01 a RF-06, y RN-01 |
| `02-rosters.http` | RF-07 a RF-11, y RN-05 |
| `03-asignaciones.http` | RF-12, RF-13, y RN-02, RN-03, RN-04 |
| `04-auxiliares.http` | Catálogos, health check, reemplazo total, casos límite |

### Cómo ejecutarlas

1. Instalar la extensión **REST Client** (`humao.rest-client`) en VS Code.
2. Levantar el servidor: `npm run dev`.
3. Ejecutar **primero** `00-preparacion.http`.
4. Abrir cada colección, colocar el cursor sobre una petición y pulsar
   `Ctrl+Alt+R`.

Cada petición lleva una aserción `client.test()` que reporta `PASSED` o
`FAILED` en el panel de salida. Las aserciones comprueban **el código de estado
y el contenido**, no solo que la llamada no falle.

> Las colecciones asumen la base recién sembrada. Para volver a ese estado:
> `npm run db:reset`

### Verificación automatizada

Los mismos escenarios se ejecutan también como script de Node, para no depender
del editor:

```bash
npm run db:reset      # base en estado limpio
npm run dev           # en otra terminal
npm test              # 130 aserciones
```

```
================  OK: 130   FALLAS: 0  ================
```

```bash
npm run test:openapi # valida el openapi.yaml: estructura, refs y códigos
```

```
✔ openapi.yaml valido
```

---

## 9. Documentación OpenAPI (RNF-01)

`openapi.yaml` describe los 18 endpoints con esquemas de solicitud y
respuesta, ejemplos reales, parámetros de consulta documentados uno por uno y
**cada código de error con su ejemplo de respuesta**.

Para verla:

- **Swagger UI (interactiva):** http://localhost:3000/docs
- **Editor externo:** arrastra el archivo a https://editor.swagger.io/
- **YAML crudo:** http://localhost:3000/docs/openapi.yaml

---

## 10. Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor con recarga automática |
| `npm start` | Servidor sin recarga |
| `npm run migrate` | Aplica las migraciones pendientes |
| `npm run migrate:status` | Muestra el estado de las migraciones |
| `npm run migrate:undo` | Revierte la última migración |
| `npm run migrate:undo:all` | Revierte todas las migraciones |
| `npm run seed` | Carga los datos iniciales |
| `npm run seed:undo:all` | Borra los datos iniciales |
| `npm run db:reset` | Recrea todo desde cero, con datos |
| `npm test` | Ejecuta las 130 aserciones de la API |
| `npm run test:openapi` | Valida el archivo OpenAPI |

---

## 11. Roles y permisos

El enunciado define dos roles, **Admin** y **Público**, pero **no especifica
ningún endpoint de login ni exige autorización**, y la rúbrica no lo evalúa.
Por eso **la API no implementa autenticación** y todos sus endpoints son de
acceso público. La matriz queda documentada en el `openapi.yaml` como
contexto de diseño:

| Rol | Permisos |
|-----|----------|
| Admin | Crear, editar y eliminar jugadores y rosters |
| Público | Solo ver jugadores y rosters |

| Operación | Público | Admin |
|-----------|:-------:|:-----:|
| Lecturas (`GET`) | Sí | Sí |
| Escrituras (`POST`, `PUT`, `DELETE`) | No | Sí |

Si se añadiera autenticación, el punto de extensión natural es un middleware
antes de los routers en `src/routes/index.js`.

---

## 12. Decisiones de diseño

Las decisiones que el enunciado deja abiertas, y por qué se tomaron así.

### `PUT` es reemplazo total, no mezcla

El enunciado dice `PUT /jugadores/{id}` con "los mismos campos", sin aclarar si
es reemplazo o mezcla. Se eligió **reemplazo total**, que es la semántica de
HTTP: `PUT` promete que el recurso es exactamente lo que se envía.

La consecuencia es que los campos opcionales que no llegan se reponen a `null`,
y que `nickname` y `rol` son obligatorios también en el `PUT`. Es lo que hace que
`400` sea una respuesta coherente cuando se omite el `nickname`.

### No se puede eliminar un jugador que está en un roster

El enunciado no dice qué hacer en este caso. Se eligió devolver `409` y no
borrar nada.

La alternativa era borrar al jugador y sus asignaciones en cascada, más simple,
pero un jugador desaparece con dos clics de todos los rosters a los que
pertenece. Con el `409` el cliente ve exactamente en qué rosters está (viene en
`details.rostersIds`) y decide qué hacer. La base de datos respalda la decisión:
la FK hacia `jugadores` es `ON DELETE RESTRICT`.

### `204` sin cuerpo en los `DELETE`

Es lo que pide el enunciado y es el comportamiento correcto de HTTP: si el
recurso ya no existe, devolverlo en el cuerpo es redundante. En la práctica se
comprueba que la respuesta venga literalmente vacía.

### Valores inválidos en filtros devuelven `400`

`GET /jugadores?rol=Capa` devuelve `400`, no `200` con lista vacía. Un filtro
fuera del catálogo es un error del cliente, no un resultado de búsqueda vacío:
devolver una lista vacía lo haría creer que sí filtró y que no hubo
coincidencias, que son cosas distintas.

### Migraciones en ESM

El proyecto declara `"type": "module"` para usar la misma sintaxis
`import`/`export` en toda la aplicación. Sequelize-cli carga las migraciones con
`require()`, y Node 24 resuelve ESM en ese contexto. Por eso las migraciones
exportan `up` y `down` **como funciones nombradas además del objeto por
defecto**: si una versión de Node no resolviera el `default`, el CLI todavía
encontraría las funciones.

### `config.cjs` en lugar de `config.json`

El material de la clase usa `config/config.json` con las credenciales escritas
directamente. Aquí se usa `config/config.cjs` que las lee de variables de
entorno. El motivo es concreto: un archivo JSON no puede ejecutar código, así
que no puede leer `process.env`. Con un `.cjs` las credenciales viven en `.env`,
que está en `.gitignore`, y cambiar de servidor no requiere tocar el repositorio.

### Sin autenticación

Ver la sección 11.

---

## 13. Problemas encontrados y resueltos

Anotados porque explican por qué el código es como es.

| Problema | Causa | Solución |
|----------|-------|----------|
| `is: { arg: /^\\d{4}$/ }` siempre fallaba | El validador `is` con expresión regular no resuelve el argumento correctamente en Sequelize 6.37 | Se validó la temporada con una función que lanza, que sí funciona |
| `Unknown column 'Jugador.roster_id'` en RN-03 | Se consultaban `roster_id` y `rol_en_roster` sobre el modelo `Jugador`, pero viven en la tabla intermedia | La consulta parte de `RosterJugador` e incluye a `Jugador` |
| `cantidadTitulares` siempre en 0 | El `include` de la lista de rosters usaba `through: { attributes: [] }`, sin el rol en roster | Se carga `rol_en_roster` en el `through` |
| Campos opcionales rechazados al no venir | La validación trataba la ausencia igual que el texto vacío | Solo se rechaza el campo si viene presente y vacío |
| `/docs/openapi.yaml` devolvía HTML | `swaggerUi.serve` tiene una ruta comodín que responde primero | La ruta del YAML se registra antes de montar Swagger UI |
| Seeders con dos titulares del mismo rol | Los datos de prueba violaban RN-03 desde el arranque | Los titulares del seed cubren los cinco roles distintos |

---

## 14. Notas sobre dependencias

`npm audit` reporta 5 vulnerabilidades, todas **transitivas y de herramientas
de desarrollo**, en `nodemon` (a través de `chokidar` y `braces`) y `sequelize`
(a través de `uuid`).

Las correcciones que ofrece `npm audit fix --force` son **peores que el
problema**: installs `nodemon@1.14.10` y `sequelize@3.30.0`, versiones con
años de retraso. Se decidió no aplicarlas y documentar el riesgo en su lugar,
que es una decisión consciente y no una omisión.

---

## 15. Referencias

- [Express — Documentación oficial](https://expressjs.com/es/)
- [Sequelize v6 — Modelos](https://sequelize.org/v6/manual/model-definition.html)
- [Sequelize v6 — Migraciones](https://sequelize.org/v6/manual/migrations.html)
- [Sequelize v6 — Validaciones](https://sequelize.org/v6/manual/validations-and-hooks.html)
- [OpenAPI Specification 3.0](https://spec.openapis.org/oas/v3.0.3)
- [Swagger Editor](https://editor.swagger.io/)
- [MDN — Métodos HTTP](https://developer.mozilla.org/es/docs/Web/HTTP/Methods)
- [MDN — Códigos de estado HTTP](https://developer.mozilla.org/es/docs/Web/HTTP/Status)

---

## 16. Autor

**Daniel Gibran Alvarez Armienta** — `daniel.alvarez26@uabc.edu.mx`
Matrícula: `1183092`

Metodología de Desarrollo de Aplicaciones Web
Ingeniería en Computación