#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
}

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`)
}

function checkPrerequisites() {
    log("🔍 Checking prerequisites...", colors.blue)

    // Check if Node.js is installed
    try {
        execSync("node --version", { stdio: "pipe" })
        log("✅ Node.js is installed", colors.green)
    } catch (error) {
        log("❌ Node.js is not installed", colors.red)
        process.exit(1)
    }

    // Check if pnpm is installed
    try {
        execSync("pnpm --version", { stdio: "pipe" })
        log("✅ pnpm is installed", colors.green)
    } catch (error) {
        log("❌ pnpm is not installed", colors.red)
        process.exit(1)
    }

    // Check if dependencies are installed
    if (!fs.existsSync("node_modules")) {
        log("📦 Installing dependencies...", colors.yellow)
        execSync("pnpm install", { stdio: "inherit" })
    } else {
        log("✅ Dependencies are installed", colors.green)
    }
}

function installPlaywrightBrowsers() {
    log("🌐 Installing Playwright browsers...", colors.blue)
    try {
        execSync("npx playwright install", { stdio: "inherit" })
        log("✅ Playwright browsers installed", colors.green)
    } catch (error) {
        log("❌ Failed to install Playwright browsers", colors.red)
        process.exit(1)
    }
}

function startDevServer() {
    log("🚀 Starting development server...", colors.blue)

    // Check if server is already running
    try {
        execSync("curl -f http://localhost:3000 > /dev/null 2>&1", { stdio: "pipe" })
        log("✅ Development server is already running", colors.green)
        return null
    } catch (error) {
        // Server is not running, start it
        log("🔄 Starting development server...", colors.yellow)
        const serverProcess = execSync("pnpm dev", {
            stdio: "pipe",
            detached: true,
        })

        // Wait for server to start
        let attempts = 0
        const maxAttempts = 30

        while (attempts < maxAttempts) {
            try {
                execSync("curl -f http://localhost:3000 > /dev/null 2>&1", { stdio: "pipe" })
                log("✅ Development server is running", colors.green)
                return serverProcess
            } catch (error) {
                attempts++
                if (attempts < maxAttempts) {
                    process.stdout.write(".")
                    require("child_process").execSync("sleep 1", { stdio: "pipe" })
                }
            }
        }

        log("❌ Failed to start development server", colors.red)
        process.exit(1)
    }
}

function runTests(testType = "all") {
    log(`🧪 Running ${testType} tests...`, colors.blue)

    let command = "npx playwright test"

    switch (testType) {
        case "auth":
            command += " auth.spec.ts"
            break
        case "dashboard":
            command += " dashboard.spec.ts"
            break
        case "users":
            command += " users-management.spec.ts"
            break
        case "subjects":
            command += " subjects-management.spec.ts"
            break
        case "profile":
            command += " profile.spec.ts"
            break
        case "integration":
            command += " integration-workflow.spec.ts"
            break
        case "ui":
            command = "npx playwright test --ui"
            break
        case "debug":
            command = "npx playwright test --debug"
            break
        case "headed":
            command = "npx playwright test --headed"
            break
    }

    try {
        execSync(command, { stdio: "inherit" })
        log("✅ Tests completed successfully", colors.green)
    } catch (error) {
        log("❌ Tests failed", colors.red)
        process.exit(1)
    }
}

function showReport() {
    log("📊 Opening test report...", colors.blue)
    try {
        execSync("npx playwright show-report", { stdio: "inherit" })
    } catch (error) {
        log("❌ Failed to open test report", colors.red)
    }
}

function main() {
    const args = process.argv.slice(2)
    const testType = args[0] || "all"
    const showReportFlag = args.includes("--report")

    log("🎭 Playwright Test Runner", colors.bright)
    log("========================", colors.bright)

    try {
        checkPrerequisites()
        installPlaywrightBrowsers()

        let serverProcess = null

        if (testType !== "ui" && testType !== "debug") {
            serverProcess = startDevServer()
        }

        runTests(testType)

        if (showReportFlag) {
            showReport()
        }

        log("🎉 All tests completed!", colors.green)
    } catch (error) {
        log("💥 Test runner failed:", colors.red)
        log(error.message, colors.red)
        process.exit(1)
    } finally {
        // Cleanup: kill dev server if we started it
        if (serverProcess) {
            try {
                process.kill(-serverProcess.pid)
                log("🛑 Development server stopped", colors.yellow)
            } catch (error) {
                // Ignore errors when killing the process
            }
        }
    }
}

// Handle command line arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
    log("🎭 Playwright Test Runner", colors.bright)
    log("========================", colors.bright)
    log("")
    log("Usage: node scripts/test-runner.js [test-type] [options]")
    log("")
    log("Test Types:")
    log("  all         Run all tests (default)")
    log("  auth        Run authentication tests only")
    log("  dashboard   Run dashboard tests only")
    log("  users       Run user management tests only")
    log("  subjects    Run subject management tests only")
    log("  profile     Run profile tests only")
    log("  integration Run integration workflow tests only")
    log("  ui          Run tests with UI mode")
    log("  debug       Run tests in debug mode")
    log("  headed      Run tests with visible browser")
    log("")
    log("Options:")
    log("  --report    Show test report after completion")
    log("  --help, -h  Show this help message")
    log("")
    log("Examples:")
    log("  node scripts/test-runner.js")
    log("  node scripts/test-runner.js auth --report")
    log("  node scripts/test-runner.js ui")
    log("  node scripts/test-runner.js debug")
    process.exit(0)
}

main()
