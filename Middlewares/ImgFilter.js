import multer from "multer";

// Storage config for image
const imgStorage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, `image-${Date.now()}.${file.originalname}`);
  }
});

// Image filter
const isImage = (req, file, callback) => {
  if (file.mimetype.startsWith("image")) {
    callback(null, true);
  } else {
    callback(new Error("Only images are allowed"));
  }
};

const uploadImage = multer({
  storage: imgStorage,
  fileFilter: isImage
});

export default uploadImage;