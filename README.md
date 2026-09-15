````markdown
# Robo Rally Web

A real-time, web-based multiplayer clone of the board game **Robo Rally**.
Built with a React (Vite) frontend, a Java (Spring Boot) backend, and a PostgreSQL (Neon) database.

## 🛠 Prerequisites

This project uses **Nix** to guarantee reproducible development environments. You do not need to manually install Java, Node.js, or Maven on your system.

### 1. Install Nix

If you do not have it already, run the following command:

```bash
sh <(curl -L [https://nixos.org/nix/install](https://nixos.org/nix/install)) --daemon
```
````

### 2. Install Direnv (Highly Recommended)

Direnv automatically loads the Nix environment and local secrets when you enter the project directory.

- **Arch Linux:** `sudo pacman -S direnv`
- **macOS:** `brew install direnv`

> **Note:** Be sure to hook direnv into your shell. For example, add `eval "$(direnv hook bash)"` to your `~/.bashrc` and restart your terminal.

---

## 🚀 Getting Started

### 1. Enter the Environment

Clone the repository and enter the directory. If you are using `direnv`, allow the environment to load:

```bash
git clone <repository-url>
cd RoboRally

```

### 2. Configure the Backend (Database Secrets)

The backend connects to a managed Neon PostgreSQL database. Secrets are kept out of version control.

1. Navigate to the backend directory:
   ```bash
   cd backend

```

2. Create a new environment file named `.env`:
* **Linux / macOS:** `touch .env`
* **Windows:** `echo. > .env` (or create it manually in your editor, in backend folder)


3. Open `.env` in your editor, ask the project lead for the credentials, and paste them in:
### Environment Setup

Create a `.env` file in the root directory based on `.env.example`. You will need to configure the following variables:

**Database Configuration**
* `DB_HOST`: Your Neon PostgreSQL host URL.
* `DB_NAME`: The database name (default: `neondb`).
* `DB_USER`: Your Neon database role.
* `DB_PASSWORD`: Your database password.

**Authentication Configuration (Neon Auth)**
* `SPRING_JWT_ISSUER`: The expected issuer claim inside the JWT.
* `SPRING_JWK_SET_URI`: The endpoint Spring uses to download the public Ed25519 keys to verify token signatures.
* `VITE_NEON_AUTH_URL`: The frontend routing URL for the Neon Auth interface.

**Local Server Configuration**
* `SPRING_JPA_HIBERNATE_DDL_AUTO`: Set to `update` for development to auto-sync entity schemas.
* `APP_CORS_ALLOWED_ORIGINS`: The URL of your local React dev server (usually `http://localhost:5173`).


4. Allow `direnv` to read the new secrets:
```bash
direnv allow

```



### 3. Run the Backend (Spring Boot)

Open a terminal, ensure you are in the `backend` directory, and start the server.

* **Linux / macOS:**
```bash
./mvnw spring-boot:run

```


* **Windows (Command Prompt / PowerShell):**
```cmd
mvnw.cmd spring-boot:run

```



> **Troubleshooting: Permission Denied**
> If you receive a "Permission denied" error when trying to run the wrapper on Linux or macOS, the script is missing execution rights. Run this command to fix it:
> `chmod +x mvnw`

*The backend will run on `http://localhost:8080`.*

```

```

### 4. Run the Frontend (React / Vite)

Open a second terminal, navigate to the frontend directory, and start the development server:

```bash
cd frontend
npm install
npm run dev

```

_The frontend will run on `http://localhost:5173`._

#### 5. Install react-router

```
npm install react-router-dom
