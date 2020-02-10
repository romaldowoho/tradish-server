const LocalStrategy = require("passport-local").Strategy;
const User = require("../../models/User");

module.exports = new LocalStrategy(
  { usernameField: "email", session: false },
  async function(email, password, done) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, "User does not exist");
      }

      const isValidPassword = await user.checkPassword(password);

      if (!isValidPassword) {
        return done(null, false, "Email and password do not match");
      }

      if (user.verificationToken) {
        return done(null, false, "Please confirm your email");
      }

      return done(null, user);
    } catch (err) {
      done(err);
    }
  }
);
