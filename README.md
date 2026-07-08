<div align="center">
  <h1>🎨 Collaborative Whiteboard App</h1>
  <p><strong>A real-time multi-user canvas application for seamless collaboration.</strong></p>

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](#)
  [![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](#)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](#)
</div>

---

## 🌟 Overview
The **Collaborative Whiteboard App** allows multiple users to draw, add sticky notes, and collaborate simultaneously in real time—similar to Miro, but fully self-hosted. It guarantees low-latency synchronization across all connected clients for a smooth and interactive experience.

---

## ✨ Key Features

- 🤝 **Real-Time Collaboration** — Draw alongside other users instantly with WebSockets.
- 🖱️ **Live Cursors** — See where other collaborators are pointing, marked with their names.
- 🧰 **Rich Toolkit** — Includes freehand pen, shapes (rectangles, circles, lines, text), and an eraser. Customize stroke colors and widths on the fly.
- 📝 **Sticky Notes** — Add, drag, edit, and color-code sticky notes anywhere on the workspace.
- ♾️ **Infinite Canvas** — Pan and zoom infinitely across a boundless digital workspace.
- 🔄 **Undo & Redo** — Fully supported per-user action history stack.
- 🎨 **Board Customization** — Dynamically change the board's background color (synced globally).
- 💬 **Chat & Presence** — Real-time text chat scoped to the room and a panel showing active users.
- 🔐 **Role-Based Access** — Granular permission levels: Owner, Editor, and Viewer.
- 💾 **Export & Auto-Save** — Automatically saves every 5 seconds. Download your board as a PNG with a single click.

---

## 🏗️ System Architecture

The core technical challenge involves keeping every action synchronized across all clients seamlessly.

- **🖥️ Client Layer:** Built with React for the UI. It utilizes the HTML5 Canvas API for high-performance rendering and `socket.io-client` for real-time networking.
- **⚙️ Server Layer:** Node.js and Express handle robust REST APIs. Socket.io manages real-time event broadcasting (`draw:stroke`, `cursor:move`, etc.).
- **🗄️ Data Layer:** MongoDB securely stores persistent data, including users, boards, strokes, sticky notes, and chat messages.

### 🧠 Advanced Technical Concepts

* **Prediction Smoothing:** Points are throttled and broadcast as volatile events to prevent jittering. A cubic bezier interpolation renders beautifully smooth curves.
* **Conflict Resolution:** Strokes are treated as immutable objects. Remote changes are tracked without stale closures, enabling seamless multi-user conflict resolution.
* **Infinite Viewport Matrix:** A mathematical transform matrix (`scale`, `panX`, `panY`) is applied before drawing, allowing infinite panning and zooming functionality.

---

## 🚀 Local Setup & Installation

### 📋 Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Docker (optional)

### 🛠️ Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aviral13102/Collaborative-Whiteboard.git
   cd Collaborative-Whiteboard
   ```

2. **Setup the Server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Add your MONGO_URI to the .env file
   npm run dev
   ```

3. **Setup the Client**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. **Access the App**
   Open your browser and navigate to `http://localhost:5173`.

---

## 🐳 Docker Deployment

This project includes a multi-stage `Dockerfile` and a `docker-compose.yml` for effortless containerized deployment.

```bash
# Build and run the app along with the database
docker-compose up --build -d
```
The application will be available on port `3001`.

---

## 👨‍💻 Author
**Aviral Singh** (23BBS0156)  
*3rd Year Computer Science Project*
