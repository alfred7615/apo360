-- ============================================================
-- APO-360 - SCRIPT SQL MAESTRO DE BASE DE DATOS
-- Fecha: 12/12/2025
-- Uso: Ejecutar en Hostinger para sincronizar estructura
-- IMPORTANTE: Este script NO elimina datos existentes
-- ============================================================

-- PASO 1: CREAR ENUMS
DO $$ BEGIN
    CREATE TYPE rol AS ENUM (
        'super_admin', 'admin_publicidad', 'admin_radio', 'admin_cartera',
        'admin_operaciones', 'supervisor', 'usuario', 'conductor',
        'local', 'serenazgo', 'policia', 'samu', 'bombero', 'cambista'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABLA PRINCIPAL: USUARIOS (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    telefono VARCHAR(20),
    imei_dispositivo VARCHAR(20),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'usuario' NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    latitud REAL,
    longitud REAL,
    en_linea BOOLEAN DEFAULT false,
    ultima_conexion TIMESTAMP,
    modo_taxi VARCHAR(20) DEFAULT 'pasajero',
    vehiculo_modelo VARCHAR(255),
    vehiculo_placa VARCHAR(255),
    disponible_taxi BOOLEAN DEFAULT false,
    nombre_local VARCHAR(255),
    categoria_local VARCHAR(255),
    direccion_local TEXT,
    logo_local VARCHAR(255),
    descripcion_local TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    nivel_usuario INTEGER DEFAULT 1,
    alias VARCHAR(100),
    dni VARCHAR(20),
    dni_imagen_frente VARCHAR(255),
    dni_imagen_posterior VARCHAR(255),
    dni_emision DATE,
    dni_caducidad DATE,
    pais VARCHAR(100),
    departamento VARCHAR(100),
    distrito VARCHAR(100),
    sector VARCHAR(100),
    direccion TEXT,
    manzana_lote VARCHAR(50),
    avenida_calle VARCHAR(200),
    gps_latitud REAL,
    gps_longitud REAL,
    ruc VARCHAR(20),
    gps_local_latitud REAL,
    gps_local_longitud REAL,
    brevete_imagen_frente VARCHAR(255),
    brevete_imagen_posterior VARCHAR(255),
    brevete_emision DATE,
    brevete_caducidad DATE,
    soat_imagen_frente VARCHAR(255),
    soat_imagen_posterior VARCHAR(255),
    soat_emision DATE,
    soat_caducidad DATE,
    revision_tecnica_imagen_frente VARCHAR(255),
    revision_tecnica_imagen_posterior VARCHAR(255),
    revision_tecnica_emision DATE,
    revision_tecnica_caducidad DATE,
    credencial_conductor_imagen_frente VARCHAR(255),
    credencial_conductor_imagen_posterior VARCHAR(255),
    credencial_conductor_emision DATE,
    credencial_conductor_caducidad DATE,
    credencial_taxi_imagen_frente VARCHAR(255),
    credencial_taxi_imagen_posterior VARCHAR(255),
    credencial_taxi_emision DATE,
    credencial_taxi_caducidad DATE,
    tipo_vehiculo VARCHAR(50),
    vehiculo_foto_frente VARCHAR(255),
    vehiculo_foto_posterior VARCHAR(255),
    vehiculo_foto_lateral_izq VARCHAR(255),
    vehiculo_foto_lateral_der VARCHAR(255),
    foto_domicilio VARCHAR(255),
    password_hash VARCHAR(255),
    motivo_suspension TEXT,
    fecha_suspension TIMESTAMP,
    motivo_bloqueo TEXT,
    fecha_bloqueo TIMESTAMP,
    local_foto_1 VARCHAR(255),
    local_foto_2 VARCHAR(255),
    local_foto_3 VARCHAR(255),
    local_foto_4 VARCHAR(255),
    local_video_1 VARCHAR(255),
    local_video_2 VARCHAR(255)
);

-- ============================================================
-- SECTORES
-- ============================================================
CREATE TABLE IF NOT EXISTS sectores (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    departamento VARCHAR(100),
    distrito VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(nombre, departamento, distrito)
);

-- ============================================================
-- LUGARES DEL USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS lugares_usuario (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) REFERENCES users(id) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    direccion TEXT,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ROLES DE USUARIO (múltiples roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario_roles (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) REFERENCES users(id),
    rol VARCHAR(50) NOT NULL,
    categoria_rol_id VARCHAR(255),
    subcategoria_rol_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DATOS DE NEGOCIO
-- ============================================================
CREATE TABLE IF NOT EXISTS datos_negocio (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) REFERENCES users(id) NOT NULL,
    nombre_negocio VARCHAR(200) NOT NULL,
    descripcion TEXT,
    logo_url VARCHAR(255),
    banner_url VARCHAR(255),
    direccion TEXT,
    latitud REAL,
    longitud REAL,
    telefono VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    horario_atencion TEXT,
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    tiktok VARCHAR(255),
    youtube VARCHAR(255),
    pagina_web VARCHAR(255),
    tipo_negocio VARCHAR(50),
    categoria_id VARCHAR(255),
    subcategoria_id VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    verificado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CATÁLOGO DE NEGOCIO
-- ============================================================
CREATE TABLE IF NOT EXISTS catalogo_negocio (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id VARCHAR(255) REFERENCES datos_negocio(id) NOT NULL,
    usuario_id VARCHAR(255) REFERENCES users(id) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10,2),
    precio_oferta NUMERIC(10,2),
    imagen_url VARCHAR(255),
    categoria VARCHAR(100),
    disponible BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    tipo_item VARCHAR(50) DEFAULT 'producto',
    ingredientes TEXT,
    tiempo_preparacion VARCHAR(50),
    costo_publicacion NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ADMINISTRADORES
-- ============================================================
CREATE TABLE IF NOT EXISTS administradores (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) REFERENCES users(id),
    permisos_grupos VARCHAR(255)[],
    permisos_servicios VARCHAR(255)[],
    permisos_taxis VARCHAR(255)[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PUBLICIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS publicidad (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255),
    descripcion TEXT,
    tipo VARCHAR(255),
    imagen_url VARCHAR(255),
    enlace_url VARCHAR(255),
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    fecha_caducidad TIMESTAMP,
    estado VARCHAR(255) DEFAULT 'activo',
    usuario_id VARCHAR(255),
    orden INTEGER,
    latitud REAL,
    longitud REAL,
    direccion TEXT,
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    whatsapp VARCHAR(255),
    tiktok VARCHAR(255),
    twitter VARCHAR(255),
    youtube VARCHAR(255),
    linkedin VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- ============================================================
-- INTERACCIONES PUBLICIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS interacciones_publicidad (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    publicidad_id VARCHAR(255) NOT NULL REFERENCES publicidad(id),
    usuario_id VARCHAR(255) REFERENCES users(id),
    tipo VARCHAR(50) NOT NULL,
    red_social VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(publicidad_id, usuario_id, tipo)
);

-- ============================================================
-- COMENTARIOS PUBLICIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS comentarios_publicidad (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    publicidad_id VARCHAR(255) NOT NULL REFERENCES publicidad(id),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    contenido TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- ============================================================
-- CONTADORES PUBLICIDAD
-- ============================================================
CREATE TABLE IF NOT EXISTS contadores_publicidad (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    publicidad_id VARCHAR(255) NOT NULL REFERENCES publicidad(id) UNIQUE,
    likes INTEGER DEFAULT 0,
    favoritos INTEGER DEFAULT 0,
    compartidos INTEGER DEFAULT 0,
    impresiones INTEGER DEFAULT 0,
    comentarios INTEGER DEFAULT 0,
    agendados INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- FAVORITOS USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS favoritos_usuario (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    publicidad_id VARCHAR(255) NOT NULL REFERENCES publicidad(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, publicidad_id)
);

-- ============================================================
-- RADIOS ONLINE
-- ============================================================
CREATE TABLE IF NOT EXISTS radios_online (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    iframe_code TEXT,
    descripcion TEXT,
    logo_url VARCHAR(500),
    orden INTEGER DEFAULT 0,
    es_predeterminada BOOLEAN DEFAULT false,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LISTAS MP3
-- ============================================================
CREATE TABLE IF NOT EXISTS listas_mp3 (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ruta_carpeta VARCHAR(500),
    imagen_url VARCHAR(500),
    genero VARCHAR(100),
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ARCHIVOS MP3
-- ============================================================
CREATE TABLE IF NOT EXISTS archivos_mp3 (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    lista_id INTEGER REFERENCES listas_mp3(id),
    titulo VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255),
    artista VARCHAR(255),
    archivo_url VARCHAR(500) NOT NULL,
    duracion INTEGER,
    tamano INTEGER,
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SERVICIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS servicios (
    id VARCHAR(255) PRIMARY KEY,
    usuario_id VARCHAR(255),
    categoria VARCHAR(255),
    nombre_servicio VARCHAR(255),
    descripcion TEXT,
    logo_url VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(255),
    horario TEXT,
    estado VARCHAR(255) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS DELIVERY
-- ============================================================
CREATE TABLE IF NOT EXISTS productos_delivery (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    servicio_id VARCHAR(255) NOT NULL REFERENCES servicios(id),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen_url VARCHAR(255),
    disponible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- GRUPOS CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS grupos_chat (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(255),
    creador_id VARCHAR(255) NOT NULL REFERENCES users(id),
    admin_grupo_id VARCHAR(255) REFERENCES users(id),
    estado VARCHAR(20) DEFAULT 'activo',
    estrellas_minimas INTEGER DEFAULT 3,
    tipo_cobro VARCHAR(20) DEFAULT 'ninguno',
    tarifa_grupo DECIMAL(10,2) DEFAULT 0,
    tarifa_usuario DECIMAL(10,2) DEFAULT 0,
    es_emergencia BOOLEAN DEFAULT false,
    total_miembros INTEGER DEFAULT 0,
    total_mensajes INTEGER DEFAULT 0,
    ultimo_mensaje_at TIMESTAMP,
    motivo_suspension TEXT,
    fecha_suspension TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MIEMBROS GRUPO
-- ============================================================
CREATE TABLE IF NOT EXISTS miembros_grupo (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id VARCHAR(255) NOT NULL REFERENCES grupos_chat(id),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    rol VARCHAR(50) DEFAULT 'miembro',
    estado VARCHAR(20) DEFAULT 'activo',
    nivel_estrellas INTEGER DEFAULT 1,
    pago_confirmado BOOLEAN DEFAULT false,
    fecha_pago TIMESTAMP,
    motivo_suspension TEXT,
    fecha_suspension TIMESTAMP,
    silenciado BOOLEAN DEFAULT false,
    notificaciones BOOLEAN DEFAULT true,
    mensajes_no_leidos INTEGER DEFAULT 0,
    ultimo_mensaje_visto TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(grupo_id, usuario_id)
);

-- ============================================================
-- MENSAJES
-- ============================================================
CREATE TABLE IF NOT EXISTS mensajes (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id VARCHAR(255) REFERENCES grupos_chat(id),
    remitente_id VARCHAR(255) NOT NULL REFERENCES users(id),
    destinatario_id VARCHAR(255) REFERENCES users(id),
    contenido TEXT,
    tipo VARCHAR(50) DEFAULT 'texto',
    archivo_url VARCHAR(255),
    thumbnail_url VARCHAR(255),
    metadata_foto JSON,
    duracion_audio INTEGER,
    es_emergencia BOOLEAN DEFAULT false,
    gps_latitud REAL,
    gps_longitud REAL,
    leido BOOLEAN DEFAULT false,
    eliminado BOOLEAN DEFAULT false,
    eliminado_por VARCHAR(255) REFERENCES users(id),
    fecha_eliminacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    estado_mensaje VARCHAR(20) DEFAULT 'enviado',
    entregado_en TIMESTAMP,
    leido_en TIMESTAMP,
    leido_por VARCHAR(255)[]
);

-- ============================================================
-- EMERGENCIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergencias (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    direccion TEXT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    prioridad VARCHAR(20) DEFAULT 'media',
    grupos_notificados TEXT[],
    entidades_notificadas TEXT[],
    atendido_por VARCHAR(255) REFERENCES users(id),
    imagen_url VARCHAR(255),
    audio_url VARCHAR(255),
    video_url VARCHAR(255),
    mensaje_voz VARCHAR(255),
    metadata_gps JSON,
    vista_por_admin BOOLEAN DEFAULT false,
    fecha_vista_admin TIMESTAMP,
    admin_que_vio VARCHAR(255) REFERENCES users(id),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CONTACTOS FAMILIARES
-- ============================================================
CREATE TABLE IF NOT EXISTS contactos_familiares (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(200),
    relacion VARCHAR(50),
    es_contacto_principal BOOLEAN DEFAULT false,
    notificar_emergencias BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- NOTIFICACIONES CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones_chat (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    grupo_id VARCHAR(255) REFERENCES grupos_chat(id),
    mensaje_id VARCHAR(255) REFERENCES mensajes(id),
    emergencia_id VARCHAR(255) REFERENCES emergencias(id),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255),
    contenido TEXT,
    leida BOOLEAN DEFAULT false,
    fecha_leida TIMESTAMP,
    datos_extra JSON,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- VIAJES TAXI
-- ============================================================
CREATE TABLE IF NOT EXISTS viajes_taxi (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    pasajero_id VARCHAR(255) NOT NULL REFERENCES users(id),
    conductor_id VARCHAR(255) REFERENCES users(id),
    origen_latitud REAL NOT NULL,
    origen_longitud REAL NOT NULL,
    origen_direccion TEXT,
    destino_latitud REAL NOT NULL,
    destino_longitud REAL NOT NULL,
    destino_direccion TEXT,
    precio DECIMAL(10,2),
    estado VARCHAR(50) DEFAULT 'solicitado',
    tipo_servicio VARCHAR(50) DEFAULT 'taxi',
    created_at TIMESTAMP DEFAULT NOW(),
    iniciado_at TIMESTAMP,
    completado_at TIMESTAMP
);

-- ============================================================
-- PEDIDOS DELIVERY
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos_delivery (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    servicio_id VARCHAR(255) NOT NULL REFERENCES servicios(id),
    productos JSON NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    direccion_entrega TEXT NOT NULL,
    latitud REAL,
    longitud REAL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    conductor_id VARCHAR(255) REFERENCES users(id),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ============================================================
-- CONFIGURACIÓN SALDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_saldos (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_operacion VARCHAR(255) NOT NULL,
    tipo_valor VARCHAR(255) DEFAULT 'monto',
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ENCUESTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS encuestas (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    preguntas JSON,
    imagen_url VARCHAR(255),
    estado VARCHAR(255) DEFAULT 'activa',
    respuestas JSON,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    usuario_id VARCHAR(255) REFERENCES users(id),
    total_respuestas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- POPUPS PUBLICITARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS popups_publicitarios (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255),
    descripcion TEXT,
    imagen_url VARCHAR(255),
    video_url VARCHAR(255),
    tipo VARCHAR(50) DEFAULT 'publicidad',
    duracion_segundos INTEGER DEFAULT 30,
    segundos_obligatorios INTEGER DEFAULT 5,
    puede_omitir BOOLEAN DEFAULT true,
    estado VARCHAR(255) DEFAULT 'activo',
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    usuario_id VARCHAR(255) REFERENCES users(id),
    vistas INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INTERACCIONES SOCIALES
-- ============================================================
CREATE TABLE IF NOT EXISTS interacciones_sociales (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_contenido VARCHAR(50) NOT NULL,
    contenido_id VARCHAR(255) NOT NULL,
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    tipo_interaccion VARCHAR(50) NOT NULL,
    valor TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- RESPUESTAS ENCUESTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS respuestas_encuestas (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    encuesta_id VARCHAR(255) NOT NULL REFERENCES encuestas(id),
    usuario_id VARCHAR(255) REFERENCES users(id),
    respuestas JSON,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- COMENTARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS comentarios (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_contenido VARCHAR(50) NOT NULL,
    contenido_id VARCHAR(255) NOT NULL,
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    texto TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CONFIGURACIÓN SITIO
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion_sitio (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(255) UNIQUE,
    valor TEXT,
    tipo VARCHAR(255)
);

-- ============================================================
-- REGISTRO BÁSICO (Nivel 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS registro_basico (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
    alias VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REGISTRO CHAT (Nivel 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS registro_chat (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    foto VARCHAR(255),
    dni_numero VARCHAR(20) NOT NULL,
    dni_frente_url VARCHAR(255) NOT NULL,
    dni_posterior_url VARCHAR(255) NOT NULL,
    dni_fecha_caducidad DATE NOT NULL,
    numero_celular VARCHAR(20) NOT NULL,
    verificado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REGISTRO UBICACIÓN (Nivel 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS registro_ubicacion (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
    pais VARCHAR(255) NOT NULL,
    departamento VARCHAR(255) NOT NULL,
    distrito VARCHAR(255) NOT NULL,
    sector VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REGISTRO DIRECCIÓN (Nivel 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS registro_direccion (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
    direccion TEXT NOT NULL,
    mza_lote_numero VARCHAR(255),
    avenida_calle VARCHAR(255),
    gps_latitud REAL NOT NULL,
    gps_longitud REAL NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REGISTRO MARKETPLACE (Nivel 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS registro_marketplace (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
    nombre_local VARCHAR(255) NOT NULL,
    direccion_local TEXT NOT NULL,
    gps_local_latitud REAL NOT NULL,
    gps_local_longitud REAL NOT NULL,
    numero_ruc VARCHAR(20) NOT NULL,
    verificado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CREDENCIALES CONDUCTOR
-- ============================================================
CREATE TABLE IF NOT EXISTS credenciales_conductor (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
    brevette_numero VARCHAR(255),
    brevette_frente_url VARCHAR(255),
    brevette_posterior_url VARCHAR(255),
    brevette_fecha_inicio DATE,
    brevette_fecha_caducidad DATE,
    soat_numero VARCHAR(255),
    soat_frente_url VARCHAR(255),
    soat_posterior_url VARCHAR(255),
    soat_fecha_inicio DATE,
    soat_fecha_caducidad DATE,
    revision_tecnica_numero VARCHAR(255),
    revision_tecnica_frente_url VARCHAR(255),
    revision_tecnica_posterior_url VARCHAR(255),
    revision_tecnica_fecha_inicio DATE,
    revision_tecnica_fecha_caducidad DATE,
    credencial_conductor_numero VARCHAR(255),
    credencial_conductor_frente_url VARCHAR(255),
    credencial_conductor_posterior_url VARCHAR(255),
    credencial_conductor_fecha_inicio DATE,
    credencial_conductor_fecha_caducidad DATE,
    credencial_taxi_numero VARCHAR(255),
    credencial_taxi_frente_url VARCHAR(255),
    credencial_taxi_posterior_url VARCHAR(255),
    credencial_taxi_fecha_inicio DATE,
    credencial_taxi_fecha_caducidad DATE,
    verificado BOOLEAN DEFAULT false,
    tipo_servicio VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- EVENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_evento TIMESTAMP NOT NULL,
    hora_inicio VARCHAR(10),
    hora_fin VARCHAR(10),
    ubicacion TEXT,
    gps_latitud REAL,
    gps_longitud REAL,
    imagen_url VARCHAR(255),
    categoria VARCHAR(100),
    capacidad INTEGER,
    precio DECIMAL(10,2) DEFAULT 0,
    moneda VARCHAR(10) DEFAULT 'PEN',
    organizador_id VARCHAR(255) REFERENCES users(id),
    publicidad_id VARCHAR(255) REFERENCES publicidad(id),
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ASISTENTES EVENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS asistentes_evento (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id VARCHAR(255) NOT NULL REFERENCES eventos(id),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    estado VARCHAR(20) DEFAULT 'confirmado',
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(evento_id, usuario_id)
);

-- ============================================================
-- TIPOS DE MONEDA
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_moneda (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    simbolo VARCHAR(10) NOT NULL,
    es_principal BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TASAS DE CAMBIO
-- ============================================================
CREATE TABLE IF NOT EXISTS tasas_cambio (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    moneda_origen_id VARCHAR(255) NOT NULL REFERENCES tipos_moneda(id),
    moneda_destino_id VARCHAR(255) NOT NULL REFERENCES tipos_moneda(id),
    tasa REAL NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    actualizado_por_id VARCHAR(255) REFERENCES users(id)
);

-- ============================================================
-- CATEGORÍAS DE SERVICIO
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias_servicio (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SUBCATEGORÍAS DE SERVICIO
-- ============================================================
CREATE TABLE IF NOT EXISTS subcategorias_servicio (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id VARCHAR(255) NOT NULL REFERENCES categorias_servicio(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LOGOS SERVICIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS logos_servicios (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id VARCHAR(255) REFERENCES categorias_servicio(id),
    subcategoria_id VARCHAR(255) REFERENCES subcategorias_servicio(id),
    usuario_id VARCHAR(255) REFERENCES users(id),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    logo_url VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    horario TEXT,
    gps_latitud REAL,
    gps_longitud REAL,
    redes JSON,
    estado VARCHAR(20) DEFAULT 'activo',
    destacado BOOLEAN DEFAULT false,
    verificado BOOLEAN DEFAULT false,
    total_likes INTEGER DEFAULT 0,
    total_favoritos INTEGER DEFAULT 0,
    total_comentarios INTEGER DEFAULT 0,
    total_compartidos INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS SERVICIO
-- ============================================================
CREATE TABLE IF NOT EXISTS productos_servicio (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    logo_servicio_id VARCHAR(255) NOT NULL REFERENCES logos_servicios(id),
    codigo VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    precio_oferta DECIMAL(10,2),
    imagen_url VARCHAR(255),
    categoria VARCHAR(100),
    stock INTEGER,
    disponible BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_favoritos INTEGER DEFAULT 0,
    total_comentarios INTEGER DEFAULT 0,
    total_compartidos INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TRANSACCIONES SALDO
-- ============================================================
CREATE TABLE IF NOT EXISTS transacciones_saldo (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    tipo VARCHAR(50) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    saldo_anterior DECIMAL(10,2) DEFAULT 0,
    saldo_nuevo DECIMAL(10,2) DEFAULT 0,
    referencia_id VARCHAR(255),
    referencia_tipo VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'completado',
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MÉTODOS DE PAGO
-- ============================================================
CREATE TABLE IF NOT EXISTS metodos_pago (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) REFERENCES users(id),
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    numero_cuenta VARCHAR(100),
    cci VARCHAR(30),
    email VARCHAR(255),
    telefono VARCHAR(20),
    titular VARCHAR(200),
    moneda VARCHAR(10) DEFAULT 'PEN',
    es_plataforma BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    verificado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MONEDAS
-- ============================================================
CREATE TABLE IF NOT EXISTS monedas (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) NOT NULL,
    tasa_cambio_a_pen DECIMAL(10,4) DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    es_principal BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TASAS CAMBIO LOCALES (Cambistas)
-- ============================================================
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

-- ============================================================
-- CONFIGURACIÓN MONEDAS
-- ============================================================
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

-- ============================================================
-- SOLICITUDES SALDO (Recargas/Retiros)
-- ============================================================
CREATE TABLE IF NOT EXISTS solicitudes_saldo (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    tipo VARCHAR(20) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'PEN',
    metodo_pago_id VARCHAR(255) REFERENCES metodos_pago(id),
    metodo_pago_destino VARCHAR(255),
    comprobante VARCHAR(255),
    numero_operacion VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    aprobado_por VARCHAR(255) REFERENCES users(id),
    fecha_aprobacion TIMESTAMP,
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SALDOS USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS saldos_usuarios (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id) UNIQUE,
    saldo DECIMAL(12,2) DEFAULT 0 NOT NULL,
    moneda_preferida VARCHAR(10) DEFAULT 'PEN',
    total_ingresos DECIMAL(12,2) DEFAULT 0,
    total_egresos DECIMAL(12,2) DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PLANES MEMBRESÍA
-- ============================================================
CREATE TABLE IF NOT EXISTS planes_membresia (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_meses INTEGER NOT NULL,
    precio_normal DECIMAL(10,2) NOT NULL,
    precio_descuento DECIMAL(10,2),
    porcentaje_descuento INTEGER,
    beneficios JSON,
    productos_incluidos INTEGER DEFAULT 0,
    destacado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MEMBRESÍAS USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS membresias_usuarios (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    plan_id VARCHAR(255) NOT NULL REFERENCES planes_membresia(id),
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMP NOT NULL,
    estado VARCHAR(20) DEFAULT 'activa',
    productos_creados INTEGER DEFAULT 0,
    monto_total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    transaccion_id VARCHAR(255),
    renovacion_automatica BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CATEGORÍAS PRODUCTOS USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias_productos_usuario (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50),
    imagen_url VARCHAR(255),
    categoria_padre_id VARCHAR(255) REFERENCES categorias_productos_usuario(id),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS productos_usuario (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id VARCHAR(255) NOT NULL REFERENCES users(id),
    categoria_id VARCHAR(255) REFERENCES categorias_productos_usuario(id),
    subcategoria_id VARCHAR(255) REFERENCES categorias_productos_usuario(id),
    codigo VARCHAR(50),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    precio_oferta DECIMAL(10,2),
    moneda VARCHAR(10) DEFAULT 'PEN',
    imagenes JSON,
    stock INTEGER,
    disponible BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    gps_latitud REAL,
    gps_longitud REAL,
    direccion TEXT,
    costo_creacion DECIMAL(10,2) DEFAULT 0,
    likes INTEGER DEFAULT 0,
    favoritos INTEGER DEFAULT 0,
    compartidos INTEGER DEFAULT 0,
    vistas INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
SELECT 'Script completado exitosamente. Tablas creadas/actualizadas.' as resultado;
