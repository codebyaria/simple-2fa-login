import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define paths that don't require authentication
const publicPaths = ['/login', '/signup', '/forgot-password']
// Define paths that should be protected
const protectedPaths = ['/dashboard', '/profile', '/settings']
// Define API paths that should be excluded from middleware
const apiPaths = ['/api/auth/login', '/api/auth/logout']

export async function updateSession(request: NextRequest) {
    // Check if the path is an API route that should be excluded
    if (apiPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // Check if it's a public path
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // If user is on a public path and is authenticated, redirect to dashboard
    if (isPublicPath && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is not authenticated and trying to access protected path, redirect to login
    if (!user && !isPublicPath && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user is authenticated, check 2FA status
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_two_fa_enabled')
            .eq('id', user.id)
            .single()

        const { data: twoFaSession } = await supabase
            .from('two_fa_sessions')
            .select()
            .eq('user_id', user.id)
            .eq('is_2fa_completed', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        // Handle /verify-otp page access
        if (request.nextUrl.pathname === '/verify-otp') {
            // If 2FA is not enabled or already completed, redirect to dashboard
            if (!profile?.is_two_fa_enabled || twoFaSession) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
            // Let them access the verification page if 2FA is enabled but not completed
            return supabaseResponse
        }

        // For protected paths, check if 2FA verification is needed
        if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
            if (profile?.is_two_fa_enabled && !twoFaSession) {
                return NextResponse.redirect(new URL('/verify-otp', request.url))
            }
        }
    }

    return supabaseResponse
}