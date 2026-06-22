const http = require("http");
const net = require("net");
const { spawn } = require("child_process");
const path = require("path");

const PORT = parseInt(process.env.PORT || "18115");
const METRO_PORT = PORT + 1000;

const projectRoot = path.resolve(__dirname, "..");

const env = {
  ...process.env,
  PORT: String(METRO_PORT),
};

console.log(`Starting dev proxy on port ${PORT}, Metro on port ${METRO_PORT}`);

const expo = spawn(
  "pnpm",
  ["exec", "expo", "start", "--localhost", "--port", String(METRO_PORT)],
  { cwd: projectRoot, env, stdio: "inherit" }
);

expo.on("exit", (code) => {
  console.log(`Expo exited with code ${code}`);
  process.exit(code ?? 0);
});

function proxyRequest(req, res) {
  if (req.url === "/status") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "packager-status:running" }));
    return;
  }

  const options = {
    hostname: "localhost",
    port: METRO_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${METRO_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Metro starting, please wait..." }));
    }
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer(proxyRequest);

server.on("upgrade", (req, socket, head) => {
  const proxySocket = net.createConnection(METRO_PORT, "localhost", () => {
    const lines = [`${req.method} ${req.url} HTTP/1.1`];
    for (const [k, v] of Object.entries(req.headers)) {
      lines.push(`${k}: ${v}`);
    }
    lines.push("", "");
    proxySocket.write(lines.join("\r\n"));
    if (head && head.length) proxySocket.write(head);
  });

  socket.pipe(proxySocket);
  proxySocket.pipe(socket);

  socket.on("error", () => proxySocket.destroy());
  proxySocket.on("error", () => socket.destroy());
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Dev proxy listening on port ${PORT}`);
});

const shutdown = () => {
  expo.kill("SIGTERM");
  server.close();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
