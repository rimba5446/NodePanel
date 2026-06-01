# Node.js Dashboard Panel

A secure, web-based dashboard panel for managing Node.js services (via PM2) and local file editing, built with a modern React frontend and an Express.js backend.

## Features

- **Service Management**: Start, stop, restart, and monitor Node.js applications managed by PM2.
- **System Metrics**: Visual representation of service metrics (CPU, Memory) using Recharts.
- **File Manager**: Built-in file explorer with editing capabilities restricted to a specific directory for security.
- **Code Editor**: Integrated Monaco Editor for a VS Code-like coding experience directly in the browser.
- **Authentication**: Secure login system using JWT and MongoDB.
- **Responsive UI**: Modern, responsive user interface built with Tailwind CSS.

## Tech Stack

### Frontend (Client)
- React 19
- Vite
- Tailwind CSS v4
- React Router DOM
- Recharts (Data Visualization)
- Monaco Editor (Code Editor)
- Lucide React (Icons)
- Axios

### Backend (Server)
- Node.js
- Express.js
- Mongoose (MongoDB)
- PM2 (Process Management)
- JWT (JSON Web Tokens)
- bcrypt (Password Hashing)

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v18 or higher recommended)
- MongoDB instance (Local or Atlas)
- PM2 installed globally (`npm install -g pm2`)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the `server` directory (see [Environment Variables](#environment-variables) section below) and configure it.

Start the backend server (in development mode):
```bash
npm run dev
```
*(The server will run on `http://localhost:5000` by default)*

### 3. Frontend Setup

Open a new terminal and navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```
*(The client will run on `http://localhost:5173` by default)*

## Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
ALLOWED_FILE_DIR=path/to/allowed/directory/for/editing
```
*Note: Set `ALLOWED_FILE_DIR` to an absolute path on your system to restrict the built-in file editor for security reasons.*

## Usage

1. Access the dashboard via your browser (usually `http://localhost:5173`).
2. Log in using your registered credentials.
3. Manage your PM2 services from the main dashboard.
4. Use the File Manager tab to edit files within the designated `ALLOWED_FILE_DIR`.

## License

This project is licensed under the MIT License.
