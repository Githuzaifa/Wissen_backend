

import { createTransport } from "nodemailer";



export const sendEmail = async (to, subject, text) => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: "huzaifamajeed56@gmail.com",         // replace with your Gmail address
      pass: "hwsx iqlg cbrz zjab",            // use an App Password, not your Gmail password
    },
  });

  await transporter.sendMail({
    from: "wissen924324@gmail.com",           // optional but recommended
    to,
    subject,
    text,
  });
};
