const mongoose = require("mongoose");
const connection = require("../libs/connection");

const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    balance: {
      type: Number,
      default: 50000
    },
    holdings: {
      type: Array
    },
    watchlist: {
      type: Array
    },
    transactions: {
      type: Array
    }
  },
  {
    timestamps: true
  }
);

module.exports = connection.model("Portfolio", schema);
