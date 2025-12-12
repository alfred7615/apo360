# PROCESO DE SINCRONIZACIÓN DE BASE DE DATOS

## Última actualización: 12/12/2025

---

## ARQUITECTURA DE BASES DE DATOS

| Ambiente | Base de Datos | Conexión |
|----------|---------------|----------|
| **Desarrollo (Replit)** | Neon PostgreSQL | Automática via DATABASE_URL |
| **Producción (Hostinger)** | PostgreSQL local | postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod |

### IMPORTANTE
- Las bases de datos son **completamente separadas**
- **Desarrollo**: Datos de prueba (ficticios)
- **Producción**: Datos reales (usuarios, transacciones, etc.)
- La **estructura** debe ser idéntica, los **datos** son diferentes

---

## FLUJO DE TRABAJO ESTÁNDAR

```
1. Desarrollo (Replit)
   ↓
2. Actualizar schema.ts
   ↓
3. npm run db:push (actualiza Neon automático)
   ↓
4. Probar en desarrollo
   ↓
5. Commit + Push a GitHub
   ↓
6. En Hostinger: git pull
   ↓
7. Ejecutar SQL de actualización en producción
   ↓
8. pm2 restart apo360
```

---

## PASO A PASO PARA SINCRONIZAR

### 1. PREPARAR EN DESARROLLO (Replit)

Si agregas columnas o tablas nuevas:

```bash
# Esto actualiza la BD de desarrollo automáticamente
npm run db:push
```

### 2. SUBIR A GITHUB

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

### 3. ACTUALIZAR EN HOSTINGER

```bash
# Conectar al VPS
ssh root@tu-ip-hostinger

# Ir al directorio del proyecto
cd /var/www/apo360.net

# Descargar cambios
git pull origin main

# Reconstruir
npm run build
```

### 4. ACTUALIZAR BASE DE DATOS PRODUCCIÓN

#### Opción A: Ejecutar script completo (primera vez o sincronización total)

```bash
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable" -f scripts/schema-produccion.sql
```

#### Opción B: Agregar columnas específicas (actualizaciones menores)

```bash
# Conectar a PostgreSQL
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable"

# Ejecutar ALTER TABLE específicos
ALTER TABLE nombre_tabla ADD COLUMN IF NOT EXISTS nueva_columna TIPO;

# Salir
\q
```

### 5. REINICIAR APLICACIÓN

```bash
pm2 restart apo360
pm2 logs apo360 --lines 30
```

---

## CASOS COMUNES

### Agregar nueva columna a tabla existente

**En schema.ts:**
```typescript
export const usuarios = pgTable("users", {
  // ... columnas existentes ...
  nuevaColumna: varchar("nueva_columna"), // <- Nueva
});
```

**SQL para Hostinger:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS nueva_columna VARCHAR(255);
```

### Agregar nueva tabla

**En schema.ts:**
```typescript
export const nuevaTabla = pgTable("nueva_tabla", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // ... columnas ...
});
```

**SQL para Hostinger:**
```sql
CREATE TABLE IF NOT EXISTS nueva_tabla (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... columnas ...
);
```

### Eliminar tabla (PELIGROSO - pérdida de datos)

**SQL para Hostinger:**
```sql
-- ADVERTENCIA: Esto elimina todos los datos de la tabla
DROP TABLE IF EXISTS nombre_tabla CASCADE;
```

---

## COMANDOS ÚTILES

### Ver estructura de una tabla
```sql
\d nombre_tabla
```

### Ver todas las tablas
```sql
\dt
```

### Ver columnas de una tabla
```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'nombre_tabla';
```

### Comparar tablas desarrollo vs producción
```bash
# En desarrollo (Replit), exportar lista de tablas
# En producción (Hostinger), ejecutar \dt y comparar
```

---

## ARCHIVO DE REFERENCIA

El archivo **`scripts/schema-produccion.sql`** contiene:
- Todas las tablas del sistema
- Estructura completa y actualizada
- Se puede ejecutar múltiples veces (usa IF NOT EXISTS)

**Última generación:** 12/12/2025

---

## REGLAS DE ORO

1. **NUNCA modificar datos de producción** sin backup
2. **SIEMPRE usar IF NOT EXISTS** para tablas nuevas
3. **SIEMPRE usar IF NOT EXISTS** para columnas nuevas
4. **PROBAR en desarrollo** antes de subir a producción
5. **DOCUMENTAR** cada cambio de estructura
