import { test, expect } from "@playwright/test"

test.describe.serial("Gestión de Usuarios", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000/auth")

        await page.getByLabel("Correo electrónico").fill("carlos@example.com")
        await page.getByLabel("Contraseña").fill("123")

        const form = page.locator("form#credentials-form")
        await form.getByRole("button", { name: "Iniciar sesión" }).click()

        await page.waitForURL("**/dashboard", { timeout: 10_000 })
        await expect(page).toHaveURL(/.*dashboard/)

        await page.goto("http://localhost:3000/dashboard/users")
    })

    test("crear usuario", async ({ page }) => {
        await expect(page.getByRole("tab", { name: "Docentes", selected: true })).toBeVisible()

        await page.locator("#user-actions").getByRole("button", { name: "Agregar Usuario" }).click()
        await expect(page.getByText("Agregar Nuevo Usuario")).toBeVisible()

        await page.getByRole("textbox", { name: "Nombre" }).fill("Usuario de Prueba by playwright")
        await page.getByRole("textbox", { name: "Apellido" }).fill("Unittest")
        await page.getByRole("textbox", { name: "Correo Electrónico" }).fill("usuario.test@playwright.com")
        await page.getByRole("textbox", { name: "Contraseña Temporal" }).fill("123456")

        const rolCombo = page.getByRole("combobox", { name: "Rol" })
        await rolCombo.click()

        const listbox = page.getByRole("listbox")
        await expect(listbox).toBeVisible()
        await listbox.getByRole("option", { name: /profesor/i }).click()

        const estadoSwitch = page.getByRole("switch", { name: /estado activo/i })
        await expect(estadoSwitch).toBeChecked()

        await page.locator("#add-user-card").getByRole("button", { name: "Agregar Usuario" }).click()

        await expect(page.getByText(/Usuario de Prueba by playwright/)).toBeVisible({ timeout: 5000 })
    })

    test("editar usuario", async ({ page }) => {
        const userRow = page.getByRole("row", { name: /usuario de prueba by playwright/i })
        await expect(userRow).toBeVisible()

        await userRow.getByRole("button").click()

        await page.getByRole("menuitem", { name: /editar/i }).click()

        const apellidoInput = page.getByRole("textbox", { name: "Apellido" })
        await expect(apellidoInput).toHaveValue("Unittest")

        await apellidoInput.fill("Unittest Actualizado")

        await page.locator("#add-user-card").getByRole("button", { name: "Actualizar Usuario" }).click()

        await expect(page.getByText(/Usuario de Prueba by playwright/)).toBeVisible()
        await expect(page.getByText(/Unittest Actualizado/)).toBeVisible()
    })

    test("eliminar usuario", async ({ page }) => {
        const userRow = page.getByRole("row", { name: /unittest actualizado/i })
        await expect(userRow).toBeVisible()

        await userRow.getByRole("button").click()

        await page.getByRole("menuitem", { name: /eliminar/i }).click()

        const dialog = page.getByRole("dialog", { name: /Confirmar eliminación de usuario/i })
        await expect(dialog).toBeVisible()

        await dialog.getByRole("textbox").fill("eliminar")

        await dialog.getByRole("button", { name: /eliminar usuario/i }).click()

        await expect(page.getByText("Unittest Actualizado")).not.toBeVisible({ timeout: 5000 })
    })
})
