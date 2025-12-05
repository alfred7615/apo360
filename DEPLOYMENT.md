# Guía de Despliegue - APO-360

## 1. Configurar Repositorio GitHub

### Paso 1: Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `apo360`
3. Privado o Público según prefieras
4. NO inicializar con README

### Paso 2: Conectar Replit con GitHub
En Replit, abre la terminal y ejecuta:

```bash
# Configurar git (solo primera vez)
git config --global user.email "tu-email@ejemplo.com"
git config --global user.name "Tu Nombre"

# Inicializar repositorio
git init
git add .
git commit -m "Versión inicial APO-360"

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/apo360.git
git branch -M main
git push -u origin main
```

### Paso 3: Configurar tu servidor KVM
En tu servidor (SSH):

```bash
cd /root
git clone https://github.com/TU_USUARIO/apo360.git apo360.net
cd apo360.net
npm install
```

---

## 2. Variables de Entorno (.env)

Crea el archivo `/root/apo360.net/.env`:

```env
# Base de datos PostgreSQL (Docker)
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/apo360
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=TU_CONTRASEÑA
PGDATABASE=apo360

# Sesión
SESSION_SECRET=genera_una_clave_segura_aqui_32_caracteres

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_contraseña_app

# URL base
BASE_URL=https://apo360.net
NODE_ENV=production
PORT=5000
```

---

## 3. Configurar PM2

### Instalar PM2:
```bash
npm install -g pm2
```

### Crear archivo ecosystem.config.js (ya incluido en el proyecto)

### Comandos PM2:
```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs apo360

# Reiniciar
pm2 restart apo360

# Detener
pm2 stop apo360

# Configurar inicio automático
pm2 save
pm2 startup
```

---

## 4. Configurar Nginx

### Instalar Nginx:
```bash
apt update
apt install nginx -y
```

### Crear configuración (ya incluido en el proyecto):
```bash
cp /root/apo360.net/nginx.conf /etc/nginx/sites-available/apo360
ln -s /etc/nginx/sites-available/apo360 /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Instalar certificado SSL (Let's Encrypt):
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d apo360.net -d www.apo360.net
```

---

## 5. Script de Actualización

Cuando hagas cambios en Replit:

### En Replit:
```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

### En tu servidor KVM:
```bash
cd /root/apo360.net
./deploy.sh
```

O manualmente:
```bash
git pull origin main
npm install
npm run build
npm run db:push
pm2 restart apo360
```

---

## 6. Comandos Útiles

### Base de datos:
```bash
# Sincronizar esquema (NO borra datos)
npm run db:push

# Ver base de datos
docker exec -it postgres psql -U postgres -d apo360
```

### Logs:
```bash
# Logs de la aplicación
pm2 logs apo360

# Logs de Nginx
tail -f /var/log/nginx/apo360.error.log
```

### Reiniciar servicios:
```bash
pm2 restart apo360
systemctl restart nginx
docker restart postgres
```

---

## 7. Respaldos

### Respaldar base de datos:
```bash
docker exec postgres pg_dump -U postgres apo360 > backup_$(date +%Y%m%d).sql
```

### Restaurar base de datos:
```bash
cat backup_FECHA.sql | docker exec -i postgres psql -U postgres apo360
```
