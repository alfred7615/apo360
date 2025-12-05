# APO-360 - Plataforma de Seguridad y Servicios Comunitarios

## 📋 Resumen Ejecutivo

**APO-360** es una plataforma integral de seguridad comunitaria y servicios locales diseñada para Tacna, Perú. Combina comunicación en tiempo real, servicios de emergencia, taxi, delivery, comercio local y publicidad en una sola aplicación multiplataforma.

**Dominio:** https://apo360.net

---

## 🏗️ Arquitectura del Sistema

### Plataformas Soportadas
| Plataforma | Estado | Tecnología |
|------------|--------|------------|
| **Web (Escritorio)** | ✅ Implementado | React + Vite |
| **Web (Tablet)** | ✅ Implementado | Diseño responsivo |
| **Web (Móvil)** | ✅ Implementado | PWA Ready |
| **Android (Play Store)** | 🔜 Planificado | React Native / Capacitor |
| **iOS (App Store)** | 🔜 Planificado | React Native / Capacitor |

### Sistema de Roles y Permisos

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPER ADMINISTRADOR                      │
│  - Control total del sistema                                 │
│  - Gestión de todos los usuarios y roles                    │
│  - Configuración del sitio                                  │
│  - Monitoreo de emergencias en tiempo real                  │
│  - Gestión de billetera y comisiones                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ ADMIN CARTERA │    │ADMIN OPERACIONES│   │  SUPERVISOR   │
│ - Gestión     │    │ - Chat grupal  │    │ - Monitoreo   │
│   financiera  │    │ - Emergencias  │    │   de grupos   │
│ - Recargas    │    │ - Taxi/Delivery│    │ - Reportes    │
│ - Retiros     │    │ - Locales      │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   CONDUCTOR   │    │     LOCAL     │    │    USUARIO    │
│ - Aceptar     │    │ - Publicar    │    │ - Chat        │
│   viajes      │    │   productos   │    │ - Emergencias │
│ - Entregas    │    │ - Promociones │    │ - Taxi        │
│ - GPS activo  │    │ - Perfil      │    │ - Delivery    │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18+ | Framework UI |
| **TypeScript** | 5+ | Tipado estático |
| **Vite** | 5+ | Build tool y dev server |
| **Tailwind CSS** | 3+ | Estilos |
| **Shadcn UI** | Latest | Componentes base |
| **Wouter** | 3+ | Enrutamiento |
| **TanStack Query** | 5+ | Estado del servidor |
| **Socket.io Client** | 4+ | Comunicación en tiempo real |
| **Leaflet** | 1.9+ | Mapas interactivos |
| **Framer Motion** | 11+ | Animaciones |
| **Lucide React** | Latest | Iconos |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 20+ | Runtime |
| **Express.js** | 4+ | Framework HTTP |
| **TypeScript** | 5+ | Tipado estático |
| **Socket.io** | 4+ | WebSockets |
| **Drizzle ORM** | Latest | ORM para PostgreSQL |
| **Passport.js** | 0.7+ | Autenticación |
| **Multer** | 1.4+ | Subida de archivos |
| **Express Session** | 1.18+ | Gestión de sesiones |

### Base de Datos
| Tecnología | Propósito |
|------------|-----------|
| **PostgreSQL 15** | Base de datos relacional principal |
| **Drizzle ORM** | Mapeo objeto-relacional |
| **Drizzle Kit** | Migraciones y sincronización |

### Infraestructura de Producción
| Componente | Tecnología |
|------------|------------|
| **Servidor** | Hostinger KVM 1 (Ubuntu) |
| **Process Manager** | PM2 |
| **Reverse Proxy** | Nginx |
| **Contenedores** | Docker (PostgreSQL) |
| **SSL/TLS** | Let's Encrypt (Certbot) |
| **Control de Versiones** | Git + GitHub |

---

## 📂 Estructura del Proyecto

```
apo360.net/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas de la aplicación
│   │   ├── contexts/          # Contextos de React
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── lib/               # Utilidades
│   │   └── App.tsx            # Componente principal
│   └── index.html
├── server/                    # Backend Express
│   ├── routes.ts              # Rutas API principales
│   ├── routes-admin.ts        # Rutas de administración
│   ├── storage.ts             # Interfaz de almacenamiento
│   ├── db.ts                  # Conexión a base de datos
│   └── index.ts               # Entrada del servidor
├── shared/                    # Código compartido
│   └── schema.ts              # Esquema de base de datos (Drizzle)
├── uploads/                   # Archivos subidos
├── ecosystem.config.js        # Configuración PM2
├── nginx.conf                 # Configuración Nginx
├── deploy.sh                  # Script de despliegue
└── .env                       # Variables de entorno
```

---

## 🔄 Flujo de Despliegue

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐
│   REPLIT    │────▶│   GITHUB    │────▶│   HOSTINGER KVM     │
│ (Desarrollo)│     │ (Repositorio)│     │   (Producción)      │
└─────────────┘     └─────────────┘     └─────────────────────┘
      │                    │                      │
      │                    │                      ▼
      │                    │              ┌───────────────┐
      │                    │              │    Nginx      │
      │                    │              │   (Puerto 80) │
      │                    │              └───────┬───────┘
      │                    │                      │
      │                    │              ┌───────▼───────┐
      │                    │              │     PM2       │
      │                    │              │  (Puerto 5000)│
      │                    │              └───────┬───────┘
      │                    │                      │
      │                    │              ┌───────▼───────┐
      │                    │              │  PostgreSQL   │
      │                    │              │   (Docker)    │
      │                    │              └───────────────┘
```

### Comandos de Actualización

**En Replit (después de hacer cambios):**
```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

**En Servidor KVM:**
```bash
cd /root/apo360.net
./deploy.sh
```

---

## 🔧 Funcionalidades Principales

### 1. Sistema de Emergencias (Botón de Pánico)
- Botón flotante arrastrable
- Selección rápida de servicio (policía, bomberos, SAMU, serenazgo)
- Notificación multi-destino (servicios, familia, grupos de chat)
- GPS automático con metadatos
- Historial de emergencias

### 2. Chat Comunitario
- Mensajería en tiempo real (WebSocket)
- Grupos públicos y privados
- Adjuntos multimedia (fotos, audio, ubicación)
- Sistema de invitaciones
- Búsqueda integrada

### 3. Sistema de Taxi
- Modo conductor y pasajero
- Solicitudes con geolocalización
- Seguimiento en tiempo real
- Historial de viajes
- Sistema de calificaciones

### 4. Sistema de Delivery
- Listado de pedidos
- Asignación de conductores
- Seguimiento de entregas
- Integración con locales comerciales

### 5. Publicidad y Comercio Local
- Carruseles de logos y actividades
- Galería de productos/servicios
- Sistema de likes, favoritos, compartir
- Eventos y promociones
- Pop-ups programados

### 6. Radio Online y Audio
- Reproductor de radio en streaming
- Listas MP3 personalizables
- Controles en header
- Gestión desde panel admin

### 7. Billetera Digital
- Múltiples monedas (PEN, USD)
- Métodos de pago (Yape, Plin, PayPal, bancos)
- Solicitudes de recarga/retiro
- Comisiones configurables
- Historial de transacciones

### 8. Sistema de Encuestas y Popups
- Encuestas dinámicas
- Popups publicitarios programados
- Alertas de personas/mascotas perdidas
- Temporizadores obligatorios

---

## 📱 Preparación para App Móvil (Play Store)

### Opciones de Desarrollo

**Opción 1: Capacitor (Recomendado)**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init APO360 net.apo360.app
npx cap add android
npx cap sync
```

**Opción 2: React Native**
- Migrar componentes a React Native
- Mantener lógica de negocio compartida
- APIs REST existentes compatibles

### Características PWA Actuales
- Diseño responsivo completo
- Instalable como app desde navegador
- Funciona offline (limitado)
- Notificaciones push (preparado)

---

## 🔐 Seguridad

- Autenticación OAuth 2.0 (Replit Auth / OpenID Connect)
- Sesiones en PostgreSQL
- Contraseñas hasheadas con bcrypt
- HTTPS obligatorio en producción
- Headers de seguridad (X-Frame-Options, CSP)
- Validación de archivos subidos (MIME types)

---

## 📊 Base de Datos

### Tablas Principales (25+)
- `usuarios` - Usuarios del sistema
- `grupos` - Grupos de chat
- `mensajes` - Mensajes del chat
- `emergencias` - Registro de emergencias
- `viajes_taxi` - Viajes de taxi
- `pedidos_delivery` - Pedidos de delivery
- `locales` - Comercios locales
- `productos` - Productos de locales
- `publicidad` - Anuncios y banners
- `configuracion_audio` - Radios y MP3
- `configuracion_sitio` - Ajustes generales
- `billetera_*` - Sistema financiero
- `encuestas_*` - Sistema de encuestas
- `interacciones_*` - Likes, favoritos, etc.

---

## 🌐 URLs y Endpoints

### Dominio Principal
- **Producción:** https://apo360.net
- **Desarrollo:** Replit (temporal)

### APIs Principales
- `GET /api/user` - Usuario actual
- `GET /api/grupos` - Listar grupos
- `POST /api/emergencias` - Crear emergencia
- `GET /api/viajes-taxi` - Listar viajes
- `POST /api/upload/*` - Subir archivos
- `GET /api/admin/*` - Endpoints de administración

---

## 📞 Soporte y Contacto

**Desarrollado para:** Comunidad de Tacna, Perú
**Dominio:** apo360.net
**Repositorio:** github.com/alfred7615/apo360
