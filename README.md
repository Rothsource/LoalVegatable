# 🛒 LocalVegetable Customer App

This is the **customer-facing frontend** of the LocalVegetable platform, built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

---

### 2. Run development server

```bash
npm run dev
```

---

### 3. Open in browser

```
http://localhost:3000
```

---

## 📁 Project Structure

```
customer/
│
├── app/                # Main application (routing & pages)
│   ├── page.tsx        # Homepage
│   ├── layout.tsx      # Root layout (shared UI)
│
├── components/         # Reusable UI components
│   ├── Navbar.tsx      # Top navigation bar
│   ├── Hero.tsx        # Hero / banner section
│   ├── Footer.tsx      # Footer section
│   ├── ProductCard.tsx # (Optional) Product display card
│
├── public/             # Static assets
│   ├── image/          # Images (products, banners, etc.)
│   ├── videos/         # Videos if needed
│   ├── *.svg           # Icons and logos
│
├── styles / config files
│   ├── tailwind config
│   ├── eslint config
│   ├── tsconfig.json
│
├── package.json        # Dependencies & scripts
```

---

## 🧩 Component Overview

### 🔹 Navbar.tsx

* Displays logo / app name
* Navigation links:

  * Home
  * Shop
  * Cart
* Includes cart notification badge

---

### 🔹 Hero.tsx

* Main landing section
* Displays:

  * Title
  * Subtitle
  * Call-to-action button (e.g., "Shop Now")

---

### 🔹 ProductCard.tsx

*(Optional / for product listing)*

* Reusable card component
* Displays:

  * Product image
  * Name
  * Price

---

### 🔹 Footer.tsx

* Bottom section of the page
* Contains:

  * Copyright
  * Basic links/info

---

## 🎯 Development Guidelines

* Use **component-based structure**
* Keep components **small and reusable**
* Use **Tailwind CSS** for styling
* Maintain **clean and readable code**
* Avoid hardcoding values — use props where possible

---

## 📦 Assets

* Store all images in:

  ```
  /public/image
  ```
* Example usage:

  ```tsx
  <img src="/image/product-1.png" />
  ```

---

## 📱 Features

* Responsive design (mobile + desktop)
* Clean homepage layout
* Reusable components
* Ready for future API integration

---

## 🔮 Future Improvements

* Add cart functionality (state management)
* Connect to backend API
* Add authentication (login/register)
* Improve UI/UX design

---

## 👨‍💻 Notes for Developers / Interns

* Do NOT write everything in one file
* Always create reusable components
* Follow the folder structure
* Focus on clarity over complexity

---

## 🧪 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

---

## 📌 Summary

This project is a **scalable foundation** for an eCommerce frontend.
Keep the structure clean so it can grow into a full system (customer + merchant + admin).

