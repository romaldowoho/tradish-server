const juice = require("juice");
const config = require("../config");
const path = require("path");
const pug = require("pug");

const nodemailer = require("nodemailer");
const htmlToText = require("nodemailer-html-to-text").htmlToText;
const SMTPTransport = require("nodemailer-smtp-transport");
const StubTransport = require("nodemailer-stub-transport");

const transportEngine =
  process.env.NODE_ENV === "test"
    ? new StubTransport()
    : new SMTPTransport({
        service: "Gmail",
        auth: {
          XOAuth2: {
            user: config.mailer.user,
            clientId: config.mailer.clientId,
            clientSecret: config.mailer.clientSecret,
            refreshToken: config.mailer.refreshToken
          }
        }
      });

const transport = nodemailer.createTransport(transportEngine);

transport.use("compile", htmlToText());

/**
 * sendMail - функция, отправляющая письмо на указанный адрес
 * options - объект, содержащий опции для отправки писем:
 * options.template - имя файла, содержащего шаблон письма
 * options.locals - объект с переменными, которые будут переданы в шаблон
 * options.to - email, на который будет отправлено письмо
 * options.subject - тема письма
 * пример:
 *     await sendMail({
 *       template: 'confirmation',
 *       locals: {token: 'token'},
 *       to: 'user@mail.com',
 *       subject: 'Подтвердите почту',
 *     });
 * */
module.exports = async function sendMail(options) {
  const html = pug.renderFile(
    path.join(__dirname, "../templates", options.template) + ".pug",
    options.locals || {}
  );

  const message = {
    html: juice(html),
    to: {
      address: options.to
    },
    subject: options.subject
  };

  return await transport.sendMail(message);
};

module.exports.transportEngine = transportEngine;
