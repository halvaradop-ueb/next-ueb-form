import { afterEach, describe, expect, it, vi } from "vitest"
import { API_ENDPOINT, createRequest, createService, roundNumericValues } from "@/services/utils"

describe("Service Utils", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("creates requests with endpoint, method and serialized body", async () => {
        const request = createRequest("POST", "users", { email: "test@ueb.local" })

        expect(request.url).toBe(`${API_ENDPOINT}/users`)
        expect(request.method).toBe("POST")
        expect(await request.json()).toEqual({ email: "test@ueb.local" })
    })

    it("returns parsed JSON for successful responses", async () => {
        vi.spyOn(global, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ ok: true, data: [1, 2] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        )

        const result = await createService(new Request("http://localhost:4000"))
        expect(result).toEqual({ ok: true, data: [1, 2] })
    })

    it("throws descriptive errors for failed responses", async () => {
        vi.spyOn(global, "fetch").mockResolvedValue(new Response("error-body", { status: 500, statusText: "Internal Error" }))

        await expect(createService(new Request("http://localhost:4000"), "Custom error")).rejects.toThrow(
            "Failed to fetch: Custom error"
        )
    })

    it("rounds decimal numbers to two places in nested API responses", async () => {
        vi.spyOn(global, "fetch").mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        averageScore: 8.678912,
                        trends: {
                            percentage: 4.23999,
                        },
                        points: [1.2366, -2.3456, 10],
                    },
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            )
        )

        const result = await createService(new Request("http://localhost:4000"))

        expect(result).toEqual({
            data: {
                averageScore: 8.68,
                trends: {
                    percentage: 4.24,
                },
                points: [1.24, -2.35, 10],
            },
        })
    })

    it("roundNumericValues leaves non-decimal and non-numeric values untouched", () => {
        const result = roundNumericValues({
            count: 5,
            label: "stable",
            active: true,
            value: 2.5555,
        })

        expect(result).toEqual({
            count: 5,
            label: "stable",
            active: true,
            value: 2.56,
        })
    })
})
