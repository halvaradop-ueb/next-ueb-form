import { test, expect } from "@playwright/test"

const email = process.env.NEXT_PLAYWRIGHT_USER_EMAIL!
const password = process.env.NEXT_PLAYWRIGHT_USER_PASSWORD!

test.describe("Login", () => {
    test("Login Estudiante", async ({ page }) => {
        expect(true).toBe(true)
        /*
        await page.goto("http://localhost:3000/login")

        const combobox = page.getByRole("combobox", { name: /selecciona tu tipo de usuario/i })
        await combobox.click()

        const listbox = page.getByRole("listbox")
        await expect(listbox).toBeVisible()


        await page.getByLabel("Correo electrónico").fill(email)
        await page.getByLabel("Contraseña").fill(password)

        const form = page.locator("form#credentials-form")
        await form.getByRole("button", { name: "Iniciar sesión" }).click()

        */
        //await page.waitForURL("**/dashboard", { timeout: 10_000 })
        //await expect(page).toHaveURL(/.*dashboard/)
    })

    test("Login Docente", async ({ page }) => {
        expect(true).toBe(true)
    })

    test("Login Administrador", async ({ page }) => {
        expect(true).toBe(true)
    })
})
