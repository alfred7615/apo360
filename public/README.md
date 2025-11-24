# SEG-APO - Archivos para Hosting

## Estructura de carpetas para tacnafm.com

```
/public/
├── assets/
│   ├── img/
│   │   ├── carrusel/      # Logos publicitarios del carrusel
│   │   ├── galeria/       # Logos de servicios
│   │   └── servicios/     # Imágenes de negocios locales
│   └── mp3/
│       ├── lista 1/       # Rock Moderna
│       ├── lista 2/       # Cumbia
│       ├── lista 3/       # Éxitos Variado
│       ├── lista 4/       # Mix Variado
│       └── lista 5/       # Romántica
├── api-docs/              # Documentación de API
└── README.md              # Este archivo
```

## Archivos a subir a tacnafm.com

### Esenciales:
1. `dist/public/*` - Archivos compilados del frontend
2. `public/assets/**` - Imágenes y MP3
3. `.env` - Variables de entorno (en servidor, no en repo)

### Base de datos:
- PostgreSQL database (Neon)
- Migración: `npm run db:push`

## Servidor Express
- Puerto: 5000
- Ruta: 0.0.0.0:5000
- Websocket en: /ws

## API Endpoints
- GET `/api/publicidad` - Obtener publicidades
- GET `/api/servicios` - Obtener servicios
- GET `/api/radios-online` - Obtener radios
- GET `/api/archivos-mp3` - Obtener playlists MP3
- POST `/api/emergencias` - Crear emergencia (requiere autenticación)
