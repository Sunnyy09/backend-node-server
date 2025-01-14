const express = require("express");
require("dotenv").config();

const app = express();

app.get("/", (req, res) => {
  res.send("Hello Backend");
});

app.get("/login", (req, res) => {
  res.send(`<h1>Please login!</h1>`);
});

app.get("/youtube", (req, res) => {
  res.send(`<h2>Visit Youtube to watch this content</h2>`);
});

app.listen(process.env.PORT, () => {
  console.log(`Server is listening at http://localhost:3000`);
});
