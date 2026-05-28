/** Перед next build на VPS: гарантированно ставим tailwind (PM2 часто режет devDeps). */
const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const required = ["@tailwindcss/postcss", "tailwindcss"];

function missing(pkg) {
  try {
    require.resolve(pkg, { paths: [root] });
    return false;
  } catch {
    return true;
  }
}

const toInstall = required.filter(missing);
if (!toInstall.length) {
  console.log("[ensure-build-deps] ok");
  process.exit(0);
}

console.log("[ensure-build-deps] installing:", toInstall.join(", "));
execSync(`npm install ${toInstall.join(" ")} --no-audit --no-fund`, {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});
