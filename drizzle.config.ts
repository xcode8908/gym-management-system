import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

// Read .env.local manually without external dotenv dependency
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  try {
    const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    const match = envFile.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) {
      dbUrl = match[1];
    }
  } catch (e) {}
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl || 'postgresql://neondb_owner:npg_eBFA1myq5pZn@ep-green-cloud-b5kqwdu0-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require',
  },
});
