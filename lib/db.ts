import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Log DATABASE_URL format for debugging (without password)
if (typeof process !== "undefined" && process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const isPooler = dbUrl.includes("pooler.supabase.com");
  const isDirect = dbUrl.includes("db.") && dbUrl.includes(".supabase.co:5432");
  
  if (isDirect) {
    console.error("❌ WARNING: Using direct connection URL. This won't work in Vercel!");
    console.error("   Use connection pooler URL instead (pooler.supabase.com:6543)");
  } else if (isPooler) {
    console.log("✅ Using connection pooler URL");
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

