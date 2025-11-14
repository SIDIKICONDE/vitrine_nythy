/**
 * Configuration PM2 pour Nythy Production
 * 
 * Usage:
 * pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [{
    name: 'vitrine_nythy',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/vitrine_nythy',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    
    // Variables d'environnement de base
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    
    // Variables d'environnement de production
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Charger les variables depuis le fichier .env.production
    // IMPORTANT : Créez ce fichier avec toutes les variables nécessaires
    env_file: '.env.production',
    
    // Configuration des logs
    error_file: '/root/.pm2/logs/vitrine-nythy-error.log',
    out_file: '/root/.pm2/logs/vitrine-nythy-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Auto-restart
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Délais
    listen_timeout: 10000,
    kill_timeout: 5000,
    
    // Variables d'environnement supplémentaires
    env_production_extra: {
      // Next.js
      HOSTNAME: '0.0.0.0',
      
      // Désactiver la télémétrie Next.js en production
      NEXT_TELEMETRY_DISABLED: '1',
    }
  }]
};

