const OrderModel = require("../models/Orders");
const TourModel = require("../models/TourPack");
const UserModel = require("../models/UserModel");
module.exports = {
  getOrders: async () => {
    let existingOrders = await OrderModel.find({});
    if (Object.keys(existingOrders).length > 0) {
      return existingOrders;
    } else {
      let e = new Error();
      e.message = `Orders Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getMyOrders: async (user) => {
    let orders = OrderModel.find({ touristID: user.id });
    if (orders) {
      return orders;
    } else {
      let e = new Error();
      e.message = "No Orders Found";
      e.statusCode = 404;
      throw e;
    }
  },
  getOrderByID: async (id) => {
    let existingOrder = await OrderModel.findById(id);
    if (existingOrder) {
      return existingOrder;
    } else {
      let e = new Error();
      e.message = `Orders Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getRefundRequestsByVendorID: async (user) => {
    // let existingOrder = await OrderModel.find({
    //   $where: () => {
    //     this.tourID.vendorID == user.id && this.requestRefund == true;
    //   },
    // }).populate("tourID");
    let existingOrder = await OrderModel.find({
      "tourID.vendorID": user.id,
      requestRefund: true,
    })
      .populate(["tourID", "userID"])
      .select("-password");
    if (existingOrder) {
      return existingOrder;
    } else {
      let e = new Error();
      e.message = `Orders Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getOrderByVendorID: async (user) => {
    //Asad HELP
    let existingOrder = await OrderModel.find({
      $where: () => {
        this.tourID.vendorID == user.id;
      },
    }).populate("tourID");
    if (existingOrder) {
      return existingOrder;
    } else {
      let e = new Error();
      e.message = `Orders Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getOrdersByAmount: async (amount) => {
    let existingOrder = await OrderModel.find({ amount: amount });
    if (Object.keys(existingOrder).length > 0) {
      return existingOrder;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getOrdersByApporval: async (data) => {
    let orders = await OrderModel.find({ isApproved: data.approved });
    if (Object.keys(orders).length > 0) {
      return orders;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getOrdersByApporvalByTouristID: async (data) => {
    let orders = await OrderModel.find({
      isApproved: data.approved,
      touristID: data.touristID,
    });
    if (Object.keys(orders).length > 0) {
      return orders;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getRefundedOrders: async () => {
    let orders = await OrderModel.find({ isRefunded: true });
    if (Object.keys(orders).length > 0) {
      return orders;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getRefundedOrdersByTourID: async (id) => {
    let orders = await OrderModel.find({ tourID: id, isRefunded: true });
    if (Object.keys(orders).length > 0) {
      return orders;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getRefundedOrdersByTouristID: async (id) => {
    let orders = await OrderModel.find({ touristID: id, isRefunded: true });
    if (Object.keys(orders).length > 0) {
      return orders;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  createOrder: async (data, user) => {
    // console.log(user);
    if (!data?.touristID && !user) {
      let e = new Error(
        "TouristID not found in body or the user is not logged in"
      );
      e.statusCode = 400;
      throw e;
    }
    // console.log(user.id);
    let existinguser = await UserModel.findById(user.id).select("balance");
    if (existinguser.balance >= data.amount) {
      let existingOrder = await OrderModel.findOne({
        tourID: data?.tourID,
        seats: data?.seats,
        promo: data?.promo,
        amount: data?.amount,
        // touristID: data.touristID,
        touristID: user?.id,
      });
      if (!existingOrder) {
        let tour = await TourModel.findById(data.tourID);
        if (tour?.seats >= data.seats) {
          tour.seats = tour.seats - data.seats;
          await tour.save();
          let newOrder = await OrderModel({
            tourID: data.tourID,
            seats: data.seats,
            promo: data?.promo,
            amount: data.amount,
            // amount: Number(data.seats) * Number(tour.amount),
            // touristID: data.touristID,
            touristID: user.id,
          });
          existinguser.balance =
            Number(existinguser.balance) - Number(newOrder.amount);
          await existinguser.save();
          await newOrder.save();
          return { order: newOrder, balance: existinguser.balance };
        } else {
          let e = new Error("Not Enough Seats Left");
          e.statusCode = 400;
          throw e;
        }
      } else {
        let e = new Error();
        e.message = `Already Exists`;
        e.statusCode = 400;
        throw e;
      }
    } else {
      let e = new Error("Not Enough Credits to Reserve Tour");
      e.statusCode = 400;
      throw e;
    }
  },
  rejectTour: async (data) => {
    let existingOrder = await OrderModel.findOneAndUpdate(
      { _id: data.id },
      { $set: { isApproved: false } }
    );
    if (existingOrder) {
      return await module.exports.refundOrder(data.id);
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  approveTour: async (data) => {
    let existingOrder = await OrderModel.findOneAndUpdate(
      { _id: data.id },
      { $set: { isApproved: true } }
    );
    if (existingOrder) {
      return true;
    } else {
      let e = new Error();
      e.message = `NOT FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getOrdersByTouristID: async (data) => {
    let orders = await OrderModel.find({ touristID: data });
    if (Object.keys(orders) > 0) {
      return orders;
    } else {
      let e = new Error();
      e.message = `No Tours Found for Tourist ${data}`;
      e.statusCode = 404;
      throw e;
    }
  },
  rejectRefundRequest: async (data) => {
    let approval = await OrderModel.find({ _id: data.id, requestRefund: true });
    let tour = await TourModel.findById(order.tourID);
    if (Date.now() > tour.validTill) {
      let e = new Error();
      e.message = "Cannot Refund Order as it has Already Been Past the Date";
      e.statusCode = 404;
      approval.requestRefund = false;
      await approval.save();
      throw e;
    } else {
      approval.requestRefund = false;
      await approval.save();
      return true;
    }
  },
  refundOrder: async (data) => {
    let existingOrder = await OrderModel.findOne({
      _id: data.id,
      isRefunded: false,
      requestRefund: true,
    });
    // console.log(existingOrder);
    if (existingOrder) {
      let userToRefund = await UserModel.findById(existingOrder.touristID);
      // let refundamount =
      //   Number(userToRefund.balance) + Number(existingOrder.amount);
      // console.log(refundamount, "Balance " + userToRefund.balance);
      await UserModel.updateOne(
        { _id: existingOrder.touristID },
        {
          $set: {
            balance:
              Number(userToRefund.balance) + Number(existingOrder.amount),
          },
        }

        // { $set: { balance: userToRefund.balance + order.refundAmount } }
      );
      let refunded = await OrderModel.updateOne(
        { _id: data.id },
        {
          $set: {
            isRefunded: true,
            refundAmount: Number(existingOrder.amount),
          },
        }
      );
      let tour = await TourModel.findById(existingOrder.tourID);
      tour.seats = tour.seats + existingOrder.seats;
      await tour.save();
      userToRefund = await UserModel.findById(existingOrder.touristID);
      return { data: true, balance: userToRefund.balance };
    } else {
      let e = new Error();
      e.message = `Either the Order was already Refunded or Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getOrdersByTourID: async (id) => {
    const orders = await OrderModel.find({ tourID: id });
    if (orders) {
      return orders;
    } else {
      let e = new Error();
      e.message = "not FOund";
      e.statusCode = 404;
      throw e;
    }
  },
  requestRefund: async (body) => {
    let order = await OrderModel.findOneAndUpdate(
      { _id: body.orderID },
      { $set: { requestRefund: true } }
    );
    if (order) return true;
    else {
      let e = new Error("Not Found");
      e.statusCode = 404;
      throw e;
    }
  },
  getPendingReservationRequests: async (user) => {
    // let requests = await OrderModel.find({
    //   $where: () => {
    //     this.tourID.vendorID == user.id && this.isApproved == false;
    //   },
    // }).populate("tourID");
    // let requests = await OrderModel.find({'tour.vendorID:user.id})
    let requests = await OrderModel.find({
      "tourID.vendorID": user.id,
      isApproved: false,
    })
      .populate(["tourID", "userID"])
      .select("-password");
    if (requests) return requests;
    else {
      let e = new Error("Not Found");
      e.statusCode = 404;
      throw e;
    }
  },
};
