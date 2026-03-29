# 🚀 ResumeSync: AI-Powered Professional Resume Tailor

![ResumeSync Banner](https://img.shields.io/badge/AI-Gemini-blue?style=for-the-badge&logo=google)
![ResumeSync Banner](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=nodedotjs)
![ResumeSync Banner](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![ResumeSync Banner](https://img.shields.io/badge/Design-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss)

**ResumeSync** is a premium SaaS-grade platform designed to revolutionize the way job seekers approach applications. By leveraging cutting-edge AI and automated scraping, ResumeSync helps users tailor their resumes to match specific job descriptions with precision, increasing the chances of clearing Applicant Tracking Systems (ATS) and landing interviews.

---

## ✨ Key Functionalities

### 🧠 1. AI-Driven Resume Tailoring
- **Gemini AI Integration**: Uses Google's Gemini API to analyze the base resume against a job description.
- **ATS Optimization**: Automatically adds missing keywords, highlights relevant skills, and rephrases experiences to align with job requirements.
- **Context-Aware Mapping**: Intelligent mapping of user achievements to the employer's specific needs.

### 🌐 2. Integrated Job Description Scraper
- **Automated Scraping**: Powered by **Puppeteer** and **Cheerio**, users can simply paste a job link (LinkedIn, Indeed, etc.).
- **Smart Parsing**: Automatically extracts job titles, company names, and full descriptions, eliminating manual copy-pasting.

### 📄 3. Professional PDF Engine
- **Dedicated Rendering Pipeline**: Uses a headless Puppeteer instance to generate clean, high-performance, and ATS-compliant PDFs.
- **Intelligent Formatting**: Preserves professional layouts, bullet points, and headers through a custom-built HTML-to-PDF engine.
- **Download & History**: Every tailored resume is archived for easy retrieval and redownloading.

### 🔐 4. Enterprise-Grade Authentication
- **Secure Sessions**: Uses **JWT (JSON Web Tokens)** stored in **HttpOnly Secure Cookies** for maximum protection against XSS and CSRF.
- **Token Rotation**: Implements a robust refresh token mechanism for persistent yet secure sessions.
- **Password Recovery**: Integrated OTP-based (One-Time Password) reset system using `nodemailer`.

### 🛡️ 5. Advanced Admin Dashboard
- **Real-Time Analytics**: Monitor visitor counts, registration rates, and tailoring activities globally.
- **User Management**: Unified interface to view, block, or manage user accounts.
- **System Activity Logs**: Detailed tracking of system-wide actions for security and debugging.

### 🎨 6. Premium UI & UX
- **Modern Design**: Built with **Inter** and **Outfit** typography for a professional, high-end look.
- **Dark Mode Support**: Proactive dark mode theme for a comfortable user experience across devices.
- **Responsive Layouts**: Fully optimized for mobile, tablet, and desktop viewing.

---

## 🛠️ Technology Stack

### **Frontend**
- **React 18**: Component-based UI library.
- **Redux Toolkit**: Centralized state management for authentication and app state.
- **Tailwind CSS v4 & DaisyUI**: Modern styling with utility-first productivity.
- **Axios**: Promised-based HTTP client for API communication.

### **Backend**
- **Node.js & Express**: High-performance runtime and framework.
- **MongoDB & Mongoose**: Flexible NoSQL database with robust ODM.
- **Puppeteer**: Headless browser automation for scraping and PDF generation.
- **Google Generative AI**: Powering the resume tailoring engine.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Atlas or Local instance)
- **Google AI API Key** (for Gemini)

### 1. Clone the repository
```bash
git clone https://github.com/Baibhav100/resumeSync.git
cd resumeSync
```

### 2. Configure Backend
Navigate to the `server` directory and create a `.env` file:
```bash
cd server
npm install
```

**Required environment variables:**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_google_ai_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
ADMIN_CREATION_KEY=your_secure_admin_creation_key
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
```

### 3. Configure Frontend
Navigate to the `client` directory and create a `.env` file:
```bash
cd ../client
npm install
```

**Frontend environment variables:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
```bash
cd ../client
npm install
npm run dev
```

---

## 📊 Project Structure

```text
resume_sync/
├── client/                # React Frontend
│   ├── src/
│   │   ├── component/     # UI Components (Auth, Dashboard, etc.)
│   │   ├── slices/        # Redux State Management
│   │   ├── App.jsx        # Routing and Layout
│   │   └── index.css      # Global Styles & Typography
├── server/                # Express Backend
│   ├── index.js           # Core Server Logic & Routes
│   ├── .env               # Sensitive Credentials (Local)
│   └── error.log          # System Logs
└── README.md              # Project Documentation
```

---

## 🤝 Contributing
Contributions are welcome! If you have suggestions for new features or find bugs, feel free to open an issue or submit a pull request.

---

## 📄 License
This project is licensed under the **ISC License**.

---

**Built with ❤️ for Job Seekers by Baibhav100**
