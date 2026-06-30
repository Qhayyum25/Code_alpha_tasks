# ⚡ Pulse — Full-Stack Social Media Platform

Pulse is a modern, full-stack social media web application built as part of my **CodeAlpha Internship (Task 2)**. It includes a complete authentication system, a real-time-style social feed, user profiles, follow/unfollow system, comments, likes, and a polished dark-themed UI with purple gradient accents — inspired by platforms like Twitter/X and Instagram.

![Tech Stack](https://img.shields.io/badge/stack-MERN--style-7c3aed)
![Status](https://img.shields.io/badge/status-active-success)

---

## 🚀 Features

- 🔐 **Authentication** — Secure Register/Login with JWT & bcrypt password hashing
- 📝 **Posts** — Create, delete, like, and comment on posts (with image URL support)
- 👥 **Follow System** — Follow/unfollow users, view followers & following counts
- 🔍 **Live Search** — Search users in real time
- 📰 **Feed** — Personalized feed (following) + Explore feed (all posts)
- 👤 **Profiles** — Editable bio & avatar, profile stats, tabbed sections (Posts, Replies, Media, Likes, Saved)
- 🔔 **Notifications Panel** — Mock UI for likes, comments, follows, mentions
- 💬 **Messages** — Mock real-time chat interface
- 📊 **Analytics Dashboard** — Posts/likes/followers overview with charts
- 🌗 **Dark / Light Mode** — Smooth theme toggle
- 📱 **Fully Responsive** — Mobile bottom nav + adaptive layouts

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|---------------------------------------|
| Frontend    | HTML5, CSS3, Vanilla JavaScript       |
| Backend     | Node.js, Express.js                   |
| Database    | SQLite (better-sqlite3)               |
| Auth        | JWT (jsonwebtoken) + bcryptjs         |
| Styling     | Custom CSS (dark theme, purple gradient, glassmorphism) |

---

## 📂 Project Structure
task2-code-alpha/
├── public/
│   ├── index.html        # Login / Register page
│   ├── feed.html          # Main feed & dashboard
│   ├── profile.html       # User profile page
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       ├── feed.js
│       └── profile.js
├── server/
│   ├── index.js           # Express app entry point
│   ├── db.js               # SQLite database setup
│   ├── middleware/
│   └── routes/
│       ├── auth.js
│       ├── posts.js
│       └── users.js
├── seed.js                 # Mock data seeder
├── package.json
└── README.md

---

## ⚙️ Installation & Setup

1. **Clone the repository**
```bash
   git clone https://github.com/Qhayyum25/task2-code-alpha.git
   cd task2-code-alpha
```

2. **Install dependencies**
```bash
   npm install
```

3. **(Optional) Seed mock data**
```bash
   node seed.js
```

4. **Run the server**
```bash
   npm start
```

5. **Open in browser**
http://localhost:3000

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:
JWT_SECRET=your_secret_key_here
PORT=3000

---

---

## 👨‍💻 Author

**Mohammad Qhayyum**
B.Tech CSE, Kakatiya Institute of Technology and Science (KITSW)
📧 mohammadqhayyum2004@gmail.com
🔗 [GitHub](https://github.com/Qhayyum25)

---

## 📄 License

This project was built for educational purposes as part of the **CodeAlpha Internship Program**.
Save this as README.md in your project root, then push to GitHub.
