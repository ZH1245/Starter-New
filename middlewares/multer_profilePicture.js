const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join("./public/images/profile-pictures"));
  },
  filename: (req, file, cb) => {
    const filename = file.originalname.split(".jpg")[0];
    cb(null, Date.now() + "-" + filename + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const multerImages = (req, res, next) => {
  console.log("multer", req.body);
  console.log("multer2", req.picture);
  if (!req.body?.picture) {
    return res
      .status(401)
      .send({ message: "Please Provide Profile Picture", data: null });
  } else {
    upload.single("picture");
    next();
  }
};
module.exports = multerImages;
