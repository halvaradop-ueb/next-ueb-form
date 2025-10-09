import { test, expect } from "@playwright/test"

const email = process.env.NEXT_PLAYWRIGHT_USER_EMAIL!
const password = process.env.NEXT_PLAYWRIGHT_USER_PASSWORD!

test.describe("Login flow (email & password)", () => {
    test("should log in successfully with valid credentials", async ({ page }) => {
        await page.goto("http://localhost:3000/login")

        await page.getByLabel("Correo electrónico").fill("carlos@example.com")
        await page.getByLabel("Contraseña").fill("123")

        const form = page.locator("form#credentials-form")
        await form.getByRole("button", { name: "Iniciar sesión" }).click()

        await page.waitForURL("**/dashboard", { timeout: 10_000 })
        await expect(page).toHaveURL(/.*dashboard/)
    })
})
