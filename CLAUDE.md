# Frontend del cine

Aplicación React que consume la API REST de `api-cine-dip` (NestJS), un backend
**desarrollado por otra persona**. Este proyecto es solo el frontend.

Construido sobre la plantilla comercial **Metronic v9.2.0** (React 19 +
TypeScript + Tailwind 4 + Radix UI), limpiada de 957 a ~140 archivos: se
eliminaron 9 layouts demo, todas las páginas de ejemplo, Supabase y la fuente
de iconos keenicons.

---

## Reglas de trabajo

- **No modificar el backend.** Si algo falla ahí, se señala y se sugiere, pero
  el código de `api-cine-dip` no se toca.
- **Comentarios cortos en el código**, en español sin tildes, explicando el
  *por qué*, no el *qué*.
- **Puntos de verificación con `console.log('>>> ...')`** mientras se
  construye. Son temporales: se borran al cerrar cada paso (buscar `>>>`).
- **Nunca programar a ciegas**: antes de escribir un tipo, mirar la respuesta
  real del endpoint o el DTO del backend.
- **Un archivo a la vez**, con su punto de verificación antes de seguir.

---

## Arranque

```powershell
# Backend (en D:\eliminar\api-cine-dip)
npm run start:prod       # corre dist/main; requiere npm run build tras editar

# Frontend
npm run dev
npm run typecheck        # tsc -b --force
npm run build
```

`.env` tiene una sola variable:

```
VITE_CINE_API_URL=http://localhost:3000/api/v1

```

---

## Arquitectura en capas

Cada capa solo habla con la de abajo. **Las pantallas nunca llaman a axios ni
escriben URLs.**

```
pantalla  ->  servicio  ->  lib/http  ->  config/env  ->  .env
```

| Archivo | Responsabilidad |
|---|---|
| `src/config/env.ts` | Único lugar que toca `import.meta.env` |
| `src/lib/http.ts` | Cliente axios. **Único archivo con axios** |
| `src/lib/jwt.ts` | Decodifica el JWT (no valida firma, eso es del backend) |
| `src/types/*.ts` | Forma de los datos de cada módulo |
| `src/services/*.service.ts` | Las rutas y llamadas de cada recurso |
| `src/pages/**` | Pantallas. Solo piden datos y los pintan |

### Convención de nombres

- Archivos en `kebab-case`: `personas-page.tsx`
- Tipos sin sufijo (`types/persona.ts`), servicios con sufijo
  (`services/persona.service.ts`)
- Componentes en `PascalCase` (lo exige React)

### Los dos interceptores de `http.ts`

```
request   -> adjunta Authorization: Bearer a TODAS las peticiones
             (las públicas lo ignoran; así no hay lista que mantener)

response  -> extrae el message del backend y, si llega 401 fuera del login,
             borra el token (sesión vencida)
```

---

## Las tres zonas de rutas

```
PÚBLICA        cualquiera entra, sin sesión
  /                  redirige a /peliculas
  /peliculas         grilla de pósters
  /peliculas/:id     sinopsis + horarios
  /funciones/:id     mapa de butacas + reservar
  /auth/signin       login
  /auth/signup       registro

PRIVADA        <RequireAuth> — solo pide sesión
  /panel             inicio del panel

ADMINISTRATIVA <RequireRole roles={['ADMIN','GERENTE']}>
  /panel/personas          listado + buscador
  /panel/funciones         todas las funciones programadas
  /panel/funciones/nueva   programar función
  /panel/peliculas/nueva   crear película con imágenes

SOLO ADMIN     <RequireRole roles={['ADMIN']}>
  /panel/roles             asignar roles
```

**Regla:** si el endpoint es público, la pantalla va fuera de `RequireAuth`.

> `RequireRole` y el menú filtrado **no son seguridad**: solo evitan ofrecer
> pantallas que el backend va a rechazar con 403.

---

## Autenticación

- Login contra `POST /auth/login`, token en `localStorage` bajo `cine_token`
- El token dura **2 horas** y lleva `{ id, usuario, roles[] }`
- La sesión se restaura al recargar (`useEffect` en el proveedor)
- `login()` **devuelve la sesión**, para que el formulario decida el destino:
  ADMIN o GERENTE van a `/panel`, CLIENTE a `/peliculas`. El parámetro `next`
  tiene prioridad sobre esa decisión.
- **No hay cookies httpOnly**: requerirían cambiar el backend, que no tocamos

```
src/auth/context/auth-context.ts        el contrato (useAuth)
src/auth/providers/cine-auth-provider   la implementación real
src/auth/require-auth.tsx               exige sesión
src/auth/require-role.tsx               exige rol
src/config/menu-por-rol.ts              filtra el menú lateral
```

---

## Endpoints

| Endpoint | Permiso | Dónde se usa |
|---|---|---|
| `POST /auth/login` | público, 5/min | `/auth/signin` |
| `POST /persona` | público | `/auth/signup` |
| `GET /peliculas` | público, paginado | `/peliculas`, detalle, programar función |
| `GET /files/pelicula/:nombre` | público | cada imagen de póster |
| `GET /cartelera/funciones` | público, `?idPelicula=` | detalle, panel |
| `GET /cartelera/funciones/:id/asientos` | público, trae `disponible` | mapa de butacas |
| `GET /cartelera/salas` | público | programar función |
| `POST /reservas` | CLIENTE | botón Reservar |
| `GET /persona` | ADMIN, GERENTE | `/panel/personas` |
| `GET /persona/buscar` | ADMIN, GERENTE | `/panel/personas`, `/panel/roles` |
| `POST /peliculas` | ADMIN, GERENTE | `/panel/peliculas/nueva` |
| `POST /cartelera/funciones` | ADMIN, GERENTE | `/panel/funciones/nueva` |
| `GET /auth/roles` | ADMIN, GERENTE | `/panel/roles` |
| `POST /auth/rol-usuario` | **solo ADMIN** | `/panel/roles` |

### Sin usar, a propósito

| Endpoint | Por qué |
|---|---|
| `GET /persona/:id` | Sin candado — es un fallo de seguridad |
| `POST /persona/gerente` | Solo desde Swagger, para crear cuentas de prueba |
| `GET /cartelera/salas/resumen` | Control interno |
| `GET /cartelera/asientos` | Redundante: el de función trae `disponible` |

---

## Trampas del backend (verificadas, no supuestas)

| Qué | Detalle |
|---|---|
| **`constrasena`** | `POST /persona` pide la clave con ese error de tipeo. `POST /auth/login` la pide bien escrita. Con `forbidNonWhitelisted`, mandar la correcta en el registro da 400 |
| **`codigoReserva` vs `codigo`** | Al enviar la reserva el campo es `codigoReserva`; al responder viene como `codigo` |
| **Respuesta de reserva anidada** | `data.reserva.codigo`, no `data.codigo` |
| **Formatos de fecha distintos** | `/peliculas` y `/persona` devuelven ISO completa; `/cartelera/funciones` devuelve `"2026-09-17"` |
| **Horas con segundos** | El backend espera `"19:00:00"`; el input `type="time"` da `"19:00"` |
| **Respuestas no uniformes** | Unos endpoints envuelven en `{status, message, data}`, otros devuelven el arreglo pelado |
| **`/persona/buscar` usa Y, no O** | Si mandas `nombres` y `apellidos` a la vez, exige que coincidan **ambos**. Mandar el mismo texto en los dos campos devuelve 0 resultados. Por eso las pantallas tienen dos campos separados |
| **`documento` y `telefono` son string** | Aunque parezcan números |
| **Sin PUT, PATCH ni DELETE** | El backend solo crea y lee. No se puede editar ni borrar nada |

### Fallos de seguridad (reportar, no arreglar)

1. **`POST /persona` acepta el `rol` del cuerpo.** Mandando `"rol": 1`
   cualquiera se crea ADMIN sin token (el `@Auth` está comentado).
   El arreglo ya existe en el mismo archivo: `/persona/gerente` hace
   `dataDto.rol = 2`. Desde el frontend **nunca enviamos `rol`**.
2. **El cliente decide el precio.** `POST /reservas` usa el `total` y los
   `precio` del cuerpo; `funcion.precio` nunca se consulta. Verificado:
   precio real Bs 40, se aceptó Bs 1. (El DTO exige positivo, así que
   Bs 0 sí se rechaza.) Desde el frontend calculamos desde `funcion.precio`.
3. **`idCliente` viene del cuerpo**, no del token. Desde el frontend usamos
   `user.id` del token.
4. **`GET /persona/:id` sin protección**: expone nombre, documento, teléfono
   y correo de cualquiera, recorriendo los ids.
5. **Roles revocados siguen funcionando**: la consulta que arma el token no
   filtra por `rol_usuario.estado` ni `fecha_fin`.
6. **Documento duplicado devuelve 500** en vez de 409, y expone el nombre
   interno de la restricción de Postgres.
7. **Sin migraciones ni `.sql` en el repo**: nadie puede recrear la base.

---

## Base de datos

PostgreSQL, base **`pruebadb`** (la anterior, `db-cine`, está obsoleta).
12 tablas en 4 esquemas: `cartelera`, `identidad`, `seguridad`, `ventas`.

Roles: **1 ADMIN · 2 GERENTE · 3 CLIENTE**

### Cuentas de prueba (solo desarrollo local)

```
ana.perez      / ClaveSegura123    ADMIN + CLIENTE
cliente.yujra  / Sergio2026        CLIENTE
sergio.yujra   / Sergio2026        CLIENTE
```

> No hay ningún GERENTE creado. Se crea con `POST /persona/gerente` desde
> Swagger, que fuerza el rol 2 y exige token de ADMIN.

---

## Estado actual

### Terminado

```
RECORRIDO PÚBLICO COMPLETO
  Ver cartelera -> elegir película -> elegir horario -> elegir butacas -> reservar
  Registro y login propios

PANEL ADMINISTRATIVO
  /panel/personas          listado paginado + buscador
  /panel/funciones         todas las funciones programadas
  /panel/funciones/nueva   desplegables de película y sala, valida cruces (409)
  /panel/peliculas/nueva   FormData con hasta 5 imágenes y vista previa
  /panel/roles             buscar persona -> elegir rol -> asignar (solo ADMIN)

INFRAESTRUCTURA
  Tres zonas de rutas, RequireAuth y RequireRole
  Menú lateral filtrado por rol
  Destino tras el login según el rol
  Interceptores de petición y respuesta
```

### Pendiente

```
—  Traducir el error de documento duplicado a un mensaje legible
   (el backend devuelve el error crudo de Postgres: 500 en vez de 409)

—  Guardar las butacas elegidas al pasar por el login
   (hoy se pierden; el "next" solo devuelve a la función)

—  Agrupar horarios por día cuando una película tenga varias funciones

—  Página 403 propia (hoy RequireRole redirige a /peliculas)
```

---

## Errores cometidos en este proyecto (para no repetirlos)

Tres veces se dio por supuesto el comportamiento del backend en vez de
probarlo, y las tres veces la suposición estaba mal:

| Suposición | Realidad |
|---|---|
| El tipo de respuesta de `POST /reservas` | Venía anidado: `data.reserva.codigo`, y el campo se llama `codigo`, no `codigoReserva` |
| "Se puede reservar con `total: 0`" | El DTO tiene `@IsPositive()` y lo rechaza. Lo que sí se puede es mandar un positivo menor al real |
| `/persona/buscar` filtra con O | Filtra con **Y** |

**La regla que sale de esto:** antes de escribir un tipo o asumir un
comportamiento, hacer la petición real y mirar la respuesta. Leer el código
y deducir no es lo mismo que probar.

---

## Contexto del proyecto

Es el trabajo de un diplomado, y además **material de clase**: el autor enseña
frontend con este mismo proyecto. Por eso el código lleva comentarios
explicativos y se construye paso a paso, verificando cada pieza antes de
seguir.

> **Las pantallas del panel son también las tareas de los estudiantes.**
> `/panel/personas` es la Tarea 3, `/panel/peliculas/nueva` la Tarea 4,
> `/panel/funciones/nueva` la 5 y `/panel/roles` la 6. Este código es la
> solución de referencia; conviene no publicarlo antes de la entrega.

