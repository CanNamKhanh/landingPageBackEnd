import express from "express";
import cors from "cors";
import formRoute from "./routes/form.route";

const app = express();
const port = 3000;
app.use(
  cors({
    origin: "https://rosie-boost.vercel.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json());
app.use("/api", formRoute);

app.get("/", (req, res) => {
  res.send("OK");
});

// app.options("/*", (req, res) => {
//   res.sendStatus(204);
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app;
