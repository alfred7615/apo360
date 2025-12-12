-- ============================================================
-- SCRIPT DE CREACIÓN: SISTEMA DE ROLES JERÁRQUICO APO-360
-- Ejecutar en desarrollo (Replit/Neon) y producción (Hostinger)
-- Fecha: Diciembre 2025
-- ============================================================

-- 1. TABLA DE CATEGORÍAS DE ROLES
-- Ej: "Comisaría Alto Alianza", "Radio Taxi Sur", "Bomberos Norte"
CREATE TABLE IF NOT EXISTS categorias_roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    rol VARCHAR(50) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA DE SUBCATEGORÍAS DE ROLES
-- Ej: "Jefatura", "Operaciones", "Personal", "Vehículo"
CREATE TABLE IF NOT EXISTS subcategorias_roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    categoria_rol_id VARCHAR(255) NOT NULL REFERENCES categorias_roles(id),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    permisos JSONB,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. ACTUALIZAR TABLA USUARIO_ROLES (si ya existe)
-- Agregar nuevas columnas si no existen
DO $$
BEGIN
    -- Verificar y agregar columna estado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'estado') THEN
        ALTER TABLE usuario_roles ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';
    END IF;
    
    -- Verificar y agregar columna asignado_por
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'asignado_por') THEN
        ALTER TABLE usuario_roles ADD COLUMN asignado_por VARCHAR(255);
    END IF;
    
    -- Verificar y agregar columna fecha_asignacion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'fecha_asignacion') THEN
        ALTER TABLE usuario_roles ADD COLUMN fecha_asignacion TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- Verificar y agregar columna fecha_vencimiento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'fecha_vencimiento') THEN
        ALTER TABLE usuario_roles ADD COLUMN fecha_vencimiento TIMESTAMP;
    END IF;
    
    -- Verificar y agregar columna notas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'notas') THEN
        ALTER TABLE usuario_roles ADD COLUMN notas TEXT;
    END IF;
    
    -- Verificar y agregar columna updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'updated_at') THEN
        ALTER TABLE usuario_roles ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 4. TABLA DE SOLICITUDES DE ROLES
CREATE TABLE IF NOT EXISTS solicitudes_roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    rol VARCHAR(50) NOT NULL,
    categoria_rol_id VARCHAR(255) REFERENCES categorias_roles(id),
    subcategoria_rol_id VARCHAR(255) REFERENCES subcategorias_roles(id),
    comentarios TEXT,
    documentos_adjuntos JSONB,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    revisado_por VARCHAR(255) REFERENCES users(id),
    fecha_revision TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_categorias_roles_rol ON categorias_roles(rol);
CREATE INDEX IF NOT EXISTS idx_categorias_roles_activo ON categorias_roles(activo);
CREATE INDEX IF NOT EXISTS idx_subcategorias_roles_categoria ON subcategorias_roles(categoria_rol_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_roles_activo ON subcategorias_roles(activo);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario ON usuario_roles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles(rol);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_estado ON usuario_roles(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_roles_usuario ON solicitudes_roles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_roles_estado ON solicitudes_roles(estado);

-- ============================================================
-- DATOS INICIALES: CATEGORÍAS Y SUBCATEGORÍAS DE ROLES
-- ============================================================

-- === CHAT/GRUPOS COMUNITARIOS ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-chat-1', 'chat', 'Asociación Vecinal Alto Alianza', 'Grupo de seguridad ciudadana del sector Alto Alianza', 'Users', 1),
('cat-chat-2', 'chat', 'Junta Vecinal Ciudad Nueva', 'Grupo de vigilancia del sector Ciudad Nueva', 'Users', 2),
('cat-chat-3', 'chat', 'Comité de Seguridad Tacna Centro', 'Organización de seguridad del centro de Tacna', 'Users', 3)
ON CONFLICT (id) DO NOTHING;

-- Subcategorías para grupos de chat
INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-chat-jef', 'cat-chat-1', 'Jefatura', 'Jefe del grupo, puede agregar/eliminar integrantes', '["administrar_grupo", "notificar_todos"]', 1),
('sub-chat-ops', 'cat-chat-1', 'Operaciones', 'Apoyo al jefe, monitorea notificaciones', '["ver_alertas", "notificar_grupo"]', 2),
('sub-chat-int', 'cat-chat-1', 'Integrante', 'Miembro del grupo', '["ver_alertas", "enviar_mensaje"]', 3),
('sub-chat-jef2', 'cat-chat-2', 'Jefatura', 'Jefe del grupo Ciudad Nueva', '["administrar_grupo", "notificar_todos"]', 1),
('sub-chat-ops2', 'cat-chat-2', 'Operaciones', 'Operaciones Ciudad Nueva', '["ver_alertas", "notificar_grupo"]', 2),
('sub-chat-int2', 'cat-chat-2', 'Integrante', 'Integrante Ciudad Nueva', '["ver_alertas", "enviar_mensaje"]', 3),
('sub-chat-jef3', 'cat-chat-3', 'Jefatura', 'Jefe del grupo Tacna Centro', '["administrar_grupo", "notificar_todos"]', 1),
('sub-chat-ops3', 'cat-chat-3', 'Operaciones', 'Operaciones Tacna Centro', '["ver_alertas", "notificar_grupo"]', 2),
('sub-chat-int3', 'cat-chat-3', 'Integrante', 'Integrante Tacna Centro', '["ver_alertas", "enviar_mensaje"]', 3)
ON CONFLICT (id) DO NOTHING;

-- === POLICÍA ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-pol-1', 'policia', 'Comisaría Alto Alianza', 'Comisaría PNP del sector Alto Alianza', 'Shield', 1),
('cat-pol-2', 'policia', 'Comisaría Ciudad Nueva', 'Comisaría PNP del sector Ciudad Nueva', 'Shield', 2),
('cat-pol-3', 'policia', 'Comisaría Tacna Centro', 'Comisaría PNP del centro de Tacna', 'Shield', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-pol-jef1', 'cat-pol-1', 'Jefatura', 'Comisario o jefe de la dependencia', '["administrar", "notificar_todos", "ver_estadisticas"]', 1),
('sub-pol-ops1', 'cat-pol-1', 'Operaciones', 'Personal de operaciones policiales', '["ver_alertas", "responder_emergencias"]', 2),
('sub-pol-veh1', 'cat-pol-1', 'Vehículo', 'Patrullero o vehículo policial', '["ver_alertas", "geolocalizacion"]', 3),
('sub-pol-per1', 'cat-pol-1', 'Personal', 'Efectivo policial', '["ver_alertas"]', 4),
('sub-pol-jef2', 'cat-pol-2', 'Jefatura', 'Jefatura Ciudad Nueva', '["administrar", "notificar_todos", "ver_estadisticas"]', 1),
('sub-pol-ops2', 'cat-pol-2', 'Operaciones', 'Operaciones Ciudad Nueva', '["ver_alertas", "responder_emergencias"]', 2),
('sub-pol-veh2', 'cat-pol-2', 'Vehículo', 'Vehículo Ciudad Nueva', '["ver_alertas", "geolocalizacion"]', 3),
('sub-pol-per2', 'cat-pol-2', 'Personal', 'Personal Ciudad Nueva', '["ver_alertas"]', 4)
ON CONFLICT (id) DO NOTHING;

-- === BOMBEROS ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-bom-1', 'bombero', 'Compañía de Bomberos Tacna N°1', 'Primera compañía de bomberos de Tacna', 'Flame', 1),
('cat-bom-2', 'bombero', 'Compañía de Bomberos Tacna N°2', 'Segunda compañía de bomberos', 'Flame', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-bom-jef1', 'cat-bom-1', 'Jefatura', 'Comandante de la compañía', '["administrar", "notificar_todos"]', 1),
('sub-bom-ops1', 'cat-bom-1', 'Operaciones', 'Personal de operaciones', '["ver_alertas", "responder_emergencias"]', 2),
('sub-bom-veh1', 'cat-bom-1', 'Vehículo', 'Unidad de bomberos', '["ver_alertas", "geolocalizacion"]', 3),
('sub-bom-per1', 'cat-bom-1', 'Personal', 'Bombero voluntario', '["ver_alertas"]', 4),
('sub-bom-jef2', 'cat-bom-2', 'Jefatura', 'Comandante compañía 2', '["administrar", "notificar_todos"]', 1),
('sub-bom-ops2', 'cat-bom-2', 'Operaciones', 'Operaciones compañía 2', '["ver_alertas", "responder_emergencias"]', 2)
ON CONFLICT (id) DO NOTHING;

-- === SAMU ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-samu-1', 'samu', 'SAMU Tacna', 'Sistema de Atención Médica de Urgencias de Tacna', 'Ambulance', 1),
('cat-samu-2', 'samu', 'SAMU Móvil 1', 'Unidad móvil de emergencias médicas', 'Ambulance', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-samu-jef1', 'cat-samu-1', 'Jefatura', 'Director del SAMU', '["administrar", "notificar_todos"]', 1),
('sub-samu-ops1', 'cat-samu-1', 'Operaciones', 'Central de operaciones', '["ver_alertas", "coordinar_emergencias"]', 2),
('sub-samu-veh1', 'cat-samu-1', 'Vehículo', 'Ambulancia', '["ver_alertas", "geolocalizacion"]', 3),
('sub-samu-per1', 'cat-samu-1', 'Personal', 'Paramédico', '["ver_alertas"]', 4)
ON CONFLICT (id) DO NOTHING;

-- === SERENAZGO ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-ser-1', 'serenazgo', 'Serenazgo Municipal Tacna', 'Servicio de seguridad municipal de Tacna', 'Eye', 1),
('cat-ser-2', 'serenazgo', 'Serenazgo Alto Alianza', 'Serenazgo del distrito Alto Alianza', 'Eye', 2),
('cat-ser-3', 'serenazgo', 'Serenazgo Ciudad Nueva', 'Serenazgo del distrito Ciudad Nueva', 'Eye', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-ser-jef1', 'cat-ser-1', 'Jefatura', 'Jefe de serenazgo', '["administrar", "notificar_todos"]', 1),
('sub-ser-ops1', 'cat-ser-1', 'Operaciones', 'Central de operaciones', '["ver_alertas", "responder_emergencias"]', 2),
('sub-ser-veh1', 'cat-ser-1', 'Vehículo', 'Unidad de serenazgo', '["ver_alertas", "geolocalizacion"]', 3),
('sub-ser-per1', 'cat-ser-1', 'Personal', 'Sereno', '["ver_alertas"]', 4)
ON CONFLICT (id) DO NOTHING;

-- === TAXI ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-taxi-1', 'conductor', 'Radio Taxi Tacna', 'Asociación de taxis Radio Taxi Tacna', 'Car', 1),
('cat-taxi-2', 'conductor', 'Taxi Seguro Tacna', 'Empresa de taxis seguros', 'Car', 2),
('cat-taxi-3', 'conductor', 'Taxi Express', 'Servicio de taxi express', 'Car', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-taxi-jef1', 'cat-taxi-1', 'Jefatura', 'Presidente de la asociación', '["administrar", "ver_estadisticas"]', 1),
('sub-taxi-ops1', 'cat-taxi-1', 'Operaciones', 'Coordinador de operaciones', '["asignar_carreras", "ver_conductores"]', 2),
('sub-taxi-veh1', 'cat-taxi-1', 'Conductor', 'Taxista activo', '["recibir_carreras", "ver_pasajeros"]', 3)
ON CONFLICT (id) DO NOTHING;

-- === BUSES ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-bus-1', 'buses', 'Línea 1 - Tacna Centro', 'Ruta de buses por el centro', 'Bus', 1),
('cat-bus-2', 'buses', 'Línea 2 - Alto Alianza', 'Ruta de buses a Alto Alianza', 'Bus', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-bus-jef1', 'cat-bus-1', 'Jefatura', 'Administrador de la línea', '["administrar", "ver_estadisticas"]', 1),
('sub-bus-ops1', 'cat-bus-1', 'Operaciones', 'Despachador', '["ver_rutas", "coordinar"]', 2),
('sub-bus-veh1', 'cat-bus-1', 'Conductor', 'Chofer de bus', '["ver_ruta", "reportar"]', 3)
ON CONFLICT (id) DO NOTHING;

-- === LOCAL COMERCIAL ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-local-rest', 'local', 'Restaurantes', 'Locales de comida y restaurantes', 'UtensilsCrossed', 1),
('cat-local-tech', 'local', 'Tecnología', 'Tiendas de tecnología y electrónica', 'Laptop', 2),
('cat-local-ropa', 'local', 'Ropa y Accesorios', 'Tiendas de ropa y accesorios', 'Shirt', 3),
('cat-local-abar', 'local', 'Abarrotes', 'Tiendas de abarrotes y mercados', 'ShoppingCart', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-local-pizz', 'cat-local-rest', 'Pizzería', 'Restaurante especializado en pizzas', '["publicar_productos"]', 1),
('sub-local-cevi', 'cat-local-rest', 'Cevichería', 'Restaurante de ceviches', '["publicar_productos"]', 2),
('sub-local-poll', 'cat-local-rest', 'Pollería', 'Restaurante de pollos', '["publicar_productos"]', 3),
('sub-local-cell', 'cat-local-tech', 'Celulares', 'Venta de celulares', '["publicar_productos"]', 1),
('sub-local-comp', 'cat-local-tech', 'Computadoras', 'Venta de computadoras', '["publicar_productos"]', 2)
ON CONFLICT (id) DO NOTHING;

-- === MI TIENDA (Vendedores independientes) ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-tienda-tech', 'mi_tienda', 'Tecnología', 'Productos tecnológicos', 'Smartphone', 1),
('cat-tienda-audio', 'mi_tienda', 'Audio y Video', 'Equipos de audio y video', 'Volume2', 2),
('cat-tienda-mueb', 'mi_tienda', 'Muebles', 'Muebles y decoración', 'Armchair', 3),
('cat-tienda-otros', 'mi_tienda', 'Otros', 'Otros productos', 'Package', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-tienda-cell', 'cat-tienda-tech', 'Celulares', 'Venta de celulares usados', '["publicar_productos"]', 1),
('sub-tienda-tab', 'cat-tienda-tech', 'Tablets', 'Venta de tablets', '["publicar_productos"]', 2),
('sub-tienda-tv', 'cat-tienda-audio', 'Televisores', 'Venta de televisores', '["publicar_productos"]', 1),
('sub-tienda-audio', 'cat-tienda-audio', 'Equipos de Sonido', 'Equipos de audio', '["publicar_productos"]', 2)
ON CONFLICT (id) DO NOTHING;

-- === INSTITUCIÓN ===
INSERT INTO categorias_roles (id, rol, nombre, descripcion, icono, orden) VALUES
('cat-inst-1', 'institucion', 'Municipalidad de Tacna', 'Gobierno local de Tacna', 'Landmark', 1),
('cat-inst-2', 'institucion', 'Gobierno Regional', 'Gobierno Regional de Tacna', 'Landmark', 2),
('cat-inst-3', 'institucion', 'Universidad Nacional', 'UNJBG Tacna', 'GraduationCap', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subcategorias_roles (id, categoria_rol_id, nombre, descripcion, permisos, orden) VALUES
('sub-inst-jef1', 'cat-inst-1', 'Jefatura', 'Alcalde o funcionario principal', '["publicar_eventos", "publicar_encuestas"]', 1),
('sub-inst-ops1', 'cat-inst-1', 'Comunicaciones', 'Área de comunicaciones', '["publicar_eventos", "publicar_noticias"]', 2),
('sub-inst-per1', 'cat-inst-1', 'Personal', 'Empleado municipal', '["ver_eventos"]', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DATOS FICTICIOS: ROLES ASIGNADOS A USUARIOS DE PRUEBA
-- ============================================================

-- Primero, vamos a obtener algunos IDs de usuarios existentes y asignarles roles
-- (Esto se debe ejecutar después de tener usuarios en la base de datos)

-- Asignar roles a usuarios existentes (ejemplo con usuarios de prueba)
-- NOTA: Estos INSERT se ejecutarán solo si los usuarios existen

DO $$
DECLARE
    v_user_id VARCHAR(255);
    v_admin_id VARCHAR(255);
BEGIN
    -- Obtener el ID del primer super_admin para usarlo como asignador
    SELECT id INTO v_admin_id FROM users WHERE rol = 'super_admin' LIMIT 1;
    
    IF v_admin_id IS NOT NULL THEN
        -- Asignar roles de prueba a usuarios existentes
        
        -- Primer usuario: Asignar rol de policía
        SELECT id INTO v_user_id FROM users WHERE rol = 'usuario' AND id != v_admin_id LIMIT 1;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO usuario_roles (usuario_id, rol, categoria_rol_id, subcategoria_rol_id, estado, asignado_por, notas)
            VALUES (v_user_id, 'policia', 'cat-pol-1', 'sub-pol-per1', 'activo', v_admin_id, 'Rol asignado para pruebas')
            ON CONFLICT DO NOTHING;
            
            -- También asignarle rol de chat comunitario (múltiples roles)
            INSERT INTO usuario_roles (usuario_id, rol, categoria_rol_id, subcategoria_rol_id, estado, asignado_por, notas)
            VALUES (v_user_id, 'chat', 'cat-chat-1', 'sub-chat-int', 'activo', v_admin_id, 'Integrante del grupo vecinal')
            ON CONFLICT DO NOTHING;
        END IF;
        
        -- Segundo usuario: Asignar rol de bombero
        SELECT id INTO v_user_id FROM users WHERE rol = 'usuario' AND id != v_admin_id OFFSET 1 LIMIT 1;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO usuario_roles (usuario_id, rol, categoria_rol_id, subcategoria_rol_id, estado, asignado_por, notas)
            VALUES (v_user_id, 'bombero', 'cat-bom-1', 'sub-bom-per1', 'activo', v_admin_id, 'Bombero voluntario')
            ON CONFLICT DO NOTHING;
        END IF;
        
        -- Tercer usuario: Asignar rol de serenazgo
        SELECT id INTO v_user_id FROM users WHERE rol = 'usuario' AND id != v_admin_id OFFSET 2 LIMIT 1;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO usuario_roles (usuario_id, rol, categoria_rol_id, subcategoria_rol_id, estado, asignado_por, notas)
            VALUES (v_user_id, 'serenazgo', 'cat-ser-1', 'sub-ser-per1', 'activo', v_admin_id, 'Sereno asignado')
            ON CONFLICT DO NOTHING;
        END IF;
        
        -- Cuarto usuario: Asignar rol de conductor taxi
        SELECT id INTO v_user_id FROM users WHERE rol = 'conductor' LIMIT 1;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO usuario_roles (usuario_id, rol, categoria_rol_id, subcategoria_rol_id, estado, asignado_por, notas)
            VALUES (v_user_id, 'conductor', 'cat-taxi-1', 'sub-taxi-veh1', 'activo', v_admin_id, 'Taxista registrado')
            ON CONFLICT DO NOTHING;
        END IF;
        
        -- Quinto usuario: Asignar rol de local comercial
        SELECT id INTO v_user_id FROM users WHERE rol = 'local' LIMIT 1;
        IF v_user_id IS NOT NULL THEN
            INSERT INTO usuario_roles (usuario_id, rol, categoria_rol_id, subcategoria_rol_id, estado, asignado_por, notas)
            VALUES (v_user_id, 'local', 'cat-local-rest', 'sub-local-poll', 'activo', v_admin_id, 'Pollería registrada')
            ON CONFLICT DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Roles de prueba asignados correctamente';
    ELSE
        RAISE NOTICE 'No se encontró super_admin, no se asignaron roles de prueba';
    END IF;
END $$;

-- ============================================================
-- CREAR ALGUNAS SOLICITUDES DE PRUEBA (pendientes de aprobación)
-- ============================================================

DO $$
DECLARE
    v_user_id VARCHAR(255);
BEGIN
    -- Obtener un usuario para crear solicitudes de prueba
    SELECT id INTO v_user_id FROM users WHERE rol = 'usuario' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Solicitud de rol de cambista
        INSERT INTO solicitudes_roles (usuario_id, rol, comentarios, estado)
        VALUES (v_user_id, 'cambista', 'Soy cambista en la calle Bolognesi, trabajo desde hace 5 años. Tengo licencia municipal.', 'pendiente')
        ON CONFLICT DO NOTHING;
        
        -- Solicitud de rol de conductor
        INSERT INTO solicitudes_roles (usuario_id, rol, categoria_rol_id, subcategoria_rol_id, comentarios, estado)
        VALUES (v_user_id, 'conductor', 'cat-taxi-2', 'sub-taxi-veh1', 'Tengo mi taxi registrado en SUTRAN, placa ABC-123. Adjunto documentos.', 'pendiente')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Solicitudes de prueba creadas correctamente';
    END IF;
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT 'Categorías de roles creadas:' as mensaje, COUNT(*) as total FROM categorias_roles;
SELECT 'Subcategorías de roles creadas:' as mensaje, COUNT(*) as total FROM subcategorias_roles;
SELECT 'Roles de usuario asignados:' as mensaje, COUNT(*) as total FROM usuario_roles;
SELECT 'Solicitudes de roles:' as mensaje, COUNT(*) as total FROM solicitudes_roles;
