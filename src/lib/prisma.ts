import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from '../../prisma/generated/client'

const pool = new PrismaMariaDb({ 
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
 })
const prisma = new PrismaClient({ adapter: pool })

const globalForPrisma = global as unknown as { prisma: typeof prisma }

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma