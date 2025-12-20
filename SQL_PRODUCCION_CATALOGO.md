# SQL para Sincronizar Tablas de Catálogo en Producción (Hostinger)

## Ejecutar en PostgreSQL de Producción

```bash
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable"
```

## SQL Completo para Tablas de Catálogo

```sql
-- ============================================================
-- TABLA: CATÁLOGOS LOCALES (Tiendas/Negocios de usuarios)
-- ============================================================
CREATE TABLE IF NOT EXISTS catalogos_locales (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    usuario_id VARCHAR(255) NOT NULL REFERENCES usuarios(id),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    logo_url VARCHAR(255),
    banner_url VARCHAR(255),
    direccion TEXT,
    gps_latitud REAL,
    gps_longitud REAL,
    telefono VARCHAR(20),
    whatsapp VARCHAR(20),
    horario VARCHAR(200),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    tiktok VARCHAR(255),
    youtube VARCHAR(255),
    pinterest VARCHAR(255),
    pagina_web VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    verificado BOOLEAN DEFAULT false,
    total_favoritos INTEGER DEFAULT 0,
    total_vistas INTEGER DEFAULT 0,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: CATEGORÍAS DE CATÁLOGO (Ej: Pizzas Clásicas, Bebidas)
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias_catalogo (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    catalogo_id VARCHAR(255) NOT NULL REFERENCES catalogos_locales(id) ON DELETE CASCADE,
    codigo VARCHAR(10) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url VARCHAR(255),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    etiqueta_precio_1 VARCHAR(50) DEFAULT 'Personal',
    etiqueta_precio_2 VARCHAR(50) DEFAULT 'Mediana',
    etiqueta_precio_3 VARCHAR(50) DEFAULT 'Familiar',
    etiqueta_precio_4 VARCHAR(50) DEFAULT 'Extra',
    habilitar_precio_1 BOOLEAN DEFAULT true,
    habilitar_precio_2 BOOLEAN DEFAULT true,
    habilitar_precio_3 BOOLEAN DEFAULT true,
    habilitar_precio_4 BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: ITEMS DE CATÁLOGO / PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS items_catalogo (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    catalogo_id VARCHAR(255) NOT NULL REFERENCES catalogos_locales(id) ON DELETE CASCADE,
    categoria_id VARCHAR(255) REFERENCES categorias_catalogo(id) ON DELETE SET NULL,
    codigo VARCHAR(10),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_1 DECIMAL(10,2),
    precio_2 DECIMAL(10,2),
    precio_3 DECIMAL(10,2),
    precio_4 DECIMAL(10,2),
    precio DECIMAL(10,2),
    precio_oferta DECIMAL(10,2),
    imagen_url VARCHAR(255),
    ingredientes TEXT,
    tiempo_preparacion VARCHAR(50),
    disponible BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    favoritos INTEGER DEFAULT 0,
    compartidos INTEGER DEFAULT 0,
    vistas INTEGER DEFAULT 0,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLA: FAVORITOS DE PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS favoritos_productos (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    usuario_id VARCHAR(255) NOT NULL REFERENCES usuarios(id),
    producto_usuario_id VARCHAR(255),
    item_catalogo_id VARCHAR(255) REFERENCES items_catalogo(id) ON DELETE CASCADE,
    tipo_producto VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_favorito_item UNIQUE (usuario_id, item_catalogo_id)
);

-- ============================================================
-- TABLA: INTERACCIONES DE PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS interacciones_productos (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    usuario_id VARCHAR(255) NOT NULL REFERENCES usuarios(id),
    producto_usuario_id VARCHAR(255),
    item_catalogo_id VARCHAR(255) REFERENCES items_catalogo(id) ON DELETE CASCADE,
    tipo_interaccion VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_catalogos_usuario ON catalogos_locales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_categorias_catalogo ON categorias_catalogo(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_items_catalogo ON items_catalogo(catalogo_id);
CREATE INDEX IF NOT EXISTS idx_items_categoria ON items_catalogo(categoria_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos_productos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_usuario ON interacciones_productos(usuario_id);

-- ============================================================
-- VERIFICAR TABLAS CREADAS
-- ============================================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('catalogos_locales', 'categorias_catalogo', 'items_catalogo', 'favoritos_productos', 'interacciones_productos')
ORDER BY table_name;
```

## Notas Importantes

1. **Ejecutar después de git pull y npm run build** en Hostinger
2. Las tablas tienen ON DELETE CASCADE para mantener integridad referencial
3. Los índices mejoran el rendimiento de consultas frecuentes
4. El sistema de catálogo está relacionado con el plan de membresía del usuario

## Comandos de Despliegue Completos

```bash
# En Hostinger SSH
cd /var/www/apo360.net
git pull origin main
npm install
npm run build
pm2 restart apo360

# Luego ejecutar SQL en PostgreSQL
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable" -f SQL_PRODUCCION_CATALOGO.sql
```
