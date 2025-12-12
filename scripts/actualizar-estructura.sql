-- ============================================================
-- APO-360 - SCRIPT DE ACTUALIZACIÓN DE ESTRUCTURA
-- Fecha: 12/12/2025
-- USO: Ejecutar DESPUÉS de schema-produccion.sql para agregar
--      columnas faltantes a tablas existentes
-- ============================================================

-- ============================================================
-- CREAR TABLAS NUEVAS SI NO EXISTEN
-- ============================================================

-- CATEGORÍAS DE ROLES (para locales comerciales, policía, etc.)
CREATE TABLE IF NOT EXISTS categorias_rol (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  rol_base VARCHAR(50) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50),
  color VARCHAR(20),
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SUBCATEGORÍAS DE ROLES
CREATE TABLE IF NOT EXISTS subcategorias_rol (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id VARCHAR(255) NOT NULL REFERENCES categorias_rol(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50),
  color VARCHAR(20),
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- HISTORIAL DE CAMBIOS DE MONEDA (internet + locales)
CREATE TABLE IF NOT EXISTS historial_tasas_cambio (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  cambista_id VARCHAR(255) NOT NULL REFERENCES users(id),
  tasa_local_id VARCHAR(255) REFERENCES tasas_cambio_locales(id),
  moneda_origen_codigo VARCHAR(10) NOT NULL,
  moneda_destino_codigo VARCHAR(10) NOT NULL,
  tasa_compra_anterior DECIMAL(12,6),
  tasa_venta_anterior DECIMAL(12,6),
  tasa_compra_nueva DECIMAL(12,6) NOT NULL,
  tasa_venta_nueva DECIMAL(12,6) NOT NULL,
  tipo_accion VARCHAR(20) NOT NULL DEFAULT 'actualizacion',
  ip_origen VARCHAR(45),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONFIGURACIÓN DE MONEDAS
CREATE TABLE IF NOT EXISTS configuracion_monedas (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  nombre_corto VARCHAR(50) NOT NULL,
  simbolo VARCHAR(10) NOT NULL,
  bandera_url VARCHAR(255),
  tasa_promedio_internet DECIMAL(12,6),
  tasa_promedio_local DECIMAL(12,6),
  es_principal BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  ultima_actualizacion TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TASAS DE CAMBIO LOCALES (Cambistas)
CREATE TABLE IF NOT EXISTS tasas_cambio_locales (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  cambista_id VARCHAR(255) NOT NULL REFERENCES users(id),
  moneda_origen_codigo VARCHAR(10) NOT NULL,
  moneda_destino_codigo VARCHAR(10) NOT NULL,
  tasa_compra DECIMAL(12,6) NOT NULL,
  tasa_venta DECIMAL(12,6) NOT NULL,
  ubicacion VARCHAR(200),
  gps_latitud REAL,
  gps_longitud REAL,
  horario_atencion VARCHAR(200),
  telefono VARCHAR(20),
  whatsapp VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar monedas por defecto si no existen
INSERT INTO configuracion_monedas (codigo, nombre, nombre_corto, simbolo, bandera_url, tasa_promedio_internet, es_principal, orden, activo)
VALUES 
  ('PEN', 'Sol Peruano', 'Sol', 'S/', '🇵🇪', 1.0000, true, 1, true),
  ('USD', 'Dólar Estadounidense', 'Dólar', '$', '🇺🇸', 3.7500, false, 2, true),
  ('CLP', 'Peso Chileno', 'Peso CLP', '$', '🇨🇱', 0.0042, false, 3, true),
  ('ARS', 'Peso Argentino', 'Peso ARS', '$', '🇦🇷', 0.0037, false, 4, true),
  ('BOB', 'Boliviano', 'Boliviano', 'Bs', '🇧🇴', 0.5400, false, 5, true)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- TABLA: users
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS imei_dispositivo VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'usuario';
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitud REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitud REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS en_linea BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ultima_conexion TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS modo_taxi VARCHAR(20) DEFAULT 'pasajero';
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehiculo_modelo VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehiculo_placa VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS disponible_taxi BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nombre_local VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS categoria_local VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS direccion_local TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_local VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS descripcion_local TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS nivel_usuario INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS alias VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_imagen_frente VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_imagen_posterior VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_emision DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_caducidad DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pais VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS departamento VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS distrito VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manzana_lote VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avenida_calle VARCHAR(200);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gps_latitud REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gps_longitud REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ruc VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gps_local_latitud REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gps_local_longitud REAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS brevete_imagen_frente VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS brevete_imagen_posterior VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS brevete_emision DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS brevete_caducidad DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS soat_imagen_frente VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS soat_imagen_posterior VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS soat_emision DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS soat_caducidad DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS revision_tecnica_imagen_frente VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS revision_tecnica_imagen_posterior VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS revision_tecnica_emision DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS revision_tecnica_caducidad DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_conductor_imagen_frente VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_conductor_imagen_posterior VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_conductor_emision DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_conductor_caducidad DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_taxi_imagen_frente VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_taxi_imagen_posterior VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_taxi_emision DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credencial_taxi_caducidad DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tipo_vehiculo VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehiculo_foto_frente VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehiculo_foto_posterior VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehiculo_foto_lateral_izq VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehiculo_foto_lateral_der VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_domicilio VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS motivo_suspension TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS motivo_bloqueo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fecha_bloqueo TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_foto_1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_foto_2 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_foto_3 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_foto_4 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_video_1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_video_2 VARCHAR(255);

-- ============================================================
-- TABLA: usuario_roles
-- ============================================================
ALTER TABLE usuario_roles ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE usuario_roles ADD COLUMN IF NOT EXISTS rol VARCHAR(50);
ALTER TABLE usuario_roles ADD COLUMN IF NOT EXISTS categoria_rol_id VARCHAR(255);
ALTER TABLE usuario_roles ADD COLUMN IF NOT EXISTS subcategoria_rol_id VARCHAR(255);
ALTER TABLE usuario_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: datos_negocio
-- ============================================================
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS nombre_negocio VARCHAR(200);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS banner_url VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS latitud REAL;
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS longitud REAL;
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS horario_atencion TEXT;
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS tiktok VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS youtube VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS pagina_web VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS tipo_negocio VARCHAR(50);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS categoria_id VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS subcategoria_id VARCHAR(255);
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE datos_negocio ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: catalogo_negocio
-- ============================================================
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS negocio_id VARCHAR(255);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS nombre VARCHAR(200);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS precio NUMERIC(10,2);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS precio_oferta NUMERIC(10,2);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(255);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS disponible BOOLEAN DEFAULT true;
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS tipo_item VARCHAR(50) DEFAULT 'producto';
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS ingredientes TEXT;
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS tiempo_preparacion VARCHAR(50);
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS costo_publicacion NUMERIC(10,2) DEFAULT 0;
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE catalogo_negocio ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: grupos_chat
-- ============================================================
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS creador_id VARCHAR(255);
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS admin_grupo_id VARCHAR(255);
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS estrellas_minimas INTEGER DEFAULT 3;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS tipo_cobro VARCHAR(20) DEFAULT 'ninguno';
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS tarifa_grupo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS tarifa_usuario DECIMAL(10,2) DEFAULT 0;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS es_emergencia BOOLEAN DEFAULT false;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS total_miembros INTEGER DEFAULT 0;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS total_mensajes INTEGER DEFAULT 0;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS ultimo_mensaje_at TIMESTAMP;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS motivo_suspension TEXT;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP;
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE grupos_chat ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: miembros_grupo
-- ============================================================
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS grupo_id VARCHAR(255);
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'miembro';
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS nivel_estrellas INTEGER DEFAULT 1;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS pago_confirmado BOOLEAN DEFAULT false;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS motivo_suspension TEXT;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS silenciado BOOLEAN DEFAULT false;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS notificaciones BOOLEAN DEFAULT true;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS mensajes_no_leidos INTEGER DEFAULT 0;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS ultimo_mensaje_visto TIMESTAMP;
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: mensajes
-- ============================================================
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS grupo_id VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS remitente_id VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS destinatario_id VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS contenido TEXT;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'texto';
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS archivo_url VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS metadata_foto JSON;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS duracion_audio INTEGER;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS es_emergencia BOOLEAN DEFAULT false;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS gps_latitud REAL;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS gps_longitud REAL;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS leido BOOLEAN DEFAULT false;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT false;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS eliminado_por VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS estado_mensaje VARCHAR(20) DEFAULT 'enviado';
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS entregado_en TIMESTAMP;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS leido_en TIMESTAMP;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS leido_por VARCHAR(255)[];

-- ============================================================
-- TABLA: emergencias
-- ============================================================
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS latitud REAL;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS longitud REAL;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'media';
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS grupos_notificados TEXT[];
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS entidades_notificadas TEXT[];
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS atendido_por VARCHAR(255);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(255);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS audio_url VARCHAR(255);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS video_url VARCHAR(255);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS mensaje_voz VARCHAR(255);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS metadata_gps JSON;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS vista_por_admin BOOLEAN DEFAULT false;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS fecha_vista_admin TIMESTAMP;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS admin_que_vio VARCHAR(255);
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE emergencias ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: publicidad
-- ============================================================
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS tipo VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS enlace_url VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMP;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS fecha_caducidad TIMESTAMP;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS estado VARCHAR(255) DEFAULT 'activo';
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS orden INTEGER;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS latitud REAL;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS longitud REAL;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS instagram VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS tiktok VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS youtube VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE publicidad ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- ============================================================
-- TABLA: logos_servicios
-- ============================================================
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS categoria_id VARCHAR(255);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS subcategoria_id VARCHAR(255);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS logo_url VARCHAR(255);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS horario TEXT;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS gps_latitud REAL;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS gps_longitud REAL;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS redes JSON;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS total_favoritos INTEGER DEFAULT 0;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS total_comentarios INTEGER DEFAULT 0;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS total_compartidos INTEGER DEFAULT 0;
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE logos_servicios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: saldos_usuarios
-- ============================================================
ALTER TABLE saldos_usuarios ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE saldos_usuarios ADD COLUMN IF NOT EXISTS saldo DECIMAL(12,2) DEFAULT 0;
ALTER TABLE saldos_usuarios ADD COLUMN IF NOT EXISTS moneda_preferida VARCHAR(10) DEFAULT 'PEN';
ALTER TABLE saldos_usuarios ADD COLUMN IF NOT EXISTS total_ingresos DECIMAL(12,2) DEFAULT 0;
ALTER TABLE saldos_usuarios ADD COLUMN IF NOT EXISTS total_egresos DECIMAL(12,2) DEFAULT 0;
ALTER TABLE saldos_usuarios ADD COLUMN IF NOT EXISTS ultima_actualizacion TIMESTAMP DEFAULT NOW();
ALTER TABLE saldos_usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: solicitudes_saldo
-- ============================================================
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS tipo VARCHAR(20);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS monto DECIMAL(10,2);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'PEN';
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS metodo_pago_id VARCHAR(255);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS metodo_pago_destino VARCHAR(255);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS comprobante VARCHAR(255);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS numero_operacion VARCHAR(100);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS aprobado_por VARCHAR(255);
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP;
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE solicitudes_saldo ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: transacciones_saldo
-- ============================================================
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS concepto VARCHAR(255);
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS monto DECIMAL(10,2);
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS saldo_anterior DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS saldo_nuevo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS referencia_id VARCHAR(255);
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS referencia_tipo VARCHAR(50);
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'completado';
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE transacciones_saldo ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: metodos_pago
-- ============================================================
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS numero_cuenta VARCHAR(100);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS cci VARCHAR(30);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS titular VARCHAR(200);
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'PEN';
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS es_plataforma BOOLEAN DEFAULT false;
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE metodos_pago ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: productos_usuario
-- ============================================================
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS categoria_id VARCHAR(255);
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS subcategoria_id VARCHAR(255);
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS nombre VARCHAR(200);
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2);
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS precio_oferta DECIMAL(10,2);
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'PEN';
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS imagenes JSON;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS stock INTEGER;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS disponible BOOLEAN DEFAULT true;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS destacado BOOLEAN DEFAULT false;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS gps_latitud REAL;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS gps_longitud REAL;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS costo_creacion DECIMAL(10,2) DEFAULT 0;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS favoritos INTEGER DEFAULT 0;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS compartidos INTEGER DEFAULT 0;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS vistas INTEGER DEFAULT 0;
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE productos_usuario ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- TABLA: eventos
-- ============================================================
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS fecha_evento TIMESTAMP;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS hora_inicio VARCHAR(10);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS hora_fin VARCHAR(10);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS ubicacion TEXT;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS gps_latitud REAL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS gps_longitud REAL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(255);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS capacidad INTEGER;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS precio DECIMAL(10,2) DEFAULT 0;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'PEN';
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS organizador_id VARCHAR(255);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS publicidad_id VARCHAR(255);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activo';
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- FIN DEL SCRIPT DE ACTUALIZACIÓN
-- ============================================================
SELECT 'Script de actualización completado exitosamente.' as resultado;
