import express from "express";
import errorHandling from "../Middlewares/ErrorHandling.js"
import upload from "../Middlewares/ImgFilter.js";
import GameCategory from "../Modules/GameCategory.js";
import cloudinary from "../Cloudinary.js";
const router = express.Router();

router.post("/addCategory", upload.single("logo"), errorHandling(async (req, res) => {
    const { category, faqs, description, shortDes } = req.body;

    if (!category) return res.status(400).json({ message: "Category not found" })

    /* ---------------- PARSE FAQS ---------------- */
    const parsedFaqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs;
    const safeFaqs = Array.isArray(parsedFaqs) ? parsedFaqs : [];

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

    let CatImage;
    if (req.file) {
        const uploadCatImage = await cloudinary.uploader.upload(req.file.path);
        CatImage = uploadCatImage.secure_url;
    }

    const existingCategory = await GameCategory.findOne({
        category: { $regex: new RegExp("^" + category + "$", "i") },
    });

    if (existingCategory) return res.status(400).json({ message: "Category already exists" });

    const Allategory = await GameCategory.create({ category, logo: CatImage, faqs: safeFaqs, description, shortDes });
    res.json(Allategory);
}));

router.get("/getCategory", errorHandling(async (req, res) => {
    const Getcategory = await GameCategory.find({});
    res.json(Getcategory);
}));

router.get("/categoryById/:id", errorHandling(async (req, res) => {
    const Getcategory = await GameCategory.findById(req.params.id);
    if (!Getcategory) {
        return res.status(404).json({ message: "Dont find Category" });
    }
    res.json(Getcategory);

}));

router.delete("/delCategory/:id", errorHandling(async (req, res) => {
    const Getcategory = await GameCategory.findByIdAndDelete(req.params.id);
    if (!Getcategory) {
        return res.status(404).json({ message: "Don't find Category" });
    }
    res.json({ message: "Category deleted successfully" });
}));

router.put(
    "/editCategory/:id",
    upload.single("logo"),
    errorHandling(async (req, res) => {
        const { category, faqs, description, shortDes } = req.body;

        const newCat = {};

        if (category) newCat.category = category;
        if (description) newCat.description = description;
        if (shortDes) newCat.shortDes = shortDes;

        if (faqs) {
            try {
                const parsedFaqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs;
                newCat.faqs = Array.isArray(parsedFaqs) ? parsedFaqs : [];
            } catch {
                return res.status(400).json({ message: "Invalid FAQs format" });
            }
        }

        if (req.file) {
            const uploadIndImage = await cloudinary.uploader.upload(req.file.path);
            newCat.logo = uploadIndImage.secure_url;
        }

        const cat = await GameCategory.findById(req.params.id);
        if (!cat) {
            return res.status(404).json({ message: "Category not found" });
        }

        const updatedCat = await GameCategory.findByIdAndUpdate(
            req.params.id,
            { $set: newCat },
            { new: true }
        );

        res.json(updatedCat);
    }));

router.get("/blogCategoryCount", errorHandling(async (req, res) => {
    const categoryCount = await GameCategory.countDocuments({})
    res.json(categoryCount)
}))

export default router;
