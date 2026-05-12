import sql from 'mssql';
import { z } from 'zod';

const envSchema = z.object({
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_SERVER: z.string(),
  DB_NAME: z.string(),
  DB_PORT: z.string().default('1433').transform(Number),
});

const env = envSchema.parse({
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SERVER: process.env.DB_SERVER,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
});

const sqlConfig = {
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  server: env.DB_SERVER,
  port: env.DB_PORT,
  options: {
    encrypt: true, // Ưu tiên bật true để tương thích với Azure/Vercel
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool) return pool;

  try {
    console.log(`Connecting to SQL Server: ${env.DB_SERVER}:${env.DB_PORT}...`);
    pool = await sql.connect(sqlConfig);
    return pool;
  } catch (err) {
    pool = null;
    throw err;
  }
}

export async function query<T>(queryString: string, params?: Record<string, any>) {
  try {
    const pool = await getPool();
    const request = pool.request();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query<T>(queryString);
    return result;
  } catch (err) {
    console.error('SQL Query Error:', err);
    throw err;
  }
}
