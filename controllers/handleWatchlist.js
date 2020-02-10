const Portfolio = require("../models/Portfolio");

module.exports.handleWatchlist = async function(ctx, next) {
  let portfolio = await Portfolio.findOne({ user: ctx.user._id });
  if (!portfolio) {
    portfolio = new Portfolio({ user: ctx.user._id });
  }
  console.log(portfolio);
  let symbol = ctx.request.body.symbol;
  let action = ctx.request.body.action;
  if (action && action === "add") {
    portfolio.watchlist.push(symbol);
  } else if (action && action == "remove") {
    for (let i = 0; i < portfolio.watchlist.length; i++) {
      if (portfolio.watchlist[i] === symbol) {
        portfolio.watchlist.splice(i, 1);
        break;
      }
    }
  }
  await portfolio.save();

  const portfolioInfo = {
    balance: portfolio.balance,
    holdings: portfolio.holdings,
    watchlist: portfolio.watchlist,
    transactions: portfolio.transactions
  };

  ctx.body = { portfolioInfo };
};
