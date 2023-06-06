import nodemailer from "nodemailer";
import { google } from "googleapis";

class Email {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "login",
        user: process.env.EMAIL_USERNAME!,
        pass: process.env.EMAIL_PASSWORD!,
      },
    });
  }

  public async sendEmail(mailOptions: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      const res = await this.transporter.sendMail({
        from: process.env.EMAIL_USERNAME,
        ...mailOptions,
      });
      if (!res) throw "err";
    } catch (err) {
      console.error(err);
    }
  }
}

export const email = new Email();

export const verificationEmail = (confirmEndpoint: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pulse Messenger Mail Confirmation</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            padding: 0;
            margin: 0;
          }
          :root {
            font-size: 25px;
          }
          @media screen and (max-width: 600px) {
            :root {
              font-size: 18px;
            }
          }
          body {
            padding: 2rem;
            text-align: center;
          }
          table {
            margin-left: auto;
            margin-right: auto;
          }
          td {
            text-align: center;
          }
          h1 {
            text-align: center;
            font-size: 2rem;
            color: #42404d;
          }
          img {
            width: 5.5rem;
            padding: 0.5rem;
          }
          .content {
            font-size: 0.9rem;
            padding: 1rem 0;
            text-align: center;
          }
          a {
            text-decoration: none;
            padding: 0.3rem 0.5rem;
            background: #1d1c20;
            border: 2px solid #f84e6a;
            border-radius: 5px;
            color: #ffffff !important;
          }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <img
                src="https://s3.eu-central-2.wasabisys.com/cdn.pulse-messenger.com/misc/Logo.png"
                alt="logo"
              />
            </td>
          </tr>
          <tr>
            <td>
              <h1>Welcome to<br />Pulse Messenger</h1>
            </td>
          </tr>
          <tr>
            <td>
              <p class="content">
                Hello and welcome to Pulse Messenger!<br />
                Your email has been used to register an account on our platform.<br />Please
                confirm your email by clicking the button below.
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <a href="${confirmEndpoint}">Confirm Email</a>
            </td>
          </tr>
          <tr>
            <td>
              <p class="content">
                If this wasn't you please disregard the email.<br />The new account will be deleted after one day if not verified.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const emailVerified = `
      <html>
        <head>
          <meta http-equiv="Refresh" content="5; URL=${process.env.CLIENT_PATH}" />
        <title>Pulse Messenger Mail Confirmation</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            padding: 0;
            margin: 0;
          }
          :root {
            font-size: 25px;
          }
          @media screen and (max-width: 600px) {
            :root {
              font-size: 18px;
            }
          }
          body {
            padding: 2rem;
            text-align: center;
          }
          table {
            margin-left: auto;
            margin-right: auto;
          }
          td {
            text-align: center;
          }
          h1 {
            text-align: center;
            font-size: 2rem;
            color: #42404d;
          }
          img {
            width: 5.5rem;
            padding: 0.5rem;
          }
          .content {
            font-size: 0.9rem;
            padding: 1rem 0;
            text-align: center;
          }
          a {
            text-decoration: none;
            padding: 0.3rem 0.5rem;
            background: #1d1c20;
            border: 2px solid #f84e6a;
            border-radius: 5px;
            color: #ffffff !important;
          }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <img
                src="https://s3.eu-central-2.wasabisys.com/cdn.pulse-messenger.com/misc/Logo.png"
                alt="logo"
              />
            </td>
          </tr>
          <tr>
            <td>
              <h1>Welcome to<br />Pulse Messenger</h1>
              <p>redirecting...</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

export const emailFailed = `
      <html>
        <head>
          <meta http-equiv="Refresh" content="5; URL=${process.env.CLIENT_PATH}" />
        <title>Pulse Messenger Mail Confirmation</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            padding: 0;
            margin: 0;
          }
          :root {
            font-size: 25px;
          }
          @media screen and (max-width: 600px) {
            :root {
              font-size: 18px;
            }
          }
          body {
            padding: 2rem;
            text-align: center;
          }
          table {
            margin-left: auto;
            margin-right: auto;
          }
          td {
            text-align: center;
          }
          h1 {
            text-align: center;
            font-size: 2rem;
            color: #42404d;
          }
          img {
            width: 5.5rem;
            padding: 0.5rem;
          }
          .content {
            font-size: 0.9rem;
            padding: 1rem 0;
            text-align: center;
          }
          a {
            text-decoration: none;
            padding: 0.3rem 0.5rem;
            background: #1d1c20;
            border: 2px solid #f84e6a;
            border-radius: 5px;
            color: #ffffff !important;
          }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <img
                src="https://s3.eu-central-2.wasabisys.com/cdn.pulse-messenger.com/misc/Logo.png"
                alt="logo"
              />
            </td>
          </tr>
          <tr>
            <td>
              <h1>This token has expired!</h1>
              <p>redirecting...</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;
