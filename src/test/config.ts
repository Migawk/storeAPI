import { z } from "zod";

export const pdScheme = z.object({
	name: z.string(),
	photos: z.array(z.string()),
	description: z.string(),
	slug: z.string(),
	status: z.enum(["available", "runningOut", "unavailable"]),
	stockQuantity: z.number(),
	price: z.number(),
	catalogueId: z.number(),
	userId: z.number(),
});
export const ordScheme = z.object({
	id: z.number(),
	createdAt: z.string(),
	userId: z.number(),
	priceTotally: z.number(),
	info: z.array(
		z.object({
			id: z.number(),
			price: z.number(),
			amount: z.number(),
		}),
	),
});
export const token =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6Im1pZ3dhIiwicm9sZSI6InVzZXIiLCJjcmVhdGVkQXQiOiIyMDI1LTAxLTE3VDE3OjU5OjUxLjU1OFoiLCJpYXQiOjE3MzcxMzY3OTF9.NwmAcrmKkKxEHplPP-qf9UHbidC2vyhlmtjQp_y4BKQ";
