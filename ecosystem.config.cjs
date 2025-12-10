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
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://apo360_admin:Admin2025@127.0.0.1:5432/apo360_prod?sslmode=disable',
      PGHOST: '127.0.0.1',
      PGPORT: '5432',
      PGUSER: 'apo360_admin',
      PGPASSWORD: 'Admin2025',
      PGDATABASE: 'apo360_prod',
      SESSION_SECRET: 'Q1WbrRv7MMG7ElYk08ePw7QuIhCkp3hzMEqQJ5tUn2ZNtzOBGgRCOizEpXoYl/1r/Bt7eCWtKMVEseEvVu1kJQ==',
      AUTH_MODE: 'basic',
      GOOGLE_CLIENT_ID: '16943049442-mbv8ll4g7iu186nttlahsdhh8of1jq1u.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: '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',
      GOOGLE_CALLBACK_URL: 'https://apo360.net/api/callback',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'aapomayta15@gmail.com',
      SMTP_PASSWORD: 'frog svje eiih jfga'
    },
    error_file: '/var/www/apo360.net/logs/error.log',
    out_file: '/var/www/apo360.net/logs/output.log',
    log_file: '/var/www/apo360.net/logs/combined.log',
    time: true
  }]
};
