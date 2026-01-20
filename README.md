# 🛡️ UptimeSHIELD

[![License](https://img.shields.io/badge/License-Apache_2.0-D22128?style=for-the-badge&logo=apache)](LICENSE.txt)
[![Version](https://img.shields.io/badge/Version-0.0.2--beta-orange?style=for-the-badge)](https://github.com/amirargani/UptimeSHIELD/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4?style=for-the-badge&logo=windows)](https://www.microsoft.com/windows)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-latest-orange?style=for-the-badge&logo=lucide)](https://lucide.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=googlegemini)](https://deepmind.google/technologies/gemini/)
[![Recharts](https://img.shields.io/badge/Recharts-3.6-22b5bf?style=for-the-badge)](https://recharts.org/)

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
-   `Overview.tsx`: High-level operational overview and metrics.
-   `Services.tsx`: The command center for service control and discovery.
-   `Logs.tsx`: Detailed forensic analysis of system events.
-   `Configuration.tsx`: Global configuration and notification preferences.

### ⚙️ Backend Services
-   **`/server`**: A Node.js Express server (`v1.0.0`) bridge using PowerShell for deep system integration.
-   **`/services`**: Specialized API integrations (Google Gemini AI).

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend** | React (v19) • TypeScript • Vite |
| **Styling** | Vanilla CSS • Tailwind CSS (via CDN) • Lucide Icons |
| **Backend** | Node.js • Express • PowerShell CLI |
| **AI** | Google Gemini Generative AI |
| **Visualization** | Recharts |

---

### ⚡ Quick Start (Zero-Config)

1.  **Install Dependencies**:
    ```bash
    npm run install:all
    ```
    > **Tip**: Need a fresh start? Run `npm run uninstall:all` to completely reset the project dependencies.

2.  **Start Development**:
    ```bash
    npm run dev
    ```
    *This will automatically generate certificates, start the backend (Port 3001), and the web console (Port 3000).*

3.  **Production Deployment**:
    To run the optimized production build (eliminates "development build" warnings):
    ```bash
    npm run build
    npm start
    ```
    *Builds the React app to `/dist` and starts the Express server serving static files at `http://localhost:3001`.*

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

- **`.env`**: Global settings. Used for `USE_HTTPS` (defaults to `false` — runs in standard HTTP mode).
- **`.env.local`**: Local overrides and sensitive keys (e.g., `GEMINI_API_KEY`). **Do not commit this file.**

```env
# Example .env.local
GEMINI_API_KEY=your_key_here
USE_HTTPS=false
```

---

## 🏥 Troubleshooting

-   **Backend Connection Error**: Ensure the Node.js server in the `/server` folder is running and listening on port 3001.
-   **Service List Empty**: If you see "No external services found", your machine may only have system services in standard Windows directories. Try installing a custom service or check the folder permissions.
-   **Gemini Analysis Fails**: Check your `.env.local` file for a valid `GEMINI_API_KEY`.

---

## 📝 Recommendation
Please consult with your software developer or system administrator regarding the use of this platform in production environments.

## 📘 Documentation

For a deep dive into the technical aspects of UptimeSHIELD, please refer to our [Technical Documentation](TECHNICAL_README.md).

It covers:
- **Architecture**: In-depth look at the Frontend, Backend, and OS layers.
- **PowerShell Bridge**: How we interact with Windows Services.
- **Intelligence Layer**: Details on the Google Gemini AI integration.
- **Security**: HTTPS setup and certificate management.
- **Data Flow**: The journey of a monitoring request.

---

## 📜 Changelog

### v0.0.2-beta

### 🎨 Atomic UI & Design
- **Architecture**: Implemented a scalable component-based design system for maximum maintainability.
- **Component Suite**: Developed reusable UI Atoms including `Button`, `Card`, `Badge`, `Input`, `Label`, `Modal`, `Table`, and `Switch`, `NavButton`, `Toast`.
- **Modernization**: Systematic refactor of all core views (`Dashboard`, `ServiceManager`, `LogViewer`, `Settings`, `App`) to enterprise-grade standards.
- **Visuals**: Established a consistent high-tech "Command Center" aesthetic with dark-mode optimization and smooth micro-animations.
- **Notifications**: Integrated a non-intrusive "Toast" notification system (`z-[100]`), replacing native browser alerts for a smoother user experience.
- **Duplicate Detection**: Smart logic in service discovery preventing the addition of duplicate services during scans or manual entry.

### ⚙️ System & Performance
- **Compatibility**: Enhanced backend service discovery and refined the `install:all` script for robust Windows compatibility.
- **Maintenance**: Added `uninstall:all` script to recursively clean up all `node_modules`, lockfiles, and certificates for a complete project reset.
- **Verification**: Verified the entire codebase with a zero-error production build pass.
- **Production Ready**: Added `npm start` script and server configuration to serve the optimized production build, eliminating development warnings.

### ✨ UI Polish & Semantic Refactoring
- **Focus-Free Design**: Removed distracting focus rings from all interactive elements (buttons, inputs) for a cleaner, minimal aesthetic.
- **Enhanced Controls**: Redesigned service operation buttons (Play/Pause/Restart) to be circular, glass-morphic, and semantically colored.
- **Semantic Standardization**: Renamed core view components to align with internal state identifiers for better code readability:
    - `Dashboard.tsx` -> `Overview.tsx`
    - `ServiceManager.tsx` -> `Services.tsx`
    - `LogViewer.tsx` -> `Logs.tsx`
    - `Settings.tsx` -> `Configuration.tsx`

### 🚀 Advanced Features (New)
- **Hidden Services Manager**: Toggle switch to reveal/hide system services (C:\Windows, etc.) with real-time UI feedback and `localStorage` persistence.
- **Bulk Operations**: Added 'Delete All' capability with custom confirmation modal and empty-state safety checks.
- **Glassy Aesthetic**: Premium UI refinement with glassy backgrounds, transparent borders, and blue-glow focus states for all Inputs and Buttons.
- **Smart Modal**: 'Add Service' modal now intelligently respects global filter settings.
- **Smart Navigation**: Sidebar state (`activeView`) is now persisted via `localStorage`, returning you to your last context upon reload.
- **Mobile First**: Fully responsive layout with a dedicated mobile drawer navigation and touch-optimized controls.
- **Living Brand**: Enhanced logo styling with pulse animations and dynamic glow effects.
- **Overview Visualization**: Replaced bar charts with elegant mini sparkline charts showing uptime trends for top 5 running services with status-based color coding and glow effects.
- **Path Information Modal**: System path filters (included/excluded) now displayed in a clean modal dialog instead of inline badges for better mobile UX.

### 📱 Mobile Responsive Enhancements (Services Component)
- **Action Buttons**: Optimized button layout with responsive spacing (`gap-2` on mobile, `gap-1` on desktop) for better touch targets.
- **Icon-Only Mode**: Smart Fetch and Delete All buttons display as icon-only on mobile devices, showing full text labels on larger screens.
- **Table Optimization**: 
  - Reduced button sizes on mobile (`w-8 h-8`) expanding to full size (`w-10 h-10`) on desktop.
  - Smaller icons on mobile (12px-14px) scaling up on larger screens.
  - Responsive text sizing for service names and descriptions.
- **Alert Component**: Restructured system services alert with:
  - Clickable animated AlertTriangle icon that opens path information modal.
  - Optimized layout: text and switch on one line, maintaining clean mobile presentation.
  - Responsive text sizing (`text-[9px]` for optimal mobile readability).
- **Button Alignment**: Action buttons right-aligned on desktop (`sm:justify-end`) for professional appearance.
- **Compact Badges**: Reduced path badge text size (`text-[6px]`) for minimal visual footprint.

### 🐛 Bug Fixes
- **PowerShell Script**: Fixed a syntax error in `ensure-certs.ps1` (removed invalid parentheses from function call) to ensure reliable random password generation for certificates.
### v0.0.1-beta

### ✨ Features
- **Initial Release Support**: Full integration with **React 19** and modern Vite tooling.
- **PowerShell Auto-Fetch**: Command-center feature to scan and import machine services instantly.
- **AI Diagnostics**: Integrated **Google Gemini AI** for intelligent failure analysis and recovery steps.
- **HTTPS Encryption**: End-to-end SSL/TLS for both Frontend (Vite) and Backend (Express).
- **Protocol Toggle**: Switched to HTTPS (configurable via `USE_HTTPS` in `.env`).
- **Automated Certificates**: New `ensure-certs.ps1` script for one-click SSL setup.
- **Smart Filtering & UI Hint**: Intelligent path filtering for Windows services with a prominent, red high-visibility hint in the UI.
- **Real-Time Dashboards**: Interactive metrics and uptime visualization using Recharts.
- **Styling Optimization**: Standardized styling using Tailwind CSS, removing redundant classes and improving maintainability.

### 🛡️ Security & Stability
- **Graceful Fallback**: Automatic detection of missing certs with fallback to HTTP.
- **PFX Support**: Standardized on `.pfx` for robust Windows certificate handling.
- **Secret Protection**: Updated `.gitignore` to prevent certificate and local environment leakage.
- **Dependency Management**: Integrated `dotenv` and `concurrently` for a smoother development workflow.
- **One-Click Setup**: Added `install:all` script to streamline both frontend and backend dependency installation.
- **Naming Compliance**: Fixed `package.json` naming validation to comply with npm lowercase requirements.

---

### Developed by © 2025 Amir Argani
