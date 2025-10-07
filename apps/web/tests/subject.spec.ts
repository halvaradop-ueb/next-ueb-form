import { test, expect } from "@playwright/test"

test("test", async ({ page }) => {
    /**
     * TODO: resolve session issue from next-auth. For that reason, we need to login manually
     */
    await page.goto("http://localhost:3000/auth")
    await page.getByRole("textbox", { name: "Email" }).click()
    await page.getByRole("textbox", { name: "Email" }).fill("carlos@example.com")
    await page.getByRole("textbox", { name: "Email" }).press("Tab")
    await page.getByRole("textbox", { name: "Password" }).fill("123")
    await page.getByRole("button", { name: "Login", exact: true }).click()

    /**
     * Creates a new subject
     */
    await page.getByRole("link", { name: "Materias" }).click()
    await page.getByRole("button", { name: "Nueva Materia" }).click()
    await page.getByRole("textbox", { name: "Nombre *" }).click()
    await page.getByRole("textbox", { name: "Nombre *" }).fill("Test creation of a new subject in the panel.")
    await page.getByRole("textbox", { name: "Descripción" }).click()
    await page
        .getByRole("textbox", { name: "Descripción" })
        .fill("Description of the test for creating a new subject in the panel.")
    await page.getByRole("button", { name: "Crear Materia" }).click()

    /**
     * Verifies the subject was created
     */
    await page.getByRole("cell", { name: "Test creation of a new" }).click()
    await page.getByRole("cell", { name: "Description of the test for" }).click()

    await page
        .locator(
            "tr:nth-child(21) > .p-2.align-middle.whitespace-nowrap.\\[\\&\\:has\\(\\[role\\=checkbox\\]\\)\\]\\:pr-0.\\[\\&\\>\\[role\\=checkbox\\]\\]\\:translate-y-\\[2px\\].text-right > .flex > button"
        )
        .first()
        .click()
    await page.getByRole("dialog", { name: "Asignar Profesor a Materia" }).click()
    await page.getByRole("heading", { name: "Asignar Profesor a Materia" }).click()
    await page.getByRole("combobox", { name: "Profesor *" }).click()
    await page.getByText("Playwright user").click()
    await page.getByRole("button", { name: "Asignar Profesor" }).click()
    await page.getByRole("button", { name: "Eliminar asignación" }).click()
    await page.getByRole("dialog", { name: "Confirmar eliminación de" }).click()
    await page.getByRole("heading", { name: "Confirmar eliminación de" }).click()
    await page.getByRole("textbox", { name: "Escriba 'eliminar' para" }).click()
    await page.getByRole("textbox", { name: "Escriba 'eliminar' para" }).fill("eliminar")
    await page.getByRole("button", { name: "Eliminar asignación" }).click()

    await page.getByRole("button", { name: "Eliminar asignación" }).click()
    await page
        .locator(
            ".hover\\:bg-muted\\/50.data-\\[state\\=selected\\]\\:bg-muted.transition-colors.border-b-0 > .p-2.align-middle.whitespace-nowrap.\\[\\&\\:has\\(\\[role\\=checkbox\\]\\)\\]\\:pr-0.\\[\\&\\>\\[role\\=checkbox\\]\\]\\:translate-y-\\[2px\\].text-right > .flex > button:nth-child(2)"
        )
        .click()
    await page.getByRole("textbox", { name: "Escriba 'eliminar' para" }).fill("eliminar")
    await page.getByRole("button", { name: "Close" }).click()
    await page
        .locator(
            ".hover\\:bg-muted\\/50.data-\\[state\\=selected\\]\\:bg-muted.transition-colors.border-b-0 > .p-2.align-middle.whitespace-nowrap.\\[\\&\\:has\\(\\[role\\=checkbox\\]\\)\\]\\:pr-0.\\[\\&\\>\\[role\\=checkbox\\]\\]\\:translate-y-\\[2px\\].text-right > .flex > button:nth-child(2)"
        )
        .click()
    await page.getByRole("dialog", { name: "Confirmar eliminación de" }).click()
    await page.getByRole("heading", { name: "Confirmar eliminación de" }).click()
    await page.getByRole("textbox", { name: "Escriba 'eliminar' para" }).fill("eliminar")
    await page.getByRole("button", { name: "Eliminar Materia" }).click()
})
