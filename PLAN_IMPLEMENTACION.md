# SEG-APO - Plan de Implementación Completo

## 📋 Fase Actual: Configuración del Panel Super Admin (5 Pantallas)

### Pantalla 1: Dashboard Principal - 5 Sectores

#### 1.1 PUBLICIDAD
- **Funcionalidad**: Administrar toda la publicidad del sitio
- **Operaciones CRUD**:
  - Crear publicidad (título, descripción, imagen, enlace, tipo)
  - Asignar fechas de inicio y fin
  - Pausar/reanudar publicidades activas
  - Eliminar publicidades
  - Editar información
- **Automatización**: 
  - Estado cambia automáticamente a "finalizado" al pasar fecha fin
  - Se puede renovar ingresando nuevas fechas
- **Tipo**: carrusel_logos, carrusel_principal, popup

#### 1.2 RADIO ONLINE Y LISTAS MP3
- **Radios Online**:
  - Agregar URLs de radios
  - Modificar/editar radios
  - Eliminar radios
  - Pausar/reanudar emisión
  - Reordenar radios

- **Listas MP3**:
  - Crear nuevas listas por categoría
  - Agregar archivos MP3 a listas
  - Modificar/editar archivos
  - Eliminar archivos
  - Pausar/reanudar emisión
  - Reordenar canciones
- **Categorías**: Rock, Cumbia, Éxitos, Mix, Romántica

#### 1.3 PANEL DE USUARIOS Y ADMINISTRADORES
- **Gestión de Usuarios**:
  - Listar todos los usuarios
  - Ver tipo de usuario/rol
  - Modificar perfil
  - Suspender/bloquear usuario
  - Eliminar usuario (permanente)
  - Cambiar estado (activo/inactivo)

- **Administradores de Segundo Nivel**:
  - Crear administrador para grupos de chat
  - Crear administrador para grupos de taxi
  - Crear administrador para servicios/empresas
  - Crear administrador para locales comerciales
  - Asignar permisos específicos por rol
  - Modificar permisos de administrador existente
  - Ver panel independiente de cada admin

- **Sistema de Roles Múltiples**:
  - Un usuario puede tener múltiples roles (taxi + serenazgo + admin)
  - Asignar automáticamente en perfil del usuario
  - Verificar permisos por rol

#### 1.4 CARTERA Y SALDOS
- **Configuración de Costos**:
  - Porcentaje o monto fijo por publicidad
  - Porcentaje o monto por entrada de taxi (conductor/pasajero)
  - Porcentaje o monto por delivery
  - Porcentaje o monto por chat grupal
  - Comisión por compartir en redes sociales (ej: 0.10 soles)

- **Reportes de Saldos**:
  - Ver saldo de cada usuario
  - Historial de transacciones
  - Filtrar por tipo de transacción
  - Exportar reporte

- **Métodos de Pago**:
  - Cuentas bancarias (número de cuenta, tipo de moneda)
  - PayPal (email)
  - Plin (teléfono)
  - Yape (teléfono/número de cuenta)
  - Otros métodos

- **Tipos de Moneda**:
  - Soles (PEN)
  - Dólares (USD)
  - Euros (EUR)

#### 1.5 ENCUESTAS Y POPUPS PUBLICITARIOS
- **Encuestas**:
  - Crear encuestas con 2 o más preguntas
  - Subir imagen a la encuesta
  - Ver resultados en tiempo real
  - Eliminar encuestas antiguas
  - Activar/desactivar encuestas

- **Popups Publicitarios**:
  - Crear popup con título, descripción, imagen/video
  - Configurar duración (segundos)
  - Permitir omitir después de X segundos (tipo YouTube)
  - Vincular a URL de destino
  - Activar/desactivar popup

---

### Pantalla 2: Chat y Notificaciones
- Monitoreo de todas las conversaciones
- Filtrar por grupo/tipo de mensaje
- Timeline de notificaciones por fecha/tipo

### Pantalla 3: Geolocalización
- Mapa con emergencias (atendidas/por atender)
- Visualización de taxis por grupo/empresa
- Filtrar por grupo A, B, C, etc.
- Visualización de buses (Fase 2)

### Pantalla 4: Visualización por Grupos
- Ver unidades de taxi por grupo seleccionado
- Ver recorridos de buses por grupo (Fase 2)
- Datos clasificados por color según grupo/empresa

### Pantalla 5: Google Maps Ampliado
- Visualización en pantalla grande (TV/Monitor)
- Todas las actividades del mapa
- Copiar imagen para pantalla más grande

---

## 💰 Sistema de Cartera y Saldos - LÓGICA COMPLETA

### Ejemplo de Transacciones:

**1. Publicidad:**
```
Usuario A publica en carrusel principal
- Costo: 10 soles (configurado por super admin)
- Saldo: 100 → 90 soles
- Si comparte en redes: +0.10 soles (comisión al usuario que compartió)
```

**2. Taxi - Conductor:**
```
Pasajero solicita taxi
- Conductor acepta viaje
- Tarifa: 15 soles
- Comisión plataforma: 2.5 soles (25%)
- Conductor recibe: 12.5 soles
```

**3. Taxi - Pasajero:**
```
Pasajero hace solicitud
- Tarifa: 15 soles
- Se descuenta del saldo del pasajero
```

**4. Delivery:**
```
Usuario pide delivery en local
- Total pedido: 50 soles
- Descuento por comisión plataforma: 5 soles
- Local recibe: 45 soles
```

**5. Chat Grupal:**
```
Usuario quiere acceder a chat de grupo
- Costo: 0.50 soles/mes (configurado)
- Se descuenta periódicamente
- EXCEPCIÓN: Si comparte publicidad, no se cobra
```

---

## 🔐 Roles y Permisos

### Super Admin
- Acceso total a todas las 5 pantallas
- Puede crear/modificar/eliminar administradores de segundo nivel
- Configura todos los porcentajes y montos

### Admin de Segundo Nivel (ejemplos)
- **Admin de Grupo de Chat**: Gestiona miembros, permisos, mensajes del grupo
- **Admin de Grupo de Taxi**: Gestiona conductores, tarifas, rutas del grupo
- **Admin de Servicio/Local**: Gestiona productos, pedidos, horarios
- **Admin de Emergencia/Serenazgo**: Atiende emergencias, asigna personal

### Roles Múltiples
- Un usuario puede ser: Conductor + Serenazgo + Admin de Grupo X
- Cada rol tiene permisos independientes en su panel

---

## 📁 Estructura de Carpetas para Assets

```
public/assets/
├── img/
│   ├── carrusel/          # Logos del carrusel (768x300px aprox)
│   ├── galeria/           # Logos de servicios circulares (200x200px)
│   └── servicios/         # Imágenes adicionales de servicios
└── mp3/
    ├── lista 1/           # Rock Moderna
    ├── lista 2/           # Cumbia
    ├── lista 3/           # Éxitos Variado
    ├── lista 4/           # Mix Variado
    └── lista 5/           # Romántica
```

---

## 🚀 Próximas Fases

### Fase 2 (Después de Panel Admin)
- Sistema de buses con rutas y geolocalización
- Menú completo para restaurantes (stock, reservas, pedidos dinámicos)
- Servicios de mudanzas y talleres especializados
- Calculadora de tipo de cambio de monedas

### Fase 3 (Integración de Pagos)
- Integración con Twilio para SMS
- Llamadas de voz de emergencia
- Videollamadas en situaciones críticas
- Encriptación end-to-end

---

## 📝 Notas Importantes

- **TODO EN ESPAÑOL**: Código, variables, UI, mensajes de error, comentarios
- **Hosting**: tacnafm.com
- **Base de datos**: PostgreSQL (Neon)
- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Express.js + Node.js
- **WebSocket**: Para chat y notificaciones en tiempo real

---

**Última actualización**: Noviembre 2024
**Estado**: En preparación del Panel Super Admin
