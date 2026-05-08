import mongoose from "mongoose"
const { Schema } = mongoose;

const Tags = new Schema({
    tags: String
}, { timestamps: true })

export default mongoose.model("tags", Tags)