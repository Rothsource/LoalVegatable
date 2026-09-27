# Delivery Portal

Frontend-only delivery-agent portal built as a standalone Next.js application. All data and workflow mutations currently use the mock service in `lib/delivery-service.ts`, so a backend can replace that adapter without changing the screens.

## Local development

```powershell
npm install
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Demo access

- Email: `sokha.rider@gmail.com`
- Password: `Rider123!`
- Activation code: `246810`

The Profile screen includes demo controls for restoring an incoming request or showing the empty-queue state. Browser storage keeps the current demo session and delivery state between reloads.

## Validation

```powershell
npm run lint
npm run typecheck
npm run build
```
