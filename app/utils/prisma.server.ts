import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
declare global {
    var __db: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
    // set up a PrismaClient connection
    prisma = new PrismaClient()
    prisma.$connect()
} else {
    // if in development mode
    if (!global.__db) {
        /* connect ONLY if no connection already available
         because when on a development environment, the live reload feature can be enabled.
         The problem is that it causes issues with Prisma because it could cause multiple connections
         So that the connection pool would end up drying out, thus you'd run into some errors
         */
        global.__db = new PrismaClient()
        global.__db.$connect()
    }
    prisma = global.__db
}

// exportable so it's usable later in the code
export { prisma }