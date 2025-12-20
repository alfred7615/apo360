# Actualización: Etiquetas de Precios Personalizables por Producto

## Fecha: 20 de Diciembre 2025

---

## Cambios Realizados

### 1. Base de Datos - Nuevas Columnas en items_catalogo
```sql
etiqueta_precio_1 VARCHAR(50) DEFAULT 'Personal'
etiqueta_precio_2 VARCHAR(50) DEFAULT 'Mediana'
etiqueta_precio_3 VARCHAR(50) DEFAULT 'Familiar'
etiqueta_precio_4 VARCHAR(50) DEFAULT 'Extra'
```

### 2. Frontend - Inputs Editables
Los campos de etiquetas ahora son claramente editables con borde visible.

### 3. Visualización Corregida
Los productos ahora muestran todos los precios configurados (precio1-4) con sus etiquetas personalizadas.

---

## PASO 1: Actualizar Replit (Ya completado)

Los cambios ya están aplicados en Replit. La base de datos de desarrollo ya tiene las nuevas columnas.

---

## PASO 2: Subir cambios a GitHub

```bash
# Ejecutar en terminal de Replit
git add .
git commit -m "feat: Etiquetas de precios personalizables por producto"
git push origin main
```

---

## PASO 3: Conectar a Hostinger VPS

```bash
# Desde tu computadora local con SSH
ssh root@apo360.net

# O usando la IP directa si es necesario
# ssh root@<IP_DEL_SERVIDOR>
```

---

## PASO 4: Actualizar código en Hostinger

```bash
# Navegar al directorio del proyecto
cd /var/www/apo360.net

# Traer los cambios de GitHub
git pull origin main

# Instalar dependencias (si hay nuevas)
npm install

# Compilar el proyecto
npm run build

# Reiniciar PM2
pm2 restart apo360
pm2 save
```

---

## PASO 5: Actualizar Base de Datos en Hostinger

```bash
# Conectar a PostgreSQL
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable"
```

### Ejecutar este SQL:
```sql
-- Agregar columnas de etiquetas de precio a items_catalogo
ALTER TABLE items_catalogo 
ADD COLUMN IF NOT EXISTS etiqueta_precio_1 VARCHAR(50) DEFAULT 'Personal',
ADD COLUMN IF NOT EXISTS etiqueta_precio_2 VARCHAR(50) DEFAULT 'Mediana',
ADD COLUMN IF NOT EXISTS etiqueta_precio_3 VARCHAR(50) DEFAULT 'Familiar',
ADD COLUMN IF NOT EXISTS etiqueta_precio_4 VARCHAR(50) DEFAULT 'Extra';

-- Verificar que las columnas existen
\d items_catalogo
```

Salir de psql:
```sql
\q
```

---

## PASO 6: Verificar funcionamiento

1. Abrir https://apo360.net
2. Ir a Panel de Usuario > Mi Tienda Online
3. Crear o editar un producto
4. Verificar que las etiquetas de precios son editables
5. Guardar y verificar que se muestran correctamente

---

## Resumen de Comandos (Copiar/Pegar)

### En Hostinger (Todo en uno):
```bash
cd /var/www/apo360.net && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart apo360 && \
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable" -c "ALTER TABLE items_catalogo ADD COLUMN IF NOT EXISTS etiqueta_precio_1 VARCHAR(50) DEFAULT 'Personal', ADD COLUMN IF NOT EXISTS etiqueta_precio_2 VARCHAR(50) DEFAULT 'Mediana', ADD COLUMN IF NOT EXISTS etiqueta_precio_3 VARCHAR(50) DEFAULT 'Familiar', ADD COLUMN IF NOT EXISTS etiqueta_precio_4 VARCHAR(50) DEFAULT 'Extra';"
```

---

## Archivos Modificados

1. `shared/schema.ts` - Columnas etiquetaPrecio1-4 agregadas
2. `client/src/components/LocalComercialPanel.tsx` - Inputs de etiquetas editables
3. `client/src/components/SeccionLocalesComerciales.tsx` - Visualización de precios múltiples
4. `SQL_PRODUCCION_CATALOGO.md` - SQL actualizado para producción
