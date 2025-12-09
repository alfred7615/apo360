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
- **Typography**: Inter font from Google Fonts. Headings (H1, H2, H3) are 32px, 24px, 20px respectively. Body text is 16px, and metadata is 14px.
- **Spacing**: Utilizes Tailwind CSS spacing units, with component padding from p-4 to p-6, and section separation from my-8 to my-16.
- **Component Library**: Shadcn UI is used for base components.

### Technical Implementations
- **Frontend**: React 18+ with TypeScript, styled with Tailwind CSS. Wouter for routing, TanStack Query for state management. Socket.io Client for real-time communication.
- **Backend**: Express.js with TypeScript and Socket.io for real-time communication.
- **Database Interaction**: Drizzle ORM for PostgreSQL.
- **Authentication**: Sistema dual de autenticación:
  - **Desarrollo (Replit)**: Replit Auth (OpenID Connect) - automático cuando `REPL_ID` está presente
  - **Producción (apo360.net)**: Google OAuth 2.0 - requiere `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
  - Controlado por variable `AUTH_MODE` (valores: "replit" o "google")
  - Archivos: `server/authConfig.ts` (lógica dual), `server/replitAuth.ts` (re-exporta)
  - Express Session almacenada en PostgreSQL para ambos modos
- **Real-time Features**: WebSockets are central to chat, emergency notifications, and taxi/delivery updates.
- **Internationalization**: The entire system, including codebase, UI, error messages, and database schema, is developed in Spanish.

### Feature Specifications
- **Emergency System**: Floating panic button with direct drag functionality (tap < 250ms opens modal, hold/drag moves button), icon-only grid selection for emergency services (police, firefighters, SAMU, serenazgo, transit, electric), multi-destination notifications to emergency services, family contacts, and chat groups simultaneously, automatic GPS location with metadata, and optional message field. Includes family contacts management system with emergency notification preferences and Google Contacts import feature.
- **Google Contacts Import**: Authenticated users can import contacts from their Google account into family contacts. Endpoint POST `/api/contactos-familiares/importar-google` uses Google People API. Imported contacts are marked with `relacion: "importado_google"`. Token expiry triggers automatic logout and reauth flow. Scope `https://www.googleapis.com/auth/contacts.readonly` added to Google OAuth configuration.
- **Community Chat**: Real-time messaging (WebSocket), divided layout with group/contact tabs, integrated search, multimedia attachments (files, photos, audio, GPS location), and an invitation system.
- **Taxi System**: Driver/passenger modes, ride requests with real-time geolocation, ride status tracking.
- **Delivery System**: Order listing, local integration, automated local notifications, driver assignment.
- **Local Advertising**: Carousels for logos and activities, event listings, service galleries, timed ad displays, pop-up information, GPS location linking, social media integration, and an image upload system with multi-image support and visual indicators.
- **Online Radio & Audio**: Centralized audio system with AudioControllerContext for unified playback control. Features SelectorAudio dialog in header with modern UI (transport controls, volume slider, source selection). Only one audio stream plays at a time across all pages. Supports iframe radios (Mediastream) and MP3 playlists with localStorage persistence for user selections. Auto-play respects browser restrictions with graceful fallback.
- **MP3 Files Management System**: Complete system for managing MP3 files within playlists. Features physical folder creation on server (`/public/assets/mp3/[playlist-name]/`), file upload with MIME validation (up to 50MB), drag-and-drop reordering with order persistence, inline editing (title, artist), file deletion with physical cleanup. Component `GestorArchivosMp3.tsx` provides responsive UI with mobile/tablet touch support. API endpoints: GET/POST/PATCH/DELETE `/api/archivos-mp3/*`, POST `/api/archivos-mp3/subir/{listaId}`, POST `/api/archivos-mp3/reordenar`.
- **Super Administrator Panel**: Features a dashboard (statistics, admin tools for advertising, radio, users, wallet, surveys), Chat Monitoring, Notifications Timeline, Real-time Geolocalization, and an expanded Google Maps view. Includes full CRUD for radios online and MP3 files.
- **Role-Based Access Control**: Supports various roles including `super_admin`, `admin_cartera`, `admin_operaciones`, `supervisor`, `usuario`, `conductor`, and `local` with specific permissions.
- **Wallet and Balance System**: Comprehensive system with user balances, payment methods (bank accounts, Yape, Plin, PayPal), multi-currency support, recharge/withdrawal requests with approval flow, and transaction history. Includes configurable commissions/discounts for various services.
- **Survey and Promotional Popups System**: Supports dynamic surveys with multiple questions, scheduled popups (advertising, missing persons/pets, events) with mandatory timers, and social interactions (likes, favorites, comments, sharing).
- **Local Services System (Hierarchical)**: Three-level hierarchical system:
  - **Categorías**: Main service categories (Restaurantes, Farmacias, Ferreterías, Tiendas, Peluquerías, Talleres, Mecánica)
  - **Subcategorías**: Nested under categories, managed via accordion UI in admin panel
  - **Logos/Negocios**: Local businesses with category/subcategory assignment, products, social counters (likes, favorites, shares, comments)
  - Table `subcategorias_servicio` linked to `categorias_servicio`
  - Field `subcategoriaId` added to `logos_servicios` table
  - API endpoints: `/api/subcategorias-servicio` (CRUD), `/api/logos-servicio/:id/like`, `/api/logos-servicio/:id/favorito`
  - Component `GaleriaServiciosLocales.tsx` provides hierarchical navigation on home page
  - Admin panel: `gestion-servicios-locales.tsx` with accordion-based category/subcategory management
- **Image Upload System**: Secure backend upload system with endpoint-specific configuration, MIME validation, increased size limits (15MB), and a reusable frontend component for previews and error handling, including multi-image uploads with persistence, visual indicators for GPS, social networks, links, and dates, and robust validations.
- **User Profile - Business Section**: Extended business section with fields for 4 photos (using CameraCapture), 2 videos (file explorer), and GPS location of the business (using MapPicker). Uploads via `/api/upload/perfil-imagenes` and `/api/upload/perfil-videos` endpoints.
- **User Locations (Lugares)**: Users can save multiple GPS locations with custom names (home, work, pharmacy, etc.) for use with taxi and delivery services. Stored in `lugares_usuario` table with API endpoints at `/api/lugares-usuario`.
- **User Panel (Panel de Usuario)**: Consolidated user dashboard accessible via /mi-panel with three tabs: Favoritos (saved content), Marketplace (Mi Tienda Online for selling products), and Conductor (driver management). Uses profile verification system to gate access.
- **Profile Verification System**: Backend endpoint `/api/verificar-perfil` validates user profile completeness across 5 areas: perfilBasico, chat, taxiPasajero, conductor, vendedor. Each area has specific required fields and returns percentage completion. BloqueoServicio component blocks access to restricted features (Marketplace, Conductor mode) until profile requirements are met, showing progress bar and missing fields list.
- **Currency Exchange Calculator System**: Complete currency exchange system with 5 currencies (PEN, USD, CLP, ARS, BOB). Features:
  - Database tables: `configuracion_monedas` (currency config with internet rates) and `tasas_cambio_locales` (local exchange rates from cambistas)
  - Role "cambista" for users who can update local exchange rates
  - Responsive calculator accessible via modal from quick access buttons on both landing page (non-authenticated) and home page (authenticated)
  - Modal-based UI (no page navigation) with buy/sell tabs, quick currency selection, and local rate averaging
  - Dedicated page also available at `/calculadora-cambio` with Card wrapper
  - Admin panel section in "Gestión de Moneda" for managing cambistas, viewing currencies, and monitoring rate history
  - API endpoints: GET/PATCH `/api/monedas/configuracion`, GET/POST/PATCH/DELETE `/api/monedas/tasas-locales`, GET `/api/monedas/promedio/:origen/:destino`, GET/POST/DELETE `/api/admin/cambistas/:usuarioId`

### System Design Choices
- **Modular Project Structure**: Clear separation between `client` (React), `server` (Express), and `shared` (common schemas/types).
- **Database Schema**: Comprehensive PostgreSQL schema with 25 tables covering users, advertising, services, products, chat groups, messages, emergencies, taxi trips, delivery orders, audio configurations, site settings, wallet, surveys, and social interactions.
- **Environment Management**: Utilizes environment variables for sensitive data and configuration.

## External Dependencies

-   **Hosting & Deployment**: Replit (desarrollo) / KVM propio con PM2 + Nginx (producción)
-   **Database**: Neon PostgreSQL (desarrollo) / PostgreSQL en Docker (producción)
-   **Authentication**: Replit Auth (OpenID Connect)
-   **Real-time Communication**: Socket.io
-   **Mapping**: Google Maps API
-   **Email Services**: SMTP (via Gmail SMTP)
-   **Fonts**: Google Fonts (Inter)

## Deployment Configuration

### Production Server (KVM - apo360.net)
- **Server**: KVM VPS con acceso root
- **Process Manager**: PM2 (ecosystem.config.js)
- **Web Server**: Nginx (nginx.conf)
- **Database**: PostgreSQL en Docker
- **SSL**: Let's Encrypt (Certbot)

### Deployment Flow
```
[Replit Desarrollo] → [GitHub] → [KVM Producción]
```

### Key Files
- `DEPLOYMENT.md` - Guía completa de despliegue
- `ecosystem.config.js` - Configuración PM2
- `nginx.conf` - Configuración Nginx
- `scripts/deploy.sh` - Script de actualización automática
- `scripts/setup-replit.sh` - Script de configuración para desarrollo
- `scripts/setup-production.sh` - Script de configuración para producción

### Configuration Files (config/)
- `config/environment.ts` - Detección automática de entorno (dev/prod)
- `config/database.ts` - Configuración de base de datos por entorno
- `config/auth.ts` - Configuración de autenticación por entorno

### Environment Templates
- `.env.example` - Plantilla completa de variables
- `.env.replit` - Plantilla para desarrollo (Replit)
- `.env.production.template` - Plantilla para producción (KVM)

### Update Commands (on KVM)
```bash
cd /root/apo360.net
./deploy.sh
```

### Database Migrations
- `npm run db:push` - Sincronizar esquema (seguro, no borra datos)
- Backups automáticos antes de cada actualización

### Google OAuth Production Setup (Resolver error `invalid_client`)
Para resolver el error `invalid_client` en producción (apo360.net):

1. **Verificar Google Cloud Console**:
   - Ir a https://console.cloud.google.com/apis/credentials
   - Seleccionar el proyecto correcto
   - Editar las credenciales OAuth 2.0

2. **Authorized JavaScript origins**:
   - Agregar: `https://apo360.net`

3. **Authorized redirect URIs** (EXACTO, sin trailing slash):
   - Agregar: `https://apo360.net/api/callback`

4. **OAuth Consent Screen**:
   - Ir a "OAuth consent screen"
   - Verificar que el estado sea "In production" (no "Testing")
   - Si está en "Testing", hacer clic en "PUBLISH APP"
   - Agregar scope: `https://www.googleapis.com/auth/contacts.readonly`

5. **Variables de entorno en producción**:
   - `GOOGLE_CLIENT_ID` - Sin espacios extra
   - `GOOGLE_CLIENT_SECRET` - Sin espacios extra
   - `GOOGLE_CALLBACK_URL=https://apo360.net/api/callback`
   - `AUTH_MODE=google`

6. **Reiniciar aplicación después de cambios**:
   ```bash
   pm2 restart apo360
   ```