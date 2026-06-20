-- =============================================================================
-- SENTINEL CORE — SCRIPT DE BASE DE DATOS PARA EXPOSICIÓN
-- Motor: PostgreSQL
-- Incluye: Inserción de datos, Vistas y Consultas con JOINs
-- =============================================================================


-- =============================================================================
-- PARTE 1: INSERCIÓN DE REGISTROS (más de 20 registros por tabla principal)
-- =============================================================================

-- Extensión necesaria para gen_random_uuid() en PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- -----------------------------------------------------------------------------
-- 1.1 Roles del sistema (3 roles base)
-- -----------------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
  ('Administrador', 'Control total del sistema: usuarios, categorías y reportes.'),
  ('Tecnico',       'Atiende y resuelve los tickets asignados por el administrador.'),
  ('Locatario',     'Crea tickets de incidentes y hace seguimiento de los mismos.')
ON CONFLICT (name) DO NOTHING;


-- -----------------------------------------------------------------------------
-- 1.2 Usuarios (21 usuarios: 2 admin, 7 técnicos, 12 locatarios)
-- Los IDs son variables para poder reusar en los INSERTs siguientes.
-- -----------------------------------------------------------------------------
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, phone, department, store_number, store_name, is_active)
VALUES
  -- ADMINISTRADORES
  ('aaaaaaaa-0001-0001-0001-000000000001', 1, 'Carlos',    'Mendoza',   'admin1@sentinel.com',  '$2b$10$hash_admin1',   '0412-1234567', 'ADMINISTRACION',             NULL,   NULL,                    true),
  ('aaaaaaaa-0001-0001-0001-000000000002', 1, 'Luisa',     'Ferreira',  'admin2@sentinel.com',  '$2b$10$hash_admin2',   '0424-7654321', 'ADMINISTRACION',             NULL,   NULL,                    true),

  -- TECNICOS
  ('bbbbbbbb-0002-0002-0002-000000000001', 2, 'Miguel',    'Torres',    'tec1@sentinel.com',    '$2b$10$hash_tec1',     '0412-1111111', 'MANTENIMIENTO_ELECTRICO',    NULL,   NULL,                    true),
  ('bbbbbbbb-0002-0002-0002-000000000002', 2, 'Ana',       'Gutierrez', 'tec2@sentinel.com',    '$2b$10$hash_tec2',     '0414-2222222', 'PLOMERIA',                   NULL,   NULL,                    true),
  ('bbbbbbbb-0002-0002-0002-000000000003', 2, 'Pedro',     'Ramirez',   'tec3@sentinel.com',    '$2b$10$hash_tec3',     '0424-3333333', 'SEGURIDAD',                  NULL,   NULL,                    true),
  ('bbbbbbbb-0002-0002-0002-000000000004', 2, 'Valeria',   'Castillo',  'tec4@sentinel.com',    '$2b$10$hash_tec4',     '0416-4444444', 'INFRAESTRUCTURA',            NULL,   NULL,                    true),
  ('bbbbbbbb-0002-0002-0002-000000000005', 2, 'Jose',      'Herrera',   'tec5@sentinel.com',    '$2b$10$hash_tec5',     '0426-5555555', 'REDES_Y_TELECOMUNICACIONES', NULL,   NULL,                    true),
  ('bbbbbbbb-0002-0002-0002-000000000006', 2, 'Sofia',     'Morales',   'tec6@sentinel.com',    '$2b$10$hash_tec6',     '0412-6666666', 'MANTENIMIENTO_ELECTRICO',    NULL,   NULL,                    true),
  ('bbbbbbbb-0002-0002-0002-000000000007', 2, 'Ricardo',   'Peña',      'tec7@sentinel.com',    '$2b$10$hash_tec7',     '0414-7777777', 'PLOMERIA',                   NULL,   NULL,                    true),

  -- LOCATARIOS (12 comercios)
  ('cccccccc-0003-0003-0003-000000000001', 3, 'Andrea',    'Lopez',     'loc1@sentinel.com',    '$2b$10$hash_loc1',     '0412-9100001', NULL, 'L-01', 'Farmacia SaludPlus',        true),
  ('cccccccc-0003-0003-0003-000000000002', 3, 'Fernando',  'Diaz',      'loc2@sentinel.com',    '$2b$10$hash_loc2',     '0414-9100002', NULL, 'L-02', 'Panaderia El Trigo',        true),
  ('cccccccc-0003-0003-0003-000000000003', 3, 'Marta',     'Vega',      'loc3@sentinel.com',    '$2b$10$hash_loc3',     '0424-9100003', NULL, 'L-03', 'Ropa Casual Store',         true),
  ('cccccccc-0003-0003-0003-000000000004', 3, 'Luis',      'Quintero',  'loc4@sentinel.com',    '$2b$10$hash_loc4',     '0416-9100004', NULL, 'L-04', 'Optica ClarVision',         true),
  ('cccccccc-0003-0003-0003-000000000005', 3, 'Carmen',    'Salazar',   'loc5@sentinel.com',    '$2b$10$hash_loc5',     '0426-9100005', NULL, 'L-05', 'Cafeteria Aroma',           true),
  ('cccccccc-0003-0003-0003-000000000006', 3, 'Hector',    'Blanco',    'loc6@sentinel.com',    '$2b$10$hash_loc6',     '0412-9100006', NULL, 'L-06', 'Joyeria Brillo',            true),
  ('cccccccc-0003-0003-0003-000000000007', 3, 'Patricia',  'Suarez',    'loc7@sentinel.com',    '$2b$10$hash_loc7',     '0414-9100007', NULL, 'L-07', 'Zapateria PiesFelices',     true),
  ('cccccccc-0003-0003-0003-000000000008', 3, 'Roberto',   'Cabrera',   'loc8@sentinel.com',    '$2b$10$hash_loc8',     '0424-9100008', NULL, 'L-08', 'Libreria Saber',            true),
  ('cccccccc-0003-0003-0003-000000000009', 3, 'Elena',     'Rojas',     'loc9@sentinel.com',    '$2b$10$hash_loc9',     '0416-9100009', NULL, 'L-09', 'Tecnologia ZonaTech',       true),
  ('cccccccc-0003-0003-0003-000000000010', 3, 'Andres',    'Fuentes',   'loc10@sentinel.com',   '$2b$10$hash_loc10',    '0426-9100010', NULL, 'L-10', 'Supermercado FreshMart',    true),
  ('cccccccc-0003-0003-0003-000000000011', 3, 'Gloria',    'Paredes',   'loc11@sentinel.com',   '$2b$10$hash_loc11',    '0412-9100011', NULL, 'L-11', 'Gym FitZone',               true),
  ('cccccccc-0003-0003-0003-000000000012', 3, 'Santiago',  'Medina',    'loc12@sentinel.com',   '$2b$10$hash_loc12',    '0414-9100012', NULL, 'L-12', 'Cine MaxScreen',            true);


-- -----------------------------------------------------------------------------
-- 1.3 Categorías (7 categorías con SLA definido)
-- -----------------------------------------------------------------------------
INSERT INTO categories (name, department, sla_hours, is_active) VALUES
  ('Falla Eléctrica',         'MANTENIMIENTO_ELECTRICO',    4,  true),
  ('Fuga o Daño de Plomería', 'PLOMERIA',                   6,  true),
  ('Problema de Seguridad',   'SEGURIDAD',                  2,  true),
  ('Daño de Infraestructura', 'INFRAESTRUCTURA',            24, true),
  ('Falla de Red o Internet', 'REDES_Y_TELECOMUNICACIONES', 8,  true),
  ('Solicitud Administrativa','ADMINISTRACION',             48, true),
  ('Otro',                    'OTROS',                      72, true)
ON CONFLICT (name) DO NOTHING;


-- -----------------------------------------------------------------------------
-- 1.4 Tickets (22 tickets con estados y prioridades variados)
-- -----------------------------------------------------------------------------
INSERT INTO tickets (id, ticket_code, creator_id, category_id, title, description, location, status, priority, due_date, resolution_note, resolved_at)
VALUES
  ('dddddddd-0001-0001-0001-000000000001','TKT-001','cccccccc-0003-0003-0003-000000000001',1,'Sin luz en el local',          'El tablero eléctrico del local L-01 no enciende desde las 8am.',   'Local L-01',      'RESOLVED',             'HIGH',     NOW() - INTERVAL '5 days',  'Se reemplazó el breaker principal dañado.',   NOW() - INTERVAL '4 days'),
  ('dddddddd-0001-0001-0001-000000000002','TKT-002','cccccccc-0003-0003-0003-000000000002',2,'Fuga de agua en el techo',     'Hay una gotera constante sobre el área de horno de la panadería.', 'Local L-02',      'IN_PROGRESS',          'CRITICAL', NOW() + INTERVAL '2 hours', NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000003','TKT-003','cccccccc-0003-0003-0003-000000000003',3,'Puerta trasera sin seguro',    'La cerradura de la puerta trasera del local está rota.',           'Local L-03',      'OPEN',                 'HIGH',     NOW() + INTERVAL '1 hour',  NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000004','TKT-004','cccccccc-0003-0003-0003-000000000004',4,'Cielo raso desprendido',       'Se cayó una plancha del cielo raso, no hay heridos pero es riesgo.','Local L-04',     'ASSIGNED',             'CRITICAL', NOW() + INTERVAL '22 hours',NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000005','TKT-005','cccccccc-0003-0003-0003-000000000005',5,'Internet caído todo el día',   'El punto de venta no tiene internet, afecta las ventas.',          'Local L-05',      'RESOLVED',             'HIGH',     NOW() - INTERVAL '10 days', 'Se reseteó el switch del piso 2. Error de configuración VLAN.', NOW() - INTERVAL '9 days'),
  ('dddddddd-0001-0001-0001-000000000006','TKT-006','cccccccc-0003-0003-0003-000000000006',1,'Tomacorrientes sin función',   'Tres tomacorrientes del mostrador no tienen voltaje.',             'Local L-06',      'AWAITING_CONFIRMATION','MEDIUM',   NOW() - INTERVAL '2 days',  'Se revisó el cableado interno y se reemplazó un tomacorriente defectuoso.', NOW() - INTERVAL '1 day'),
  ('dddddddd-0001-0001-0001-000000000007','TKT-007','cccccccc-0003-0003-0003-000000000007',2,'Tubo roto bajo el lavamanos',  'Hay acumulación de agua en el piso, el tubo está fisurado.',       'Baños PB',        'ON_HOLD',              'HIGH',     NOW() + INTERVAL '4 hours', NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000008','TKT-008','cccccccc-0003-0003-0003-000000000008',6,'Solicitud de cambio de local', 'Solicito reubicarme al local L-14 que está vacío.',                'Local L-08',      'OPEN',                 'LOW',      NOW() + INTERVAL '46 hours',NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000009','TKT-009','cccccccc-0003-0003-0003-000000000009',5,'Señal WiFi muy débil',         'La señal del WiFi del mall no llega al fondo del local.',          'Local L-09',      'IN_PROGRESS',          'MEDIUM',   NOW() + INTERVAL '6 hours', NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000010','TKT-010','cccccccc-0003-0003-0003-000000000010',4,'Rampa de acceso deteriorada',  'La rampa de acceso del supermercado tiene grietas profundas.',     'Entrada Principal','RESOLVED',             'MEDIUM',   NOW() - INTERVAL '15 days', 'Se aplicó mortero de relleno y señalización preventiva.', NOW() - INTERVAL '13 days'),
  ('dddddddd-0001-0001-0001-000000000011','TKT-011','cccccccc-0003-0003-0003-000000000011',1,'Aire acondicionado sin enfriar','El split del gimnasio enciende pero no enfría.',                   'Local L-11',      'ASSIGNED',             'MEDIUM',   NOW() + INTERVAL '2 hours', NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000012','TKT-012','cccccccc-0003-0003-0003-000000000012',3,'Cámara de seguridad offline',  'La cámara del pasillo 3 no está grabando desde ayer.',            'Pasillo 3 - P2',  'IN_PROGRESS',          'HIGH',     NOW() + INTERVAL '1 hour',  NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000013','TKT-013','cccccccc-0003-0003-0003-000000000001',2,'Presión de agua muy baja',     'El agua sale con muy poca presión en el lavamanos del local.',     'Local L-01',      'OPEN',                 'LOW',      NOW() + INTERVAL '5 hours', NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000014','TKT-014','cccccccc-0003-0003-0003-000000000002',4,'Ventana rota por viento',      'La tormenta de ayer rompió el vidrio de la ventana frontal.',      'Local L-02',      'RESOLVED',             'HIGH',     NOW() - INTERVAL '7 days',  'Se instaló vidrio de repuesto de 6mm. Factura enviada al administrador.', NOW() - INTERVAL '6 days'),
  ('dddddddd-0001-0001-0001-000000000015','TKT-015','cccccccc-0003-0003-0003-000000000003',7,'Basura acumulada en el pasillo','Hay bolsas de basura sin recolectar en el pasillo lateral.',       'Pasillo Lateral', 'CLOSED',               'LOW',      NOW() - INTERVAL '20 days', 'Se notificó al equipo de limpieza. Retirado el mismo día.', NOW() - INTERVAL '20 days'),
  ('dddddddd-0001-0001-0001-000000000016','TKT-016','cccccccc-0003-0003-0003-000000000004',1,'Corte de luz intermitente',    'La electricidad se va y vuelve cada 30 minutos.',                  'Local L-04',      'IN_PROGRESS',          'CRITICAL', NOW() + INTERVAL '1 hour',  NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000017','TKT-017','cccccccc-0003-0003-0003-000000000005',6,'Renovar contrato de local',    'Mi contrato vence el próximo mes, necesito iniciar el proceso.',   'Administración',  'OPEN',                 'LOW',      NOW() + INTERVAL '45 hours',NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000018','TKT-018','cccccccc-0003-0003-0003-000000000006',3,'Alarma sonando sin motivo',    'La alarma del local L-06 activa sola en horas de la noche.',       'Local L-06',      'ASSIGNED',             'HIGH',     NOW() + INTERVAL '1 hour',  NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000019','TKT-019','cccccccc-0003-0003-0003-000000000007',5,'Teléfono fijo sin línea',      'El teléfono fijo del local no da tono desde el lunes.',            'Local L-07',      'RESOLVED',             'MEDIUM',   NOW() - INTERVAL '3 days',  'Se identificó cable de par trenzado cortado. Reemplazado.', NOW() - INTERVAL '2 days'),
  ('dddddddd-0001-0001-0001-000000000020','TKT-020','cccccccc-0003-0003-0003-000000000008',4,'Piso dañado en la entrada',    'Tres baldosas del piso están rotas y son riesgo de caída.',        'Entrada L-08',    'IN_PROGRESS',          'HIGH',     NOW() + INTERVAL '21 hours',NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000021','TKT-021','cccccccc-0003-0003-0003-000000000009',1,'Luces parpadeando',            'Las luces LED del techo parpadean constantemente.',                'Local L-09',      'OPEN',                 'MEDIUM',   NOW() + INTERVAL '3 hours', NULL, NULL),
  ('dddddddd-0001-0001-0001-000000000022','TKT-022','cccccccc-0003-0003-0003-000000000010',2,'Drenaje del baño obstruido',   'El baño de empleados tiene el drenaje completamente tapado.',       'Local L-10',      'ASSIGNED',             'HIGH',     NOW() + INTERVAL '5 hours', NULL, NULL);


-- -----------------------------------------------------------------------------
-- 1.5 Asignaciones (relacionando tickets con técnicos)
-- -----------------------------------------------------------------------------
INSERT INTO assignments (ticket_id, technician_id) VALUES
  ('dddddddd-0001-0001-0001-000000000001', 'bbbbbbbb-0002-0002-0002-000000000001'), -- TKT-001 -> Miguel (Eléctrico)
  ('dddddddd-0001-0001-0001-000000000002', 'bbbbbbbb-0002-0002-0002-000000000002'), -- TKT-002 -> Ana (Plomería)
  ('dddddddd-0001-0001-0001-000000000003', 'bbbbbbbb-0002-0002-0002-000000000003'), -- TKT-003 -> Pedro (Seguridad)
  ('dddddddd-0001-0001-0001-000000000004', 'bbbbbbbb-0002-0002-0002-000000000004'), -- TKT-004 -> Valeria (Infraestructura)
  ('dddddddd-0001-0001-0001-000000000005', 'bbbbbbbb-0002-0002-0002-000000000005'), -- TKT-005 -> Jose (Redes)
  ('dddddddd-0001-0001-0001-000000000006', 'bbbbbbbb-0002-0002-0002-000000000001'), -- TKT-006 -> Miguel
  ('dddddddd-0001-0001-0001-000000000007', 'bbbbbbbb-0002-0002-0002-000000000002'), -- TKT-007 -> Ana
  ('dddddddd-0001-0001-0001-000000000009', 'bbbbbbbb-0002-0002-0002-000000000005'), -- TKT-009 -> Jose
  ('dddddddd-0001-0001-0001-000000000011', 'bbbbbbbb-0002-0002-0002-000000000006'), -- TKT-011 -> Sofia
  ('dddddddd-0001-0001-0001-000000000012', 'bbbbbbbb-0002-0002-0002-000000000003'), -- TKT-012 -> Pedro
  ('dddddddd-0001-0001-0001-000000000016', 'bbbbbbbb-0002-0002-0002-000000000001'), -- TKT-016 -> Miguel
  ('dddddddd-0001-0001-0001-000000000016', 'bbbbbbbb-0002-0002-0002-000000000006'), -- TKT-016 -> Sofia (doble asignación N:M)
  ('dddddddd-0001-0001-0001-000000000018', 'bbbbbbbb-0002-0002-0002-000000000003'), -- TKT-018 -> Pedro
  ('dddddddd-0001-0001-0001-000000000020', 'bbbbbbbb-0002-0002-0002-000000000004'), -- TKT-020 -> Valeria
  ('dddddddd-0001-0001-0001-000000000022', 'bbbbbbbb-0002-0002-0002-000000000007'); -- TKT-022 -> Ricardo


-- =============================================================================
-- PARTE 2: VISTAS (VIEWS)
-- Una vista es una consulta guardada que funciona como una tabla virtual.
-- No almacena datos por sí misma, los obtiene siempre frescos de las tablas base.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Vista 1: Resumen general de tickets
-- Propósito: El frontend consulta esta vista para mostrar la lista principal
-- sin tener que repetir los JOINs en cada petición.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ticket_resumen AS
SELECT
    t.ticket_code                                AS "Codigo",
    t.title                                      AS "Titulo",
    t.status                                     AS "Estado",
    t.priority                                   AS "Prioridad",
    c.name                                       AS "Categoria",
    u.first_name || ' ' || u.last_name           AS "Creado Por",
    t.location                                   AS "Ubicacion",
    t.due_date                                   AS "Vence",
    t.created_at                                 AS "Fecha Apertura"
FROM tickets t
JOIN categories c ON t.category_id = c.id
JOIN users      u ON t.creator_id  = u.id
ORDER BY t.created_at DESC;

-- Uso de la vista:
SELECT * FROM vw_ticket_resumen;
SELECT * FROM vw_ticket_resumen WHERE "Estado" = 'OPEN';


-- -----------------------------------------------------------------------------
-- Vista 2: Métricas de rendimiento por técnico
-- Propósito: Permite al administrador ver el desempeño de cada técnico
-- sin cruzar manualmente cuatro tablas cada vez.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_rendimiento_tecnicos AS
SELECT
    u.first_name || ' ' || u.last_name           AS "Tecnico",
    u.department                                 AS "Departamento",
    COUNT(a.ticket_id)                           AS "Tickets Asignados",
    SUM(CASE WHEN t.status = 'RESOLVED' OR t.status = 'CLOSED'
             THEN 1 ELSE 0 END)                  AS "Tickets Resueltos",
    SUM(CASE WHEN t.status NOT IN ('RESOLVED','CLOSED')
             AND t.due_date < NOW()
             THEN 1 ELSE 0 END)                  AS "Tickets Vencidos"
FROM users u
JOIN roles       r ON u.role_id        = r.id
LEFT JOIN assignments a ON u.id        = a.technician_id
LEFT JOIN tickets     t ON a.ticket_id = t.id
WHERE r.name = 'Tecnico'
GROUP BY u.id, u.first_name, u.last_name, u.department
ORDER BY "Tickets Asignados" DESC;

-- Uso de la vista:
SELECT * FROM vw_rendimiento_tecnicos;


-- =============================================================================
-- PARTE 3: CONSULTAS CON JOINS
-- JOIN = cruzar datos de varias tablas en una sola consulta.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- JOIN 1 — INNER JOIN simple (2 tablas)
-- Lista todos los tickets con el nombre de su categoría.
-- Concepto: INNER JOIN devuelve solo los registros que tienen coincidencia en ambas tablas.
-- -----------------------------------------------------------------------------
SELECT
    t.ticket_code,
    t.title,
    t.status,
    c.name       AS categoria,
    c.sla_hours  AS sla_horas
FROM tickets t
INNER JOIN categories c ON t.category_id = c.id
ORDER BY t.created_at DESC;


-- -----------------------------------------------------------------------------
-- JOIN 2 — JOIN con 3 tablas (tickets + categoría + creador)
-- Lista completa de tickets mostrando quién lo creó y de qué local es.
-- Concepto: Se pueden encadenar múltiples JOINs para cruzar más de 2 tablas.
-- -----------------------------------------------------------------------------
SELECT
    t.ticket_code,
    t.title,
    t.status,
    t.priority,
    c.name                                  AS categoria,
    u.first_name || ' ' || u.last_name      AS locatario,
    u.store_name                            AS comercio,
    u.store_number                          AS local
FROM tickets t
INNER JOIN categories c ON t.category_id = c.id
INNER JOIN users      u ON t.creator_id  = u.id
ORDER BY t.priority DESC, t.created_at DESC;


-- -----------------------------------------------------------------------------
-- JOIN 3 — JOIN con 4 tablas (tickets + asignaciones + técnico + categoría)
-- Muestra el ticket, su categoría y quién lo tiene asignado.
-- Usa LEFT JOIN para incluir también los tickets SIN técnico asignado aún.
-- Concepto: LEFT JOIN devuelve TODOS los registros de la tabla izquierda,
-- aunque no tengan coincidencia en la tabla derecha (muestra NULL en ese caso).
-- -----------------------------------------------------------------------------
SELECT
    t.ticket_code,
    t.title,
    t.status,
    c.name                                  AS categoria,
    u.first_name || ' ' || u.last_name      AS tecnico_asignado,
    u.department                            AS departamento,
    a.assigned_at                           AS fecha_asignacion
FROM tickets t
INNER JOIN categories c  ON t.category_id   = c.id
LEFT  JOIN assignments a ON t.id            = a.ticket_id
LEFT  JOIN users       u ON a.technician_id = u.id
ORDER BY t.created_at DESC;


-- -----------------------------------------------------------------------------
-- JOIN 4 — Historial completo de un ticket (5 tablas)
-- Combina la auditoría, los comentarios y el responsable de cada acción.
-- Esta es la consulta más compleja: demuestra la potencia de los JOINs.
-- -----------------------------------------------------------------------------
SELECT
    t.ticket_code,
    t.title,
    al.action                               AS accion_auditada,
    al.old_value                            AS valor_anterior,
    al.new_value                            AS valor_nuevo,
    u_audit.first_name || ' ' || u_audit.last_name AS realizado_por,
    al.created_at                           AS fecha_evento
FROM tickets    t
INNER JOIN audit_logs al    ON t.id          = al.ticket_id
INNER JOIN users      u_audit ON al.user_id  = u_audit.id
WHERE t.ticket_code = 'TKT-001'
ORDER BY al.created_at ASC;


-- -----------------------------------------------------------------------------
-- JOIN 5 — Tickets vencidos (fuera del SLA)
-- Muestra qué tickets no se resolvieron a tiempo. Útil para reportes al admin.
-- Concepto: Combina filtros WHERE con JOINs para obtener datos específicos.
-- -----------------------------------------------------------------------------
SELECT
    t.ticket_code,
    t.title,
    t.priority,
    c.name                                  AS categoria,
    c.sla_hours                             AS sla_horas,
    t.due_date                              AS vencimiento,
    u.first_name || ' ' || u.last_name      AS tecnico_responsable,
    AGE(NOW(), t.due_date)                  AS tiempo_de_retraso
FROM tickets t
INNER JOIN categories  c ON t.category_id   = c.id
INNER JOIN assignments a ON t.id            = a.ticket_id
INNER JOIN users       u ON a.technician_id = u.id
WHERE t.status NOT IN ('RESOLVED', 'CLOSED')
  AND t.due_date < NOW()
ORDER BY t.due_date ASC;
