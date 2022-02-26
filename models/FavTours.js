const mongoose = require("mongoose");

const Schema = mongoose.Schema({
  touristID: { type: mongoose.Schema.Types.ObjectId, required: true },
  tours: { type: Array(mongoose.Schema.Types.ObjectId), default: [] },
});

module.exports = mongoose.model("FavTours", Schema);
