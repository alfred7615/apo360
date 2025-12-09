#!/bin/bash
# ==================================================
# APO-360 - Script de despliegue automático
# ==================================================
# Ejecutar en el servidor de producción (Hostinger VPS)
# Directorio: /var/www/apo360.net

echo "🚀 Iniciando despliegue de APO-360..."
echo "📅 $(date)"

# Directorio de producción
PROD_DIR="/var/www/apo360.net"
BACKUP_DIR="/root/backups"

# Verificar directorio
cd $PROD_DIR || { echo "❌ No se encontró $PROD_DIR"; exit 1; }

if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json en $PROD_DIR"
    exit 1
fi

# Respaldar base de datos
echo "💾 Creando respaldo de base de datos..."
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump apo360_prod > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo "⚠️  Backup omitido"

# Actualizar código desde GitHub
echo "📥 Actualizando código desde Git..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Error al actualizar código"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --production=false

# Construir aplicación
echo "🔨 Construyendo aplicación..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la construcción"
    exit 1
fi

# Sincronizar base de datos (sin borrar datos)
echo "🗄️  Sincronizando esquema de base de datos..."
npm run db:push 2>/dev/null || echo "⚠️  Revisar migración manualmente"

# Reiniciar aplicación
echo "🔄 Reiniciando aplicación..."
pm2 restart apo360 --update-env

if [ $? -ne 0 ]; then
    echo "⚠️  PM2 no pudo reiniciar. Intentando iniciar..."
    pm2 start ecosystem.config.js
fi

# Verificar estado
echo "📊 Estado de la aplicación:"
pm2 status apo360

echo ""
echo "✅ Despliegue completado exitosamente"
echo "🌐 Visita https://apo360.net para verificar"
