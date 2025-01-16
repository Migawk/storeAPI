import { Hono } from "hono";
import userController from "./controller/user";
import catalogueController from "./controller/catalogue";
import productController from "./controller/product";
import orderController from "./controller/order";
import shippingController from "./controller/shipping";

const app = new Hono({ strict: false });

app
	.get("/", (c) => {
		return c.text("Hello Hono!");
	})
	.route("/user", userController)
	.route("/catalogue", catalogueController)
	.route("/product", productController)
	.route("/order", orderController)
	.route("/shipping", shippingController);

export default app;
