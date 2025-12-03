# SEG-APO - Sistema de Seguridad y Apoyo Comunitario

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
- **Emergency System**: Floating panic button with direct drag functionality (tap < 250ms opens modal, hold/drag moves button), icon-only grid selection for emergency services (police, firefighters, SAMU, serenazgo, transit, electric), multi-destination notifications to emergency services, family contacts, and chat groups simultaneously, automatic GPS location with metadata, and optional message field. Includes family contacts management system with emergency notification preferences.
- **Community Chat**: Real-time messaging (WebSocket), divided layout with group/contact tabs, integrated search, multimedia attachments (files, photos, audio, GPS location), and an invitation system.
- **Taxi System**: Driver/passenger modes, ride requests with real-time geolocation, ride status tracking.
- **Delivery System**: Order listing, local integration, automated local notifications, driver assignment.
- **Local Advertising**: Carousels for logos and activities, event listings, service galleries, timed ad displays, pop-up information, GPS location linking, social media integration, and an image upload system with multi-image support and visual indicators.
- **Online Radio & Audio**: Configurable online radio player with iframe support for streaming services (Mediastream), MP3 playlist with custom order, playback controls integrated in header popover, automatic pause of other audio sources, and a dedicated admin section for management. Audio selector accessible via music icon in header showing radios and MP3 lists with auto-playback on selection.
- **Super Administrator Panel**: Features a dashboard (statistics, admin tools for advertising, radio, users, wallet, surveys), Chat Monitoring, Notifications Timeline, Real-time Geolocalization, and an expanded Google Maps view. Includes full CRUD for radios online and MP3 files.
- **Role-Based Access Control**: Supports various roles including `super_admin`, `admin_cartera`, `admin_operaciones`, `supervisor`, `usuario`, `conductor`, and `local` with specific permissions.
- **Wallet and Balance System**: Comprehensive system with user balances, payment methods (bank accounts, Yape, Plin, PayPal), multi-currency support, recharge/withdrawal requests with approval flow, and transaction history. Includes configurable commissions/discounts for various services.
- **Survey and Promotional Popups System**: Supports dynamic surveys with multiple questions, scheduled popups (advertising, missing persons/pets, events) with mandatory timers, and social interactions (likes, favorites, comments, sharing).
- **Local Services System**: Management of service categories, local business logos, products/services with social counters (likes, favorites, shares, comments), and an integrated charging system for adding products.
- **Image Upload System**: Secure backend upload system with endpoint-specific configuration, MIME validation, increased size limits (15MB), and a reusable frontend component for previews and error handling, including multi-image uploads with persistence, visual indicators for GPS, social networks, links, and dates, and robust validations.
- **User Profile - Business Section**: Extended business section with fields for 4 photos (using CameraCapture), 2 videos (file explorer), and GPS location of the business (using MapPicker). Uploads via `/api/upload/perfil-imagenes` and `/api/upload/perfil-videos` endpoints.
- **User Locations (Lugares)**: Users can save multiple GPS locations with custom names (home, work, pharmacy, etc.) for use with taxi and delivery services. Stored in `lugares_usuario` table with API endpoints at `/api/lugares-usuario`.

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
- `deploy.sh` - Script de actualización automática
- `setup-server.sh` - Script de configuración inicial

### Update Commands (on KVM)
```bash
cd /root/apo360.net
./deploy.sh
```

### Database Migrations
- `npm run db:push` - Sincronizar esquema (seguro, no borra datos)
- Backups automáticos antes de cada actualización