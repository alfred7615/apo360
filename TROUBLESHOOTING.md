# Guía de Solución de Problemas - APO-360

## Problema: Login se queda en "Cargando..." (Producción)

### Diagnóstico Paso a Paso

#### 1. Ver logs de la aplicación
```bash
cd /var/www/apo360.net
pm2 logs apo360 --lines 100
```

Busca errores como:
- `invalid_client` → Problema con Google OAuth
- `ECONNREFUSED` → Base de datos no accesible
- `session` → Problema con sesiones

#### 2. Verificar que la aplicación responde
```bash
curl -I https://apo360.net/api/auth/user
```

Respuesta esperada:
- `200 OK` si hay sesión activa
- `401 Unauthorized` si no hay sesión (correcto si no estás logueado)
- Cualquier otro error indica problema

#### 3. Verificar conexión a base de datos
```bash
sudo -u postgres psql -d apo360_prod -c "SELECT COUNT(*) FROM users;"
```

#### 4. Verificar variables de entorno
```bash
cat /var/www/apo360.net/.env | grep -E "^(AUTH_MODE|GOOGLE_|DATABASE_URL)"
```

Debe mostrar:
```
AUTH_MODE=google
GOOGLE_CLIENT_ID=16943049442-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=https://apo360.net/api/callback
DATABASE_URL=postgresql://apo360_admin:Admin123!Secure@localhost:5432/apo360_prod
```

---

## Problema: Error `invalid_client` en Google OAuth

### Causa
La URI de redirección en Google Cloud Console no coincide exactamente con la configurada en la aplicación.

### Solución

1. Ve a https://console.cloud.google.com/apis/credentials
2. Edita las credenciales OAuth 2.0
3. En **Authorized redirect URIs**, agrega EXACTAMENTE:
   ```
   https://apo360.net/api/callback
   ```
   (Sin trailing slash, sin `/auth/google/callback`)

4. En **Authorized JavaScript origins**, agrega:
   ```
   https://apo360.net
   ```

5. Guarda los cambios

6. Ve a **OAuth consent screen** y verifica:
   - Estado: **In production** (no "Testing")
   - Si dice "Testing", haz clic en **PUBLISH APP**

7. Reinicia la aplicación:
   ```bash
   pm2 restart apo360 --update-env
   ```

---

## Problema: Base de datos no sincronizada

### Síntomas
- Errores de columnas faltantes
- Error "relation does not exist"

### Solución
```bash
cd /var/www/apo360.net
npm run db:push
```

Si pide confirmación, selecciona "create column" para columnas nuevas.

---

## Problema: Sesiones no persisten

### Diagnóstico
```bash
pm2 logs apo360 --lines 50 | grep -i session
```

### Solución
Verificar que existe la tabla de sesiones:
```bash
sudo -u postgres psql -d apo360_prod -c "\dt session"
```

Si no existe, ejecutar:
```bash
cd /var/www/apo360.net
npm run db:push
```

---

## Comandos Útiles de Mantenimiento

### Reiniciar aplicación
```bash
pm2 restart apo360 --update-env
```

### Ver estado
```bash
pm2 status apo360
```

### Logs en tiempo real
```bash
pm2 logs apo360 --follow
```

### Reiniciar completamente
```bash
cd /var/www/apo360.net
pm2 delete apo360
pm2 start ecosystem.config.js
pm2 save
```

### Actualizar desde GitHub
```bash
cd /var/www/apo360.net
./scripts/deploy.sh
```

---

## Verificación de Google Cloud Console

### Configuración Correcta OAuth 2.0

| Campo | Valor |
|-------|-------|
| Authorized JavaScript origins | `https://apo360.net` |
| Authorized redirect URIs | `https://apo360.net/api/callback` |
| Application type | Web application |
| OAuth consent screen status | **In production** |

### Scopes Requeridos
- `openid`
- `profile`
- `email`
- `https://www.googleapis.com/auth/contacts.readonly` (para importar contactos)
