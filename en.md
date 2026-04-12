# How I Built My Own To-Do App from Scratch (And You Can Too!)

> A beginner-friendly guide to building a full-stack task management web application — no CS degree required.

## 🤔 Why Build Your Own?

You've probably used apps like Microsoft To Do, Todoist, or Apple Reminders. They're great — but what if you could build one yourself? Not just for fun, but to actually **learn how modern web applications work** under the hood.

That's exactly what I did. In this article, I'll walk you through how I built **MyTODO** — a full-featured task management app — from scratch, and explain every concept along the way.

---

## 📸 What Does It Look Like?

MyTODO looks and feels like a real productivity app:

- 📋 **Multiple lists** (Work, Personal, Shopping, etc.) — just like Microsoft To Do
- ✅ **Full task management** — create, edit, complete, delete tasks
- 🎯 **Priority levels** — High, Medium, Low
- 📅 **Due dates and times**
- 🖱️ **Drag and drop** — move tasks between lists with your mouse
- 📱 **Mobile friendly** — works on any screen size
- 🔔 **Smart reminders** — get notified via Telegram or Email before tasks are due
- 🔐 **User accounts** — login with username and password, your data stays private

---

## 🧱 The Building Blocks (Don't Worry, I'll Explain Everything)

Before we dive in, let me explain the key technologies. Think of building a web app like building a house:

### Frontend — The "Facade" (What Users See)

| Technology | What It Does | Think of It As... |
|---|---|---|
| **React** | Builds interactive UI components | The walls, windows, and doors |
| **Vite** | Fast development tool | The power tools that make building faster |
| **Tailwind CSS** | Makes things look good without writing much CSS | Interior design in a box |
| **@dnd-kit** | Drag and drop functionality | The furniture you can rearrange |

### Backend — The "Engine Room" (Behind the Scenes)

| Technology | What It Does | Think of It As... |
|---|---|---|
| **Node.js** | Runs JavaScript on the server | The electricity that powers everything |
| **Express** | Handles web requests | The receptionist who routes requests |
| **SQLite** | Stores data in a file | A filing cabinet |
| **JWT** | Secure user authentication | A VIP wristband at an event |

### Deployment — Putting It on the Internet

| Technology | What It Does |
|---|---|
| **Linux (WSL2)** | The server environment |
| **Systemd** | Keeps the app running 24/7 |
| **Cloudflare Tunnel** | Gives your app a public URL without opening ports |
| **HTTPS** | Encrypts data between users and your server |

---

## 🏗️ How the App Works (Architecture Simplified)

```
┌─────────────┐         ┌─────────────┐         ┌──────────┐
│   Browser    │ ──WiFi──▶│   Server    │ ──read──▶│  SQLite  │
│  (Frontend)  │◀──WiFi──│  (Backend)  │◀─write──│ Database │
└─────────────┘         └──────┬──────┘         └──────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼                     ▼
              ┌──────────┐         ┌──────────┐
              │ Telegram  │         │  Email   │
              │  (Bot)    │         │ (SMTP)   │
              └──────────┘         └──────────┘
```

**Here's what happens when you open the app:**

1. Your browser loads the React frontend (the pretty UI)
2. When you create a task, React sends a message to the Express server
3. The server checks your JWT token (are you logged in?)
4. The server saves the task to the SQLite database
5. When a task is due, the server sends you a reminder via Telegram or Email

---

## 📂 Project Structure (What Files Do What)

```
MyTODO/
├── server/                  # Backend (the brain)
│   ├── index.js             # Main entry point — starts the server
│   ├── db.js                # Database setup — creates tables
│   ├── routes/
│   │   ├── auth.js          # Login/Register logic
│   │   ├── lists.js         # List management (CRUD)
│   │   └── tasks.js         # Task management (CRUD)
│   ├── services/
│   │   └── notifier.js      # Telegram + Email notifications
│   ├── middleware/
│   │   └── auth.js          # JWT token verification
│   └── tests/               # Automated tests (94.69% coverage!)
│
├── client/                  # Frontend (the face)
│   └── src/
│       ├── App.jsx          # Main app component
│       ├── api/index.js     # Talks to the backend
│       ├── components/
│       │   ├── Dashboard.jsx    # Main screen with lists & tasks
│       │   ├── Login.jsx        # Login/Register page
│       │   ├── TaskModal.jsx    # Task creation/editing popup
│       │   └── Settings.jsx     # User settings
│       ├── hooks/index.js   # Reusable logic (custom React hooks)
│       ├── theme.jsx        # Dark/Light theme
│       └── i18n.jsx         # Multi-language support (EN/中文)
│
├── deploy.sh                # One-click deployment script
└── mytodo.service           # Systemd service (auto-start on boot)
```

---

## 🔑 Key Concepts Explained

### 1. Client-Server Model
Think of it like a restaurant:
- **Client (Browser)** = You, looking at the menu and placing orders
- **Server (Backend)** = The kitchen, preparing your food
- **API** = The waiter who carries orders between you and the kitchen

### 2. REST API
The "waiter" uses a standard language called REST:
- `GET /api/tasks` → "Show me all my tasks"
- `POST /api/tasks` → "Create a new task"
- `PUT /api/tasks/123` → "Update task #123"
- `DELETE /api/tasks/123` → "Delete task #123"

### 3. JWT Authentication
When you log in, the server gives you a **token** (like a wristband at a club). Every time you make a request after that, you show the token. The server checks it and says "OK, you're allowed in."

### 4. Database (SQLite)
Unlike big databases (MySQL, PostgreSQL), SQLite stores everything in a **single file** (`mytodo.db`). It's perfect for personal projects — no separate database server needed!

---

## 🧪 Testing: Why 94.69% Coverage Matters

I wrote **83 automated tests** that cover almost every line of code. Why?

- **Confidence**: If I change something and a test breaks, I know immediately
- **Documentation**: Tests show exactly how the code should behave
- **Professional practice**: In real companies, tests are mandatory

Example test:
```javascript
test('should create a new task', async () => {
  const response = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Buy groceries',
      list_id: listId,
      priority: 'high',
      due_date: '2026-04-15'
    });
  
  expect(response.status).toBe(201);
  expect(response.body.title).toBe('Buy groceries');
});
```

---

## 🖥️ Development Environment

This entire project was built through conversations with an **AI assistant** running on [OpenClaw](https://github.com/openclaw/openclaw). Here's exactly what the setup looked like:

| Component | Details |
|---|---|
| **Host OS** | Windows 11 + WSL2 (Ubuntu 24.04) |
| **AI Platform** | OpenClaw 2026.3.28 → 2026.4.10 |
| **AI Model** | GLM-4 (via z.ai) + local Gemma models |
| **Communication** | Telegram (chatting with the AI to write code) |
| **Editor** | None — all code was written by the AI assistant |
| **Deployment Target** | AppServer WSL (Ubuntu, IP: 172.31.254.165) |
| **Public Domain** | `first.pet` (via Cloudflare Tunnel) |

**What does this mean?** I didn't open VS Code or any IDE. I described what I wanted in plain language through Telegram, and the AI wrote, tested, and deployed the code for me. If you can describe what you want, you can build it too.

---

## 💬 The Prompts I Used (Step-by-Step Reproduction Guide)

Here are the actual prompts I sent to my AI assistant to build MyTODO from zero to production. You can follow these exact prompts with any capable AI coding assistant to reproduce the project.

### Phase 1: Foundation

**Prompt 1 — Initial Request:**
> I want to build a to-do list web application similar to Microsoft To Do. The tech stack should be:
> - Backend: Node.js + Express + SQLite + JWT authentication
> - Frontend: React + Vite + Tailwind CSS
> - Notifications: Telegram Bot + Email (Nodemailer)
> 
> Features needed:
> - User registration and login
> - Multiple task lists (e.g., Work, Personal, Shopping)
> - Task CRUD with title, description, priority (high/medium/low), due date/time
> - Drag and drop sorting
> - Telegram and email reminders when tasks are due
> 
> Create the project structure and implement the backend first.

**Prompt 2 — Frontend Setup:**
> Now create the React frontend with:
> - A modern login/register page
> - A dashboard with a sidebar showing all lists
> - Task cards that can be dragged between lists
> - A modal for creating/editing tasks with all fields
> - Tailwind CSS for styling, dark theme by default

**Prompt 3 — Connect Frontend to Backend:**
> Create the API layer in the frontend to connect to the backend:
> - Auth API (login, register, token management)
> - Lists API (CRUD for lists)
> - Tasks API (CRUD for tasks)
> - Handle JWT tokens in localStorage
> - Error handling and loading states

### Phase 2: Polish & Features

**Prompt 4 — UI Enhancements:**
> Add these UI improvements:
> - Sidebar should be collapsible (toggle button)
> - Each list gets a random colorful icon (30 unique options)
> - Add "All Tasks" view showing tasks from all lists
> - Add "Today" filter showing tasks due today
> - Add "Completed" section for finished tasks
> - Dragging a task to a different list should change its list_id

**Prompt 5 — Multi-language Support:**
> Add internationalization (i18n) to the app:
> - Support English and Traditional Chinese (zh-TW)
> - Add a language toggle in the settings
> - Create locale files for all UI text

### Phase 3: Testing & Quality

**Prompt 6 — Automated Testing:**
> Write comprehensive tests for the backend:
> - Test all auth routes (register, login, invalid credentials)
> - Test all CRUD operations for lists and tasks
> - Test authorization (users can only access their own data)
> - Test edge cases (empty fields, duplicate names, invalid IDs)
> - Use Jest + Supertest
> - Target 90%+ code coverage

### Phase 4: Deployment

**Prompt 7 — Deployment Script:**
> Create a deployment script that:
> - Installs all dependencies (npm install for both client and server)
> - Builds the React frontend for production
> - Creates a systemd service file so the app starts on boot
> - The server should serve the built frontend in production mode
> - Use port 3001

**Prompt 8 — Cloudflare Tunnel:**
> Help me set up a Cloudflare Tunnel to make the app publicly accessible:
> - I have the domain `first.pet` on Cloudflare
> - I want the subdomain `mytodo.first.pet`
> - Set up a named tunnel (not quick tunnel)
> - Create a systemd service for the tunnel so it auto-starts

### Phase 5: Iteration

**Prompt 9 — Bug Fixes & Tweaks:**
> Fix these issues:
> - When a task is moved to another list via drag-and-drop, it should disappear from the old list immediately (not on refresh)
> - The task count in each list should update in real-time
> - Add a confirmation dialog before deleting a list

### 🔄 Prompt Writing Tips

Based on my experience, here's what makes a good prompt for building software:

1. **Be specific about the tech stack** — Don't say "make a web app." Say "use React + Express + SQLite."
2. **Define features clearly** — List them out as bullet points
3. **Build in phases** — Don't ask for everything at once. Backend → Frontend → Integration → Polish → Deploy.
4. **Iterate** — After seeing the result, refine. "Fix this bug" or "Add this feature" is perfectly valid.
5. **Test as you go** — Ask the AI to write tests early. It catches bugs before they become problems.

---

## 🤖 What the AI Actually Did

For each prompt, the AI assistant:
1. Created the necessary files and wrote all the code
2. Ran `npm install` to install dependencies
3. Executed the tests and reported coverage
4. Deployed to the server via SSH
5. Set up systemd services for 24/7 uptime
6. Configured Cloudflare Tunnel for public access

**I never opened a code editor. I never typed a single line of code.** I just described what I wanted, and the AI made it happen.

---

## 🌐 How I Deployed It to the Internet

### The Problem
My app runs on a home server. How do I make it accessible from anywhere without paying for cloud hosting?

### The Solution: Cloudflare Tunnel
```
Your Phone ──▶ Cloudflare CDN ──▶ Tunnel ──▶ Your Home Server
              (mytodo.first.pet)             (behind NAT/router)
```

Cloudflare Tunnel creates a secure connection from my server to Cloudflare's global network. No need to:
- Open ports on my router (security risk!)
- Buy a static IP address
- Configure SSL certificates manually

### Step by Step
1. Install `cloudflared` on the server
2. Create a tunnel: `cloudflared tunnel create mytodo`
3. Configure it to point to `localhost:3001`
4. Assign a domain: `mytodo.first.pet`
5. Set up systemd service so it starts on boot
6. Done! The app is now accessible worldwide via HTTPS 🎉

---

## 💡 Lessons Learned

### What Went Well
- **Start simple, iterate**: I didn't try to build everything at once. First: basic CRUD. Then: drag-and-drop. Then: notifications.
- **Test as you go**: Writing tests alongside code saved me countless debugging hours
- **SQLite is underrated**: For personal projects, it's all you need

### What I'd Do Differently
- **Plan the database schema earlier**: I had to migrate data when I added new features
- **Mobile-first design**: I built for desktop first and had to fix mobile later
- **Error handling**: I should have planned for "what could go wrong" from the start

---

## 🚀 Try It Yourself

If you want to build something similar, here's my recommended learning path:

1. **Learn HTML/CSS/JavaScript basics** (free: [MDN Web Docs](https://developer.mozilla.org))
2. **Learn React** (free: [React official tutorial](https://react.dev/learn))
3. **Learn Node.js + Express** (free: [The Odin Project](https://www.theodinproject.com))
4. **Build a simple CRUD app** (a to-do list is perfect!)
5. **Add features one at a time** (authentication, notifications, etc.)
6. **Deploy it** (Cloudflare Tunnel is free and beginner-friendly)

---

## 📊 Project Stats

| Metric | Value |
|---|---|
| Total lines of code | ~3,000+ |
| Test coverage | 94.69% |
| Number of tests | 83 |
| Tech stack | React, Node.js, Express, SQLite |
| Deployment | Self-hosted + Cloudflare Tunnel |
| Public URL | https://mytodo.first.pet/ |

---

## 🙌 Final Thoughts

Building this app taught me more than any tutorial ever could. There's something magical about using something you built yourself every day.

The best part? **None of this requires a computer science degree.** All the resources are free, the tools are open-source, and the only investment is your time and curiosity.

If a beginner can build this, so can you. Start small, keep building, and don't be afraid to break things — that's how you learn! 💪

---

*Built with ❤️ by [Denvy Shi](https://github.com/Denvy-Shi)*
*Source code available at: [GitHub](https://github.com/Denvy-Shi/MyTODO)*
