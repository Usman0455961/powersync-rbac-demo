import { Pool } from "pg";
import fs from "fs";
import path from "path";

let pool: Pool | null = null;

export function getDbPool() {
  if (!pool) {
    let sslConfig: any = false;

    // Check if SSL is required
    if (process.env.DB_SSL_REQUIRED === "true") {
      sslConfig = { rejectUnauthorized: true };

      // Try to get CA certificate from environment variable first
      if (process.env.DB_SSL_CA_CERT) {
        sslConfig = {
          rejectUnauthorized: true,
          ca: process.env.DB_SSL_CA_CERT,
        };
      } else {
        // Fallback to reading from file
        const caCertPath = path.join(
          process.cwd(),
          "certs",
          "ca-certificate.crt"
        );
        try {
          if (fs.existsSync(caCertPath)) {
            const caCert = fs.readFileSync(caCertPath);
            sslConfig = {
              rejectUnauthorized: true,
              ca: caCert,
            };
          }
        } catch (error) {
          console.warn("Could not read CA certificate:", error);
        }
      }
    }

    pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "powersync_rbac",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      ssl: sslConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getDbPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
