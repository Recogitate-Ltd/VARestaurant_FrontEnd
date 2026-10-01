# VA Restaurant — Vintage Associates Trade ordering site

A mobile-first Next.js site where approved restaurants browse the Vintage
Associates trade list, fill a basket (single bottles or cases of 3, 6 and 12)
and place orders. Each order raises a Stripe invoice with 30 days to pay,
which Stripe emails to the restaurant. All prices include VAT.

It uses the same dark look as the Vintage Associates investment app (gold VA
logo, header and footer, colours and fonts).

## How it fits together

| Part | Where |
| --- | --- |
| This site (restaurant ordering) | this repo |
| API, orders, Stripe invoices, emails | `Recogitate-Ltd/WineApp-backend`, Django app `trade` (`/api/trade/`) |
| Admin: approve restaurants, set prices, manage orders | `Recogitate-Ltd/Vintage-Associates-Admin`, **Restaurant Trade** section (`/dashboard/trade`) |

## Pages

| Path | What it does |
| --- | --- |
| `/` | Landing page: apply or log in |
| `/apply` | Trade account application (creates a pending login) |
| `/login`, `/forgot-password` | Sign in / reset password (6-digit email code) |
| `/wines` | The list: search, filters (type, country, region, grape, producer, price, organic, vegan, size, closure), sort |
| `/wines/[code]` | Full wine detail: tasting note, producer note, all specs, order by format |
| `/basket`, `/checkout` | Basket and checkout (delivery, PO number, notes) |
| `/orders`, `/orders/[id]` | Order history, invoice status, pay / download invoice |
| `/account` | Account status and contact / delivery details |

Pages that need an approved account show a "being reviewed" or "paused"
message for pending, rejected and suspended accounts.

## Local development

```bash
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm install
npm run dev                  # http://localhost:3001
```

Checks: `npm run lint`, `npm run typecheck`, `npm run build`.

## Deploying on Vercel

1. In Vercel, **Add New → Project** and import this repository (framework: Next.js, root directory left as is).
2. Add the environment variables from `.env.example`:
   `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_PHONE`.
3. Add your domain (e.g. `trade.vintage-associates.com`) and set the backend's
   `TRADE_SITE_URL` to it so emails link to the right place.
