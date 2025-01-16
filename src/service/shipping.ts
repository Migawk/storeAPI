import { Shipping, PrismaClient } from "@prisma/client";
import { answers } from "../controller/shipping";

const { shipping } = new PrismaClient();

export async function createShipping(
	userId: number,
	orderId: number,
	shippingBody: Omit<Shipping, "userId" | "id" | "orderId">,
) {
	try {
		const resp = await shipping.create({
			data: {
				...shippingBody,
				userId,
				orderId,
			},
		});

		if (!resp) throw new Error(answers.shippingNotBeenCreated);

		return {
			shipping: resp,
		};
	} catch (e) {
		console.log(e);
		return {
			shipping: {},
		};
	}
}
export async function updateShipping(id: number, body: Partial<Shipping>) {
	return shipping.update({
		where: {
			id,
		},
		data: body,
	});
}
export function getShipping(id: number) {
	return shipping.findUnique({
		where: {
			id,
		},
	});
}
export async function deleteShipping(id: number) {
	return shipping.delete({
		where: { id },
	});
}
