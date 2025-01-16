import { createMiddleware } from "hono/factory";
import { verifyToken } from "../helpers/common";
import { PrismaClient, User } from "@prisma/client";

const auth = createMiddleware(async (c, next) => {
	const token = c.req.header().authentication.split(" ")[1];
	if (!token) return c.json({ msg: "Provide token" }, 403);

	const usr = verifyToken(token);
	if (!usr) return c.json({ msg: "Wrong token" }, 403);

	c.set("user", usr);
	await next();
});

export const hasRole = (role: Role) => {
	return createMiddleware(async (c, next) => {
		if (!c.req.header()) return c.json({ msg: `Not provided token` }, 403);
		const userDb = new PrismaClient().user;

		const token = c.req.header().authentication.split(" ")[1];
		if (!token) return c.json({ msg: "Provide token" }, 403);

		const usr = verifyToken(token) as Partial<User>;
		if (!usr) return c.json({ msg: "Wrong token" }, 403);

		const user = await userDb.findUnique({ where: { id: usr.id } });
		if (!user) return c.json({ msg: "Wrong token" }, 403);

		if (user.role !== role && user.role !== "admin")
			return c.json({ msg: `Not enough priveleges, must be: "${role}"` }, 403);

		c.set("user", usr);
		await next();
	});
};

export default auth;
