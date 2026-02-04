import "dotenv/config";
import express from "express";
import cors from "cors";
import formRoute from "./routes/form.route";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json());
app.use("/api", formRoute);

app.get("/", (_req, res) => {
  res.send("OK");
});

export default app;
