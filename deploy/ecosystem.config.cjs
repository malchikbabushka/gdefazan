const path = require("path");
const projectRoot = path.join(__dirname, "..");

/** PM2: pm2 start deploy/ecosystem.config.cjs (из корня проекта) */
module.exports = {
  apps: [
    {
      name: "gdefazan",
      script: "server.js",
      cwd: projectRoot,
      instances: 1,
      autorestart: true,
      max_memory_restart: "800M",
      /** Явно подхватить ключи Supabase с диска (иначе Invalid API key при правильном .env.production). */
      env_file: path.join(projectRoot, ".env.production"),
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
