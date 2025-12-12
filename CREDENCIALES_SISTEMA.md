# APO-360 - CREDENCIALES Y CONFIGURACIÓN DEL SISTEMA

## Fecha de actualización: 12 de Diciembre 2025

---

## 1. CREDENCIALES POSTGRESQL

### PRODUCCIÓN (Hostinger VPS - Local)
```
Base de datos: apo360_prod
Usuario: apo360_admin
Contraseña: Admin2025
Host: 127.0.0.1 (localhost)
Puerto: 5432

URL completa:
postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable
```

### DESARROLLO (Replit - Neon)
```
Base de datos: neondb
Usuario: neondb_owner
Contraseña: npg_W0PnqUe6vTSG
Host: ep-wandering-mode-afa3c7cd.c-2.us-west-2.aws.neon.tech
Puerto: 5432

URL completa:
postgresql://neondb_owner:npg_W0PnqUe6vTSG@ep-wandering-mode-afa3c7cd.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
```

---

## 2. USUARIO ADMINISTRADOR

```
Email: aapomayta15@gmail.com
Password: Admin123! (o el que tengas configurado)
ID: 50138117
Rol: super_admin
```

---

## 3. SERVIDOR WEB (Hostinger VPS)

```
Dominio: https://apo360.net
IP Servidor: srv1170282 (Hostinger VPS)
Usuario SSH: root
Puerto Aplicación: 5000
Directorio: /var/www/apo360.net
```

---

## 4. CONFIGURACIÓN SMTP (Email)

```
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: aapomayta15@gmail.com
SMTP_PASSWORD: frog svje eiih jfga
```

---

## 5. SESSION SECRET

```
SESSION_SECRET: Q1WbrRv7MMG7ElYk08ePw7QuIhCkp3hzMEqQJ5tUn2ZNtzOBGgRCOizEpXoYl/1r/Bt7eCWtKMVEseEvVu1kJQ==
```

---

## 6. REPOSITORIO GITHUB

```
URL: https://github.com/alfred7615/apo360.git
Rama principal: main
```

---

## 7. SERVICIOS EN EJECUCIÓN

| Servicio | Puerto | Estado |
|----------|--------|--------|
| Node.js (PM2) | 5000 | Activo |
| PostgreSQL | 5432 | Activo |
| Nginx | 80/443 | Activo (SSL) |

---

## 8. ARCHIVO .ENV PRODUCCIÓN (/var/www/apo360.net/.env)

```env
DATABASE_URL=postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable
PGDATABASE=apo360_prod
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=apo360_admin
PGPASSWORD=Admin2025

AUTH_MODE=basic
SESSION_SECRET=Q1WbrRv7MMG7ElYk08ePw7QuIhCkp3hzMEqQJ5tUn2ZNtzOBGgRCOizEpXoYl/1r/Bt7eCWtKMVEseEvVu1kJQ==

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=aapomayta15@gmail.com
SMTP_PASSWORD=frog svje eiih jfga

NODE_ENV=production
PORT=5000
```

---

## 9. COMANDOS ÚTILES

### Conectar a PostgreSQL en Hostinger
```bash
psql "postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable"
```

### Desplegar actualización
```bash
cd /var/www/apo360.net
git pull origin main
npm install
npm run build
pm2 restart apo360
```

### Ver logs
```bash
pm2 logs apo360 --lines 50
```

### Reiniciar Nginx
```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 10. TABLAS DE BASE DE DATOS (Actualizado 12/12/2025)

| Tabla | Descripción |
|-------|-------------|
| usuarios | Usuarios del sistema |
| sesiones | Sesiones de usuario |
| publicidad | Anuncios y banners |
| publicidad_multimedia | Archivos multimedia |
| mensajes | Mensajes del chat |
| contactos_panico | Contactos de emergencia |
| emergencias | Alertas de pánico |
| servicios_taxi | Solicitudes de taxi |
| servicios_delivery | Solicitudes de delivery |
| solicitudes_saldo | Solicitudes de recarga |
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

---

## NOTA IMPORTANTE

Las bases de datos de Replit (desarrollo) y Hostinger (producción) son INDEPENDIENTES. Cualquier cambio en el schema de Drizzle (`shared/schema.ts`) que agregue nuevas tablas debe sincronizarse manualmente ejecutando SQL en la base de datos de producción.
