/**
 * PM2 Ecosystem Config — ipat.su
 *
 * Запуск на VPS:
 *   PORT=3012 NODE_ENV=production pm2 start .next/standalone/server.js --name ipat
 *   pm2 save
 *
 * Или через этот файл:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "ipat",
      script: ".next/standalone/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3012,
        HOSTNAME: "0.0.0.0",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3012,
        HOSTNAME: "0.0.0.0",
      },
      // Рестарт при падении
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      // Логи
      out_file: "/var/log/ipat.out.log",
      error_file: "/var/log/ipat.err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
