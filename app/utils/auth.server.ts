import type {LoginForm, RegisterForm} from './types.server'
import {prisma} from './prisma.server'
import {createUser} from './user.server'
import bcrypt from 'bcryptjs'
import {createCookieSessionStorage, json, redirect} from '@remix-run/node'

export async function register(user: RegisterForm) {
    // count the number of users where the email field matches the form's email
    const exists = await prisma.user.count({ where: { email: user.email } })
    if (exists) {
        // return the error in a JSON response with status of authentication error status
        return json({ error: `User already exists with that email` }, { status: 400 })
    }
    const newUser = await createUser(user)
    // if the user was NOT created & returned
    if (!newUser) {
        return json(
            {
                error: `Something went wrong trying to create a new user.`,
                fields: { email: user.email, password: user.password },
            },
            { status: 400 },
        )
    }
    return createUserSession(newUser.id, '/home');
}

export async function login({ email, password }: LoginForm) {
    const user = await prisma.user.findUnique({
        where: { email },
    })
    // using bcrypt's compare functions to compare hashed passwords - the passed and stored one
    if (!user || !(await bcrypt.compare(password, user.password)))
        return json({ error: `Incorrect login` }, { status: 400 })
    return createUserSession(user.id, "/");
}


const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) { // if no secret is provided as an environmental variable
    throw new Error('SESSION_SECRET must be set')
}
// create a storage bucket that holds the sessions as they are created
const storage = createCookieSessionStorage({
    cookie: {
        name: 'kudos-session',
        // if in a production environment -> this will be secure
        // otherwise on a localhost setting it wouldn't work
        secure: process.env.NODE_ENV === 'production',
        // this is what keeps the cookie secure
        secrets: [sessionSecret],
        sameSite: 'lax',
        path: '/',
        // session's lifespan
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
    },
})

export async function createUserSession(userId: string, redirectTo: string) {
    // use the set-up storage bucket to use a function that creates a new session
    const session = await storage.getSession()
    session.set('userId', userId)
    // Remix's redirect function
    return redirect(redirectTo, {
        headers: {
            'Set-Cookie': await storage.commitSession(session),
        },
    })
}

export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
    const session = await getUserSession(request)
    const userId = session.get('userId')
    if (!userId || typeof userId !== 'string') {
        const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
        throw redirect(`/login?${searchParams}`)
    }
    return userId
}

function getUserSession(request: Request) {
    return storage.getSession(request.headers.get('Cookie'))
}

async function getUserId(request: Request) {
    const session = await getUserSession(request)
    const userId = session.get('userId')
    if (!userId || typeof userId !== 'string') return null
    return userId
}

export async function getUser(request: Request) {
    const userId = await getUserId(request)
    if (typeof userId !== 'string') {
        return null
    }

    try {
        return await prisma.user.findUnique({
            where: {id: userId},
            select: {id: true, email: true, profile: true},
        })
    } catch {
        throw logout(request)
    }
}

export async function logout(request: Request) {
    const session = await getUserSession(request)
    return redirect('/login', {
        headers: {
            'Set-Cookie': await storage.destroySession(session),
        },
    })
}