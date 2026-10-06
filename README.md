# Nido — control parental (Vite + React + Express, JavaScript)

Reescritura del proyecto original (TanStack Start + plataforma Grok) sobre un stack estándar:

| Capa | Original | Esta versión |
|---|---|---|
| Cliente | TanStack Router/Start (SSR) | **Vite + React 19 + react-router-dom** |
| Servidor | `createServerFn` de TanStack Start | **Express 5**, endpoint `POST /api/rpc/<función>` |
| Base de datos | Neon / PGlite | **Postgres (`DATABASE_URL`) o PGlite embebido** (mismas migraciones SQL) |
| Auth | Better Auth + broker OAuth de Grok | **Better Auth, correo + contraseña** |
| Cobros | Stripe | Stripe (misma lógica y webhook) |

## Ejecutar

```bash
npm install
cp .env.example .env      # opcional: sin DATABASE_URL usa PGlite
npm run dev               # API en :3000, web en :5173
```

Producción: `npm run build && npm start` (Express sirve `dist/` y la API en el mismo puerto).

## Qué se conservó tal cual

- Lógica de negocio: `server/functions.ts` es `src/lib/family/server.ts` con solo los imports cambiados
  (límites diarios/semanales, horario de descanso, pausas, solicitudes de tiempo, PIN, vinculación por código,
  heartbeat, alertas de manipulación, filtros por edad).
- `src/lib/filter/*` (clasificador de URLs y catálogo), `src/lib/family/billing.ts`, tipos y tests.
- Migraciones `migrations/0001`–`0007` sin modificar el esquema.
- Todos los componentes y pantallas, estilos (`styles.css`), iconos (lucide), favicon, iconos PWA, `og.jpg`,
  `x-banner.jpg`, imágenes de `public/artwork` y las ilustraciones de la guía de instalación en iOS.

## Qué cambió

- `src/lib/family/api.ts` expone las mismas funciones con la misma llamada `fn({ data })`, por lo que
  las pantallas casi no cambiaron (solo router y imports).
- `server/rpc.ts` reemplaza `createServerFn`/`authMiddleware`; valida sesión y origen en cada llamada protegida.
- Se eliminó lo específico de la plataforma Grok: OAuth del broker, puente de vista previa, popup de login,
  plugin PWA/OG, `app-data`, multijugador P2P. El manifest PWA y la guía `/instalar` ahora son propios.

## Pendiente de verificar

Este paquete se generó sin acceso a npm, así que **no se ejecutó `npm install` ni `npm run build`**.
Sí se comprobó: los 15 tests de lógica (clasificador y facturación) pasan, y el mecanismo RPC funciona en runtime.
Primer paso recomendado: `npm install && npm run typecheck`.
