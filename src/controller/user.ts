import { Hono } from "hono";
import * as service from "../service/user";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { ContentfulStatusCode } from "hono/utils/http-status";
import auth from "../middleware/auth";
import { User } from "@prisma/client";

type Variables = {
	user: User;
};
const userController = new Hono<{ Variables: Variables }>();

const createUser = z.object({
	name: z.string(),
	password: z.string(),
});
const updateUser = z.object({
	name: z.string().optional(),
	password: z.string().optional(),
	id: z.number().optional(),
	role: z.string().optional(),
	email: z.string().optional(),
	phone: z.string().optional(),
	createdAt: z.date().optional(),
});
const logInScheme = z.union([
	z.object({
		email: z.string(),
		password: z.string(),
	}),
	z.object({
		name: z.string(),
		password: z.string(),
	}),
]);

export const answers = {
	forbidden: "It's not your property",
	wrongPassword: "Password is wrong",
	alreadyOcupied: "Username is already ocupied",
	userNotBeenCreated: "User hasn't been created",
	userNotFound: "User not found",
};

userController
	.get("/:name", async (c) => {
		const { name } = c.req.param();
		const resp = await service.getUserByName(name);

		if (resp) {
			return c.json(resp);
		} else {
			return c.json({ msg: "Not found" }, 404);
		}
	})
	.put("/:name", zValidator("json", updateUser), auth, async (c) => {
		try {
			const { name } = c.req.param();
			const user = await service.getUserByName(name);
			const body = await c.req.json();
			const userAuth = c.get("user");

			if (!user) return c.json({ msg: "Not found user" }, 404);
			if (user.name !== userAuth.name)
				return c.json({ msg: "It's not your property" }, 403);

			const resp = await service.updateUser(user.id, body);
			if (resp) return c.json(resp, 200);
		} catch (e) {
			const err = e as Error;

			console.log(err);
			return c.json({ msg: "Unkown err" }, 500);
		}
	})
	.delete("/:name", auth, async (c) => {
		try {
			const { name } = c.req.param();
			const userAuth = c.get("user");

			const user = await service.getUserByName(name);
			if (!user) throw new Error(answers.userNotFound);

			if (userAuth.name !== name) throw new Error(answers.forbidden);

			const resp = await service.deleteUser(user.id);
			if (resp) return c.json({ ok: true }, 200);

			throw new Error(answers.userNotFound);
		} catch (e) {
			const err = e as Error;
			let status: ContentfulStatusCode = 500;

			if (err.message === answers.forbidden) status = 403;
			if (err.message === answers.userNotFound) status = 404;

			if (status >= 500) console.log(err);
			return c.json({ msg: err.message }, status);
		}
	})
	.post("/login", zValidator("json", logInScheme), async (c) => {
		try {
			const body = await c.req.json();
			const resp = await service.login(body);

			c.res.headers.set("Authorization", `Bearer ${resp.token}`);
			return c.json(resp, 200);
		} catch (e) {
			const err = e as Error;
			let status: ContentfulStatusCode = 400;

			if (err.message === answers.wrongPassword) status = 403;
			return c.json({ msg: e }, status);
		}
	})
	.post("/", zValidator("json", createUser), async (c) => {
		const { name, password } = await c.req.json();
		try {
			const resp = await service.createUser(name, password);
			c.res.headers.set("Authorization", `Bearer ${resp.token}`);

			return c.json(resp, 201);
		} catch (e) {
			const err = e as Error;
			let status: ContentfulStatusCode = 500;
			if (err.message === answers.alreadyOcupied) status = 400;

			if (status >= 500) console.log(err);
			return c.json({ msg: err.message }, status);
		}
	});

export default userController;
