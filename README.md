# Subash Jeyaraj — Portfolio

## Files
- `index.html`, `style.css`, `script.js`: portfolio frontend
- `images/`: existing project preview images
- `server.js`, `db.js`: optional Express/MySQL contact backend
- `.env.example`: configuration template (copy to `.env` and fill in your own values)

## Before publishing
1. Add your resume PDF as `resume/Subash-J-Resume.pdf`.
2. Add your certificate PDF as `certificates/Data-Analytics-Python.pdf`, or update the link in `index.html`.
3. Replace each “Browse repositories” link with the exact project repository URL when you confirm the repository names. Current links open your GitHub repositories list rather than claiming to be a specific repo.
4. Review the project descriptions and edit any details that do not match your implementation.
5. Update the LinkedIn URL in `index.html` if your public profile URL is different.

## Run locally
1. Install a current Node.js LTS release.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in database/email configuration. Never commit `.env`.
4. Run `npm start`, then open `http://localhost:5000`.

`node_modules`, the uploaded `.env`, and stored contact submissions were not included in this updated ZIP. This avoids shipping dependencies, private configuration/secrets, or personal messages. The deployed contact form requires the Express backend and correct environment configuration; static hosting alone uses the email-app fallback.
