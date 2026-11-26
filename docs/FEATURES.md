# InvoiceGen – Feature and Functionality List

A GST invoice and quotation web app that runs entirely in the browser. It has **no server and no external database or API**: data is kept in CSV files (plus a pictures folder and a settings file) in a folder on your computer, read and written through the browser's File System Access API. A few settings are also cached in the browser's local storage.

Companion files: `TEST-REPORT.md` (test results and the list of known bugs).

---

## 1. Technology and storage

| Item | Detail |
|---|---|
| App type | Single-page web app: `index.html`, `app.js`, `i18n.js`, `folder-data.js`, `style.css` |
| Libraries | **All stored locally** in `lib/`: Bootstrap 5.3.3, qrcode-generator 1.4.4, html2pdf.js 0.10.1, JSZip 3.10.1 (versions and licences in `lib/THIRD-PARTY.md`). **Fonts** (Inter, Noto Sans Devanagari) are stored in `fonts/`. Keep `lib/` and `fonts/` next to `index.html`. |
| Database | Six CSV files in the `csv/` folder: `customers.csv`, `items.csv`, `seller.csv`, `bank.csv`, `terms.csv`, `invoices.csv` |
| Also in the database folder | `images/` (logo and signature picture files, each stored once), `app-settings.json` (template, numbering, language and backup-reminder settings), and, after the first clean-up of an older database, `invoices.before-image-cleanup.csv` and `seller.before-image-cleanup.csv` (safety copies that can be deleted later) |
| File access | File System Access API (Chrome / Edge). The chosen folder is remembered in the browser (IndexedDB) and re-connected on the next visit when permission allows |
| Browser storage (localStorage) | Current invoice in progress, template settings, numbering settings, language, backup reminder settings (a cache of what is also kept in `app-settings.json`) |
| Offline | Works fully offline (tested with the network blocked). Only the customer WhatsApp button (`wa.me` link) needs internet. |
| Browser | Latest Chrome or Edge recommended (needed for folder access) |

---

## 2. Navigation, layout and look

- **Left menu** (dark sidebar) with sections: Workspace, Customer Management, Item Management, Settings.
- Pages: **Generate Invoice**, **View All Invoices**, **Customer Details**, **Item Details**, **Business & Invoice Setup** (Seller Info, Invoice Details, Bank & UPI, Terms & Conditions, Signature), **Invoice Templates**, **Backup & Restore**.
- **Database button** at the bottom of the sidebar: green "Connected" or red "Not connected", with an upward dropdown to *Connect Database* and *Disconnect Database*.
- **Language box** in the top right of the header, on every page (English / हिन्दी).
- **Invoice toolbar** (Generate Invoice): Price Mode, Copies to Print, a divider, then the **Quotation** switch, plus New Invoice, Preview and Invoice Actions. From 768px to 991px wide it stays on one line.
- **Responsive**: the sidebar becomes a slide-in menu below 992px; the invoice sheet scrolls sideways on narrow screens.
- **One look for every dropdown**: every dropdown box, the Invoice Actions menu, the customer and item search lists and the discount suggestions use the same white list with rounded corners, a soft shadow, a blue highlight for the selected row and a light-blue hover. Keyboard use works (Space / Enter / F4 to open, arrows, Enter, Esc). Phones and tablets keep their own native picker. The Qty picker in the invoice table and the dark Database menu keep their own look.
- **Notifications (toasts)**: messages such as "3 items set to 40% GST and saved to items.csv." appear as a toast at the top right: **green** for success, **red** for errors, **dark** for information. Each closes by itself after 5 seconds, can be closed with ×, and pauses while the mouse is over it.
- Consistent theme: one success green (`#15803d`) and one danger red (`#dc2626`) across the app; dark table headers matching the sidebar; clickable table headers with sort arrows.

---

## 3. Database (CSV) connection

- **Database lock window**: whenever the database is not connected, a window with the title "Connect your database to continue" covers the app. It has no close button and cannot be dismissed with Esc or by clicking outside. It explains why and has one **Connect Database** button. It closes by itself as soon as the database is connected, and comes back if the database is disconnected. (If the browser cannot open folders, it says to use Chrome or Edge.)
- **Connect Database**: choose the `csv` folder; the app connects all six files together and validates each one. The button first tries the folder used last time (asking for permission) and only then opens the folder picker. A wrong folder keeps the lock open with a clear message.
- **Auto-reconnect** on the next visit when the browser still holds permission; the lock appears only if that fails.
- **Disconnect Database** with a confirmation dialog (files are not modified).
- Every create, edit and delete on customers, items, profiles and invoices is written straight back to the matching CSV file.
- **When the folder is connected** the app also: reads the pictures folder, moves pictures out of older invoice and seller files (one time, with safety copies), and syncs `app-settings.json`.

---

## 4. Generate Invoice (main page)

### 4.1 Invoice sheet (editable on screen, identical when printed)
- Live editable invoice with: seller block with logo, invoice details, customer (bill-to), shipping address, items table, totals, amount in words, bank details with UPI QR, signature, terms and footer.
- **Price Mode**: *GST added on top of rate* or *GST includes in rate*.
- **Copies to Print**: 1, 2 or 3 copies, labelled *Original for Recipient*, *Duplicate for Transporter*, *Triplicate for Supplier*.
- **Round off total** option with the round-off amount shown.
- **Place of Supply** and seller state decide the tax split automatically: **CGST + SGST** (same state) or **IGST** (other state).
- Tax grouped by rate (for example GST 5% and GST 18% lines) plus Taxable Amount and Total.
- **Amount in words** in Indian numbering (crore, lakh, thousand) and rupees / paise ("One Rupee" for 1).
- **Dates** use the computer's own date (Indian time), not UTC.

### 4.2 Customer section
- Searchable customer picker fed from Customer Details (inactive customers are hidden).
- **Edit** a customer for this invoice only (the customer CSV is not changed), **Clear**, **Add Customer** for a one-off customer.
- Shipping address: *same as billing* switch, or separate shipping address, phone and email.
- GSTIN shown when present.

### 4.3 Items table
- Searchable item picker fed from Item Details. A new row starts with **quantity 1**; picking an item sets quantity 1 if it was empty and keeps a quantity you already typed. A row with only the default quantity (no name, HSN, rate or discount) is not counted in the totals.
- **Custom Item +** is the first row of the item list and stays pinned at the top while the list scrolls. Clicking it keeps you on the invoice and opens that row: a plain **item name** box, **HSN/SAC**, **Rate**, **Value** (type the taxable value and the rate is worked out), **Qty and unit**, and **GST %**. Tax and total follow what you enter. A small ▾ arrow on the name box turns the row back into a list row. Several custom rows can exist together; they are saved with the invoice and print normally. Nothing is added to Item Details.
- **Locked fields**: for an item picked from the list, **HSN/SAC, Rate, Value and GST %** all come from Item Details and are locked (grey, "Auto" placeholder); only custom rows unlock them. An older row whose name is not in Item Details also counts as custom, so old drafts remain editable. To use a different rate, choose Custom Item or change the rate in Item Details.
- **Quantity and unit picker**: quantities 1 to 100, a custom quantity, and units (Nos, Kg, Gm, Litre, Metre, Sq. metre, Box, Packet, Set, Pair, Dozen).
- **GST % per line**: 0, 5, 18 and 40 (the 2025 reform slabs). Old 12% and 28% are still accepted on older items and invoices.
- A per-item discount cannot exceed the line amount (a yellow note appears if it was limited); negative rates or quantities are treated as 0.
- Per line: taxable value, tax amount with the CGST/SGST or IGST label, and line total.
- **Add Row** adds a row, opens its item list at once and puts the cursor in the search box, so you can type or pick straight away. **Delete row** asks for confirmation. Long item names wrap onto continuation lines in print.

### 4.4 Invoice discount
- A **Discount** control in the row under the items table, beside "Round off total" (separated by a divider): a number box, a **% | ₹** switch, the result shown next to it (for example `= −₹300.00`), a ✕ clear button, and a dropdown of suggestions when you click the box (**5%, 10%, 15%, 20%** in % mode; **₹50, ₹100, ₹250, ₹500, ₹1,000** in ₹ mode). The box stays editable; totals update while you type.
- When ₹ is chosen, a second switch appears: **Before GST** (default) or **On final amount**.
  - *Before GST*: the rupees come off the taxable amount; GST is worked out on what is left. Example: ₹600 + 18% GST = ₹708 with ₹100 off gives taxable ₹500, GST ₹90, total **₹590**.
  - *On final amount*: the customer pays exactly that much less on the bill. The app works out the smaller pre-GST discount. Example: the same ₹100 gives discount before GST ₹84.75, taxable ₹515.25, GST ₹92.75, total **₹608.00**.
  - A percentage gives the same result either way.
- The discount is shared across the GST slabs in proportion to their taxable value, so every slab's CGST/SGST or IGST is correct. It works with tax-included pricing, round-off and a per-item discount.
- **On the invoice and print**: rows *Amount before discount*, *Discount (10%)* or *Discount (before GST)*, then *Taxable Amount*, the GST lines and *Total*. The amount in words follows the discounted total.
- A discount larger than the amount is limited (with a note). New Invoice clears it. Saved invoices, drafts and quotations keep their discount, and Convert to Invoice carries it over. "GST collected" and sales figures take the discount into account.

### 4.5 Invoice Actions menu
- **Save & Print**: saves the invoice, then opens the print dialog; a fresh invoice with the next number follows.
- **Save as Draft**: saves a draft with no number (see 4.6).
- Also on the toolbar: **New Invoice** (starts the next invoice), **Preview**, and **Reset Invoice** (back to demo data, with confirmation).
- Sharing is done from View All Invoices (section 8).

### 4.6 Saving rules and drafts
- A database must be connected to save.
- Saving an invoice number that already exists asks for confirmation before overriding a saved invoice.
- **A draft has no invoice number**, so it never uses one up. In View All Invoices it shows a **Draft** badge; opened on the sheet, the number box reads "Draft".
- When a draft is saved and printed from its window, it gets the **next free number and today's date** and moves to the **end** of the saved list.
- The same applies to **quotation drafts** (no QTN number until finalised).
- Saving the same draft again updates it instead of adding a copy. Drafts saved by older versions keep working and are numbered fresh when finalised.
- A storage-full warning (red bar) appears if the browser cannot keep the invoice in progress.

---

## 5. Quotations

- **Quotation switch** on the Generate Invoice page turns the sheet into a quotation.
- Title becomes **QUOTATION**; the details box shows *Quotation No*, *Quotation Date*, *Place of Supply* and **Valid Until** (default 15 days after the date, follows the date when it changes).
- Shipping address and payment QR are hidden; bank details, signature and terms stay.
- Footer reads "This is a quotation, not a tax invoice."; one copy only.
- Own number series **QTN/26-27/001**, restarting each April.
- Stored in `invoices.csv` with the status `quotation` and listed in a **Quotations** tab (drafts of quotations also appear there with a Draft badge). Quotations are **not counted as sales** anywhere (KPIs, customer history, item sales).
- **Edit Quotation**: reopens it on the Generate Invoice page; saving replaces the saved quotation.
- **Convert to Invoice**: copies customer, items and discount into a new tax invoice with the next invoice number and today's date; when that invoice is saved the quotation shows an **Invoiced** badge.

---

## 6. Invoice numbering by financial year

- Format **PREFIX/YY-YY/NNN**, for example `INV/26-27/001`.
- Financial year runs April to March; the count **restarts at 001 every April**.
- Starts at 3 digits and grows automatically (1000, 10000 and so on).
- Next number = highest used in that financial year across saved invoices and a counter (kept in the browser and in `app-settings.json`), so a number is not reused after a deletion. **Drafts do not use numbers.**
- If the invoice date moves into another financial year, an auto-generated number moves with it.
- Settings on the *Invoice Details* page: auto-number on/off, editable prefix, "Use next number for this invoice" button.
- A **testing reset button** "Reset invoice number (testing)" (hide it for production with `SHOW_TEST_TOOLS = false` in `app.js`).

---

## 7. Invoice Templates (5 layouts)

Each template changes only the **top** (company, invoice details, customer) and **bottom** (bank, QR, signature, terms); the items and totals table is the same in all.

| Template | Look |
|---|---|
| **Classic** (default) | Boxed header, logo beside company details, black by default |
| **Modern** | Coloured banner, invoice details as chips, card-style bank and signature |
| **Elegant** | Centred letterhead, framed details, bank / QR / signature in one row with terms below |
| **Minimal** | Airy, no boxes: thick accent bar on top, company on the left, a soft details card on the right, customer panels with a fading accent bar, three plain columns (bank, QR, signature) with terms underneath |
| **Corporate** | Two-tone header (company panel + details panel), joined bank / QR / signature strip |

- Templates page shows one card per template with a live preview; click a card to open a **side drawer** with the preview and options. Each card has a title, a short description and a full-width button (**Use this template**, or **Active template** on the current one); Classic carries a **Default** badge.
- **Options per template** (saved separately for each): accent colour (presets plus custom), text size (small / normal / large), logo position (left / right), **Compact layout**, and show or hide **company logo, bank details, UPI QR, signature, terms**.
- Accent colour themes lines, headings and light backgrounds in every template.
- **Compact** applies only to the printed invoice, the PDF and the previews, not to the entry screen.
- **Previews always use sample data**, never your real data, customers or catalogue.
- A saved invoice keeps the template and style it was made with.

---

## 8. View All Invoices

- Tabs: **Saved Invoices**, **Draft Invoices**, **Quotations**, each with a count.
- **Period filter**: All time, This month, Last month, This quarter, This financial year, Custom range.
- **KPI cards**: Total Invoiced, This Month's Sales (with change versus last month), Average Invoice Value, Top Customer.
- Search by invoice number or customer name; sortable columns; pagination with a rows-per-page choice.
- **Row buttons**: saved invoices and quotations have **View | Share | Delete**; drafts have **View | Delete**.
- **Share** opens a window with the invoice as a **picture** (the whole invoice, even a long one) and a **Copy as image** button. After copying, paste it into the WhatsApp chat (or any app) with Ctrl+V. If the browser refuses to copy, the window says how to copy it by hand. The window shows a quotation the same way.
- **View** opens a side drawer with the full preview. Saved invoices can be printed there (**Print Invoice**); quotations get **Edit Quotation**, **Convert to Invoice** and **Print Quotation**; drafts get **Edit**, **Save Draft** and **Save & Print** (which numbers and finalises them).
- **Delete** removes a record with confirmation.

---

## 9. Printing, PDF and sharing

- **Print** uses the browser print dialog with a dedicated print layout (borders, colours and logo preserved, on-screen controls hidden).
- Used for **Save & Print**, **Print Invoice** in the invoice window and **Print Quotation**.
- **Share as picture**: the PNG of an invoice is drawn in the browser (html2pdf.js / html2canvas). Pictures from the app's own folder (the demo logo and signature) are skipped when the app is opened from a file, because the browser locks the picture; your uploaded logo and signature are included.
- **WhatsApp**: customer-level WhatsApp buttons (Customer Details) open a chat with a message; phone numbers get +91 for 10-digit numbers. There is no automatic attachment: the app uses no WhatsApp API.

---

## 10. Customer Details

- Customer directory stored in `customers.csv` (name, address, phone, email, GSTIN, active).
- **Add**, **edit**, **delete**, and **import from another CSV** (duplicates are skipped); **download a CSV template**. A **Show CSV import / Hide CSV import** button sits in the top right of the "Add a customer" card and opens the import section inside that card.
- **KPI cards**: Total Customers, Active Customers, Top Customer, New This Month, Inactive Customers, Missing Details.
- **Filters**: All, Active, Inactive, Billed in last 90 days, Not billed in 90+ days, New this month, Missing phone / GSTIN; search; sorting; pagination.
- **Bulk actions** on selected customers: Share on WhatsApp (one chat at a time with a template message using `{name}` and `{business}`), Export selected to CSV, Mark active / inactive, Delete.
- **Customer detail drawer** (click a name): contact details, billing summary (total billed, GST collected, invoice count, first and last invoice), invoice history (drafts show a Draft badge), top items bought, quick **WhatsApp** and **Call** buttons, **Edit**, and **New invoice for this customer**.
- GSTIN format validation.

---

## 11. Item Details

- Item catalogue stored in `items.csv` (name, HSN/SAC, rate, unit, GST, purchase price / cost, active, price history).
- **Add**, **edit**, **delete**, **import from another CSV**, **download a CSV template** (the **Show CSV import** button sits in the "Add an item" card).
- **Validation**: HSN/SAC must be 4, 6 or 8 digits; rate and GST rate checks.
- **Duplicate warning** when a new item name looks the same as, or similar to, an existing item.
- **Price history** recorded automatically when a rate changes.
- **Purchase price and margin** per item.
- **Active / Inactive** switch (inactive items are hidden from the invoice picker).
- **KPI cards**: Total Items, Best Seller, Top Revenue Item, Not Sold (90 days), Missing Details.
- **Filters**: All, Active, Inactive, Sold, Not sold (90 days), Missing / invalid HSN or rate, Possible duplicates, Old GST rate (12% / 28%); search; sorting; pagination.
- **Bulk actions**: Set GST %, Mark active / inactive, Delete.
- **Item detail drawer**: rate, GST, cost and margin, sales statistics, recent invoices, price history.
- New items appear at the top of the table.

---

## 12. Business & Invoice Setup

- **First-time setup wizard** (Seller, Bank & UPI, Signature, Terms) when the app is opened with no data.
- **Seller Info**: business name, GSTIN (validated), address, mobile, email, state, logo upload. Multiple seller profiles with *Use / Edit / Delete*, CSV import and template, stored in `seller.csv`. The "Show CSV import" button is in the top right of the "Add a seller profile" card.
- **Bank & UPI**: bank, account number, IFSC (validated), branch, UPI ID, option to include the invoice total in the UPI QR. Multiple profiles, stored in `bank.csv`. **Terms & Conditions**: named sets of terms, stored in `terms.csv`. Both have the same CSV import button.
- **Signature**: signature image upload and the name shown below it.
- **Logo and signature pictures** are checked and **shrunk to at most 500 pixels** when uploaded (non-images and files over 10 MB are refused).
- **Invoice Details**: invoice number, dates, place of supply and the numbering settings.
- The active profile in each group feeds every new invoice.

---

## 13. Languages (English and Hindi)

- **English** is the default; **Hindi (हिन्दी)** is available from the **Language** box in the header.
- One setting changes both the **app screens** (menus, buttons, tables, forms, placeholders, messages) and the **printed invoice or quotation** (labels, dates, state names, and the amount in words, for example "नौ सौ सत्तानवे रुपये और पचास पैसे केवल।").
- The language is saved inside each invoice, so a Hindi invoice always prints in Hindi; older invoices stay English. Opening a saved quotation to edit or convert switches the app to the language it was written in.
- Your own data (names, addresses, item names) is never translated.
- The language is also kept in `app-settings.json`. Devanagari font loaded for correct display; more languages can be added through `i18n.js`.

---

## 14. Backup and Restore

- **Download backup (ZIP)**: one ZIP with all six CSV files, the picture files (`images/`) and the template and numbering settings; file name like `invoice-backup-2026-11-14-1822.zip`. Works offline.
- **Restore from a backup**: validates every file first (nothing is changed if any is invalid), asks for confirmation, then:
  - checks that every file can be written and remembers exactly what each holds now;
  - downloads a **safety copy** of the current data;
  - puts the picture files back, writes the CSV files, reads each back and compares it;
  - if anything fails, **the files already written are put back** (and a message names any that could not be);
  - reloads the data without a page refresh.
- **Numbering is never copied from a backup.** The counters can only go up: the next number follows the highest number used in the backup, your current invoices or your current counter. The confirm dialog shows both highest numbers and the next invoice number. Your numbering prefix and auto-numbering setting are kept.
- A checkbox **"Also restore my template settings"** (ticked by default) controls whether template settings come from the backup.
- An older backup that still has pictures inside its CSV files is cleaned up after restoring.
- **Backup reminder** banner when the last backup is older than a chosen interval (Off, 3, 7, 14 or 30 days; default 7) with *Back up now* and *Remind me tomorrow*. The reminder settings and last backup date are kept in `app-settings.json`, so they survive clearing the browser.
- Last backup date shown on the page.

---

## 15. Pictures and settings in the database folder

- **Pictures stored once**: logo and signature are saved as files in `csv/images/<fingerprint>.<png|jpg|…>`. `invoices.csv` and `seller.csv` keep only a short reference (`asset:…`), so the file size stays small (in a test, 5 invoices went from 820 KB to 8 KB). An older invoice still prints the logo it was made with. The browser's copy of your current invoice keeps real pictures, so it does not depend on the folder.
- **One-time clean-up** of an existing database when it is first connected (or when an older backup is restored), with safety copies and a message about the sizes.
- If the pictures folder cannot be written, pictures simply stay inside the data (nothing is lost).
- **`app-settings.json`** holds the default template and colours, numbering prefix and counters, language, and the backup reminder. It is rewritten shortly after any of them changes. When the database is connected, the newer of the browser's settings and the folder's settings wins; counters only go up. A broken file is ignored and rewritten.

---

## 16. Data and security notes

- All data stays on the user's computer; nothing is sent to any server by the app.
- CSV files are the only database, so regular backups are important.
- Nothing is fetched from the internet. All libraries and fonts are local; only the WhatsApp link opens an online page.
- Ordinary text fields are escaped before being drawn; the logo and signature values are escaped too.
- WhatsApp opens with message text only; no WhatsApp API is used.

---

## 17. Known limits and open items

Fixed since the first test report: negative totals and the Hindi crash (discounts are limited and amount in words handles any value), the UTC date problem (the app uses the Indian date), the storage-full warning and logo size limit, large invoice files (pictures stored once), logo/signature injection, backup restore rollback, restore settings warning, backup date lost with browser data, and offline backup. See `TEST-REPORT.md` for the full list.

Still open (from the test report):
- One bad row in `invoices.csv` can block the whole database from connecting.
- Each save rewrites the whole CSV file from memory, so a second browser tab or Excel editing the same files can be overwritten.
- Exported CSV cells that start with `=`, `+`, `-` or `@` are written as they are (formula risk in Excel).
- A quotation made while auto-numbering is off keeps an invoice-style number; a prefix of `QTN` would clash with the quotation series.
- A blank ₹0 invoice can be saved; the "Page 1 / 1" footer is fixed text; the Minimal template prints on 2 pages where others print on 1 for a few items.
- CSV import silently corrects some values (invalid GST becomes 18, unknown unit becomes Nos).
- Very large catalogues (thousands of items) make the invoice sheet heavy.
- Some long messages and pop-up dialogs stay in English when the language is Hindi.
- Needs a Chromium browser (Chrome or Edge) for folder access; no user login or multi-user access; one browser profile and one CSV folder per business.
