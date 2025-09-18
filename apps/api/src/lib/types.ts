export interface APIResponse<T extends object | unknown[] = unknown[]> {
    data: T | null
    errors: string[] | null
    message: string | null
}
