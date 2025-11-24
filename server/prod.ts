import path from "node:path";
import { type Express } from "express";
import { type Server } from "node:http";

export async function setupProd(app: Express, _server: Server) {
  const clientPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  app.use(express.static(clientPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}
