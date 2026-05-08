import mongoose from "mongoose";
const { Schema } = mongoose

const gameCatSchema = new Schema({
    category: String,
    description: String,
    shortDes: String,
    logo: String,
    faqs: [
        {
            question: String,
            answer: String
        }
    ],
}, { timestamps: true })

export default mongoose.model("Game Category", gameCatSchema)