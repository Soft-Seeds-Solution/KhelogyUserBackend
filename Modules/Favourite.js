import mongoose from "mongoose"
const { Schema } = mongoose;

const favouriteSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Games"
    }
}, { timestamps: true })

export default mongoose.model("favourite", favouriteSchema)