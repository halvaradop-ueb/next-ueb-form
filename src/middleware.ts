import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { linksByRole } from "./components/dashboard/sidebar"
import { Role } from "./lib/@types/types"

const getRoutesByRole = (role: Role) => {
    const routes = linksByRole[role]
    if (!routes) {
        return []
    }
    return routes.map((route) => route.url)
}

export const middleware = async (request: NextRequest) => {
    const session = await auth()
    const url = request.nextUrl

    if (url.pathname.startsWith("/auth")) {
        if (!session) return NextResponse.next()
        return NextResponse.redirect(new URL("/dashboard", url))
    }

    const sessionRole = session?.user?.role as Role
    if (!session || !sessionRole) {
        return NextResponse.redirect(new URL("/auth", url))
    }

    const routes = getRoutesByRole(sessionRole)
    const isRouteAllowed = routes.some((route) => url.pathname === route)
    if (!isRouteAllowed) {
        return NextResponse.redirect(new URL("/dashboard", url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
