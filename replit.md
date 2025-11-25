# SEG-APO - Sistema de Seguridad y Apoyo Comunitario

## Recent Changes (Noviembre 25, 2025)

### Sistema Completo de Encuestas y Popups Publicitarios
- **5 Tablas de Base de Datos**:
  - `encuestas` - Con soporte para múltiples preguntas JSON, fechas inicio/fin, estado, contador de respuestas
  - `popups_publicitarios` - Imágenes/videos con temporizador obligatorio, tipos (publicidad, persona_desaparecida, mascota_desaparecida, evento)
  - `interacciones_sociales` - Likes, favoritos, compartir, calendario por contenido
  - `respuestas_encuesta` - Respuestas de usuarios con índice de pregunta y opción
  - `comentarios` - Sistema de comentarios para popups y encuestas
- **Panel de Administración Completo** (gestion-encuestas.tsx):
  - Tabs para separar encuestas vs popups
  - CRUD completo con modales de creación/edición
  - Estadísticas en tiempo real (activos, total respuestas, vistas)
  - Editor de preguntas dinámico con opciones múltiples
  - Visualización de resultados con barras de progreso
- **Componente PopupViewer**:
  - Temporizador estilo YouTube (segundos obligatorios antes de poder omitir)
  - Interacciones sociales: likes, favoritos, comentarios, compartir, calendario
  - Botones de compartir en Facebook, X/Twitter, WhatsApp, copiar enlace
  - Badges coloridos por tipo de popup
- **Datos de Prueba Insertados**:
  - 23 usuarios falsos con roles variados (usuario, conductor, local)
  - 5 encuestas con 2-3 preguntas cada una
  - 10 popups (3 personas desaparecidas, 2 mascotas desaparecidas, 5 publicidad)
- **Script de Seed**: server/seed-encuestas.ts para datos de prueba reproducibles

### Submenú GESTIONES en Panel de Administración
- **Estructura de navegación mejorada**: Submenú colapsable "GESTIONES" usando Collapsible de shadcn
- **11 secciones de gestión implementadas**:
  1. Publicidad - Gestión completa de anuncios y logos
  2. Radio Online/MP3 - Control de radios y listas de reproducción
  3. Usuarios/Administradores - Administración de usuarios y roles
  4. Cartera/Saldos - Sistema de billetera (estructura MVP)
  5. Encuestas/Popups - Encuestas e imágenes popup (estructura MVP)
  6. Servicios - Mudanzas, alquileres y servicios locales
  7. Eventos - Calendario de eventos de la comunidad
  8. Taxi - Gestión de viajes y conductores
  9. Buses - Rutas y horarios de buses (estructura MVP)
  10. Cambio de Moneda - Tipos de cambio (estructura MVP)
  11. Configuración - Ajustes del sistema
- **Rutas backend agregadas**: GET /api/taxi/conductores para filtrar conductores
- **Todas las pantallas incluyen**: data-testid para testing, estados de carga, estados vacíos

### Mejoras al Sistema de Carga Múltiple de Imágenes
- **Persistencia Automática**: Ahora las imágenes subidas se persisten automáticamente en la BD
  - Callback `onImagesUploaded` crea registros con datos mínimos (imagenUrl, tipo, estado, titulo, orden)
  - Usa `Promise.allSettled` para manejo granular de errores (evita fallo total si una imagen falla)
  - Feedback detallado al usuario: "X de Y imágenes guardadas" o "Guardado parcial"
- **Indicadores Visuales de Información Adicional**: Iconos pequeños debajo de cada imagen en la grilla
  - GPS (MapPin azul): Coordenadas válidas en rangos -90/90, -180/180
  - Redes Sociales: Facebook, Instagram, WhatsApp, TikTok, Twitter, YouTube, LinkedIn con validación de formato
  - Enlaces (ExternalLink morado): URLs válidas con http:// o https://
  - Fechas (Calendar naranja): Si tiene fechas de inicio/fin/caducidad configuradas
  - Tooltips con información detallada (coordenadas GPS, URLs de redes sociales)
- **Validaciones Robustas**:
  - GPS: Valida rangos de latitud/longitud y != 0
  - URLs: Verifica formato válido (http/https) y longitud mínima
  - Redes sociales: Valida que contengan dominio esperado (facebook.com, instagram.com) o formato @ para handles

## Overview
SEG-APO is a comprehensive community security platform designed to enhance safety, connectivity, and local commerce in Tacna, Peru. It integrates real-time messaging, ride-hailing (taxi), delivery services, local advertising, and an emergency panic button system. The project's vision is to become a vital tool for community interaction and emergency response, providing a robust platform for local services and security.

## User Preferences
- **Codebase changes:** All changes to the codebase, including new features, bug fixes, or refactoring, must prioritize the Spanish language for variable names, function names, comments, UI texts, error messages, and database schema elements.
- **Development Process:** I prefer an iterative development approach, focusing on completing core functionalities before moving to advanced features.
- **Communication:** Please use clear and concise language. If a major change is proposed, explain the reasoning and potential impact before implementation.
- **No changes to files in 'shared/' folder without explicit instruction.**
- **No changes to files in 'server/db.ts' and 'server/replitAuth.ts' without explicit instruction.**

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Main gradient from Purple (#8B5CF6) to Pink (#EC4899). Panic button is bright Red (#EF4444) with a pulse animation. Chat messages use WhatsApp green (#25D366) for sent and light grey for received. Status indicators use Yellow (pending), Green (active), and Red (emergency).
- **Typography**: Inter font from Google Fonts. Headings (H1, H2, H3) are 32px, 24px, 20px respectively. Body text is 16px, and metadata is 14px.
- **Spacing**: Utilizes Tailwind CSS spacing units, with component padding from p-4 to p-6, and section separation from my-8 to my-16.
- **Component Library**: Shadcn UI is used for base components.

### Technical Implementations
- **Frontend**: React 18+ with TypeScript, styled with Tailwind CSS. Wouter for routing, TanStack Query for state management. Socket.io Client for real-time communication.
- **Backend**: Express.js with TypeScript and Socket.io for real-time communication.
- **Database Interaction**: Drizzle ORM for PostgreSQL.
- **Authentication**: Replit Auth (OpenID Connect) with Express Session managing sessions in PostgreSQL.
- **Real-time Features**: WebSockets are central to chat, emergency notifications, and taxi/delivery updates.
- **Internationalization**: The entire system, including codebase, UI, error messages, and database schema, is developed in Spanish.

### Feature Specifications
- **Emergency System**: Floating panic button, emergency type selection, automatic GPS location, notifications to community groups and rescue entities, real-time tracking.
- **Community Chat**: Real-time messaging (WebSocket), community groups, private chats, unread message notifications.
- **Taxi System**: Driver/passenger modes, ride requests with real-time geolocation, ride status tracking.
- **Delivery System**: Order listing, local integration, automated local notifications, driver assignment.
- **Local Advertising**: Carousels for logos and activities, event listings, service galleries, timed ad displays, pop-up information, GPS location linking, social media integration, and an image upload system with multi-image support and visual indicators.
- **Online Radio & Audio**: Configurable online radio player, MP3 playlist with custom order, playback controls, and a dedicated admin section for management.
- **Super Administrator Panel**: Features a dashboard (statistics, admin tools for advertising, radio, users, wallet, surveys), Chat Monitoring, Notifications Timeline, Real-time Geolocalization, and an expanded Google Maps view. Includes full CRUD for radios online and MP3 files.
- **Role-Based Access Control**: Supports various roles including `super_admin`, `admin_cartera`, `admin_operaciones`, `supervisor`, `usuario`, `conductor`, and `local` with specific permissions.
- **Wallet and Balance System**: Configurable commissions/discounts for various services, including a social media sharing incentive.
- **Image Upload System**: Secure backend upload system with endpoint-specific configuration, MIME validation, increased size limits (15MB), and a reusable frontend component for previews and error handling, including multi-image uploads and compact grid display with visual indicators.

### System Design Choices
- **Modular Project Structure**: Clear separation between `client` (React), `server` (Express), and `shared` (common schemas/types).
- **Database Schema**: Comprehensive PostgreSQL schema with 25 tables covering users, advertising, services, products, chat groups, messages, emergencies, taxi trips, delivery orders, audio configurations, and site settings.
- **Environment Management**: Utilizes environment variables for sensitive data and configuration.

## External Dependencies

-   **Hosting & Deployment**: Replit
-   **Database**: Neon (PostgreSQL)
-   **Authentication**: Replit Auth (OpenID Connect)
-   **Real-time Communication**: Socket.io
-   **Mapping**: Google Maps API
-   **Email Services**: SMTP (via Gmail SMTP)
-   **Fonts**: Google Fonts (Inter)