# StreamEd

StreamEd is a modern, real-time, peer-to-peer academic networking and live-streaming platform. It is designed to connect students, tutors, and lifelong learners by enabling them to discover peers, participate in community discussions, schedule study sessions, and host or join high-quality live interactive streams.

---

## 🌟 Key Features

### 1. **Live Study Streams (Powered by LiveKit)**
- **Host Studio:** A professional, dark-mode streaming dashboard where you can broadcast your camera and share your screen simultaneously.
- **Interactive Chat:** Real-time WebSockets chat (powered by Socket.io) allows viewers and hosts to communicate instantly.
- **Dynamic Quality:** Viewers can adjust their stream quality (720p, 1080p, 1440p) to match their network constraints.

### 2. **Peer Discovery & Networking**
- **Find a Peer:** Browse through a directory of registered users. Filter by subjects, see their ratings, and send direct peer requests.
- **Real-Time Live Status:** If a peer is currently hosting a live stream, their profile card glows red with a pulsing "LIVE" badge, allowing you to jump straight into their room.
- **Subjects Explorer:** A beautiful, dynamic grid highlighting academic categories (Engineering, Mathematics, Sciences, etc.) with real-time statistics on how many tutors are available.

### 3. **Community Forums**
- **Discussions:** Start new threads, ask questions, or share resources with tags.
- **Engagement:** Like threads and reply to other users' posts.
- **Formatting:** Clean, readable UI that handles large blocks of text effortlessly.

### 4. **Dashboard & Scheduling**
- **Analytics:** Track your karma, average rating, and total viewers.
- **Upcoming Sessions:** Keep track of scheduled study sessions and get reminders.

---

## 🛠️ Technology Stack

**Frontend:**
- React 18 (via Vite)
- Tailwind CSS (for rapid, responsive UI styling)
- Lucide React (for crisp SVG icons)
- LiveKit Components (`@livekit/components-react`)

**Backend:**
- Node.js & Express.js
- Socket.io (for real-time chat and signaling)
- LiveKit Server SDK (`livekit-server-sdk`)
- JSON Web Tokens (JWT) for secure authentication

**Database:**
- PostgreSQL (via `pg` driver) for robust, production-ready data storage.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally or a cloud instance like Render/Supabase)
- A [LiveKit](https://livekit.io/) Cloud project (or local instance)

### 1. Environment Configuration
Create a `.env` file in the root directory of the project and add the following variables:

```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
DATABASE_URL=postgresql://user:password@localhost:5432/streamed

# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 2. Installation
Install the dependencies for both the backend and the frontend.

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 3. Running the Application
The project requires you to run both the backend Express server and the frontend Vite dev server.

**Start the Backend:**
```bash
# From the root directory
npm run dev
```
*Note: The backend will automatically connect to your PostgreSQL database and seed the initial community forum data.*

**Start the Frontend:**
```bash
# From the frontend directory
npm run dev
```

Visit `http://localhost:5173` in your browser to view the application!

---

## 📖 How to Use the Website

1. **Sign Up / Log In:** Create an account to access the platform. Your profile will instantly be added to the "Find a Peer" directory.
2. **Explore Subjects:** Navigate to the **Subjects** tab to see which academic fields currently have active peers.
3. **Find a Peer:** Go to the **Find a Peer** page. If you see a user with a red glowing "LIVE" border, click "Watch Live Stream" to join their session!
4. **Host a Stream:** 
   - Click the **Host Studio** (video camera) icon in the navigation bar.
   - Configure your Stream Title, Category, and Tags in the left panel.
   - Test your microphone and camera in the preview window.
   - Click **Go Live Now** to start broadcasting to the world.
5. **Engage in the Community:** Jump into the **Community** tab to ask a question about your coursework or help answer someone else's thread.

---

## Link
https://streamed-vvrc.onrender.com/

## 📝 License
This project is proprietary and built for educational networking purposes.
