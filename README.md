# SkillSphere 🪐 — Immersive 3D Learning Management System

SkillSphere is an enterprise-grade Digital Learning Workspace featuring a cinematic 3D frontend powered by **Three.js WebGL**, **GSAP animations**, and **Chart.js analytics**, backed by a secure **Spring Boot 3 + MySQL** REST API.

> **Demo mode**: The frontend works fully out-of-the-box with localStorage mock data — no backend required to explore the UI.

---

## ✨ Features

- **3D Interactive Background** — Rotating wireframe globe with constellation particles via Three.js
- **Role-Based Access** — Student, Trainer, and Administrator portals with different views
- **Student Portal** — Course catalog, progress tracking, quiz engine with countdown timer, PDF certificate downloads
- **Trainer Portal** — Create courses, review assignment queue, grade submissions with feedback
- **Admin Command Center** — User registry, role management, audit trail
- **Discussion Forum** — Thread creation and community feed
- **Quiz Engine** — Per-question countdown timer, score tracking, confetti celebration on completion
- **Chart.js Dashboards** — Weekly activity line charts, animated progress bars
- **GSAP Page Transitions** — Smooth enter animations and 3D scene transitions per route

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vite, Vanilla JS (ES Modules), Three.js, GSAP, Chart.js, Tailwind CSS v4 |
| **Backend** | Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Maven |
| **Database** | MySQL 8 |
| **Auth** | Stateless JWT (BCrypt), Google OAuth 2.0, GitHub OAuth |
| **Certificates** | PDF generation via OpenPDF/iText |
| **Containers** | Docker + Docker Compose |

---

## 📁 Project Structure

```text
skillsphere/
├── docker-compose.yml       # Orchestrates DB + Backend
├── README.md
├── database/
│   ├── schema.sql           # MySQL schema
│   └── data.sql             # Seed data (users, courses)
├── backend/                 # Spring Boot 3 REST API
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/skillsphere/
│       ├── controller/      # REST endpoints
│       ├── service/         # Business logic
│       ├── entity/          # JPA entities
│       ├── repository/      # Spring Data repos
│       ├── dto/             # Request/Response DTOs
│       └── security/        # JWT filter chain
└── frontend/                # Vite SPA
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.js          # Router + all view logic
        ├── style.css        # Global design tokens
        ├── components/
        │   ├── ThreeCanvas.js   # WebGL 3D background
        │   └── Charts.js        # Chart.js wrappers
        └── services/
            └── api.js           # API layer (mock + real)
```

---

## 🚀 Quick Start (Frontend Only — Mock Mode)

No backend required. The frontend ships with full mock data via localStorage.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| 👨‍🎓 Student | `student@skillsphere.com` | `password123` |
| 👨‍🏫 Trainer | `trainer@skillsphere.com` | `password123` |
| ⚙️ Admin | `admin@skillsphere.com` | `password123` |

> In mock mode, the password field is not validated — any value works.

---

## 🐳 Full Stack via Docker Compose

```bash
docker-compose up --build
cd frontend && npm install && npm run dev
```

Visit **http://localhost:5173**. The Spring Boot API runs on **:8080**.

---

## 🔧 Manual Local Setup

### 1. Database

```sql
CREATE DATABASE skillsphere;
```

```bash
mysql -u root -p skillsphere < database/schema.sql
mysql -u root -p skillsphere < database/data.sql
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run
# Starts on http://localhost:8080
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Starts on http://localhost:5173
```

> Set `useMock = false` in `frontend/src/services/api.js` to connect to the live backend.

---

## 🔐 Environment Variables

The backend requires `application.properties` or environment variables:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/skillsphere
spring.datasource.username=root
spring.datasource.password=yourpassword
app.jwt.secret=your-256-bit-secret
```

---

## 📸 Screenshots

> Landing page with interactive Three.js globe, role-based dashboards, quiz engine, and certificate portal.

---

## 📄 License

MIT License — free to use, modify, and distribute.
