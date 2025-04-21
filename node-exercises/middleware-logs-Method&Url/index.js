import express from "express";

const app = express();

const logRequestDetails = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

app.use(logRequestDetails);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/about", (req, res) => {
  res.send("About Page");
});

app.listen(8000, () => {
  console.log("Server is running on  http://localhost:8000");
});
