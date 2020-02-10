//import Portfolio from "../models/Portfolio";
const Portfolio = require("../models/Portfolio");
const moment = require("moment");
const axios = require("axios");
const config = require("../config");

const getHoldingsAndBalanceOnDate = function(date, transactions) {
  let portf = {};
  let balance;
  for (let i = 0; i < transactions.length; i++) {
    let trans = transactions[i];
    let curDate = new Date(trans.date);
    if (date.getTime() >= curDate.getTime()) {
      if (trans.type == "buy") {
        if (trans.symbol in portf) {
          portf[trans.symbol] += trans.quantity;
        } else {
          portf[trans.symbol] = trans.quantity;
        }
      } else {
        portf[trans.symbol] -= trans.quantity;
        if (portf[trans.symbol] == 0) {
          delete portf[trans.symbol];
        }
      }
      balance = trans.currBalance;
    } else break;
  }
  return { portf, balance };
};

const getDates = function(period) {
  let dates = [];
  let curDate = moment();
  let startDate;
  switch (period) {
    case "1M":
      startDate = moment(curDate).subtract(30, "days");
      while (startDate < curDate) {
        if (startDate.day() > 0 && startDate.day() < 6) {
          dates.push(moment(startDate).format("YYYY-MM-DD"));
        }
        startDate = moment(startDate).add(1, "days");
      }
      break;
    case "1Y":
      startDate = moment(curDate).subtract(365, "days");
      while (startDate < curDate) {
        if (startDate.day() > 0 && startDate.day() < 6) {
          dates.push(moment(startDate).format("YYYY-MM-DD"));
        }
        startDate = moment(startDate).add(6, "days");
      }
      break;
    case "5Y":
      startDate = moment(curDate).subtract(1825, "days");
      while (startDate < curDate) {
        if (startDate.day() > 0 && startDate.day() < 6) {
          dates.push(moment(startDate).format("YYYY-MM-DD"));
        }
        startDate = moment(startDate).add(15, "days");
      }
      break;
  }
  return dates;
};

const getPriceOnDate = function(histObj, date) {
  let idx = histObj.dates.indexOf(date);
  console.log(idx);
  if (histObj.prices[idx]) return histObj.prices[idx];

  //if the price at the date is null, get the average of the prev and next available prices

  let prevDateIdx = histObj.dates.indexOf(moment(date).subtract(1, "days"));
  let nextDateIdx = histObj.dates.indexOf(moment(date).add(1, "days"));
  let prevPrice;
  let nextPrice;
  while (prevDateIdx > -1) {
    if (histObj.prices[prevDateIdx]) {
      prevPrice = histObj.prices[prevDateIdx];
      break;
    }
    prevDateIdx--;
  }
  while (nextDateIdx < histObj.dates.length) {
    if (histObj.prices[nextDateIdx]) {
      nextPrice = histObj.prices[nextDateIdx];
      break;
    }
    nextDateIdx++;
  }
  //   console.log("Prev and Next", prevPrice, nextPrice);
  return +((prevPrice + nextPrice) / 2).toFixed(2);
};

const getHistoricalPrices = async function(symbol) {
  let prices = [];
  let dates = [];
  await axios
    .get(
      `https://sandbox.iexapis.com/stable/stock/${symbol}/chart/5y?token=${config.IEX.sandbox_token}`
    )
    .then(res => {
      for (let i = 0; i < res.data.length; i++) {
        dates.push(moment(res.data[i]["date"]).format("YYYY-MM-DD"));
        prices.push(res.data[i]["close"].toFixed(2));
      }
    })
    .catch(err => {
      console.log(err);
      return;
    });
  let toReturn = {
    prices,
    dates
  };
  return toReturn;
};

module.exports.getHistory = async function(ctx, next) {
  let portfolio = await Portfolio.findOne({ user: ctx.user });
  let history = {
    month_data: {
      dates: [],
      values: []
    },
    year_data: {
      dates: [],
      values: []
    },
    five_year_data: {
      dates: [],
      values: []
    }
  };
  // histPrices will contain prices and dates of a stock for the past 5 years
  let histPrices = {};
  const dates_5y = getDates("5Y");
  const dates_1y = getDates("1Y");
  console.log("1Y", dates_1y);
  const dates_1m = getDates("1M");
  let valueOnDate = 0;

  for (let i = 0; i < dates_5y.length; i++) {
    let date = new Date(dates_5y[i]);
    let portfAndBalance = getHoldingsAndBalanceOnDate(
      date,
      portfolio.transactions
    );
    let portfOnDate = portfAndBalance.portf;
    let balance = portfAndBalance.balance;
    if (Object.keys(portfOnDate).length) {
      for (let stock in portfOnDate) {
        if (!(stock in histPrices)) {
          histPrices[stock] = await getHistoricalPrices(stock);
        }
        let price = getPriceOnDate(histPrices[stock], dates_5y[i]);
        valueOnDate += price * parseInt(portfOnDate[stock]);
      }
    }
    history.five_year_data.dates.push(dates_5y[i]);
    history.five_year_data.values.push(
      +(balance + valueOnDate).toFixed(2) || 50000
    );
    valueOnDate = 0;
  }

  for (let i = 0; i < dates_1y.length; i++) {
    let date = new Date(dates_1y[i]);
    let portfAndBalance = getHoldingsAndBalanceOnDate(
      date,
      portfolio.transactions
    );
    let portfOnDate = portfAndBalance.portf;
    let balance = portfAndBalance.balance;
    if (Object.keys(portfOnDate).length) {
      for (let stock in portfOnDate) {
        if (!(stock in histPrices)) {
          histPrices[stock] = await getHistoricalPrices(stock);
        }
        let price = getPriceOnDate(histPrices[stock], dates_1y[i]);
        valueOnDate += price * parseInt(portfOnDate[stock]);
      }
    }
    history.year_data.dates.push(dates_1y[i]);
    history.year_data.values.push(+(balance + valueOnDate).toFixed(2) || 50000);
    valueOnDate = 0;
  }

  for (let i = 0; i < dates_1m.length; i++) {
    let date = new Date(dates_1m[i]);
    let portfAndBalance = getHoldingsAndBalanceOnDate(
      date,
      portfolio.transactions
    );
    let portfOnDate = portfAndBalance.portf;
    let balance = portfAndBalance.balance;
    if (Object.keys(portfOnDate).length) {
      for (let stock in portfOnDate) {
        if (!(stock in histPrices)) {
          histPrices[stock] = await getHistoricalPrices(stock);
        }
        let price = getPriceOnDate(histPrices[stock], dates_1m[i]);
        valueOnDate += price * parseInt(portfOnDate[stock]);
      }
    }
    history.month_data.dates.push(dates_1m[i]);
    history.month_data.values.push(
      +(balance + valueOnDate).toFixed(2) || 50000
    );
    valueOnDate = 0;
  }
  //   console.log(history);
  ctx.body = { history };
};

module.exports.getTransactions = async function(ctx, next) {
  let portfolio = await Portfolio.findOne({ user: ctx.user });
  let transactions = portfolio.transactions;
  if (transactions) {
    ctx.body = { transactions };
  }
};
