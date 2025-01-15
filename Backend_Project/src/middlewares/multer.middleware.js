import multer from "multer";

export const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, file.filename + "-" + uniqueSuffix);
    cb(null, file.originalname);
    console.log(filename);
  },
});

export const upload = multer({ storage: storage });
