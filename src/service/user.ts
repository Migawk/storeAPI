import { PrismaClient, User } from "@prisma/client";
import { createToken, hash, verifyPassword } from "../helpers/common";
import { answers, TLogIn } from "../controller/user";

const { user } = new PrismaClient({
	omit: {
		user: {
			password: true,
		},
	},
});

/** Needed mostly for token generation, when user has been obtained from db. */
const userSelection = {
	id: true,
	name: true,
	role: true,
	createdAt: true,
	password: true,
};

export async function createUser(name: string, password: string) {
	const doesExist = await user.findUnique({ where: { name } });
	if (doesExist) throw new Error(answers.alreadyOcupied);

	const resp = await user.create({
		data: {
			name,
			password: await hash(password),
		},
		select: {
			id: true,
			name: true,
			role: true,
			createdAt: true,
		},
	});
	if (!resp) throw new Error(answers.userNotBeenCreated);

	const token = createToken(resp);

	return {
		user: resp,
		token,
	};
}
export function getUser(id: number) {
	return user.findUnique({
		where: {
			id,
		},
		omit: {
			email: true,
			phone: true,
		},
	});
}
export function getUserByName(name: string) {
	return user.findUnique({
		where: {
			name,
		},
		omit: {
			email: true,
			phone: true,
		},
	});
}
export async function updateUser(id: number, body: Partial<User>) {
	await user.update({
		where: {
			id,
		},
		data: body,
		select: userSelection,
	});
	return user.findUnique({ where: { id } });
}
export function deleteUser(id: number) {
	return user.delete({ where: { id } });
}
export async function login(
	userBody: TLogIn,
) {
	let search: { email: string } | { name: string };

	if ("email" in userBody) search = { email: userBody.email };
	if ("name" in userBody) search = { name: userBody.name };

	const usr = await user.findUnique({
		where: search!,
		select: userSelection,
	});
	if (!usr) throw new Error(answers.userNotFound);

	const isOk = await verifyPassword(userBody.password, usr.password);
	if (!isOk) throw new Error(answers.wrongPassword);

	const resUser: Partial<User> = { ...usr };
	delete resUser.password;

	return {
		user: resUser,
		token: createToken(usr),
	};
}

const userService = {
	createUser,
	getUser,
	getUserByName,
	updateUser,
	deleteUser,
	login,
};

export default userService;
