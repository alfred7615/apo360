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
- **Emergency System**: Floating panic button with drag functionality, multi-destination notifications, automatic GPS, and family contacts management. Supports subscription plans and real-time alerts.
- **Community Chat**: Real-time messaging, multimedia attachments, invitation system, and advanced contact management (manual, Gmail sync). Includes authorization for organizational groups.
- **Taxi System**: Driver/passenger modes, ride requests, real-time geolocation, and tracking.
- **Delivery System**: Order listing, local integration, automated notifications, and driver assignment.
- **Local Advertising**: Carousels, event listings, service galleries, timed displays, pop-up information, GPS linking, social media integration, and image upload.
- **Online Radio & Audio**: Centralized audio system with unified playback control, supporting iframe radios and MP3 playlists. Includes comprehensive MP3 file management.
- **Super Administrator Panel**: Dashboard for statistics, chat monitoring, notifications timeline, real-time geolocalization, Google Maps view, and full CRUD for online radios and MP3 files.
- **Role-Based Access Control**: Hierarchical system with 12 role types and categories/subcategories. Includes a role request system and dynamic tab display in the user panel.
- **Wallet and Balance System**: User balances, multiple payment methods, recharge/withdrawal requests, transaction history, and configurable commissions/discounts.
- **Survey and Promotional Popups System**: Dynamic surveys with multiple questions, scheduled popups with mandatory timers, and social interactions.
- **Local Services System**: Three-level hierarchy: Categorías, Subcategorías, and Logos/Negocios.
- **Image Upload System**: Secure backend upload with MIME validation, increased size limits, and reusable frontend components.
- **User Profile - Business Section**: Extended business section with fields for photos, videos, and GPS location.
- **User Locations (Lugares)**: Users can save multiple GPS locations for services.
- **User Panel (Panel de Usuario)**: Consolidated dashboard with tabs for Favorites, Marketplace (Mi Tienda Online), and Conductor, gated by profile verification.
- **Profile Verification System**: Backend endpoint validates user profile completeness across 5 areas, with a blocking component for restricted features.
- **Currency Exchange Calculator System**: Supports 5 currencies, local exchange rates from "cambistas," a responsive calculator, and an admin panel. Includes automatic history tracking of rate changes.
- **Digital Menu/Cart System (Carta Digital)**: Complete order management with public catalog access, full CRUD for shopping carts, 7-state order workflow, real-time delivery tracking, wallet integration, and currency conversion.
- **Multi-City Geographic System**: Supports multi-tenancy with `paises` and `ciudades` tables. Content like advertising, local services, events, emergency notices, exchange rates, taxi trips, delivery requests, and roles are separated by city.
- **Password Management System**: Allows users to change their password and super administrators to reset user passwords.

### System Design Choices
- **Modular Project Structure**: Clear separation between `client`, `server`, and `shared`.
- **Database Schema**: Comprehensive PostgreSQL schema with 25 tables, including `paises`, `ciudades`, `planes_panico`, `suscripciones_panico`, `historial_cobros_panico`, `alertas_emergencia`, `notificaciones_alerta`, `contactos_chat`, `tokens_gmail`, `archivos_compartidos_chat`, `documentos_soporte_grupo`, `carrito_compras`, `pedidos`, `items_pedido`, `historial_estados_pedido`, `solicitudes_delivery`, `transacciones_pedidos`.
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