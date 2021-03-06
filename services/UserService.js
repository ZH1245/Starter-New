const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail, sendInfoEmail } = require("./SendEmail");
const uuid = require("uuid").v4;

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sendForgotPassword } = require("./SendEmail");
const Notifications = require("../models/Notifications");
const pusher = require("../helpers/pusher");

const cloudinary = require("cloudinary").v2;
// const UserTypeController = require("../controllers/UserTypeController");
// const UserTypeService = require("./UserTypeService");
// const UserType = require("../models/UserType");
// const req = require("express/lib/request");

cloudinary.config({
  cloud_name: 'snakecloud',
  api_key: '494282718685512',
  api_secret: 'ykZ8B12bVZFDQnqhna7Q2JcHaTE',
  secure: true
});

const userService = {
  updatePicture: async (req, user) => {
    const file = req.file;
    const data = await cloudinary.uploader.upload(file.path);
    // const imageNames = `http://tourbook-backend.herokuapp.com/images/profile-pictures/${file.filename}`;
    let user1 = await UserModel.findByIdAndUpdate(user.id, {
      $set: { profilePicture: data.url },
    });
    if (user1) {
      return { data:true, src: user1.profilePicture };
    } else {
      let e = new Error("CANNOT Update");
      e.statusCode = 404;
      throw e;
    }
  },
  getProfileInfo: async (id) => {
    let details = await UserModel.findById(id)
      .select(["-password"])
      .populate("city");
    if (details) {
      console.log(details);
      return details;
    } else {
      let e = new Error();
      e.message = "NOT FOUND";
      e.statusCode = 404;
      throw e;
    }
  },
  getUsers: async (query) => {
    let e = new Error();

    let queryParam = {};
    if (query?.email) {
      queryParam.email = query?.email;
    }
    if (query?.fname) {
      queryParam.fname = query?.fname;
    }
    if (query?.lname) {
      queryParam.lname = query?.lname;
    }
    if (query?.phone) {
      queryParam.phoneNumber = query?.phone;
    }
    if (query?.role) {
      queryParam.userType = query?.role;
    }
    if (query?.rating) {
      queryParam.rating = query?.rating;
    }
    if (query?.active) {
      queryParam.isActive = query?.active;
    }
    if (query?.verified) {
      queryParam.isVerified = query?.verified;
    }
    if (Object.keys(queryParam).length > 0) {
      let users = await UserModel.find(queryParam).select("-password");
      if (Object.keys(users).length > 0) {
        return users;
      } else {
        e.message = `Users NOT FOUND`;
        e.statusCode = 404;
        throw e;
      }
    } else {
      e.message = "Please Add Query Params";
      e.statusCode = 400;
      throw e;
    }
  },
  getUserByID: async (id) => {
    let user = await UserModel.findById(id)
      .select(["-password", "-cnic"])
      .populate("city");
    if (user) {
      return user;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  // getUserByBalance: async (balance) => {
  //   let users = UserModel.find({ balance: { $gte: balance } }).select([
  //     "-password",
  //     "phoneNumber",
  //     "-role",
  //   ]);
  //   if (Object.keys(users).length > 0) {
  //     return users;
  //   } else {
  //     let e = new Error();
  //     e.message = `NOT FOUND`;
  //     e.statusCode = 404;
  //     throw e;
  //   }
  // },
  getUserByEmail: async (email) => {
    let user = await UserModel.findOne({
      email: email,
      isActive: true,
      isDeleted: false,
    }).select("-password");
    if (user) {
      return user;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getUserByPhone: async (phone) => {
    let users = await UserModel.find({
      phoneNumber: phone,
      isActive: true,
      isDeleted: false,
    }).select(["-password", "-phoneNumber", "-role"]);
    if (Object.keys(users).length > 0) {
      return users;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getTourists: async () => {
    let tourists = await UserModel.find({
      userType: "6274bff67e124664e16ead9f",
      isActive: true,
      isDeleted: false,
    }).select(["-password", "-phoneNumber", "-role"]);
    if (Object.keys(tourists).length > 0) {
      return tourists;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getPendingAdmins: async () => {
    // console.log("INside pending admins")

    let admins = await UserModel.find({
      userType: "admin",
      isActive: false,
      isDeleted: false,
    })
      .select([
        "fname",
        "lname",
        "isActive",
        "isVerified",
        "isDeleted",
        "city",
        "userType",
      ])
      .populate("city");
    if (admins) return admins;
    else {
      let e = new Error("Not Found");
      e.statusCode = 404;
      throw e;
    }
  },
  getPendingVendors: async () => {
    let vendors = await UserModel.find({
      $or: [{ userType: "vendor" }, { userType: "tourguide" }],
      isActive: false,
      isDeleted: false,
    })
      .select([
        "fname",
        "lname",
        "isActive",
        "isVerified",
        "isDeleted",
        "city",
        "userType",
        "cnic",
        "email",
        "phoneNumber",
        "profilePicture",
      ])
      .populate("city");
    // .select(["-password", "-phoneNumber", "-role", "-cnic"]);
    // if (Object.keys(vendors).length > 0) {
    if (vendors) {
      console.log(vendors);
      return vendors;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getVendors: async () => {
    let vendors = await UserModel.find({
      $or: [{ userType: "vendor" }, { userType: "tourguide" }],
      isActive: true,
      isDeleted: false,
    }).select(["-password", "-phoneNumber", "-role"]);
    if (Object.keys(vendors).length > 0) {
      return vendors;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getVendorsByRating: async (rating) => {
    let vendors = await UserModel.find({
      $or: [{ userType: "vendor" }, { userType: "tourguide" }],
      isActive: true,
      isDeleted: false,
      rating: { $lte: rating },
    }).select(["-password", "-phoneNumber", "-role"]);
    if (Object.keys(vendors).length > 0) {
      return vendors;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  setVendorVerificationStaus: async (data) => {
    try {
      let vendor = await UserModel.findById(data.vendorID);
      if (vendor) {
        if (vendor.isActive === true && vendor.isDeleted === false) {
          let updatedvendor = await UserModel.updateOne(
            { _id: data.vendorID },
            { $set: { isActive: true } }
          );
          return vendor;
        } else {
          let e = new Error();
          e.message = "Not Found";
          e.statusCode = 404;
          throw e;
        }
      } else {
        let e = new Error();
        e.message = `NOT FOUND`;
        e.statusCode = 404;
        throw e;
      }
    } catch (e) {
      throw e;
    }
  },
  blockUser: async (data) => {
    // let user = await UserModel.findOneAndUpdate(
    //   { _id: data, isActive: true, isDeleted: false, isVerified: true },
    //   { $set: { isActive: false } }
    // );
    let user = await UserModel.findOne({
      _id: data,
      // isDeleted: false,
      // isVerified: true,
    });
    // console.log(user);
    if (user) {
      if (user.isDeleted) {
        let e = new Error("User is Deleted and Blocked");
        user.isActive = false;
        await user.save();
        e.statusCode = 400;
        throw e;
      } else {
        if (!user.isActive) {
          let e = new Error("Already Blocked");
          e.statusCode = 400;
          throw e;
        } else {
          user.isActive = false;
          await user.save();
          // console.log(user);
          return true;
        }
      }
    }
    // else if (!user?.isActive) {
    //   let e = new Error();
    //   e.message = "This User is already Blocked";
    //   e.statusCode = 400;
    //   throw e;
    // }
    else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  unBlockUser: async (data) => {
    // let user = await UserModel.findOneAndUpdate(
    //   { _id: data, isActive: true, isDeleted: false, isVerified: true },
    //   { $set: { isActive: false } }
    // );
    let user = await UserModel.findOne({
      _id: data,
      // isDeleted: false,
      // isVerified: true,
    });
    // console.log(user);
    if (user) {
      if (user.isDeleted) {
        let e = new Error("User is Deleted");
        user.isActive = false;
        await user.save();
        e.statusCode = 400;
        throw e;
      } else {
        if (!user.isActive) {
          user.isActive = true;
          await user.save();
          return true;
        } else {
          let e = new Error("Already UnBlocked");
          e.statusCode = 400;
          throw e;
        }
      }
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  createUserService: async (data) => {
    // let user = {};
    const uniqueCode = uuid();
    try {
      await sendVerificationEmail({
        name: data.fname,
        email: data.email,
        confirmationCode: uniqueCode,
      });
    } catch (e) {
      throw e;
    }
    let profilePicture = "";
    if (data?.gender) {
      if (String(data.gender).toLowerCase() == "male") {
        profilePicture =
          "http://tourbook-backend.herokuapp.com/images/profile-pictures/default-male.jpg";
      } else if (String(data?.gender).toLocaleLowerCase() == "female") {
        profilePicture =
          "http://tourbook-backend.herokuapp.com/images/profile-pictures/default-female.jpg";
      } else
        profilePicture =
          "http://tourbook-backend.herokuapp.com/images/profile-pictures/default-male.jpg";
    } else {
      profilePicture =
        "http://tourbook-backend.herokuapp.com/images/profile-pictures/default-male.jpg";
    }
    // console.log("EMAIL: " + process.env.MAIL);
    // console.log("PASS: " + process.env.PASS);
    // let userType = await UserTypeService.findById(data.usertype);
    // let userType = await UserType.findOne({ userType: data.role });
    // console.log(userType);
    let role = "";
    let isActive = false;
    let isRating = false;
    if (data.role === "vendor" || data.role === "tourguide") {
      //new Comment
      // var salt = await bcrypt.genSalt(Number(process.env.SALT));
      // var hashed = await bcrypt.hash(data.password, salt);
      // user = await UserModel({
      //   ...data,
      //   password: hashed,
      //   isVerified: false,
      //   isActive: false,
      //   userType: data.role,
      //   isRating: true,
      //   code: uniqueCode,
      // });
      // await user.save();
      //end of new
      // return user;
      isRating = true;
      data.role === "vendor" ? (role = "vendor") : (role = "tourguide");
    }
    if (data.role === "tourist") {
      // var salt = await bcrypt.genSalt(Number(process.env.SALT));
      // var hashed = await bcrypt.hash(data.password, salt);
      // user = await UserModel({
      //   ...data,
      //   password: hashed,
      //   isVerified: false,
      //   isActive: false,
      //   userType: "tourist",
      //   isRating: false,
      //   code: uniqueCode,
      // });
      // await user.save();
      // return tourist;
      isRating = false;
      isActive = true;
      role = "tourist";
    }
    if (data.role == "admin") {
      isActive = true;
      role = "admin";
    }
    var salt = await bcrypt.genSalt(Number(process.env.SALT));
    var hashed = await bcrypt.hash(data.password, salt);
    let user = await UserModel({
      ...data,
      password: hashed,
      profilePicture: profilePicture,
      isVerified: false,
      isActive: isActive,
      userType: role,
      isRating: isRating,
      emailVerificationCode: uniqueCode,
    });
    await user.save();
    let notification = await Notifications({
      userID: user._id,
      text: `Welcome ${user.fname} to TourBook. Stay Safe and spread Love.`,
      contentID: null,
      type:"newuser"
    });
    await notification.save();
    return user;
  },
  createAdmin: async (data) => {
    const uniqueCode = uuid();
    var salt = await bcrypt.genSalt(Number(process.env.SALT));
    var hashed = await bcrypt.hash(data.password, salt);
    let user = await UserModel({
      ...data,
      password: hashed,
      isVerified: true,
      isActive: true,
      userType: "admin",
      isRating: false,
      code: uniqueCode,
    });
    await user.save();
    // return user;
    return user;
  },
  createUser: async (data) => {
    let e = new Error();
    // console.log(data);
    let existing = await UserModel.findOne({
      email: data.email,
      // isDeleted: true,
    });
    if (existing) {
      if (!existing?.isDeleted) {
        if (existing?.isActive && existing?.isVerified) {
          // let e = new Error();
          e.message = `User with email ${data.email} Already Exist`;
          e.statusCode = 400;
          throw e;
        } else if (!existing?.isActive && existing?.isVerified) {
          // let e = new Error();
          e.message =
            "The User is Banned from using TourBook Services. Contact Support";
          e.statusCode = 400;
          throw e;
        } else {
          e.message = "Please Verify Your Account from Email";
          e.statusCode = 400;
          throw e;
        }
      } else {
        try {
          let user = await userService.createUserService(data);
          return user;
        } catch (e) {
          throw e;
        }
      }
    } else {
      let user = await userService.createUserService(data);
      return user;
    }
  },

  loginUser: async (data) => {
    if (data?.password) {
      if (data?.password.length < 8) {
        let e = new Error("Password must be min of 8 characters");
        throw e;
      } else {
        if (data?.email) {
          let existingUser = await UserModel.findOne({
            email: data.email,
            // isActive: true,
            // isVerified: true,
            isDeleted: false,
          });
          if (existingUser) {
            // console.log(existingUser);
            // if (existingUser?.isActive && existingUser?.isVerified) {
            //   let verify = await bcrypt.compare(data.password, existingUser.password);
            //   if (!verify) {
            //     let e = new Error();
            //     e.statusCode = 400;
            //     e.message = "Either the email or Password is Wrong!";
            //     throw e;
            //   } else {
            //     const user = {
            //       id: existingUser._id,
            //       email: existingUser.email,
            //       name: existingUser.fname + " " + existingUser.lname,
            //       role: existingUser.userType,
            //       // isActive: existingUser.isActive,
            //     };
            //     const token = jwt.sign(user, process.env.PRIVATE_KEY);
            //     return {
            //       token: token,
            //       role: existingUser.userType,
            //       name: existingUser.fname + " " + existingUser.lname,
            //       email: existingUser.email,
            //       // isVerified: existingUser.isVerified,
            //       balance: existingUser.balance,
            //     };
            //   }
            // }
            // if (!existingUser?.isActive || !existingUser?.isVerified) {
            if (existingUser?.isVerified) {
              if (!existingUser?.isActive) {
                let e = new Error();
                e.message =
                  "Either You are Blocked from TourBook Or Signup Request is in Pending Status. Please Contact Support";
                e.statusCode = 400;
                throw e;
              }
              if (existingUser?.isActive) {
                if (existingUser?.source == "google") {
                  let e = new Error(
                    "You have signed up with different options like Google."
                  );
                  e.statusCode = 400;
                  throw e;
                } else {
                  console.log("INSIDE PASS", data);
                  let verify = await bcrypt.compare(
                    data.password,
                    existingUser.password
                  );
                  if (!verify) {
                    let e = new Error();
                    e.statusCode = 400;
                    e.message = "Either the email or Password is Wrong!";
                    throw e;
                  } else {
                    const user = {
                      id: existingUser._id,
                      email: existingUser.email,
                      name: existingUser.fname + " " + existingUser.lname,
                      role: existingUser.userType,
                      // isActive: existingUser.isActive,
                    };
                    console.log(user);
                    const token = jwt.sign(user, process.env.PRIVATE_KEY);
                    return {
                      token: token,
                      role: existingUser.userType,
                      name: existingUser.fname + " " + existingUser.lname,
                      email: existingUser.email,
                      profilePicture: existingUser.profilePicture,
                      // isVerified: existingUser.isVerified,
                      balance: existingUser.balance,
                      id: existingUser._id,
                    };
                  }
                }
              }
            }
            if (!existingUser?.isActive && !existingUser?.isVerified) {
              let e = new Error();
              e.message =
                "Either the User is Pending or Blocked Status or Please Verify Email";
              e.statusCode = 400;
              throw e;
            }
            if (existingUser?.isActive && !existingUser?.isVerified) {
              let e = new Error();
              e.message = "Please Verify Email first";
              e.statusCode = 500;
              throw e;
            }
          } else {
            let e = new Error();
            e.message = `User not found against this email`;
            e.statusCode = 404;
            throw e;
          }
        } else {
          let e = new Error("Please Provide Email");
          throw e;
        }
      }
    } else {
      let e = new Error("Please Provide Password");
      throw e;
    }
  },
  verifyUser: async (data) => {
    let user = await UserModel.findOne({
      email: data.email,
      emailVerificationCode: data.code,
      isVerified: false,
    });
    if (!user) {
      let e = new Error("Either The User is Not Found or Already Verified");
      e.statusCode = 404;
      throw e;
    } else {
      if (
        user.userType == "vendor" ||
        user.userType == "tourguide" ||
        user.userType == "admin"
      )
        await user.update({ $set: { isVerified: true } });
      else await user.update({ $set: { isVerified: true, isActive: true } });
      return true;
    }
  },
  deleteUser: async (id) => {
    let user = await UserModel.findById(id).updateOne(
      { _id: id },
      { $set: { isDeleted: true } }
    );
    return true;
  },
  forgotPassword: async (email) => {
    let user = await UserModel.findOne({ email: email, isDeleted: false });
    if (user) {
      if (user.source == "google") {
        let e = new Error(
          "You created your acount using Google Auth. Please Go to Login Page and Login using Google!"
        );

        throw e;
      } else {
        let fullname = user.fname + " " + user.lname;
        let code = Math.floor(Math.random() * 90000 + 10000);

        await sendForgotPassword({
          name: fullname,
          email: user.email,
          confirmationCode: code,
        });
        user.passwordResetCode = code;
        user.passwordResetExpiry = new Date(Date.now() + 3600000);
        console.log("IN FORGOT" + code);
        await user.save();
        return true;
      }
    } else {
      let e = new Error("Not Found");
      e.statusCode = 404;
      throw e;
    }
  },
  verifyOTP: async (data) => {
    let user = await UserModel.findOne({ email: data.email }).select([
      "passwordResetCode",
      "passwordResetExpiry",
    ]);
    if (user) {
      if (Number(user.passwordResetCode) == Number(data.code)) {
        if (user.passwordResetExpiry < Date.now()) {
          let e = new Error("Password Reset Expired. Please try Again!");
          e.statusCode = 400;
          throw e;
        } else {
          user.isVerified = true;
          user.passwordResetCode = null;
          user.passwordResetExpiry = null;
          await user.save();
          return true;
        }
      } else {
        let e = new Error("Code Didnt match");
        e.statusCode = 400;
        throw e;
      }
    }
  },
  updatePassword: async (email, password) => {
    var salt = await bcrypt.genSalt(Number(process.env.SALT));
    var hashed = await bcrypt.hash(password, salt);
    let name = await UserModel.findOne({
      email: email,
      isDeleted: false,
    }).select(["fname", "lname"]);
    let user = await UserModel.findOneAndUpdate(
      {
        email: email,
        isDeleted: false,
      },
      { password: hashed, isVerified: true }
    );
    // let user = await UserModel.findOneAndUpdate({
    //   email: email,
    //   isDeleted: false,
    // }).update({ password: hashed, isVerified: true });
    if (user) {
      sendInfoEmail({
        name: `${name.fname} ${name.lname}`,
        email,
        subject: "TourBook : Password Changed!",
        html: `<div style={{textAlign:"center"}}>Your Password as been changed!</div>`,
      });
      let notification = await Notifications.create({
        text: `Your Password was Updated!`,
        userID: user._id,
        contentID: null,
        type: "security",
      });
      pusher.trigger(`${user._id}`, "notifications", notification);
      return true;
    } else {
      let e = new Error("Cannot Update Password. Something Happend");
      throw e;
    }
  },
  updateProfile: async (data, user) => {
    let existing = await UserModel.findById(user.id).select("email");
    let email = existing.email;
    let isVerified = existing.isVerified;
    // let isPasswordChange = false;
    // var hashed = "";

    if (existing) {
      // if (data?.password) {
      //   var salt = await bcrypt.genSalt(Number(process.env.SALT));
      //   hashed = await bcrypt.hash(data.password, salt);
      //   isPasswordChange = true;
      // } else {
      //   hashed = existing.password;
      // }
      if (data?.email) {
        if (existing.email != data.email) {
          email = data.email;
          isVerified = false;
          let code = uuid();
          await sendVerificationEmail({
            name: existing.fname,
            email: data.email,
            confirmationCode: code,
          });
        } else {
          email = existing.email;
          isVerified = existing.isVerified;
        }
      }
      let updatedProfile = await UserModel.updateOne(
        { _id: user.id },
        {
          $set: {
            // cnic: data.cnic,
            phoneNumber: data?.phoneNumber
              ? data?.phoneNumber
              : existing.phoneNumber,
            // password: hashed,
            fname: data?.fname,
            lname: data?.lname,
            email: email,
            isVerified: isVerified,
            // country: data?.country,
            city: data?.city,
            // gender: String(data.gender).toLowerCase(),
            // address: data.address,
          },
        }
      );
      let notification = await Notifications.create({
        text: `Your Profile Info was Updated!`,
        userID: user.id,
        contentID: null,
        type: "security",
      });
      pusher.trigger(`${user.id}`, "notifications", notification);
      return updatedProfile;
    } else {
      let e = new Error();
      e.message = "Not Found";
      e.statusCode = 404;
      throw e;
    }
  },
  getBalance: async (usertoken) => {
    let user = await UserModel.findById(usertoken.id).select("balance");
    if (user) {
      return { balance: user.balance };
    } else {
      let e = new Error("User Not Found");
      e.statusCode = 404;
      throw e;
    }
  },
  getAll: async (user) => {
    let users = await UserModel.find({ _id: { $ne: user.id } })
      .select("-password")
      .populate("city")
      .sort("-createdAt");
    if (users) return users;
    else {
      let e = new Error("NOT FOUND");
      e.statusCode = 404;
      throw e;
    }
  },
};
module.exports = userService;
