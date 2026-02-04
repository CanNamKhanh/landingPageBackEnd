import express from "express";
import formRoute from "./routes/form.route";

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin || "*";

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());
app.use("/api", formRoute);

app.get("/", (_req, res) => {
  res.send("OK");
});

export default app;
