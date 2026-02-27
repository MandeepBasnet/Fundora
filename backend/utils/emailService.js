const nodemailer = require('nodemailer');

// Debug: Check if SMTP credentials are loaded
console.log('SMTP Config Check:', {
  host: process.env.SMTP_HOST || 'NOT SET',
  port: process.env.SMTP_PORT || 'NOT SET',
  user: process.env.SMTP_USER ? '✓ SET' : '✗ NOT SET',
  pass: process.env.SMTP_PASS ? '✓ SET' : '✗ NOT SET'
});

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Fundora <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Fundora Account - OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0284c7; font-size: 28px; font-weight: bold; margin: 0;">Fundora</h1>
            </div>
            
            <!-- Welcome Message -->
            <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 16px 0; text-align: center;">
              Welcome, ${name}!
            </h2>
            
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
              Thank you for registering with Fundora. Please use the verification code below to complete your registration.
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">
                Verification Code
              </p>
              <h1 style="color: white; font-size: 40px; letter-spacing: 12px; margin: 0; font-weight: bold;">
                ${otp}
              </h1>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                ⏱️ This code will expire in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
              </p>
            </div>
            
            <!-- Security Notice -->
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
              If you didn't create an account with Fundora, please ignore this email.
            </p>
            
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Fundora. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Verify transporter connection
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};

// Send Password Reset OTP email
const sendPasswordResetEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Fundora <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your Fundora Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0284c7; font-size: 28px; font-weight: bold; margin: 0;">Fundora</h1>
            </div>
            
            <!-- Message -->
            <h2 style="color: #1e293b; font-size: 24px; margin: 0 0 16px 0; text-align: center;">
              Password Reset Request
            </h2>
            
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
              Hi ${name}, we received a request to reset your password. Use the code below to complete the process.
            </p>
            
            <!-- OTP Box -->
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; border-radius: 12px; text-align: center; margin-bottom: 32px;">
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px;">
                Reset Code
              </p>
              <h1 style="color: white; font-size: 40px; letter-spacing: 12px; margin: 0; font-weight: bold;">
                ${otp}
              </h1>
            </div>
            
            <!-- Expiry Notice -->
            <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 32px;">
              <p style="color: #991b1b; font-size: 14px; margin: 0;">
                ⏱️ This code will expire in <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
              </p>
            </div>
            
            <!-- Security Notice -->
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
              If you didn't request a password reset, please ignore this email or contact support if you're concerned.
            </p>
            
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Fundora. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password Reset Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// --- FLAGGING & MODERATION EMAILS ---

const sendFlagReceivedEmail = async (email, campaignTitle) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Fundora <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Report Received - Fundora',
    html: `
      <h2>Fundora Moderation Team</h2>
      <p>Thank you for your report regarding the campaign <strong>"${campaignTitle}"</strong>.</p>
      <p>We've received your flag and it is currently under review by our moderation team. We'll notify you once a decision is made.</p>
      <br>
      <p>Regards,<br>Fundora Trust & Safety</p>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendFlagResolutionEmail = async (email, campaignTitle, outcome, explanation) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Fundora <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Report Update: ${outcome} - Fundora`,
    html: `
      <h2>Fundora Moderation Team</h2>
      <p>We've reviewed your report regarding the campaign <strong>"${campaignTitle}"</strong>.</p>
      <p><strong>Outcome:</strong> ${outcome}</p>
      <p><strong>Reason/Details:</strong> ${explanation || 'Our moderation team has taken appropriate action based on our community guidelines.'}</p>
      <br>
      <p>Thank you for keeping our community safe.</p>
      <p>Regards,<br>Fundora Trust & Safety</p>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendCreatorWarningEmail = async (email, warningLevel, explanation) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Fundora <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Important Notice Regarding Your Campaign - ${warningLevel}`,
    html: `
      <h2>Fundora Trust & Safety</h2>
      <p>This is a serious notice regarding your recent activity on Fundora.</p>
      <p><strong>Action Taken:</strong> ${warningLevel}</p>
      <p><strong>Details:</strong> ${explanation}</p>
      <p>Please ensure your future actions comply with our terms of service to avoid further penalties, which may include permanent suspension.</p>
      <br>
      <p>Regards,<br>Fundora Moderation Team</p>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendCampaignTerminatedEmail = async (email, campaignTitle, reason) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `Fundora <${process.env.SMTP_USER}>`,
    to: email,
    subject: `URGENT: Your Campaign "${campaignTitle}" has been Terminated`,
    html: `
      <h2>Account Action Notice</h2>
      <p>We are writing to inform you that your campaign <strong>"${campaignTitle}"</strong> has been terminated due to serious violations of our Terms of Service.</p>
      <p><strong>Reason for Termination:</strong> ${reason}</p>
      <p>All associated transactions have been flagged, and automatic refunds for your backers will be initiated within 24 hours.</p>
      <p>Your account is currently suspended pending a full investigation.</p>
      <br>
      <p>Fundora Legal and Trust & Safety Team</p>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendReceiptEmail = async (transaction, campaign, backer, creator) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@fundora.com';
  
  const formattedAmount = `NPR ${transaction.amount.toLocaleString()}`;
  const dateStr = new Date(transaction.paidAt || transaction.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Fundora Payments <${process.env.SMTP_USER}>`,
    to: [backer.email, creator.email, adminEmail].join(', '),
    subject: `Fundora Payment Receipt: ${campaign.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background-color: white; border-top: 6px solid #0284c7; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0284c7; font-size: 28px; font-weight: bold; margin: 0;">Fundora Receipt</h1>
            </div>
            
            <p style="color: #475569; font-size: 16px; margin-bottom: 30px; text-align: center;">
              Thank you for your transaction. Here are your payment details.
            </p>
            
            <div style="background-color: #f1f5f9; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;">Transaction ID</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right;">${transaction.transactionId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Campaign</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">${campaign.title}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Payment Method</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; text-transform: capitalize; border-top: 1px solid #e2e8f0;">${transaction.gateway}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Date</td>
                  <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 16px 0 8px 0; color: #0f172a; font-size: 16px; font-weight: bold; border-top: 2px solid #cbd5e1;">Total Amount</td>
                  <td style="padding: 16px 0 8px 0; color: #0284c7; font-size: 20px; font-weight: bold; text-align: right; border-top: 2px solid #cbd5e1;">${formattedAmount}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
              This email was sent to ${backer.email} (Backer), ${creator.email} (Creator), and the Fundora Admin team. Keep this receipt for your records.
            </p>
            
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Receipt Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending receipt email:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
  verifyEmailConnection,
  sendFlagReceivedEmail,
  sendFlagResolutionEmail,
  sendCreatorWarningEmail,
  sendCampaignTerminatedEmail,
  sendReceiptEmail
};
