const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

module.exports = async function getUser(ctx, next) {
  let user = ctx.user;
  if (!user) {
    ctx.status = 400;
    ctx.body = { error: "User not found" };
    return;
  }
  let portfolio = await Portfolio.findOne({ user: user._id });

  const userInfo = {
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    balance: portfolio ? portfolio.balance : 50000,
    holdings: portfolio ? portfolio.holdings : [],
    watchlist: portfolio ? portfolio.watchlist : [],
    transactions: portfolio ? portfolio.transactions : []
  };
  ctx.body = { userInfo };
  next();
};
