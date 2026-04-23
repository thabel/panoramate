import mysql, { PoolConnection } from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'panoramate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = {
  async query(sql: string, values?: any[]) {
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.query(sql, values);
      return results;
    } finally {
      connection.release();
    }
  },

  async queryOne(sql: string, values?: any[]) {
    const results = await this.query(sql, values) as any[];
    return results[0] || null;
  },

  async execute(sql: string, values?: any[]) {
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(sql, values);
      return result;
    } finally {
      connection.release();
    }
  },

  async transaction(callback: (connection: PoolConnection) => Promise<void>) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await callback(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getPool() {
    return pool;
  },
};
