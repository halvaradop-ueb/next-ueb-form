import { APIResponse } from "./types"

export const errorResponse = (message: string): APIResponse => ({
    data: null,
    message,
    errors: ["Internal server error"],
})
