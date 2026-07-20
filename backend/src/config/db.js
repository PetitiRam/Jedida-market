import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,

  max: 10,
  idleTimeoutMillis: 30000,

  ssl: {
    rejectUnauthorized: false,
  },
});

export const query = (text, params) => pool.query(text, params);

export { pool };

export default pool;
