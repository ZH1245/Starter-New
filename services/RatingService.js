const RatingModel = require("../models/Rating");

module.exports = {
  getRatingsByID: async (id) => {
    let rating = await RatingModel.findById(id);
    if (rating) {
      return rating;
    } else {
      let e = new Error();
      e.message = `Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getAllRatings: async () => {
    let ratings = RatingModel.find({});
    if (Object.keys(ratings).length > 0) {
      return ratings;
    } else {
      let e = new Error();
      e.message = `Ratings Not FOUND`;
      e.statusCode = 404;
      throw e;
    }
  },
  getRatingsByTourID: async (data) => {
    let tourRating = await RatingModel.find({ tourID: data.tourID });
    if (Object.keys(tourRating) > 0) {
      return tourRating;
    } else {
      let e = new Error();
      e.message = `No Ratings Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getRatingsByTouristID: async (data) => {
    let touristRatings = await RatingModel.find({ touristID: data.touristID });
    if (Object.keys(touristRatings) > 0) {
      return touristRatings;
    } else {
      let e = new Error();
      e.message = `No Ratings Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  getRatingsByValue: async (data) => {
    let comments = await RatingModel.find({ rating: data.ratings });
    if (Object.keys(comments) > 0) {
      return comments;
    } else {
      let e = new Error();
      e.message = `No Ratings Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  addRatings: async (data) => {
    let existingRating = await RatingModel.findOne({
      touristID: data.touristID,
      tourID: data.touID,
    });
    if (existingRating) {
      return existingRating;
    } else {
      let e = new Error();
      e.message = `Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  editRatings: async (data) => {
    let existingRating = await this.getRatingsByID(data.id);
    if (existingRating) {
      let newDetails = await RatingModel.findOneAndReplace(
        { _id: existingRating._id },
        {
          touristID: data.touristID,
          tourID: data.tourID,
          rating: data.rating,
          message: data.message,
        }
      );
      return newDetails;
    } else {
      let e = new Error();
      e.message = `Not Found`;
      e.statusCode = 404;
      throw e;
    }
  },
  deleteRatings: async (data) => {
    let existingRating = await RatingModel.findOneAndDelete({ _id: data.id });
    if (existingRating) {
      return existingRating;
    } else {
      let e = new Error();
      e.message = `Ratings not Found To be Deleted`;
      e.statusCode = 404;
      throw e;
    }
  },
};