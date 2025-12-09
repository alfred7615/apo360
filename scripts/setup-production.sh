#!/bin/bash
# ==================================================
# APO-360 - Script de configuración para PRODUCCIÓN (KVM)
# ==================================================

echo "🚀 Configurando entorno de PRODUCCIÓN..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró .env"
    echo "📝 Copia .env.production.template a .env y configura las variables"
    exit 1
fi

# Verificar variables críticas
source .env

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no configurado"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Error: Credenciales de Google OAuth no configuradas"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias de producción..."
npm ci --production=false

# Construir aplicación
echo "🔨 Construyendo aplicación..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la construcción"
    exit 1
fi

# Sincronizar base de datos (sin borrar datos)
echo "🗄️  Verificando esquema de base de datos..."
echo "⚠️  IMPORTANTE: Si pide borrar datos, selecciona 'No'"

echo ""
echo "✅ Configuración de producción completada"
echo "🎯 Ejecuta 'pm2 start ecosystem.config.js' para iniciar"
