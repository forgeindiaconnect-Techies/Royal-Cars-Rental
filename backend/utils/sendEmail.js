require('dotenv').config();
const https = require('https');
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

/**
 * Enhanced Send Email Utility with Full Brevo API Tracing & Detailed Logs
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL || 'vaideeswari8@gmail.com';
  const brevoSenderName = process.env.BREVO_SENDER_NAME || 'Royal Car Rentals Admin';

  console.log(`\n\x1b[36m========================================================================\x1b[0m`);
  console.log(`\x1b[36m[EMAIL DISPATCH INITIATED]\x1b[0m`);
  console.log(`  📩 Recipient Email : ${to}`);
  console.log(`  📌 Subject         : ${subject}`);
  console.log(`  👤 Sender Name     : ${brevoSenderName}`);
  console.log(`  ✉️  Sender Email    : ${brevoSenderEmail}`);
  console.log(`  🔑 Brevo API Key   : ${brevoApiKey ? `Configured (Length: ${brevoApiKey.length})` : '⚠️ Missing / Not Configured'}`);
  console.log(`\x1b[36m========================================================================\x1b[0m\n`);

  // 1. TRY BREVO HTTPS REST API v3 WITH DETAILED LOGS
  if (brevoApiKey && !brevoApiKey.startsWith('#')) {
    const candidateSenders = [
      { name: brevoSenderName, email: brevoSenderEmail },
      { name: brevoSenderName, email: 'deepudeepu22062007@gmail.com' },
      { name: brevoSenderName, email: 'vaideeswari8@gmail.com' }
    ];

    const uniqueSenders = candidateSenders.filter((s, idx, self) => s.email && self.findIndex(t => t.email === s.email) === idx);

    for (const senderObj of uniqueSenders) {
      console.log(`\x1b[33m[BREVO API DISPATCH ATTEMPT]\x1b[0m Target: https://api.brevo.com/v3/smtp/email | Sender: "${senderObj.name}" <${senderObj.email}> | To: ${to}`);

      try {
        const payload = JSON.stringify({
          sender: senderObj,
          to: [{ email: to }],
          subject: subject,
          htmlContent: html || `<p>${text || subject}</p>`,
          textContent: text || subject
        });

        const options = {
          hostname: 'api.brevo.com',
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey.trim(),
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(payload)
          }
        };

        const result = await new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
              console.log(`  \x1b[34m[BREVO API RESPONSE STATUS]\x1b[0m HTTP ${res.statusCode} ${res.statusMessage || ''}`);
              console.log(`  \x1b[34m[BREVO API RESPONSE BODY]\x1b[0m ${body}`);

              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const parsed = JSON.parse(body);
                  resolve(parsed);
                } catch {
                  resolve({ messageId: 'brevo_ok' });
                }
              } else {
                reject(new Error(`Brevo API HTTP ${res.statusCode}: ${body}`));
              }
            });
          });

          req.on('error', (err) => {
            console.error(`  \x1b[31m[BREVO HTTPS NETWORK ERROR]\x1b[0m ${err.message}`);
            reject(err);
          });

          req.write(payload);
          req.end();
        });

        console.log(`\x1b[32m[BREVO API EMAIL DELIVERED SUCCESS ✅]\x1b[0m`);
        console.log(`  MessageId : ${result.messageId || 'OK'}`);
        console.log(`  Recipient : ${to}`);
        console.log(`  Sender    : ${senderObj.email}\n`);

        return { success: true, messageId: result.messageId, provider: 'brevo-api', sender: senderObj.email };
      } catch (brevoErr) {
        console.error(`\x1b[31m[BREVO API DISPATCH FAILED ❌ for sender ${senderObj.email}]\x1b[0m Reason: ${brevoErr.message}\n`);
      }
    }
  }

  // 2. TRY GMAIL / CUSTOM SMTP SECOND IF EMAIL_USER & EMAIL_PASS ARE DEFINED
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (nodemailer && emailUser && emailPass && !emailPass.startsWith('#')) {
    console.log(`\x1b[33m[SMTP DISPATCH ATTEMPT]\x1b[0m Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'} | User: ${emailUser}`);
    try {
      const isGmail = (process.env.EMAIL_HOST || '').includes('gmail') || emailUser.includes('@gmail.com');
      const transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: 'gmail',
              auth: { user: emailUser, pass: emailPass }
            }
          : {
              host: process.env.EMAIL_HOST || 'smtp.gmail.com',
              port: Number(process.env.EMAIL_PORT || 587),
              secure: Number(process.env.EMAIL_PORT) === 465,
              auth: { user: emailUser, pass: emailPass }
            }
      );

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"${brevoSenderName}" <${emailUser}>`,
        to,
        subject,
        text: text || subject,
        html
      });
      console.log(`\x1b[32m[SMTP EMAIL DELIVERED SUCCESS ✅]\x1b[0m MessageId: ${info.messageId} | To: ${to}\n`);
      return { success: true, messageId: info.messageId, provider: 'smtp-gmail' };
    } catch (smtpErr) {
      console.error(`\x1b[31m[SMTP DISPATCH FAILED ❌]\x1b[0m Reason: ${smtpErr.message}\n`);
    }
  }

  console.error(`\x1b[31m[EMAIL DISPATCH FAILED]\x1b[0m To: ${to} | Subject: ${subject}\n`);
  return { success: false, error: 'Email dispatch failed: Brevo API and SMTP fallback unsuccessful or unconfigured.' };
};

/**
 * Send KYC & Approval Status Email Template
 */
const sendKYCStatusEmail = async ({ recipientName, recipientEmail, roleName, status, reason }) => {
  const isApproved = status === 'Approved' || status === 'active';
  const title = isApproved
    ? `🎉 Application Approved – Welcome to Royal Car Rentals!`
    : `⚠️ Notice: Action Required on Your Application`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 2rem; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 1.6rem;">👑 ROYAL CAR RENTALS</h1>
        <p style="color: #93c5fd; margin-top: 0.5rem; font-size: 0.9rem;">Fleet Management & Mobility Platform</p>
      </div>

      <div style="padding: 2rem; background: #090d16;">
        <h2 style="color: ${isApproved ? '#34d399' : '#f43f5e'}; margin-top: 0;">${title}</h2>
        <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">Hi <strong>${recipientName}</strong>,</p>
        
        <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
          Your registration application as a <strong>${roleName}</strong> has been reviewed by the Super Admin team.
        </p>

        <div style="background: ${isApproved ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)'}; border: 1px solid ${isApproved ? '#059669' : '#e11d48'}; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0;">
          <div style="font-weight: bold; color: ${isApproved ? '#34d399' : '#fda4af'}; font-size: 1.1rem; margin-bottom: 0.5rem;">
            Application Status: ${isApproved ? 'APPROVED ✅' : 'REJECTED / ACTION REQUIRED ❌'}
          </div>
          <p style="color: #cbd5e1; font-size: 0.9rem; margin: 0;">
            ${isApproved
              ? 'Your identity documents and vehicle/licence details have passed Super Admin verification. You can now access your full operational dashboard.'
              : `Reason: ${reason || 'Document verification failed. Please re-submit valid document proofs on the portal.'}`}
          </p>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <a href="http://localhost:3000" style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; text-decoration: none; padding: 0.85rem 2rem; border-radius: 10px; font-weight: bold; display: inline-block;">
            ${isApproved ? '🚀 Go to Dashboard' : '🔄 Re-submit Application'}
          </a>
        </div>
      </div>

      <div style="background: #0f172a; padding: 1rem; text-align: center; color: #64748b; font-size: 0.75rem; border-top: 1px solid #1e293b;">
        © 2026 Royal Car Rentals Platform. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject: isApproved ? `Approved: Royal Car Rentals ${roleName} Account Active` : `Action Required: Royal Car Rentals ${roleName} Application Status`,
    html
  });
};

/**
 * Send Subscription Expiry Reminder Email Template
 */
const sendSubscriptionExpiryEmail = async ({ companyName, ownerEmail, planName, expiryDate, daysLeft }) => {
  let subject = `Your Royal Car Rentals Subscription Status`;
  let badgeColor = '#3b82f6';
  let badgeText = `${daysLeft} Days Remaining`;

  if (daysLeft === 7) {
    subject = `Notice: Your ${companyName} Subscription Expires in 7 Days`;
  } else if (daysLeft === 3) {
    subject = `Reminder: Your ${companyName} Subscription Expires in 3 Days`;
  } else if (daysLeft === 1) {
    subject = `URGENT: Your ${companyName} Subscription Expires Tomorrow!`;
    badgeColor = '#f59e0b';
    badgeText = `Expires Tomorrow!`;
  } else if (daysLeft <= 0) {
    subject = `Your Royal Car Rentals Subscription Has Expired`;
    badgeColor = '#ef4444';
    badgeText = `Subscription Expired`;
  }

  const secret = process.env.JWT_SECRET || 'fleetmindai_jwt_secret_key_2026_secure_random_string';
  const jwt = require('jsonwebtoken');
  const subToken = jwt.sign(
    { ownerEmail, companyName, planName, type: 'subscription_access' },
    secret,
    { expiresIn: '7d' }
  );

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const payLink = `${clientUrl}/subscription/pay?token=${subToken}&plan=${encodeURIComponent(planName || 'Starter Plan')}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 2rem; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 1.6rem;">👑 ROYAL CAR RENTALS</h1>
        <p style="color: #93c5fd; margin-top: 0.5rem; font-size: 0.9rem;">Fleet Management Subscription Services</p>
      </div>

      <div style="padding: 2rem; background: #090d16;">
        <div style="display: inline-block; background: ${badgeColor}; color: #ffffff; padding: 0.35rem 0.85rem; border-radius: 20px; font-weight: bold; font-size: 0.8rem; margin-bottom: 1rem;">
          ${badgeText}
        </div>

        <h2 style="color: #ffffff; margin-top: 0;">Subscription Status Update</h2>
        <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">Hi <strong>${companyName}</strong>,</p>
        
        <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.6;">
          ${daysLeft > 0
            ? `Your <strong>${planName || 'Rental Business'}</strong> subscription plan is set to expire on <strong>${expiryDate}</strong>.`
            : `Your <strong>${planName || 'Rental Business'}</strong> subscription plan expired on <strong>${expiryDate}</strong>.`}
          Please renew your subscription plan to ensure uninterrupted access to fleet management, driver dispatch, and customer booking tools.
        </p>

        <div style="background: rgba(30, 58, 138, 0.4); border: 1px solid #3b82f6; padding: 1.25rem; border-radius: 12px; margin: 1.5rem 0;">
          <div style="color: #93c5fd; font-size: 0.85rem; margin-bottom: 0.4rem;">Company Account: <strong>${companyName}</strong></div>
          <div style="color: #93c5fd; font-size: 0.85rem; margin-bottom: 0.4rem;">Subscription Plan: <strong>${planName || 'Free Trial / Pro Plan'}</strong></div>
          <div style="color: #93c5fd; font-size: 0.85rem;">Expiry Date: <strong style="color: #fbbf24;">${expiryDate}</strong></div>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <a href="${payLink}" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; text-decoration: none; padding: 0.85rem 2rem; border-radius: 10px; font-weight: bold; display: inline-block;">
            💳 Renew Subscription & Select Plan
          </a>
        </div>
      </div>

      <div style="background: #0f172a; padding: 1rem; text-align: center; color: #64748b; font-size: 0.75rem; border-top: 1px solid #1e293b;">
        © 2026 Royal Car Rentals Platform. Automated Subscription Service.
      </div>
    </div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendKYCStatusEmail,
  sendSubscriptionExpiryEmail
};
