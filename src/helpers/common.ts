import { User } from "@prisma/client";
import { sign, verify } from "jsonwebtoken";

export function hash(p: string) {
	return Bun.password.hash(p);
}
export function verifyPassword(p: string, h: string) {
	return Bun.password.verify(p, h);
}

export function createToken(body: Partial<User>) {
	const salt = process.env.TOKEN_SECRET;
	if (!salt) throw new Error("Not provided secret into env variables");

	return sign(body, salt);
}
export function verifyToken(token: string) {
	const salt = process.env.TOKEN_SECRET;
	if (!salt) throw new Error("Not provided secret into env variables");

	return verify(token, salt);
}
