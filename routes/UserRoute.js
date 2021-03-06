const validation = require("../helpers/validation");
const cors = require("cors");
const userRules = require("../validations/UserValidation");
const UserController = require("../controllers/UserController");
const router = require("express").Router();
const handleSingupAuth = require("../middlewares/signUpauth");
const authAdmin = require("../middlewares/adminAuth");
const handleAuth = require("../middlewares/auth");
const multerprofileImages = require("../middlewares/multer_profilePicture");
const path = require("path");

const multer = require("multer");
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

router.post(
  "/login",
  // handleSingupAuth,
  // userRules.loginUserRules(),
  // validation,
  // UserController.login
  UserController.loginUser
);
router.post(
  "/signup",
  // handleSingupAuth,
  // userRules.signUpUserRules(),
  // validation,
  UserController.createUser
  // UserController.signup
);
router.get("/validate", UserController.verifyUser);
router.get("/get", UserController.getUser);
router.get("/get/:id", UserController.getUserByID);
router.get("/all", handleAuth, authAdmin, UserController.getAll);
router.post("/forgot", UserController.forgotPassword);
router.put(
  "/update/password",
  handleSingupAuth,
  // userRules.updatePassword(),
  // validation,
  UserController.updatePassword
);
router.get("/mydetails", handleAuth, UserController.getmyDetails);
router.put("/verify/otp", UserController.verifyOTP);
router.put("/block", handleAuth, authAdmin, UserController.blockUser);
router.put("/delete", handleAuth, UserController.deleteUser);
router.put(
  "/update/picture",
  // cors(),
  handleAuth,
  upload.single("picture"),
  UserController.updateProfilePicture
);
router.put("/update/profile", cors(), handleAuth, UserController.updateProfile);
router.get("/balance", handleAuth, UserController.getBalance);
// router.post("/block/", handleAuth, authAdmin, UserController.blockUser);
module.exports = router;
