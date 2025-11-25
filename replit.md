# SEG-APO - Sistema de Seguridad y Apoyo Comunitario

## Overview
SEG-APO is a comprehensive community security platform designed to enhance safety, connectivity, and local commerce in Tacna, Peru. It integrates real-time messaging, ride-hailing (taxi), delivery services, local advertising, and an emergency panic button system. The project's vision is to become a vital tool for community interaction and emergency response, providing a robust platform for local services and security.

## Recent Changes (November 25, 2025)

### Corrección de Bugs Críticos en Sistema de Publicidad (November 25, 2025)
- **Problemas Reportados por el Usuario**:
  1. Al editar publicidad, no se puede cambiar la imagen (falta botón de subir)
  2. No se pueden crear múltiples publicidades (error con fechas vacías)
  3. Imágenes en grilla no se ven completas (cortadas por object-cover)
  4. Problemas aplican a todos los sectores: carrusel logos, slider principal, logos servicios, popup emergencia, encuestas apoyo

- **Soluciones Implementadas**:
  
  **1. Fix de ImageUpload Component**:
  - Agregado botón "Cambiar Imagen" visible cuando ya existe una imagen previa
  - Nueva interfaz con dos botones: "Cambiar Imagen" (outline) y "Eliminar" (destructive)
  - Ahora es posible reemplazar imágenes directamente durante la edición
  
  **2. Fix de Conversión de Fechas**:
  - Corregida función `convertFormDataToApi` para validar correctamente fechas vacías
  - Ahora verifica que la fecha no sea string vacío antes de convertir a Date
  - Validación con `isNaN(date.getTime())` para detectar fechas inválidas
  - Esto elimina el error "value.toISOString is not a function" al crear/editar
  
  **3. Visualización Completa de Imágenes**:
  - Cambiado de `object-cover` a `object-contain` en TODAS las visualizaciones
  - **PublicidadSection (Admin)**: object-contain con fondo gris para mejor contraste
  - **CarruselPublicidad (Principal)**: max-h-full max-w-full object-contain
  - **CarruselPublicidad (Logos)**: Ya usaba object-contain correctamente
  - **GaleriaServicios**: object-contain con padding para logos circulares
  
  **4. Cobertura Completa en Todos los Sectores**:
  - ✅ carrusel_logos: Imágenes completas visibles
  - ✅ carrusel_principal (Slider): Imágenes completas sin recorte
  - ✅ logos_servicios: Logos completos sin distorsión
  - ✅ popup_emergencia: Usa mismo sistema de carrusel
  - ✅ encuestas_apoyo: Usa mismo sistema de carrusel

- **Archivos Modificados**:
  - `client/src/components/ImageUpload.tsx` - Agregado botón "Cambiar Imagen"
  - `client/src/components/admin/publicidad-section.tsx` - Fix fechas + object-contain
  - `client/src/components/CarruselPublicidad.tsx` - object-contain en slider principal
  - `client/src/components/GaleriaServicios.tsx` - object-contain en logos servicios

- **Resultado**: Sistema de publicidad completamente funcional:
  - ✅ Crear múltiples publicidades sin errores
  - ✅ Editar y cambiar imágenes fácilmente
  - ✅ Imágenes completas visibles en todas las vistas
  - ✅ Funciona en todas las 5 pestañas de tipos de publicidad

### Mejora Crítica del Formulario de Publicidad (November 25, 2025)
- **Problema Reportado**: El usuario indicó que el formulario de "Nueva Publicidad" no mostraba campos para imagen, fechas, ubicación GPS ni redes sociales
- **Solución Implementada**:
  - **Reorganización con Pestañas**: Implementado sistema de 5 pestañas (Básico, Imagen, Fechas, Ubicación, Redes Sociales) para mejor visibilidad y organización
  - **Patrón Controlado**: Todos los inputs migrados a patrón controlado usando `form.watch()` + `onChange` + `form.setValue()`
  - **Fix de Schema**: Agregado `default(sql\`gen_random_uuid()\`)` al campo `id` de publicidad para generación automática de IDs
  - **Mejoras UX**: Descripciones contextuales, guías visuales, iconos descriptivos, placeholders informativos

- **Archivos Modificados**:
  - `client/src/components/admin/publicidad-section.tsx` - Reescrito con sistema de pestañas
  - `shared/schema.ts` - Agregado default al ID de publicidad

- **Resultado**: Todos los campos ahora son visibles y funcionales. La creación/edición de publicidades funciona correctamente sin errores 400.

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
- **Local Advertising**: Carousels for logos and activities, event listings, service galleries, timed ad displays, pop-up information, GPS location linking, social media integration, and an image upload system.
- **Online Radio & Audio**: Configurable online radio player, MP3 playlist with custom order, playback controls, and a dedicated admin section for management.
- **Super Administrator Panel**: Features a dashboard (statistics, admin tools for advertising, radio, users, wallet, surveys), Chat Monitoring, Notifications Timeline, Real-time Geolocalization, and an expanded Google Maps view. Includes full CRUD for radios online and MP3 files.
- **Role-Based Access Control**: Supports various roles including `super_admin`, `admin_cartera`, `admin_operaciones`, `supervisor`, `usuario`, `conductor`, and `local` with specific permissions.
- **Wallet and Balance System**: Configurable commissions/discounts for various services, including a social media sharing incentive.
- **Image Upload System**: Secure backend upload system with endpoint-specific configuration, MIME validation, size limits, and a reusable frontend component for previews and error handling.

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