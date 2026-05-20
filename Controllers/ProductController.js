import express from "express";
import Products from "../Modules/Products.js";
import Category from "../Modules/Category.js";
import errorHandling from "../Middlewares/ErrorHandling.js";
import Cloudinary from "../Cloudinary.js";
import uploadFile from "../Middlewares/MultiUploader.js";
import User from "../Modules/User.js";

const router = express.Router();

// 🔹 Cache refresh helper
const refreshCache = async () => {
    try {
        await fetch("https://edge.khelogy.com/api/games/uploadedd-games", {
            method: "POST"
        });

        await fetch("https://edge.khelogy.com/api/category/nestedCategories", {
            method: "POST"
        });

        console.log("✅ Cache refreshed");
    } catch (err) {
        console.log("❌ Cache refresh failed:", err.message);
    }
};

const removePendingFields = (game) => {

    const gameObj = game.toObject
        ? game.toObject()
        : game;

    delete gameObj.pendingChanges;
    delete gameObj.pendingBy;
    delete gameObj.pendingAt;
    delete gameObj.publishedByAdmin;

    return gameObj;
};

router.post(
    "/uploadd-game",
    uploadFile.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "video", maxCount: 1 }
    ]),
    errorHandling(async (req, res) => {
        const {
            title,
            categoryIds,
            shortDes,
            description,
            howToPlay,
            whoCreated,
            gameKeywords,
            gameUrl,
            orientation,
            featureGame,
            featureList,
            controls,
            faqs,
            userId,
            status,
            gameStatus,
            gameIndex,
            metaTitle,
            metaDescription,
            gameTags
        } = req.body;

        /* ---------------- PARSE LOCALIZED FIELDS ---------------- */
        const parsedTitle = typeof title === "string" ? JSON.parse(title) : title;
        const parsedShortDes = typeof shortDes === "string" ? JSON.parse(shortDes) : shortDes;
        const parsedDescription = typeof description === "string" ? JSON.parse(description) : description;
        const keywordsArray = gameKeywords
            ? gameKeywords.split(",").map(k => k.trim()).filter(k => k)
            : [];
        /* ---------------- PARSE FAQS ---------------- */
        const parsedFaqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs;
        const safeFaqs = Array.isArray(parsedFaqs) ? parsedFaqs : [];

        /* ---------------- BASIC VALIDATION ---------------- */
        if (
            !parsedTitle?.en ||
            !parsedShortDes?.en ||
            // !parsedKeywords?.en?.length ||
            !categoryIds ||
            !gameUrl ||
            !orientation
            // !howToPlay
        ) {
            return res.status(400).json({
                message: "Required English fields are missing"
            });
        }

        // Handle categories (simple check for not null/undefined)
        let allCategories = [];
        if (categoryIds) {
            const parsedIds =
                typeof categoryIds === "string"
                    ? JSON.parse(categoryIds)
                    : categoryIds;

            if (Array.isArray(parsedIds)) {
                allCategories = parsedIds.filter(id => id);
            }
        }

        /* ---------------- FAQ VALIDATION ---------------- */
        if (safeFaqs.length) {
            const invalidFaq = safeFaqs.some(
                faq => !faq.question || !faq.answer
            );
            if (invalidFaq) {
                return res.status(400).json({
                    message: "Each FAQ must contain question and answer"
                });
            }
        }

        /* ---------------- UNIQUE TITLE CHECK ---------------- */
        const existingTitle = await Products.findOne({
            "title.en": { $regex: new RegExp(`^${parsedTitle.en}$`, "i") }
        });

        if (existingTitle) {
            return res.status(400).json({
                message: "Game with this English title already exists"
            });
        }

        /* ---------------- FILE UPLOADS ---------------- */
        let thumbnail_url = null;
        let video_url = null;

        if (req.files?.thumbnail?.[0]?.mimetype.startsWith("image")) {
            const uploadThumbnail = await Cloudinary.uploader.upload(
                req.files.thumbnail[0].path
            );
            thumbnail_url = uploadThumbnail.secure_url;
        }

        if (req.files?.video?.[0]?.mimetype.startsWith("video")) {
            const uploadVideo = await Cloudinary.uploader.upload(
                req.files.video[0].path,
                { resource_type: "video" }
            );
            video_url = uploadVideo.secure_url;
        }

        /* ---------------- CREATE GAME ---------------- */
        const uploadGame = await Products.create({
            title: parsedTitle,
            shortDes: parsedShortDes,
            description: parsedDescription,
            gameKeywords: keywordsArray,
            categories: allCategories,
            gameUrl,
            howToPlay,
            whoCreated,
            orientation,
            featureGame,
            featureList,
            controls,
            gameTags,
            faqs: safeFaqs,
            thumbnail: thumbnail_url,
            video: video_url,
            userId,
            status,
            gameStatus,
            gameIndex,
            metaTitle,
            metaDescription
        });

        res.status(201).json({
            message: "Game uploaded successfully",
            data: uploadGame
        });
    })
);

router.get(
    "/featured-games",
    errorHandling(async (req, res) => {

        const featuredGames = await Products.find(
            { featureGame: "Yes" },
            "title thumbnail"
        ).lean();

        const safeGames =
            featuredGames.map(removePendingFields);

        res.status(200).json(safeGames);

    })
);

router.get(
    "/uploadedd-games",
    errorHandling(async (req, res) => {

        const uploadedGames = await Products.find()
            .populate("categories", "category ancestors catUrl")
            .populate("userId")
            .populate("gameTags");

        const formattedGames = uploadedGames.map(game => {

            const sortedCategories =
                [...game.categories].sort(
                    (a, b) =>
                        a.ancestors.length -
                        b.ancestors.length
                );

            return {
                categories: sortedCategories
            };
        });

        res.json(formattedGames);

    })
);

router.get(
    "/uploadedd-games-with-pending-data",
    errorHandling(async (req, res) => {

        const uploadedGames = await Products.find({
            pendingChanges: { $ne: null }
        })
            .populate("categories", "category ancestors catUrl")
            .populate("userId")
            .populate("gameTags");

        const formattedGames = uploadedGames.map(game => {
            const sortedCategories = [...game.categories].sort(
                (a, b) => a.ancestors.length - b.ancestors.length
            );

            return {
                ...game.toObject(),
                categories: sortedCategories
            };
        });

        res.json(formattedGames);

    })
);

router.get(
    "/top-liked-games",
    errorHandling(async (req, res) => {

        const topLikesGames = await Products.find({
            status: { $nin: ["Pending", "Rejected"] },
        })
            .populate("categoryId")
            .populate("userId")
            .populate("gameTags")
            .sort({ views: -1 })
            .limit(20);

        const safeGames =
            topLikesGames.map(removePendingFields);

        res.status(200).json(safeGames);

    })
);

router.get(
    "/top-viewed-games",
    errorHandling(async (req, res) => {

        const topLikesGames = await Products.find({
            status: { $nin: ["Pending", "Rejected"] },
        })
            .populate("categoryId")
            .populate("userId")
            .populate("gameTags")
            .sort({ likes: -1 })
            .limit(20);

        const safeGames =
            topLikesGames.map(removePendingFields);

        res.status(200).json(safeGames);

    })
);

router.get(
    "/unique-categories",
    errorHandling(async (req, res) => {
        // Find all approved games
        const games = await Products.find({
            status: { $nin: ["Pending", "Rejected"] },
        }).populate("categoryId");

        // Use a Set to ensure unique category IDs
        const uniqueCategories = [];
        const addedIds = new Set();

        games.forEach((game) => {
            const cat = game.categoryId;
            if (cat && !addedIds.has(cat._id.toString())) {
                uniqueCategories.push(cat);
                addedIds.add(cat._id.toString());
            }
        });

        // Send top 8 categories + a "more" placeholder
        const displayedCategories = [
            ...uniqueCategories.slice(0, 8),
            { name: "more" },
        ];

        res.status(200).json(displayedCategories);
    })
);

router.put(
    "/update-game-links",
    errorHandling(async (req, res) => {
        const games = await Products.find();

        let updatedCount = 0;

        for (const game of games) {
            if (game.gameUrl && game.gameUrl.includes("netlify.app")) {
                const updatedUrl = game.gameUrl.replace("netlify.app", "khelogy.com");
                await Products.findByIdAndUpdate(game._id, { gameUrl: updatedUrl });
                updatedCount++;
            }
        }

        res.status(200).json({
            message: `✅ Updated ${updatedCount} game links successfully`,
        });
    })
);

router.get("/unique-game-urls", errorHandling(async (req, res) => {
    // 1. Fetch only the game_url field
    const games = await Products.find({}, { gameUrl: 1, _id: 0 });

    // 2. Extract URLs
    const urls = games.map(g => g.gameUrl).filter(Boolean);

    // 3. Remove duplicates using Set
    const uniqueUrls = [...new Set(urls)];

    res.status(200).json({ urls: uniqueUrls });
}));

router.get(
    "/gameById/:id",
    errorHandling(async (req, res) => {

        const game = await Products.findById(req.params.id)
            .populate("categories", "category ancestors catUrl")
            .populate("gameTags");

        if (!game) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        const sortedCategories =
            game.categories.sort(
                (a, b) =>
                    a.ancestors.length -
                    b.ancestors.length
            );

        // REMOVE PENDING CHANGES (VERY IMPORTANT)
        const safeGame = removePendingFields(game);

        safeGame.categories = sortedCategories;

        res.json(safeGame);

    })
);

router.get(
    "/gameByTitle/:title",
    errorHandling(async (req, res) => {

        const title = req.params.title;

        const game = await Products.findOne({
            "title.en": title
        }).populate("gameTags");

        if (!game) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        // STORE IN CACHE (raw for internal use)
        cache[title] = game;

        // REMOVE PENDING FIELDS BEFORE SENDING
        const safeGame = removePendingFields(game);

        res.json(safeGame);

    })
);

router.get("/home-data", async (req, res) => {
    try {
        const [featured, topViewed, topLiked, uploaded] = await Promise.all([
            Products.find({ featureGame: "Yes" }).limit(12),
            Products.find().sort({ views: -1 }).limit(12),
            Products.find().sort({ likes: -1 }).limit(12),
            Products.find({ status: { $nin: ["Pending", "Rejected"] } })
        ]);

        res.status(200).json({
            featured,
            topViewed,
            topLiked,
            uploaded
        });
    } catch (error) {
        console.error("Error fetching home data:", error);
        res.status(500).json({ error: "Failed to fetch home data" });
    }
});

router.delete("/delGame/:id", errorHandling(async (req, res) => {
    const DelGame = await Products.findByIdAndDelete(req.params.id);
    if (!DelGame) {
        return res.status(404).json({ message: "Game not found" });
    }

    res.json({ message: "Game deleted successfully" });
}));

router.put(
    "/editGame/:id",
    uploadFile.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "video", maxCount: 1 },
    ]),
    errorHandling(async (req, res) => {

        const gameId = req.params.id;

        const existingGame = await Products.findById(gameId);

        if (!existingGame) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        // ======================
        // PARSE INPUT DATA
        // ======================
        const parsedTitle =
            typeof req.body.title === "string"
                ? JSON.parse(req.body.title)
                : req.body.title;

        const parsedShortDes =
            typeof req.body.shortDes === "string"
                ? JSON.parse(req.body.shortDes)
                : req.body.shortDes;

        const parsedDescription =
            typeof req.body.description === "string"
                ? JSON.parse(req.body.description)
                : req.body.description;

        const parsedFaqs =
            typeof req.body.faqs === "string"
                ? JSON.parse(req.body.faqs)
                : req.body.faqs;

        const parsedGameTags =
            typeof req.body.gameTags === "string"
                ? JSON.parse(req.body.gameTags)
                : req.body.gameTags;

        const safeFaqs = Array.isArray(parsedFaqs) ? parsedFaqs : [];

        // keywords
        const keywordsArray = req.body.gameKeywords
            ? req.body.gameKeywords.split(",").map(k => k.trim()).filter(Boolean)
            : [];

        // categories
        let allCategories = [];
        if (req.body.categoryIds) {
            const parsedIds =
                typeof req.body.categoryIds === "string"
                    ? JSON.parse(req.body.categoryIds)
                    : req.body.categoryIds;

            if (Array.isArray(parsedIds)) {
                allCategories = parsedIds.filter(Boolean);
            }
        }

        // ======================
        // BUILD UPDATE OBJECT
        // ======================
        const updatedData = {};

        if (parsedTitle) updatedData.title = parsedTitle;
        if (parsedShortDes) updatedData.shortDes = parsedShortDes;
        if (parsedDescription) updatedData.description = parsedDescription;
        if (keywordsArray.length) updatedData.gameKeywords = keywordsArray;
        if (allCategories.length) updatedData.categories = allCategories;
        if (parsedGameTags?.length) updatedData.gameTags = parsedGameTags;
        if (req.body.gameUrl) updatedData.gameUrl = req.body.gameUrl;
        if (req.body.howToPlay) updatedData.howToPlay = req.body.howToPlay;
        if (req.body.whoCreated) updatedData.whoCreated = req.body.whoCreated;
        if (req.body.orientation) updatedData.orientation = req.body.orientation;
        if (req.body.featureGame) updatedData.featureGame = req.body.featureGame;
        if (req.body.recommended) updatedData.recommended = req.body.recommended;
        if (req.body.featureList) updatedData.featureList = req.body.featureList;
        if (req.body.controls) updatedData.controls = req.body.controls;
        if (req.body.metaTitle) updatedData.metaTitle = req.body.metaTitle;
        if (req.body.metaDescription) updatedData.metaDescription = req.body.metaDescription;
        if (safeFaqs.length) updatedData.faqs = safeFaqs;

        // ======================
        // FILES
        // ======================
        if (req.files?.thumbnail?.[0]) {
            const imgUpload = await Cloudinary.uploader.upload(
                req.files.thumbnail[0].path
            );
            updatedData.thumbnail = imgUpload.secure_url;
        }

        if (req.files?.video?.[0]) {
            const videoUpload = await Cloudinary.uploader.upload(
                req.files.video[0].path,
                { resource_type: "video" }
            );
            updatedData.video = videoUpload.secure_url;
        }

        // ======================
        // ADMIN vs USER LOGIC
        // ======================
        const user = await User.findById(req.body.role).populate("role");

        if (!user || !user.role) {
            return res.status(401).json({
                message: "Unauthorized user"
            });
        }

        const permissions = user.role.permissions || [];

        const isAdmin = user.role.role === "Admin";
        const isApprovedUser = permissions.includes("approved user");

        // ======================
        // DIRECT UPDATE (ADMIN + APPROVED USER)
        // ======================
        if (isAdmin || isApprovedUser) {

            const updatedGame = await Products.findByIdAndUpdate(
                gameId,
                {
                    ...updatedData,
                    pendingChanges: null,
                    pendingBy: null,
                    pendingAt: null,
                    publishedByAdmin: true
                },
                { new: true }
            );

            return res.json({
                success: true,
                message: "Game updated and published",
                game: updatedGame
            });
        }

        // ======================
        // NORMAL USER → PENDING
        // ======================
        existingGame.pendingChanges = updatedData;
        existingGame.pendingBy = user._id;
        existingGame.pendingAt = new Date();
        existingGame.publishedByAdmin = false;

        await existingGame.save();

        return res.json({
            success: true,
            message: "Changes submitted for admin approval"
        });

    })
);

router.put(
    "/approvePendingGame/:id",
    errorHandling(async (req, res) => {

        const gameId = req.params.id;

        // =========================
        // FIND GAME
        // =========================
        const existingGame = await Products.findById(gameId);

        if (!existingGame) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        // =========================
        // CHECK PENDING CHANGES
        // =========================
        if (!existingGame.pendingChanges) {
            return res.status(400).json({
                message: "No pending changes found"
            });
        }

        // =========================
        // APPLY PENDING CHANGES
        // =========================
        Object.keys(existingGame.pendingChanges).forEach((key) => {
            existingGame[key] = existingGame.pendingChanges[key];
        });

        // =========================
        // CLEAR PENDING
        // =========================
        existingGame.pendingChanges = null;
        existingGame.pendingBy = null;
        existingGame.pendingAt = null;
        existingGame.publishedByAdmin = true;

        await existingGame.save();

        return res.json({
            success: true,
            message: "Pending changes approved and published successfully",
            game: existingGame
        });

    })
);

router.put(
    "/rejectPendingGame/:id",
    errorHandling(async (req, res) => {

        const gameId = req.params.id;

        // =========================
        // FIND GAME
        // =========================
        const existingGame = await Products.findById(gameId);

        if (!existingGame) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        // =========================
        // CHECK PENDING CHANGES
        // =========================
        if (!existingGame.pendingChanges) {
            return res.status(400).json({
                message: "No pending changes found"
            });
        }

        // =========================
        // REJECT → ONLY CLEAR PENDING
        // =========================
        existingGame.pendingChanges = null;
        existingGame.pendingBy = null;
        existingGame.pendingAt = null;
        existingGame.publishedByAdmin = false;

        await existingGame.save();

        return res.json({
            success: true,
            message: "Pending changes rejected successfully",
            game: existingGame
        });

    })
);

router.put(
    "/updateGameToPublish/:id",
    errorHandling(async (req, res) => {
        const gameId = req.params.id;

        const existingGame = await Products.findById(gameId);
        if (!existingGame) return res.status(404).json({ message: "Game not found" });
        existingGame.gameStatus = "Publish"
        await existingGame.save()
        res.json(existingGame)
    })
);
router.put(
    "/updateGameToUnPublish/:id",
    errorHandling(async (req, res) => {
        const gameId = req.params.id;

        const existingGame = await Products.findById(gameId);
        if (!existingGame) return res.status(404).json({ message: "Game not found" });
        existingGame.gameStatus = "UnPublish"
        await existingGame.save()
        res.json(existingGame)
    })
);

router.put(
    "/updateGameToIndex/:id",
    errorHandling(async (req, res) => {
        const gameId = req.params.id;

        const existingGame = await Products.findById(gameId);
        if (!existingGame) return res.status(404).json({ message: "Game not found" });
        existingGame.gameIndex = "Index"
        await existingGame.save()
        res.json(existingGame)
    })
);
router.put(
    "/updateGameToNoIndex/:id",
    errorHandling(async (req, res) => {
        const gameId = req.params.id;

        const existingGame = await Products.findById(gameId);
        if (!existingGame) return res.status(404).json({ message: "Game not found" });
        existingGame.gameIndex = "NoIndex"
        await existingGame.save()
        res.json(existingGame)
    })
);

router.put("/gameApprove/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.status = "Approved"
    await findProduct.save()
    res.json(findProduct)
})
);

router.put("/gameReject/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.status = "Rejected"
    await findProduct.save()
    res.json(findProduct)
})
);

router.put("/updateGameViews/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.views += 1
    await findProduct.save()
    res.json(findProduct)
})
);

router.put("/updateGamePlayed/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.played += 1
    await findProduct.save()
    res.json(findProduct)
})
);

router.put("/updateGameLikes/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.likes += 1
    await findProduct.save()
    res.json(findProduct)
})
);

router.put("/updateBackLikes/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.likes -= 1
    await findProduct.save()
    res.json(findProduct)
})
);

router.put("/updateGameDisLikes/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.disLikes += 1
    await findProduct.save()
    res.json(findProduct)
})
);

router.put("/updateBackDisLikes/:id", errorHandling(async (req, res) => {
    const findProduct = await Products.findById(req.params.id)
    if (!findProduct) return res.status(404).json({ message: "Game not found with this id" })
    findProduct.disLikes -= 1
    await findProduct.save()
    res.json(findProduct)
})
);

export default router;
