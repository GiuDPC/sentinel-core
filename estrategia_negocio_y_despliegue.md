# 🚀 Estrategia de Producción, Negocio y App Móvil — SentinelCore

Este documento detalla cómo llevar SentinelCore de un proyecto universitario a un producto comercial SaaS (Software as a Service) en Venezuela, manteniendo el control total de tu base de datos y preparando una presentación blindada contra fallos de internet.

---

## 1. 🗄️ Infraestructura en la Nube (Opciones 100% Gratuitas)

Para tener el sistema en vivo 24/7 y que tus clientes puedan usarlo sin que tengas tu PC encendida, necesitás separar el sistema en tres partes. Acá tenés todas las opciones, tanto "Serverless" (gestionadas) como servidores propios "Puros".

### A. Opciones Serverless (Las más rápidas y modernas)
- **Neon.tech:** Es PostgreSQL "Serverless". Te da 0.5 GB gratis, escala automático, separa cómputo y almacenamiento, y no te cobra si nadie lo usa. Ideal para conectar con Vercel.
- **Supabase:** Te da PostgreSQL completo (500MB) y te incluye Storage (para guardar archivos o imágenes en el futuro). Responden rapidísimo gracias a su connection pooling.

### B. Opciones "Puras" (Tu propia Base de Datos clásica)
Si prefieres no depender de plataformas serverless y tener tu motor PostgreSQL tradicional (como el de tu máquina local):
- **Fly.io:** Te regala hasta 3 "máquinas virtuales" pequeñas. Podés instalar un contenedor Docker con PostgreSQL puro y asociarle un volumen de almacenamiento (hasta 3GB gratis). Es TU base de datos, nadie la borra a los 90 días.
- **Railway.app:** Te permite crear un servicio de PostgreSQL con 1 clic. Te dan tu propio usuario, contraseña y host. Te dan $5 en créditos mensuales (suficiente para arrancar, pero si se agotan, el servicio se pausa).

### C. Opción "Home Server" (Costo Cero Real)
- Si tenés una laptop vieja en tu casa conectada a internet, dejás corriendo PostgreSQL ahí. Usás un servicio como **Cloudflare Tunnels** o **Ngrok** para exponer el puerto 5432 de tu casa a internet de forma segura. Sin límites de almacenamiento, 100% tuya.

### D. Frontend y Backend
- **Frontend (React):** Vercel o Cloudflare Pages. Gratis, ilimitado y extremadamente rápido por usar CDN global.
- **Backend (Express):** Render.com (gratis pero se "duerme" tras 15 min de inactividad) o Railway (usando los $5 de crédito).

---

## 2. 🏢 Arquitectura Escalable: De Sambil a Múltiples Centros Comerciales

Para que tu sistema pueda venderse a **muchos centros comerciales al mismo tiempo** (Sambil, Tolón, Paseo El Hatillo, etc.) sin tener que crear un servidor nuevo para cada uno, debés convertir SentinelCore en una plataforma **Multi-Tenant (Multi-Inquilino)**.

### ¿Cómo funciona a nivel técnico?
No vas a copiar y pegar el código. Con **un solo código** y **una sola base de datos** vas a manejar a todos.

1. **El Modelo Tenant:** En tu `schema.prisma`, crearás una tabla `Tenant` (Ej: ID: 1 = Sambil, ID: 2 = Tolón).
2. **Aislamiento de Datos:** A TODAS tus tablas actuales (`Ticket`, `User`, `Category`, `AuditLog`) le agregarás un campo obligatorio llamado `tenantId`.
3. **Seguridad Absoluta (Middlewares):** En tu backend de Express, crearás un middleware que detecte de qué centro comercial viene la petición. Cuando el backend haga una consulta a la base de datos, SIEMPRE agregará `where: { tenantId: req.tenantId }`. Así es **imposible** que un técnico del Sambil vea los tickets del Tolón.

### ¿Cómo funciona para el usuario (Subdominios)?
- Comprás un dominio principal: `sentinelcore.com`.
- A cada cliente le das un subdominio: `sambil.sentinelcore.com` y `tolon.sentinelcore.com`.
- El Frontend (React) lee la URL en el navegador. Si dice "sambil", carga el logo del Sambil, los colores del Sambil, y le dice al backend: "Traéme la data del Tenant 1".

### Ventaja Brutal de este Modelo:
Si tenés 10 clientes pagándote $50 mensuales, estás ganando **$500 al mes**. Pero como todos usan la misma base de datos y el mismo servidor, tú sigues pagando apenas **$10 o $15 al mes en costos de servidor**. El margen de ganancia es inmenso.

---

## 3. 💰 Modelo de Venta y Suscripciones (SaaS en Venezuela)

Venderle a un Centro Comercial en Venezuela es **B2B (Business to Business)**. Le vendés a la **Junta de Condominio** o a la **Administradora**. Su dolor principal es que los locatarios exigen ver en qué se gasta el condominio, y SentinelCore les da esa prueba.

### Análisis de los Planes de Suscripción

Para que sea atractivo y accesible, debes estructurar el precio en base al tamaño del CC y la cantidad de funciones que necesitan. 

#### 1. Plan Esencial (Para Minimalls o CCs pequeños)
- **Setup Inicial:** $100 (Un solo pago por configurarle el sistema y capacitar al personal).
- **Mensualidad:** $30 / mes.
- **Incluye:**
  - Límite de 5 Técnicos y 2 Administradores (Locatarios ilimitados).
  - Gestión básica de tickets.
  - Reportes en Excel.
  - Soporte por email (respuesta en 48h).
- **Por qué este costo:** $30 es lo que cuesta una salida a comer. Para un condominio que recauda miles de dólares, $30 es un gasto "invisible". La limitación de técnicos es lo que los obliga a subir de plan si crecen.

#### 2. Plan Profesional (Para CCs medianos como Tolón o San Ignacio)
- **Setup Inicial:** $200.
- **Mensualidad:** $60 / mes.
- **Incluye:**
  - Técnicos y Administradores ilimitados.
  - Generación de Reportes Ejecutivos en **PDF** con el logo del CC.
  - Panel de Auditoría completo (saber quién cambió qué y a qué hora).
  - Soporte prioritario por WhatsApp (respuesta en 2h).
- **Por qué este costo:** Este es el plan que vas a impulsar. Las empresas quieren PDFs formales para justificar gastos en sus juntas. Cobras por el "Valor Institucional".

#### 3. Plan Enterprise (Para gigantes como Sambil o cadenas)
- **Setup Inicial:** $500+.
- **Mensualidad:** $150+ / mes.
- **Incluye:**
  - Todo lo anterior.
  - Módulo de Facturación: El sistema calcula automáticamente el costo de las horas del técnico y repuestos, y genera la orden de cobro para el locatario.
  - Push Notifications a los celulares.
  - Base de datos aislada (Mayor seguridad corporativa).

### ¿Cómo se maneja esto a Nivel Técnico? (Feature Flags)

Para que un cliente del Plan Esencial no use las funciones del Plan Profesional, **NO** haces código diferente. Todo está en la misma base de datos.

1. En tu tabla `Tenant` (Cliente), agregas campos booleanos:
   - `canExportPdf` (Boolean)
   - `hasAuditLog` (Boolean)
   - `maxTechnicians` (Int)
2. **Middleware en el Backend:** Cuando alguien de un CC en Plan Esencial intente hacer `GET /api/reports/pdf`, tu backend revisa su tabla `Tenant`. Como `canExportPdf` es `false`, le respondes con un `403 Forbidden: "Tu plan actual no incluye reportes en PDF. Contacta a ventas para hacer un upgrade."`
3. **Frontend Condicional:** En React, cuando cargues el perfil del usuario, cargas también los límites de su plan. Si no tiene el plan profesional, el botón de "Descargar PDF" aparece bloqueado con un candadito dorado 🔒. Esto genera "Fricción de Venta": el cliente ve el botón, lo quiere usar, y te llama para pagar más.

### Cómo cobrar (Métodos de pago)
En Venezuela, apuntá a que la administradora te pague mensual (prepago) vía:
- Zelle / PipolPay / Zinli / Wally.
- Binance Pay (USDT).
- Pago Móvil / Transferencia en Bs. al paralelo (fijando el contrato en USD). Si no pagan el día 5 del mes, un script automático cambia el estado de su `Tenant` a `suspendido` y nadie puede iniciar sesión.

---

## 4. 🎓 La Presentación (Universidad) — Plan de Contingencia

Sabemos que el internet y las computadoras de la universidad pueden fallar en el peor momento. Vas a preparar 3 escenarios para que tu presentación sea de **20 puntos sí o sí**.

### Plan A: La Demo en Vivo (Si hay buen internet)
**El efecto "Wow":** Tenés la app subida en Vercel y tu backend en la nube.
1. Le pedís al profesor o a un compañero que escanee un **Código QR** que pongas en la diapositiva.
2. Desde sus teléfonos, ellos entran a la app (PWA) como "Locatarios" y crean un ticket en vivo ("El baño del piso 1 está inundado").
3. Todos ven en la pantalla principal del proyector cómo tu "Panel de Administrador" recibe el ticket en tiempo real y suena la notificación.
4. Vos lo asignás a un técnico, cerrás el ticket, y ellos ven en su celular que se resolvió.

### Plan B: Demo en Red Local (Si hay WiFi pero no hay internet externo)
Llevás un router de tu casa (solo el router, sin internet).
1. Conectás tu laptop y el celular del profesor al router.
2. En tu laptop levantás el servidor y el frontend en modo local.
3. Pasás la IP local de tu máquina (ej: `http://192.168.1.5:5173`) y hacen exactamente la misma prueba del Plan A, pero todo corriendo en tu computadora sin salir a internet.

### Plan C: El Video (Si TODO falla)
El "Seguro de vida". Vas a grabar la pantalla de tu computadora en tu casa usando OBS Studio (o Windows Game Bar).
- El video no debe durar más de 3-4 minutos.
- **Estructura del video:**
  1. *El Problema (15s)*: Mostrar rápido el desorden de reportes por WhatsApp.
  2. *La Solución (45s)*: Mostrar la pantalla de creación de ticket con un diseño limpio.
  3. *El Valor (60s)*: Mostrar el Dashboard Administrativo y generar un reporte en PDF y Excel para demostrar cómo el CC puede justificar cobros.
  4. *Resolución (30s)*: Muestra cómo el técnico resuelve el ticket y el sistema cierra el ciclo.
- Si el profesor te dice "muéstramelo funcionando", le decís: *"Para optimizar tiempo, grabé este video del flujo principal, pero la app la tengo aquí abierta lista para probar en vivo si gusta"*.

---

## 5. 📱 App Móvil 

Como mencionamos antes, la mejor opción para la presentación y para arrancar el negocio es convertir tu React actual en una **PWA (Progressive Web App)**. 

- El cliente (el locatario) la usa abriendo Chrome en el celular y poniéndole "Agregar a la pantalla de inicio".
- El ícono aparece en su teléfono igual que WhatsApp o Instagram.
- La experiencia es idéntica a una app, pero te ahorraste meses de desarrollo en Java/Kotlin o React Native.
- Es perfecto para los celulares gama baja/media de Venezuela porque no ocupa casi espacio en la memoria.
- *Nota: Si a futuro un cliente Premium exige estar en la Play Store, podés usar React Native con Expo, reutilizando toda la API que ya creaste.*
