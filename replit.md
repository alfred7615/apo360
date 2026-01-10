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

## Recent Changes (December 2025)

### Bug Fixes
- **CONFIRMAR COMPRA Checkout Bug Fixed**: Added guard in `server/index-dev.ts` Vite catch-all middleware to skip non-GET requests and `/api` routes. This ensures POST requests to `/api/pedidos` reach Express instead of being served HTML by Vite's SPA fallback.
- **Reaction Icons (Like/Favorite) Now Gray by Default**: Modified `SeccionLocalesComerciales.tsx` to show Heart and Bookmark icons in gray by default. Icons only show color (red for likes, yellow for favorites) when the current authenticated user has interacted with that specific product.

### New Features
- **User Interactions Map Endpoint**: Added `GET /api/mis-interacciones-productos` endpoint that returns a map of all user's product interactions (likes and favorites) for efficient frontend rendering.
- **Storage Method**: Added `getMisInteraccionesProductos()` in `server/storage.ts` to fetch all interactions for a user as a hash map.