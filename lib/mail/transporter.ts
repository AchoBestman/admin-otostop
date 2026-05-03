import nodemailer from "nodemailer";
import type { EmailType } from "@/types";

// Create transporter based on email type
function createTransporter(type: EmailType) {
  const config = type === "noreply" 
    ? {
        host: process.env.MAIL_NOREPLY_HOST || "box.srv1079156.hstgr.cloud",
        port: parseInt(process.env.MAIL_NOREPLY_PORT || "465"),
        secure: true,
        auth: {
          user: process.env.MAIL_NOREPLY_USER || "no-reply@otostop.kassigroup.com",
          pass: process.env.MAIL_NOREPLY_PASS,
        },
      }
    : {
        host: process.env.MAIL_CONTACT_HOST || "box.srv1079156.hstgr.cloud",
        port: parseInt(process.env.MAIL_CONTACT_PORT || "465"),
        secure: true,
        auth: {
          user: process.env.MAIL_CONTACT_USER || "contact@otostop.kassigroup.com",
          pass: process.env.MAIL_CONTACT_PASS,
        },
      };

  return nodemailer.createTransport(config);
}

// Get sender address based on type
function getSenderAddress(type: EmailType): string {
  const appName = process.env.APP_NAME || "OtoStop Global+";
  
  if (type === "noreply") {
    const email = process.env.MAIL_NOREPLY_USER || "no-reply@otostop.kassigroup.com";
    return `${appName} <${email}>`;
  }
  
  const email = process.env.MAIL_CONTACT_USER || "contact@otostop.kassigroup.com";
  return `${appName} <${email}>`;
}

// Send email
export async function sendMail(options: {
  type: EmailType;
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const { type, to, subject, html } = options;

  try {
    const transporter = createTransporter(type);
    
    await transporter.sendMail({
      from: getSenderAddress(type),
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// Test email configuration
export async function testEmailConnection(type: EmailType): Promise<boolean> {
  try {
    const transporter = createTransporter(type);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error(`Email ${type} connection test failed:`, error);
    return false;
  }
}
