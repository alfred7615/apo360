# APO-360 - Documentación Técnica Completa

## Fecha de actualización: 12 de Diciembre 2025

---

## 1. INFORMACIÓN GENERAL DEL PROYECTO

### Descripción
APO-360 es una plataforma web de seguridad y servicios comunitarios para Tacna, Perú. Incluye chat en tiempo real, botón de pánico, taxi, delivery, publicidad local, sistema de billetera, paneles dinámicos por rol, y panel de administración completo.

### URLs
- **Desarrollo (Replit)**: https://[repl-name].replit.dev
- **Producción**: https://apo360.net
- **Repositorio GitHub**: https://github.com/alfred7615/apo360.git

### Credenciales Admin Producción
- **Email**: aapomayta15@gmail.com
- **Password**: Admin123!
- **ID Usuario**: 50138117
- **Rol**: super_admin

---

## 2. CREDENCIALES COMPLETAS DEL SISTEMA

### 2.1 PostgreSQL - PRODUCCIÓN (Hostinger VPS - Local)
```
Base de datos: apo360_prod
Usuario: apo360_admin
Contraseña: Admin2025
Host: 127.0.0.1 (localhost)
Puerto: 5432

URL completa:
postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable
```

### 2.2 PostgreSQL - DESARROLLO (Replit - Neon)
```
Base de datos: neondb
Usuario: neondb_owner
Contraseña: npg_W0PnqUe6vTSG
Host: ep-wandering-mode-afa3c7cd.c-2.us-west-2.aws.neon.tech
Puerto: 5432

URL completa:
postgresql://neondb_owner:npg_W0PnqUe6vTSG@ep-wandering-mode-afa3c7cd.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

### 2.3 Servidor Web (Hostinger VPS)
```
Dominio: https://apo360.net
IP Servidor: srv1170282
Usuario SSH: root
Puerto Aplicación: 5000
Directorio: /var/www/apo360.net
```

### 2.4 Configuración SMTP (Email)
```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: aapomayta15@gmail.com
SMTP_PASSWORD: frog svje eiih jfga
```

### 2.5 Session Secret
```
Q1WbrRv7MMG7ElYk08ePw7QuIhCkp3hzMEqQJ5tUn2ZNtzOBGgRCOizEpXoYl/1r/Bt7eCWtKMVEseEvVu1kJQ==
```

---

## 3. ARQUITECTURA DEL SISTEMA

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
- **Frontend**: React, TailwindCSS, Shadcn UI, Wouter, TanStack Query, Framer Motion, Leaflet
- **Backend**: Express, Drizzle ORM, Multer, Passport, Socket.io
- **Base de Datos**: PostgreSQL con Drizzle ORM

---

## 4. ESTRUCTURA DE DIRECTORIOS

### Replit (Desarrollo)
```
/home/runner/workspace/
├── client/                    # Frontend React
│   └── src/
│       ├── components/        # Componentes React
│       │   ├── ui/            # Componentes Shadcn
│       │   ├── LocalComercialPanel.tsx
│       │   └── ...
│       ├── pages/             # Páginas de la aplicación
│       │   ├── admin-panel.tsx
│       │   ├── panel-usuario.tsx
│       │   └── ...
│       ├── hooks/             # Custom hooks
│       └── lib/               # Utilidades
├── server/                    # Backend Express
│   ├── routes.ts              # Rutas de API
│   ├── storage.ts             # Interfaz de almacenamiento
│   ├── db.ts                  # Conexión a base de datos
│   ├── uploadConfig.ts        # Configuración de uploads
│   ├── uploadConfigByEndpoint.ts  # Uploads por endpoint
│   └── websocket.ts           # WebSocket handlers
├── shared/                    # Código compartido
│   └── schema.ts              # Esquema de base de datos (Drizzle)
├── public/                    # Archivos estáticos
│   └── assets/                # Imágenes subidas
│       ├── carrusel/          # Imágenes del slider principal
│       ├── galeria/           # Galería de imágenes
│       ├── servicios/         # Logos de servicios
│       ├── perfiles/          # Fotos de perfil
│       ├── chat/              # Archivos del chat
│       ├── img/               # Imágenes generales (comprobantes)
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

## 5. CONFIGURACIÓN DE VARIABLES DE ENTORNO

### Archivo .env en Hostinger (/var/www/apo360.net/.env)

```env
# Base de datos PostgreSQL Local
DATABASE_URL=postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=apo360_admin
PGPASSWORD=Admin2025
PGDATABASE=apo360_prod

# Autenticación
AUTH_MODE=basic
SESSION_SECRET=Q1WbrRv7MMG7ElYk08ePw7QuIhCkp3hzMEqQJ5tUn2ZNtzOBGgRCOizEpXoYl/1r/Bt7eCWtKMVEseEvVu1kJQ==

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://apo360.net/api/auth/google/callback

# SMTP para emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aapomayta15@gmail.com
SMTP_PASSWORD=frog svje eiih jfga

# Node
NODE_ENV=production
PORT=5000
```

### Variables en Replit (Secrets)
Las mismas variables pero con:
- `DATABASE_URL`: URL de Neon PostgreSQL (automática)
- `AUTH_MODE`: No definido (usa Replit Auth por defecto)

---

## 6. CONFIGURACIÓN DE PM2 (ecosystem.config.cjs)

### Archivo completo: /var/www/apo360.net/ecosystem.config.cjs

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
      // Variables de base de datos
      DATABASE_URL: process.env.DATABASE_URL,
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      PGUSER: process.env.PGUSER,
      PGPASSWORD: process.env.PGPASSWORD,
      PGDATABASE: process.env.PGDATABASE,
      // Variables de autenticación
      SESSION_SECRET: process.env.SESSION_SECRET,
      AUTH_MODE: process.env.AUTH_MODE || 'basic',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
      // SMTP
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

## 7. CONFIGURACIÓN DE NGINX (CRÍTICA PARA IMÁGENES)

### Archivo: /etc/nginx/sites-available/apo360.net

```nginx
# ============================================================
# Configuración Nginx para APO-360
# Fecha: 12 de Diciembre 2025
# ============================================================

# Upstream para Node.js
upstream apo360_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# MAP para diferenciar entre assets del build y uploads de usuarios
# JS/CSS/fonts -> dist/public/assets (archivos del build de Vite)
# Imágenes -> public/assets (archivos subidos por usuarios)
map $uri $assets_root {
    ~^/assets/.*\.(js|css|map|woff2?|ttf|eot)$  /var/www/apo360.net/dist/public;
    default                                      /var/www/apo360.net/public;
}

# Redireccionar HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name apo360.net www.apo360.net;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Servidor HTTPS principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name apo360.net www.apo360.net;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/apo360.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apo360.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Configuración SSL segura
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Tamaño máximo de subida (para imágenes/videos)
    client_max_body_size 50M;

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/apo360.access.log;
    error_log /var/log/nginx/apo360.error.log;

    # Directorio raíz para archivos estáticos del build
    root /var/www/apo360.net/dist/public;
    index index.html;

    # ============================================================
    # ASSETS - Configuración crítica para imágenes y archivos
    # ============================================================
    location /assets/ {
        root $assets_root;
        try_files $uri $uri/ =404;
        
        # Cache según tipo de archivo
        location ~* \.(js|css|map)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff)$ {
            expires 30d;
            add_header Cache-Control "public";
        }
        
        location ~* \.(woff2?|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        location ~* \.(mp3|wav|ogg|m4a)$ {
            expires 7d;
            add_header Cache-Control "public";
        }
    }

    # ============================================================
    # API - Proxy a Node.js
    # ============================================================
    location /api/ {
        proxy_pass http://apo360_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        
        # Timeout para uploads grandes
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # ============================================================
    # WebSocket para comunicación en tiempo real
    # ============================================================
    location /ws {
        proxy_pass http://apo360_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # ============================================================
    # Socket.IO
    # ============================================================
    location /socket.io/ {
        proxy_pass http://apo360_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # ============================================================
    # SPA - Todas las demás rutas van al index.html
    # ============================================================
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### EXPLICACIÓN IMPORTANTE DEL MAP

El `map` resuelve el conflicto de que `/assets/` debe servir:
- **Archivos JS/CSS/fonts** desde `/var/www/apo360.net/dist/public/assets/` (build de Vite)
- **Imágenes subidas** desde `/var/www/apo360.net/public/assets/` (carrusel, galería, comprobantes, etc.)

El regex detecta extensiones de build (js, css, map, woff, ttf, eot) y las sirve desde `dist/public`, todo lo demás (imágenes JPG, PNG, etc.) desde `public`.

---

## 8. CONFIGURACIÓN DE UPLOADS

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

## 9. BASE DE DATOS - TABLAS (Actualizado 12/12/2025)

### Lista completa de tablas

| Tabla | Descripción |
|-------|-------------|
| usuarios | Usuarios del sistema |
| sesiones | Sesiones de usuario |
| publicidad | Anuncios y banners |
| publicidad_multimedia | Archivos multimedia de publicidad |
| mensajes | Mensajes del chat |
| contactos_panico | Contactos de emergencia |
| emergencias | Alertas de pánico |
| servicios_taxi | Solicitudes de taxi |
| servicios_delivery | Solicitudes de delivery |
| solicitudes_saldo | Solicitudes de recarga de saldo |
| metodos_pago | Métodos de pago configurados |
| transacciones | Historial de transacciones |
| favoritos | Favoritos de usuarios |
| usuario_roles | Roles asignados a usuarios |
| categorias_rol | Categorías de roles |
| subcategorias_rol | Subcategorías de roles |
| datos_negocio | Datos de locales comerciales |
| catalogo_negocio | Catálogos de productos/servicios |
| tasas_cambio_locales | Tasas de cambio de monedas |
| configuracion_monedas | Configuración de monedas |
| encuestas | Encuestas del sistema |
| lugares_usuario | Ubicaciones guardadas |
| radios_online | Estaciones de radio |
| mp3_folders | Carpetas de MP3 |
| mp3_files | Archivos MP3 |
| servicios_locales | Servicios locales |
| categorias_servicios | Categorías de servicios |
| subcategorias_servicios | Subcategorías de servicios |

---

## 10. FLUJO DE DESPLIEGUE

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
ssh root@srv1170282

# Ir al directorio
cd /var/www/apo360.net

# Descargar cambios
git pull origin main

# Instalar dependencias si hay nuevas
npm install

# Compilar el proyecto
npm run build

# Reiniciar PM2
pm2 restart apo360

# Verificar logs
pm2 logs apo360 --lines 20
```

### Paso 4: Si hay nuevas tablas en el schema
```bash
# Conectar a PostgreSQL
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable"

# Ejecutar CREATE TABLE para tablas faltantes
CREATE TABLE IF NOT EXISTS nueva_tabla (...);

# Verificar
\dt

# Salir
\q

# Reiniciar PM2
pm2 restart apo360
```

---

## 11. COMANDOS ÚTILES

### PM2 (Hostinger)
```bash
pm2 start ecosystem.config.cjs    # Iniciar
pm2 restart apo360                # Reiniciar
pm2 stop apo360                   # Detener
pm2 logs apo360 --lines 50        # Ver logs
pm2 status                        # Estado
pm2 monit                         # Monitor en tiempo real
pm2 restart all                   # Reiniciar todo
```

### Nginx (Hostinger)
```bash
sudo nginx -t                     # Verificar configuración
sudo systemctl restart nginx      # Reiniciar
sudo systemctl reload nginx       # Recargar config
sudo systemctl status nginx       # Estado
sudo tail -f /var/log/nginx/error.log       # Ver errores
sudo tail -f /var/log/nginx/apo360.error.log  # Ver errores APO360
```

### PostgreSQL (Hostinger)
```bash
# Conectar directamente
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable"

# O usar sudo
sudo -u postgres psql
\c apo360_prod                    # Conectar a la base
\dt                               # Listar tablas
\d+ nombre_tabla                  # Ver estructura de tabla
SELECT COUNT(*) FROM usuarios;    # Contar registros
\q                                # Salir
```

### Git
```bash
git status                        # Ver estado
git log --oneline -5              # Últimos 5 commits
git diff                          # Ver cambios
git pull origin main              # Descargar cambios
```

---

## 12. SOLUCIÓN DE PROBLEMAS COMUNES

### Problema: Imágenes no se ven en producción
**Causa**: Nginx no está configurado con el MAP para diferenciar assets.
**Solución**: 
1. Actualizar `/etc/nginx/sites-available/apo360.net` con la configuración de la sección 7
2. Ejecutar: `sudo nginx -t && sudo systemctl reload nginx`

### Problema: Comprobantes de recarga no se ven
**Causa**: Las imágenes están en `/assets/img/` pero Nginx las busca en lugar incorrecto.
**Verificar**:
```bash
ls -la /var/www/apo360.net/public/assets/img/
```
**Solución**: Asegurar que la carpeta exista y tenga permisos:
```bash
mkdir -p /var/www/apo360.net/public/assets/img
chmod -R 755 /var/www/apo360.net/public/assets/
```

### Problema: Sitio muestra página en blanco
**Causa**: Nginx no encuentra los archivos JS/CSS.
**Verificar**:
```bash
ls -la /var/www/apo360.net/dist/public/assets/
curl -I https://apo360.net/assets/index-*.js
```

### Problema: Error tabla no existe
**Causa**: Nueva tabla en Drizzle no creada en Hostinger.
**Solución**: Crear tabla manualmente con SQL (ver sección 10, paso 4).

### Problema: Error DATABASE_URL no configurada
**Causa**: PM2 no carga las variables de entorno.
**Solución**: 
1. Verificar `.env` existe: `cat /var/www/apo360.net/.env`
2. Usar `ecosystem.config.cjs` con `require('dotenv').config()`

### Problema: Error al subir imágenes grandes
**Verificar**:
1. Nginx: `client_max_body_size 50M;`
2. Código: `fileSize: 25 * 1024 * 1024` en uploadConfig.ts

### Problema: WebSocket no conecta
**Verificar** configuración en Nginx (sección 7, bloque `/ws` y `/socket.io/`).

---

## 13. CHECKLIST POST-DESPLIEGUE

- [ ] `git pull origin main` ejecutado
- [ ] `npm run build` completado sin errores
- [ ] `pm2 restart apo360` ejecutado
- [ ] `pm2 logs apo360` muestra "serving on port 5000"
- [ ] Sitio carga en navegador (https://apo360.net)
- [ ] Imágenes del carrusel visibles
- [ ] Login funciona
- [ ] Panel admin accesible
- [ ] WebSocket conecta (chat funciona)
- [ ] Imágenes de comprobantes se ven

---

## 14. FUNCIONALIDADES IMPLEMENTADAS (Actualizado 12/12/2025)

### Sistema de Autenticación
- Triple sistema: Replit Auth (dev), Email/Password, Google OAuth
- Roles: super_admin, admin_cartera, admin_operaciones, supervisor, usuario, conductor, local
- Sesiones persistentes en PostgreSQL

### Sistema de Roles y Categorías
- Categorías de roles configurables por super_admin
- Subcategorías dentro de cada categoría
- Asignación de rol con categoría/subcategoría a usuarios
- Paneles dinámicos según rol asignado

### Panel de Local Comercial
- Formulario de datos del negocio (nombre, descripción, logo, contacto)
- Catálogo de productos/servicios con precios
- Configuración de horarios y días de atención
- Integración con GPS y redes sociales

### Sistema de Billetera
- Solicitudes de recarga de saldo
- Subida de comprobante de pago (imagen)
- Aprobación/rechazo por administrador
- Historial de transacciones
- Múltiples métodos de pago

### Sistema de Chat en Tiempo Real
- Mensajes individuales y grupales
- Envío de archivos multimedia
- Notificaciones push
- WebSocket con Socket.io

### Sistema de Emergencias (Botón de Pánico)
- Botón de pánico flotante con arrastre
- Notificación a contactos de emergencia
- Registro de emergencias con GPS
- Panel de monitoreo para administradores

### Calculadora de Cambio de Monedas
- 5 monedas soportadas (PEN, USD, CLP, ARS, BOB)
- Tasas configurables por cambistas locales
- Modal y página dedicada

### Sistema de Taxi y Delivery
- Solicitudes de servicio
- Asignación de conductores
- Tracking en tiempo real
- Historial de viajes

### Radio Online y Audio
- Reproductor persistente
- Estaciones de radio configurables
- Listas de MP3

---

## 15. SINCRONIZACIÓN DE SCHEMAS ENTRE AMBIENTES

### IMPORTANTE: Bases de datos independientes
Las bases de datos de Replit (Neon) y Hostinger (PostgreSQL local) son **completamente independientes**. Cualquier cambio en el schema que agregue nuevas tablas debe sincronizarse manualmente.

### Cuando agregas nuevas tablas en Drizzle:

1. **En Replit**: Se crean automáticamente con `npm run db:push`

2. **En Hostinger**: Debes crear las tablas manualmente con SQL

### Proceso de sincronización:
```bash
# 1. Revisar shared/schema.ts para ver las nuevas tablas

# 2. Conectar a PostgreSQL en Hostinger
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable"

# 3. Ejecutar CREATE TABLE para las tablas faltantes
CREATE TABLE IF NOT EXISTS nueva_tabla (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

# 4. Verificar
\dt

# 5. Salir y reiniciar
\q
pm2 restart apo360
```

### Tablas agregadas recientemente (12/12/2025):
- `datos_negocio` - Datos de locales comerciales
- `catalogo_negocio` - Catálogo de productos/servicios

---

## 16. HISTORIAL DE CAMBIOS IMPORTANTES

| Fecha | Cambio | Archivos Afectados |
|-------|--------|-------------------|
| 2025-12-12 | Sistema de paneles dinámicos por rol | server/routes.ts, server/storage.ts |
| 2025-12-12 | Tablas datos_negocio y catalogo_negocio | shared/schema.ts |
| 2025-12-12 | Componente LocalComercialPanel | client/src/components/LocalComercialPanel.tsx |
| 2025-12-12 | Endpoints /api/mi-negocio, /api/mi-catalogo, /api/mis-roles | server/routes.ts |
| 2025-12-12 | Actualización completa de documentación | DOCUMENTACION_TECNICA.md, CREDENCIALES_SISTEMA.md |
| 2025-12-12 | Configuración Nginx actualizada para imágenes | nginx.conf |
| 2025-12-10 | Configuración Nginx con map para assets | /etc/nginx/sites-available/apo360.net |
| 2025-12-10 | Aumento límite uploads a 25MB | server/uploadConfig.ts |
| 2025-12-10 | Agregados formatos GIF, BMP, TIFF, SVG | server/uploadConfig.ts |

---

## 17. CONTACTOS Y RECURSOS

- **GitHub**: https://github.com/alfred7615/apo360.git
- **Dominio**: apo360.net (Hostinger)
- **SSL**: Let's Encrypt (renovación automática)
- **VPS**: Hostinger (srv1170282)
- **Admin Email**: aapomayta15@gmail.com
