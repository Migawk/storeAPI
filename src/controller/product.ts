import { Hono } from "hono";
import * as service from "../service/product";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { ContentfulStatusCode } from "hono/utils/http-status";
import auth, { hasRole } from "../middleware/auth";
import { User } from "@prisma/client";

interface Variables {
	user: User;
}
const productController = new Hono<{ Variables: Variables }>();

const createProduct = z.object({
	name: z.string(),
	photos: z.array(z.string()),
	description: z.string(),
	href: z.string(),
	status: z.enum(["available", "runningOut", "unavailable"]),
	stockQuantity: z.number(),
	price: z.number(),
	catalogueId: z.number(),
});
const updateProduct = z.object({
	name: z.string().optional(),
	photos: z.array(z.string()).optional(),
	description: z.string().optional(),
	href: z.string().optional(),
	rate: z.number().optional(),
	status: z.string().optional(),
	stockQuantity: z.number().optional(),
	price: z.number().optional(),
	catalogueId: z.number().optional(),
});
const addReview = z.object({
	content: z.string(),
	title: z.string(),
	rate: z.number().min(1).max(5),
});

export const answers = {
	forbidden: "It's not your property",
	alreadyOcupied: "Name is already ocupied",
	productNotBeenCreated: "Product hasn't been created",
	productNotFound: "Product not found",
	alreadyReviewd: "Review already has been provided",
	reviewNotBeenAdded: "Review hasn't been created",
};

productController
	.post(
		"/",
		hasRole("seller"),
		zValidator("json", createProduct),
		async (c) => {
			try {
				const user = c.get("user");
				const body = await c.req.json();
				const resp = await service.createProduct(user.id, body);

				return c.json(resp, 201);
			} catch (e) {
				const err = e as Error;
				let status: ContentfulStatusCode = 500;

				if (err.message === answers.alreadyOcupied) status = 400;

				if (status >= 500) console.log(err);
				return c.json({ msg: err.message }, status);
			}
		},
	)
	.get("/:id", async (c) => {
		const id = Number(c.req.param().id);

		if (isNaN(id)) return;
		const resp = await service.getProduct(id);

		if (resp) {
			return c.json(resp);
		} else {
			return c.json({ msg: "Not found" }, 404);
		}
	})
	.put(
		"/:id",
		zValidator("json", updateProduct),
		hasRole("admin"),
		async (c) => {
			try {
				const id = Number(c.req.param().id);

				if (isNaN(id)) return;
				const product = await service.getProduct(id);
				const body = await c.req.json();

				if (!product) return c.json({ msg: "Not found product" }, 404);

				const resp = await service.updateProduct(product.id, body);
				if (resp) return c.json(resp, 200);
			} catch (e) {
				const err = e as Error;

				console.log(err);
				return c.json({ msg: "Unkown err" }, 500);
			}
		},
	)
	.delete("/:id", hasRole("admin"), async (c) => {
		try {
			const id = Number(c.req.param().id);

			if (isNaN(id)) return;

			const product = await service.getProduct(id);
			if (!product) throw new Error(answers.productNotFound);

			const resp = await service.deleteProduct(product.id);
			if (resp) return c.json({ ok: true }, 200);

			throw new Error(answers.productNotFound);
		} catch (e) {
			const err = e as Error;
			let status: ContentfulStatusCode = 500;

			if (err.message === answers.forbidden) status = 403;
			if (err.message === answers.productNotFound) status = 404;

			if (status >= 500) console.log(err);
			return c.json({ msg: err.message }, status);
		}
	})
	.post("/:id/review", auth, zValidator("json", addReview), async (c) => {
		try {
			const id = Number(c.req.param().id);

			if (isNaN(id)) return c.json({ msg: "Provide an id" }, 400);
			const user = c.get("user");
			const product = await service.getProduct(id);
			const body = await c.req.json();

			if (!product) throw new Error(answers.productNotFound);

			const resp = await service.writeReview(product.id, user.id, body);
			if (resp) return c.json(resp, 201);
		} catch (e) {
			const err = e as Error;

			let status: ContentfulStatusCode = 500;

			if (err.message === answers.alreadyOcupied) status = 400;

			if (status >= 500) console.log(err);
			return c.json({ msg: err.message }, status);
		}
	});

export default productController;
