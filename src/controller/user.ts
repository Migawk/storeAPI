import { Hono } from "hono";
import * as service from "../service/user";
import { unknown, z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { ContentfulStatusCode } from "hono/utils/http-status";
import auth from "../middleware/auth";
import { User } from "@prisma/client";

type Variables = {
	user: User;
};

const createUserSchema = z.object({
	name: z.string(),
	password: z.string(),
});
const updateUserSchema = z.object({
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
export type TLogIn = z.infer<typeof logInScheme>;

export const answers = {
	forbidden: "It's not your property",
	wrongPassword: "Password is wrong",
	alreadyOcupied: "Username is already ocupied",
	userNotBeenCreated: "User hasn't been created",
	userNotFound: "User not found",
	unknown: "An unkown error"
};

const userController = new Hono<{ Variables: Variables }>()
	.get("/:name{[a-zA-Z]+}", async (c) => {
		const name = c.req.param("name");
		const resp = await service.getUserByName(name);

		if (resp) {
			return c.json(resp);
		} else {
			return c.notFound();
		}
	})
	.put("/:name{[a-zA-Z]+}", zValidator("json", updateUserSchema), auth, async (c) => {
		try {
			const name = c.req.param("name");
			const user = await service.getUserByName(name);
			const body = c.req.valid('json');

			const userAuth = c.get("user");
			if (!user) return c.json({ msg: answers.userNotFound }, 404);

			if (user.name !== userAuth.name)
				return c.json({ msg: answers.forbidden }, 403);

			const resp = await service.updateUser(user.id, body);
			if (resp) return c.json(resp, 200);
		} catch (e) {
			const err = e as Error;

			console.log(err);
			return c.json({ msg: answers.unknown }, 500);
		}
	})
	.delete("/:name{[a-zA-Z]+}", auth, async (c) => {
		try {
			const name = c.req.param("name");
			const userAuth = c.get("user");

			const user = await service.getUserByName(name);
			if (!user) return c.notFound();

			if (userAuth.name !== name) return c.json({ msg: answers.forbidden }, 403);

			const resp = await service.deleteUser(user.id);
			if (resp) return c.json({ ok: true }, 200);

			return c.notFound();
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
			const body = c.req.valid('json');
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
	.post("/", zValidator("json", createUserSchema), async (c) => {
		const { name, password } = c.req.valid('json');
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
