import { beforeAll, describe, expect, it } from "bun:test";
import * as config from "./config";
import app from "..";
import { z } from "zod";
import { Order, Shipping } from "@prisma/client";

let shippObj: Order;
let ordId: number;

beforeAll(async () => {
	console.log("Preparing Beforehand");
	const ord = {
		info: [
			{
				id: 1,
				price: 100,
				amount: 10,
			},
		],
		priceTotally: 1000,
	};

	const resp = await app.request("/order", {
		method: "POST",
		body: JSON.stringify(ord),
		headers: {
			"Content-Type": "application/json",
			Authentication: `Bearer ${config.token}`,
		},
	});
	const body = await resp.json();
	const schema = z.object({
		order: config.ordScheme,
	});

	expect(resp.status).toBe(201);
	expect(schema.safeParse(body).success).toBe(true);
	ordId = body.order.id;

	expect(ordId).toBe(body.order.id);
	console.log("Preparing done");
});
describe("Shipping", () => {
	it("POST /shipping/", async () => {
		const ship: Omit<Shipping, "id" | "userId" | "createdAt" | "track"> = {
			adress: "Nyk",
			city: "Nyk",
			zipCode: "611 11",
			country: "Swed",
			phone: "02395953",
			email: "dlwekg@flg.sgl",
			company: "NOVA POSHTA",
			firstName: "Some",
			lastName: "Guy",
			orderId: ordId,
		};

		const resp = await app.request("/shipping", {
			method: "POST",
			body: JSON.stringify(ship),
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();
		const schema = z.object({
			shipping: z.object({
				adress: z.string(),
				city: z.string(),
				zipCode: z.string(),
				country: z.string(),
				phone: z.string(),
				email: z.string().email(),
				company: z.string(),
				firstName: z.string(),
				lastName: z.string(),
			}),
		});

		expect(resp.status).toBe(201);
		expect(schema.safeParse(body).success).toBe(true);
		shippObj = body.shipping;

		expect(shippObj).toBe(body.shipping);
	});
	it("GET /shipping/:id", async () => {
		const resp = await app.request("/shipping/" + shippObj.id, {
			headers: {
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		const scheme = z.object({
			id: z.number(),
			adress: z.string(),
			city: z.string(),
			zipCode: z.string(),
			country: z.string(),
			phone: z.string(),
			email: z.string().email(),
			company: z.string(),
			firstName: z.string(),
			lastName: z.string(),
			createdAt: z.string(),
			userId: z.number(),
			orderId: z.number(),
		});

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it("PUT /shipping/:id", async () => {
		const ship = {
			track: Math.round(Math.random() * 10 ** 8).toString(),
		};

		const scheme = z.object({
			id: z.number(),
			adress: z.string(),
			city: z.string(),
			zipCode: z.string(),
			country: z.string(),
			phone: z.string(),
			email: z.string().email(),
			company: z.string(),
			firstName: z.string(),
			lastName: z.string(),
			createdAt: z.string(),
			userId: z.number(),
			orderId: z.number(),
			track: z.string().optional(),
		});

		const resp = await app.request("/shipping/" + shippObj.id, {
			method: "PUT",
			body: JSON.stringify(ship),
			headers: {
				"Content-Type": "application/json",
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		expect(resp.status).toBe(200);
		expect(scheme.safeParse(body).success).toBe(true);
	});
	it("DELETE /shipping/:id", async () => {
		const resp = await app.request("/shipping/" + shippObj.id, {
			method: "DELETE",
			headers: {
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		const scheme = z.object({
			ok: z.boolean(),
		});
		expect(scheme.safeParse(body).success).toBe(true);
	});
});
