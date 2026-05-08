import express from "express"
import errorHandling from "../Middlewares/ErrorHandling.js";
import TrackRecord from "../Modules/TrackRecord.js";
const router = express.Router()

router.post("/trackRecord", errorHandling(async (req, res) => {
    const { userId, productId } = req.body
    if (!userId || !productId) return res.status(400).json({ message: "user Id or product Id missing" })
    const newRecordAdd = await TrackRecord.create({
        userId, productId
    })
    res.json(newRecordAdd)
}))

router.get("/allTrackRecords", errorHandling(async (req, res) => {
    const allRecords = await TrackRecord.find().populate("productId").populate("userId")
    res.json(allRecords)
}))

export default router;