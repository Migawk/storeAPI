import { Hono } from "hono";
import auth from "../middleware/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as service from "../service/order";
import { User } from "@prisma/client";

const itemScheme = z.object({
	id: z.number(),
	price: z.number(),
	amount: z.number(),
});
const createOrderSchema = z.object({
	info: z.array(itemScheme),
	priceTotally: z.number(),
});
export type TCreateOrderSchema = z.infer<typeof createOrderSchema>;

interface Variables {
	user: User;
}

export const answers = {
	forbidden: "It's not your property",
	orderNotBeenCreated: "Product hasn't been created",
	unknown: "An unkown error"
};

const orderController = new Hono<{ Variables: Variables }>()
	.use(auth)
	.post("/", zValidator("json", createOrderSchema), async (c) => {
		const user = c.get("user");
		const body = c.req.valid('json');
		const resp = await service.createOrder(user.id, body);
		if (!resp) return c.notFound();

		return c.json(resp, 201);
	})
	.get("/:id{[0-9]+}", async (c) => {
		const user = c.get("user");
		const id = Number(c.req.param('id'));

		const resp = await service.getOrder(id);

		if (!resp) return c.notFound();

		if (resp.userId === user.id) return c.json(resp);

		c.json({ msg: answers.forbidden }, 403);
	});

export default orderController;
