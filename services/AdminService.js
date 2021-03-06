const UserModel = require("../models/UserModel");
const OrderService = require("../services/OrderService");
const UserService = require("../services/UserService");
const TransactionModel = require("../models/Transactions.model");
const TourPack = require("../models/TourPack");
const OrderModel = require("../models/Orders");
const pusher = require("../helpers/pusher");
module.exports = {
  getVendors: async () => {
    let e = new Error();
    const vendors = await UserService.getVendors();
    if (vendors) {
      return vendors;
    } else {
      e.message = "No Vendors Found";
      e.statusCode = 404;
      throw e;
    }
  },
  getVendorswithRating: async (rating) => {
    let vendors = await UserService.getVendors();
    // let vendors=await UserService.getVendorsByRating(rating);
    if (vendors) {
      let filtered = vendors.filter((item) => {
        return item.rating >= rating;
      });
      return filtered;
    } else {
      let e = new Error();
      e.message = `Vendors with rating ${rating} not found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getanyUser: async (id) => {
    let e = new Error();
    let user = await UserService.getUserByID(id);
    if (user) {
      return user;
    } else {
      e.message = "User Not Found";
      e.statusCode = 404;
      throw e;
    }
  },
  acceptVendorRequest: async (id) => {
    let e = new Error();
    const vendor = await UserModel.findOne({ _id: id, isDeleted: false });
    if (vendor) {
      if (!vendor.isActive) {
        // await UserModel.updateOne({ _id: id }, { isActive: true });
        vendor.isActive = true;
        await vendor.save();
        return true;
      } else {
        e.message = "Vendor Already Active";
        e.statusCode = 400;
        throw e;
      }
    } else {
      // let e = new Error();
      e.message = "Vendor not found";
      e.statusCode = 404;
      throw e;
    }
  },
  rejectVendorRequest: async (id) => {
    let e = new Error();
    const vendor = await UserModel.findOne({ _id: id, isDeleted: false });

    if (vendor) {
      // await UserModel.updateOne({ _id: id }, { isActive: true });

      await vendor.remove();
      return true;
    } else {
      e.message = "Vendor Already Deleted or Rejected";
      e.statusCode = 404;
      throw e;
    }
    //  else {
    //     // let e = new Error();
    //     e.message = "Vendor not found";
    //     e.statusCode = 404;
    //     throw e;
    //   }
  },
  acceptAllPendingRequests: async () => {
    let requests = await module.exports.getpendingVendorsRequests();
    requests.forEach(async (request) => {
      await UserModel.updateOne({ _id: request._id }, { isActive: true });
    });
    return true;
  },
  pendingAdminRequests: async () => {
    let admins = await UserService.getPendingAdmins();
    if (admins) {
      return admins;
    } else {
      let e = new Error("Not Found");
      e.statusCode = 404;
      throw e;
    }
  },
  getpendingVendorsRequests: async () => {
    // console.log("INside pending vendor req")
    let vendors = await UserService.getPendingVendors();
    if (vendors) {
      // let filtered = vendors.filter((user) => {
      //   return user.isActive == false;
      // });
      return vendors;
    } else {
      let e = new Error();
      e.message = "No Vendors Found";
      e.statusCode = 404;
      throw e;
    }
  },
  blockUser: async (userID) => {
    try {
      let user = UserService.blockUser(userID);
      let e = new Error();

      // if (user) {
      //   if (user.isActive) {
      //     user.isActive = false;
      //     await user.save();
      //   }
      //   if (!user.isActive) {
      //     e.message = "Already Blocked";
      //     e.statusCode = 400;
      //     throw e;
      //   }
      // } else {
      //   e.message = "Not Found";
      //   e.statusCode = 404;
      //   throw e;
      // }
      if (user) {
        return true;
      } else throw e;
    } catch (e) {
      throw e;
    }
  },
  unBlockUser: async (userID) => {
    try {
      let user = UserService.unBlockUser(userID);
      let e = new Error();

      // if (user) {
      //   if (user.isActive) {
      //     user.isActive = false;
      //     await user.save();
      //   }
      //   if (!user.isActive) {
      //     e.message = "Already Blocked";
      //     e.statusCode = 400;
      //     throw e;
      //   }
      // } else {
      //   e.message = "Not Found";
      //   e.statusCode = 404;
      //   throw e;
      // }
      if (user) {
        return true;
      } else throw e;
    } catch (e) {
      throw e;
    }
  },
  createAdmins: async (data) => {
    let user = await UserModel.findOne({ email: data.email });
    console.log(user);
    let e = new Error();
    if (user) {
      if (user.userType == "admin") {
        e.message = "Already Admin";
        e.statusCode = 400;
        throw e;
      } else {
        // user.userType = "admin";
        // await user.save();
        await UserModel.updateOne({ email: data.email }, { userType: "admin" });
        return true;
      }
    } else {
      let newUser = await UserService.createAdmin(data);
      // let newUser = await UserModel({
      //   data,
      //   userType: "admin",
      // });
      // await newUser.save();
      if (user) return true;
      else return false;
    }
  },
  getDashboard: async (user) => {
    // let dashboard = {};
    // if (req.user) {
    //   const pendingRequests = await module.exports.getpendingVendorsRequests();
    //   dashboard.pendingVendors = pendingRequests;
    //   const refundrequests = await module.exports.refundPackageByID();
    //   dashboard.refundRequests = refundrequests;
    //   return dashboard;
    // }
    let dashboard = {};
    let pendingVendorRequests =
      await module.exports.getpendingVendorsRequests();
    let pendingAdminRequests = await UserService.getPendingAdmins();
    let totalNoOfUsers = await UserModel.find({ isDeleted: false }).count();
    let totalNoOfActiveUsers = await UserModel.find({
      isActive: true,
      isDeleted: false,
    }).count();
    let totalNoOfDeletedUsers = await UserModel.find({
      isDeleted: true,
    }).count();
    let allUsers = await UserService.getAll(user);
    let activeUsers = await UserModel.find({ isActive: true })
      .populate("city")
      .select("-password");

    let credits = await TransactionModel.find({ refunded: false });
    let totalCredits = 0;
    credits.forEach((credit) => {
      totalCredits += credit.RechargedAmount;
    });
    let totalTours = await TourPack.find({}).count();
    let totalOngoingTours = await OrderModel.find({
      isApproved: true,
      isRefunded: false,
    }).count();
    dashboard.totalNoOfUsers = totalNoOfUsers;
    dashboard.pendingAdminRequests = pendingAdminRequests;
    dashboard.pendingVendorRequests = pendingVendorRequests;
    dashboard.totalNoOfActiveUsers = totalNoOfActiveUsers;
    dashboard.totalNoOfDeletedUsers = totalNoOfDeletedUsers;
    dashboard.allUsers = allUsers;
    dashboard.totalNoOfTours = totalTours;
    dashboard.totalOngoingTours = totalOngoingTours;
    dashboard.totalCredits = totalCredits;
    dashboard.activeUsers = activeUsers;
    return dashboard;
  },
  deleteUser: async (id) => {
    let existingUser = await UserService.getUserByID(id);
    let e = new Error();
    if (existingUser) {
      if (!existingUser.isDeleted) {
        await UserModel.updateOne(
          { _id: id },
          { isActive: false, isDeleted: true }
        );
        // existingUser.isActive = false;
        // await existingUser.save();
        return true;
      }
      if (existingUser.isDeleted) {
        e.message = "AlreadyDeleted";
        e.statusCode = 400;
        throw e;
      }
    } else {
      e.message = "Not Found";
      e.statusCode = 404;
      throw e;
    }
  },
  refundPackageByID: async (id) => {
    let package = await OrderService.refundOrder(id);
    pusher.trigger(`${order.touristID}`, "notifications", {
      date: Date.now(),
      text: `Your order of RS ${order.amount} has been refunded by TourBook.`,
    });
    if (package) return true;
    else {
      let e = new Error("Not Found");
      e.statusCode = 404;
      throw e;
    }
  },
  refundallTouristbyPackageID: async (id) => {
    let orders = await OrderService.getOrdersByTourID(id);
    orders.forEach((order) => {
      if (!order.isrefunded) this.refundPackageByID(order._id);
    });
    return true;
  },
};
