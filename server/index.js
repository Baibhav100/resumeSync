require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Force IPv4 to avoid ENETUNREACH errors on cloud platforms
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const PDFDocument = require('pdfkit');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const pdf = require('pdf-parse');
const puppeteer = require('puppeteer');
const axios = require('axios');  // ✅ ADD THIS
const cheerio = require('cheerio');  // ✅ ADD THIS
const nodemailer = require('nodemailer'); // ✅ ADD THIS

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// PDF Generation Function
// ============================================
// IMPROVED PDF GENERATION FUNCTION - Preserves resume structure
// ============================================
async function generateResumePDF(resumeText, userName = 'User') {
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });
    const page = await browser.newPage();

    // Intelligent parser that preserves the user's exact structure
    const lines = resumeText.split('\n');
    let bodyHtml = '';
    let inList = false;
    let listType = 'ul';

    const closeList = () => {
        if (inList) {
            bodyHtml += `</${listType}>`;
            inList = false;
        }
    };

    const isBulletPoint = (line) => {
        return /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line);
    };

    const getBulletType = (line) => {
        if (/^\d+\.\s/.test(line)) return 'ol';
        return 'ul';
    };

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (!trimmed) {
            closeList();
            bodyHtml += '<div style="height: 4px;"></div>';
            continue;
        }

        // Handle markdown headings
        if (trimmed.startsWith('# ')) {
            closeList();
            const title = trimmed.replace(/^#\s+/, '');
            bodyHtml += `<div class="name">${escapeHtml(title)}</div>`;
            continue;
        }

        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
            closeList();
            const title = trimmed.replace(/^#+\s+/, '');
            bodyHtml += `<div class="section-title">${escapeHtml(title.toUpperCase())}</div>`;
            continue;
        }

        // Handle bullet points
        if (isBulletPoint(trimmed)) {
            const newListType = getBulletType(trimmed);
            if (!inList) {
                listType = newListType;
                bodyHtml += `<${listType} class="resume-list">`;
                inList = true;
            } else if (listType !== newListType) {
                closeList();
                listType = newListType;
                bodyHtml += `<${listType} class="resume-list">`;
                inList = true;
            }
            let content = trimmed.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '');
            bodyHtml += `<li>${escapeHtml(content)}</li>`;
            continue;
        }

        closeList();

        // Detect job/experience lines with date
        const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|20\d{2})\b.*\b(20\d{2}|Present)\b/i;
        const hasDate = datePattern.test(trimmed);
        const hasBold = /\*\*/.test(trimmed);

        if ((hasBold || trimmed.includes('—') || trimmed.includes('–')) && hasDate) {
            let leftPart = trimmed;
            let rightPart = '';

            const dateMatch = trimmed.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]\s*Present|20\d{2}\s*[-–]\s*(?:20\d{2}|Present))\b/i);

            if (dateMatch) {
                const dateIndex = trimmed.lastIndexOf(dateMatch[0]);
                leftPart = trimmed.substring(0, dateIndex).trim();
                rightPart = dateMatch[0];
            }

            bodyHtml += `<div class="job-row">
                <span class="job-left">${escapeHtml(leftPart)}</span>
                <span class="job-date">${escapeHtml(rightPart)}</span>
            </div>`;
            continue;
        }

        // Regular text
        bodyHtml += `<p>${escapeHtml(trimmed)}</p>`;
    }

    closeList();

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    color: #1a1a2e;
    background: white;
    padding: 12mm 15mm;
  }

  .name {
    font-size: 20pt;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.02em;
    margin-bottom: 6px;
    margin-top: 0;
    color: #0f172a;
  }

  .section-title {
    font-size: 11pt;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #0f172a;
    border-bottom: 1.5px solid #0f172a;
    padding-bottom: 3px;
    margin: 12px 0 8px;
  }

  p {
    margin-bottom: 4px;
    font-size: 9.5pt;
    line-height: 1.45;
  }

  .resume-list {
    padding-left: 20px;
    margin: 4px 0 6px;
  }

  ul.resume-list {
    list-style-type: disc;
  }

  ol.resume-list {
    list-style-type: decimal;
  }

  li {
    margin-bottom: 3px;
    font-size: 9.5pt;
    line-height: 1.4;
  }

  .job-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 6px 0 2px;
    flex-wrap: wrap;
  }

  .job-left {
    font-size: 10pt;
    font-weight: 600;
    color: #0f172a;
    flex: 1;
  }

  .job-date {
    font-size: 9pt;
    color: #64748b;
    white-space: nowrap;
    margin-left: 12px;
  }

  @media print {
    body {
      padding: 10mm 12mm;
    }
    .job-row, li, p {
      break-inside: avoid;
    }
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' }
    });

    await browser.close();
    return pdfBuffer;
}
// Clean resume content by removing ATS summary sections
function cleanResumeContent(resumeText) {
    if (!resumeText) return '';

    let cleaned = resumeText;

    // Remove the ATS Optimization Summary section (with emoji)
    cleaned = cleaned.replace(/###\s*📊\s*ATS Optimization Summary[\s\S]*?---\n\n/i, '');
    cleaned = cleaned.replace(/###\s*ATS Optimization Summary[\s\S]*?---\n\n/i, '');
    cleaned = cleaned.replace(/##\s*ATS Optimization Summary[\s\S]*?---\n\n/i, '');

    // Also handle if there's no separator
    cleaned = cleaned.replace(/###\s*📊\s*ATS Optimization Summary[\s\S]*?(?=\n\n\*\*|^[A-Z])/i, '');

    // Remove any remaining bullet points that look like summary content
    cleaned = cleaned.replace(/^[-•*]\s*\*\*Keywords added.*$/gim, '');
    cleaned = cleaned.replace(/^[-•*]\s*\*\*Skills highlighted.*$/gim, '');
    cleaned = cleaned.replace(/^[-•*]\s*\*\*Experience rephrased.*$/gim, '');

    // Remove any lines with 📊 emoji
    cleaned = cleaned.replace(/^.*📊.*$/gm, '');

    // Remove empty lines at the start
    cleaned = cleaned.replace(/^\s*\n+/, '');

    // Remove any standalone separators
    cleaned = cleaned.replace(/^---$/gm, '');

    return cleaned.trim();
}


// Helper function to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Helper functions for PDF formatting
function extractContactInfo(text) {
    const lines = text.split('\n').slice(0, 5);
    const email = lines.find(l => l.includes('@')) || '';
    const phone = lines.find(l => l.match(/\+?\d{10,}/)) || '';
    const linkedin = lines.find(l => l.includes('linkedin')) || '';
    const github = lines.find(l => l.includes('github')) || '';

    return `
        ${email ? `<span>📧 ${email}</span>` : ''}
        ${phone ? `<span>📱 ${phone}</span>` : ''}
        ${linkedin ? `<span>🔗 ${linkedin}</span>` : ''}
        ${github ? `<span>💻 ${github}</span>` : ''}
    `;
}

function extractSkills(skillsText) {
    // Extract skills from comma-separated list or bullet points
    const skills = skillsText.split(/[,\n]/)
        .map(s => s.trim())
        .filter(s => s && !s.includes('Skills') && s.length > 0);
    return skills.slice(0, 20);
}

function formatExperience(expText) {
    const items = expText.split(/\n(?=[A-Z])/);
    let html = '';

    for (const item of items) {
        if (!item.trim()) continue;

        const lines = item.split('\n');
        const titleLine = lines[0];
        const match = titleLine.match(/(.+?)\s*[—–-]\s*(.+?)\s*\((.+?)\)/);

        if (match) {
            const [, title, company, date] = match;
            html += `
                <div class="experience-item">
                    <div class="experience-header">
                        <div>
                            <span class="job-title">${title}</span>
                            <span class="company"> @ ${company}</span>
                        </div>
                        <div class="date">${date}</div>
                    </div>
                    <ul class="experience-description">
                        ${lines.slice(1).filter(l => l.trim()).map(l => `<li>${l.replace(/^[-•*]\s*/, '')}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }

    return html || `<div class="experience-item">${formatText(expText)}</div>`;
}

function formatProjects(projText) {
    const projects = projText.split(/\n(?=[A-Z])/);
    let html = '';

    for (const project of projects) {
        if (!project.trim()) continue;

        const lines = project.split('\n');
        const title = lines[0];
        html += `
            <div class="project-item">
                <div class="project-title">${title}</div>
                <div class="experience-description">
                    ${lines.slice(1).filter(l => l.trim()).map(l => `<li>${l.replace(/^[-•*]\s*/, '')}</li>`).join('')}
                </div>
            </div>
        `;
    }

    return html || `<div class="project-item">${formatText(projText)}</div>`;
}

function formatText(text) {
    return text.split('\n').map(line => {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
            return `<li>${line.replace(/^[-•*]\s*/, '')}</li>`;
        }
        return `<p>${line}</p>`;
    }).join('');
}

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("connected to moongoDB");
}).catch((e) => console.log('connection error', e));

//schema

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    profile: {
        phone: String,
        address: String,
        linkedin: String,
        github: String,
        portfolio: String,
        summary: String
    },
    createdAt: { type: Date, default: Date.now },
    resetPasswordOTP: String,
    resetPasswordExpires: Date
});

const resumeHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    companyName: { type: String, required: true },
    jobTitle: String,
    jobUrl: String,
    originalResume: { type: String, required: true },
    tailoredResume: { type: String, required: true },
    latexCode: String,
    pdfUrl: String,
    createdAt: { type: Date, default: Date.now }
});

const analyticsSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    visitors: { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },
    resumeTailorings: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 }
});

// Simplified hashing - avoiding next() with async to prevent hangs
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        console.log("Password not modified, skipping hashing.");
        return;
    }
    try {
        console.log("🔐 Starting password hashing for:", this.email);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log("✅ Hashing completed successfully.");
    } catch (err) {
        console.error("❌ Hashing failed:", err);
        throw err; // In async hooks, throwing an error is enough to stop the save
    }
});

const mongoosePaginate = require('mongoose-paginate-v2');
resumeHistorySchema.plugin(mongoosePaginate);
userSchema.plugin(mongoosePaginate);  // ✅ ADD THIS

const User = mongoose.model("user", userSchema);
const ResumeHistory = mongoose.model("resumeHistory", resumeHistorySchema);
const Analytics = mongoose.model("analytics", analyticsSchema);

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    userName: { type: String },
    action: { type: String, required: true },
    details: { type: String },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Add pagination plugin
activityLogSchema.plugin(mongoosePaginate);
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Clear logs older than 24h

const ActivityLog = mongoose.model("activityLog", activityLogSchema);



// Activity logging function
async function logActivity(userId, userName, action, details = '', req = null) {
    try {
        let ipAddress = '';
        if (req) {
            ipAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
            // Handle localhost IP
            if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') ipAddress = '127.0.0.1';
        }

        const logEntry = new ActivityLog({
            userId,
            userName,
            action,
            details,
            ipAddress
        });
        await logEntry.save();
        console.log(`📝 Activity logged: ${action} - ${userName || 'System'}`);
    } catch (err) {
        console.error('Failed to log activity:', err);
    }
}
//register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log(`📝 Registration attempt for: ${email}`);

        if (!name || !email || !password) {
            console.log("❌ Missing fields in registration request.");
            return res.status(400).json({ message: "All fields are required" });
        }

        console.log("🔍 Checking if user exists...");
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`⚠️ User already exists: ${email}`);
            return res.status(409).json({ message: "User already exists" });
        }

        console.log("💾 Creating and saving user...");
        const user = new User({ name, email, password, role: 'user' });
        await user.save();

        // Log activity
        await logActivity(user._id, user.name, 'USER_REGISTERED', `New user registered with email: ${email}`, req);

        // Update analytics for registrations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { registrations: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        console.log("✅ User saved successfully!");
        return res.status(200).json({ message: "successfully registered", role: 'user' })
    }
    catch (err) {
        console.error("❌ Registration error caught in controller:", err);
        return res.status(500).json({
            message: "Register failed on server",
            error: err.message
        });
    }
});

// admin registration - production-safe
app.post('/api/admin/register', async (req, res) => {
    try {
        const { name, email, password, adminKey } = req.body;

        if (!process.env.ADMIN_CREATION_KEY) {
            return res.status(500).json({ message: 'Admin creation is not configured on this server.' });
        }
        if (adminKey !== process.env.ADMIN_CREATION_KEY) {
            return res.status(403).json({ message: 'Invalid admin creation key.' });
        }
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const adminUser = new User({ name, email, password, role: 'admin' });
        await adminUser.save();

        await logActivity(adminUser._id, adminUser.name, 'ADMIN_CREATED', `Admin account created for ${email}`, req);
        return res.status(200).json({ message: 'Admin account created successfully' });
    } catch (err) {
        console.error('❌ Admin registration error:', err);
        return res.status(500).json({ message: 'Admin registration failed', error: err.message });
    }
});

// alias for backward compatibility
app.post('/api/admin/create', async (req, res) => {
    try {
        const { name, email, password, adminKey } = req.body;

        if (!process.env.ADMIN_CREATION_KEY) {
            return res.status(500).json({ message: 'Admin creation is not configured on this server.' });
        }
        if (adminKey !== process.env.ADMIN_CREATION_KEY) {
            return res.status(403).json({ message: 'Invalid admin creation key.' });
        }
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const adminUser = new User({ name, email, password, role: 'admin' });
        await adminUser.save();

        await logActivity(adminUser._id, adminUser.name, 'ADMIN_CREATED', `Admin account created for ${email}`, req);
        return res.status(200).json({ message: 'Admin account created successfully' });
    } catch (err) {
        console.error('❌ Admin creation error:', err);
        return res.status(500).json({ message: 'Admin creation failed', error: err.message });
    }
});

// admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.role !== 'admin') {
            return res.status(400).json({ message: 'Invalid admin email or password' });
        }

        if (user.isBlocked) {
            await logActivity(user._id, user.name, 'LOGIN_FAILED', 'Attempted admin login while blocked', req);
            return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid admin email or password' });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_SECRET || 'refreshsecret123',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        await logActivity(user._id, user.name, 'LOGIN_SUCCESS', 'Admin logged in successfully', req);

        return res.status(200).json({ message: 'Login successful', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('❌ Admin login error:', err);
        return res.status(500).json({ message: 'Admin login failed', error: err.message });
    }
});

//login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        // CHECK IF USER IS BLOCKED
        if (user.isBlocked) {
            await logActivity(user._id, user.name, 'LOGIN_FAILED', 'Attempted login while blocked', req);
            return res.status(403).json({ message: "Your account has been blocked. Please contact admin." });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, name: user.name },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_SECRET || 'refreshsecret123',
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Log successful login
        await logActivity(user._id, user.name, 'USER_LOGGED_IN', `User logged in successfully`, req);

        res.json({ message: "Logged in successfully", user: { id: user._id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
});
// verify route
app.get('/api/verify', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ message: "User not found" });

        // CHECK IF USER IS BLOCKED
        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked" });
        }

        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, profile: user.profile } });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

// PASSWORD RESET SYSTEM
// ============================================

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use direct SSL for better cloud compatibility
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true, // Enable detailed SMTP logs
    logger: true, // Print SMTP conversation locally/on Railway
    connectionTimeout: 30000, // Wait 30s
    greetingTimeout: 30000,
    socketTimeout: 30000
});

// 1. Request OTP
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        console.log(`\x1b[33m%s\x1b[0m`, `[PASSWORD RESET] OTP for ${email}: ${otp}`);

        // Send email in the background - DO NOT await so the user gets an instant response
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - Resume Sync',
            text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`
        }).then(() => {
            console.log(`✅ OTP email successfully delivered to ${email}`);
        }).catch((mailError) => {
            console.error("❌ Email sending failed in background:", mailError.message);
        });

        // Respond immediately to the frontend
        return res.json({ message: "OTP sent to your email", otp }); // Include OTP in response for development/debugging
    } catch (err) {
        console.error("Forgot password crash:", err);
        return res.status(500).json({ message: "Failed to process request" });
    }
});

// 2. Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        res.json({ message: "OTP verified successfully" });
    } catch (err) {
        res.status(500).json({ message: "Verification failed" });
    }
});

// 3. Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Failed to reset password. Session expired." });
        }

        user.password = newPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password reset successfully! Please login now." });
    } catch (err) {
        res.status(500).json({ message: "Password reset failed" });
    }
});
app.post('/api/logout', async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            const user = await User.findById(decoded.id);
            if (user) {
                await logActivity(user._id, user.name, 'USER_LOGGED_OUT', 'User logged out', req);
            }
        } catch (err) {
            console.log('Invalid token on logout');
        }
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res.clearCookie('token', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json({ message: "Logged out successfully" });
});

// Refresh Token Route
app.post('/api/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'refreshsecret123');
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "Invalid refresh token" });

        // CHECK IF USER IS BLOCKED
        if (user.isBlocked) {
            res.clearCookie('token');
            res.clearCookie('refreshToken');
            return res.status(403).json({ message: "Your account has been blocked" });
        }

        const newToken = jwt.sign(
            { id: user._id, name: user.name },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '15m' }
        );

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000
        }).json({ message: "Token refreshed" });
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
});

// Debug models
app.get('/api/models', async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const models = await genAI.listModels();
        res.json(models);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Tailor Route
app.post('/api/tailor', upload.single('resumeFile'), async (req, res) => {
    console.log("📥 Received Tailor Request");
    console.log("📄 File received:", req.file ? `YES (${req.file.originalname})` : "NO");
    console.log("📝 Full body keys:", Object.keys(req.body));
    console.log("📝 Details:", {
        baseResume: req.body.baseResume ? req.body.baseResume.substring(0, 50) : "empty",
        jobDescription: req.body.jobDescription ? req.body.jobDescription.substring(0, 50) : "empty",
        jobUrl: req.body.jobUrl
    });

    // Verify token
    const token = req.cookies.token || req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    let { jobDescription, baseResume, jobUrl } = req.body;

    // 1. Handle PDF Resume Upload
    if (req.file) {
        try {
            const pdfData = await pdf(req.file.buffer);
            baseResume = pdfData.text;
            console.log("✅ PDF parsed successfully. Length:", baseResume.length);
        } catch (err) {
            console.error("❌ PDF Parse Error:", err.message);
            return res.status(400).json({ message: `Error parsing PDF file: ${err.message}. Try copy-pasting text instead.` });
        }
    }

    // 2. Handle Job URL Scraping
    let companyName = 'Unknown Company';
    if (jobUrl && !jobDescription) {
        let browser = null;
        try {
            console.log(`🔍 Attempting to scrape Job URL via Puppeteer: ${jobUrl}`);
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            const page = await browser.newPage();

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Wait for DOM content to be loaded (faster than networkidle2 on heavy sites like Capgemini)
            await page.goto(jobUrl, { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });

            // Extra wait to let some JS render if needed
            await new Promise(r => setTimeout(r, 2000));

            const pageTitle = await page.title();
            if (pageTitle) {
                const companyMatch = pageTitle.match(/(.+?)\s*(?:-|–|jobs?|careers?|hiring)/i);
                if (companyMatch) {
                    companyName = companyMatch[1].trim();
                } else {
                    companyName = pageTitle.split('|')[0].trim();
                }
            }

            jobDescription = await page.evaluate(() => {
                // Focus on common Job description selectors
                const selectors = [
                    'article', 'main', '.job-description', '#job-details', 
                    '.description', '.job-content', '[role="main"]', '.jobs-description-content'
                ];
                
                let container = null;
                for (const selector of selectors) {
                    container = document.querySelector(selector);
                    if (container) break;
                }

                // Clean up unnecessary noisy elements
                document.querySelectorAll('script, style, noscript, nav, footer, header').forEach(el => el.remove());
                
                let textContent = container ? container.innerText : document.body.innerText;
                return textContent.replace(/\s\s+/g, ' ').trim();
            });

            console.log(`✅ Job Scraped! Extracted ${jobDescription.length} characters for company: ${companyName}`);

            if (!jobDescription || jobDescription.length < 100) {
                throw new Error("Scraped content too short, site might be blocking or relies heavily on iframes.");
            }
        } catch (err) {
            console.error("❌ Puppeteer Scraping error:", err.message);
            return res.status(400).json({ message: "Failed to automatically scrape job description from URL. Please copy and paste the text manually." });
        } finally {
            if (browser) await browser.close();
        }
    }

    if (!jobDescription || !baseResume) {
        return res.status(400).json({ message: "Job description (or URL) and base resume (or PDF) are required" });
    }

    // Get user from token
    let user = null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        user = await User.findById(decoded.id);
        if (!user || user.isBlocked) return res.status(401).json({ message: "User not found or blocked" });
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
        return res.status(500).json({ message: "Gemini API key is missing from backend (.env)" });
    }

    try {
        // 🔍 DEBUG: Validate API Key
        const trimmedKey = apiKey.trim();
        console.log("🔑 API Key Status:", {
            length: trimmedKey.length,
            prefix: trimmedKey.substring(0, 7),
            suffix: trimmedKey.substring(trimmedKey.length - 4),
            hasWhitespace: apiKey !== trimmedKey
        });

        const modelsToTry = [
            "gemini-3-flash-preview",
            "gemini-1.5-flash", 
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        let tailoredResume = "";
        let successfulModel = "";
        let lastError = null;

        // UPDATED PROMPT - NO ATS SUMMARY SECTION
        const enhancedPrompt = `You are an expert ATS resume optimizer. Your task is to tailor the provided resume to match the job description.

CRITICAL: You MUST output the resume in PROPER MARKDOWN FORMAT as shown below.

## REQUIRED MARKDOWN FORMAT:
- First line: # Full Name (with # symbol)
- Section headings: ## Section Name (with ## symbol)
- Job titles: **Job Title** — Company Name    Date Range
- Bullet points: - Start each point with dash
- Contact info: On separate lines after name

## STEP 1 — ANALYZE THE RESUME STRUCTURE
Before writing, study the base resume and identify:
- What is the exact order of sections? (e.g., Summary, Skills, Experience, Projects, Education)
- How is the header formatted? (name position, contact info layout)
- How are job entries formatted? (bold title, date position)
- How are bullet points written? (dash, star, or numbered)

## STEP 2 — TAILOR THE CONTENT
Rewrite the resume following these rules:
1. Keep EVERY section in the EXACT same order as the original
2. Use # for the name (first line only)
3. Use ## for ALL section headings (Summary, Technical Skills, Work Experience, Projects, Education, etc.)
4. Keep contact info format exactly as original
5. Use **bold** for job titles and company names
6. Place dates on the right side of job entries
7. Use - for ALL bullet points
8. Naturally weave keywords from the job description into bullet points
9. Add quantified metrics where they fit (%, numbers, impact)
10. Add missing keywords from job description to skills section

## STEP 3 — OUTPUT RULES (CRITICAL — do NOT break these)
- Output ONLY the tailored resume — nothing else before or after
- First line MUST be "# [Full Name]" (with # symbol)
- Do NOT add any "ATS Optimization Summary", "Keywords Added", or any preamble
- Do NOT add any commentary, explanations, or notes
- Do NOT add any new sections that weren't in the original
- Preserve ALL blank lines between sections
- Use proper markdown throughout

## EXAMPLE OF CORRECT FORMAT:
# John Doe
john@email.com | +1234567890 | City, Country
[LinkedIn](url) | [GitHub](url)

## Summary
Experienced software developer with 5+ years...

## Technical Skills
- React.js, Node.js, TypeScript
- Python, FastAPI, GraphQL
- AWS, Docker, CI/CD

## Work Experience
**Senior Developer** — Tech Corp    2022–Present
- Built scalable applications using React and TypeScript
- Increased performance by 40% through optimization
- Mentored 2 junior developers

**Software Engineer** — Startup Inc    2020–2022
- Developed REST APIs serving 10,000+ users
- Implemented CI/CD pipelines with Jenkins

## Projects
**E-commerce Platform** | React, Node.js, MongoDB
- Built full-stack application with secure authentication
- Deployed on AWS EC2 with 99.9% uptime

## Education
Master of Computer Applications - University    2023
Bachelor of Computer Applications - College    2021

## Certifications
- AWS Certified Developer
- Advanced Data Science Certification

---

### BASE RESUME:
${baseResume}

---

### JOB DESCRIPTION:
${jobDescription.substring(0, 6000)}

---

### OUTPUT:
Generate the tailored resume now (first line MUST be "# Name"):`;

        for (const modelName of modelsToTry) {
            try {
                console.log(`📡 Attempting tailoring with model: ${modelName} via Axios v1beta...`);
                // Revert to confirmed Axios format
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${trimmedKey}`;
                
                const response = await axios.post(apiUrl, {
                    contents: [{
                        parts: [{
                            text: enhancedPrompt
                        }]
                    }]
                });

                if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    tailoredResume = response.data.candidates[0].content.parts[0].text;
                    successfulModel = modelName;
                    break;
                }
            } catch (err) {
                const errMsg = err.response?.data?.error?.message || err.message;
                console.warn(`⚠️ Model ${modelName} failed:`, errMsg);
                lastError = err;
                continue;
            }
        }

        if (!tailoredResume) {
            throw lastError || new Error("All Gemini models failed to respond.");
        }

        console.log(`✅ Success! Tailored using: ${successfulModel}`);

        // ============================================
        // CLEAN THE RESUME - Remove any summary sections
        // ============================================

        // Remove any summary sections that might have been added
        tailoredResume = tailoredResume
            .replace(/###?\s*📊[\s\S]*?(?:\n\n|---|$)/gi, '')
            .replace(/###?\s*(ATS Optimization Summary|Optimization Summary|Keywords Added|ATS Score)[\s\S]*?(?:\n\n|---|$)/gi, '')
            .replace(/^Here'?s?\s+(your\s+)?(optimized|tailored|ats-optimized)\s+resume[:\s]*\n+/i, '')
            .trim();

        // Apply the cleanResumeContent function to remove any remaining summary
        tailoredResume = cleanResumeContent(tailoredResume);

        console.log("📝 After cleaning, resume length:", tailoredResume.length);
        console.log("📝 First 200 chars:", tailoredResume.substring(0, 200));

        // Verify keyword integration
        const keywordCheck = await verifyKeywordIntegration(tailoredResume, jobDescription);
        if (!keywordCheck.success) {
            console.warn("⚠️ Keyword integration needs improvement:", keywordCheck.missingKeywords);
        }

        console.log(`📊 ATS Coverage: ${keywordCheck.coverage.toFixed(2)}% - Found ${keywordCheck.foundKeywords.length} of ${keywordCheck.foundKeywords.length + keywordCheck.missingKeywords.length} keywords`);

        // Generate LaTeX code for the resume
        const latexCode = generateLatexFromResume(tailoredResume, user.name);

        // Generate PDF
        const pdfBuffer = await generateResumePDF(tailoredResume, user.name);

        // Save to resume history
        const resumeRecord = new ResumeHistory({
            userId: user._id,
            companyName,
            jobUrl,
            originalResume: baseResume,
            tailoredResume,
            latexCode
        });
        await resumeRecord.save();

        // After saving resumeRecord, add:
        await logActivity(user._id, user.name, 'RESUME_TAILORED', `Resume tailored for company: ${companyName}`, req);

        // Update analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { resumeTailorings: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        return res.status(200).json({
            tailoredResume,
            modelUsed: successfulModel,
            recordId: resumeRecord._id,
            pdfAvailable: true
        });

    } catch (error) {
        console.error("AI Tailor Error:", error.response?.data || error.message);
        return res.status(500).json({
            message: "An error occurred while communicating with Gemini API",
            error: error.response?.data?.error?.message || error.message
        });
    }
});

// Helper function to generate LaTeX from resume text
function generateLatexFromResume(resumeText, userName) {
    // Simple LaTeX template - in production, you'd want more sophisticated parsing
    return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{margin=1in}

\\begin{document}

\\begin{center}
\\textbf{\\Large ${userName}}
\\end{center}

${resumeText.split('\n').map(line => line.trim() ? `${line}\\\\` : '').join('\n')}

\\end{document}`;
}

// Helper function to verify keyword integration
async function verifyKeywordIntegration(tailoredResume, jobDescription) {
    const keywords = extractKeywords(jobDescription);
    const foundKeywords = [];
    const missingKeywords = [];

    for (const keyword of keywords) {
        if (tailoredResume.toLowerCase().includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    }

    return {
        success: missingKeywords.length < keywords.length * 0.3, // Allow 30% missing
        foundKeywords,
        missingKeywords,
        coverage: (foundKeywords.length / keywords.length) * 100
    };
}

// Helper function to extract keywords from job description
function extractKeywords(text) {
    // Extract common technical keywords
    const commonTech = [
        'React', 'Node.js', 'JavaScript', 'Python', 'MongoDB', 'Express',
        'REST API', 'AWS', 'Docker', 'Git', 'CI/CD', 'HTML', 'CSS', 'Tailwind',
        'TypeScript', 'Next.js', 'Redux', 'GraphQL', 'PostgreSQL', 'MySQL',
        'Vue', 'Angular', 'Flask', 'Django', 'Spring', 'Java', 'C++', 'C#',
        'Kubernetes', 'Jenkins', 'GitLab', 'GitHub', 'Azure', 'GCP', 'Firebase',
        'SQL', 'NoSQL', 'Microservices', 'DevOps', 'Linux', 'Windows',
        'Agile', 'Scrum', 'Kanban', 'Jira', 'Slack', 'Confluence',
        'API', 'JSON', 'XML', 'CRUD', 'SOLID', 'Design Patterns'
    ];

    const found = [];
    for (const tech of commonTech) {
        if (text.toLowerCase().includes(tech.toLowerCase())) {
            found.push(tech);
        }
    }

    return found;
}

// Profile Routes
app.get('/api/profile', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ message: "User not found" });

        res.json({ user });
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});

app.put('/api/profile', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { name, profile } = req.body;

        const updateFields = { name };
        if (profile) updateFields.profile = profile;

        const user = await User.findByIdAndUpdate(
            decoded.id,
            updateFields,
            { returnDocument: 'after', runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Failed to update profile" });
    }
});

app.get('/api/profile/resume-history', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const options = {
            page,
            limit,
            sort: { createdAt: -1 },
            populate: []
        };

        const result = await ResumeHistory.paginate({ userId: decoded.id }, options);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch resume history" });
    }
});

app.delete('/api/profile/resume-history/:recordId', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { recordId } = req.params;

        const record = await ResumeHistory.findOneAndDelete({
            _id: recordId,
            userId: decoded.id
        });

        if (!record) return res.status(404).json({ message: "Record not found" });

        res.json({ message: "Record deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete record" });
    }
});

app.put('/api/profile/resume-history/:recordId', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { recordId } = req.params;
        const updates = req.body;

        const record = await ResumeHistory.findOneAndUpdate(
            { _id: recordId, userId: decoded.id },
            updates,
            { returnDocument: 'after' }
        );

        if (!record) return res.status(404).json({ message: "Record not found" });

        res.json({ record });
    } catch (err) {
        res.status(500).json({ message: "Failed to update record" });
    }
});


app.get('/api/profile/download/:recordId', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { recordId } = req.params;

        // Fetch user to check role
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "User not found" });

        // Admins can download any record, regular users only their own
        let query = { _id: recordId };
        if (user.role !== 'admin') {
            query.userId = decoded.id;
        }

        const record = await ResumeHistory.findOne(query).populate('userId', 'name');

        if (!record) return res.status(404).json({ message: "Record not found" });

        console.log("📄 Generating PDF for record:", recordId);
        console.log("📝 Original resume length:", record.tailoredResume?.length);

        // CLEAN THE RESUME CONTENT - Remove ATS summary
        const cleanResume = cleanResumeContent(record.tailoredResume);
        console.log("📝 Cleaned resume length:", cleanResume.length);
        console.log("📝 First 100 chars after cleaning:", cleanResume.substring(0, 100));

        if (!cleanResume || cleanResume.length < 50) {
            throw new Error(`After cleaning, resume content is too short: ${cleanResume?.length} chars`);
        }

        // Use the simple PDF generator
        const pdfBuffer = await generateResumePDF(cleanResume, record.userId.name || 'User');

        console.log("✅ PDF generated, size:", pdfBuffer.length, "bytes");


        // Verify PDF has content
        if (pdfBuffer.length < 100) {
            throw new Error(`Generated PDF is too small: ${pdfBuffer.length} bytes`);
        }

        // Update analytics for downloads
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { downloads: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${record.companyName.replace(/[^a-z0-9]/gi, '_')}_resume.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.send(pdfBuffer);

    } catch (err) {
        console.error("❌ PDF Generation Error:", err);
        res.status(500).json({
            message: "Failed to generate PDF",
            error: err.message,
            stack: err.stack
        });
    }
});
// Admin Routes
const adminAuth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        if (!user || user.role !== 'admin') return res.status(403).json({ message: "Admin access required" });
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const options = {
            page,
            limit,
            sort: { createdAt: -1 },
            select: '-password'
        };

        const result = await User.paginate({}, options);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

app.put('/api/admin/users/:userId/block', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { isBlocked: true }, { returnDocument: 'after' });
        if (!user) return res.status(404).json({ message: "User not found" });
        // Log activity
        await logActivity(user._id, user.name, 'USER_BLOCKED', `User ${user.email} was blocked by admin`, req);
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Failed to block user" });
    }
});

app.put('/api/admin/users/:userId/unblock', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findByIdAndUpdate(userId, { isBlocked: false }, { returnDocument: 'after' });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Log activity
        await logActivity(user._id, user.name, 'USER_UNBLOCKED', `User ${user.email} was unblocked by admin`, req);
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Failed to unblock user" });
    }
});

app.delete('/api/admin/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentAdminId = req.user._id.toString();

        if (userId === currentAdminId) {
            return res.status(403).json({ message: "You cannot delete your own admin account" });
        }

        const userToDelete = await User.findById(userId);
        if (!userToDelete) return res.status(404).json({ message: "User not found" });

        // Delete user's resume records
        await ResumeHistory.deleteMany({ userId });

        // Delete User record
        await User.findByIdAndDelete(userId);

        // Log activity
        await logActivity(req.user._id, req.user.name, 'USER_DELETED', `Admin deleted user ${userToDelete.email}`, req);

        res.json({ message: "User and their data deleted successfully" });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ message: "Failed to delete user" });
    }
});

app.get('/api/admin/users/:userId/resumes', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const options = {
            page,
            limit,
            sort: { createdAt: -1 }
        };

        const result = await ResumeHistory.paginate({ userId }, options);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user resumes" });
    }
});

app.get('/api/admin/analytics', adminAuth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const analytics = await Analytics.find({ date: { $gte: startDate } })
            .sort({ date: 1 });

        const totalUsers = await User.countDocuments();
        const totalResumes = await ResumeHistory.countDocuments();
        const blockedUsers = await User.countDocuments({ isBlocked: true });

        res.json({
            analytics,
            summary: {
                totalUsers,
                totalResumes,
                blockedUsers,
                activeUsers: totalUsers - blockedUsers
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
});

// Track visitor analytics
app.post('/api/analytics/visit', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { visitors: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: "Failed to track visit" });
    }
});

// ============================================
// PUBLIC DOWNLOAD ENDPOINT (No authentication required)
app.get('/api/public/download/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;

        const record = await ResumeHistory.findOne({
            _id: recordId
        }).populate('userId', 'name');

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        console.log("📄 Public download for record:", recordId);

        const cleanResume = cleanResumeContent(record.tailoredResume);

        if (!cleanResume || cleanResume.length < 50) {
            throw new Error(`Resume content too short: ${cleanResume?.length} chars`);
        }

        const pdfBuffer = await generateResumePDF(cleanResume, record.userId?.name || 'User');

        console.log("✅ PDF generated, size:", pdfBuffer.length);

        // Update analytics for downloads
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { downloads: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // IMPORTANT: Disable caching to prevent 304 responses
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${record.companyName.replace(/[^a-z0-9]/gi, '_')}_resume.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(pdfBuffer);

    } catch (err) {
        console.error("❌ Public Download Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// Force fresh PDF generation (bypass cache)
app.get('/api/public/download-fresh/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;

        const record = await ResumeHistory.findOne({
            _id: recordId
        }).populate('userId', 'name');

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        console.log("📄 Fresh download for record:", recordId);

        const cleanResume = cleanResumeContent(record.tailoredResume);

        // Force fresh generation by adding a random query parameter
        const pdfBuffer = await generateResumePDF(cleanResume, record.userId?.name || 'User');

        console.log("✅ Fresh PDF generated, size:", pdfBuffer.length);

        // Update analytics for downloads
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await Analytics.findOneAndUpdate(
            { date: today },
            { $inc: { downloads: 1 } },
            { upsert: true, returnDocument: 'after' }
        );

        // Disable caching completely
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${record.companyName.replace(/[^a-z0-9]/gi, '_')}_resume.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(pdfBuffer);

    } catch (err) {
        console.error("❌ Fresh Download Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/debug/test-pdf-generation/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;

        const record = await ResumeHistory.findOne({
            _id: recordId
        }).populate('userId', 'name');

        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }

        console.log("🔧 Testing PDF generation for record:", recordId);

        const cleanResume = cleanResumeContent(record.tailoredResume);
        console.log("📝 Cleaned resume length:", cleanResume.length);

        // Try to generate PDF and catch any errors
        let pdfBuffer;
        try {
            pdfBuffer = await generateResumePDF(cleanResume, record.userId?.name || 'User');
            console.log("✅ PDF generated, size:", pdfBuffer.length);
        } catch (pdfError) {
            console.error("❌ PDF generation error:", pdfError);
            return res.status(500).json({
                error: "PDF generation failed",
                details: pdfError.message,
                stack: pdfError.stack
            });
        }

        // Send the PDF for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="test_${record.companyName}_resume.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);

    } catch (err) {
        console.error("❌ Test error:", err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});
// Get activity logs (admin only)
app.get('/api/admin/activity-logs', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const options = {
            page,
            limit,
            sort: { createdAt: -1 },
            populate: { path: 'userId', select: 'name email' }
        };

        const logs = await ActivityLog.paginate({}, options);

        res.json(logs);
    } catch (err) {
        console.error("Failed to fetch activity logs:", err);
        res.status(500).json({ message: "Failed to fetch activity logs", error: err.message });
    }
});
// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));