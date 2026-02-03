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

if (process.env.NODE_SERVER_MODE !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
