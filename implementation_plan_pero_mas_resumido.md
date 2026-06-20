# 🛠️ Plan de Mejoras Inmediatas (Desarrollo Local) — SentinelCore

Este plan contiene EXCLUSIVAMENTE las correcciones y mejoras técnicas a nivel de código que podemos aplicar **ahora mismo** en tu entorno local para dejar la aplicación robusta, segura y lista para tu presentación, sin tocar aún nada de despliegue ni producción.

---

## 1. 🔴 Seguridad Inmediata

Aún en local, es una mala práctica dejar brechas. Debemos corregir:

- **JWT Secret**: Sacar el secret hardcodeado y asegurarnos de que `.env` esté en el `.gitignore`.
- **Sanitización de Comentarios**: Aplicar en el `comment.service.ts` el mismo `sanitizeString` que ya creaste, para prevenir XSS.
- **Path Traversal en Backups**: En `backup.service.ts`, validar que el `filename` no contenga `..` ni rutas absolutas para evitar que borren archivos del sistema.
- **Registro Público**: Limitar o restringir `register-public` (agregarle un middleware de rate limit más estricto).

## 2. 📊 Reportes (PDF y Excel)

Esto es lo que más le interesa al profesor y a los clientes para facturar:

- **PDF de Gestión y Facturación:** 
  - Vamos a instalar `pdfmake` en el backend. Es gratuito, puro JavaScript, y genera PDFs profesionales sin problemas en PCs de bajos recursos.
  - Endpoint `GET /api/metrics/reports/pdf`.
  - El PDF incluirá: Nombre del CC (podemos poner un header quemado por ahora), Resumen de tickets, Gráficos (usando tablas o barras dibujadas), e historial de SLA.
- **Mejora del Excel:**
  - El actual es data cruda. Le agregaremos: Título "Reporte de Gestión SentinelCore", celdas de encabezado en color primario con texto en negrita, anchos automáticos y cálculos de horas en la última columna.
- **Filtro de Fechas Real:**
  - Conectar el `dateRange` del frontend con el `metrics.service.ts` para que filtre por Hoy, Semana, o Mes.
- **Datos Reales en Gráficos:**
  - Quitar el `Math.random()` en `Reports.jsx` y construir un endpoint que agrupe tickets por día de la semana para que la tendencia sea de datos verídicos de la base de datos.

## 3. 🎨 UX y Diseño (Mejora Visual)

Necesitamos que no "cueste ver las cosas" y que no todo sea gris.

- **Sidebar con Identidad:** Cambiar el fondo del sidebar a tu `--color-primary-900` (azul oscuro) con texto en blanco. Inmediatamente le dará carácter corporativo y mejorará el contraste.
- **Color Semántico:** Reemplazar las barritas de progreso y etiquetas grises por:
  - Abierto: Azul (`bg-blue-500`)
  - En Progreso: Naranja/Amarillo (`bg-amber-500`)
  - Resuelto/Cerrado: Verde (`bg-emerald-500`)
  - Vencido: Rojo (`bg-rose-500`)
- **Tipografías más legibles:** Quitar las clases `text-[10px]` en tarjetas y tablas. El tamaño mínimo debe ser `text-xs` (12px) o `text-sm` (14px).
- **Empty States (Estados Vacíos):** Crear componentes agradables con un icono de Lucide cuando no hay tickets o no hay notificaciones, en lugar de dejar el cuadro en blanco.

## 4. 📱 Convertir la Web en una PWA (App Móvil sin código extra)

Para que se vea y funcione como una app móvil (para tu presentación y portafolio), agregaremos en el Frontend:

- `manifest.json` en la carpeta `public/` con colores, nombre y logo.
- Iconos (PNGs) para la pantalla de inicio del celular.
- Registro básico del Service Worker.
- *Esto permitirá que desde Google Chrome (en PC o Android) te aparezca el botón "Instalar App".*

---

## 🎯 Plan de Acción (Lo que haré en código)

1. **Fase 1: Reportes.** Instalar `pdfmake`, crear generador de PDF, arreglar las fechas en las métricas y mejorar la estética del Excel.
2. **Fase 2: Estilos y UX.** Aplicar paleta de colores oscuros al Sidebar, agrandar textos, e inyectar colores de estado (semánticos) en los KPIs y Tablas.
3. **Fase 3: Seguridad.** Cierre de brechas locales (Backups y Sanitización).
4. **Fase 4: App Web Progresiva.** Agregar manifiesto e iconos para que actúe como App.

> [!NOTE]
> Si estás de acuerdo, decime por dónde empezamos. **Mi recomendación es arrancar directamente por mejorar los reportes (PDF y Excel)**, ya que es lo que le da "valor de negocio" real inmediato a los ojos del profesor.
