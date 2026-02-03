import express from "express";
import cors from "cors";
import formRoute from "./routes/form.route";

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "https://rosie-boost.vercel.app"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(express.json());

app.use("/api", formRoute);

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

export default app;
