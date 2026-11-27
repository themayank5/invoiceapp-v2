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

On the first visit a **welcome window** opens with two choices.

**Set up my business** (recommended)

1. **Create your data folder.** Press **Choose location**, go to Documents or Desktop, press **New folder**, name it
   (for example `InvoiceGen Data`), open it and press **Select Folder**. Allow the browser to edit it.
   The browser does not allow Desktop, Documents or Downloads themselves, only a folder inside them.
   An empty folder is used as it is; a folder with other files gets an `InvoiceGen Data` folder inside it.
   The app creates its six data files there (`customers.csv`, `items.csv`, `seller.csv`, `bank.csv`, `terms.csv`,
   `invoices.csv`).
2. **Your business** – name, address, state, GSTIN and logo.
3. **Payment details** – bank, UPI and terms (can be skipped).

Already have a data folder (a new browser or computer)? Choose **I already have a data folder** at the bottom of the
welcome window. After the first visit the app remembers the folder and reconnects by itself.

### Not sure what to add? Try the sample data

Choose **Try it with sample data**. The window explains the steps:

1. **Download** the sample folder (`sample-data/InvoiceGen-sample-data.zip`, also offered on the guide page and in
   **Backup & Restore**).
2. **Unzip** it (right-click → Extract All).
3. Press **Connect sample folder** and choose the unzipped `InvoiceGen-sample-data` folder.

The sample folder holds made-up data so every feature has something to show:

- 5 customers and 15 items (some on low stock, one with no purchase price)
- a sample business, **Sunrise Traders**, with a logo, a signature, bank and UPI details, and terms
- 5 saved invoices, 2 quotations and 2 drafts dated June to November 2026 (choose **All time** in Reports), with Paid and
  Not paid stamps, CGST/SGST and IGST, a discount and a round-off

While it is connected a yellow bar says so. Its only button is **Disconnect sample data**: the app lets go of the
folder (nothing in it is deleted) and the welcome window opens again, ready for **Set up my business** in a new,
empty folder. The sample data is never mixed into your own folder, and the app refuses the sample folder as the
place for your real data. It recognises the sample folder by its `README.txt`.

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

The project root is what GitHub Pages publishes. Keep these paths as they are: the installed app and its offline copy
look for them by name.

**Live: published with the app**

- `index.html`, `landing.css`, `landing.js` – the guide page (English and Hindi) that opens first
- `app.html`, `app.js`, `style.css`, `i18n.js`, `folder-data.js` – the app itself
- `sample-data/` – the downloadable sample data folder (zip), offered in the welcome window, on the guide page and in
  Backup & Restore
- `lib/`, `fonts/`, `img/` – libraries, fonts and pictures, bundled so nothing loads from the internet
- `manifest.webmanifest`, `sw.js`, `icons/` – installable app and offline start

**In the repository, not used by the app**

- `README.md` – this file
- `docs/FEATURES.md` – what the app does
- `docs/TEST-REPORT.md` – test results and known bugs
- `tools/landing-css/` – how to rebuild the guide page stylesheet (Tailwind + daisyUI)

**Local only: never uploaded** (listed in `.gitignore`)

- `csv/` – your own data folder for everyday testing (connect it with **Connect Database**)
- `local/` – anything else for testing on this computer, for example `local/test-data/` (a sample-data folder)
- `.claude/` – editor tool settings

Connect the app to `csv/` or a folder under `local/`, never to the project root itself, or the app writes its data
files and pictures next to the app's own files.
