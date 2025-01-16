import { Order, PrismaClient } from "@prisma/client";
import { answers } from "../controller/order";

const { order } = new PrismaClient();

export async function createOrder(
	userId: number,
	orderBody: Omit<Order, "userId">,
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