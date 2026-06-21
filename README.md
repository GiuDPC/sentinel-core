# Sentinel Core - Sistema de Gestión de Tickets para Centro Comercial

<div align="center">

![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.0.4-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-4.2.2-38BDF8?style=flat-square&logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7.7.0-2D3748?style=flat-square)
![Vitest](https://img.shields.io/badge/Vitest-4.1.5-6AD05F?style=flat-square)

</div>

## Descripción del Proyecto

Sentinel Core es una **plataforma web centralizada de gestión de tickets y monitoreo de SLA** diseñada específicamente para centros comerciales. El sistema permite optimizar la transparencia y el control operativo mediante el registro digital de incidencias, asignación inteligente de técnicos, seguimiento de acuerdos de nivel de servicio (SLA) y trazabilidad completa de todas las acciones realizadas.

### Problema que Resuelve

Los centros comerciales enfrentan desafíos operativos derivados de la comunicación verbal e informal:

- **Falta de trazabilidad**: Los reportes de fallas se realizan de manera verbal, sin registro formal ni evidencia documental
- **Sin indicadores de rendimiento**: No hay forma de medir tiempos de respuesta ni resolución para evaluar la eficiencia operativa
- **Asignación opaca**: Los técnicos reciben tareas sin visibilidad de su carga de trabajo actual
- **Incidentes duplicados**: No existe verificación de tickets previos similares, generando dispersión de esfuerzos
- **Sin auditoría**: Imposible demostrar qué acciones se tomaron, cuándo y por quién ante situaciones críticas

### Objetivos del Sistema

1. **Diagnosticar** los procesos actuales de reporte y atención de fallas para identificar vulnerabilidades
2. **Diseñar** la arquitectura del sistema y el modelado de base de datos relacional
3. **Prototipar** interfaces intuitivas para registro de tickets y visualización de alertas
4. **Automatizar** el flujo de trabajo de incidencias con persistencia de datos
5. **Evaluar** mediante pruebas de usuario y estrés de datos

---

## Tecnologías Componentes

### Frontend

| Tecnología    | Versión  | Descripción                        |
| ------------- | -------- | ---------------------------------- |
| React         | 19.2.4   | Biblioteca UI construir interfaces |
| Vite          | 8.0.4    | Build tool y dev server            |
| Tailwind CSS  | 4.2.2    | Framework CSS utility-first        |
| Framer Motion | 12.38.0  | Animaciones y micro-interacciones  |
| React Router  | 7.14.1   | Enrutamiento SPA                   |
| Recharts      | -        | Gráficos y visualizaciones         |
| Lucide React  | -        | Iconos SVG                         |
| SweetAlert2   | 11.26.24 | Modales y notificaciones           |
| Sonner        | 2.0.7    | Notificaciones toast               |
| XLSX          | 0.18.5   | Exportación a Excel                |
| Vitest        | 4.1.5    | Testing unitario                   |
| JSdom         | 29.0.2   | DOM para testing                   |

### Backend

| Tecnología | Versión | Descripción              |
| ---------- | ------- | ------------------------ |
| Express    | 5.2.1   | Framework webNode.js     |
| TypeScript | 6.0.2   | Tipado estático          |
| Prisma     | 7.7.0   | ORM PostgreSQL           |
| PostgreSQL | 15+     | Base de datos relacional |
| Zod        | 4.3.6   | Validación de esquemas   |
| Argon2     | 0.44.0  | Hashing de contraseñas   |
| JWT        | 9.0.3   | Autenticación tokens     |
| Swagger UI | 5.0.1   | Documentación API        |
| Vitest     | 4.1.4   | Testing                  |

---

## Arquitectura del Sistema

```
sentinel-core/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── api/            # Cliente API REST
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── auth/       # Autenticación
│   │   │   ├── common/     # Componentes comunes
│   │   │   ├── dashboard/ # Dashboard KPIs
│   │   │   ├── layout/    # Layout principal
│   │   │   └── ui/        # Componentes UI
│   │   ├── contexts/      # React Context
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Vistas por rol
│   │   │   ├── admin/    # Panel Admin
│   │   │   ├── requester/# Panel Usuario
│   │   │   └── technician/# Panel Técnico
│   │   ├── routes/       # Definición rutas
│   │   ├── store/       # Estado global
│   │   ├── test/        # Tests componentes
│   │   └── api/        # Mocks API
│   ├── public/           # Assets estáticos
│   └── package.json
│
├── backend/                  # API REST
│   ├── prisma/
│   │   ├── migrations/  # Migraciones DB
│   └── seed.ts       # Datos iniciales
│   ├── src/
│   │   ├── __tests__/  # Tests unitarios
│   │   ├── middlewares/# Middlewares Express
│   │   ├── routes/    # Endpoints API
│   │   ├── schemas/   # Zod esquemas
│   │   ├── services/  # Lógica negocio
│   │   ├── types/    # Tipos TypeScript
│   │   └── utils/    # Utilidades
│   └── package.json
│
└── README.md
```

---

## Modelo de Base de Datos

### Entidades Principales

```
┌─────────────────┐     ┌─────────────────┐
│      User       │     │    Category     │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ email           │     │ name            │
│ password        │     │ description     │
│ firstName       │────<│ departmentId    │
│ lastName        │     │ priority        │
│ phone           │     │ slaHours        │
│ role            │     │ active          │
│ departmentId    │     └─────────────────┘
│ active          │               │
│ createdAt       │               │
│ updatedAt       │               │
└─────────────────┘               │
        │                         │
        │ 1:N                     │
        ▼                         ▼
┌─────────────────┐     ┌─────────────────┐
│   Assignment    │     │   Department    │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ ticketId        │     │ name            │
│ technicianId    │     │ description     │
│ assignedAt      │     │ active          │
│ unassignedAt    │     └─────────────────┘
│ active          │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐     ┌─────────────────┐
│     Ticket      │     │    Comment      │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ ticketCode      │────>│ ticketId        │
│ title           │     │ userId          │
│ description     │     │ content         │
│ location        │     │ isInternal      │
│ status          │     │ createdAt       │
│ priority        │     └─────────────────┘
│ dueDate         │
│ creatorId       │     ┌─────────────────┐
│ categoryId      │     │   AuditLog
│ slaBreached     │     ├─────────────────┤
│ resolutionNote  │     │ id              │
│ timeSpentMinutes│     │ ticketId        │
│ materialsUsed   │     │ userId          │
│ resolvedAt      │     │ action          │
│ ratingComment   │     │ oldValue        │
│ rating          │     │ newValue        │
│ createdAt       │     │ createdAt       │
│ updatedAt       │     └─────────────────┘
└─────────────────┘     
```

#### Estados del Ticket

```
┌──────────────┐
│     OPEN     │──── Nuevo ticket creado
└──────┬───────┘
       │ Asignado a técnico
       ▼
┌──────────────┐
│   ASSIGNED   │──── Ticket asignado
└──────┬───────┘
       │ Inicia trabajo
       ▼
┌──────────────┐
│ IN_PROGRESS  │──── Trabajando activamente
└──────┬───────┘
       │ En espera repuesto
       ▼
┌──────────────┐
│  ON_HOLD     │──── Esperando repuesto
└──────┬───────┘
       │ Listo para confirmar
       ▼
┌──────────────┐
│   AWAITING_  │──── Esperando confirmación
│ CONFIRMATION │──── del solicitante
└──────┬───────┘
       │ Confirmado
       ▼
┌──────────────┐
│  RESOLVED    │──── Completado
└──────┬───────┘
       │ Cerrado definit
       ▼
┌──────────────┐
│   CLOSED     │──── Finalizado
└──────────────┘
```

### Roles de Usuario

| Rol        | Descripción   | Permisos                                                        |
| ---------- | ------------- | --------------------------------------------------------------- |
| ADMIN      | Administrador | Gestionar usuarios,ver todos tickets,asignar técnicoss,reportes |
| TECHNICIAN | Técnico       | Ver tickets asignados,actualizar estado,resolver                |
| REQUESTER  | Solicitante   | Crear tickets,ver mis tickets,confirmar resolución              |

---

## SLA - Acuerdos de Nivel de Servicio

El sistema calcula automáticamente el tiempo de vencimiento basado en:

```
prioridad → slaHours
CRITICAL → 4 horas
HIGH     → 8 horas
MEDIUM   → 24 horas
LOW      → 72 horas
```

### Estados SLA

- **Normal**: Tiempo restante > 2 horas
- **At Risk**: Tiempo restante < 2 horas
- **Breached**: Tiempo vencido

---

## Características Principales

### Panel de Administración

- KPIs en tiempo real (tickets totales,abiertos,vencidos,SLA)
- Distribución por categoría y estado
- Listado filtrable de todos los tickets
- Asignación inteligente de técnicos (menor carga)
- Reasignación de tickets
- Reportes exportables a Excel
- Auditoría completa de acciones

### Panel de Solicitante

- Crear tickets con categoría y prioridad
- Seguimiento de mis tickets
- Confirmar resolución con calificación
- Comentarios y comunicaciones

### Panel de Técnico

- Tickets asignados con filtros
- Actualización de estado
- Notas de resolución
- Carga de trabajo visible

### Funcionalidades Globales

- Generación automática de códigos de ticket
- Cálculo automático de vencimiento SLA
- Notificaciones en tiempo real
- Trail de auditoría completo
- Validación de esquemas con Zod
- Documentación Swagger

---

## Instalación y Configuración

### Prerrequisitos

- Node.js 20+
- PostgreSQL 15+

### Pasos

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/sentinel-core.git
cd sentinel-core
```

2. **Configurar base de datos**

```bash
# Crear base de datos PostgreSQL
createdb sentinel_core

# Configurar variables de entorno
cp backend/.env.example backend/.env
# Editar .env con credenciales
```

3. **Instalar dependencias**

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

4. **Ejecutar migraciones**

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **Iniciar desarrollo**

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## Scripts Disponibles

### Frontend

```bash
npm run dev      # Iniciar desarrollo
npm run build   # Production build
npm run preview # Preview build
npm run lint   # Linting
npm run test   # Tests unitarios
```

### Backend

```bash
npm run dev         # Desarrollo con watch
npm run build     # Compilar TypeScript
npm run start      # Production
npm run test       # Tests
npm run test:watch # Tests watch mode
```

---

## Documentación API

Accede a `/api/docs` cuando el backend esté运行ando para ver Swagger UI.

---

## Testing

### Cobertura Actual

- **Frontend**: 33 tests passing
- **Backend**: 31 tests passing

### Ejecutar Tests

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test
```

---

## Guía de Despliegue en Producción (Tesis UNEFA)

Para mantener tu entorno local intacto y tener una copia del proyecto en la nube accesible para el jurado, se recomienda la siguiente arquitectura moderna y gratuita:

### 1. Base de Datos (PostgreSQL en la Nube)
- **Proveedor Recomendado**: [Neon.tech](https://neon.tech/) o [Supabase](https://supabase.com/).
- **Ventaja**: Son gratuitos, muy rápidos y te dan un `DATABASE_URL` listo para usar en tu `.env`.

### 2. Backend (Node.js API)
- **Proveedor Recomendado**: [Render](https://render.com/) o [Railway](https://railway.app/).
- **Cómo hacerlo**: 
  1. Conecta tu repositorio de GitHub.
  2. Selecciona la carpeta `backend`.
  3. Comando de Build: `npm install && npm run build`
  4. Comando de Inicio: `npm start`
  5. Variables de entorno: Pega el `DATABASE_URL` de Neon/Supabase y tu `JWT_SECRET`.

### 3. Frontend (React / Vite)
- **Proveedor Recomendado**: [Vercel](https://vercel.com/) o [Netlify](https://www.netlify.com/).
- **Cómo hacerlo**:
  1. Conecta tu repositorio.
  2. Selecciona la carpeta `frontend`.
  3. Build command: `npm run build`
  4. Output directory: `dist`
  5. Variables de entorno: `VITE_API_URL` apuntando a la URL que te generó Render en el paso anterior.

---

## Credenciales de Acceso para el Jurado Evaluador

Al ejecutar `npx prisma db seed` en producción, se crearán estas cuentas de prueba:

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Admin Principal | `admin@sentinel.local` | `SentinelAdmin2026!` |
| Profesor Admin | `profesor.admin@sentinel.local` | `SentinelAdmin2026!` |
| Profesor Locatario | `profesor.locatario@sentinel.local` | `Locatario2026!` |
| Técnico Prueba | `carlos.perez@sentinel.local` | `Tecnico2026!` |

---

## Contribución

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature:Nombre`)
3. commit cambios (`git commit -m 'Add feature'`)
4. push a rama (`git push origin feature:Nombre`)
5. Crear Pull Request

---

## Licencia

MIT License - Ver [LICENSE.md](LICENSE.md)

---

## Autores

- [@GiuDPC](https://github.com/GiuDPC)
- [@Gabrielart2005](https://github.com/Gabrielart2005)

Proyecto desarrollado en 2026 para el Centro Comercial Sambil Paraguaná.
