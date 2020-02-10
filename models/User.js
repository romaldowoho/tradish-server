const mongoose = require("mongoose");
const crypto = require("crypto");
const config = require("../config");
const connection = require("../libs/connection");

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: "This field is required"
    },
    lastName: {
      type: String,
      required: "This field is required"
    },
    username: {
      type: String,
      required: "This field is required",
      unique: "Username taken"
    },
    email: {
      type: String,
      required: "This field is required",
      validate: [
        {
          validator(value) {
            return /^[-.\w]+@([\w-]+\.)+[\w-]{2,12}$/.test(value);
          },
          message: "Invalid email format"
        }
      ],
      unique: "Email already exists"
    },
    verificationToken: {
      type: String,
      index: true
    },
    passwordHash: {
      type: String
    },
    salt: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

function generatePassword(salt, password) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      config.crypto.iterations,
      config.crypto.length,
      config.crypto.digest,
      (err, key) => {
        if (err) return reject(err);
        resolve(key.toString("hex"));
      }
    );
  });
}

function generateSalt() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(config.crypto.length, (err, buffer) => {
      if (err) return reject(err);
      resolve(buffer.toString("hex"));
    });
  });
}

userSchema.methods.setPassword = async function setPassword(password) {
  this.salt = await generateSalt();
  this.passwordHash = await generatePassword(this.salt, password);
};

userSchema.methods.checkPassword = async function(password) {
  if (!password) return false;

  const hash = await generatePassword(this.salt, password);
  return hash === this.passwordHash;
};

module.exports = connection.model("User", userSchema);
