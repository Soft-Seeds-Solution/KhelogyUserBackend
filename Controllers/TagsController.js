import express from "express"
import errorHandling from "../Middlewares/ErrorHandling.js"
import Tags from "../Modules/Tags.js";
const router = express.Router();

router.post("/addTags", errorHandling(async (req, res) => {
    const { tags } = req.body;

    if (!tags || tags.trim() === "") {
        return res.status(400).json({ message: "Please add tag first" });
    }

    const existingTags = await Tags.findOne({
        tags: { $regex: new RegExp(`^${tags.trim()}$`, "i") }
    });

    if (existingTags) {
        return res.status(400).json({ message: "Tags already exists" });
    }

    const newTag = await Tags.create({ tags });

    res.status(201).json(newTag);
}));

// GET /api/category
router.get("/allTags", async (req, res) => {
    try {
        const tags = await Tags.find()
        res.status(200).json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/category/:id
router.get("/tagById/:id", async (req, res) => {
    try {
        const category = await Tags.findById(req.params.id)

        if (!category)
            return res.status(404).json({ message: "Category not found" });

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Edit Modal
router.put(
    "/updateTagById/:id",
    errorHandling(async (req, res) => {
        const { tags } = req.body;

        let updateTagData = {};
        // ✅ Parse faqs


        if (tags) updateTagData.tags = tags;

        const updatedTag = await Tags.findByIdAndUpdate(
            req.params.id,
            { $set: updateTagData },
            { new: true }
        );

        res.json(updatedTag);
    })
);

router.delete("/delTag/:id", errorHandling(async (req, res) => {
    const DelTag = await Tags.findByIdAndDelete(req.params.id);
    if (!DelTag) {
        return res.status(404).json({ message: "Tag not found" });
    }
    res.json({ message: "Tag deleted successfully" });
}));

export default router;