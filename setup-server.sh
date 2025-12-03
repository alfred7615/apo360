#!/bin/bash

# ============================================
# Script de Configuración Inicial - APO360
# Ejecutar solo UNA VEZ en servidor nuevo
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Configuración inicial de APO360${NC}"
echo -e "${BLUE}============================================${NC}"

PROJECT_DIR="/root/apo360.net"

# 1. Crear directorios necesarios
echo -e "${YELLOW}[1/6] Creando directorios...${NC}"
mkdir -p $PROJECT_DIR/logs
mkdir -p $PROJECT_DIR/uploads
mkdir -p /root/backups
echo -e "${GREEN}✓ Directorios creados${NC}"

# 2. Instalar PM2 globalmente
echo -e "${YELLOW}[2/6] Instalando PM2...${NC}"
npm install -g pm2
echo -e "${GREEN}✓ PM2 instalado${NC}"

# 3. Instalar Nginx
echo -e "${YELLOW}[3/6] Instalando Nginx...${NC}"
apt update
apt install -y nginx
echo -e "${GREEN}✓ Nginx instalado${NC}"

# 4. Configurar Nginx
echo -e "${YELLOW}[4/6] Configurando Nginx...${NC}"
cp $PROJECT_DIR/nginx.conf /etc/nginx/sites-available/apo360
ln -sf /etc/nginx/sites-available/apo360 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✓ Nginx configurado${NC}"

# 5. Instalar Certbot para SSL
echo -e "${YELLOW}[5/6] Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓ Certbot instalado${NC}"

# 6. Configurar PM2 para inicio automático
echo -e "${YELLOW}[6/6] Configurando inicio automático...${NC}"
cd $PROJECT_DIR
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo -e "${GREEN}✓ PM2 configurado para inicio automático${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   ¡Configuración inicial completada!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}Siguientes pasos:${NC}"
echo -e "1. Configurar DNS de apo360.net apuntando a este servidor"
echo -e "2. Ejecutar: ${BLUE}certbot --nginx -d apo360.net -d www.apo360.net${NC}"
echo -e "3. Verificar: ${BLUE}https://apo360.net${NC}"
echo ""
echo -e "Comandos útiles:"
echo -e "  Ver estado:    ${BLUE}pm2 status${NC}"
echo -e "  Ver logs:      ${BLUE}pm2 logs apo360${NC}"
echo -e "  Actualizar:    ${BLUE}./deploy.sh${NC}"
