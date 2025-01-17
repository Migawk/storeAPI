import { type Review } from "@prisma/client";
import { answers, TCreateProductSchema, TUpdateProductSchema } from "../controller/product";
import db from "../helpers/db";

const { product, review } = db;

export async function createProduct(
	userId: number,
	productBody: TCreateProductSchema,
) {
	const doesExist = await product.findMany({
		where: {
			OR: [{ name: productBody.name }, { slug: productBody.slug }],
		},
	});
	if (doesExist.length) throw new Error(answers.alreadyOcupied);

	const resp = await product.create({
		data: {
			...productBody,
			userId,
			photos: productBody.photos!,
		},
	});
	if (!resp) throw new Error(answers.productNotBeenCreated);

	return {
		product: resp,
	};
}
export function getProduct(id: number) {
	return product.findUnique({
		where: {
			id,
		},
	});
}
export function getProductByName(name: string) {
	return product.findUnique({
		where: {
			name,
		},
	});
}
export async function updateProduct(id: number, body: TUpdateProductSchema) {
	await product.update({
		where: {
			id,
		},
		data: body
	});
	return product.findUnique({ where: { id } });
}
export async function deleteProduct(id: number) {
	await review.deleteMany({ where: { productId: id } });
	return product.delete({ where: { id } });
}
export async function writeReview(
	productId: number,
	userId: number,
	reviewBody: Omit<Omit<Omit<Review, "userId">, "productId">, "id">,
) {
	const doesExist = await review.findMany({
		where: {
			productId,
			userId,
		},
	});
	if (doesExist.length) throw new Error(answers.alreadyReviewd);

	const resp = await review.create({
		data: {
			...reviewBody,
			userId,
			productId,
		},
	});
	if (!resp) throw new Error(answers.reviewNotBeenAdded);

	return {
		review: resp,
	};
}

const productService = {
	createProduct,
	getProduct,
	getProductByName,
	updateProduct,
	deleteProduct,
	writeReview,
};

export default productService;
