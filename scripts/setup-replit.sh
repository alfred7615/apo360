#!/bin/bash
# ==================================================
# APO-360 - Script de configuración para DESARROLLO (Replit)
# ==================================================

echo "🚀 Configurando entorno de DESARROLLO (Replit)..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  No se encontró .env"
    echo "📝 Copia .env.replit a .env y configura las variables"
    exit 1
fi

# Verificar conexión a base de datos
echo "🔍 Verificando conexión a base de datos..."
npm run db:push 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Base de datos sincronizada"
else
    echo "⚠️  Error sincronizando base de datos. Verifica DATABASE_URL"
fi

echo ""
echo "✅ Configuración de desarrollo completada"
echo "🎯 Ejecuta 'npm run dev' para iniciar el servidor"
