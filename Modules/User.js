import mongoose from "mongoose"
const { Schema } = mongoose

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    role: {
        type: Schema.Types.ObjectId,
        ref: "Roles"
    }
})

export default mongoose.model("User", userSchema)