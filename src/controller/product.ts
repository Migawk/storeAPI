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

const createProductSchema = z.object({
	name: z.string(),
	photos: z.array(z.string()),
	description: z.string(),
	slug: z.string(),
	status: z.enum(["available", "runningOut", "unavailable"]),
	stockQuantity: z.number(),
	price: z.number(),
	catalogueId: z.number(),
});
export type TCreateProductSchema = z.infer<typeof createProductSchema>;

const updateProductSchema = z.object({
	name: z.string().optional(),
	photos: z.array(z.string()).optional(),
	description: z.string().optional(),
	slug: z.string().optional(),
	rate: z.number().optional(),
	status: z.string().optional(),
	stockQuantity: z.number().optional(),
	price: z.number().optional(),
	catalogueId: z.number().optional(),
});
export type TUpdateProductSchema = z.infer<typeof updateProductSchema>;

const addReviewSchema = z.object({
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
	unknown: "An unkown error"
};

productController
	.post(
		"/",
		hasRole("seller"),
		zValidator("json", createProductSchema),
		async (c) => {
			try {
				const user = c.get("user");
				const body = c.req.valid('json');
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
	.get("/:id{[0-9]+}", async (c) => {
		const id = Number(c.req.param('id'));
		const resp = await service.getProduct(id);

		if (resp) return c.json(resp);
		return c.notFound();
	})
	.put(
		"/:id{[0-9]+}",
		zValidator("json", updateProductSchema),
		hasRole("admin"),
		async (c) => {
			try {
				const id = Number(c.req.param('id'));
				const product = await service.getProduct(id);
				const body = c.req.valid('json');

				if (!product) return c.notFound();

				const resp = await service.updateProduct(product.id, body);
				if (resp) return c.json(resp, 200);
			} catch (e) {
				const err = e as Error;

				console.log(err);
				return c.json({ msg: answers.unknown }, 500);
			}
		},
	)
	.delete("/:id{[0-9]+}", hasRole("admin"), async (c) => {
		try {
			const id = Number(c.req.param('id'));

			const product = await service.getProduct(id);
			if (!product) return c.notFound();

			const resp = await service.deleteProduct(product.id);
			if (resp) return c.json({ ok: true }, 200);

			return c.notFound();
		} catch (e) {
			const err = e as Error;
			let status: ContentfulStatusCode = 500;

			if (status >= 500) console.log(err);
			return c.json({ msg: err.message }, status);
		}
	})
	.post("/:id{[0-9]+}/review", auth, zValidator("json", addReviewSchema), async (c) => {
		try {
			const id = Number(c.req.param('id'));
			const user = c.get("user");
			const product = await service.getProduct(id);
			const body = c.req.valid('json');

			if (!product) return c.notFound();

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
