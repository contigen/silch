import { NextResponse } from 'next/server'
import NextAuth, { type DefaultSession } from 'next-auth'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import { createOrGetUser } from './lib/db-queries'

declare module 'next-auth/jwt' {
  interface JWT {
    walletAddress?: string
    id?: string
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      walletAddress?: string
    } & DefaultSession['user']
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        walletAddress: {},
      },
      async authorize(credentials) {
        const { walletAddress } = credentials || {}
        if (!walletAddress) return null
        const user = await createOrGetUser(walletAddress as string)
        if (!user) return null
        return {
          id: user.id,
          walletAddress: walletAddress as string,
        }
      },
    }),
  ],
  callbacks: {
    async authorized({ request: req, auth }) {
      const PUBLIC_ROUTES = ['/connect', '/pay', '/status']
      const { pathname } = req.nextUrl
      const isLoggedIn = !!auth?.user.walletAddress
      const isAPublicRoute = PUBLIC_ROUTES.some(
        route => pathname === route || pathname.startsWith(route),
      )
      if (isLoggedIn && pathname === '/connect') {
        const searchParams = req.nextUrl.searchParams
        const callbackURL = searchParams.get('callbackUrl')
        if (callbackURL) {
          return NextResponse.redirect(new URL(callbackURL, req.url))
        }
        return NextResponse.redirect(new URL(`/`, req.url))
      }
      return isLoggedIn || isAPublicRoute
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, ...user }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          walletAddress: token.walletAddress,
        },
      }
    },
  },
  pages: {
    signIn: `/connect`,
    newUser: `/`,
    signOut: `/connect`,
    error: `/connect`,
  },
})
