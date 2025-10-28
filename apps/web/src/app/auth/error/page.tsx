"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function AuthErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
                <p className="mt-2">Error: {error}</p>
                <p className="mt-4">Please check your configuration and try again.</p>
                <Link href="/auth" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
                    Back to Login
                </Link>
            </div>
        </div>
    )
}

export default function AuthError() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <AuthErrorContent />
        </Suspense>
    )
}
