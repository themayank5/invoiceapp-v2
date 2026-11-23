# InvoiceGen – offline GST invoice generator

A browser app for GST invoices, quotations, customers, items and stock. It works offline and can be installed
like a desktop app. **Your data stays on your own computer**, in CSV files in a folder you choose. Nothing is
uploaded anywhere.

Works in **Chrome or Edge** (they can read and write a folder on your computer; Firefox and Safari cannot).

## Install and start

1. Open the app's web address (see "Host it on GitHub Pages" below) in Chrome or Edge.
2. Click **Install app** (top right of the app, or the install icon in the address bar).
3. Start it from the desktop icon or the Start menu. After the first visit it also starts with no internet.

## Set up your data folder (first time only)

1. Create an empty folder on your computer, for example `Documents\InvoiceGen-data`.
2. In the app click **Connect Database**, choose that folder and allow the browser to edit it.
   The app creates its six data files there (`customers.csv`, `items.csv`, `seller.csv`, `bank.csv`, `terms.csv`,
   `invoices.csv`) and you can start straight away.
3. Fill in **Business & Invoice Setup** (your business, bank and terms), then add customers and items.

Back this folder up regularly (the app also has **Backup & Restore**). It is your only copy of your invoices.
Each person who uses the app has their own folder; nothing is shared between users.

## Host it on GitHub Pages

1. Push this project to a GitHub repository (the `.gitignore` keeps the `csv/` data folder out).
2. On GitHub open **Settings → Pages**, set **Source** to *Deploy from a branch*, branch **main**, folder **/ (root)**, and save.
3. After a minute the app is at `https://<your-username>.github.io/<repository-name>/`.

To update the app later, push your changes. The installed app picks up the new version the next time it opens
with internet.

## Run it locally instead (no GitHub)

From this folder run `python -m http.server 8080` and open `http://localhost:8080`. A service worker (offline start)
and installation only work from `https://` or `http://localhost`, not from a double-clicked `app.html`.

## What is in the project

- `index.html`, `landing.css`, `landing.js` – the guide page (English and Hindi) that opens first
- `app.html`, `app.js`, `style.css`, `i18n.js`, `folder-data.js` – the app itself
- `lib/`, `fonts/` – libraries and fonts, bundled so nothing loads from the internet
- `manifest.webmanifest`, `sw.js`, `icons/` – installable app and offline start
- `FEATURES.md` – what the app does
