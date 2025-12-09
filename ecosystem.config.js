module.exports = {
  apps: [{
    name: 'apo360',
    script: 'dist/index.js',
    cwd: '/var/www/apo360.net',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/www/apo360.net/logs/error.log',
    out_file: '/var/www/apo360.net/logs/output.log',
    log_file: '/var/www/apo360.net/logs/combined.log',
    time: true
  }]
};
