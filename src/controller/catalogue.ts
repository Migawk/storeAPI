import { Hono } from "hono";
import * as service from "../service/catalogue";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { hasRole } from "../middleware/auth";

const catalogueController = new Hono();

const createCatalogue = z.object({
	name: z.string(),
	logo: z.string(),
	description: z.string(),
	href: z.string(),
});
const updateCatalogue = z.object({
	name: z.string().optional(),
	password: z.string().optional(),
	id: z.number().optional(),
	role: z.string().optional(),
	email: z.string().optional(),
	phone: z.string().optional(),
	createdAt: z.date().optional(),
});

export const answers = {
	forbidden: "It's not your property",
	alreadyOcupied: "Name is already ocupied",
	catalogueNotBeenCreated: "Catalogue hasn't been created",
	catalogueNotFound: "Catalogue not found",
	provideNumber: "Provide a number",
	notFound: "Not found",
};

catalogueController
	.post(
		"/",
		hasRole("admin"),
		zValidator("json", createCatalogue),
		async (c) => {
			try {
				const body = await c.req.json();
				const resp = await service.createCatalogue(body);

				return c.json(resp, 201);
			} catch (e) {
				const err = e as Error;
				let status: ContentfulStatusCode = 500;

				if (err.message === answers.alreadyOcupied) status = 400;

				if (status >= 500) console.log(err);
				return c.json({ msg: err.message }, status);
			}
		},
	)
	.get("/:id", async (c) => {
		const id = Number(c.req.param().id);

		if (isNaN(id)) return;
		const resp = await service.getCatalogue(id);

		if (resp) {
			return c.json(resp);
		} else {
			return c.json({ msg: answers.notFound }, 404);
		}
	})
	.get("/:id/products", async (c) => {
		const { skip, take } = c.req.queries();
		const id = Number(c.req.param().id);

		if (isNaN(id)) return c.json({ msg: answers.provideNumber }, 400);
		const cat = await service.getCatalogue(id);

		if (cat) {
			let sk = 0,
				tk = 10;
			if (skip && !isNaN(Number(skip))) sk = Number(skip);
			if (take && !isNaN(Number(take))) tk = Number(take);

			const productsList = await service.getProducts(cat.id, sk, tk);

			return c.json(productsList);
		} else {
			return c.json({ msg: answers.notFound }, 404);
		}
	})
	.put(
		"/:id",
		hasRole("admin"),
		zValidator("json", updateCatalogue),
		async (c) => {
			try {
				const id = Number(c.req.param().id);

				if (isNaN(id)) return;
				const catalogue = await service.getCatalogue(id);
				const body = await c.req.json();

				if (!catalogue) return c.json({ msg: "Not found catalogue" }, 404);

				const resp = await service.updateCatalogue(catalogue.id, body);
				if (resp) return c.json(resp, 200);
			} catch (e) {
				const err = e as Error;
				return c.json({ msg: "Unkown err" }, 500);
			}
		},
	)
	.delete("/:id", hasRole("admin"), async (c) => {
		try {
			const id = Number(c.req.param().id);

			if (isNaN(id)) return;

			const catalogue = await service.getCatalogue(id);
			if (!catalogue) throw new Error(answers.catalogueNotFound);

			const resp = await service.deleteCatalogue(catalogue.id);
			if (resp) return c.json({ ok: true }, 200);

			throw new Error(answers.catalogueNotFound);
		} catch (e) {
			const err = e as Error;
			let status: ContentfulStatusCode = 500;

			if (err.message === answers.forbidden) status = 403;
			if (err.message === answers.catalogueNotFound) status = 404;

			if (status >= 500) console.log(err);
			return c.json({ msg: err.message }, status);
		}
	});

export default catalogueController;
