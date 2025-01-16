import { Hono } from "hono";
import auth, { hasRole } from "../middleware/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as service from "../service/shipping";
import { Shipping, User } from "@prisma/client";
export const answers = {
	shippingNotBeenCreated: "Product hasn't been created",
	forbidden: "It's not your property",
	alreadyOcupied: "Name is already ocupied",
	productNotBeenCreated: "Product hasn't been created",
	productNotFound: "Product not found",
	alreadyReviewd: "Review already has been provided",
	reviewNotBeenAdded: "Review hasn't been created",
	provideNumber: "Provide a number",
};
import { omit } from "lodash";
import { ContentfulStatusCode } from "hono/utils/http-status";


const createdShipping = z.object({
	adress: z.string(),
	city: z.string(),
	zipCode: z.string(),
	country: z.string(),
	phone: z.string(),
	email: z.string().email(),
	company: z.string(),
	firstName: z.string(),
	lastName: z.string(),
});
const updateShipping = z.object({
	adress: z.string().optional(),
	city: z.string().optional(),
	zipCode: z.string().optional(),
	country: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional(),
	company: z.string().optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	track: z.string().optional(),
});

interface Variables {
	user: User;
}
const shippingController = new Hono<{ Variables: Variables }>()
	.put(
		"/:id",
		hasRole("admin"),
		zValidator("json", updateShipping),
		async (c) => {
			const user = c.get("user");
			const id = Number(c.req.param().id);
			const body = await c.req.json();

			if (isNaN(id)) return c.json({ msg: answers.provideNumber }, 400);

			const shp = await service.getShipping(id);

			if (!shp) return c.json({ msg: "Not found" }, 404);
			if (shp.userId !== user.id)
				return c.json({ msg: answers.forbidden }, 403);

			const resp = await service.updateShipping(id, body);

			return c.json(resp);
		},
	)
	.delete("/:id", hasRole("admin"), async (c) => {
		try {
			const id = Number(c.req.param().id);

			if (isNaN(id)) return;

			const product = await service.getShipping(id);
			if (!product) throw new Error(answers.productNotFound);

			const resp = await service.deleteShipping(product.id);
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
	.use(auth)
	.post("/", zValidator("json", createdShipping), async (c) => {
		try {
			const user = c.get("user");
			const body = await c.req.json();
			const resp = await service.createShipping(
				user.id,
				body.orderId,
				omit(body, ["userId", "id", "orderId"]) as Omit<Shipping, "userId" | "id" | "orderId">,
			);

			return c.json(resp, 201);
		} catch (e) {
			const err = e as Error;
			return c.json({ msg: err.message }, 400);
		}
	})
	.get("/:id", async (c) => {
		const user = c.get("user");
		const id = Number(c.req.param().id);

		if (isNaN(id)) return c.json({ msg: answers.provideNumber }, 400);

		const resp = await service.getShipping(id);
		if (!resp) return c.json({ msg: answers.productNotFound }, 404);

		if (resp.userId === user.id) return c.json(resp);
		return c.json({ msg: answers.forbidden }, 403);
	});

export default shippingController;
