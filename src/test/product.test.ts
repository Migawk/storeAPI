import { describe, afterAll, it, expect } from "bun:test";
import app from "..";
import { PrismaClient, Product } from "@prisma/client";
import * as config from "./config";
import { z } from "zod";

const name = "keyboard";
let product: Product;

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

describe("Product", () => {
	it("POST /product/", async () => {
		const pd = {
			name,
			photos: ["/kb.jpeg", "kb.png"],
			description: "The best keyboard ever",
			slug: "kb_razer",
			status: "available",
			stockQuantity: 10,
			price: 10000,
			catalogueId: 1,
		};

		const resp = await app.request("/product", {
			method: "POST",
			body: JSON.stringify(pd),
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		const scheme = z.object({
			product: config.pdScheme,
		});
		expect(resp.status).toBe(201);
		expect(scheme.safeParse(body).success).toBe(true);

		product = body.product;
		expect(product).toBe(body.product);
	});
	it(`GET /product/:id`, async () => {
		const scheme = z.object({
			id: z.number(),
			name: z.string(),
			photos: z.array(z.string()),
			description: z.string(),
			slug: z.string(),
			createdAt: z.string(),
			rate: z.number(),
			status: z.enum(["available", "runningOut", "unavailable"]),
			stockQuantity: z.number(),
			price: z.number(),
			catalogueId: z.number(),
			userId: z.number(),
		});

		const resp = await app.request(`/product/${product.id}`);
		const body = await resp.json();

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it("PUT /product/:id", async () => {
		const pd = {
			status: "unavailable",
			stockQuantity: 0,
		};

		const resp = await app.request(`/product/${product.id}`, {
			method: "PUT",
			body: JSON.stringify(pd),
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();
		const scheme = z.object({
			name: z.string(),
			photos: z.array(z.string()),
			description: z.string(),
			slug: z.string(),
			status: z.enum(["available", "runningOut", "unavailable"]),
			stockQuantity: z.number(),
			price: z.number(),
			catalogueId: z.number(),
			userId: z.number(),
		});

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it("POST /product/:id/review", async () => {
		const rv = {
			title: "Good",
			content: "Handy thing, actually.",
			rate: 4,
		};
		const resp = await app.request(`/product/${product.id}/review`, {
			method: "POST",
			body: JSON.stringify(rv),
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		const scheme = z.object({
			review: z.object({
				id: z.number(),
				rate: z.number().min(1).max(5),
				userId: z.number(),
				content: z.string(),
				title: z.string(),
				productId: z.number(),
			}),
		});

		expect(resp.status).toBe(201);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it("DELETE /product/:id", async () => {
		const resp = await app.request(`/product/${product.id}`, {
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
