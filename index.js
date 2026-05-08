import express from "express";
import cors from "cors";
import connectToMongoDb from "./db.js";

import productController from "./Controllers/ProductController.js";
import GameCatController from "./Controllers/GameCatController.js";
import CategoryController from "./Controllers/CategoryController.js";
import UserController from "./Controllers/UserController.js";
import trackController from "./Controllers/TrackRecordController.js";
import favController from "./Controllers/FavouriteController.js";
import blogsController from "./Controllers/BlogsController.js";
import tagsController from "./Controllers/TagsController.js";
import cacheController from "./Controllers/CacheController.js";
import sitemapController from "./Controllers/Sitemap.js";
import RolesController from "./Controllers/RoleController.js";

const app = express();
app.set("etag", false);
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Connect once at startup
connectToMongoDb().catch(err => {
  console.error("MongoDB connection error:", err);
});

app.use("/api/gameCat", GameCatController);
app.use("/api/category", CategoryController);
app.use("/api/games", productController);
app.use("/api/user", UserController);
app.use("/api/track", trackController);
app.use("/api/fav", favController);
app.use("/api/blogs", blogsController);
app.use("/api/tags", tagsController);
app.use("/api/purgeCache", cacheController);
app.use("/api/role", RolesController);
app.use("/", sitemapController);

app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

export default app;