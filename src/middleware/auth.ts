import { createMiddleware } from "hono/factory";
import { verifyToken } from "../helpers/common";
import { User } from "@prisma/client";
import db from "../helpers/db";


const answers = {
	noToken: "Not provided token",
	wrongToken: "Wrong token",
	notEnough: "Not enough priveleges, must be: "
}
const auth = createMiddleware(async (c, next) => {
	const token = c.req.header('Authentication')!.split(" ")[1];
	if (!token) return c.json({ msg: "Provide token" }, 403);

	const usr = verifyToken(token);
	if (!usr) return c.json({ msg: "Wrong token" }, 403);

	c.set("user", usr);
	await next();
});

export const hasRole = (role: Role) => {
	return createMiddleware(async (c, next) => {
		if (!c.req.header('authentication')!) return c.json({ msg: answers.noToken }, 403);

		const token = c.req.header('authentication')!.split(" ")[1];
		if (!token) return c.json({ msg: answers.noToken }, 403);

		const usr = verifyToken(token) as Partial<User>;
		if (!usr) return c.json({ msg: answers.wrongToken }, 403);

		const user = await db.user.findUnique({ where: { id: usr.id } });
		if (!user) return c.json({ msg: answers.wrongToken }, 403);

		if (user.role !== role && user.role !== "admin")
			return c.json({ msg: answers.notEnough + role }, 403);

		c.set("user", usr);
		await next();
	});
};

export default auth;
