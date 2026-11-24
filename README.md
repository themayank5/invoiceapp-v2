# InvoiceGen – offline GST invoice generator

A browser app for GST invoices, quotations, customers, items and stock. It works offline and can be installed
like a desktop app. **Your data stays on your own computer**, in CSV files in a folder you choose. Nothing is
uploaded anywhere.

Works in **Chrome or Edge** (they can read and write a folder on your computer; Firefox and Safari cannot).
The layout also fits phones: see "Using it on a phone" below.

## What it can do

- **Invoices and quotations** in five layouts (Classic, Modern, Minimal, Corporate, Elegant), with CGST/SGST/IGST,
  discounts, round off, a UPI QR code, a Paid / Not paid / Draft stamp, and paper sizes from A4 to 58 mm receipts.
  Print, save as PDF or share.
- **Customers and items**, with wholesale prices, several contacts and shipping addresses per customer, GSTIN
  checks, stock tracking, and low-stock warnings. An invoice can never sell more than the stock you have.
- **View All Invoices** for saved invoices, drafts and quotations.
- **Reports**: sales by customer, item and month, a revenue chart, top customers and items, GST by rate (CGST, SGST,
  IGST), a day book, party-wise totals and profit by item. Every report downloads as CSV, Excel or PDF.
- **Trash**: deleted invoices, customers and items stay for 30 days. Undo right after deleting, or **Restore all**
  later. Items return to their original position.
- **Backup & Restore** as one ZIP of all your data.
- **English and Hindi**.

## Install and start

1. Open the app's web address (see "Host it on GitHub Pages" below) in Chrome or Edge.
2. Click **Install app** (top right of the app, or the install icon in the address bar).
3. Start it from the desktop icon or the Start menu. After the first visit it also starts with no internet.

## Set up your data folder (first time only)

1. Create an empty folder on your computer, for example `Documents\InvoiceGen-data`.
2. In the app click **Connect Database**, choose that folder and allow the browser to edit it.
   The app creates its six data files there (`customers.csv`, `items.csv`, `seller.csv`, `bank.csv`, `terms.csv`,
   `invoices.csv`) and you can start straight away.
3. On a new, empty folder a **welcome window** opens. Choose **Set up my business** (name, address, state, logo,
   bank and terms, in three short steps) or **Try it with sample data**. Skipping it is fine; the invoice page
   shows a small notice until your business details are added.

### Not sure what to add? Try the sample data

Choose **Try it with sample data** in the welcome window (or **Backup & Restore → Load sample data** at any time).
The app adds made-up examples to your connected folder so every feature has something to show:

- 5 customers and 15 items (some on low stock, one with no purchase price)
- a sample business, **Sunrise Traders**, with a logo, a signature, bank and UPI details, and terms
- 16 invoices, quotations and drafts dated over the last six months, with Paid and Not paid stamps, CGST/SGST and IGST,
  a discount and a round-off, so the **Reports** pages are filled too

A yellow bar stays at the top while sample data is loaded. **Remove sample data** (on that bar, or in
**Backup & Restore**) takes the unchanged examples out again, puts the stock and invoice numbers back, and says exactly
what it will remove before it does. Removed customers and items go to the **Trash** for 30 days. Your own data is
kept.

Because the sample data looks like real data to the app, use a **separate folder** for experiments and keep your real
folder free of it.

The guide page also offers the same data as a downloadable folder (`sample-data/InvoiceGen-sample-data.zip`): the six CSV
files, the logo and signature pictures, and the 16 sample invoices. Unzip it and connect that folder if you prefer to
start from files. Its invoices are dated June to November 2026, so choose **All time** in Reports. (The in-app button
dates them from today instead.)

Back this folder up regularly (the app also has **Backup & Restore**). It is your only copy of your invoices.
Each person who uses the app has their own folder; nothing is shared between users.

## Using it on a phone or tablet

Open the app address in Chrome. The invoice page is rebuilt for a small screen:

- Invoice settings (price mode, copies, paper, quotation) fold into one bar.
- Each item is a card with the item, quantity, rate and total; **Details** opens HSN/SAC, value, GST % and tax.
- The seller and customer cards show everything, with buttons for **Invoice details** and **Shipping address**.
- A total bar stays at the bottom of the screen.
- Lists (customers, items, invoices, Trash) become cards, and the saved-invoice preview shrinks to fit (pinch to zoom).

A phone browser cannot pick a data folder yet, so phones are best for looking at the app. Real data on a phone would
need the browser-storage and Google Drive sync features that are planned, not built.

In the **installed app** (which has no browser toolbar) a **↻ Refresh** button sits in the top bar (in the side menu on
a phone) and reloads the app with the newest version.

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
- `sample-data.js` – the example data the app loads from "Try it with sample data" (customers, items, sellers, a logo,
  a signature and the plan for the sample invoices)
- `sample-data/` – the downloadable sample data folder (zip) offered on the guide page
- `tools/landing-css/` – how to rebuild the guide page stylesheet (Tailwind + daisyUI)
- `lib/`, `fonts/` – libraries and fonts, bundled so nothing loads from the internet
- `manifest.webmanifest`, `sw.js`, `icons/` – installable app and offline start
- `FEATURES.md` – what the app does
