/** PM2: pm2 start deploy/ecosystem.config.cjs (из корня проекта) */
module.exports = {
  apps: [
    {
      name: "gdefazan",
      script: "server.js",
      cwd: __dirname.replace(/\/deploy$/, "") || process.cwd(),
      instances: 1,
      autorestart: true,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
