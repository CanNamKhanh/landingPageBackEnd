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

// ⭐ BẮT BUỘC
app.options("*", cors());

app.use(express.json());
app.use("/api", formRoute);

app.get("/", (req, res) => {
  res.send("OK");
});

export default app;
