# 🧠 Easy Hunt — Property Document Intelligence Platform

Easy Hunt is a modern AI-assisted property research platform that helps lawyers, title consultants, banks, and real-estate professionals quickly search, verify, and export government-sourced property records.

The system provides keyword-based search, structured results, secure processing, and document exports — all through a fast and clean web interface.

---

## 🚀 Tech Stack

### Frontend

* React + Vite
* TypeScript
* TailwindCSS
* Framer Motion (animations)
* Lucide React Icons

### Backend

* Python
* Flask API
* Gunicorn (production server)
* PostgreSQL / SQLite (configurable)

### Deployment

* AWS EC2 (Ubuntu)
* Nginx reverse proxy
* HTTPS Ready

---

## 📁 Project Structure

```
easy-hunt/
│
├── frontend/                → React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/                 → Flask backend API
│   ├── app.py
│   ├── routes/
│   ├── models/
│   └── requirements.txt
│
├── nginx/
├── .env
└── README.md
```

---

## ⚙️ Local Installation Guide

> Requirements:

* Node.js 18+
* Python 3.10+
* Git

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/easy-hunt.git
cd easy-hunt
```

---

## 🖥️ Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

```
http://localhost:5173
```

---

## 🧪 Backend Setup (Flask)

### Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### Activate Environment

**Windows**

```
venv\Scripts\activate
```

**Linux / Mac**

```
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Server

```bash
python app.py
```

Backend will run at:

```
http://127.0.0.1:5000
```

---

## 🔗 Connect Frontend to Backend

Inside `frontend/.env` create:

```
VITE_API_URL=http://127.0.0.1:5000
```

Restart frontend:

```bash
npm run dev
```

---

## 🌍 Production Deployment (AWS EC2 — Ubuntu)

### Install Packages

```bash
sudo apt update
sudo apt install python3-pip python3-venv nginx -y
```

---

### Backend Production Run (Gunicorn)

```bash
cd backend
source venv/bin/activate
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

### Setup Nginx

Create config:

```bash
sudo nano /etc/nginx/sites-available/easyhunt
```

Paste:

```
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/easyhunt /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔐 Environment Variables

Create `.env` inside backend:

```
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///easyhunt.db
```

---

## 🧾 Features

* Keyword-based property search
* Structured document results
* Government record referencing
* PDF & Excel export
* Fast due diligence workflow
* Secure processing
* Responsive modern UI
* Animated SaaS landing page

---

## 🛠️ Common Problems

### CORS Error

Install:

```bash
pip install flask-cors
```

Add in `app.py`:

```python
from flask_cors import CORS
CORS(app)
```

---

### Port Already in Use

```bash
sudo lsof -i :5000
kill -9 PID
```

---

## 📦 Build Frontend

```bash
cd frontend
npm run build
```

Output folder:

```
frontend/dist
```

---

## 👨‍💻 Author

**Chaitanya**

---

## 📄 License

This project is for educational and commercial use.

---

## ⭐ Support

If you like this project:

* Star the repository
* Share with developers
* Contribute improvements

---
