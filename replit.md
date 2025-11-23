# SEG-APO - Sistema de Seguridad y Apoyo Comunitario

## Descripción General

SEG-APO es una plataforma integral de seguridad comunitaria que combina funcionalidades de mensajería en tiempo real (estilo WhatsApp), servicios de taxi (estilo InDriver/Uber), delivery, publicidad local y un sistema de emergencias con botón de pánico. Está diseñado para fortalecer la seguridad y conectividad de comunidades locales en Tacna, Perú.

## Características Principales

### 1. Sistema de Emergencias y Botón de Pánico
- Botón de pánico flotante visible en todo momento
- Confirmación de emergencia con selección de tipo (Policía, 105, Serenazgo, SAMU, Bomberos, Grúa)
- Envío automático de ubicación GPS
- Notificaciones a grupos comunitarios y entidades de socorro
- Seguimiento en tiempo real de emergencias activas

### 2. Chat Comunitario (Estilo WhatsApp)
- Mensajería en tiempo real con WebSocket
- Grupos comunitarios organizados por asociaciones/sectores
- Chat privado entre usuarios
- Notificaciones de mensajes no leídos
- Interfaz familiar estilo WhatsApp con burbujas de mensaje

### 3. Sistema de Taxi (Estilo InDriver/Uber)
- Cambio entre modo conductor y pasajero
- Solicitud de viajes con origen y destino
- Geolocalización en tiempo real
- Estados de viaje: solicitado, aceptado, en curso, completado
- Integración con delivery urgente

### 4. Delivery Básico
- Lista de pedidos integrada a servicios locales
- Pedidos desde restaurantes, farmacias, tiendas
- Notificación automática al administrador del local
- Solicitud de conductor para entrega

### 5. Publicidad y Servicios
- Carrusel de logos publicitarios con auto-scroll pausable
- Carrusel principal de actividades y eventos
- Galería de servicios con logos circulares por categoría
- Control de fechas de emisión de publicidad
- Ventanas emergentes con información de locales

### 6. Radio Online y Audio
- Reproductor de radios online configurables
- Playlist de archivos MP3 con orden personalizable
- Controles de reproducción, volumen y navegación
- Selector entre modo radio y modo MP3

### 7. Panel de Super Administrador (5 Pantallas)
- **Dashboard**: Estadísticas, cuadros y resúmenes de actividades
- **Chat**: Monitoreo de todas las conversaciones comunitarias
- **Notificaciones**: Timeline de alertas con filtros por fecha/tipo
- **Geolocalización**: Mapa con emergencias y taxis en tiempo real
- **Google Maps Ampliado**: Vista de mapa completa para pantallas grandes

## Estructura del Proyecto

```
seg-apo/
├── client/                    # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── ui/          # Componentes Shadcn UI
│   │   │   ├── Encabezado.tsx
│   │   │   ├── BotonPanico.tsx
│   │   │   ├── PiePagina.tsx
│   │   │   ├── CarruselPublicidad.tsx
│   │   │   ├── GaleriaServicios.tsx
│   │   │   ├── ModuloAudio.tsx
│   │   │   └── ...
│   │   ├── pages/           # Páginas principales
│   │   │   ├── landing.tsx
│   │   │   ├── home.tsx
│   │   │   ├── chat.tsx
│   │   │   └── not-found.tsx
│   │   ├── hooks/           # React hooks personalizados
│   │   │   ├── useAuth.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/             # Utilidades
│   │   │   ├── queryClient.ts
│   │   │   ├── authUtils.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx          # Componente raíz
│   │   ├── main.tsx         # Punto de entrada
│   │   └── index.css        # Estilos globales
│   └── index.html
├── server/                   # Backend Express + TypeScript
│   ├── app.ts               # Configuración de Express
│   ├── routes.ts            # Rutas API
│   ├── storage.ts           # Capa de datos
│   ├── db.ts                # Conexión PostgreSQL
│   └── replitAuth.ts        # Autenticación Replit Auth
├── shared/                  # Código compartido
│   └── schema.ts            # Esquemas Drizzle ORM y tipos
├── design_guidelines.md     # Guía de diseño visual
└── package.json

```

## Stack Tecnológico

### Frontend
- **React** 18+ con TypeScript
- **Tailwind CSS** para estilos
- **Shadcn UI** para componentes base
- **Wouter** para enrutamiento
- **TanStack Query** para gestión de estado y caché
- **Socket.io Client** para WebSocket en tiempo real

### Backend
- **Express.js** con TypeScript
- **PostgreSQL** (Neon) para base de datos
- **Drizzle ORM** para interacción con BD
- **Socket.io** para comunicación en tiempo real
- **Replit Auth** (OpenID Connect) para autenticación
- **Express Session** con almacenamiento PostgreSQL

### Infraestructura
- **Neon PostgreSQL** database
- **Replit** para hosting y despliegue
- **WebSocket** para chat y notificaciones en tiempo real

## Sistema de Roles

1. **super_admin**: Acceso completo al sistema, gestión de publicidad, monitoreo de emergencias
2. **admin_cartera**: Gestión de transacciones y saldos
3. **admin_operaciones**: Supervisión de operaciones diarias
4. **supervisor**: Monitoreo de grupos específicos
5. **usuario**: Usuario estándar con acceso a servicios
6. **conductor**: Conductor de taxi con modo especializado
7. **local**: Administrador de servicio local (restaurante, farmacia, etc.)

## Base de Datos

### Tablas Principales

- **users**: Usuarios con roles, ubicación, modo taxi
- **publicidad**: Carruseles de logos y actividades
- **servicios**: Locales comerciales por categoría
- **productos_delivery**: Ítems de menú para delivery
- **grupos_chat**: Grupos comunitarios y privados
- **mensajes**: Mensajes de texto, emergencia, ubicación
- **emergencias**: Alertas de pánico con geolocalización
- **viajes_taxi**: Solicitudes de taxi con origen/destino
- **pedidos_delivery**: Pedidos con productos y conductor
- **radios_online**: URLs de streaming de radio
- **archivos_mp3**: Archivos de audio para playlist
- **configuracion_sitio**: Configuración dinámica del sitio

## Sistema de Diseño

### Colores Institucionales
- **Gradiente Principal**: Morado (#8B5CF6) a Rosa (#EC4899)
- **Botón de Pánico**: Rojo brillante (#EF4444) con animación de pulso
- **Chat Mensajes**: Verde WhatsApp (#25D366) enviados, gris claro recibidos
- **Estados**: Amarillo (pendiente), Verde (activo), Rojo (emergencia)

### Tipografía
- **Fuente**: Inter (Google Fonts)
- **Encabezados**: 32px (H1), 24px (H2), 20px (H3)
- **Cuerpo**: 16px
- **Metadatos**: 14px

### Espaciado
- Unidades principales: 2, 3, 4, 6, 8, 12, 16 (Tailwind)
- Padding componentes: p-4 a p-6
- Separación secciones: my-8 a my-16

## Configuración de Desarrollo

### Variables de Entorno Requeridas
- `DATABASE_URL`: URL de conexión PostgreSQL
- `SESSION_SECRET`: Secreto para sesiones (generado automáticamente)
- `REPL_ID`: ID del Repl (generado automáticamente)
- `ISSUER_URL`: URL del proveedor OIDC (Replit Auth)

### Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Migrar base de datos
npm run db:push

# Forzar migración (si hay conflictos)
npm run db:push --force
```

## Flujos de Usuario Principales

### 1. Registro y Autenticación
- Usuario hace clic en "Iniciar Sesión"
- Redirige a Replit Auth (Google, GitHub, Email)
- Retorna con sesión autenticada
- Perfil creado/actualizado en base de datos

### 2. Solicitud de Emergencia
- Usuario presiona botón de pánico
- Selecciona tipo de emergencia
- Añade descripción opcional
- Sistema captura ubicación GPS
- Notifica a grupos comunitarios y entidades
- Registra en base de datos con estado "pendiente"

### 3. Chat Comunitario
- Usuario selecciona grupo
- Escribe mensaje
- WebSocket envía a todos los miembros en tiempo real
- Mensaje guardado en base de datos
- Actualiza contador de no leídos

### 4. Solicitud de Taxi
- Usuario cambia a modo pasajero
- Introduce origen y destino
- Solicitud enviada a conductores disponibles
- Conductor acepta viaje
- Estado actualiza: solicitado → aceptado → en curso → completado

### 5. Pedido Delivery
- Usuario navega servicios
- Selecciona local y productos
- Confirma pedido
- Local recibe notificación
- Local marca "listo" y solicita conductor
- Conductor entrega pedido

## Seguridad

- **Autenticación**: Replit Auth (OpenID Connect)
- **Sesiones**: Almacenadas en PostgreSQL con expiración de 7 días
- **API**: Middleware `isAuthenticated` protege rutas sensibles
- **Roles**: Verificación de permisos por rol en endpoints administrativos
- **Datos sensibles**: No se exponen credenciales en el frontend

## Idioma

**TODO EL SISTEMA ESTÁ EN ESPAÑOL**:
- Código fuente (variables, funciones, comentarios)
- Interfaz de usuario (textos, botones, mensajes)
- Mensajes de error y validación
- Notificaciones y alertas
- Base de datos (nombres de columnas y tablas en español)

## Estado Actual del Desarrollo

### ✅ Completado (Fase 1 - Frontend)
- Sistema de diseño configurado (colores, tipografía, espaciado)
- Esquema completo de base de datos en Drizzle ORM
- Componentes principales:
  - Encabezado con menú y perfil de usuario
  - Botón de pánico flotante con modal de confirmación
  - Pie de página con formulario de sugerencias
  - Carruseles de publicidad (logos y principal)
  - Galería de servicios con modal de información
  - Módulo de audio (radio online y MP3)
  - Franja de emergencia
  - Cartillas de beneficios
- Páginas:
  - Landing (público)
  - Home (autenticado)
  - Chat comunitario
- Hooks de autenticación
- Integración React Query para fetching

### 🚧 Pendiente (Fase 2 - Backend)
- Implementación de rutas API
- Integración Replit Auth con sesiones PostgreSQL
- WebSocket para chat en tiempo real
- Endpoints de emergencias, taxi, delivery
- Panel de super administrador
- Migración de base de datos

### 🔮 Futuro (Fase 3 - Integración y Pulido)
- Conexión frontend-backend
- Pruebas end-to-end
- Optimización de rendimiento
- Cartera virtual y sistema de pagos
- Servicios de buses
- Calculadora de divisas
- Versión para tablets/autos

## Contacto y Soporte

- **Sitio Web**: tacnafm.com (placeholder)
- **Email**: contacto@segapo.com
- **Ubicación**: Tacna, Perú
- **Soporte**: 24/7 para emergencias

## Licencia

Todos los derechos reservados © 2024 SEG-APO
