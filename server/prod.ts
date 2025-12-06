import path from "node:path";
import express, { type Express } from "express";
import { type Server } from "node:http";

export async function setupProd(app: Express, _server: Server) {
  const clientPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  const publicAssetsPath = path.resolve(process.cwd(), "public", "assets");
  
  app.use('/assets', express.static(publicAssetsPath));
  app.use(express.static(clientPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}
