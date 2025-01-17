import { type Shipping } from "@prisma/client";
import { answers, TCreatedShippingSchema } from "../controller/shipping";
import db from "../helpers/db";

const { shipping } = db;

export async function createShipping(
	userId: number,
	shippingBody: TCreatedShippingSchema,
) {
	try {
		const resp = await shipping.create({
			data: {
				...shippingBody,
				userId,
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
