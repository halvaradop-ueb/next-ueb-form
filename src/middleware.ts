import { NextRequest, NextResponse } from "next/server"

export const middleware = (request: NextRequest) => {
    //const url = request.nextUrl.href;
    //if (url.includes("/auth")) return NextResponse.next();
    //return NextResponse.redirect(new URL("/auth", url));
    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
}
