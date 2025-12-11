# APO-360 - Documentación Técnica Completa

## Fecha de actualización: 11 de Diciembre 2025

---

## 1. INFORMACIÓN GENERAL DEL PROYECTO

### Descripción
APO-360 es una plataforma web de seguridad y servicios comunitarios para Tacna, Perú. Incluye chat en tiempo real, botón de pánico, taxi, delivery, publicidad local, y panel de administración.

### URLs
- **Desarrollo (Replit)**: https://[repl-name].replit.dev
- **Producción**: https://apo360.net
- **Repositorio GitHub**: https://github.com/alfred7615/apo360.git

### Credenciales Admin Producción
- Email: aapomayta15@gmail.com
- Password: Admin123

---

## 2. ARQUITECTURA DEL SISTEMA

### Stack Tecnológico

| Componente | Desarrollo (Replit) | Producción (Hostinger) |
|------------|---------------------|------------------------|
| Frontend | React 18 + Vite | Build estático |
| Backend | Express.js + TypeScript | Node.js + PM2 |
| Base de Datos | Neon PostgreSQL | PostgreSQL Local |
| Autenticación | Replit Auth | Email/Password (AUTH_MODE=basic) |
| Servidor Web | Vite Dev Server | Nginx + PM2 |
| Real-time | Socket.io | Socket.io |

### Librerías Principales
- **Frontend**: React, TailwindCSS, Shadcn UI, Wouter, TanStack Query, Framer Motion
- **Backend**: Express, Drizzle ORM, Multer, Passport, Socket.io
- **Base de Datos**: PostgreSQL con Drizzle ORM

---

## 3. ESTRUCTURA DE DIRECTORIOS

### Replit (Desarrollo)
```
/home/runner/workspace/
├── client/                    # Frontend React
│   └── src/
│       ├── components/        # Componentes React
│       ├── pages/             # Páginas de la aplicación
│       ├── hooks/             # Custom hooks
│       └── lib/               # Utilidades
├── server/                    # Backend Express
│   ├── routes.ts              # Rutas de API
│   ├── storage.ts             # Interfaz de almacenamiento
│   ├── db.ts                  # Conexión a base de datos
│   ├── uploadConfig.ts        # Configuración de uploads
│   └── uploadConfigByEndpoint.ts  # Uploads por endpoint
├── shared/                    # Código compartido
│   └── schema.ts              # Esquema de base de datos
├── public/                    # Archivos estáticos
│   └── assets/                # Imágenes subidas
│       ├── carrusel/          # Imágenes del slider principal
│       ├── galeria/           # Galería de imágenes
│       ├── servicios/         # Logos de servicios
│       ├── perfiles/          # Fotos de perfil
│       ├── chat/              # Archivos del chat
│       ├── img/               # Imágenes generales
│       ├── mp3/               # Archivos de audio
│       └── documentos/        # Documentos
└── dist/                      # Build de producción
    └── public/
        ├── index.html
        └── assets/            # JS/CSS compilados
```

### Hostinger (Producción)
```
/var/www/apo360.net/
├── dist/                      # Build compilado
│   └── public/
│       ├── index.html
│       └── assets/            # JS/CSS (index-*.js, index-*.css)
├── public/
│   └── assets/                # Imágenes subidas (persistentes)
│       ├── carrusel/
│       ├── galeria/
│       ├── servicios/
│       ├── perfiles/
│       ├── chat/
│       ├── img/
│       ├── mp3/
│       └── documentos/
├── logs/                      # Logs de PM2
│   ├── error.log
│   ├── output.log
│   └── combined.log
├── .env                       # Variables de entorno
└── ecosystem.config.cjs       # Configuración PM2
```

---

## 4. CONFIGURACIÓN DE VARIABLES DE ENTORNO

### Archivo .env en Hostinger (/var/www/apo360.net/.env)

```env
# Base de datos PostgreSQL Local
DATABASE_URL=postgresql://apo360_user:TU_PASSWORD@localhost:5432/apo360_db
PGHOST=localhost
PGPORT=5432
PGUSER=apo360_user
PGPASSWORD=TU_PASSWORD
PGDATABASE=apo360_db

# Autenticación
AUTH_MODE=basic
SESSION_SECRET=tu_session_secret_seguro_aqui

# Google OAuth (opcional en producción)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://apo360.net/api/auth/google/callback

# SMTP para emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_app_password

# Node
NODE_ENV=production
PORT=5000
```

### Variables en Replit (Secrets)
Las mismas variables pero con:
- `DATABASE_URL`: URL de Neon PostgreSQL
- `AUTH_MODE`: No definido (usa Replit Auth por defecto)

---

## 5. CONFIGURACIÓN DE PM2 (ecosystem.config.cjs)

```javascript
// Cargar variables de entorno desde .env
require('dotenv').config({ path: '/var/www/apo360.net/.env' });

module.exports = {
  apps: [{
    name: 'apo360',
    script: 'dist/index.js',
    cwd: '/var/www/apo360.net',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: process.env.DATABASE_URL,
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      PGUSER: process.env.PGUSER,
      PGPASSWORD: process.env.PGPASSWORD,
      PGDATABASE: process.env.PGDATABASE,
      SESSION_SECRET: process.env.SESSION_SECRET,
      AUTH_MODE: process.env.AUTH_MODE || 'basic',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD
    },
    error_file: '/var/www/apo360.net/logs/error.log',
    out_file: '/var/www/apo360.net/logs/output.log',
    log_file: '/var/www/apo360.net/logs/combined.log',
    time: true
  }]
};
```

---

## 6. CONFIGURACIÓN DE NGINX (CRÍTICA)

### Archivo: /etc/nginx/sites-available/apo360.net

```nginx
map $uri $assets_root {
    ~^/assets/.*\.(js|css|map|woff2?|ttf|eot)$  /var/www/apo360.net/dist/public;
    default                                      /var/www/apo360.net/public;
}

server {
    listen 80;
    server_name apo360.net www.apo360.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl ipv6only=on;

    server_name apo360.net www.apo360.net;

    ssl_certificate /etc/letsencrypt/live/apo360.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apo360.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    root /var/www/apo360.net/dist/public;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:5000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /assets/ {
        root $assets_root;
        try_files $uri $uri/ =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### EXPLICACIÓN IMPORTANTE DEL MAP

El `map` resuelve el conflicto de que `/assets/` debe servir:
- **Archivos JS/CSS/fonts** desde `/var/www/apo360.net/dist/public/assets/` (build de Vite)
- **Imágenes subidas** desde `/var/www/apo360.net/public/assets/` (carrusel, galería, etc.)

El regex detecta extensiones de build (js, css, map, woff, ttf, eot) y las sirve desde `dist/public`, todo lo demás (imágenes) desde `public`.

---

## 7. CONFIGURACIÓN DE UPLOADS

### Límites de Archivos
- **Tamaño máximo**: 25 MB por archivo
- **Nginx**: 50 MB (`client_max_body_size 50M`)

### Formatos Permitidos
- image/jpeg, image/jpg
- image/png
- image/webp
- image/gif
- image/bmp
- image/tiff
- image/svg+xml

### Carpetas de Destino
| Tipo | Carpeta | Ruta Completa |
|------|---------|---------------|
| Publicidad/Carrusel | carrusel | /public/assets/carrusel/ |
| Galería | galeria | /public/assets/galeria/ |
| Servicios | servicios | /public/assets/servicios/ |
| Perfiles | perfiles | /public/assets/perfiles/ |
| Chat | chat | /public/assets/chat/ |
| MP3 | mp3 | /public/assets/mp3/ |
| Documentos | documentos | /public/assets/documentos/ |
| Imágenes generales | img | /public/assets/img/ |

---

## 8. FLUJO DE DESPLIEGUE

### Paso 1: Desarrollo en Replit
1. Hacer cambios en el código
2. Probar localmente en Replit

### Paso 2: Subir a GitHub
```bash
# En Shell de Replit
git add -A
git commit -m "Descripción de los cambios"
git push origin main
```

### Paso 3: Actualizar en Hostinger
```bash
# Conectar por SSH
ssh root@IP_SERVIDOR

# Ir al directorio
cd /var/www/apo360.net

# Si hay conflictos locales (archivos modificados en servidor):
# Opción A: Guardar cambios locales temporalmente
git stash
git pull origin main
git stash pop  # Recuperar cambios locales (puede haber conflictos)

# Opción B: Descartar cambios locales y forzar actualización
git reset --hard origin/main
git pull origin main

# Opción C: Descargar solo si no hay conflictos
git pull origin main

# Compilar el proyecto
npm run build

# Reiniciar PM2
pm2 restart apo360

# Verificar logs
pm2 logs apo360 --lines 20
```

### Paso 4: Verificar el Despliegue
```bash
# Verificar que Nginx esté sirviendo correctamente
curl -I https://apo360.net

# Verificar que el backend esté funcionando
curl https://apo360.net/api/health

# Verificar PM2
pm2 status

# Ver logs en tiempo real
pm2 logs apo360 --lines 50
```

---

## 9. COMANDOS ÚTILES

### PM2 (Hostinger)
```bash
pm2 start ecosystem.config.cjs    # Iniciar
pm2 restart apo360                # Reiniciar
pm2 stop apo360                   # Detener
pm2 logs apo360 --lines 50        # Ver logs
pm2 status                        # Estado
pm2 monit                         # Monitor en tiempo real
```

### Nginx (Hostinger)
```bash
sudo nginx -t                     # Verificar configuración
sudo systemctl restart nginx      # Reiniciar
sudo systemctl status nginx       # Estado
sudo tail -f /var/log/nginx/error.log  # Ver errores
```

### PostgreSQL (Hostinger)
```bash
sudo -u postgres psql             # Entrar a PostgreSQL
\c apo360_db                      # Conectar a la base de datos
\dt                               # Listar tablas
\q                                # Salir
```

### Git
```bash
git status                        # Ver estado
git log --oneline -5              # Últimos 5 commits
git diff                          # Ver cambios
```

---

## 10. PROCEDIMIENTOS DE RESPALDO

### Código (GitHub)
```bash
# Ya está respaldado en GitHub automáticamente
# Verificar: https://github.com/alfred7615/apo360.git
```

### Base de Datos
```bash
# Crear backup
pg_dump -U apo360_user -h localhost apo360_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U apo360_user -h localhost apo360_db < backup_20251210.sql
```

### Archivos Subidos (Imágenes, etc.)
```bash
# Crear backup
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/apo360.net/public/assets/

# Restaurar backup
tar -xzvf uploads_backup_20251210.tar.gz -C /
```

### Configuraciones Críticas
```bash
# Respaldar configuración Nginx
sudo cp /etc/nginx/sites-available/apo360.net ~/nginx_backup_$(date +%Y%m%d).conf

# Respaldar .env
cp /var/www/apo360.net/.env ~/env_backup_$(date +%Y%m%d)

# Respaldar ecosystem.config.cjs
cp /var/www/apo360.net/ecosystem.config.cjs ~/ecosystem_backup_$(date +%Y%m%d).cjs
```

---

## 11. SOLUCIÓN DE PROBLEMAS COMUNES

### Problema: Imágenes no se ven en producción
**Causa**: Conflicto en Nginx entre assets del build y uploads.
**Solución**: Usar la configuración con `map` (sección 6).

### Problema: Sitio muestra página en blanco
**Causa**: Nginx no encuentra los archivos JS/CSS.
**Verificar**:
```bash
ls -la /var/www/apo360.net/dist/public/assets/
curl -I https://apo360.net/assets/index-*.js
```

### Problema: Error DATABASE_URL no configurada
**Causa**: PM2 no carga las variables de entorno.
**Solución**: Usar `ecosystem.config.cjs` con `require('dotenv').config()`.

### Problema: Error al subir imágenes grandes
**Verificar**:
1. Nginx: `client_max_body_size 50M;`
2. Código: `fileSize: 25 * 1024 * 1024` en uploadConfig.ts

### Problema: WebSocket no conecta
**Verificar** configuración en Nginx:
```nginx
location /ws {
    proxy_pass http://127.0.0.1:5000/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## 12. CHECKLIST POST-DESPLIEGUE

- [ ] `git pull origin main` ejecutado
- [ ] `npm run build` completado sin errores
- [ ] `pm2 restart apo360` ejecutado
- [ ] `pm2 logs apo360` muestra "serving on port 5000"
- [ ] Sitio carga en navegador
- [ ] Imágenes del carrusel visibles
- [ ] Login funciona
- [ ] Panel admin accesible
- [ ] WebSocket conecta (chat funciona)

---

## 13. CONTACTOS Y RECURSOS

- **GitHub**: https://github.com/alfred7615/apo360.git
- **Dominio**: apo360.net (Hostinger)
- **SSL**: Let's Encrypt (renovación automática)
- **VPS**: Hostinger

---

## HISTORIAL DE CAMBIOS IMPORTANTES

| Fecha | Cambio | Archivos Afectados |
|-------|--------|-------------------|
| 2025-12-10 | Configuración Nginx con map para assets | /etc/nginx/sites-available/apo360.net |
| 2025-12-10 | Aumento límite uploads a 25MB | server/uploadConfig.ts, uploadConfigByEndpoint.ts |
| 2025-12-10 | Agregados formatos GIF, BMP, TIFF, SVG | server/uploadConfig.ts, uploadConfigByEndpoint.ts |
