import { type Catalogue } from "@prisma/client";
import { answers, TCreateCatalogueSchema } from "../controller/catalogue";
import db from "../helpers/db";

const { catalogue, product } = db;

export async function createCatalogue(catalogueBody: TCreateCatalogueSchema) {
	const doesExist = await catalogue.findMany({
		where: {
			OR: [{ name: catalogueBody.name }, { slug: catalogueBody.slug }],
		},
	});
	if (doesExist.length) throw new Error(answers.alreadyOcupied);

	const resp = await catalogue.create({
		data: catalogueBody,
	});
	if (!resp) throw new Error(answers.catalogueNotBeenCreated);

	return {
		catalogue: resp,
	};
}
export function getCatalogue(id: number) {
	return catalogue.findUnique({
		where: {
			id,
		},
	});
}
export function getCatalogueByName(name: string) {
	return catalogue.findUnique({
		where: {
			name,
		},
	});
}
export async function updateCatalogue(id: number, body: Partial<Catalogue>) {
	await catalogue.update({
		where: {
			id,
		},
		data: body,
	});
	return catalogue.findUnique({ where: { id } });
}
export function deleteCatalogue(id: number) {
	return catalogue.delete({ where: { id } });
}
export function getProducts(id: number, skip: number = 0, take: number = 10) {
	return product.findMany({
		where: {
			catalogueId: id,
		},
		omit: {
			userId: true,
			catalogueId: true,
		},
		skip,
		take,
	});
}

const catalogueService = {
	createCatalogue,
	getCatalogue,
	getCatalogueByName,
	updateCatalogue,
	deleteCatalogue,
};

export default catalogueService;
