const Koa = require("koa");
const Router = require("koa-router");
const uuid = require("uuid/v4");
const cors = require("@koa/cors");
const serve = require("koa-static");
const Session = require("./models/Session");
const registration = require("./controllers/register");
const login = require("./controllers/login");
const logout = require("./controllers/logout");
const getUser = require("./controllers/getUser");
const orders = require("./controllers/orders");
const portfolio = require("./controllers/portfolio");
const { handleWatchlist } = require("./controllers/handleWatchlist");
const mustBeAuthenticated = require("./libs/mustBeAuthenticated");
const handleMongooseValidationError = require("./libs/validationErrors");

const app = new Koa();

app.use(cors());
// app.use(serve("../../dist"));
app.use(require("koa-bodyparser")());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err.status) {
      ctx.status = err.status;
      ctx.body = { error: err.message };
    } else {
      console.error(err);
      ctx.status = 500;
      ctx.body = { error: "Internal server error" };
    }
  }
});

app.use((ctx, next) => {
  ctx.login = async function login(user) {
    const token = uuid();
    await Session.create({ token, user, lastVisit: new Date() });

    return token;
  };

  ctx.logout = async function logout(token) {
    await Session.deleteOne({ token }, err => {
      console.log(err);
    });
  };

  return next();
});

const router = new Router({ prefix: "/api" });

router.use(async (ctx, next) => {
  const header =
    ctx.request.method === "GET"
      ? ctx.request.get("Authorization")
      : ctx.request.body.Authorization;
  if (!header) return next();

  const token = header.split(" ")[1];
  if (!token) return next();

  const session = await Session.findOne({ token }).populate("user");
  if (!session) {
    ctx.throw(401, "Invalid Authenticaion Token");
  }
  session.lastVisit = new Date();
  await session.save();

  ctx.user = session.user;

  return next();
});

router.post("/login", handleMongooseValidationError, login);
router.post("/logout", handleMongooseValidationError, logout);
router.post("/register", handleMongooseValidationError, registration.register);
router.get("/confirm*", registration.confirm);

// protected routes
router.get("/getUser", mustBeAuthenticated, getUser);
router.post("/getHistory", mustBeAuthenticated, portfolio.getHistory);
router.post("/getTransactions", mustBeAuthenticated, portfolio.getTransactions);
router.post("/buyOrder", mustBeAuthenticated, orders.buy);
router.post("/sellOrder", mustBeAuthenticated, orders.sell);
router.post("/handleWatchlist", mustBeAuthenticated, handleWatchlist);

const baseRouter = new Router();
baseRouter.get("/", (ctx, next) => {
  ctx.status = 200;
  ctx.body = { status: "UP" };
});
app.use(baseRouter.routes());
app.use(router.routes());

let port = process.env.PORT || 3000;
app.listen(port, null, () => {
  console.log("Listening on port " + port);
});
