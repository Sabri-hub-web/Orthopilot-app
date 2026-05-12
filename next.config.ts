import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Évite l’avertissement « inferred workspace root » si un autre package-lock existe au-dessus du dossier app.
  turbopack: {
    root: path.join(__dirname),
  },
  // Modules natifs utilisés par Prisma + adaptateur pg (déploiement Vercel / bundling Next).
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
