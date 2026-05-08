import express from "express";
import Blogs from "../Modules/Blogs.js";
import errorHandling from "../Middlewares/ErrorHandling.js";
import Cloudinary from "../Cloudinary.js";
import uploadImage from "../Middlewares/ImgFilter.js";

const router = express.Router();

router.post(
    "/upload-blog",
    uploadImage.single("image"),
    errorHandling(async (req, res) => {

        const { title, content, slug, meta, categoryId } = req.body;

        // ✅ Validation
        if (!title || !content || !slug) {
            return res.status(400).json({ message: "Title, content & slug are required" });
        }

        // ✅ Slug check
        const existing = await Blogs.findOne({ slug });
        if (existing) {
            return res.status(409).json({ message: "Slug already exists" });
        }

        let imageUrl = null;

        // ✅ Image upload
        if (req.file) {
            const upload = await Cloudinary.uploader.upload(req.file.path, {
                folder: "blogs"
            });
            imageUrl = upload.secure_url;
        }

        // ✅ Save blog
        const blog = await Blogs.create({
            title,
            content,
            categoryId,
            slug,
            meta,
            image: imageUrl
        });

        res.status(201).json(blog);
    })
);

router.get("/uploaded-blogs", errorHandling(async (req, res) => {
    const uploadedGames = await Blogs.find().populate("categoryId")
        .populate("userId");
    res.status(200).json(uploadedGames);
}));

router.get("/view-blog/:id", errorHandling(async (req, res) => {
    const ViewBlog = await Blogs.findById(req.params.id)
        .populate("categoryId")
        .populate("userId");

    if (!ViewBlog)
        return res.status(404).json({ message: "No Blog Found With This ID" });

    res.status(200).json(ViewBlog);
}));

router.delete("/delBlog/:id", errorHandling(async (req, res) => {
    const DelBlog = await Blogs.findByIdAndDelete(req.params.id);
    if (!DelBlog) {
        return res.status(404).json({ message: "Game not found" });
    }
    res.json({ message: "Game deleted successfully" });
}));

export default router;