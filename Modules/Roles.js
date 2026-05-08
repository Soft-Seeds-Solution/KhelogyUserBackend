import mongoose from "mongoose"
const { Schema } = mongoose;

const Roles = new Schema({
    role: String,
    permissions: [
        {
            type: String
        }
    ]
}, { timestamps: true })

export default mongoose.model("Roles", Roles)