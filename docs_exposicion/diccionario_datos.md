# Diccionario de Datos — Sistema SentinelCore

**Motor de Base de Datos:** PostgreSQL  
**ORM utilizado:** Prisma  
**Versión del esquema:** 1.0  
**Fecha:** Junio 2026  

---

## Introducción

Este documento especifica la estructura física de la base de datos del sistema **SentinelCore**, un sistema de gestión de tickets de mantenimiento para centros comerciales. Se detallan las tablas, atributos, tipos de datos, restricciones de integridad, valores por defecto y las relaciones entre entidades.

---

## Enumeraciones (Tipos Enum)

Los siguientes son los tipos de datos enumerados definidos en el esquema:

| Nombre | Valores posibles | Descripción |
| :--- | :--- | :--- |
| `TicketStatus` | OPEN, ASSIGNED, IN_PROGRESS, ON_HOLD, RESOLVED, AWAITING_CONFIRMATION, CLOSED | Estados del ciclo de vida de un ticket. |
| `TicketPriority` | LOW, MEDIUM, HIGH, CRITICAL | Niveles de urgencia de un ticket. |
| `Department` | MANTENIMIENTO_ELECTRICO, PLOMERIA, SEGURIDAD, INFRAESTRUCTURA, REDES_Y_TELECOMUNICACIONES, ADMINISTRACION, OTROS | Departamentos de la organización. |

---

## Estructura de Tablas

---

### Tabla: `roles`

**Descripción:** Define los perfiles de acceso del sistema. Cada usuario pertenece exactamente a un rol.

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | No | — | Referenciado por `users.role_id` | Identificador único autogenerado del rol. |
| `name` | VARCHAR | UNIQUE, NOT NULL | No | — | — | Nombre del rol (ej. Administrador, Tecnico, Locatario). |
| `description` | TEXT | — | Si | NULL | — | Descripcion de los privilegios asociados al rol. |
| `created_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha y hora de creacion del registro. |
| `updated_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha y hora de la ultima modificacion. |

---

### Tabla: `users`

**Descripción:** Entidad central del sistema. Almacena a todos los actores: Locatarios, Técnicos y Administradores. La distinción entre tipos de usuario se realiza mediante el campo `role_id`, aplicando el patrón de Herencia de Tabla Única (Single Table Inheritance).

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | No | gen_random_uuid() | Referenciado por `tickets.creator_id`, `assignments.technician_id`, `comments.user_id`, `audit_logs.user_id`, `notifications.user_id` | Identificador único universal del usuario. |
| `role_id` | INTEGER | FOREIGN KEY, NOT NULL | No | — | `roles.id` | Rol asignado al usuario. |
| `first_name` | VARCHAR | NOT NULL | No | — | — | Nombre del usuario. |
| `last_name` | VARCHAR | NOT NULL | No | — | — | Apellido del usuario. |
| `email` | VARCHAR | UNIQUE, NOT NULL | No | — | — | Correo electrónico utilizado para el inicio de sesión. |
| `password_hash` | VARCHAR | NOT NULL | No | — | — | Contraseña almacenada con hash criptográfico (bcrypt). |
| `phone` | VARCHAR | — | Si | NULL | — | Número de teléfono de contacto (opcional). |
| `department` | ENUM (Department) | — | Si | NULL | — | Departamento al que pertenece. Aplica solo a Técnicos y Administradores. |
| `store_number` | VARCHAR | — | Si | NULL | — | Número del local comercial. Aplica solo a Locatarios. |
| `store_name` | VARCHAR | — | Si | NULL | — | Nombre del comercio. Aplica solo a Locatarios. |
| `is_active` | BOOLEAN | NOT NULL | No | TRUE | — | Indica si la cuenta está habilitada para ingresar al sistema. |
| `created_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha de registro en el sistema. |
| `updated_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha de la última modificación del perfil. |

---

### Tabla: `categories`

**Descripción:** Clasifica los tipos de incidentes que pueden reportarse. Cada categoría está asociada a un departamento responsable y un tiempo de resolución (SLA).

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | No | — | Referenciado por `tickets.category_id` | Identificador único autogenerado de la categoría. |
| `name` | VARCHAR | UNIQUE, NOT NULL | No | — | — | Nombre de la categoría (ej. Plomería, Electricidad). |
| `department` | ENUM (Department) | NOT NULL | No | OTROS | — | Departamento técnico responsable de atender esta categoría. |
| `sla_hours` | INTEGER | NOT NULL | No | — | — | Tiempo máximo de resolución en horas (Service Level Agreement). |
| `is_active` | BOOLEAN | NOT NULL | No | TRUE | — | Indica si la categoría está disponible para nuevos tickets. |
| `created_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha de creación. |
| `updated_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha de la última modificación. |

---

### Tabla: `tickets`

**Descripción:** Entidad principal del flujo de trabajo. Almacena cada reporte de incidente o solicitud creado por un Locatario.

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | No | gen_random_uuid() | Referenciado por `assignments.ticket_id`, `comments.ticket_id`, `audit_logs.ticket_id` | Identificador interno único del ticket. |
| `ticket_code` | VARCHAR | UNIQUE, NOT NULL | No | — | — | Código legible para el usuario (ej. TKT-0042). Generado automáticamente. |
| `creator_id` | UUID | FOREIGN KEY, NOT NULL | No | — | `users.id` | Usuario Locatario que abrió el reporte. |
| `category_id` | INTEGER | FOREIGN KEY, NOT NULL | No | — | `categories.id` | Categoría del problema reportado. |
| `title` | VARCHAR | NOT NULL | No | — | — | Título breve que resume el incidente. |
| `description` | TEXT | NOT NULL | No | — | — | Descripción detallada del problema, síntomas y contexto. |
| `location` | VARCHAR | NOT NULL | No | — | — | Ubicación física del incidente dentro del centro comercial. |
| `status` | ENUM (TicketStatus) | NOT NULL | No | OPEN | — | Estado actual dentro del ciclo de vida del ticket. |
| `priority` | ENUM (TicketPriority) | NOT NULL | No | — | — | Nivel de urgencia asignado al ticket. |
| `due_date` | TIMESTAMP | — | Si | NULL | — | Fecha límite de resolución calculada con base en el SLA de la categoría. |
| `resolution_note` | TEXT | — | Si | NULL | — | Nota técnica redactada por el técnico al cerrar el incidente. |
| `resolved_at` | TIMESTAMP | — | Si | NULL | — | Marca de tiempo exacta del momento de resolución. |
| `created_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha y hora de apertura del ticket. |
| `updated_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha de la última actualización del registro. |

---

### Tabla: `assignments`

**Descripción:** Tabla puente (Bridge Table) que resuelve la relación Muchos a Muchos entre Tickets y Técnicos. Un ticket puede tener varios técnicos asignados, y un técnico puede tener varios tickets a cargo.

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `ticket_id` | UUID | PRIMARY KEY (compuesta), FOREIGN KEY | No | — | `tickets.id` | Ticket que está siendo asignado. |
| `technician_id` | UUID | PRIMARY KEY (compuesta), FOREIGN KEY | No | — | `users.id` | Técnico responsable de atender el ticket. |
| `assigned_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha y hora exacta en que se realizó la asignación. |

---

### Tabla: `comments`

**Descripción:** Historial de mensajes relacionados a un ticket. Soporta comentarios públicos (visibles para el Locatario) y comentarios internos (visibles solo para el equipo técnico).

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | No | gen_random_uuid() | — | Identificador único del comentario. |
| `ticket_id` | UUID | FOREIGN KEY, NOT NULL | No | — | `tickets.id` | Ticket al que pertenece el comentario. |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | No | — | `users.id` | Usuario autor del comentario. |
| `content` | TEXT | NOT NULL | No | — | — | Cuerpo completo del mensaje. |
| `is_internal` | BOOLEAN | NOT NULL | No | FALSE | — | Si es TRUE, el comentario es visible solo para técnicos y administradores. |
| `created_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha y hora de publicación. |
| `updated_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha de última edición. |

---

### Tabla: `audit_logs`

**Descripción:** Bitácora de auditoría del sistema. Registra de forma inmutable cada acción sensible realizada sobre un ticket (cambios de estado, reasignaciones, etc.).

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | No | gen_random_uuid() | — | Identificador único del evento de auditoría. |
| `ticket_id` | UUID | FOREIGN KEY, NOT NULL | No | — | `tickets.id` | Ticket sobre el cual ocurrió la acción. |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | No | — | `users.id` | Usuario que ejecutó la acción. |
| `action` | VARCHAR | NOT NULL | No | — | — | Código de acción realizada (ej. STATUS_CHANGED, TICKET_ASSIGNED). |
| `old_value` | TEXT | — | Si | NULL | — | Valor del campo antes del cambio. |
| `new_value` | TEXT | — | Si | NULL | — | Valor del campo después del cambio. |
| `created_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha y hora exacta del evento. Inmutable. |

---

### Tabla: `notifications`

**Descripción:** Cola de notificaciones internas del sistema. Permite informar a los usuarios sobre eventos relevantes sin depender de correo externo.

| Campo | Tipo de Dato | Restricciones | Permite Nulo | Valor por Defecto | Relacion | Descripción |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | No | gen_random_uuid() | — | Identificador único de la notificación. |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | No | — | `users.id` | Usuario destinatario de la notificación. |
| `title` | VARCHAR | NOT NULL | No | — | — | Título breve de la notificación. |
| `message` | TEXT | NOT NULL | No | — | — | Contenido descriptivo del evento. |
| `type` | VARCHAR | NOT NULL | No | — | — | Tipo de evento origen (TICKET_STATUS, COMMENT, ASSIGNMENT). |
| `link` | VARCHAR | — | Si | NULL | — | Ruta de navegación al hacer clic en la notificación. |
| `is_read` | BOOLEAN | NOT NULL | No | FALSE | — | Indica si el usuario ya visualizó la notificación. |
| `created_at` | TIMESTAMP | NOT NULL | No | NOW() | — | Fecha y hora de emisión. |

---

## Cuadro de Relaciones

La siguiente tabla describe la integridad referencial completa entre todas las entidades de la base de datos.

| # | Tabla Origen | Campo Origen | Tipo de Relacion | Tabla Destino | Campo Destino | Cardinalidad | Descripcion de la Relacion |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | `roles` | `id` | Uno a Muchos | `users` | `role_id` | 1 : N | Un rol puede estar asignado a muchos usuarios. |
| 2 | `users` | `id` | Uno a Muchos | `tickets` | `creator_id` | 1 : N | Un usuario (Locatario) puede crear múltiples tickets. |
| 3 | `categories` | `id` | Uno a Muchos | `tickets` | `category_id` | 1 : N | Una categoría agrupa múltiples tickets del mismo tipo. |
| 4 | `tickets` | `id` | Uno a Muchos | `assignments` | `ticket_id` | 1 : N | Un ticket puede tener múltiples asignaciones. |
| 5 | `users` | `id` | Uno a Muchos | `assignments` | `technician_id` | 1 : N | Un técnico puede estar asignado a múltiples tickets. |
| 6 | `tickets` | `id` | Uno a Muchos | `comments` | `ticket_id` | 1 : N | Un ticket puede tener múltiples comentarios. |
| 7 | `users` | `id` | Uno a Muchos | `comments` | `user_id` | 1 : N | Un usuario puede escribir múltiples comentarios. |
| 8 | `tickets` | `id` | Uno a Muchos | `audit_logs` | `ticket_id` | 1 : N | Un ticket genera múltiples registros de auditoría. |
| 9 | `users` | `id` | Uno a Muchos | `audit_logs` | `user_id` | 1 : N | Un usuario puede ser autor de múltiples eventos auditados. |
| 10 | `users` | `id` | Uno a Muchos | `notifications` | `user_id` | 1 : N | Un usuario puede recibir múltiples notificaciones. |

**Nota:** La tabla `assignments` resuelve la relacion implicita de Muchos a Muchos (N:M) entre `tickets` y `users` (en rol de Tecnicos). Sin esta tabla puente, no seria posible asignar mas de un tecnico a un ticket ni que un tecnico tenga mas de un ticket activo sin violar la Primera Forma Normal (1FN).
