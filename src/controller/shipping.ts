import { Hono } from "hono";
import auth, { hasRole } from "../middleware/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as service from "../service/shipping";
import { User } from "@prisma/client";
import { ContentfulStatusCode } from "hono/utils/http-status";


const createdShippingSchema = z.object({
	adress: z.string(),
	city: z.string(),
	zipCode: z.string(),
	country: z.string(),
	phone: z.string(),
	email: z.string().email(),
	company: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	orderId: z.number()
});
export type TCreatedShippingSchema = z.infer<typeof createdShippingSchema>;

const updateShippingSchema = z.object({
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

export const answers = {
	shippingNotBeenCreated: "Product hasn't been created",
	forbidden: "It's not your property",
	alreadyOcupied: "Name is already ocupied",
	productNotBeenCreated: "Product hasn't been created",
	productNotFound: "Product not found",
	alreadyReviewd: "Review already has been provided",
	reviewNotBeenAdded: "Review hasn't been created",
	provideNumber: "Provide a number",
	unknown: "An unkown error"
};

const shippingController = new Hono<{ Variables: Variables }>()
	.put(
		"/:id{[0-9]+}",
		hasRole("admin"),
		zValidator("json", updateShippingSchema),
		async (c) => {
			const id = Number(c.req.param('id'));
			const body = c.req.valid('json');

			const shp = await service.getShipping(id);
			if (!shp) return c.notFound();

			const resp = await service.updateShipping(id, body);
			return c.json(resp);
		},
	)
	.delete("/:id{[0-9]+}", hasRole("admin"), async (c) => {
		try {
			const id = Number(c.req.param('id'));
			const product = await service.getShipping(id);
			if (!product) return c.notFound();

			const resp = await service.deleteShipping(product.id);
			if (resp) return c.json({ ok: true }, 200);

			return c.notFound();
		} catch (e) {
			const err = e as Error;
			let status: ContentfulStatusCode = 500;

			if (err.message === answers.forbidden) status = 403;

			if (status >= 500) console.log(err);
			return c.json({ msg: err.message }, status);
		}
	})
	.use(auth)
	.post("/", zValidator("json", createdShippingSchema), async (c) => {
		try {
			const user = c.get("user");
			const body = c.req.valid('json');
			const resp = await service.createShipping(
				user.id,
				body,
			);

			return c.json(resp, 201);
		} catch (e) {
			const err = e as Error;
			return c.json({ msg: err.message }, 400);
		}
	})
	.get("/:id{[0-9]+}", async (c) => {
		const user = c.get("user");
		const id = Number(c.req.param('id'));

		const resp = await service.getShipping(id);
		if (!resp) return c.notFound();

		if (resp.userId === user.id) return c.json(resp);
		return c.json({ msg: answers.forbidden }, 403);
	});

export default shippingController;
