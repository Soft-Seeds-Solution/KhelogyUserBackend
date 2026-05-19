import express from "express"
import errorHandling from "../Middlewares/ErrorHandling.js"
import upload from "../Middlewares/ImgFilter.js";
import cloudinary from "../Cloudinary.js";
import Category from "../Modules/Category.js";
import User from "../Modules/User.js";
const router = express.Router();

const removePendingFields = (cat) => {

    const catObj = cat.toObject
        ? cat.toObject()
        : cat;

    delete catObj.pendingChanges;
    delete catObj.pendingBy;
    delete catObj.pendingAt;
    delete catObj.publishedByAdmin;

    return catObj;
};

router.post(
    "/addCategory",
    upload.single("logo"),
    errorHandling(async (req, res) => {

        const {
            category,
            description,
            shortDes,
            parentId,
            catIndex,
            metaDes,
            metaTitle,
            keywords,
            catUrl
        } = req.body;

        if (!category) {
            return res.status(400).json({
                message: "Please select at least category"
            });
        }

        const existingCategory = await Category.findOne({
            category: {
                $regex: new RegExp(`^${category.trim()}$`, "i")
            }
        });

        if (existingCategory) {
            return res.status(400).json({
                message: "Category already exists"
            });
        }

        // FAQs
        const faqs = req.body.faqs
            ? JSON.parse(req.body.faqs)
            : [];

        // Parent + Ancestors
        let ancestors = [];

        if (parentId) {

            const parentCategory = await Category.findById(parentId);

            if (!parentCategory) {
                return res.status(404).json({
                    message: "Parent category not found"
                });
            }

            ancestors = [
                ...parentCategory.ancestors,
                parentCategory._id
            ];
        }

        // Image
        let CatImage;

        if (req.file) {

            const uploadCatImage =
                await cloudinary.uploader.upload(req.file.path);

            CatImage = uploadCatImage.secure_url;
        }

        // Keywords
        const keywordsArray = keywords
            ? keywords.split(",")
                .map(k => k.trim())
                .filter(k => k)
            : [];

        const categoryData = {
            category,
            description,
            shortDes,
            logo: CatImage,
            faqs,
            catIndex,
            metaDes,
            metaTitle,
            parent: parentId || null,
            ancestors,
            keywords: keywordsArray,
            catUrl
        };

        // ==========================
        // ADMIN DIRECT SAVE
        // ==========================
        const user = await User.findById(req.body.role).populate("role");

        const isAdmin = user?.role?.role === "Admin";
        const permissions = user?.role?.permissions || [];

        const isApprovedUser = permissions.includes("approved user");
        // ✅ ADMIN: DIRECT UPDATE (LIVE CHANGE)
        if (isAdmin || isApprovedUser) {

            const newCategory = new Category({
                ...categoryData,
                publishedByAdmin: true
            });

            await newCategory.save();

            return res.status(201).json(
                removePendingFields(newCategory)
            );
        }

        // ==========================
        // USER PENDING APPROVAL
        // ==========================

        const newCategory = new Category({
            category,
            pendingChanges: categoryData,
            pendingBy: req.body?.role,
            pendingAt: new Date(),
            publishedByAdmin: false
        });

        await newCategory.save();

        res.status(201).json({
            message: "Category submitted for admin approval"
        });
    })
);

// GET /api/category
router.get("/allCategories", async (req, res) => {
    try {
        const categories = await Category.find()
            .populate("parent", "category")
            .sort({ createdAt: -1 });

        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to build tree and include parent name
const buildTree = (categories, parent = null) => {
    const categoryMap = Object.fromEntries(categories.map(cat => [String(cat._id), cat.category]));

    const helper = (parentId) =>
        categories
            .filter(cat => String(cat.parent) === String(parentId))
            .map(cat => ({
                ...cat,
                parent: cat.parent ? categoryMap[String(cat.parent)] || null : null,
                children: helper(cat._id),
            }));

    return helper(parent);
};

// GET /api/category/nested
router.get("/nestedCategories", async (req, res) => {
    try {
        const categories = await Category.find().lean();
        const tree = buildTree(categories);
        res.status(200).json(tree);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/category/:id
router.get("/categoryById/:id", async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate("ancestors", "category")
            .populate("parent", "category");

        if (!category)
            return res.status(404).json({ message: "Category not found" });

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Edit Modal
router.put(
    "/updateCategoryById/:id",
    upload.single("logo"),
    errorHandling(async (req, res) => {

        const {
            category,
            description,
            shortDes,
            parentId,
            metaDes,
            metaTitle,
            keywords,
            faqs,
            catUrl,
            catIndex
        } = req.body;

        const catId = req.params.id;

        const existingCat = await Category.findById(catId);

        if (!existingCat) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        let updateCategoryData = {};

        // FAQs
        if (faqs) {
            updateCategoryData.faqs = JSON.parse(faqs);
        }

        if (category) updateCategoryData.category = category;
        if (catIndex) updateCategoryData.catIndex = catIndex;
        if (description) updateCategoryData.description = description;
        if (shortDes) updateCategoryData.shortDes = shortDes;
        if (metaDes) updateCategoryData.metaDes = metaDes;
        if (metaTitle) updateCategoryData.metaTitle = metaTitle;
        if (catUrl) updateCategoryData.catUrl = catUrl;

        // Parent + Ancestors
        if (parentId !== undefined) {

            if (parentId) {

                const parentCategory =
                    await Category.findById(parentId);

                if (!parentCategory) {

                    return res.status(404).json({
                        message: "Parent category not found"
                    });
                }

                updateCategoryData.parent = parentId;

                updateCategoryData.ancestors = [
                    ...parentCategory.ancestors,
                    parentCategory._id
                ];

            } else {

                updateCategoryData.parent = null;
                updateCategoryData.ancestors = [];
            }
        }

        // Logo
        if (req.file) {

            const uploadCatImage =
                await cloudinary.uploader.upload(req.file.path);

            updateCategoryData.logo =
                uploadCatImage.secure_url;
        }

        // Keywords
        if (keywords !== undefined) {

            const keywordsArray = keywords
                ? keywords.split(",")
                    .map(k => k.trim())
                    .filter(k => k)
                : [];

            updateCategoryData.keywords = keywordsArray;
        }

        // ==========================
        // ADMIN DIRECT UPDATE
        // ==========================
        const user = await User.findById(req.body.role).populate("role");

        const isAdmin = user?.role?.role === "Admin";
        const permissions = user?.role?.permissions || [];

        const isApprovedUser = permissions.includes("approved user");
        // ✅ ADMIN: DIRECT UPDATE (LIVE CHANGE)
        if (isAdmin || isApprovedUser) {

            const updatedCategory =
                await Category.findByIdAndUpdate(
                    catId,
                    {
                        $set: {
                            ...updateCategoryData,
                            pendingChanges: null,
                            pendingBy: null,
                            pendingAt: null,
                            publishedByAdmin: true
                        }
                    },
                    { new: true }
                );

            return res.json(
                removePendingFields(updatedCategory)
            );
        }

        // ==========================
        // USER PENDING UPDATE
        // ==========================

        existingCat.pendingChanges = updateCategoryData;
        existingCat.pendingBy = req.body?.role;
        existingCat.pendingAt = new Date();
        existingCat.publishedByAdmin = false

        await existingCat.save();

        res.json({
            message: "Category update submitted for admin approval"
        });
    })
);

router.put(
    "/approvePendingCat/:id",
    errorHandling(async (req, res) => {

        const gameId = req.params.id;

        // =========================
        // FIND GAME
        // =========================
        const existingCat = await Category.findById(gameId);

        if (!existingCat) {
            return res.status(404).json({
                message: "Game not found"
            });
        }

        // =========================
        // CHECK PENDING CHANGES
        // =========================
        if (!existingCat.pendingChanges) {
            return res.status(400).json({
                message: "No pending changes found"
            });
        }

        // =========================
        // APPLY PENDING CHANGES
        // =========================
        Object.keys(existingCat.pendingChanges).forEach((key) => {
            existingCat[key] = existingCat.pendingChanges[key];
        });

        // =========================
        // CLEAR PENDING
        // =========================
        existingCat.pendingChanges = null;
        existingCat.pendingBy = null;
        existingCat.pendingAt = null;
        existingCat.publishedByAdmin = true;

        await existingCat.save();

        return res.json({
            success: true,
            message: "Pending changes approved and published successfully",
            game: existingCat
        });

    })
);

router.put(
    "/updateCatToIndex/:id",
    errorHandling(async (req, res) => {
        const catId = req.params.id;

        const existingCat = await Category.findById(catId);
        if (!existingCat) return res.status(404).json({ message: "Category not found" });
        existingCat.catIndex = "index"
        await existingCat.save()
        res.json(existingCat)
    })
);
router.put(
    "/updateCatToNoIndex/:id",
    errorHandling(async (req, res) => {
        const catId = req.params.id;

        const existingCat = await Category.findById(catId);
        if (!existingCat) return res.status(404).json({ message: "Category not found" });
        existingCat.catIndex = "noIndex"
        await existingCat.save()
        res.json(existingCat)
    })
);

router.delete("/delCat/:id", errorHandling(async (req, res) => {
    const DelGame = await Category.findByIdAndDelete(req.params.id);
    if (!DelGame) {
        return res.status(404).json({ message: "Game not found" });
    }
    res.json({ message: "Game deleted successfully" });
}));

export default router;