import { APIResponse } from "./types.js"

export const errorResponse = <T extends object | unknown[] = unknown[]>(message: string): APIResponse<T> => ({
    data: null,
    message,
    errors: ["Internal server error"],
})
