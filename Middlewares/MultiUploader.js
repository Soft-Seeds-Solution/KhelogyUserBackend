import multer from "multer";

const storage = multer.diskStorage({
    filename: (req, file, callback) => {
        callback(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, callback) => {
    callback(null, true);
};

const uploadFile = multer({
    storage: storage,
    fileFilter: fileFilter
});

export default uploadFile;