// server.ts
import express from "express";
import cors from "cors";
import formRoute from "./routes/form.route";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", formRoute);

app.get("/", (req, res) => {
  res.send("OK");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

module.exports = app;
