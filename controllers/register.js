const uuid = require("uuid/v4");
const User = require("../models/User");
const sendMail = require("../libs/sendMail");
const sgMail = require('@sendgrid/mail');

module.exports.register = async (ctx, next) => {
  const verificationToken = uuid();
  let user = await User.findOne({ email: ctx.request.body.email });
  console.log(user);
  if (user) {
    ctx.body = { status: "Email already exists" };
    ctx.status = 409;
    return next();
  } else {
    user = new User({
      firstName: ctx.request.body.firstName,
      lastName: ctx.request.body.lastName,
      username: ctx.request.body.username,
      balance: 50000,
      email: ctx.request.body.email,
      verificationToken
    });
  }

  await user.setPassword(ctx.request.body.password);
  await user.save();

  // await sendMail({
  //   to: user.email,
  //   subject: "Confirm your email",
  //   locals: { token: verificationToken },
  //   template: "emailConfirmation"
  // });

  
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
  to: 'test@example.com',
  from: 'test@example.com',
  subject: 'Sending with Twilio SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};
sgMail.send(msg);

  ctx.body = { status: "ok" };
};

module.exports.confirm = async (ctx, next) => {
  const user = await User.findOne({
    verificationToken: ctx.query.token
  });

  if (!user) {
    ctx.throw("The confirmation link is invalid or has expired");
  }

  user.verificationToken = undefined;
  await user.save();

  const token = uuid();

  ctx.redirect("http://tradish.io/confirmed");
};
