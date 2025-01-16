import { expect, describe, afterAll, it } from "bun:test";
import app from "..";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

afterAll(async () => {
	const pr = new PrismaClient();

	const val = {
		name: "migwa",
	};

	const doesExist = await pr.user.findUnique({
		where: val,
	});
	if (!doesExist) return;
	await pr.user.delete({
		where: val,
	});
});
let usrName: string;
let token = "";

describe("User", () => {
	it("POST /user", async () => {
		const usr = {
			name: "migwa",
			password: "123",
		};
		const res = await app.request("/user", {
			method: "POST",
			body: JSON.stringify(usr),
			headers: {
				"Content-Type": "application/json",
			},
		});
		const scheme = z.object({
			user: z.object({
				id: z.number(),
				name: z.string(),
				role: z.string(),
				createdAt: z.string(),
			}),
			token: z.string(),
		});

		expect(res.status).toBe(201);

		const body = await res.json();
		expect(scheme.safeParse(body).success).toBe(true);

		usrName = body.user.name;
		token = body.token;

		expect(usrName).toBe(body.user.name);
	});
	it(`GET /user/:id`, async () => {
		const scheme = z.object({
			id: z.number(),
			name: z.string(),
			role: z.enum(["user", "admin", "seller"]),
			createdAt: z.string(),
		});
		const resp = await app.request(`/user/${usrName}`);
		const body = await resp.json();

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it(`POST /user/login`, async () => {
		const usr = {
			name: "migwa",
			password: "123",
		};
		const res = await app.request("/user/login", {
			method: "POST",
			body: JSON.stringify(usr),
			headers: {
				"Content-Type": "application/json",
			},
		});
		const scheme = z.object({
			user: z.object({
				id: z.number(),
				name: z.string(),
				role: z.string(),
				createdAt: z.string(),
			}),
			token: z.string(),
		});
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it(`DELETE /user/:id`, async () => {
		const resp = await app.request(`/user/${usrName}`, {
			method: "DELETE",
			headers: {
				Authentication: `Bearer ${token}`,
			},
		});
		const body = await resp.json();

		const scheme = z.object({
			ok: z.boolean(),
		});

		expect(scheme.safeParse(body).success).toBe(true);
	});
});
