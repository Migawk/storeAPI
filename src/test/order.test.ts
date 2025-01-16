import { describe, expect, it } from "bun:test";
import * as config from "./config";
import app from "..";
import { z } from "zod";

let ordId: number;
describe("Order", () => {
	it("POST /order/", async () => {
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
	});
	it("GET /order/:id", async () => {
		const resp = await app.request("/order/" + ordId, {
			headers: {
				Authentication: `Bearer ${config.token}`,
			},
		});
		const body = await resp.json();

		expect(resp.status).toBe(200);
		expect(config.ordScheme.safeParse(body).success).toBe(true);
	});
});
