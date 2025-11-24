# SEG-APO - Sistema de Seguridad y Apoyo Comunitario

## Overview
SEG-APO is a comprehensive community security platform designed for Tacna, Peru. It integrates real-time messaging, ride-hailing (taxi), delivery services, local advertising, and an emergency panic button system. Its core purpose is to enhance community safety, connectivity, and local commerce. The project aims to become a vital tool for community interaction and emergency response, providing a robust platform for local services and security.

## Recent Changes (November 24, 2025)
### Panel de Publicidad Mejorado con Vista de Galería
- **Schema Ampliado** (`shared/schema.ts`):
  - Agregados campos de redes sociales: facebook, instagram, whatsapp, tiktok, twitter, youtube, linkedin
  - Agregado campo `fechaCaducidad` para control de vigencia de publicidades
  - Todos los campos opcionales para máxima flexibilidad

- **Vista de Galería en 5 Columnas** (`client/src/components/admin/publicidad-section.tsx`):
  - Modo de visualización dual: Galería (5 columnas) y Lista
  - Grid responsive: 5 columnas (XL), 4 columnas (LG), 3 columnas (MD), 2 columnas (SM)
  - Cards con miniaturas de imágenes en aspecto cuadrado
  - Preview de imagen con placeholder cuando no hay imagen
  - Badges de estado y tipo visibles en cada card
  - Iconos de redes sociales disponibles en miniaturas
  - Fecha de caducidad visible en cada card
  - Acciones rápidas (pausar/activar, editar, eliminar) en cada card

- **Formulario Completo de Publicidad**:
  - Sección "Información Básica": título, descripción, tipo, orden, estado
  - Sección "Imagen de Publicidad": componente ImageUpload integrado
  - Sección "Enlaces": URL de enlace opcional
  - Sección "Fechas de Vigencia": fecha inicio, fecha fin, fecha caducidad
  - Sección "Redes Sociales": 7 redes sociales con iconos coloridos
    * Facebook (azul), Instagram (rosa), WhatsApp (verde)
    * TikTok, Twitter/X (celeste), YouTube (rojo), LinkedIn (azul oscuro)
  - Formulario con ScrollArea para mejor manejo de contenido extenso
  - Validación de formulario con Zod

- **Vista de Lista Mejorada**:
  - Cards horizontales con thumbnail a la izquierda
  - Información completa visible: título, descripción, fechas, redes sociales
  - Enlaces de redes sociales clickeables con iconos
  - WhatsApp genera automáticamente enlace wa.me

### Sistema Completo de Upload de Imágenes
- **Backend Upload System** (`server/uploadConfigByEndpoint.ts`, `server/routes.ts`):
  - Función `createUploadMiddleware(folder, fieldName)` para configuración por endpoint
  - 4 endpoints protegidos con autenticación + rol super_admin:
    * `/api/upload/publicidad` → carpeta 'carrusel', campo 'imagen'
    * `/api/upload/galeria` → carpeta 'galeria', campo 'imagen'
    * `/api/upload/servicios` → carpeta 'servicios', campo 'imagen'
    * `/api/upload/documentos` → carpeta 'documentos', campo 'documento'
  - Validación MIME automática (JPG, PNG, WEBP)
  - Tamaño máximo: 5MB por archivo
  - Generación correcta de URLs públicas: `/assets/{carpeta}/{archivo}`
  - Función `deleteFile()` para eliminación segura de archivos
  
- **Middleware de Seguridad** (`server/authMiddleware.ts`):
  - `requireSuperAdmin` verifica rol desde base de datos usando `storage.getUser()`
  - Previene privilege spoofing
  - Manejo robusto de errores con códigos HTTP apropiados

- **Componente Frontend** (`client/src/components/ImageUpload.tsx`):
  - Reutilizable con detección automática de campo según endpoint
  - Preview de imagen con sincronización inteligente (no sobrescribe durante upload)
  - Props: `endpoint`, `fileField`, `maxSize`, `acceptedFormats`
  - Validación de tipo y tamaño en cliente
  - Manejo de errores con mensajes descriptivos
  - Integrado en panel de administración de publicidad

- **Estructura de Archivos**:
  - Carpetas creadas en `public/assets/`: carrusel, galeria, servicios, documentos
  - Express static middleware para servir archivos desde `/assets`

### Sistema de Carruseles de Publicidad Completado
- **Helpers Utilitarios**: Creado `publicidadUtils.ts` con funciones `isPublicidadActiva()` para filtrado por estado y fechas, y `filtrarPublicidadesActivas()` para ordenamiento y filtrado completo.
- **Componente CarruselPublicidad**: 
  - Soporta 3 tipos: `carrusel_logos` (logos horizontales), `carrusel_principal` (actividades/eventos), `logos_servicios` (servicios locales)
  - Grid responsive: 5 columnas (≥1280px), 3 columnas (tablet), 2 columnas (mobile)
  - Carrusel infinito con autoplay configurable y controles manuales
  - Filtrado automático por tipo, estado activo, y rango de fechas
- **Integración**: Carruseles integrados en Landing y Home con títulos descriptivos y spacing adecuado.
- **Type Safety**: Correcciones en home.tsx para usar propiedades correctas de AuthUser (nombre, rol, activo) y tipado correcto de emergencias con `Emergencia[]`.

## User Preferences
**User Preferences:**
- **Codebase changes:** All changes to the codebase, including new features, bug fixes, or refactoring, must prioritize the Spanish language for variable names, function names, comments, UI texts, error messages, and database schema elements.
- **Development Process:** I prefer an iterative development approach, focusing on completing core functionalities before moving to advanced features.
- **Communication:** Please use clear and concise language. If a major change is proposed, explain the reasoning and potential impact before implementation.
- **No changes to files in 'shared/' folder without explicit instruction.**
- **No changes to files in 'server/db.ts' and 'server/replitAuth.ts' without explicit instruction.**

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Main gradient from Purple (#8B5CF6) to Pink (#EC4899). Panic button is bright Red (#EF4444) with a pulse animation. Chat messages use WhatsApp green (#25D366) for sent messages and light grey for received. Status indicators use Yellow (pending), Green (active), and Red (emergency).
- **Typography**: Inter font from Google Fonts. Headings (H1, H2, H3) are 32px, 24px, 20px respectively. Body text is 16px, and metadata is 14px.
- **Spacing**: Utilizes Tailwind CSS spacing units (2, 3, 4, 6, 8, 12, 16), with component padding from p-4 to p-6, and section separation from my-8 to my-16.
- **Component Library**: Shadcn UI is used for base components.

### Technical Implementations
- **Frontend**: Built with React 18+ and TypeScript, styled with Tailwind CSS. Wouter is used for routing, and TanStack Query for state management and caching. Socket.io Client enables real-time WebSocket communication.
- **Backend**: Developed using Express.js with TypeScript. Socket.io provides real-time communication.
- **Database Interaction**: Drizzle ORM is used to interact with the PostgreSQL database.
- **Authentication**: Replit Auth (OpenID Connect) handles user authentication, with Express Session managing sessions stored in PostgreSQL.
- **Real-time Features**: WebSocket is central to the chat, emergency notifications, and real-time taxi/delivery updates.
- **Internationalization**: The entire system, including codebase (variables, functions, comments), UI, error messages, and database schema, is developed in Spanish.

### Feature Specifications
- **Emergency System**: Floating panic button, emergency type selection, automatic GPS location, notifications to community groups and rescue entities, real-time tracking.
- **Community Chat**: Real-time messaging (WebSocket), community groups, private chats, unread message notifications.
- **Taxi System**: Driver/passenger modes, ride requests with real-time geolocation, ride status tracking.
- **Delivery System**: Order listing, local integration (restaurants, pharmacies), automated local notifications, driver assignment.
- **Local Advertising**: Carousels for logos and activities, event listings, service galleries, timed ad displays, pop-up information.
- **Online Radio & Audio**: Configurable online radio player, MP3 playlist with custom order, playback controls.
- **Super Administrator Panel**: 5 dedicated screens for Dashboard (statistics, admin tools for advertising, radio, users, cartera, surveys), Chat Monitoring, Notifications Timeline, Real-time Geolocalization, and an expanded Google Maps view.
- **Role-Based Access Control**: Supports `super_admin`, `admin_cartera`, `admin_operaciones`, `supervisor`, `usuario`, `conductor`, and `local` roles with specific permissions.
- **Wallet and Balance System**: Configurable commissions/discounts for advertising, taxi services (driver/passenger), delivery, and group chat subscriptions. Includes a unique social media sharing incentive.

### System Design Choices
- **Modular Project Structure**: Clear separation between `client` (React), `server` (Express), and `shared` (common schemas/types) directories.
- **Database Schema**: Comprehensive PostgreSQL schema with 25 tables covering users, advertising, services, products, chat groups, messages, emergencies, taxi trips, delivery orders, audio configurations, and site settings.
- **Environment Management**: Utilizes environment variables for sensitive data and configuration (`DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, `ISSUER_URL`, SMTP credentials).

## External Dependencies

-   **Hosting & Deployment**: Replit
-   **Database**: Neon (PostgreSQL)
-   **Authentication**: Replit Auth (OpenID Connect)
-   **Real-time Communication**: Socket.io
-   **Mapping**: Google Maps API (for geolocalization features)
-   **Email Services**: SMTP (for contact/suggestion forms, specifically via Gmail SMTP)
-   **Fonts**: Google Fonts (Inter)