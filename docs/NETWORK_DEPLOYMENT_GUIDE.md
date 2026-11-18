# Prerana Multi-Network Deployment Guide
### Running across Wi-Fi, Ethernet, LAN, WAN, and Mobile Cellular Networks (4G/5G)

Prerana is designed with a **multi-network, offline-first architecture** (Progressive Web App - PWA). It can be accessed on any device: smartphones (Android/iOS), tablets (iPads), Chromebooks, laptops, and smart classroom boards.

---

## 📶 1. Wi-Fi, LAN, & Ethernet Network Hosting (Same Network)

Use this when you want students and teachers inside a home, classroom, or school computer lab to access the tool on their phones or tablets connected to the **same Wi-Fi or Ethernet router**.

### Quick Steps:
1. Double-click `run_network_server.bat`.
2. The terminal will display your computer's local network IP address, for example:
   ```
   ================================================================
     PRERANA SPECIAL EDUCATION LEARNING PLATFORM - NETWORK HOST
   ================================================================
     💻 On this PC:           http://localhost:8000
     📱 On Phones / Tablets:  http://192.168.1.15:8000
   ```
3. On any mobile phone, tablet, or student PC connected to the same Wi-Fi/LAN:
   * Open Chrome, Edge, or Safari.
   * Type the address shown (e.g. `http://192.168.1.15:8000`).
   * Alternatively, click **"📡 Share to Phone"** in the top bar to display the scannable **QR code** on your screen!

---

## 🌐 2. Mobile Cellular Networks (4G/5G) & Remote WAN (Over the Internet)

Use this when students are at home using **cellular mobile data (Jio, Airtel, Vi, 4G/5G)** or are outside your local Wi-Fi.

### Method A: Instant Public HTTPS Tunnel (Zero Setup)
1. Double-click `run_wan_online.bat`.
2. It generates a free, public, secure HTTPS link (e.g., `https://prerana-learning.loca.lt`).
3. Send this link to anyone via WhatsApp, SMS, or email. Any smartphone on any mobile network can open it!

### Method B: 100% Free Permanent Cloud Hosting
* Drag and drop the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop) or deploy via GitHub Pages.

---

## 📲 3. Progressive Web App (PWA) & 100% Offline Capability

1. Open the website on any phone or tablet.
2. Tap the **"📲 Install App"** button (or Chrome menu > "Add to Home screen").
3. The app installs as a native icon. It will work completely offline even in Airplane Mode without internet!
