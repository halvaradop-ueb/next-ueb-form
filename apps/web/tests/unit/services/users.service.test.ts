import { describe, it, expect } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "../setup"
import { getUsers, addUser, updateUser, deleteUser, updateUserPassword } from "@/services/users"
import type { User } from "@ueb/types/user"

const API_BASE = "http://localhost:4000/api/v1"

const mockUser: Partial<User> = {
    id: "test-user-id",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@test.com",
    phone: "1234567890",
    photo: "https://example.com/photo.jpg",
    role: "professor",
    created_at: new Date().toISOString(),
}

const mockUsers: Partial<User>[] = [
    mockUser,
    {
        id: "test-user-id-2",
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@test.com",
        phone: "0987654321",
        photo: "https://example.com/photo2.jpg",
        role: "admin",
        created_at: new Date().toISOString(),
    },
]

describe("Users Service", () => {
    describe("getUsers", () => {
        it("should fetch all users successfully", async () => {
            server.use(
                http.get(`${API_BASE}/users`, () => {
                    return HttpResponse.json({ data: mockUsers })
                })
            )

            const result = await getUsers()

            expect(result).toEqual(mockUsers)
            expect(result).toHaveLength(2)
            expect(result[0].email).toBe("john.doe@test.com")
        })

        it("should return empty array when no users exist", async () => {
            server.use(
                http.get(`${API_BASE}/users`, () => {
                    return HttpResponse.json({ data: [] })
                })
            )

            const result = await getUsers()

            expect(result).toEqual([])
            expect(result).toHaveLength(0)
        })

        it("should handle API errors gracefully", async () => {
            server.use(
                http.get(`${API_BASE}/users`, () => {
                    return new HttpResponse(null, { status: 500 })
                })
            )

            await expect(getUsers()).rejects.toThrow()
        })
    })

    describe("addUser", () => {
        it("should create a new user successfully", async () => {
            const newUser: Omit<User, "created_at" | "id" | "status" | "address" | "password"> = {
                first_name: "New",
                last_name: "User",
                email: "new.user@test.com",
                phone: "1111111111",
                photo: "https://example.com/new.jpg",
                role: "professor",
            }

            server.use(
                http.post(`${API_BASE}/users`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json({
                        ...body,
                        id: "new-user-id",
                        created_at: new Date().toISOString(),
                    })
                })
            )

            const result = await addUser(newUser as User)

            expect(result).toBeDefined()
            expect(result?.email).toBe(newUser.email)
            expect(result?.id).toBeDefined()
        })

        it("should validate required fields", async () => {
            server.use(
                http.post(`${API_BASE}/users`, () => {
                    return new HttpResponse(null, { status: 400 })
                })
            )

            const invalidUser: Partial<User> = {
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                photo: "",
                role: "professor" as const,
            }

            await expect(addUser(invalidUser as User)).rejects.toThrow()
        })
    })

    describe("updateUser", () => {
        it("should update an existing user successfully", async () => {
            const updatedUser = {
                ...mockUser,
                first_name: "Updated",
                last_name: "Name",
            } satisfies Partial<User>

            server.use(
                http.put(`${API_BASE}/users/${mockUser.id}`, async ({ request }) => {
                    const body = await request.json()
                    return HttpResponse.json(body)
                })
            )

            const result = await updateUser(updatedUser as User)

            expect(result).toBeDefined()
            expect(result?.first_name).toBe("Updated")
            expect(result?.last_name).toBe("Name")
            expect(result?.id).toBe(mockUser.id)
        })

        it("should handle non-existent user", async () => {
            server.use(
                http.put(`${API_BASE}/users/non-existent-id`, () => {
                    return new HttpResponse(null, { status: 404 })
                })
            )

            const nonExistentUser = { ...mockUser, id: "non-existent-id" }

            await expect(updateUser(nonExistentUser as User)).rejects.toThrow()
        })
    })

    describe("updateUserPassword", () => {
        it("should update user password successfully", async () => {
            const userId = "test-user-id"
            const newPassword = "newSecurePassword123"

            server.use(
                http.put(`${API_BASE}/users/${userId}/password`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json({ ...mockUser, password: body.password })
                })
            )

            const result = await updateUserPassword(userId, newPassword)

            expect(result).toBeDefined()
            expect(result?.id).toBe(userId)
        })

        it("should reject weak passwords", async () => {
            server.use(
                http.put(`${API_BASE}/users/test-user-id/password`, () => {
                    return new HttpResponse(null, { status: 400 })
                })
            )

            await expect(updateUserPassword("test-user-id", "123")).rejects.toThrow()
        })
    })

    describe("deleteUser", () => {
        it("should delete a user successfully", async () => {
            server.use(
                http.delete(`${API_BASE}/users/${mockUser.id}`, () => {
                    return HttpResponse.json({ success: true })
                })
            )

            const result = await deleteUser(mockUser.id as any)

            expect(result).toBe(true)
        })

        it("should handle deletion of non-existent user", async () => {
            server.use(
                http.delete(`${API_BASE}/users/non-existent-id`, () => {
                    return new HttpResponse(null, { status: 404 })
                })
            )

            await expect(deleteUser("non-existent-id")).rejects.toThrow()
        })

        it("should prevent deletion when user has dependencies", async () => {
            server.use(
                http.delete(`${API_BASE}/users/${mockUser.id}`, () => {
                    return new HttpResponse(null, { status: 409 })
                })
            )

            await expect(deleteUser(mockUser.id as any)).rejects.toThrow()
        })
    })
})
