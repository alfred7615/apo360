# APO-360 - Guía de Despliegue en apo360.net

## 📋 Requisitos Previos

1. **Servidor web con Node.js** (v18+)
2. **PostgreSQL** (con base de datos creada)
3. **SSL/HTTPS** configurado
4. **Acceso SSH** al servidor

## 🚀 Proceso de Despliegue

### Paso 1: Preparar la aplicación

```bash
# Instalar dependencias
npm install

# Compilar el frontend
npm run build

# Migrar la base de datos
npm run db:push
```

### Paso 2: Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:contraseña@host:5432/segapo

# Sesión
SESSION_SECRET=tu-secreto-seguro-aqui

# SMTP para sugerencias
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aapomayta15@gmail.com
SMTP_PASSWORD=frog svje eiih jfga

# Producción
NODE_ENV=production
PORT=5000
```

### Paso 3: Subir archivos al servidor

**Archivos esenciales a subir:**

```
/dist/public/           → Todo el contenido compilado
/public/assets/         → Imágenes y archivos MP3
/node_modules/          → Dependencias (o instalar localmente)
/server/                → Backend
/shared/                → Código compartido
/.env                   → Variables de entorno
/package.json           → Configuración
/tsconfig.json          → TypeScript
```

**NO subir:**
- `.git/`
- `node_modules/` (instalar en servidor)
- `.env.local` o archivos locales
- `*.log`

### Paso 4: Iniciar la aplicación

```bash
# En el servidor
cd /ruta/a/segapo

# Instalar dependencias
npm install --production

# Iniciar (opción 1: directamente)
npm run start

# Opción 2: con PM2 (recomendado)
pm2 start npm --name "segapo" -- run start
pm2 save
pm2 startup
```

### Paso 5: Configurar servidor web (Nginx/Apache)

#### Con Nginx (recomendado):

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tacnafm.com www.tacnafm.com;

    # SSL
    ssl_certificate /ruta/al/certificado.crt;
    ssl_certificate_key /ruta/a/la/clave.key;

    # Proxy a Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:5000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redireccionar HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tacnafm.com www.tacnafm.com;
    return 301 https://$server_name$request_uri;
}
```

## 📁 Estructura de Carpetas de Assets

Las imágenes y archivos MP3 deben estar en:

```
/public/assets/
├── img/
│   ├── carrusel/      # Logos publicitarios (carrusel horizontal)
│   │   ├── logo1.png
│   │   ├── logo2.png
│   │   └── ...
│   ├── galeria/       # Logos de servicios (circulares)
│   │   ├── servicio1.png
│   │   ├── servicio2.png
│   │   └── ...
│   └── servicios/     # Imágenes adicionales
│       └── ...
└── mp3/
    ├── lista 1/       # Rock Moderna
    │   ├── cancion1.mp3
    │   ├── cancion2.mp3
    │   └── ...
    ├── lista 2/       # Cumbia
    ├── lista 3/       # Éxitos Variado
    ├── lista 4/       # Mix Variado
    └── lista 5/       # Romántica
```

## 🗄️ Base de Datos

### Crear base de datos en PostgreSQL:

```sql
CREATE DATABASE segapo;
CREATE USER segapo_user WITH PASSWORD 'contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE segapo TO segapo_user;
```

### Migrar esquema:

```bash
npm run db:push
```

Esto creará todas las tablas necesarias automáticamente.

## 🔒 Seguridad

1. **HTTPS obligatorio** - Redirige HTTP a HTTPS
2. **Variables de entorno seguras** - Nunca commitear `.env`
3. **Credenciales SMTP** - Usar contraseña de aplicación de Gmail
4. **Firewalls** - Bloquear puertos innecesarios
5. **Actualizaciones** - Mantener Node.js y dependencias actualizadas

## ✅ Verificación Post-Despliegue

```bash
# Verificar que el servidor está corriendo
curl -I https://tacnafm.com

# Verificar WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://tacnafm.com/ws

# Verificar API
curl https://tacnafm.com/api/publicidad
curl https://tacnafm.com/api/servicios
curl https://tacnafm.com/api/radios-online
```

## 🛠️ Mantenimiento

### Backup de base de datos:
```bash
pg_dump -U segapo_user -d segapo > backup_$(date +%Y%m%d).sql
```

### Reiniciar la aplicación (con PM2):
```bash
pm2 restart segapo
pm2 logs segapo
```

### Actualizar la aplicación:
```bash
git pull origin main
npm install
npm run build
npm run db:push  # Si hay cambios de schema
pm2 restart segapo
```

## 📞 Soporte

Para problemas durante el despliegue:
1. Revisar logs: `pm2 logs segapo`
2. Verificar conectividad a base de datos
3. Verificar permisos de carpetas (755 para públicas)
4. Verificar puertos abiertos: `netstat -tlnp | grep 5000`

---

**Última actualización**: Noviembre 2024
**Versión**: 1.0
