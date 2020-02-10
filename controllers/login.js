const passport = require("../libs/passport");

module.exports = async function login(ctx, next) {
  await passport.authenticate("local", async (err, user, info) => {
    if (err) throw err;
    if (!user) {
      ctx.status = 400;
      ctx.body = { error: info };
      return;
    }

    const token = await ctx.login(user);
    const userInfo = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      balance: user.balance,
      portfolio: user.portfolio,
      watchlist: user.watchlist,
      transactions: user.transactions,
      token: token
    };

    ctx.body = { userInfo };
  })(ctx, next);
};
