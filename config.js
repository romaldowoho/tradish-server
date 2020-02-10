module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI
  },
  crypto: {
    iterations: process.env.NODE_ENV === "test" ? 1 : 12000,
    length: 128,
    digest: "sha512"
  },
  providers: {
    github: {
      app_id: process.env.GITHUB_APP_ID || "github_app_id",
      app_secret: process.env.GITHUB_APP_SECRET || "github_app_secret",
      callback_uri: "http://localhost:3000/oauth/github",
      options: {
        scope: ["user:email"]
      }
    },
    facebook: {
      app_id: process.env.FACEBOOK_APP_ID || "facebook_app_id",
      app_secret: process.env.FACEBOOK_APP_SECRET || "facebook_app_secret",
      callback_uri: "http://localhost:3000/oauth/facebook",
      options: {
        scope: ["email"]
      }
    }
  },
  mailer: {
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASS
  },
  IEX: {
    public_token: "pk_4f6855b1261044f2861fc64184bbf31e",
    sandbox_token: "Tpk_825cbc0a138841a8a8debcbe5d7d84ea"
  }
};
