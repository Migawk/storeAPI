import { describe, afterAll, it, expect } from "bun:test";
import app from "..";
import { PrismaClient, Catalogue } from "@prisma/client";
import * as config from "./config";
import { z } from "zod";

const name = "keyboard";
let catalogue: Catalogue;

const ctScheme = z.object({
	id: z.number(),
	name: z.string(),
	logo: z.string(),
	description: z.string(),
	createdAt: z.string(),
	href: z.string(),
});

afterAll(async () => {
	const pr = new PrismaClient();

	const val = {
		name,
	};

	const doesExist = await pr.user.findUnique({
		where: val,
	});
	if (!doesExist) return;
	await pr.user.delete({
		where: val,
	});
});
describe("Catalogue", () => {
	it("POST /catalogue/", async () => {
		const ct = {
			name: "laptops",
			logo: "./laptop.jpeg",
			description: "Movable Laptops",
			createdAt: new Date(),
			href: "laptops",
		};

		const resp = await app.request("/catalogue", {
			method: "POST",
			body: JSON.stringify(ct),
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		const scheme = z.object({
			catalogue: ctScheme,
		});
		expect(resp.status).toBe(201);
		expect(scheme.safeParse(body).success).toBe(true);

		catalogue = body.catalogue;
		expect(catalogue).toBe(body.catalogue);
	});
	it(`GET /catalogue/:id`, async () => {
		const scheme = ctScheme;

		const resp = await app.request(`/catalogue/${catalogue.id}`);
		const body = await resp.json();

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it(`GET /catalogue/:id/products`, async () => {
		const scheme = z.array(config.pdScheme);

		const resp = await app.request(`/catalogue/${catalogue.id}/products`);
		const body = await resp.json();

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it("PUT /catalogue/:id", async () => {
		const ct = {
			description: "Laptops for everyone",
		};
		const resp = await app.request(`/catalogue/${catalogue.id}`, {
			method: "PUT",
			body: JSON.stringify(ct),
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();
		const scheme = ctScheme;

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it("DELETE /catalogue/:id", async () => {
		const resp = await app.request(`/catalogue/${catalogue.id}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		expect(resp.status).toBe(200);
		expect(body.ok).toBe(true);
	});
});
