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

        await page.goto("http://localhost:3000/dashboard/subjects")
    })

    test.beforeAll(async () => {
        //await supabase.from("subjects").delete().eq("name", "Nueva materia de prueba")
    })

    test("crear nueva materia", async ({ page }) => {
        await page.getByRole("button", { name: "Nueva Materia" }).click()
        await page.getByPlaceholder("Ej: Introducción a la Programación").fill("Nueva materia de prueba")
        await page.getByPlaceholder("Describe el contenido de la materia...").fill("Materia creada automáticamente en test.")
        await page.getByRole("button", { name: "Crear Materia" }).click()

        await expect(page.getByText("Nueva materia de prueba")).toBeVisible()
    })

    test("asignar profesor a materia", async ({ page }) => {
        const fila = page.getByRole("row", { name: /Nueva materia de prueba/i })
        await fila.getByRole("button", { name: /Asignar profesor/i }).click()

        const modal = page.getByRole("dialog", { name: /asignar profesor a materia/i })
        await expect(modal).toBeVisible()

        const comboBox = page.getByRole("combobox", { name: /profesor/i })
        await comboBox.click()

        const listbox = page.getByRole("listbox")
        await expect(listbox).toBeVisible()

        await listbox.getByRole("option", { name: /Ana Pérez/i }).click()
        await modal.getByRole("button", { name: "Asignar Profesor" }).click()
        await expect(modal).toBeHidden()
    })

    test("eliminar materia", async ({ page }) => {
        const fila = page.getByRole("row", { name: /Nueva materia de prueba/i })

        await fila.getByRole("button", { name: /Eliminar/ }).click()
        await page.getByPlaceholder("Escriba 'eliminar' para confirmar").fill("eliminar")
        await page.getByRole("button", { name: "Eliminar Materia" }).click()
        await expect(page.getByText("Nueva materia de prueba")).not.toBeVisible()
    })
})
