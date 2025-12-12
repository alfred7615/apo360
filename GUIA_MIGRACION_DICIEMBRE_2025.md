# GUÍA DE MIGRACIÓN - APO-360
## Diciembre 2025 - Sistema de Roles Jerárquico

---

## RESUMEN DE CAMBIOS

### Nuevas Tablas de Base de Datos:
1. `categorias_roles` - Categorías principales (Ej: "Comisaría Alto Alianza")
2. `subcategorias_roles` - Subcategorías (Ej: "Jefatura", "Operaciones")
3. `usuario_roles` - Relación usuarios-roles con jerarquía completa
4. `solicitudes_roles` - Solicitudes de roles pendientes de aprobación

### Archivos Críticos Actualizados:
- `server/routes.ts` - Nuevos endpoints de gestión de roles
- `server/storage.ts` - Métodos de almacenamiento
- `client/src/pages/admin/gestiones/gestion-categorias-rol.tsx` - Panel de gestión
- `shared/schema.ts` - Esquemas de Drizzle

---

## PASO 1: COMMIT Y PUSH A GITHUB (Desde Replit)

### 1.1 Verificar cambios pendientes
```bash
git status
```

### 1.2 Agregar todos los cambios
```bash
git add .
```

### 1.3 Crear commit con mensaje descriptivo
```bash
git commit -m "Sistema de roles jerárquico completo - Dic 2025

- Nuevas tablas: categorias_roles, subcategorias_roles, usuario_roles, solicitudes_roles
- Endpoints para gestión de usuarios por subcategoría
- Modal de asignación múltiple de usuarios
- Sistema de notificaciones por asignación de rol
- Corrección de campos firstName/lastName en storage"
```

### 1.4 Push a GitHub
```bash
git push origin main
```

---

## PASO 2: ACTUALIZAR CÓDIGO EN HOSTINGER (Via SSH)

### 2.1 Conectar por SSH a Hostinger
```bash
ssh usuario@IP_SERVIDOR -p PUERTO
```

### 2.2 Navegar al directorio del proyecto
```bash
cd /home/apo360net/htdocs/apo360.net
```

### 2.3 Pull de los cambios desde GitHub
```bash
git fetch origin
git pull origin main
```

### 2.4 Instalar dependencias nuevas (si hay)
```bash
npm install
```

---

## PASO 3: EJECUTAR SQL EN BASE DE DATOS DE PRODUCCIÓN

### 3.1 Conectar a PostgreSQL en Hostinger
```bash
psql -U tu_usuario -d tu_base_de_datos -h localhost
```

### 3.2 Ejecutar el script SQL completo
Copiar y pegar el contenido del archivo `scripts/sistema-roles.sql` o ejecutar:

```bash
psql -U tu_usuario -d tu_base_de_datos -h localhost -f scripts/sistema-roles.sql
```

### 3.3 SCRIPT SQL RESUMIDO (Solo tablas sin datos de prueba):

```sql
-- ============================================================
-- TABLAS DEL SISTEMA DE ROLES JERÁRQUICO
-- ============================================================

-- 1. CATEGORÍAS DE ROLES
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

-- 2. SUBCATEGORÍAS DE ROLES
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

-- 3. ACTUALIZAR USUARIO_ROLES (agregar columnas nuevas si no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'estado') THEN
        ALTER TABLE usuario_roles ADD COLUMN estado VARCHAR(20) DEFAULT 'activo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'asignado_por') THEN
        ALTER TABLE usuario_roles ADD COLUMN asignado_por VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'fecha_asignacion') THEN
        ALTER TABLE usuario_roles ADD COLUMN fecha_asignacion TIMESTAMP DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'fecha_vencimiento') THEN
        ALTER TABLE usuario_roles ADD COLUMN fecha_vencimiento TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'notas') THEN
        ALTER TABLE usuario_roles ADD COLUMN notas TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuario_roles' AND column_name = 'updated_at') THEN
        ALTER TABLE usuario_roles ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 4. SOLICITUDES DE ROLES
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

-- 5. ÍNDICES PARA RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_categorias_roles_rol ON categorias_roles(rol);
CREATE INDEX IF NOT EXISTS idx_categorias_roles_activo ON categorias_roles(activo);
CREATE INDEX IF NOT EXISTS idx_subcategorias_roles_categoria ON subcategorias_roles(categoria_rol_id);
CREATE INDEX IF NOT EXISTS idx_subcategorias_roles_activo ON subcategorias_roles(activo);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario ON usuario_roles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles(rol);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_estado ON usuario_roles(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_roles_usuario ON solicitudes_roles(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_roles_estado ON solicitudes_roles(estado);
```

### 3.4 Verificar que las tablas se crearon correctamente
```sql
SELECT 'Categorías:' as tabla, COUNT(*) as total FROM categorias_roles
UNION ALL
SELECT 'Subcategorías:', COUNT(*) FROM subcategorias_roles
UNION ALL
SELECT 'Usuario Roles:', COUNT(*) FROM usuario_roles
UNION ALL
SELECT 'Solicitudes:', COUNT(*) FROM solicitudes_roles;
```

---

## PASO 4: REINICIAR APLICACIÓN EN HOSTINGER

### 4.1 Reiniciar con PM2
```bash
pm2 restart apo360
```

### 4.2 Ver logs para verificar que arrancó correctamente
```bash
pm2 logs apo360 --lines 50
```

### 4.3 Verificar que la aplicación responde
```bash
curl -I https://apo360.net
```

---

## PASO 5: VERIFICACIÓN FINAL

### 5.1 Probar en el navegador:
1. Ir a `https://apo360.net`
2. Iniciar sesión como super_admin
3. Ir a Panel Admin → Gestiones → Categorías de Rol
4. Verificar que se muestran las categorías y subcategorías
5. Probar crear una nueva categoría
6. Probar asignar usuarios a subcategorías

### 5.2 Endpoints a verificar:
- GET `/api/categorias-rol` - Lista de categorías
- GET `/api/subcategorias-rol` - Lista de subcategorías
- GET `/api/usuarios-basico` - Lista de usuarios para asignación
- POST `/api/subcategorias-rol/:id/usuarios` - Asignar usuarios

---

## ARCHIVOS CRÍTICOS A REVISAR

| Archivo | Descripción |
|---------|-------------|
| `server/routes.ts` | Endpoints de API |
| `server/storage.ts` | Métodos de base de datos |
| `shared/schema.ts` | Definición de tablas Drizzle |
| `client/src/pages/admin/gestiones/gestion-categorias-rol.tsx` | UI del panel admin |
| `scripts/sistema-roles.sql` | Script SQL completo |

---

## TROUBLESHOOTING

### Error: "Table already exists"
Los scripts usan `CREATE TABLE IF NOT EXISTS`, así que no debería dar error.

### Error: "Column does not exist"
Ejecutar la sección de `ALTER TABLE` del script para agregar columnas faltantes.

### Error: "Foreign key violation"
Asegurarse de que existan usuarios en la tabla `users` antes de asignar roles.

### La aplicación no arranca
1. Revisar logs: `pm2 logs apo360 --lines 100`
2. Verificar variables de entorno
3. Verificar conexión a base de datos

---

## CONTACTO
Para problemas durante la migración, revisar los logs del servidor y la consola del navegador.
