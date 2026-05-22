/**
 * Точка входа для SprintHost (Phusion Passenger) и любого Node-хостинга без `next start`.
 * @see docs/sprinthost-deploy.md
 */
const { createServer } = require("http");
const { appendFileSync, mkdirSync } = require("fs");
const { join } = require("path");
const { parse } = require("url");
const next = require("next");

const logFile = join(__dirname, "tmp", "startup.log");
function log(msg) {
  const line = `${new Date().toISOString()} ${msg}\n`;
  try {
    mkdirSync(join(__dirname, "tmp"), { recursive: true });
    appendFileSync(logFile, line);
  } catch {
    /* ignore */
  }
  console.error(line.trim());
}

const port = parseInt(process.env.PORT || "3000", 10);
log(`boot port=${port} NODE_ENV=${process.env.NODE_ENV ?? ""} node=${process.version}`);
/** Passenger задаёт PORT; без NODE_ENV Next уходит в dev и падает на хостинге. */
const dev = process.env.NODE_ENV !== "production";
const hostname =
  process.env.PASSENGER_LISTEN_ADDRESS || process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        log(`request ${req.url} failed: ${err?.stack || err}`);
        console.error("Request error", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    })
      .on("error", (err) => {
        log(`listen error: ${err?.stack || err}`);
        throw err;
      })
      .listen(port, () => {
        log(`ready port=${port}`);
        console.log(
          `> Ready on port ${port} (NODE_ENV=${process.env.NODE_ENV || "development"})`,
        );
      });
  })
  .catch((err) => {
    log(`prepare failed: ${err?.stack || err}`);
    console.error(err);
    process.exit(1);
  });
