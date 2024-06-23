// Define a global db object
// refer to https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let db: PrismaClient;

declare global {
  var _db: PrismaClient | undefined;
}

if (!global._db) {
  global._db = new PrismaClient();
}

db = global._db;

export default db;
