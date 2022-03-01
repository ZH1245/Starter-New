const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const multer = require("multer");
require("dotenv").config();
const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "public/Images/profile-pictures");
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const existingUser = await UserModel.findOne({ email: email });
      if (existingUser) {
        const valid = await bcrypt.compare(password, existingUser.password);
        if (valid) {
          const user = {
            id: existingUser._id,
            email: existingUser.email,
            fname: existingUser.fname,
            role: existingUser.userType,
          };
          const token = await jwt.sign(user, process.env.PRIVATE_KEY);
          return res
            .status(200)
            .send({ message: "User Found! Token is Returned", data: token });
        } else
          return res
            .status(400)
            .send({ message: "Incorrect Password", data: null });
      } else {
        return res.status(404).send({
          message:
            "User not found Please Enter Correct Credientials or Signup!",
          data: null,
        });
      }
    } catch (e) {
      return res.status(400).send({ message: e.message, data: null });
    }
  },
  signup: async (req, res) => {
    try {
      const existingUser = await UserModel.findOne({
        email: req.body.email,
      });
      if (existingUser) {
        if (existingUser.userType == req.body.userType) {
          throw Error(
            `User with email ${req.body.email} Already exists. Please Proceed to Login!`
          );
        } else {
          let ratingEnable = false;
          let isActive = false;

          if (req.body.userType == "tourist" || req.body.userType == "admin") {
            ratingEnable = false;
            isActive = true;
          } else {
            ratingEnable = true;
            isActive = false;
          }
          const salt = await bcrypt.genSalt(Number(process.env.SALT));
          const hash = await bcrypt.hash(req.body.password, salt);
          const newUser = await UserModel({
            ...req.body,
            password: hash,
            isRating: ratingEnable,
            isActive: isActive,
          });
          await newUser.save();
          const user = {
            email: newUser.email,
            id: newUser._id,
            fname: newUser.fname,
            role: newUser.userType,
          };
          return res.status(200).send(user);
        }
      } else {
        let ratingEnable = false;
        let isActive = false;

        if (req.body.userType == "tourist" || req.body.userType == "admin") {
          isActive = true;
          ratingEnable = false;
        } else {
          isActive = false;
          ratingEnable = true;
        }
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hash = await bcrypt.hash(req.body.password, salt);
        const newUser = await UserModel({
          ...req.body,
          password: hash,
          isRating: ratingEnable,
          isActive: isActive,
        });
        await newUser.save();
        const user = {
          email: newUser.email,
          tourist,
          id: newUser._id,
          fname: newUser.fname,
          role: newUser.userType,
        };
        return res.status(200).send(user);
      }
    } catch (e) {
      return res.status(400).send({ message: e.message, data: null });
    }
  },
  getUser: async (req, res) => {
    try {
      //   console.log(req.query);
      let query = {};
      if (req.query?.email) {
        query.email = req.query?.email;
      }
      if (req.query?.id) {
        query._id = req.query?.id;
      }
      if (req.query?.role) {
        query.userType = req.query?.role;
      }
      if (req.query?.phone) {
        query.phoneNumber = req.query?.phone;
      }
      if (req.query?.rating) {
        query.rating = req.query?.rating;
      }

      if (req.query?.city) {
        query.city = req.query?.city;
      }
      console.log(query);
      if (Object.keys(query).length > 0) {
        const existingUsers = await UserModel.find(query).select([
          "-password",
          "-country",
          "-isVerified",
          "-phoneNumber",

          "-lname",
        ]);
        if (existingUsers.length > 0) {
          //   const users = existingUsers.map((a) => {
          //     let user = ({ _id, email, fname, city, userType } = a);
          //     return user;
          //   });
          //   console.log(users);
          return res
            .status(200)
            .send({ message: "Fetched", data: existingUsers });
        } else {
          res.status(404).send("NOT FOUND");
        }
      } else {
        throw Error("ADD QUERY PARAMS");
      }
    } catch (e) {
      res.status(400).send(e.message);
    }
  },
  editProfile: async (req, res) => {
    try {
      const existingUser = await UserModel.findById(req.body.id);
      if (existingUser.email == req.body.email) {
        const salt = await bcrypt.genSalt(Number(process.env.SALT));

        let newpassword = req.body.password;
        let newphone = req.body.phoneNumber;
        let isVerified = false;
        const valid = await bcrypt.compare(newpassword, existingUser.password);
        if (newphone != existingUser.phoneNumber) {
          isVerified = false;
        } else isVerified = true;
        if (!valid) {
          const hash = await bcrypt.hash(req.body.password, salt);
          newpassword = hash;
        }
        const newDetails = await UserModel.findOneAndUpdate(
          { _id: req.body.id },
          {
            $set: {
              fname: req.body.fname,
              lname: req.body.lname,
              city: req.body.city,
              password: newpassword,
              country: req.body.country,
              profilePicrure: req.file.filename,
              address: req.body.address,
              phoneNumber: phone,
              isVerified: isVerified,
            },
          }
        );
        await newDetails.save();
      }
      //   const newDetails = await UserModel.findOneAndUpdate(
      //     { _id: req.body.id },
      //     {
      //       $set: {
      //         fname: req.body.fname,
      //         lname: req.body.lname,
      //         email: req.body.email,

      //         profilePicrure: req.file.filename,
      //       },
      //     }
      //   );
      //   await newDetails.save();
      return res.status(200).send({
        message: "Updated new Details",
        data: {
          userid: newDetails._id,
          email: newDetails.email,
          role: newDetails.userType,
          fname: newDetails.fname,
        },
      });
    } catch (e) {
      res.status(400).send(e.message);
    }
  },
};
