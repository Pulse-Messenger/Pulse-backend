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
