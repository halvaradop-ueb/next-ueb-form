import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ConfirmAction } from "@/ui/common/confirm-action"

describe("ConfirmAction", () => {
    it("keeps delete action disabled until confirmation text is valid", () => {
        const setText = vi.fn()
        const setOpen = vi.fn()
        const onDelete = vi.fn()

        render(<ConfirmAction title="usuario" text="" setText={setText} open={true} setOpen={setOpen} onDelete={onDelete} />)

        const deleteButton = screen.getByRole("button", { name: /eliminar usuario/i })
        expect(deleteButton).toBeDisabled()

        fireEvent.change(screen.getByPlaceholderText(/eliminar/i), {
            target: { value: "eliminar" },
        })

        expect(setText).toHaveBeenCalledWith("eliminar")
        expect(deleteButton).toBeEnabled()
    })

    it("calls delete callback and closes the modal when confirmed", () => {
        const setText = vi.fn()
        const setOpen = vi.fn()
        const onDelete = vi.fn()

        render(
            <ConfirmAction title="materia" text="eliminar" setText={setText} open={true} setOpen={setOpen} onDelete={onDelete} />
        )

        fireEvent.click(screen.getByRole("button", { name: /eliminar materia/i }))

        expect(onDelete).toHaveBeenCalledTimes(1)
        expect(setOpen).toHaveBeenCalledWith(false)
    })

    it("closes the modal when cancel is clicked", () => {
        const setText = vi.fn()
        const setOpen = vi.fn()
        const onDelete = vi.fn()

        render(<ConfirmAction title="etapa" text="" setText={setText} open={true} setOpen={setOpen} onDelete={onDelete} />)

        fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))

        expect(setOpen).toHaveBeenCalledWith(false)
        expect(onDelete).not.toHaveBeenCalled()
    })
})
