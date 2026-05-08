import mongoose from "mongoose";
const { Schema } = mongoose;

const blogSchema = new Schema({
    title: {
        type: String,
    },
    content: {
        type: String,
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "Game Category"
    },
    slug: {
        type: String,
    },
    image: {
        type: String,
    },
    meta: {
        type: String,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    date: {
        type: Date,
        default: Date.nowblogs
    }
});

export default mongoose.model("Blogs", blogSchema);