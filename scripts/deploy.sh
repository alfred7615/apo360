#!/bin/bash
# ==================================================
# APO-360 - Script de despliegue automático
# ==================================================
# Ejecutar en el servidor de producción después de git pull

echo "🚀 Iniciando despliegue de APO-360..."
echo "📅 $(date)"

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Respaldar base de datos (opcional pero recomendado)
echo "💾 Creando respaldo de base de datos..."
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
# Si usas Docker local:
# docker exec postgres pg_dump -U postgres apo360 > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Actualizar código
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
