# APO-360 - Sistema de Seguridad y Apoyo Comunitario

## Overview
APO-360 is a comprehensive community security platform designed to enhance safety, connectivity, and local commerce in Tacna, Peru. It integrates real-time messaging, ride-hailing (taxi), delivery services, local advertising, and an emergency panic button system. The project's vision is to become a vital tool for community interaction and emergency response, providing a robust platform for local services and security.

## User Preferences
- **Codebase changes:** All changes to the codebase, including new features, bug fixes, or refactoring, must prioritize the Spanish language for variable names, function names, comments, UI texts, error messages, and database schema elements.
- **Development Process:** I prefer an iterative development approach, focusing on completing core functionalities before moving to advanced features.
- **Communication:** Please use clear and concise language. If a major change is proposed, explain the reasoning and potential impact before implementation.
- **No changes to files in 'shared/' folder without explicit instruction.**
- **No changes to files in 'server/db.ts' and 'server/replitAuth.ts' without explicit instruction.**

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Main gradient from Purple (#8B5CF6) to Pink (#EC4899). Panic button is bright Red (#EF4444) with a pulse animation. Chat messages use WhatsApp green (#25D366) for sent and light grey for received. Status indicators use Yellow (pending), Green (active), and Red (emergency).
- **Typography**: Inter font from Google Fonts.
- **Spacing**: Utilizes Tailwind CSS spacing units.
- **Component Library**: Shadcn UI is used for base components.

### Technical Implementations
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, Wouter for routing, TanStack Query for state management.
- **Backend**: Express.js with TypeScript and Socket.io for real-time communication.
- **Database Interaction**: Drizzle ORM for PostgreSQL.
- **Authentication**: Triple authentication system (Replit Auth, Email/Password, Google OAuth) controlled by `AUTH_MODE` environment variable. Express Session stored in PostgreSQL.
- **Real-time Features**: WebSockets are central to chat, emergency notifications, and taxi/delivery updates.
- **Internationalization**: The entire system, including codebase, UI, error messages, and database schema, is developed in Spanish.

### Feature Specifications
- **Emergency System**: Floating panic button with drag functionality, multi-destination notifications, automatic GPS, and family contacts management with Google Contacts import.
- **Community Chat**: Real-time messaging, multimedia attachments, and an invitation system.
- **Taxi System**: Driver/passenger modes, ride requests, real-time geolocation, and tracking.
- **Delivery System**: Order listing, local integration, automated notifications, and driver assignment.
- **Local Advertising**: Carousels, event listings, service galleries, timed displays, pop-up information, GPS linking, social media integration, and image upload.
- **Online Radio & Audio**: Centralized audio system with unified playback control, supporting iframe radios and MP3 playlists. Includes a comprehensive MP3 file management system with server-side folder creation, uploads, reordering, and inline editing.
- **Super Administrator Panel**: Dashboard for statistics and admin tools, Chat Monitoring, Notifications Timeline, Real-time Geolocalization, and expanded Google Maps view. Full CRUD for radios online and MP3 files.
- **Role-Based Access Control**: Hierarchical system with 12 role types (policia, bombero, samu, serenazgo, defensa_civil, seguridad_privada, taxi, delivery, local, cambista, prensa, chat). Each role has categories (e.g., "Comisaría Alto Alianza") and subcategories (Jefatura, Operaciones, Personal, Vehículo). Includes role request system where users can apply for roles, and super admins approve/reject requests. Dynamic tabs appear in user panel for each assigned role. Administrative roles: `super_admin`, `admin_cartera`, `admin_operaciones`, `supervisor`.
- **Wallet and Balance System**: User balances, payment methods (bank accounts, Yape, Plin, PayPal), multi-currency, recharge/withdrawal requests, transaction history, and configurable commissions/discounts.
- **Survey and Promotional Popups System**: Dynamic surveys with multiple questions, scheduled popups with mandatory timers, and social interactions.
- **Local Services System (Hierarchical)**: Three-level hierarchy: Categorías, Subcategorías, and Logos/Negocios.
- **Image Upload System**: Secure backend upload with MIME validation, increased size limits, and a reusable frontend component for multi-image uploads.
- **User Profile - Business Section**: Extended business section with fields for photos, videos, and GPS location.
- **User Locations (Lugares)**: Users can save multiple GPS locations for services.
- **User Panel (Panel de Usuario)**: Consolidated dashboard with tabs for Favorites, Marketplace (Mi Tienda Online), and Conductor. Access gated by profile verification.
- **Profile Verification System**: Backend endpoint validates user profile completeness across 5 areas (perfilBasico, chat, taxiPasajero, conductor, vendedor) with a blocking component for restricted features.
- **Currency Exchange Calculator System**: Complete system with 5 currencies (PEN, USD, CLP, ARS, BOB), local exchange rates from "cambistas", a responsive calculator (modal and dedicated page), and an admin panel section for management. Includes automatic history tracking: every time a cambista creates or updates exchange rates, the change is recorded in `historial_tasas_cambio` table with previous/new values, action type, and timestamp.
- **Digital Menu/Cart System (Carta Digital)**: Complete order management system with:
  - **Public Carta Digital**: Access catalogs without login (`/api/carta-digital/:catalogoId`)
  - **Shopping Cart**: Full CRUD operations (`/api/carrito`)
  - **Order Management**: 7-state workflow (pendiente → aceptado → preparando → listo → en_camino → entregado → confirmado)
  - **Delivery Tracking**: Real-time location updates, driver assignment, WebSocket notifications
  - **Wallet Integration**: Balance validation for wallet payments
  - **Currency Conversion**: Uses local cambista rates from `tasas_cambio_locales` table
  - **Database Tables**: `carrito_compras`, `pedidos`, `items_pedido`, `historial_estados_pedido`, `solicitudes_delivery`, `transacciones_pedidos`

### System Design Choices
- **Modular Project Structure**: Clear separation between `client`, `server`, and `shared`.
- **Database Schema**: Comprehensive PostgreSQL schema with 25 tables.
- **Environment Management**: Utilizes environment variables for configuration.

## External Dependencies

-   **Hosting & Deployment**: Replit (development), Hostinger VPS with PM2 + Nginx (production)
-   **Database**: Neon PostgreSQL (development), PostgreSQL local (production)
-   **Authentication**: Replit Auth, Google OAuth
-   **Real-time Communication**: Socket.io
-   **Mapping**: Google Maps API
-   **Email Services**: SMTP (via Gmail SMTP)
-   **Fonts**: Google Fonts (Inter)
-   **Google People API**: For Google Contacts import.

## Recent Changes (January 2026)

### Home Page Geo-Filtering System
- **GeoFilterContext**: Global state management for filters (país, ciudad, búsqueda, ordenamiento)
- **GeoFilterBar Component**: Responsive filter bar with country/city selectors, debounced search input (300ms), and sorting dropdown
- **Filter Options**: Sort by reciente (newest), antiguo (oldest), masLikes, masCompartidos, masFavoritos, masVistas
- **Auto-initialization**: Filters automatically set from user's paisIdActual and ciudadIdActual on mount
- **Active Filter Badges**: Visual indicators of applied filters with clear-all functionality
- **Backend Integration**: API endpoints accept paisId, ciudadId, busqueda, orden query parameters
- **Affected Endpoints**: `/api/items-destacados`, `/api/items-recientes`, `/api/catalogos-con-items`
- **Key Files**: `client/src/contexts/GeoFilterContext.tsx`, `client/src/components/GeoFilterBar.tsx`

### Multi-City Geographic System
- **Countries and Cities Tables**: Added `paises` and `ciudades` tables for geographic multi-tenancy
- **Initial Data**: Perú (Tacna, Moquegua, Puno, Arequipa) and Chile (Arica, Antofagasta)
- **User Location Selection**: Users can select active country/city via `paisIdActual` and `ciudadIdActual` fields
- **City-Separated Content**: The following content types are now separated by city:
  - Publicidad (sliders, carruseles, banners)
  - Servicios locales
  - Eventos calendarizados
  - Encuestas y popups promocionales
  - Avisos de emergencia
  - Tasas de cambio locales (cambistas)
  - Viajes de taxi
  - Solicitudes de delivery
  - Roles y categorías de roles
- **Global Content**: Radio online, MP3 playlists, chat system, and core wallet configuration remain global
- **API Endpoints**:
  - `GET /api/paises` - List all countries (public)
  - `GET /api/ciudades?paisId=` - List cities by country (public)
  - `PUT /api/usuarios/ubicacion-activa` - Update user's active location
  - CRUD for countries/cities (super_admin only): `/api/admin/paises`, `/api/admin/ciudades`

### Password Management System
- **User Password Change**: `POST /api/auth/cambiar-contrasena` with current password verification
- **Admin Password Reset**: `POST /api/admin/usuarios/:id/resetear-contrasena` (super_admin only)
- **Security Tab**: Added to user profile (perfil.tsx) for password management
- **Schema Update**: Added `requiereCambioContrasena` boolean field to users table

### Advanced Chat System Enhancements
- **Three-Tab Interface**: Grupos (conversations), Contactos (manual contacts), Gmail (synced contacts)
- **Contactos Tab Features**:
  - Search contacts by name, phone, or email
  - "Agregar Contacto" button opens search modal to find registered users
  - 3-dot menu on each contact: Iniciar chat, Editar contacto, Invitar a registrarse, Eliminar
  - Favorites marked with star badge
  - "En APO-360" badge for registered users
- **Gmail Tab Features**:
  - Connect/Disconnect Gmail account via Google OAuth + People API
  - Sync button to import contacts from Gmail
  - Contacts sorted alphabetically, registered in APO-360 appear first
  - 3-dot menu: Iniciar chat, Agregar a Contactos, Invitar a registrarse
  - Last sync timestamp displayed
- **Backend Endpoints**:
  - `GET /api/chat/contactos` - User's manual contacts list
  - `POST /api/chat/contactos` - Add contact
  - `PATCH /api/chat/contactos/:id` - Edit contact
  - `DELETE /api/chat/contactos/:id` - Delete contact
  - `GET /api/chat/buscar-usuarios` - Search users by name/phone/email
  - `GET /api/chat/gmail/estado` - Gmail connection status
  - `GET /api/chat/gmail/auth-url` - Get OAuth URL
  - `POST /api/chat/gmail/sincronizar` - Sync Gmail contacts
  - `GET /api/chat/gmail/contactos` - Get synced Gmail contacts
  - `DELETE /api/chat/gmail/desconectar` - Disconnect Gmail
- **Database Tables**: `contactos_chat`, `tokens_gmail`, `archivos_compartidos_chat`
- **Key Files**: `client/src/pages/chat.tsx`, `server/routes.ts` (lines 3935-4400)

### Chat Groups with Authorization System
- **Schema Extensions**: New fields added to `grupos_chat` table:
  - `organizacion_nombre` - Organization name for CHAT role groups
  - `estado_autorizacion` - Authorization status (pendiente, aprobado, rechazado)
  - `fecha_solicitud` - Authorization request date
  - `fecha_autorizacion` - Authorization approval/rejection date
  - `reviewer_id` - Super admin who processed the request
  - `motivo_rechazo` - Rejection reason (if applicable)
  - `sincronizado_panico` - Whether group is synced with panic button system
- **New Table**: `documentos_soporte_grupo` for storing authorization documents (images, PDFs)
- **Group Menu Features**:
  - 3-dot menu on each group: Abrir chat, Ver miembros, Salir del grupo
  - + button in Groups tab header: "Crear grupo" option
  - "Agregar a grupo" option in contact menus
- **Backend Endpoints**:
  - `GET /api/chat/mis-grupos-admin` - Returns groups where user is admin/creator
  - `POST /api/chat/grupos/:id/agregar-miembro` - Add user to group (requires admin role)
- **CHAT Role Groups**: Groups created by users with CHAT role require super admin authorization
  - Must submit supporting documents (organization documents, member lists)
  - Authorized groups appear first in group list (alphabetically sorted)
  - Authorized groups sync with panic button system for emergency notifications

## Recent Changes (December 2025)

### Bug Fixes
- **CONFIRMAR COMPRA Checkout Bug Fixed**: Added guard in `server/index-dev.ts` Vite catch-all middleware to skip non-GET requests and `/api` routes. This ensures POST requests to `/api/pedidos` reach Express instead of being served HTML by Vite's SPA fallback.
- **Reaction Icons (Like/Favorite) Now Gray by Default**: Modified `SeccionLocalesComerciales.tsx` to show Heart and Bookmark icons in gray by default. Icons only show color (red for likes, yellow for favorites) when the current authenticated user has interacted with that specific product.

### New Features
- **User Interactions Map Endpoint**: Added `GET /api/mis-interacciones-productos` endpoint that returns a map of all user's product interactions (likes and favorites) for efficient frontend rendering.
- **Storage Method**: Added `getMisInteraccionesProductos()` in `server/storage.ts` to fetch all interactions for a user as a hash map.