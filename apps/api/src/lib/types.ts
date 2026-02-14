export interface APIResponse<T extends object | unknown[] | boolean = unknown[]> {
    data: T | null
    errors: string[] | null
    message: string | null
}
