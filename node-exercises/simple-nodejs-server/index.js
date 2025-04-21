import http from "http";

const hostName = "localhost";
const PORT = 8000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");

  res.end("Data fetched successfully");
});

server.listen(PORT, () => {
  console.log(`Server is running on http://${hostName}:${PORT}`);
});
