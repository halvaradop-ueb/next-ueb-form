import { test, expect } from "@playwright/test"

const email = process.env.NEXT_PLAYWRIGHT_USER_EMAIL!
const password = process.env.NEXT_PLAYWRIGHT_USER_PASSWORD!

test.describe.serial("Gestión de Etapas", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000/auth")

        await page.getByLabel("Correo electrónico").fill(email)
        await page.getByLabel("Contraseña").fill(password)

        const form = page.locator("form#credentials-form")
        await form.getByRole("button", { name: "Iniciar sesión" }).click()

        await page.waitForURL("**/dashboard", { timeout: 10_000 })
        await expect(page).toHaveURL(/.*dashboard/)

        await page.goto("http://localhost:3000/dashboard/stages")
    })

    test("Create stage", async ({ page }) => {
        await page.getByRole("button", { name: "Nueva Etapa" }).click()

        const modal = page.getByRole("dialog", { name: /crear nueva etapa/i })
        await expect(modal).toBeVisible()

        await modal.getByPlaceholder("Ej: Metodología de enseñanza").fill("Etapa automatizada test")
        await modal.getByPlaceholder("Describe el propósito de esta categoría...").fill("Descripción de prueba automatizada")

        const combo = modal.getByRole("combobox", { name: /tipo de la etapa/i })
        await combo.click()

        const listbox = page.getByRole("listbox")
        await expect(listbox).toBeVisible()

        await listbox.getByRole("option", { name: "Para Estudiantes" }).click()
        await modal.getByRole("button", { name: "Crear Etapa" }).click()
        await expect(modal).toBeHidden()
        await expect(page.getByRole("row", { name: /Etapa automatizada test/i })).toBeVisible()
    })

    test("Update stage", async ({ page }) => {
        const row = page.getByRole("row", { name: /Etapa automatizada test/i })
        await expect(row).toBeVisible()

        await row.getByRole("button", { name: "Editar" }).click()

        const modal = page.getByRole("dialog", { name: /editar etapa/i })
        await expect(modal).toBeVisible()

        const nombreInput = modal.getByPlaceholder("Ej: Metodología de enseñanza")
        await nombreInput.fill("Etapa automatizada actualizada")

        const descripcionInput = modal.getByPlaceholder("Describe el propósito de esta categoría...")
        await descripcionInput.fill("Descripción actualizada desde test E2E")

        const combo = modal.getByRole("combobox", { name: /tipo de la etapa/i })
        await combo.click()

        const listbox = page.getByRole("listbox")
        await expect(listbox).toBeVisible()

        await listbox.getByRole("option", { name: "Para Profesores" }).click()
        await modal.getByRole("button", { name: /guardar cambios/i }).click()
        await expect(modal).toBeHidden()

        const updatedRow = page.getByRole("row", { name: /Etapa automatizada actualizada/i })
        await expect(updatedRow).toBeVisible()
        await expect(updatedRow.getByText("Profesor")).toBeVisible()
    })

    test("Delete stage", async ({ page }) => {
        const row = page.getByRole("row", { name: /Etapa automatizada actualizada/i })
        await expect(row).toBeVisible()

        await row.getByRole("button", { name: "Eliminar" }).click()

        const dialog = page.getByRole("dialog", { name: /Confirmar eliminación de Etapa/i })
        await expect(dialog).toBeVisible()

        const input = dialog.getByRole("textbox", { name: /escriba 'eliminar' para confirmar/i })
        await input.fill("eliminar")

        await dialog.getByRole("button", { name: /Eliminar Etapa/i }).click()
        await expect(dialog).toBeHidden()
        await expect(page.getByRole("row", { name: /Etapa automatizada actualizada/i })).toHaveCount(0)
    })
})
