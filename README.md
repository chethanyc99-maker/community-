# Prerana | Multi-Sensory Computer-Based Learning Platform for Special Education

> **Academic Project Reference**  
> **Project Title:** Computer-Based Learning Tool for Mentally Challenged Students  
> *(Modern Clinical/Inclusive Title: Multi-Sensory Browser-Based Assistive Learning Tool for Special Education & Neurodivergent Learners)*  
> **Measurable Engineering Outcome:** Design and develop a web/browser-based learning tool as per the requirements of the special school.  
> **Program Outcomes (POs):** **PO5** (Modern Tool Usage), **PO6** (The Engineer and Society)  
> **Sustainable Development Goals (SDGs):** **SDG 4** (Quality Education — Target 4.5 & Target 4.a)

---

## 🌟 Key Features

### 1. Gated Access & Separate Role Authentication
* 🔒 **Gated Content Delivery:** All learning modules, interactive game stages, and teacher IEP records remain strictly locked behind authentication. Content opens only after a valid Student or Teacher logs in.
* 🚪 **Dedicated Sign Out:** Users can securely sign out at any time from the top navigation bar, clearing the session and instantly returning to the authentication screen.
* 🎒 **Student Portal (Visual Picture Login):**
  - Tailored specifically for children with intellectual disabilities and reading difficulties.
  - Large picture/avatar cards (🌟 Arjun, 🦋 Priya, 🦁 Rohan) where students can simply tap their mascot or name to enter!
  - 4-digit PIN access (default demo: `1234`) with friendly voice prompts.
* 👩‍🏫 **Teacher & Special Educator Portal:**
  - Dedicated authentication for special educators, therapists, and administrators.
  - Pre-configured demo PIN: **`1234`** (with a **"⚡ 1-Click Educator Demo"** button for quick review).
  - Class dashboard with student roster management, cognitive support level adjustment (Mild, Moderate, High), real-time class activity tracking, printable official IEP assessment cards, and PO/SDG accreditation compliance.
* ✨ **"Create New Account" (User Registration):**
  - Users without an account can click the **"Create New Account"** tab to register instantly.
  - **Student Registration:** Enter student name, choose mascot avatar, pick cognitive support tier, and set a 4-digit PIN.
  - **Teacher Registration:** Enter educator name, school email, specialization/department, and password.

### 2. Translucent Liquid Glass & Bouncy Water-Drop UI
* Pinned floating frosted glass header with specular light highlights (`backdrop-filter: blur(24px)`).
* Translucent water-drop activity slides with ambient floating liquid gradient orbs in the background.
* Elastic spring bounce physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`) on hover and touch squish.

### 3. Six Curricular Learning Modules
1. 🎨 **Shapes & Colors Discrimination (`scripts/modules/shapes.js`)**
2. 🪥 **Daily Living Skills (ADLs - `scripts/modules/daily-skills.js`)**
3. 😊 **Feelings & Emotions Recognition (`scripts/modules/emotions.js`)**
4. 🔢 **One-to-One Number Counting (`scripts/modules/counting.js`)**
5. 🔔 **Daily Sounds & Environmental Objects (`scripts/modules/sounds.js`)**
6. 🫧 **Sensory Calm & Motor Coordination (`scripts/modules/calming.js`)**

### 4. Multi-Network & 100% Offline Capability (PWA)
* Operates on standalone PCs, tablets, and smartphones across **Wi-Fi, Ethernet, LAN, and Mobile Cellular Networks (4G/5G)**.
* Offline-first Service Worker (`sw.js`) caches all assets so the app works even in Airplane Mode without internet!

---

## 🛠️ How to Run

### Method 1: Instant 1-Click Launch (Local PC)
* Double-click [**`start.bat`**](file:///c:/Users/CHETHAN%20YC/OneDrive/Desktop/commuity/start.bat) (or open [**`index.html`**](file:///c:/Users/CHETHAN%20YC/OneDrive/Desktop/commuity/index.html) in Chrome/Edge).

### Method 2: Share over Wi-Fi, Ethernet, or LAN
* Double-click [**`run_network_server.bat`**](file:///c:/Users/CHETHAN%20YC/OneDrive/Desktop/commuity/run_network_server.bat).
* Phones or tablets on the same Wi-Fi can open the displayed IP address or scan the on-screen QR code!

### Method 3: Share over Mobile Cellular Data (4G/5G / Internet)
* Double-click [**`run_wan_online.bat`**](file:///c:/Users/CHETHAN%20YC/OneDrive/Desktop/commuity/run_wan_online.bat) to generate a public HTTPS tunnel.
