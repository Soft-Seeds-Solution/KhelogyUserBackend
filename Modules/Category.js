import mongoose from "mongoose";
const { Schema } = mongoose;

const CategorySchema = new Schema({
    category: { type: String, required: true },
    description: String,
    shortDes: String,
    logo: String,
    metaTitle: String,
    metaDes: String,
    catUrl: String,
    keywords: [String],
    catIndex: {
        type: String,
        default: "noIndex"
    },
    faqs: [
        {
            question: String,
            answer: String
        }
    ],
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    ancestors: [{ type: Schema.Types.ObjectId, ref: "Category" }]
}, { timestamps: true });

export default mongoose.model("Category", CategorySchema);