// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import { connect } from "./utils/db.js";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import ConfiguratorRoute from "./routes/StoreProducts.route.js";
import VarianceRouter from "./routes/variance.route.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

await connect()

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// @ts-ignore
async function authenticateUser(req, res, next) {
  try {
    const shop = req.query.shop;

    if (!shop) {
      return res.status(400).send("Shop is required");
    }

    const sessions = await shopify.config.sessionStorage.findSessionsByShop(shop);

    console.log("sessions:", sessions);
    console.log("shop:", shop);

    if (!sessions || sessions.length === 0) {
      return res.status(401).send("No session found for this shop");
    }

    if (shop === sessions[0]?.shop) {
      return next();
    }

    return res.status(403).send("User is not authorized");

  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).send("Internal Server Error");
  }
}

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());
app.use("/proxy/*", authenticateUser);

app.use(express.json());

const routes = [ConfiguratorRoute, VarianceRouter]

routes.forEach((route) => {
  app.use("/api", route);
  app.use("/proxy", route);
})

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
