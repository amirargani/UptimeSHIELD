# 🛡️ UptimeSHIELD

> **Ensuring 99.9% Uptime for Your Critical Applications.**

UptimeSHIELD is a professional-grade monitoring dashboard designed to track, manage, and automatically recover Windows services. With integrated **AI-powered failure analysis** and a sleek, modern interface, it transforms complex system administration into a seamless experience.

---

## ✨ Key Features

-   **🔍 Real-Time Monitoring**: Instant heartbeat status for all configured Windows services.
-   **🤖 AI Failure Analysis**: Leverages **Google Gemini AI** to analyze log data and provide actionable recovery steps.
-   **⚡ Auto-Recovery**: Automatically attempts to restart failed services based on configurable retry policies.
-   **🛰️ Real-Time Dashboards**: Visualize system health and uptime through dynamic, interactive charts.
-   **🔌 Smart Windows Integration**:
    -   **Auto-Fetch**: Scan and import your machine's services in seconds.
    -   **Intelligent Filtering**: Automatically hides system-critical noise (C:\Windows, etc.) to focus on your apps.
-   **📊 Event Logging**: Comprehensive audit trail of all system events and service state changes.

---

## 📂 Project Structure

### 🧱 Core Architecture
-   **`App.tsx`**: The centralized engine managing state, heartbeat logic, and navigation.
-   **`types.ts`**: Strict TypeScript definitions ensuring system-wide reliability.
-   **`vite.config.ts`**: Modern build configuration with secure backend proxying.
-   **`.env.local`**: Secure storage for sensitive API credentials (e.g., Gemini).

### 🎨 Frontend Components (`/components`)
-   `AIAnalysisModal.tsx`: The AI brain for diagnosing service failures.
-   `Dashboard.tsx`: High-level operational overview and metrics.
-   `ServiceManager.tsx`: The command center for service control and discovery.
-   `LogViewer.tsx`: Detailed forensic analysis of system events.
-   `Settings.tsx`: Global configuration and notification preferences.

### ⚙️ Backend Services
-   **`/server`**: A Node.js Express server (`v1.0.0`) bridge using PowerShell for deep system integration.
-   **`/services`**: Specialized API integrations (Google Gemini AI).

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React (v19) • TypeScript • Vite |
| **Styling** | Vanilla CSS • Tailwind-like Utilities • Lucide Icons |
| **Backend** | Node.js • Express • PowerShell CLI |
| **AI** | Google Gemini Generative AI |
| **Visualization** | Recharts |

---

### ⚡ Quick Start (Zero-Config)

1.  **Install Dependencies**:
    ```bash
    npm install && cd server && npm install
    ```

2.  **Start Development**:
    ```bash
    npm run dev
    ```
    *This will automatically generate certificates, start the backend (Port 3001), and the web console (Port 3000).*

---

## 🛠️ Configuration & Security

### 🔐 SSL/TLS Certificates
UptimeSHIELD includes an automated security engine: [`ensure-certs.ps1`].

- **Automated**: Runs on every `npm run dev`. Checks for `cert.pfx` and generates it if missing.
- **Manual**: For custom certificates, place `cert.pem` and `key.pem` in `server/certs/`.
- **Warning**: As we use self-signed certificates, you must accept the browser warning on first load.

> [!TIP]
> For a deep dive into the HTTPS architecture and manual generation commands, see the [Technical Documentation](file:///c:/Users/DEV/Downloads/UptimeSHIELD/TECHNICAL_README.md).

---

### 🔑 Environment Variables

The project uses environment variables for configuration and security.

- **`.env`**: Global settings. Used for `USE_HTTPS` (defaults to `true`).
- **`.env.local`**: Local overrides and sensitive keys (e.g., `GEMINI_API_KEY`). **Do not commit this file.**

```env
# Example .env.local
GEMINI_API_KEY=your_key_here
USE_HTTPS=true
```

---

## 🏥 Troubleshooting

-   **Backend Connection Error**: Ensure the Node.js server in the `/server` folder is running and listening on port 3001.
-   **Service List Empty**: If you see "No external services found", your machine may only have system services in standard Windows directories. Try installing a custom service or check the folder permissions.
-   **Gemini Analysis Fails**: Check your `.env.local` file for a valid `GEMINI_API_KEY`.

---

## 📝 Recommendation
Please consult with your software developer or system administrator regarding the use of this platform in production environments.

---

## 🚀 Changelog - v0.0.1-beta

### ✨ Features
- **Initial Release Support**: Full integration with **React 19** and modern Vite tooling.
- **PowerShell Auto-Fetch**: Command-center feature to scan and import machine services instantly.
- **AI Diagnostics**: Integrated **Google Gemini AI** for intelligent failure analysis and recovery steps.
- **HTTPS Encryption**: End-to-end SSL/TLS for both Frontend (Vite) and Backend (Express).
- **Protocol Toggle**: Switched to HTTPS by default with a `USE_HTTPS` toggle in `.env`.
- **Automated Certificates**: New `ensure-certs.ps1` script for one-click SSL setup.
- **Smart Filtering & UI Hint**: Intelligent path filtering for Windows services with a prominent, red high-visibility hint in the UI.
- **Real-Time Dashboards**: Interactive metrics and uptime visualization using Recharts.

### 🛡️ Security & Stability
- **Graceful Fallback**: Automatic detection of missing certs with fallback to HTTP.
- **PFX Support**: Standardized on `.pfx` for robust Windows certificate handling.
- **Secret Protection**: Updated `.gitignore` to prevent certificate and local environment leakage.
- **Dependency Management**: Integrated `dotenv` and `concurrently` for a smoother development workflow.

---

### Developed by © 2025 Amir Argani
