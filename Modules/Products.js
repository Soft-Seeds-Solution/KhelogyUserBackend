import mongoose from "mongoose";
const { Schema } = mongoose;

const localizedString = {
  en: { type: String },
  ar: { type: String },
  zh: { type: String }, // Simplified Chinese
  zh_tw: { type: String }, // Traditional Chinese
  fr: { type: String },
  de: { type: String }, // German
  hi: { type: String },
  id: { type: String }, // Indonesian
  it: { type: String },
  ja: { type: String },
  ko: { type: String },
  pt: { type: String }, // Portuguese
  ru: { type: String },
  es: { type: String },
  tr: { type: String },
  ur: { type: String },
  vi: { type: String } // Vietnamese
};

const productSchema = new Schema({
  title: localizedString,
  shortDes: localizedString,
  description: localizedString,
  metaTitle: String,
  metaDescription: String,
  gameKeywords: [String],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],
  gameTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "tags"
  }],
  thumbnail: String,
  gameUrl: String,
  howToPlay: String,
  whoCreated: String,
  orientation: String,
  featureList: String,
  controls: String,
  video: String,
  featureGame: String,
  gameStatus: String,
  gameIndex: String,
  faqs: [
    {
      question: String,
      answer: String
    }
  ],
  views: {
    type: Number,
    default: 0
  },
  played: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  disLikes: {
    type: Number,
    default: 0
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  status: String
}, { timestamps: true });

export default mongoose.model("Games", productSchema);
