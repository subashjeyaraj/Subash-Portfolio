const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { initDB, saveContact, getAllContacts, isMySQLConnected } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const GMAIL_RECIPIENT = process.env.EMAIL_TO || 'subashibm8@gmail.com';

// Enable CORS for any client origin
app.use(cors());

// Parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (HTML, CSS, JS, Images)
app.use(express.static(path.join(__dirname)));

/**
 * Send email notification to subashibm8@gmail.com
 */
async function sendEmailNotification({ name, email, message }) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log(`[Email Notice] Message from ${name} (${email}) saved to database.`);
    console.log(`[Email Tip] To enable automatic Gmail SMTP delivery, add EMAIL_USER and EMAIL_PASS (App Password) to .env`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${emailUser}>`,
      to: GMAIL_RECIPIENT,
      replyTo: email,
      subject: `Portfolio Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7f7f7;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 25px; border: 1px solid #e0e0e0;">
            <h2 style="color: #ea4335; margin-top: 0;">New Portfolio Message</h2>
            <p style="margin: 8px 0;"><strong>Sender Name:</strong> ${name}</p>
            <p style="margin: 8px 0;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #1a73e8;">${email}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="margin: 8px 0; color: #555;"><strong>Message:</strong></p>
            <div style="background: #fdfdfd; padding: 15px; border-left: 4px solid #ea4335; color: #333; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 25px; font-size: 12px; color: #888;">Received on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log(`[Email Sent] Successfully delivered notification to ${GMAIL_RECIPIENT}`);
  } catch (err) {
    console.warn(`[Email Warning] Failed to send via Gmail SMTP: ${err.message}`);
  }
}

/**
 * Health check & status endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    mysqlConnected: isMySQLConnected(),
    emailRecipient: GMAIL_RECIPIENT,
  });
});

/**
 * GET /api/contact - View all received contact messages
 */
app.get('/api/contact', async (req, res) => {
  try {
    const contacts = await getAllContacts();
    res.json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts: ' + error.message,
    });
  }
});

/**
 * POST /api/contact - Handle contact form submission
 */
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all fields (name, email, message).',
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'All fields must contain valid text.',
      });
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    // Save to MySQL Database
    const saved = await saveContact({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });

    // Send email notification to subashibm8@gmail.com
    sendEmailNotification({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });

    const mailtoUrl = `mailto:${GMAIL_RECIPIENT}?subject=${encodeURIComponent(
      `Portfolio Contact from ${trimmedName}`
    )}&body=${encodeURIComponent(
      `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\nMessage:\n${trimmedMessage}`
    )}`;

    return res.status(201).json({
      success: true,
      message: `Message sent to ${GMAIL_RECIPIENT}!`,
      recipient: GMAIL_RECIPIENT,
      mailtoUrl,
      data: {
        id: saved.id,
        name: saved.name,
        email: saved.email,
        storage: saved.storage,
      },
    });
  } catch (error) {
    console.error('Error handling contact submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to send message. Please try again later.',
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`Portfolio Server running at: http://localhost:${PORT}`);
  console.log(`Email recipient configured as: ${GMAIL_RECIPIENT}`);
  console.log(`API Contact endpoint: http://localhost:${PORT}/api/contact`);
  console.log(`=========================================`);

  // Initialize Database connection & table setup
  await initDB();
});
