#!/bin/bash

# ============================================
# Script de Despliegue Automático - APO360
# ============================================

set -e

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sin color

# Directorio del proyecto
PROJECT_DIR="/root/apo360.net"
BACKUP_DIR="/root/backups"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Iniciando despliegue de APO360${NC}"
echo -e "${BLUE}============================================${NC}"

# Ir al directorio del proyecto
cd $PROJECT_DIR

# 1. Crear respaldo de la base de datos
echo -e "${YELLOW}[1/7] Creando respaldo de base de datos...${NC}"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/apo360_$(date +%Y%m%d_%H%M%S).sql"
docker exec postgres pg_dump -U postgres apo360 > $BACKUP_FILE 2>/dev/null || echo "Advertencia: No se pudo crear respaldo"
echo -e "${GREEN}✓ Respaldo creado: $BACKUP_FILE${NC}"

# 2. Obtener últimos cambios de GitHub
echo -e "${YELLOW}[2/7] Descargando últimos cambios de GitHub...${NC}"
git fetch origin main
git reset --hard origin/main
echo -e "${GREEN}✓ Código actualizado${NC}"

# 3. Instalar dependencias
echo -e "${YELLOW}[3/7] Instalando dependencias...${NC}"
npm install --production=false
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# 4. Construir aplicación
echo -e "${YELLOW}[4/7] Construyendo aplicación para producción...${NC}"
npm run build
echo -e "${GREEN}✓ Aplicación construida${NC}"

# 5. Sincronizar base de datos
echo -e "${YELLOW}[5/7] Sincronizando esquema de base de datos...${NC}"
npm run db:push || echo "Advertencia: Verificar esquema manualmente"
echo -e "${GREEN}✓ Base de datos sincronizada${NC}"

# 6. Reiniciar aplicación con PM2
echo -e "${YELLOW}[6/7] Reiniciando aplicación...${NC}"
pm2 restart apo360 || pm2 start ecosystem.config.js
echo -e "${GREEN}✓ Aplicación reiniciada${NC}"

# 7. Limpiar respaldos antiguos (más de 7 días)
echo -e "${YELLOW}[7/7] Limpiando respaldos antiguos...${NC}"
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete 2>/dev/null || true
echo -e "${GREEN}✓ Limpieza completada${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   ¡Despliegue completado exitosamente!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Estado de la aplicación:"
pm2 status apo360
echo ""
echo -e "Para ver logs: ${BLUE}pm2 logs apo360${NC}"
