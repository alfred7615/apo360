# SEG-APO - Sistema de Seguridad y Apoyo Comunitario

## Overview
SEG-APO is a comprehensive community security platform designed for Tacna, Peru. It integrates real-time messaging, ride-hailing (taxi), delivery services, local advertising, and an emergency panic button system. Its core purpose is to enhance community safety, connectivity, and local commerce. The project aims to become a vital tool for community interaction and emergency response, providing a robust platform for local services and security.

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