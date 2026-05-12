import sql from 'mssql';
import { z } from 'zod';

const envSchema = z.object({
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SERVER: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_PORT: z.string().default('1433').transform(Number),
});

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool) return pool;

  try {
    // Chỉ parse biến môi trường khi thực sự cần kết nối
    const env = envSchema.parse({
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_SERVER: process.env.DB_SERVER,
      DB_NAME: process.env.DB_NAME,
      DB_PORT: process.env.DB_PORT,
    });

    const sqlConfig: sql.config = {
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      server: env.DB_SERVER,
      port: env.DB_PORT,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    console.log(`Connecting to SQL Server: ${env.DB_SERVER}...`);
    pool = await sql.connect(sqlConfig);
    return pool;
  } catch (err) {
    console.error('Lỗi kết nối Database:', err);
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
