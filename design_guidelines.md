# Guía de Diseño SEG-APO

## Enfoque de Diseño

**Referencia Principal**: WhatsApp para chat + InDriver/Uber para servicios de taxi, combinado con una identidad visual institucional única basada en los mockups proporcionados.

**Principios Clave**:
- Diseño móvil-primero con interfaz familiar estilo mensajería
- Acceso rápido a funciones de emergencia (botón de pánico siempre visible)
- Organización clara de múltiples servicios (taxi, delivery, radio, publicidad)
- Paneles administrativos profesionales con visualización de datos en tiempo real

## Identidad Visual SEG-APO

### Esquema de Color Institucional
- **Gradiente Principal**: Morado a rosa (#8B5CF6 → #EC4899) para encabezados y elementos destacados
- **Botón de Pánico**: Rojo brillante (#EF4444) con efecto pulsante sutil
- **Chat/Mensajería**: Verde WhatsApp (#25D366) para mensajes enviados, gris claro (#F3F4F6) para recibidos
- **Fondos**: Blanco (#FFFFFF) principal, gris muy claro (#F9FAFB) secundario
- **Texto**: Gris oscuro (#1F2937) principal, gris medio (#6B7280) secundario
- **Estados**: Amarillo (#F59E0B) pendiente, verde (#10B981) activo, rojo (#EF4444) emergencia

## Tipografía

**Familia Principal**: Inter (Google Fonts) - moderna, legible en pantallas pequeñas
- **Encabezados H1**: 32px (2xl), font-bold
- **Encabezados H2**: 24px (xl), font-semibold  
- **Encabezados H3**: 20px (lg), font-semibold
- **Cuerpo**: 16px (base), font-normal
- **Subtítulos/Metadatos**: 14px (sm), font-medium
- **Etiquetas pequeñas**: 12px (xs), font-normal

## Sistema de Espaciado

Unidades Tailwind principales: **2, 3, 4, 6, 8, 12, 16**
- Espaciado interno componentes: p-4 a p-6
- Separación entre secciones: my-8 a my-16
- Gaps en grids: gap-4 a gap-6
- Márgenes de contenedores: mx-4 (móvil), mx-auto max-w-7xl (escritorio)

## Componentes Principales

### Encabezado (Navbar)
- Fondo con gradiente morado-rosa institucional
- Logo SEG-APO a la izquierda (40px altura)
- Menú hamburguesa (móvil) / navegación horizontal (escritorio)
- Selector de audio integrado (icono musical)
- Botón de sesión/perfil a la derecha
- Altura: 64px, sticky top-0, sombra suave

### Carruseles (Publicidad y Principal)
- **Carrusel de Logos**: Altura 120px, logos cuadrados 100x100px, auto-scroll pausable
- **Carrusel Principal**: Altura 400px (móvil) / 600px (escritorio), imágenes full-width
- Controles: flechas sutiles, indicadores de puntos, botones pausa/play
- Transiciones suaves 500ms ease-in-out

### Servicios (Logos Circulares)
- Grid responsivo: 3 columnas (móvil), 4-6 columnas (tablet/escritorio)
- Logos circulares 80px diámetro con sombra suave
- Hover: escala 1.1, sombra más pronunciada
- Labels centrados debajo: 12px, truncado con ellipsis
- Ventana emergente al clic: modal centrado, 90% ancho (móvil), max-w-2xl (escritorio)

### Chat Comunitario
- Diseño idéntico a WhatsApp
- Lista de conversaciones: avatar circular 48px, nombre bold, último mensaje truncado, timestamp
- Ventana de chat: fondo con patrón sutil, burbujas redondeadas (rounded-2xl)
- Input inferior: barra fija bottom-0, icono adjunto, campo texto expansible, botón enviar
- Badges verdes para mensajes no leídos

### Botón de Pánico
- **Ubicación**: Floating action button esquina inferior derecha (móvil y escritorio)
- **Tamaño**: 72px circular, z-index alto (z-50)
- **Estilo**: Fondo rojo brillante, icono alerta blanco (32px), sombra fuerte
- **Animación**: Pulso sutil continuo, escala 1.2 al hover
- **Modal de Confirmación**: Centrado, opciones grandes con iconos (Policía, 105, Serenazgo, SAMU, Bomberos, Grúa)

### Paneles Administrativos

**Super Administrador - 5 Pantallas**:
1. **Dashboard**: Grid de tarjetas estadísticas (4 columnas escritorio), gráficos Chart.js, resumen numérico
2. **Chat**: Vista dividida - lista conversaciones 30% izquierda, chat activo 70% derecha
3. **Notificaciones**: Timeline vertical, filtros por fecha/tipo, badges de estado
4. **Geolocalización**: Mapa full-height con Google Maps, panel lateral con alertas activas
5. **Google Maps Ampliado**: Vista limpia solo mapa, controles de capas (taxis, buses, emergencias)

**Navegación Admin**:
- Sidebar vertical plegable (240px expandido, 64px contraído)
- Iconos grandes 24px con labels
- Highlight de sección activa con gradiente institucional

### Módulo de Audio
- Selector desplegable compacto en navbar
- Lista de radios online con iconos de onda
- Player integrado: barra de progreso, controles play/pause/volumen, título actual
- Visualizador de forma de onda opcional

### Formularios
- Inputs: altura 48px, bordes redondeados (rounded-lg), borde gris claro
- Focus: borde gradiente institucional, sombra suave
- Labels: 14px, font-medium, mb-2
- Botones primarios: gradiente morado-rosa, texto blanco, rounded-lg, px-6 py-3
- Botones secundarios: borde gris, fondo blanco, texto gris oscuro

## Imágenes

### Hero Sections
- **Sitio Web Principal**: Hero con imagen de comunidad unida/seguridad (1920x800px)
- Overlay oscuro 40% opacidad para legibilidad de texto
- CTA con fondo blur (backdrop-blur-sm), botones con sombra pronunciada

### Iconografía
- **Librería**: Heroicons (outline para navegación, solid para acciones)
- Tamaños: 20px (pequeño), 24px (estándar), 32px (destacado)
- Emergencia: iconos sólidos rojos
- Servicios: iconos personalizados SVG para cada categoría

## Responsive

- **Móvil** (< 768px): Diseño vertical, navegación inferior, modales full-screen
- **Tablet** (768-1024px): Layout híbrido, sidebar plegable, grids 2-3 columnas  
- **Escritorio** (> 1024px): Sidebar fijo, grids 4-6 columnas, multi-panel para admins

## Animaciones

**Uso Mínimo y Estratégico**:
- Transiciones de navegación: 200ms ease-out
- Hover de botones: transform scale(1.05) 150ms
- Modales: fade-in 300ms
- **Botón pánico**: Pulso continuo keyframe animation
- Notificaciones: Slide-in desde derecha 400ms

---

**Nota Crítica**: Todo texto, labels, placeholders, mensajes de error, confirmaciones y variables deben estar en **español**. El diseño debe transmitir profesionalismo institucional con accesibilidad inmediata a funciones de emergencia.