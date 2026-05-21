/**
 * Точка входа для SprintHost (Phusion Passenger) и любого Node-хостинга без `next start`.
 * @see docs/sprinthost-deploy.md
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const hostname = process.env.HOSTNAME || "127.0.0.1";
const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

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
        console.error("Request error", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
