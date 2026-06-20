# 🔍 Auditoría Completa — SentinelCore

> **Sistema de Gestión de Tickets y SLA para Centros Comerciales**
> Stack: React 19 + Vite 8 + Tailwind 4 | Express 5 + Prisma 7 + PostgreSQL 15

---

## Resumen Ejecutivo

SentinelCore tiene una base sólida: buena separación de responsabilidades, validación con Zod, hashing con Argon2, rate limiting, máquina de estados para tickets, auto-asignación inteligente, y sistema de auditoría completo. **La arquitectura backend está bien pensada.** Sin embargo, hay brechas significativas que impiden que sea production-ready y vendible. A continuación detallo TODO.

---

## 1. 🔴 SEGURIDAD — Hallazgos Críticos

### 1.1 JWT Secret Hardcodeado en `.env`

```
JWT_SECRET="super_secreto_para_desarrollo_unefa_2026"
```

> [!CAUTION]
> El `.env` está en el repo con un secret débil y predecible. Cualquiera que clone el repo puede firmar tokens válidos.

**Fix:**
- Generar secret con `openssl rand -base64 64`
- Agregar `.env` al `.gitignore` (verificar que NO esté trackeado)
- Usar variables de entorno del hosting en producción (Render/Railway las inyectan)

### 1.2 Contraseña de PostgreSQL en `.env`

```
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/..."
```

Misma situación — credenciales de DB expuestas.

### 1.3 CORS sin Restricción Efectiva

En [env.ts](file:///home/giuseppe/sentinel-core/backend/src/config/env.ts#L9):
```typescript
CORS_ORIGIN: z.string().default('http://localhost:5173'),
```

El default apunta a dev. En producción necesitás:
- Whitelist explícito de dominios permitidos
- Soporte para múltiples orígenes (web + mobile)

### 1.4 Cookie Configuration Ausente

En [auth.controller.ts](file:///home/giuseppe/sentinel-core/backend/src/controllers/auth.controller.ts) necesitás verificar que la cookie del JWT tenga:
```typescript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only en prod
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000, // match JWT_EXPIRATION
})
```

### 1.5 Sanitización XSS Incompleta

[sanitize.ts](file:///home/giuseppe/sentinel-core/backend/src/utils/sanitize.ts) hace HTML entity encoding, lo cual está bien. PERO:
- Los comentarios (`Comment`) NO se sanitizan en [comment.service.ts](file:///home/giuseppe/sentinel-core/backend/src/services/comment.service.ts)
- Los nombres de usuario al registrarse NO se sanitizan
- En el frontend, si renderizás con `dangerouslySetInnerHTML` en algún lugar, hay riesgo de stored XSS

**Fix:** Aplicar sanitización como middleware global para todos los `req.body` string fields, o al menos extender a `Comment.content`.

### 1.6 Backup Service — Inyección de Comandos

En [backup.service.ts](file:///home/giuseppe/sentinel-core/backend/src/services/backup.service.ts), el `filename` para restore viene del cliente:
```typescript
async function restoreBackup(filename: string): Promise<void> {
  const filePath = path.resolve(BACKUPS_DIR, filename);
```

Si `filename` contiene `../../etc/passwd` o similar → **path traversal**. Falta validar que el filename no contenga `..` ni `/`.

**Fix:**
```typescript
if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
  throw new AppError(400, 'Nombre de archivo inválido');
}
```

### 1.7 Sin Refresh Token

El JWT actual expira en 8h sin mecanismo de refresh. En producción:
- Access token: 15-30 min
- Refresh token: 7 días, guardado en httpOnly cookie
- Endpoint `/api/auth/refresh` para renovar

### 1.8 Register Público sin Protección

[register-public](file:///home/giuseppe/sentinel-core/backend/src/routes/auth.routes.ts#L33-L37) no tiene rate limiting específico. Un bot podría crear miles de cuentas REQUESTER.

**Fix:** Agregar rate limiter estricto (5 registros por IP cada hora) + CAPTCHA opcional.

### ✅ Lo que está BIEN en seguridad:
- Argon2 para hashing (mejor que bcrypt)
- Rate limiting global y específico para login
- Role guards en rutas
- Validación con Zod en todas las rutas
- Auth middleware sólido con soporte cookie + bearer
- Password mínimo validado en schema

---

## 2. 🟡 REPORTES — Estado Actual: Insuficiente

### 2.1 Excel — Problemas Encontrados

En [Reports.jsx](file:///home/giuseppe/sentinel-core/frontend/src/pages/admin/Reports.jsx#L45-L64):

| Problema | Detalle |
|----------|---------|
| **Sin logo** | El Excel no tiene branding. Para facturación esto es inaceptable |
| **Sin headers profesionales** | No hay encabezado con nombre del CC, RIF, dirección, fecha de emisión |
| **Sin formato visual** | Celdas sin color, sin bordes, sin negritas. Es data cruda |
| **Sin filtro por fechas real** | El `dateRange` se setea pero NUNCA se envía al backend — el API siempre devuelve `all` |
| **Sin hoja de técnicos** | Falta reporte de rendimiento por técnico (tickets resueltos, tiempo promedio) |
| **Sin firma/footer** | Falta pie con "Generado por SentinelCore" + fecha/hora de generación |

### 2.2 PDF — No Existe

No hay generación de PDF. Para facturación y reportes formales, PDF es OBLIGATORIO.

**Solución recomendada (100% gratuita):**
- **Backend**: `pdfmake` (puro JS, no requiere binarios nativos como puppeteer)
- Endpoint: `GET /api/reports/pdf?type=monthly&from=...&to=...`
- El PDF se genera server-side y se descarga

### 2.3 Contenido de Reportes — Lo que FALTA

Para que esto sirva como facturación/auditoría de un CC real:

#### Reporte Mensual de Gestión (PDF)
- Portada con logo, nombre del CC, período, fecha de generación
- Resumen ejecutivo (KPIs principales)
- Tabla de tickets por categoría con tiempos de resolución
- Tabla de técnicos con su rendimiento
- Gráfico de cumplimiento SLA (%)
- Tickets pendientes al cierre del período
- Firma digital / pie institucional

#### Reporte por Técnico (PDF/Excel)
- Tickets asignados, resueltos, tiempo promedio
- Cumplimiento de SLA individual

#### Reporte de Facturación/Costos (Excel)
- Si el CC cobra por mantenimiento a locatarios, este reporte detalla:
  - Tickets por locatario (local + nombre)
  - Categoría de incidencia
  - Horas invertidas
  - Base para cobro

### 2.4 Gráficos con Datos Falsos

En [Reports.jsx L187-193](file:///home/giuseppe/sentinel-core/frontend/src/pages/admin/Reports.jsx#L187-L193):
```javascript
// Datos RANDOM — inaceptable para producción
Baja: Math.max(0, base.LOW + Math.round((Math.random() - 0.5) * 3)),
```

**Fix:** Crear endpoint en backend que devuelva datos reales agrupados por día/semana.

---

## 3. 🟡 UX / VISUAL — Ajustes del Profesor + Mejoras

### 3.1 Colores del Panel — "Cuesta ver las cosas"

Paleta actual en [index.css](file:///home/giuseppe/sentinel-core/frontend/src/index.css):
- Background: `#F5F7FA` (gris muy claro) ✅
- Sidebar: `bg-gray-50` (casi blanco) — bajo contraste
- Barras de progreso: `bg-slate-700` — TODO es gris/slate

**Problemas de accesibilidad:**
- Todo es monocromático slate. Sin color semántico para distinguir estados
- Los textos `text-[10px]` y `text-xs` son demasiado pequeños para uso prolongado
- El sidebar no tiene indicador visual fuerte del ítem activo (`bg-slate-200` es sutil)

**Mejoras propuestas:**
1. **Sidebar**: usar el `--color-primary-900: #001B52` (azul oscuro) como fondo. Texto blanco. Esto le da identidad y contraste profesional
2. **States con color semántico**: Abierto=azul, En Proceso=amber, Resuelto=emerald, Vencido=rojo
3. **Tamaños de fuente mínimos**: `text-xs` (12px) como mínimo, nunca `text-[10px]` para datos importantes
4. **KPI cards**: agregar un borde lateral de color según el tipo (como un accent stripe)
5. **Tema oscuro opcional**: para uso nocturno (CSS variables ya están — se puede invertir)

### 3.2 Responsive — Problemas en Móvil

- El sidebar móvil funciona bien (drawer con AnimatePresence) ✅
- PERO: las tablas de tickets (40KB de JSX en `TicketList.jsx`) probablemente overflow en pantallas pequeñas
- Los KPI cards en grid 4-col deberían ser swipeable en móvil, no grid

### 3.3 Loading States

- Skeleton loading en AdminDashboard ✅ Bien
- PERO: en Reports y otras páginas, solo hay spinner genérico
- **Fix:** Skeletons consistentes en todas las páginas

### 3.4 Empty States

Falta diseño para estados vacíos: "No hay tickets", "Sin técnicos disponibles", etc. Ahora simplemente no muestra nada.

### 3.5 Logo

Tenés [Logo_Claro-fOscuro.jpg](file:///home/giuseppe/sentinel-core/frontend/src/assets/Logo_Claro-fOscuro.jpg) pero:
- Formato JPG en vez de SVG/PNG con transparencia
- No se usa en reportes
- No hay favicon configurado

---

## 4. 📱 NOTIFICACIONES AL TELÉFONO

### Estado Actual

Las notificaciones son **in-app solamente** — se guardan en DB y se muestran en un dropdown del frontend. NO llegan al teléfono.

### Opciones Gratuitas para Push Notifications

| Opción | Costo | Funciona Offline | Complejidad |
|--------|-------|-----------------|-------------|
| **Web Push (VAPID)** | Gratis, ilimitado | Sí (Service Worker) | Media |
| Firebase Cloud Messaging (FCM) | Gratis hasta ~1M/mes | Sí | Media-Alta |
| OneSignal | Gratis hasta 10K subs | Sí | Baja |

**Recomendación: Web Push con VAPID keys**
- 100% gratis, sin dependencia de terceros
- El backend genera las VAPID keys, el frontend registra el Service Worker
- Cuando se crea una notificación en `notificationService.createNotification()`, también se dispara el web push
- Funciona en Chrome, Edge, Firefox (no Safari iOS — ahí necesitás la app nativa)

### Para App Móvil
- Expo Push Notifications (gratis) — se integra con FCM/APNs automáticamente

---

## 5. 📱 APP MÓVIL — Recomendación

### Contexto Venezuela
- PCs de baja gama con RAM limitada
- Conexiones inestables (CANTV, datos móviles)
- Teléfonos Android de gama media-baja

### Stack Recomendado

| Opción | Pros | Contras |
|--------|------|---------|
| **React Native + Expo** | Reutilizás conocimiento React, Expo simplifica TODO, push notifications gratis, builds en la nube (EAS) | Bundle más grande que nativo |
| Flutter | Rendimiento nativo, UI pulida | Otro lenguaje (Dart), curva de aprendizaje |
| PWA (Progressive Web App) | CERO costo extra, se instala desde Chrome, funciona offline | Sin acceso a Play Store, limitaciones en iOS |

> [!IMPORTANT]
> **Recomendación: PWA primero, Expo después.**
>
> 1. Convertir el frontend actual en PWA (agregar manifest.json + service worker). Esto es literalmente 30 min de trabajo y ya tenés una "app" instalable.
> 2. Si necesitás Play Store o funcionalidades nativas → React Native con Expo, reutilizando la API REST que ya tenés.

### PWA — Lo mínimo para que funcione como app

```
frontend/public/
├── manifest.json      ← nombre, iconos, colores
├── sw.js             ← service worker para cache
├── icon-192.png      ← ícono de instalación
└── icon-512.png      ← ícono splash screen
```

Y en `index.html`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#001B52">
```

### Optimización para Hardware Venezolano

- **Lazy loading de rutas** con `React.lazy()` + `Suspense` — cargar solo la página actual
- **Compresión gzip/brotli** en el backend (middleware `compression`)
- **Image optimization** — servir WebP en vez de JPG
- **API pagination** — ya existe ✅ pero verificar que limits sean bajos (10 items default en vez de 20)
- **Debounce en búsquedas** — ya debería estar, verificar
- **Cache de datos** con Zustand persist — los datos del dashboard no cambian cada segundo

---

## 6. 🏗️ INFRAESTRUCTURA / DEPLOY — Producción Gratuita

### Opciones 100% Gratuitas

| Servicio | Tier Gratis | Para qué |
|----------|-------------|----------|
| **Render** | 750 hrs/mes web service + PostgreSQL (90 días) | Backend + DB |
| **Railway** | $5 crédito/mes (suficiente para demo) | Backend + DB |
| **Supabase** | PostgreSQL gratis, 500MB | Solo DB |
| **Vercel** | Hosting estático ilimitado | Frontend |
| **Cloudflare Pages** | Hosting estático ilimitado, CDN global | Frontend |
| **Neon** | PostgreSQL serverless, 0.5GB gratis | Solo DB |

### Arquitectura Recomendada para Producción

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Vercel      │────▶│  Render/Railway   │────▶│  Neon/Supabase │
│  Frontend    │     │  Backend (Express)│     │  PostgreSQL    │
│  (CDN global)│     │  API REST         │     │  (serverless)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

### Lo que Falta para Deploy

1. **`vite.config.js`** — agregar `base: '/'` para producción
2. **Variables de entorno** — `VITE_API_URL` para apuntar al backend de producción
3. **Build optimizado** — `npm run build` genera `dist/` que se sube a Vercel
4. **Helmet.js** — headers de seguridad HTTP en Express (falta)
5. **Compression middleware** — gzip responses
6. **Health check mejorado** — incluir check de DB connectivity
7. **Logging estructurado** — reemplazar `console.error` con algo como `pino` (producción necesita logs parseables)
8. **Error reporting** — Sentry free tier (10K events/mes)

### Para el Video / Demo

Si no hay internet en la universidad:
1. **Grabar video** en casa con la app corriendo en producción (URL real)
2. **Demo local** como backup: laptop con PostgreSQL local + backend + frontend
3. **Ngrok** como plan C: expone tu localhost al mundo con una URL pública temporal (gratis)

---

## 7. 💰 MODELO DE NEGOCIO — Venezuela

### Suscripción para Centros Comerciales

| Plan | Precio Sugerido | Incluye |
|------|----------------|---------|
| **Básico** | $15-25/mes | 1 CC, 3 usuarios admin, reportes básicos |
| **Pro** | $40-60/mes | 1 CC, usuarios ilimitados, reportes avanzados, push notifications |
| **Enterprise** | $100+/mes | Multi-CC, API custom, soporte prioritario |

### Lo que Falta para Multi-tenant (Vendible)

> [!WARNING]
> Actualmente el sistema es **single-tenant** — una sola instancia = un solo centro comercial. Para vender a múltiples clientes necesitás:

1. **Modelo `Tenant`/`Organization`** en la DB con `tenantId` en CADA tabla
2. **Row-Level Security** o filtro por tenant en cada query
3. **Subdominio por tenant**: `micc.sentinelcore.com`
4. **Billing/Payment** — Stripe o MercadoPago para cobrar suscripciones

**PERO** — esto es una FASE 2. Para el semestre y la presentación, el single-tenant está perfecto. Lo importante es que funcione IMPECABLE para UN centro comercial.

### Monetización sin Infra Propia

- **Marketplace**: Play Store (app paga o freemium)
- **Landing page**: sentinelcore.com con info + formulario de contacto
- **WhatsApp Business**: canal de ventas directo (gratis, Venezuela funciona bien)

---

## 8. 🏛️ ARQUITECTURA — Observaciones

### ✅ Lo que está bien
- Separación Controller → Service → Prisma ✅
- Schemas de validación con Zod ✅
- State machine para transiciones de ticket ✅
- Auto-asignación por carga de trabajo ✅
- Audit log completo ✅
- Notificaciones in-app ✅
- Backup con pg_dump ✅
- Zustand para estado global (ligero) ✅
- Framer Motion para animaciones ✅

### 🟡 Lo que necesita mejora

| Área | Problema | Fix |
|------|----------|-----|
| **Error handling frontend** | `catch (err) { console.error(err) }` — el usuario no ve nada | Toast con `notifications.error()` en CADA catch |
| **Frontend sin TypeScript** | Todo el frontend es `.jsx` — sin tipos | Migrar a `.tsx` gradualmente (empezar por API client y stores) |
| **API responses inconsistentes** | Algunos endpoints devuelven `{ data, pagination }`, otros devuelven el objeto directo | Estandarizar: `{ data, meta?, error? }` |
| **Sin API versioning** | Las rutas son `/api/tickets` sin versión | Cambiar a `/api/v1/tickets` |
| **Sin compression** | Responses sin gzip | `npm i compression` + `app.use(compression())` |
| **Sin Helmet** | Sin headers de seguridad HTTP | `npm i helmet` + `app.use(helmet())` |
| **Logs** | Solo `console.error` | Usar `pino` o al menos `winston` |
| **Tests insuficientes** | 31 backend + 33 frontend, pero sin integration tests reales | Agregar tests E2E mínimos con supertest |
| **Notification polling** | El frontend hace polling para notificaciones, no hay WebSocket/SSE | Server-Sent Events (SSE) es más eficiente y fácil |
| **Date filter en Reports** | `dateRange` se setea pero NUNCA se pasa al API | Agregar query params `?from=...&to=...` al endpoint de métricas |

---

## 🎯 Plan de Acción Priorizado

### Fase 1 — Crítico (Seguridad + Reportes) — ~3-4 días

1. ☐ Rotar JWT secret, verificar `.gitignore` excluye `.env`
2. ☐ Agregar Helmet.js + compression
3. ☐ Fix path traversal en backup service
4. ☐ Sanitizar comentarios
5. ☐ Fix filtro de fechas en reportes (conectar al backend)
6. ☐ Generar PDFs profesionales con pdfmake (portada, logo, tablas, pie)
7. ☐ Mejorar Excel: headers con logo, formatos, bordes, colores
8. ☐ Reemplazar datos random del gráfico de tendencia por datos reales
9. ☐ Agregar reporte por técnico

### Fase 2 — Visual/UX — ~2-3 días

10. ☐ Sidebar con fondo azul oscuro (`--color-primary-900`)
11. ☐ Colores semánticos para estados de tickets
12. ☐ Aumentar tamaños de fuente mínimos (12px+)
13. ☐ Empty states diseñados
14. ☐ Skeleton loading consistente en todas las páginas
15. ☐ Favicon y PWA manifest
16. ☐ Logo en SVG/PNG con transparencia

### Fase 3 — Producción — ~2 días

17. ☐ Deploy backend en Render/Railway
18. ☐ Deploy frontend en Vercel/Cloudflare Pages
19. ☐ DB en Neon/Supabase
20. ☐ Variables de entorno de producción
21. ☐ SSL/HTTPS verificado
22. ☐ Health check endpoint con DB ping

### Fase 4 — Push Notifications + PWA — ~2 días

23. ☐ Service Worker + manifest.json (PWA instalable)
24. ☐ Web Push con VAPID keys
25. ☐ Integrar push con el notification service existente

### Fase 5 — Futuro (Post-semestre)

26. ☐ React Native con Expo (app nativa Play Store)
27. ☐ Multi-tenant
28. ☐ Stripe/MercadoPago integration
29. ☐ Landing page

---

## Open Questions

> [!IMPORTANT]
> **Necesito que me confirmes antes de arrancar:**
>
> 1. **¿Tenés el logo del centro comercial en formato PNG/SVG?** Lo necesito para los reportes PDF y el branding del sidebar
> 2. **¿Cuál es el nombre real del centro comercial?** Para los reportes y el branding (o usamos "SentinelCore" genérico?)
> 3. **¿Querés arrancar por las fases en orden, o hay algo que te urge más?**
> 4. **¿El video de presentación lo grabás vos o necesitás ayuda con el script/guión?**
> 5. **¿Tenés cuenta en Render/Vercel/Railway o las creamos desde cero?**
