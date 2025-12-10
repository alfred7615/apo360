// Cargar variables de entorno desde .env
require('dotenv').config({ path: '/var/www/apo360.net/.env' });

module.exports = {
  apps: [{
    name: 'apo360',
    script: 'dist/index.js',
    cwd: '/var/www/apo360.net',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      // Variables de base de datos
      DATABASE_URL: process.env.DATABASE_URL,
      PGHOST: process.env.PGHOST,
      PGPORT: process.env.PGPORT,
      PGUSER: process.env.PGUSER,
      PGPASSWORD: process.env.PGPASSWORD,
      PGDATABASE: process.env.PGDATABASE,
      // Variables de autenticación
      SESSION_SECRET: process.env.SESSION_SECRET,
      AUTH_MODE: process.env.AUTH_MODE || 'google',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
      // SMTP
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD
    },
    error_file: '/var/www/apo360.net/logs/error.log',
    out_file: '/var/www/apo360.net/logs/output.log',
    log_file: '/var/www/apo360.net/logs/combined.log',
    time: true
  }]
};
