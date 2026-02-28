import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "happy-dom",
        setupFiles: ["./tests/unit/setup.ts"],
        globals: true,
        include: ["tests/unit/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: ["node_modules/**", "tests/**", "**/*.config.*", "**/*.d.ts", ".next/**"],
        },
    },
    resolve: {
        alias: [
            {
                find: "@/auth",
                replacement: path.resolve(__dirname, "./src/lib/auth.ts"),
            },
            {
                find: "@",
                replacement: path.resolve(__dirname, "./src"),
            },
        ],
    },
})
