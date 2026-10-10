import multer from "multer";

// Memory storage: the image goes straight to ImageKit. The old disk storage
// wrote every upload to the temp folder and never deleted it.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error("Only JPG, PNG, WEBP, GIF or AVIF images are allowed"), { status: 400 }));
  },
});

export default upload;
