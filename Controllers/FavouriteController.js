import express from "express"
import errorHandling from "../Middlewares/ErrorHandling.js";
import Favourite from "../Modules/Favourite.js";
const router = express.Router()

router.post("/addFavourites", errorHandling(async (req, res) => {
    const { userId, productId } = req.body
    if (!userId || !productId) return res.status(400).json({ message: "user Id or product Id missing" })
    const findProduct = await Favourite.findOne({ userId, productId })
    if (findProduct) return res.status(400).json({ message: "Game already in favourites" })
    const newRecordAdd = await Favourite.create({
        userId, productId
    })
    res.json(newRecordAdd)
}))


router.get("/allFavourites", errorHandling(async (req, res) => {
    const allRecords = await Favourite.find().populate("productId").populate("userId")
    res.json(allRecords)
}))

router.delete("/delFavourite", errorHandling(async (req, res) => {
    const { userId, productId } = req.body
    const DelGame = await Favourite.findOneAndDelete({ userId, productId });
    if (!DelGame) {
        return res.status(404).json({ message: "Game not found" });
    }
    res.json({ message: "Game deleted successfully" });
}));

export default router;