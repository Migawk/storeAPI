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
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6Im1pZ2FuIiwicm9sZSI6ImFkbWluIiwiY3JlYXRlZEF0IjoiMjAyNS0wMS0xNVQwMTo0ODo1OC45MzdaIiwicGFzc3dvcmQiOiIkYXJnb24yaWQkdj0xOSRtPTY1NTM2LHQ9MixwPTEkYWtmTDRMVWx1NjB3RVQwQzZISHJrZENPeVMvS04wVkpkMDU1UEhCQnUyVSR0aVhHakFMV3c4ZW5sVGpVZ0NDTGEvVHZ3YVlHVlJOQ0FvQUxoSThPUEJVIiwiaWF0IjoxNzM3MDUzNjQ1fQ.rbS8sPekt9rvOByjca2tTc2Dn_HlMw1Foguqot3GWwE";
