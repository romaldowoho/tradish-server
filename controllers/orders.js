const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

getPortfolioInfo = function(portfolio) {
  const portfolioInfo = {
    balance: portfolio.balance,
    holdings: portfolio.holdings,
    watchlist: portfolio.watchlist,
    transactions: portfolio.transactions
  };
  return portfolioInfo;
};
module.exports.buy = async function(ctx, next) {
  let portfolio =
    (await Portfolio.findOne({ user: ctx.user._id })) ||
    new Portfolio({ user: ctx.user._id });
  let newStock = {
    symbol: ctx.request.body.symbol,
    quantity: parseInt(ctx.request.body.quantity)
  };

  //check if already owns shares and update portfolio
  if (ctx.request.body.doesOwn) {
    for (let i = 0; i < portfolio.holdings.length; i++) {
      if (portfolio.holdings[i].symbol == newStock.symbol) {
        portfolio.holdings[i].quantity += newStock.quantity;
        portfolio.markModified("holdings");
        break;
      }
    }
  } else {
    portfolio.holdings.push(newStock);
  }

  // remove from watchlist
  let index = portfolio.watchlist.indexOf(newStock.symbol);
  if (index !== -1) {
    portfolio.watchlist.splice(index, 1);
  }

  //update balance
  console.log("total cost: ", ctx.request.body.totalCost);
  portfolio.balance -= parseFloat(ctx.request.body.totalCost);

  //add transaction
  let transaction = {
    date: new Date(),
    type: "buy",
    symbol: newStock.symbol,
    quantity: newStock.quantity,
    shareCost: (ctx.request.body.totalCost / newStock.quantity).toFixed(2),
    totalCost: ctx.request.body.totalCost,
    currBalance: portfolio.balance
  };
  portfolio.transactions.push(transaction);

  // save
  await portfolio.save();

  const portfolioInfo = getPortfolioInfo(portfolio);
  ctx.body = { portfolioInfo };
};

module.exports.sell = async function(ctx, next) {
  let portfolio = await Portfolio.findOne({ user: ctx.user._id });
  let symbol = ctx.request.body.symbol;
  let quantity = parseInt(ctx.request.body.quantity);

  // find and update portfolio
  for (let i = 0; i < portfolio.holdings.length; i++) {
    if (portfolio.holdings[i].symbol == symbol) {
      if (portfolio.holdings[i].quantity == quantity) {
        portfolio.holdings.splice(i, 1);
        break;
      } else {
        portfolio.holdings[i].quantity -= quantity;
        portfolio.markModified("holdings");
        break;
      }
    }
  }
  // update balance
  portfolio.balance += parseFloat(ctx.request.body.totalCost);

  //add transaction
  let transaction = {
    date: new Date(),
    type: "sell",
    symbol: symbol,
    quantity: quantity,
    shareCost: (ctx.request.body.totalCost / quantity).toFixed(2),
    totalCost: ctx.request.body.totalCost,
    currBalance: portfolio.balance
  };
  portfolio.transactions.push(transaction);

  // save
  await portfolio.save();

  const portfolioInfo = getPortfolioInfo(portfolio);
  ctx.body = { portfolioInfo };
};
