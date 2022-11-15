import bcrypt from 'bcryptjs'
import type { RegisterForm } from './types.server'
import { prisma } from './prisma.server'

export const createUser = async (user: RegisterForm) => {
    // hash the password provided in the form, through 10 rounds of salting
    const passwordHash = await bcrypt.hash(user.password, 10)
    // create a new user using prisma's create function
    const newUser = await prisma.user.create({
        data: {
            email: user.email,
            password: passwordHash,
            profile: {
                firstName: user.firstName,
                lastName: user.lastName,
                country: user.country,
            },
        },
    })
    return { id: newUser.id, email: user.email }
}

export const getOtherUsers = async (userId: string) => {
    return prisma.user.findMany({
        where: {
            id: { not: userId },
        },
        orderBy: {
            profile: {
                firstName: 'asc',
            },
        },
    })
}