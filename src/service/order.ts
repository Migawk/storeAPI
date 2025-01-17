import { type Order } from "@prisma/client";
import { answers, TCreateOrderSchema } from "../controller/order";
import db from "../helpers/db";

const { order } = db;

export async function createOrder(
	userId: number,
	orderBody: TCreateOrderSchema,
) {
	const resp = await order.create({
		data: {
			...orderBody,
			info: orderBody.info!,
			userId,
		},
	});
	if (!resp) throw new Error(answers.orderNotBeenCreated);

	return {
		order: resp,
	};
}
export function getOrder(id: number) {
	return order.findUnique({
		where: {
			id,
		},
	});
}
