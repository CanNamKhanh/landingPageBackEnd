import express from "express";
import cors from "cors";
import formRoute from "./routes/form.route";

const app = express();

app.use(
  cors({
    origin: "https://rosie-boost.vercel.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use("/api", formRoute);

app.get("/", (req, res) => {
  res.send("OK");
});

export default app;
