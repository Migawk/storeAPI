import { Hono } from "hono";
import auth from "../middleware/auth";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import * as service from "../service/order";
import { User } from "@prisma/client";
export const answers = {
	orderNotBeenCreated: "Product hasn't been created",
};

const itemScheme = z.object({
	id: z.number(),
	price: z.number(),
	amount: z.number(),
});
const createOrder = z.object({
	info: z.array(itemScheme),
	priceTotally: z.number(),
});
interface Variables {
	user: User;
}
const orderController = new Hono<{ Variables: Variables }>()
	.use(auth)
	.post("/", zValidator("json", createOrder), async (c) => {
		try {
			const user = c.get("user");
			const body = await c.req.json();
			const resp = await service.createOrder(user.id, body);

			return c.json(resp, 201);
		} catch (e) {}
	})
	.get("/:id", async (c) => {
		const user = c.get("user");
		const id = Number(c.req.param().id);

		if (isNaN(id)) return c.json({ msg: "Provide a number" }, 400);

		const resp = await service.getOrder(id);
		if (!resp) return c.json({ msg: "Not found" }, 404);

		if (resp.userId === user.id) return c.json(resp);

		c.json({ msg: "It's not your property" }, 403);
	});

export default orderController;
