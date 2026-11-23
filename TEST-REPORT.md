# InvoiceGen – Test Report and Bug List

Date of testing: 14 Nov 2026. Nothing was fixed while testing; this is a list of findings only.

## How it was tested

- **Automated checks in headless Chrome** against the real `app.js`, `i18n.js` and `style.css`, using fake in-memory file handles in place of the CSV folder. About 12 test scripts covered tax calculation, amount in words, numbering, CSV import and export, saving, quotations, backup and restore, languages, templates, security and size/performance, plus PDF page counts of the print layout for every template.
- **Code review** for things that cannot be run in a script.
- **Not tested** (needs a real person, device or account): the real Windows folder-permission flow, the real print dialog and printers, real WhatsApp, phones and tablets, Firefox / Safari, screen readers and keyboard use, and a visual review of every page. Timings could not be measured (the test browser clock is frozen), so performance items are based on counts and sizes.

Status key: **Confirmed** = reproduced by a test. **Code** = found by reading the code, not run.

---

## High

| # | Problem | Evidence | Where it hurts |
|---|---|---|---|
| H1 | **A negative invoice total breaks the page.** A discount larger than the line amount is accepted and gives a negative total. In English the words read "INR undefined Hundred And undefined Crore…". In **Hindi the page crashes** with a stack overflow, the sheet stops rendering, and every later render fails until the discount is fixed. | Confirmed | Generate Invoice, Hindi mode |
| H2 | **One bad row blocks the whole database.** A single invalid row or snapshot in `invoices.csv` makes the whole file fail, so **Connect Database fails for all six files** and the user cannot open the app to fix it. A row that is valid JSON but missing the seller (`snapshot.seller`) passes the check, then **View crashes** with no message and leaves the preview half open. | Confirmed | Connect Database, View Invoice |
| H3 | **"Today" uses UTC, not Indian time.** `new Date().toISOString()` is used in five places. Between 00:00 and 05:30 IST the app thinks it is the previous day. At 00:30 IST on 1 April it gives 31 March, so the invoice is dated in the old financial year and gets a number from the old series. | Confirmed (simulated 00:30 IST gave 2026-03-31) | New invoice date, numbering, quotation validity |
| H4 | **`invoices.csv` grows without limit.** Every saved invoice stores a full copy of the logo and signature as base64 text. 200 invoices with a normal logo produce about **46 MB**, and every save rewrites the whole file. The sample `invoices.csv` is already 1.4 MB for a few invoices. | Confirmed | Saving, backup size, restore time |
| H5 | **Storage full is silent.** With a large logo the in-progress invoice cannot be saved to the browser. `save()` returns false and the page shows no warning, so the draft is lost on refresh. There is also no size limit when a logo or signature is uploaded. | Confirmed | Any page, large logo |
| H6 | **Stale data can overwrite newer data.** Each save writes the whole CSV from what is in memory. A second tab, or a file edited in Excel while the app is open, is overwritten by the next save. | Code | All saves |

## Medium

| # | Problem | Evidence |
|---|---|---|
| M1 | **Script injection through the logo or signature.** `src="${logo}"` is not escaped. A crafted `seller.csv`, backup ZIP or invoice snapshot can run script when the invoice is shown. All other fields are escaped correctly. | Confirmed |
| M2 | **CSV formula injection.** Exported cells starting with `=`, `+`, `-` or `@` (for example a customer named `=HYPERLINK(...)`) are written as they are, and Excel treats them as formulas. | Confirmed |
| M3 | **Save & Share and bulk WhatsApp clean phone numbers differently.** A customer number such as `09015119802` works in bulk WhatsApp (becomes 91 9015…) but Save & Share opens `wa.me/09015119802`, which is invalid. A field with two numbers is joined into one invalid number. | Confirmed |
| M4 | **Prefix `QTN` collides with quotations.** If the invoice prefix is set to QTN, invoices and quotations both get `QTN/26-27/001`. | Confirmed |
| M5 | **With auto-numbering off, a quotation keeps an invoice-style number** (for example `INV/26-27/050`) and nothing warns about it. | Confirmed |
| M6 | **A blank invoice can be saved.** No customer, no items and a total of ₹0 are accepted, and the number is used up. | Confirmed |
| M7 | **The backup reminder disappears.** After visiting Backup & Restore and then going to Generate Invoice, the banner stays hidden, because the saved "current page" value is not reset. | Confirmed |
| M8 | **Restore is not all-or-nothing.** If writing fails halfway (for example disk full), some files are replaced and others are not. A safety ZIP is downloaded first, but the user has to notice and recover. Restoring also overwrites the numbering prefix and counters with the backup's values without saying so. | Confirmed |
| M9 | **Printing:** the footer always says "Page 1 / 1", even on multi-page invoices (30 items print on 3 pages in Classic and Corporate, 60 items on 4). **Minimal prints 2 pages for 5 items** while the other four templates print on 1. | Confirmed |
| M10 | **CSV import changes data silently.** An invalid GST rate (for example 7) becomes 18, an unknown unit becomes Nos, letters are accepted as an HSN, and an Excel-mangled HSN such as `9.02E+03` is accepted. | Confirmed |
| M11 | **Large catalogues make the page heavy.** With 5,000 customers and 5,000 items the invoice sheet has about **30,000 page elements**, and the whole sheet, including every dropdown option, is rebuilt on each keystroke. | Counts confirmed; timings not measured |
| M12 | **Tax split can be wrong without a warning.** If the seller state or place of supply is empty the invoice is treated as IGST. The customer's GSTIN state code is not linked to Place of Supply. The GSTIN check accepts any state code (for example 99). | Confirmed / Code |

## Low

| # | Problem |
|---|---|
| L1 | Amount in words: "One Rupees" (should be "One Rupee"); totals of 1 trillion or more and negative totals print "undefined". |
| L2 | The Invoice Templates page has repeated element ids (`custDropdown` ×6, `quantityMenu0` ×6, `inlineRo` ×6) because the previews contain full invoice sheets. |
| L3 | In Hindi mode, your own data that exactly matches a screen label is translated on screen (an address "Active" shows as "सक्रिय"). The saved data is not changed. |
| L4 | Long toast messages, pop-up dialogs (`confirm` / `alert`) and some sentences with changing numbers stay in English in Hindi mode. |
| L5 | A quotation keeps its green "Invoiced" badge after the invoice made from it is deleted. |
| L6 | A white accent colour makes lines and headings invisible. A 3-digit colour is silently replaced by the default. |
| L7 | If the saved invoice in the browser is corrupt, the app silently falls back to the demo invoice with no message. |
| L8 | Quotation "Valid Until" follows the date only when it would otherwise fall before it. It does not move forward for small date changes. |
| L9 | Changing the invoice prefix restarts numbering at 001 with no warning. A number-only prefix such as 123 is accepted. |
| L10 | Invoice dates can be set to any date, with no check against the financial year of the number or against the previous invoice. Deleting an invoice leaves a gap in the number series. |
| L11 | An `invoices.csv` that contains two rows with the same invoice number loads without complaint. |
| L12 | Excel can damage the CSVs when they are edited there: it drops the leading zero of HSN codes (`0902`) and phone numbers, and turns long numbers into scientific notation. |

---

## Checked and working

- Tax maths: CGST + SGST versus IGST, tax included in or added to the rate, round-off, fractional quantities, tax grouped by rate, line totals adding up to the invoice total.
- Financial-year numbering: April 1 reset, growth beyond 999, mixed-case prefixes, numbers not reused after a deletion (as long as browser storage is kept), separate quotation series.
- Quotations: saved with their own status, left out of sales, customer and item statistics and KPIs; Convert to Invoice picks up the next invoice number; Edit Quotation replaces the saved quotation.
- Saving: override prompt, draft rules, empty invoice number is refused.
- Backup: invalid ZIP, ZIP with no CSV and one invalid CSV are all refused with nothing changed; a safety copy is downloaded first; settings are restored; reminder timing is correct for never, 6 days, 8 days and snoozed.
- Languages: switching to Hindi and back restores every piece of text; Hindi invoices keep their language when opened in an English app; old invoices without a language open fine; Hindi numbers in words for 0 to 99, lakh, crore and paise.
- Templates: unknown template or style values fall back safely; old invoices without style or docType open fine.
- Corrupt browser storage (invalid JSON, wrong types) does not stop the app from loading.
- Security: every ordinary text field is escaped (customer, seller, items, bank, terms, invoice number, directories, archive, drawers). The only gaps are the logo and signature (M1).
- CSV: commas, quotes and line breaks inside cells, BOM, CR / LF / CRLF, and unclosed quotes (with a clear error) are handled.

---

## Suggested fix order

1. H1 (negative totals and the Hindi crash), H3 (Indian date), H5 (storage warning and logo size limit).
2. H2 (skip or report bad CSV rows instead of failing the whole file), M1 (escape the logo and signature).
3. H4 (store the logo and signature once, not in every invoice).
4. M3, M7, M6, M4 and M5 (small, quick fixes).
5. M9 (page numbers and Minimal's height), M8 (restore safety), M10 (import warnings), M12 (tax-split warnings).
6. The Low items as time allows.
