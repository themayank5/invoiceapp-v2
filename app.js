const KEY = 'gst_invoice_v1';
const CUSTOMER_KEY = `${KEY}_customers`;
const ITEM_KEY = `${KEY}_catalog_items`;
const PROFILE_KEYS = {
  seller: `${KEY}_seller_profiles`,
  bank: `${KEY}_bank_profiles`,
  terms: `${KEY}_terms_profiles`
};
const RESET_KEY = `${KEY}_reset`;
const CSV_HANDLE_DB = 'invoice-generator-csv-access';
const CSV_HANDLE_STORE = 'directories';
const CSV_DIRECTORY_KEY = 'app-csv-folder';
const STATES = [['01', 'Jammu & Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'], ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'], ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'], ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'], ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'], ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'], ['26', 'Dadra & Nagar Haveli and Daman & Diu'], ['27', 'Maharashtra'], ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'], ['32', 'Kerala'], ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman & Nicobar'], ['36', 'Telangana'], ['37', 'Andhra Pradesh'], ['38', 'Ladakh']];
const LABELS = ['ORIGINAL FOR RECIPIENT', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR SUPPLIER'];
const QUANTITY_UNITS = ['Nos', 'Kg', 'Gm', 'Litre', 'Metre', 'Sq. metre', 'Box', 'Packet', 'Set', 'Pair', 'Dozen'];
// GST rates after the 22 Sep 2025 reform (56th GST Council): 0, 5, 18 and the 40% slab for select luxury/sin goods.
// 12% and 28% were removed; they are still accepted for older invoices/items and shown as "old rate".
const GST_RATES = [0, 5, 18, 40];
const LEGACY_GST_RATES = [12, 28];
const KNOWN_GST_RATES = [...GST_RATES, ...LEGACY_GST_RATES].sort((a, b) => a - b);
const isLegacyGst = rate => LEGACY_GST_RATES.includes(Number(rate));
const gstLabel = rate => (isLegacyGst(rate) ? `${rate}% (old rate)` : `${rate}%`);
// Rates offered in a dropdown: the current ones, plus the item's own old rate so existing data still displays correctly.
const gstOptionsFor = selected => (isLegacyGst(selected) ? [...GST_RATES, Number(selected)].sort((a, b) => a - b) : GST_RATES);
/* ---------- GSTIN validation (works offline) ----------
   error  = cannot be a GSTIN (wrong length/pattern, unknown state code) → blocks saving
   warn   = well-formed but the check character or PAN type letter does not match → ask the user to confirm
   ok     = well-formed and the check character matches ("looks valid" – it is NOT proof the GSTIN is registered) */
const GSTIN_FORMAT = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PAN_HOLDER_TYPES = {
  A: 'Association of persons', B: 'Body of individuals', C: 'Company', F: 'Firm / LLP', G: 'Government',
  H: 'Hindu undivided family', J: 'Artificial juridical person', L: 'Local authority', P: 'Individual / proprietor', T: 'Trust'
};
const GST_PORTAL_URL = 'https://services.gst.gov.in/services/searchtp';

function gstinCheckChar(first14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = GSTIN_CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36];
}

function validateGstin(value) {
  const gstin = String(value ?? '').trim().toUpperCase();
  if (!gstin) return { status: 'empty', gstin: '' };
  if (!GSTIN_FORMAT.test(gstin)) {
    return { status: 'error', gstin, message: gstin.length !== 15 ? `A GSTIN has 15 characters (this has ${gstin.length}).` : 'Format looks wrong. A GSTIN looks like 27AAAPL1234C1Z5.' };
  }
  const stateCode = gstin.slice(0, 2);
  const stateName = STATES.find(([code]) => code === stateCode)?.[1] || { 97: 'Other Territory', 99: 'Centre Jurisdiction' }[stateCode] || '';
  if (!stateName) return { status: 'error', gstin, message: `State code ${stateCode} is not a valid GST state code.` };
  const pan = gstin.slice(2, 12);
  const holderType = PAN_HOLDER_TYPES[pan[3]] || '';
  const info = { gstin, stateCode, stateName, pan, holderType };
  if (gstinCheckChar(gstin) !== gstin[14]) {
    return { status: 'warn', ...info, message: 'The check character does not match, so a character may be mistyped. Compare it with the GST portal.' };
  }
  if (!holderType) {
    return { status: 'warn', ...info, message: `The PAN inside this GSTIN has an unusual type letter “${pan[3]}”. Double-check it.` };
  }
  return { status: 'ok', ...info, message: `Looks valid · ${stateName} · PAN ${pan} · ${holderType}` };
}

// Kept as a drop-in for the old regex: only "cannot be a GSTIN" problems block saving.
const GST_RE = { test: value => validateGstin(value).status !== 'error' };

function gstinHintHTML(value) {
  const result = validateGstin(value);
  if (result.status === 'empty') return '';
  if (result.status === 'error') return `<span class="gstin-msg is-error">✕ ${esc(result.message)}</span>`;
  return `<span class="gstin-msg ${result.status === 'ok' ? 'is-ok' : 'is-warn'}">${result.status === 'ok' ? '✓' : '⚠'} ${esc(result.message)}</span> <button type="button" class="btn btn-link btn-sm p-0 gstin-verify" data-gst-verify="${esc(result.gstin)}" title="Copies the GSTIN and opens the official GST portal search page">Verify on GST portal ↗</button>`;
}

function gstinBadgeHTML(value) {
  const result = validateGstin(value);
  if (result.status === 'error') return ` <span class="badge text-bg-danger" title="${esc(result.message)}">Invalid</span>`;
  if (result.status === 'warn') return ` <span class="badge text-bg-warning" title="${esc(result.message)}">Check</span>`;
  return '';
}
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function shouldCloseQuantityMenu(row) {
  if (row !== 0) return true;
  return Number(S.items[0]?.qty) > 0 && Boolean(S.items[0]?.unitExplicit);
}

/* ---------- demo customer directory ---------- */
const DEMO_CUSTOMERS = [
  { name: 'Rahul Sharma', gstin: '07AAAPZ5522Q1Z2', phone: '9876543210', email: 'rahul.sharma@example.com', billing: '12, Connaught Place  New Delhi, DELHI, 110001', shipSame: true, shipping: '' },
 
];

/* ---------- demo item catalog ---------- */
const DEMO_ITEMS = [
  { name: 'Tata Nexon XZ+', hsn: '87032210', rate: 100 },
  
];

/* ---------- invoice templates ----------
   A template is a LAYOUT for the top (title, seller, invoice details, customer) and bottom (bank, QR, signature, terms)
   of the invoice. The items/totals table is identical in every template. Each template has its own styling options,
   and one template is the default for new invoices. The style in use is saved inside every invoice. */
const TEMPLATES = [
  ['classic', 'Classic', 'Boxed header with the logo beside your company details.'],
  ['modern', 'Modern', 'Coloured banner, invoice details as chips and card-style bank and signature.'],
  ['elegant', 'Elegant', 'Centred letterhead with framed details and a one-row bottom.'],
  ['minimal', 'Minimal', 'Clean and airy: company on the left, invoice details listed on the right, no boxes.'],
  ['corporate', 'Corporate', 'Two-tone header with a coloured company panel and a joined bank, QR and signature strip.']
];
const TEMPLATE_DEFAULT_ACCENT = { classic: '#000000', modern: '#2563eb', elegant: '#0f766e', minimal: '#be123c', corporate: '#1e3a8a' };
const TEMPLATE_LOGO_DEFAULT = { classic: 'right', modern: 'left', elegant: 'left', minimal: 'left', corporate: 'left' };
const DEFAULT_TEMPLATE_OPTIONS = { showLogo: true, compact: false, fontSize: 'md', logoPosition: 'right', showBank: true, showQr: true, showSignature: true, showTerms: true };
const DEFAULT_STYLE = { template: 'classic', accent: TEMPLATE_DEFAULT_ACCENT.classic, ...DEFAULT_TEMPLATE_OPTIONS };
const TEMPLATE_KEY = 'gst_invoice_templates_v1';

// Returns a complete, valid style. Invoices saved before templates existed simply become Classic.
function normalizeStyle(raw = {}) {
  const template = TEMPLATES.some(([key]) => key === raw.template) ? raw.template : 'classic';
  return {
    ...DEFAULT_TEMPLATE_OPTIONS, ...raw, template,
    accent: /^#[0-9a-f]{6}$/i.test(raw.accent || '') ? raw.accent : TEMPLATE_DEFAULT_ACCENT[template],
    showLogo: raw.showLogo !== false,
    compact: raw.compact === true,
    fontSize: ['sm', 'md', 'lg'].includes(raw.fontSize) ? raw.fontSize : 'md',
    logoPosition: ['left', 'right'].includes(raw.logoPosition) ? raw.logoPosition : TEMPLATE_LOGO_DEFAULT[template]
  };
}

// The style stored on an invoice (current invoice or a saved snapshot).
function invoiceStyle(state = S) {
  return normalizeStyle(state?.style || {});
}

// Colour variables as plain hex values (print and PDF capture render these reliably).
function accentVars(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const tint = amount => [r, g, b].map(v => Math.round(v + (255 - v) * amount).toString(16).padStart(2, '0')).join('');
  const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
  return `--inv-accent:${hex};--inv-accent-soft:#${tint(0.92)};--inv-accent-line:#${tint(0.7)};--inv-accent-text:${light ? '#111827' : '#ffffff'}`;
}

/* ---------- paper sizes ---------- */
// printable = usable page height in mm for A4 / A5 / half-page; receipts (thermal rolls) have no fixed height.
const PAPERS = {
  a4: { label: 'A4 (full page)', w: 210, h: 297, margin: '8mm 2mm 12mm 2mm', printable: 277 },
  a4half: { label: 'A4 half page', w: 210, h: 148.5, margin: '4mm 4mm 5mm 4mm', printable: 138 },
  a5: { label: 'A5', w: 148, h: 210, margin: '6mm 3mm 8mm 3mm', printable: 194 },
  thermal80: { label: 'Thermal 80 mm', w: 80, receipt: true },
  thermal58: { label: 'Thermal 58 mm', w: 58, receipt: true }
};

function loadTemplateSettings() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '{}') || {}; } catch { saved = {}; }
  return {
    defaultTemplate: TEMPLATES.some(([key]) => key === saved.defaultTemplate) ? saved.defaultTemplate : 'classic',
    paper: PAPERS[saved.paper] ? saved.paper : 'a4',
    options: saved.options && typeof saved.options === 'object' ? saved.options : {}
  };
}
let templateSettings = loadTemplateSettings();

function saveTemplateSettings() {
  try { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templateSettings)); } catch (error) { console.warn('Could not save template settings.', error); }
  touchSettings();
}

// Full style (layout + the user's saved options) for one template.
const templateStyle = key => normalizeStyle({ ...(templateSettings.options[key] || {}), template: key });
const defaultTemplateStyle = () => templateStyle(templateSettings.defaultTemplate);

// Today as YYYY-MM-DD in the computer's own time zone. (toISOString() gives the UTC date, which is the previous day in India
// between midnight and 5:30 am.)
function todayISO() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Invoice-level discount. It is taken off the taxable amount (before GST), so the GST of every slab is worked out on the reduced amount.
function invoiceDiscountAmount(taxableBefore, discount, grossBefore = taxableBefore) {
  const value = Math.max(0, Number(discount?.value) || 0);
  if (!(taxableBefore > 0) || !value) return { amount: 0, percent: 0, capped: false, billDiscount: 0 };
  if (discount.type === 'amount') {
    if (discount.basis === 'final' && grossBefore > 0) {
      // The rupees typed are what the customer should pay less on the final bill (GST included).
      // The part taken off the taxable amount is smaller: the GST on it comes off as well.
      const billDiscount = Math.min(value, grossBefore);
      const amount = round2(billDiscount * taxableBefore / grossBefore);
      return { amount, percent: Math.round(amount / taxableBefore * 1e6) / 1e4, capped: value > grossBefore, billDiscount };
    }
    const amount = Math.min(value, taxableBefore);
    return { amount: round2(amount), percent: Math.round(amount / taxableBefore * 1e6) / 1e4, capped: value > taxableBefore, billDiscount: 0 };
  }
  const percent = Math.min(value, 100);   // a percentage is the same on the taxable amount and on the final amount
  return { amount: round2(taxableBefore * percent / 100), percent, capped: value > 100, billDiscount: 0 };
}
// Share of the invoice that is left after the discount (used by the statistics that work from saved invoices).
function snapshotNetFactor(snap) {
  let grossBefore = 0;
  const taxableBefore = (snap?.items || []).reduce((sum, line) => {
    const g = +line.gst || 0, base = Math.max(0, (+line.rate || 0) * (+line.qty || 0) - (+line.disc || 0));
    const net = snap.priceMode === 'incl' ? base / (1 + g / 100) : base;
    grossBefore += snap.priceMode === 'incl' ? base : base * (1 + g / 100);
    return sum + net;
  }, 0);
  const { amount } = invoiceDiscountAmount(taxableBefore, snap?.discount, grossBefore);
  return taxableBefore > 0 ? 1 - amount / taxableBefore : 1;
}

const EMPTY_STATE = {
  seller: { name: '', gstin: '', addr: '', mobile: '', email: '', state: '', logo: null },
  meta: { no: '', date: '', due: '', pos: '' },
  customer: { name: '', gstin: '', phone: '', email: '', billing: '', shipSame: true, shipping: '', shippingPhone: '', shippingEmail: '' },
  items: [{ name: '', hsn: '', rate: '', qty: '', unit: 'Nos', unitExplicit: false, gst: '', disc: '' }],
  bank: { bank: '', acc: '', ifsc: '', branch: '', upi: '', qrAmt: false },
  sign: { sig: null, companyName: '' },
  terms: { list: [''] },
  priceMode: 'excl', round: false, copies: 1, docType: 'invoice', lang: 'en', watermark: 'paid', paper: '',
  discount: { type: 'percent', value: '' },
  style: { ...DEFAULT_STYLE }
};
const DEMO_DATA = {
  ...structuredClone(EMPTY_STATE),
  seller: {
    ...EMPTY_STATE.seller,
    name: 'ABC Traders (Demo)',
    gstin: '27AAAAA0000A1Z2',
    addr: '123 Market Road new delhi, Delhi, 110092',
    mobile: '9876543210',
    email: 'seller@example.com',
    state: '27',
    logo: 'img/company%20logo.png'
  },
  meta: {
    no: 'INV-001',
    date: todayISO(),
    due: '',
    pos: '07'
  },
  customer: {
    name: 'Sample Customer',
    gstin: '',
    phone: '9876543210',
    email: 'customer@example.com',
    billing: '456 Example Street new delhi, Delhi, 110092',
    shipSame: true,
    shipping: '',
    shippingPhone: '',
    shippingEmail: ''
  },
  bank: {
    bank: 'Demo Bank',
    acc: '0000000000',
    ifsc: 'DEMO0000001',
    branch: 'Pune',
    upi: 'demo@example',
    qrAmt: false
  },
  sign: {
    sig: 'img/signature.png',
    companyName: 'ABC Traders (Demo)'
  },
  terms: {
    list: [
      'This is a demo invoice. Replace these terms with your own.',
      'Goods once sold cannot be taken back or exchanged.'
    ]
  }
};

let hasSavedInvoice = false;
let S = load();
S.lang = uiLang;   // the invoice being made uses the language the app is set to
let printing = false;
let startNewAfterPrint = false;
let openQuantityMenuRow = -1;
let openCustomQuantityRow = -1;
let importedCustomers = loadImportedCustomers();
let customerCsvHandle = null;
let invoiceCsvHandle = null;
let archivedInvoices = [];
let archiveSearch = '';
let archiveTab = 'saved';

/* ---------- invoice numbering by financial year ----------
   Format: PREFIX/25-26/0001. The financial year runs April to March, so the running number
   starts again at 0001 every April. The next number is one more than the highest number already
   used in that financial year (saved invoices, drafts and the counter kept in this browser). */
// Testing helpers (such as the number reset button). Set to false before going live to hide them.
const SHOW_TEST_TOOLS = true;
const NUMBERING_KEY = 'gst_invoice_numbering_v1';
function loadNumbering() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(NUMBERING_KEY) || '{}') || {}; } catch { saved = {}; }
  return {
    auto: saved.auto !== false,
    prefix: String(saved.prefix ?? 'INV').replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 10) || 'INV',
    counters: saved.counters && typeof saved.counters === 'object' ? saved.counters : {},
    ignored: Array.isArray(saved.ignored) ? saved.ignored : []   // invoice numbers skipped after a test reset
  };
}
let numbering = loadNumbering();

// "Round off total" is remembered: a new invoice starts with whatever was last chosen on the Generate Invoice page.
const ROUND_DEFAULT_KEY = 'gst_invoice_round_default_v1';
function loadRoundOffDefault() {
  try { return localStorage.getItem(ROUND_DEFAULT_KEY) === '1'; } catch { return false; }
}
let roundOffDefault = loadRoundOffDefault();
function setRoundOffDefault(on) {
  roundOffDefault = Boolean(on);
  try { localStorage.setItem(ROUND_DEFAULT_KEY, roundOffDefault ? '1' : '0'); } catch (error) { console.warn('Could not save the round-off default.', error); }
  touchSettings();
}
function saveNumbering() {
  try { localStorage.setItem(NUMBERING_KEY, JSON.stringify(numbering)); } catch (error) { console.warn('Could not save numbering settings.', error); }
  touchSettings();
}
// '2026-04-01' -> '26-27', '2026-03-31' -> '25-26'
function financialYearLabel(dateStr) {
  const parsed = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}
const QUOTE_PREFIX = 'QTN';
const isQuotation = (state = S) => state?.docType === 'quotation';
const docPrefix = quote => (quote ? QUOTE_PREFIX : numbering.prefix);
function formatInvoiceNumber(fy, seq, quote = false) {
  return `${docPrefix(quote)}/${fy}/${String(seq).padStart(3, '0')}`;
}
// Number in an invoice no. of the form <anything>/YY-YY/<digits>; null when it does not follow the pattern.
function parseFinancialYearNumber(no) {
  const match = String(no || '').trim().match(/^(.+)\/(\d{2}-\d{2})\/(\d+)$/);
  return match ? { prefix: match[1], fy: match[2], seq: Number(match[3]) } : null;
}
function nextInvoiceNumber(dateStr, { includeCurrent = false, quote = isQuotation() } = {}) {
  const fy = financialYearLabel(dateStr);
  const counterKey = quote ? `Q:${fy}` : fy;
  const seqIn = no => {
    const parsed = parseFinancialYearNumber(no);
    return parsed && parsed.fy === fy && parsed.prefix.toUpperCase() === docPrefix(quote) ? parsed.seq : 0;
  };
  let max = Number(numbering.counters[counterKey]) || 0;
  archivedInvoices.forEach(invoice => {
    if (invoice.status === 'draft') return;   // drafts have no number
    if (!numbering.ignored.includes(String(invoice.invoiceNo).toLowerCase())) max = Math.max(max, seqIn(invoice.invoiceNo));
  });
  if (includeCurrent) max = Math.max(max, seqIn(S?.meta?.no));
  return formatInvoiceNumber(fy, max + 1, quote);
}
// Remember the highest number used so a number is never handed out twice, even after an invoice is deleted.
function noteInvoiceNumberUsed(no) {
  const ignoredAt = numbering.ignored.indexOf(String(no).toLowerCase());
  if (ignoredAt !== -1) { numbering.ignored.splice(ignoredAt, 1); saveNumbering(); }
  const parsed = parseFinancialYearNumber(no);
  if (!parsed) return;
  const counterKey = parsed.prefix.toUpperCase() === QUOTE_PREFIX ? `Q:${parsed.fy}` : parsed.fy;
  if (parsed.seq <= (Number(numbering.counters[counterKey]) || 0)) return;
  numbering.counters[counterKey] = parsed.seq;
  saveNumbering();
}
/* ---------- backup and restore (one ZIP with every CSV) ----------
   The CSV files are the only database, so a backup is a single ZIP holding all six CSV files plus
   the template and numbering settings kept in this browser. Restoring writes them back into the
   connected CSV folder. A reminder banner appears when the last backup is getting old. */
const BACKUP_KEY = 'gst_invoice_backup_v1';
const BACKUP_REMINDER_CHOICES = [[0, 'Off'], [3, 'Every 3 days'], [7, 'Every 7 days'], [14, 'Every 14 days'], [30, 'Every 30 days']];
function loadBackupMeta() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(BACKUP_KEY) || '{}') || {}; } catch { saved = {}; }
  const days = Number(saved.reminderDays);
  return {
    lastBackup: typeof saved.lastBackup === 'string' ? saved.lastBackup : null,
    reminderDays: BACKUP_REMINDER_CHOICES.some(([value]) => value === days) ? days : 7,
    snoozeUntil: typeof saved.snoozeUntil === 'string' ? saved.snoozeUntil : null
  };
}
let backupMeta = loadBackupMeta();
function saveBackupMeta() {
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(backupMeta)); } catch (error) { console.warn('Could not save backup settings.', error); }
  touchSettings();
}
const backupDatabaseConnected = () => CSV_FILES.every(kind => Boolean(csvHandle(kind)));
const backupDaysSince = iso => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
function backupLastText() {
  if (!backupMeta.lastBackup) return 'No backup has been made from this browser yet.';
  const days = backupDaysSince(backupMeta.lastBackup);
  const when = new Date(backupMeta.lastBackup).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `Last backup: ${when} (${days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`}).`;
}

async function readCsvTexts() {
  const texts = {};
  for (const kind of CSV_FILES) texts[kind] = await (await csvHandle(kind).getFile()).text();
  return texts;
}

async function buildBackupZip() {
  if (typeof JSZip === 'undefined') throw new Error('The ZIP library could not be loaded. Check your internet connection and reload the page.');
  const texts = await readCsvTexts();
  const zip = new JSZip();
  for (const kind of CSV_FILES) zip.file(`csv/${kind}.csv`, texts[kind]);
  zip.file('app-settings.json', JSON.stringify({ app: 'invoice-app', createdAt: new Date().toISOString(), templates: templateSettings, numbering }, null, 2));
  (await readImageFiles()).forEach(image => zip.file(`images/${image.name}`, image.bytes));   // the logo and signature files saved in csv/images
  zip.file('README.txt', 'Backup of your invoice data.\r\nUse Backup & Restore in the app to restore this ZIP.\r\nThe csv folder holds customers, items, seller, bank, terms and invoices.\r\n');
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function backupFileName(prefix = 'invoice-backup') {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${prefix}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.zip`;
}

async function downloadBackup({ safety = false } = {}) {
  const blob = await buildBackupZip();
  downloadBlob(blob, backupFileName(safety ? 'before-restore' : 'invoice-backup'));
  if (!safety) {
    backupMeta.lastBackup = new Date().toISOString();
    backupMeta.snoozeUntil = null;
    saveBackupMeta();
    updateBackupReminder();
  }
}

function setBackupStatus(message, type = '') {
  const status = $('#backupStatus');
  if (!status) return;
  status.className = `backup-status ${type}`;
  status.textContent = message;
  status.hidden = !message;
}

async function runBackupFromPage() {
  if (!backupDatabaseConnected()) { setBackupStatus('Connect the database first, then back up.', 'text-danger'); return; }
  setBackupStatus('Preparing your backup…');
  try {
    await downloadBackup();
    setBackupStatus('Backup downloaded. Keep the ZIP somewhere safe, such as a pen drive or cloud drive.', 'text-success');
    const last = $('#backupLastText');
    if (last) last.textContent = backupLastText();
  } catch (error) {
    console.error('Backup failed.', error);
    setBackupStatus(error.message || 'Could not create the backup.', 'text-danger');
  }
}

const BACKUP_PARSERS = {
  customers: text => parseCustomerCsv(text),
  items: text => parseItemCsv(text),
  invoices: text => parseInvoiceArchive(text),
  seller: text => parseProfileCsv('seller', text),
  bank: text => parseProfileCsv('bank', text),
  terms: text => parseProfileCsv('terms', text)
};

// Highest number used per series in a list of invoice records: { '26-27': 14, 'Q:26-27': 3 }.
function highestNumbersByYear(records) {
  const highest = {};
  records.forEach(record => {
    if (record.status === 'draft') return;
    const parsed = parseFinancialYearNumber(record.invoiceNo);
    if (!parsed) return;
    const key = parsed.prefix.toUpperCase() === QUOTE_PREFIX ? `Q:${parsed.fy}` : parsed.fy;
    highest[key] = Math.max(highest[key] || 0, parsed.seq);
  });
  return highest;
}

async function writeFileBytes(handle, data) {
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
    await writable.close();
  } catch (error) {
    try { await writable.abort(); } catch { /* already closed */ }
    throw error;
  }
}

async function restoreFromBackup(file) {
  if (!file) return;
  if (!backupDatabaseConnected()) { setBackupStatus('Connect the database first. The backup is restored into the connected CSV folder.', 'text-danger'); return; }
  if (typeof JSZip === 'undefined') { setBackupStatus('The ZIP library could not be loaded. Check your internet connection and reload.', 'text-danger'); return; }
  setBackupStatus('Reading the backup…');
  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (error) {
    setBackupStatus('That file is not a valid ZIP backup.', 'text-danger');
    return;
  }
  // Accept the CSVs at the top level or inside any folder.
  const entries = {};
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const base = path.split('/').pop().toLowerCase();
    const kind = CSV_FILES.find(name => base === `${name}.csv`);
    if (kind && !entries[kind]) entries[kind] = entry;
  });
  const found = CSV_FILES.filter(kind => entries[kind]);
  if (!found.length) { setBackupStatus('This ZIP does not contain any of the app CSV files (customers.csv, items.csv, invoices.csv and so on).', 'text-danger'); return; }

  const texts = {};
  const counts = [];
  let backupRecords = null;
  try {
    for (const kind of found) {
      texts[kind] = await entries[kind].async('string');
      const result = BACKUP_PARSERS[kind](texts[kind]);
      if (kind === 'invoices' && Array.isArray(result)) backupRecords = result;
      counts.push(`${kind}.csv${Array.isArray(result) ? ` (${result.length})` : ''}`);
    }
  } catch (error) {
    setBackupStatus(`The backup was not restored because one of its files is not valid: ${error.message}`, 'text-danger');
    return;
  }

  // Pictures in the backup (csv/images/…): put back before the CSV files, which refer to them.
  const imageFiles = [];
  const imageEntries = [];
  zip.forEach((path, entry) => { if (!entry.dir && /(^|\/)images\/[0-9a-f]{16}\.[a-z]+$/i.test(path)) imageEntries.push([path.split('/').pop(), entry]); });
  for (const [name, entry] of imageEntries) imageFiles.push({ name, bytes: await entry.async('uint8array') });

  // Settings kept in the backup: templates may be restored (the user's choice); numbering is never copied, it is worked out below.
  let settings = null;
  const settingsEntry = zip.file(/(^|\/)app-settings\.json$/i)[0];
  if (settingsEntry) {
    try { settings = JSON.parse(await settingsEntry.async('string')); } catch { settings = null; }
  }
  const restoreTemplates = Boolean(settings?.templates) && $('#backupRestoreSettings')?.checked !== false;

  // Invoice numbers never go backwards: the next number follows the highest number used anywhere, in the backup or in your current data.
  const fy = financialYearLabel(todayISO());
  const backupHighest = backupRecords ? highestNumbersByYear(backupRecords) : {};
  const currentHighest = highestNumbersByYear(archivedInvoices);
  const highestNow = key => Math.max(Number(numbering.counters[key]) || 0, currentHighest[key] || 0);
  let numbersNote = '';
  if (backupRecords) {
    const invoiceNext = formatInvoiceNumber(fy, Math.max(highestNow(fy), backupHighest[fy] || 0) + 1);
    const invoiceBackupTop = backupHighest[fy] ? formatInvoiceNumber(fy, backupHighest[fy]) : 'none this year';
    const invoiceNowTop = highestNow(fy) ? formatInvoiceNumber(fy, highestNow(fy)) : 'none this year';
    numbersNote = `\nInvoice numbers: the backup's highest is ${invoiceBackupTop} and yours is ${invoiceNowTop}. Numbers already used are never given again, so the next invoice will be ${invoiceNext}.`;
  }

  const missing = CSV_FILES.filter(kind => !entries[kind]);
  const message = `Restore this backup?\n\nIt will REPLACE your current data in: ${counts.join(', ')}.`
    + (missing.length ? `\nNot in the backup, so left as they are: ${missing.map(kind => `${kind}.csv`).join(', ')}.` : '')
    + numbersNote
    + (settings?.templates ? (restoreTemplates ? '\nTemplate settings will be replaced by the ones in the backup.' : '\nYour template settings are kept as they are.') : '')
    + '\nYour numbering settings (prefix and so on) are kept as they are.'
    + '\n\nYour current data is downloaded first as a safety copy, and if anything fails while restoring, your current files are put back.';
  if (!confirm(message)) { setBackupStatus('Restore cancelled. Nothing was changed.'); return; }

  // 1. Before changing anything: make sure every file can be written, and remember exactly what it holds now.
  const before = {};
  try {
    setBackupStatus('Checking that every file can be written…');
    for (const kind of found) {
      const handle = csvHandle(kind);
      let permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') throw new Error(`There is no permission to write ${kind}.csv.`);
      const probe = await handle.createWritable({ keepExistingData: true });   // opened and thrown away: proves the file can be written
      await probe.abort();
      before[kind] = await (await handle.getFile()).arrayBuffer();
    }
  } catch (error) {
    console.error('Restore check failed.', error);
    setBackupStatus(`Nothing was changed. ${error.message || 'A file could not be written.'}`, 'text-danger');
    return;
  }

  // 2. Safety copy, then write the files. If anything fails, the files already written are put back.
  const written = [];
  try {
    setBackupStatus('Saving a safety copy of your current data…');
    await downloadBackup({ safety: true });
    setBackupStatus('Restoring…');
    if (imageFiles.length && csvDirectoryHandle) await writeImageFiles(imageFiles);   // pictures first; they are named by their content, so adding them is harmless
    for (const kind of found) {
      const text = texts[kind].startsWith('\uFEFF') ? texts[kind] : `\uFEFF${texts[kind]}`;
      try {
        await writeFileBytes(csvHandle(kind), text);
      } catch (error) {
        throw new Error(`Could not write ${kind}.csv: ${error.message}`);
      }
      written.push(kind);
    }
    for (const kind of found) {                                   // read everything back and compare
      const now = await (await csvHandle(kind).getFile()).text();
      if (now.replace(/^\uFEFF/, '') !== texts[kind].replace(/^\uFEFF/, '')) throw new Error(`${kind}.csv does not match the backup after writing.`);
    }
  } catch (error) {
    console.error('Restore failed.', error);
    const notPutBack = [];
    for (const kind of [...written].reverse()) {
      try { await writeFileBytes(csvHandle(kind), before[kind]); } catch { notPutBack.push(`${kind}.csv`); }
    }
    try { await reloadDataFromCsvHandles(); render(); openEditor('backup'); } catch { /* the page still shows the old data */ }
    setBackupStatus(notPutBack.length
      ? `The restore failed (${error.message}) and ${notPutBack.join(', ')} could not be put back. Restore your safety copy (before-restore-….zip) from the Downloads folder.`
      : `The restore failed (${error.message}). Your previous data was put back, so nothing has changed.`, 'text-danger');
    return;
  }

  // 3. Everything is written. Now the settings.
  try {
    if (restoreTemplates) {
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(settings.templates));
      templateSettings = loadTemplateSettings();
    }
    if (backupRecords) {
      Object.entries(backupHighest).forEach(([key, seq]) => {      // counters can only go up
        numbering.counters[key] = Math.max(Number(numbering.counters[key]) || 0, seq);
      });
      saveNumbering();
    }
  } catch (error) { console.warn('Could not restore the saved settings.', error); }
  try {
    touchSettings();
    await reloadDataFromCsvHandles();
    if (csvDirectoryHandle) {
      await loadImageAssets();
      try { await migrateImagesToFolder(); } catch (error) { console.warn('Could not move pictures out of the restored files.', error); }   // a backup made before pictures were stored once
    }
    render();
    openEditor('backup');
    setBackupStatus(`Backup restored: ${found.length} file${found.length === 1 ? '' : 's'} replaced. A safety copy of the previous data was downloaded.`, 'text-success');
  } catch (error) {
    console.error('Could not reload after the restore.', error);
    setBackupStatus(`The files were restored, but the app could not reload them: ${error.message}. Reload the page.`, 'text-danger');
  }
}

// Re-read every connected CSV file into the app.
async function reloadDataFromCsvHandles() {
  await connectCustomerCsv(customerCsvHandle, false);
  await connectItemCsv(itemCsvHandle, false);
  for (const kind of ['seller', 'bank', 'terms']) await connectProfileCsv(kind, profileCsvHandles[kind], false);
  await connectInvoiceCsv(invoiceCsvHandle);
  refreshCsvConnectionStatus();
}

function backupPageHTML() {
  const connected = backupDatabaseConnected();
  return `<div class="backup-page">
    ${connected ? '' : '<div class="alert alert-warning" role="status">Connect the database first (Database, bottom of the left menu). Backup and restore work on the connected CSV files.</div>'}
    <div class="backup-card">
      <h2>Back up your data</h2>
      <p>Your CSV files are your only database. One backup is a single ZIP that holds all six CSV files (customers, items, seller, bank, terms, invoices) plus your template and numbering settings.</p>
      <p class="backup-last" id="backupLastText">${esc(backupLastText())}</p>
      <button type="button" class="btn btn-primary" data-backup-now ${connected ? '' : 'disabled'}>Download backup (ZIP)</button>
    </div>
    <div class="backup-card">
      <h2>Restore from a backup</h2>
      <p>Choose a ZIP made by this app. It replaces the data in the connected CSV files. Your current data is saved as a safety ZIP first, the backup is checked before anything is written, and if a file cannot be written your current files are put back.</p>
      <input class="form-control" type="file" accept=".zip,application/zip" data-backup-restore ${connected ? '' : 'disabled'} aria-label="Choose backup ZIP">
      <div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="backupRestoreSettings" checked><label class="form-check-label" for="backupRestoreSettings">Also restore my template settings (default template, colours)</label></div>
      <p class="backup-note">Invoice numbering is never taken from a backup. The next numbers follow the highest number already used, so a number is never given twice.</p>
    </div>
    <div class="backup-card">
      <h2>Backup reminder</h2>
      <p>Show a reminder at the top of the app when the last backup is older than:</p>
      <select class="form-select form-select-sm backup-reminder-select" data-backup-reminder-days aria-label="Backup reminder">
        ${BACKUP_REMINDER_CHOICES.map(([value, label]) => `<option value="${value}" ${value === backupMeta.reminderDays ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
    </div>
    <div class="backup-status" id="backupStatus" role="status" hidden></div>
  </div>`;
}

function updateBackupReminder() {
  const banner = $('#backupReminder');
  if (!banner) return;
  const days = backupMeta.reminderDays;
  const snoozed = backupMeta.snoozeUntil && new Date(backupMeta.snoozeUntil).getTime() > Date.now();
  const due = !backupMeta.lastBackup || backupDaysSince(backupMeta.lastBackup) >= days;
  const show = backupDatabaseConnected() && days > 0 && due && !snoozed && edSec !== 'backup';
  banner.hidden = !show;
  if (!show) return;
  $('#backupReminderText').textContent = backupMeta.lastBackup
    ? `Time to back up: your last backup was ${backupDaysSince(backupMeta.lastBackup)} days ago. Your CSV files are your only copy of your data.`
    : 'You have not backed up yet. Your CSV files are your only copy of your data.';
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-backup-now]')) { runBackupFromPage(); return; }
  if (e.target.closest('[data-backup-reminder-now]')) {
    const button = e.target.closest('[data-backup-reminder-now]');
    button.disabled = true;
    downloadBackup().catch(error => alert(error.message || 'Could not create the backup.')).finally(() => {
      button.disabled = false;
      updateBackupReminder();
    });
    return;
  }
  if (e.target.closest('[data-backup-reminder-later]')) {
    backupMeta.snoozeUntil = new Date(Date.now() + 86400000).toISOString();
    saveBackupMeta();
    updateBackupReminder();
  }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-backup-restore]')) {
    const file = e.target.files[0];
    e.target.value = '';
    restoreFromBackup(file);
  } else if (e.target.matches('[data-backup-reminder-days]')) {
    backupMeta.reminderDays = Number(e.target.value);
    backupMeta.snoozeUntil = null;
    saveBackupMeta();
    updateBackupReminder();
  }
});

const QUOTE_VALID_DAYS = 15;
function addDays(dateStr, days) {
  const date = new Date(`${dateStr || todayISO()}T00:00:00`);
  date.setDate(date.getDate() + days);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
// Switch the current document between a tax invoice and a quotation.
function setDocType(type) {
  const quote = type === 'quotation';
  if (isQuotation() === quote) return;
  S.docType = quote ? 'quotation' : 'invoice';
  if (numbering.auto) S.meta.no = nextInvoiceNumber(S.meta.date, { quote });
  S.meta.valid = quote ? addDays(S.meta.date, QUOTE_VALID_DAYS) : '';
  save();
  render();
}
/* ----- drafts ----- 
   A draft has NO invoice number, so it never uses up a number. It gets the next free number (and today's date) only when it
   is saved and printed from the draft, and then it goes to the end of the list. A draft is told apart by an id kept in its snapshot. */
function newDraftId() {
  return `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
function recordIndexOf(record) {
  let index = archivedInvoices.indexOf(record);
  if (index < 0 && record?.snapshot?.draftId) index = archivedInvoices.findIndex(item => item.snapshot?.draftId === record.snapshot.draftId);
  if (index < 0 && record) index = archivedInvoices.findIndex(item => item.status === record.status && item.invoiceNo === record.invoiceNo && item.customerName === record.customerName);
  return index;
}
// How a record's number appears in a list: a Draft badge for drafts, the number for everything else.
function displayInvoiceNo(record) {
  return record.status === 'draft' ? '<span class="badge text-bg-warning">Draft</span>' : esc(record.invoiceNo);
}
function invoiceLabel(record) {
  const quote = record.status === 'quotation' || record.snapshot?.docType === 'quotation';
  if (record.status === 'draft') return `Draft ${quote ? 'quotation' : 'invoice'}`;
  return `${quote ? 'Quotation' : 'Invoice'} ${record.invoiceNo}`;
}

// A brand-new (demo) invoice starts with the first number of the current financial year.
if (!hasSavedInvoice && numbering.auto) S.meta.no = nextInvoiceNumber(S.meta.date);
// If the invoice date moves into another financial year, an auto-generated number moves with it.
function syncInvoiceNumberWithDate() {
  if (isQuotation() && (!S.meta.valid || S.meta.valid < S.meta.date)) S.meta.valid = addDays(S.meta.date, QUOTE_VALID_DAYS);
  if (!numbering.auto) return;
  const parsed = parseFinancialYearNumber(S.meta.no);
  if (!parsed || parsed.fy === financialYearLabel(S.meta.date)) return;
  S.meta.no = nextInvoiceNumber(S.meta.date);
}
let customerFilter = 'all';
let itemFilter = 'all';
const selectedItems = new Set(); // catalog indexes ticked for bulk actions
const selectedCustomers = new Set(); // customer indexes ticked for bulk actions
// Per-table sort state: key = column being sorted (null = original order), dir = 'asc' | 'desc'.
const tableSort = Object.fromEntries(['customer', 'item', 'invoice', 'seller', 'bank', 'terms'].map(kind => [kind, { key: null, dir: 'asc' }]));

function sortHeader(kind, key, label, extraClass = '') {
  const sort = tableSort[kind];
  const active = sort.key === key;
  const icon = active ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅';
  return `<th scope="col" class="${extraClass}" aria-sort="${active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}">
    <button type="button" class="sort-header ${active ? 'is-sorted' : ''}" data-table-sort="${kind}:${key}">${label}<span class="sort-icon" aria-hidden="true">${icon}</span></button>
  </th>`;
}

// Sorts entries in place using valueFns[key](entry); ties keep the original order (entry.index).
function applyTableSort(kind, entries, valueFns) {
  const { key, dir } = tableSort[kind];
  if (!key || !valueFns[key]) return entries;
  const direction = dir === 'asc' ? 1 : -1;
  return entries.sort((a, b) => {
    const x = valueFns[key](a), y = valueFns[key](b);
    const result = typeof x === 'string' ? x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }) : x - y;
    return result * direction || a.index - b.index;
  });
}
let archiveRange = 'all';
let archiveFrom = '';
let archiveTo = '';
let archivePreviewInvoice = null;
let archivePreviewOriginalState = null;
let archivePreviewEditing = false;
let invoiceToastTimer = null;
let invoiceToastHideTimer = null;
let pendingInvoiceOverrideResolve = null;
let catalogItems = loadCatalogItems();
let bulkUndo = null;   // { label, entries: [{ key, prev }] } - previous values of the fields the last bulk change touched
let bulkModalKind = '';
let itemCsvHandle = null;
let directoryDrawerTrigger = null;
let directoryDrawerKind = null;
let directoryDrawerIndex = -1;
const directoryPageSizes = [10, 20, 30, 40, 50, 100, 200, 300, 400, 500];
const directoryPagination = {
  customer: { page: 1, pageSize: 10 },
  item: { page: 1, pageSize: 10 },
  invoice: { page: 1, pageSize: 10 },
  seller: { page: 1, pageSize: 10 },
  bank: { page: 1, pageSize: 10 },
  terms: { page: 1, pageSize: 10 }
};
const directorySearch = { customer: '', item: '' };
const profileCsvHandles = { seller: null, bank: null, terms: null };
const CSV_FILE_LABELS = {
  customers: 'customer details',
  invoices: 'saved invoices',
  items: 'item details',
  seller: 'seller profiles',
  bank: 'bank and UPI profiles',
  terms: 'terms and conditions'
};
const CSV_FILES = ['customers', 'items', 'seller', 'bank', 'terms', 'invoices'];
let sellerProfiles = loadProfiles('seller');
let bankProfiles = loadProfiles('bank');
let termsProfiles = loadProfiles('terms');
let pendingActionConfirmation = null;
let csvConnectionNotice = '';

function openCsvHandleDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support saving CSV folder access.'));
      return;
    }
    const request = indexedDB.open(CSV_HANDLE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CSV_HANDLE_STORE)) {
        request.result.createObjectStore(CSV_HANDLE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open saved CSV folder access.'));
  });
}

async function getSavedCsvDirectory() {
  const database = await openCsvHandleDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CSV_HANDLE_STORE, 'readonly');
    const request = transaction.objectStore(CSV_HANDLE_STORE).get(CSV_DIRECTORY_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Could not read the saved CSV folder.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('Could not read the saved CSV folder.'));
    };
  });
}

async function saveCsvDirectory(directoryHandle) {
  const database = await openCsvHandleDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CSV_HANDLE_STORE, 'readwrite');
    transaction.objectStore(CSV_HANDLE_STORE).put(directoryHandle, CSV_DIRECTORY_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('Could not remember the CSV folder.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error('Could not remember the CSV folder.'));
    };
  });
}

async function removeSavedCsvDirectory() {
  const database = await openCsvHandleDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(CSV_HANDLE_STORE, 'readwrite');
    transaction.objectStore(CSV_HANDLE_STORE).delete(CSV_DIRECTORY_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error('Could not forget the saved CSV folder.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error('Could not forget the saved CSV folder.'));
    };
  });
}

function confirmDestructiveAction({ title, message, confirmLabel = 'Delete', action }) {
  $('#actionConfirmTitle').textContent = title;
  $('#actionConfirmMessage').textContent = message;
  $('#btnConfirmAction').textContent = confirmLabel;
  pendingActionConfirmation = action;
  bootstrap.Modal.getOrCreateInstance('#actionConfirmModal').show();
}

function showCsvHelp(_kind, message = '') {
  $('#csvHelpTitle').textContent = 'Connect all app CSV files';
  $('#csvHelpPathFilename').textContent = CSV_FILES.map(file => `${file}.csv`).join(', ');
  $('#csvHelpMessage').textContent = 'Choose the folder that holds your data. Everything you save is written to files in that folder, on your computer.';
  $('#csvHelpFinalStep').innerHTML = 'Select your data folder. An empty folder is fine: the app creates the six data files in it.';
  $('#csvHelpError').textContent = message;
  $('#csvHelpError').hidden = !message;
  const chooseButton = $('#csvHelpChooseButton');
  const canPickFile = typeof window.showDirectoryPicker === 'function';
  chooseButton.dataset.csvHelpConnect = 'all';
  chooseButton.disabled = !canPickFile;
  chooseButton.textContent = !canPickFile ? 'File access unavailable'
    : 'Choose data folder';
  if (!canPickFile) {
    $('#csvHelpError').textContent = 'CSV file access is not supported in this browser. Open this app in the latest Chrome or Edge.';
    $('#csvHelpError').hidden = false;
  }
  bootstrap.Modal.getOrCreateInstance($('#csvHelpModal')).show();
}

function csvHandle(kind) {
  return kind === 'invoices' ? invoiceCsvHandle
    : kind === 'customers' ? customerCsvHandle
    : kind === 'items' ? itemCsvHandle
      : profileCsvHandles[kind];
}

function refreshCsvConnectionStatus() {
  if (typeof updateDatabaseGate === 'function') updateDatabaseGate();
  // Left-menu Database dropdown: status pill, ✓ on Connect, Disconnect only usable when connected.
  const dbConnected = CSV_FILES.every(file => Boolean(csvHandle(file)));
  const dbToggle = document.querySelector('#btnDatabaseMenu');
  if (dbToggle) {
    dbToggle.classList.toggle('is-connected', dbConnected);
    document.querySelector('#dbStateText').textContent = dbConnected ? 'Connected' : 'Not connected';
    document.querySelector('#btnConnectAllCsv').disabled = dbConnected;
    document.querySelector('#btnConnectAllCsv').classList.toggle('is-current', dbConnected);
    document.querySelector('#dbConnectBadge').hidden = !dbConnected;
    // Item labels: "Connect Database" while offline, "Disconnect Database" while connected.
    document.querySelector('#dbConnectLabel').textContent = dbConnected ? 'Database' : 'Connect Database';
    document.querySelector('#dbDisconnectLabel').textContent = dbConnected ? 'Disconnect Database' : 'Database';
    document.querySelector('#btnDisconnectDatabase').disabled = !dbConnected;
    document.querySelector('#dbDisconnectBadge').hidden = dbConnected;
  }
  if (typeof updateBackupReminder === 'function') updateBackupReminder();
  document.querySelectorAll('[data-csv-status]').forEach(status => {
    const connected = CSV_FILES.every(file => Boolean(csvHandle(file)));
    const statusType = connected ? (csvConnectionNotice ? 'alert-warning' : 'alert-success') : 'alert-danger';
    status.className = `csv-connection-status alert ${statusType} py-2 mb-0`;
    status.textContent = connected
      ? csvConnectionNotice
        ? `Database is connected. ${csvConnectionNotice}`
        : 'Database is connected. Changes will update your CSV files.'
      : csvConnectionNotice || 'Database is not connected. Use “Connect Database” in the left menu.';
  });
}

async function pickConnectedCsvFile(kind) {
  const filename = `${kind}.csv`;
  let handle;
  if (typeof window.showDirectoryPicker === 'function') {
    const directoryHandle = await window.showDirectoryPicker({
      id: `invoice-${kind}-csv-folder`,
      mode: 'readwrite'
    });
    let directoryPermission = await directoryHandle.queryPermission({ mode: 'readwrite' });
    if (directoryPermission !== 'granted') directoryPermission = await directoryHandle.requestPermission({ mode: 'readwrite' });
    if (directoryPermission !== 'granted') throw new Error('Write permission was not granted for the selected csv folder.');
    try {
      handle = await directoryHandle.getFileHandle(filename);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw new Error(`The selected folder does not contain ${filename}. Choose the csv folder beside index.html.`);
      }
      throw error;
    }
  } else if (typeof window.showOpenFilePicker === 'function') {
    [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [{ description: 'CSV file', accept: { 'text/csv': ['.csv'] } }]
    });
    if (handle.name.toLowerCase() !== filename) {
      throw new Error(`The selected file is not ${filename}. Choose it from the csv folder beside index.html.`);
    }
  } else {
    throw new Error('CSV file access is not supported in this browser. Open this app in the latest Chrome or Edge.');
  }

  let permission = await handle.queryPermission({ mode: 'readwrite' });
  if (permission !== 'granted') permission = await handle.requestPermission({ mode: 'readwrite' });
  if (permission !== 'granted') throw new Error(`Write permission was not granted for ${filename}.`);
  return handle;
}

if (!sellerProfiles.length && S.seller.name) sellerProfiles = [structuredClone(S.seller)];
if (!bankProfiles.length && S.bank.bank) bankProfiles = [structuredClone(S.bank)];
if (!termsProfiles.length && S.terms.list.some(term => term.trim())) {
  termsProfiles = [{ profileName: 'Default terms', terms: S.terms.list.filter(term => term.trim()) }];
}

function loadProfiles(kind) {
  try {
    const saved = localStorage.getItem(PROFILE_KEYS[kind]);
    if (!saved) return [];
    const storedProfiles = JSON.parse(saved);
    if (!Array.isArray(storedProfiles)) throw new Error(`Saved ${kind} profile list is not an array.`);
    const profiles = storedProfiles.filter(profile => profile && typeof profile === 'object')
      .map(profile => normalizeProfile(kind, profile))
      .filter(profile => profileTitle(kind, profile).trim());
    return profiles;
  } catch (error) {
    console.warn(`Could not load saved ${kind} profiles.`, error);
    return [];
  }
}

function profileList(kind) {
  return kind === 'seller' ? sellerProfiles : kind === 'bank' ? bankProfiles : termsProfiles;
}

function saveProfiles(kind, profiles) {
  try {
    localStorage.setItem(PROFILE_KEYS[kind], JSON.stringify(kind === 'seller' ? inlineProfileImages(profiles) : profiles));
    return true;
  } catch (error) {
    console.error(`Could not save ${kind} profiles.`, error);
    return false;
  }
}

function profileTitle(kind, profile) {
  if (kind === 'seller') return profile.name;
  if (kind === 'bank') {
    const bank = String(profile.bank || '').trim();
    const account = String(profile.acc || '').trim();
    return bank && account ? `${bank} ••••${account.slice(-4)}` : bank || account || String(profile.upi || '').trim() || 'Bank profile';
  }
  return profile.profileName;
}

function profileIdentity(kind, profile) {
  if (kind !== 'bank') return profileTitle(kind, profile).trim().toLowerCase();
  return [profile.bank, profile.acc, profile.upi].map(value => String(value || '').trim().toLowerCase()).join('|');
}

function profileCurrent(kind) {
  return kind === 'seller' ? S.seller : kind === 'bank' ? S.bank : { terms: S.terms.list };
}

function applyProfile(kind, profile) {
  if (kind === 'seller') {
    const previousName = S.seller.name;
    S.seller = structuredClone(profile);
    if (!S.sign.companyName || S.sign.companyName === previousName) S.sign.companyName = profile.name;
  }
  else if (kind === 'bank') S.bank = structuredClone({
    bank: profile.bank, acc: profile.acc, ifsc: profile.ifsc, branch: profile.branch,
    upi: profile.upi, qrAmt: Boolean(profile.qrAmt)
  });
  else S.terms = { list: structuredClone(profile.terms) };
}

function profileMatchesCurrent(kind, profile) {
  const current = profileCurrent(kind);
  const fields = kind === 'seller'
    ? ['name', 'gstin', 'addr', 'mobile', 'email', 'state', 'logo']
    : kind === 'bank'
      ? ['bank', 'acc', 'ifsc', 'branch', 'upi', 'qrAmt']
      : [];
  if (kind === 'terms') return JSON.stringify(profile.terms) === JSON.stringify(current.terms || []);
  return fields.every(field => (field === 'logo' ? sameImage(profile.logo, current.logo) : String(profile[field] ?? '') === String(current[field] ?? '')));
}

function activeProfileIndex(kind) {
  return profileList(kind).findIndex(profile => profileMatchesCurrent(kind, profile));
}

function profileFields(kind) {
  if (kind === 'seller') return [
    ['name', 'Business name', 'text', true], ['gstin', 'GSTIN', 'text'], ['addr', 'Address', 'text', true],
    ['mobile', 'Mobile', 'tel'], ['email', 'Email', 'email'], ['state', 'Seller state', 'state'], ['logo', 'Logo image', 'file']
  ];
  if (kind === 'bank') return [
    ['bank', 'Bank name', 'text', true], ['acc', 'Account number', 'text'],
    ['ifsc', 'IFSC', 'text'], ['branch', 'Branch', 'text'], ['upi', 'UPI ID', 'text'], ['qrAmt', 'Include invoice total in QR', 'checkbox']
  ];
  return [['profileName', 'Set name', 'text', true], ['terms', 'Terms (one per line)', 'textarea', true]];
}

function normalizeProfile(kind, values) {
  if (kind === 'seller') return {
    name: String(values.name || '').trim(), gstin: String(values.gstin || '').trim(),
    addr: String(values.addr || '').trim(), mobile: String(values.mobile || '').trim(),
    email: String(values.email || '').trim(), state: normalizeSellerState(values.state),
    logo: String(values.logo || '').trim() || null
  };
  if (kind === 'bank') return {
    bank: String(values.bank || '').trim(),
    acc: String(values.acc || '').trim(), ifsc: String(values.ifsc || '').trim(),
    branch: String(values.branch || '').trim(), upi: String(values.upi || '').trim(),
    qrAmt: Boolean(values.qrAmt)
  };
  return {
    profileName: String(values.profileName || '').trim(),
    terms: (Array.isArray(values.terms) ? values.terms : String(values.terms || '').split(/\r?\n/))
      .map(term => String(term).trim()).filter(Boolean)
  };
}

function normalizeSellerState(value) {
  const state = String(value || '').trim();
  if (!state) return '';
  const code = state.match(/^(\d{2})/);
  if (code && STATES.some(([stateCode]) => stateCode === code[1])) return code[1];
  return STATES.find(([, name]) => name.toLowerCase() === state.toLowerCase())?.[0] || state;
}

function load() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (!isBlankInvoice(data)) {
        hasSavedInvoice = true;
        if (!('watermark' in data) || data.watermark === 'draft') data.watermark = 'paid';   // invoices saved before watermarks existed start with the default
        return normalizeTerms(data);
      }
    }
  } catch (e) {
    console.warn('Could not load saved invoice; showing demo data instead.', e);
  }
  return structuredClone(DEMO_DATA);
}
function normalizeTerms(data) {
  if (Array.isArray(data.terms?.list)) return data;
  const legacyTerms = typeof data.terms?.text === 'string' ? data.terms.text : '';
  return {
    ...data,
    terms: {
      list: legacyTerms.split(/\r?\n/).map(term => term.trim()).filter(Boolean)
    }
  };
}
function isBlankInvoice(data) {
  const fields = [
    data.seller?.name, data.seller?.gstin, data.seller?.addr, data.seller?.mobile, data.seller?.email, data.seller?.state,
    data.meta?.no, data.meta?.date, data.meta?.due, data.meta?.pos,
    data.customer?.name, data.customer?.gstin, data.customer?.phone, data.customer?.email, data.customer?.billing,
    data.customer?.shipping, data.customer?.shippingPhone, data.customer?.shippingEmail,
    data.bank?.bank, data.bank?.acc, data.bank?.ifsc, data.bank?.branch, data.bank?.upi,
    data.sign?.companyName,
    Array.isArray(data.terms?.list) ? data.terms.list.join(' ') : data.terms?.text
  ];
  return fields.every(value => !String(value ?? '').trim())
    && !data.seller?.logo
    && !data.sign?.sig
    && (data.items || []).every(item => !String(item.name ?? '').trim() && !String(item.hsn ?? '').trim()
      && !Number(item.rate) && !Number(item.qty) && !Number(item.disc));
}
// Shows or hides the red bar that tells the user their work could not be kept in the browser.
function setStorageWarning(show) {
  const bar = document.getElementById('storageWarning');
  if (bar) bar.hidden = !show;
}

function save() {
  if (archivePreviewInvoice) return true;
  try {
    localStorage.setItem(KEY, JSON.stringify(inlineStateImages(S)));
    localStorage.removeItem(RESET_KEY);
    setStorageWarning(false);
    return true;
  } catch (e) {
    console.warn('Could not save (storage full?)', e);
    setStorageWarning(true);
    return false;
  }
}

  /* ---------- extra contacts & shipping addresses per customer ---------- */
  const MAX_CUSTOMER_ENTRIES = 10;
  function cleanText(value, max) {
    return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  }
  function parseJsonList(value) {
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(String(value || '[]'));
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  function normalizeContacts(value) {
    return parseJsonList(value).filter(item => item && typeof item === 'object').map(item => ({
      name: cleanText(item.name, 80), role: cleanText(item.role, 40), phone: cleanText(item.phone, 50), email: cleanText(item.email, 254)
    })).filter(item => item.name || item.phone || item.email).slice(0, MAX_CUSTOMER_ENTRIES);
  }
  function normalizeShipAddresses(value) {
    return parseJsonList(value).filter(item => item && typeof item === 'object').map(item => ({
      label: cleanText(item.label, 60), address: String(item.address ?? '').trim().slice(0, 500), phone: cleanText(item.phone, 50), email: cleanText(item.email, 254)
    })).filter(item => item.address).slice(0, MAX_CUSTOMER_ENTRIES);
  }

  function loadImportedCustomers() {
    try {
      const saved = localStorage.getItem(CUSTOMER_KEY);
      if (!saved) return [];
      const customers = JSON.parse(saved);
      if (!Array.isArray(customers)) throw new Error('Saved customer list is not an array.');
      return customers.filter(customer => customer && typeof customer.name === 'string' && customer.name.trim())
        .map(customer => ({
          name: String(customer.name || ''),
          gstin: String(customer.gstin || ''),
          phone: String(customer.phone || ''),
          email: String(customer.email || ''),
          billing: String(customer.billing || ''),
          priceList: String(customer.priceList || '').toLowerCase() === 'wholesale' ? 'wholesale' : 'retail',
          contacts: normalizeContacts(customer.contacts),
          shippingAddresses: normalizeShipAddresses(customer.shippingAddresses),
          active: !(customer.active === false || /^(false|no|0|inactive)$/i.test(String(customer.active ?? '').trim())),
          shipSame: true,
          shipping: '',
          shippingPhone: '',
          shippingEmail: ''
        }));
    } catch (error) {
      console.warn('Could not load saved customers.', error);
      return [];
    }
  }

  function saveImportedCustomers(customers) {
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
      return true;
    } catch (error) {
      console.error('Could not save imported customers.', error);
      return false;
    }
  }

  function customerOptions() {
    return [...DEMO_CUSTOMERS, ...importedCustomers];
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    let quoteClosed = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
          quoteClosed = true;
        } else {
          field += char;
        }
        continue;
      }
      if (char === '"' && !field.trim() && !quoteClosed) {
        field = '';
        inQuotes = true;
      } else if (char === ',' || char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        row.push(field.trim());
        field = '';
        quoteClosed = false;
        if (char !== ',') {
          if (row.some(value => value)) rows.push(row);
          row = [];
        }
      } else if (quoteClosed && !/\s/.test(char)) {
        throw new Error('Unexpected character after a quoted CSV value.');
      } else {
        field += char;
      }
    }

    if (inQuotes) throw new Error('The CSV file contains an unclosed quoted value.');
    row.push(field.trim());
    if (row.some(value => value)) rows.push(row);
    return rows;
  }

  function parseInvoiceArchive(text) {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('invoices.csv is empty.');
    const normalizeHeader = value => value.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const headers = rows[0].map(normalizeHeader);
    const column = name => headers.indexOf(name);
    const indexes = {
      invoiceNo: column('invoiceno'),
      customerName: column('customername'),
      total: column('total'),
      invoiceDate: column('invoicedate'),
      snapshot: column('snapshot')
    };
    const missingHeader = Object.entries(indexes).find(([, index]) => index < 0);
    if (missingHeader) throw new Error(`invoices.csv is missing the required "${missingHeader[0]}" column.`);
    const statusIndex = column('status');
    return rows.slice(1).map((row, index) => {
      let snapshot;
      try {
        snapshot = normalizeTerms(JSON.parse(row[indexes.snapshot]));
      } catch (error) {
        throw new Error(`Invoice archive row ${index + 2} has an invalid snapshot: ${error.message}`);
      }
      if (!snapshot || typeof snapshot !== 'object' || !snapshot.meta || !Array.isArray(snapshot.items)) {
        throw new Error(`Invoice archive row ${index + 2} does not contain a valid invoice snapshot.`);
      }
      const total = Number(row[indexes.total]);
      if (!Number.isFinite(total)) throw new Error(`Invoice archive row ${index + 2} has an invalid total.`);
      return {
        invoiceNo: row[indexes.invoiceNo],
        customerName: row[indexes.customerName],
        total,
        invoiceDate: row[indexes.invoiceDate],
        status: statusIndex >= 0 ? (['draft', 'quotation'].includes(String(row[statusIndex] || '').trim().toLowerCase()) ? String(row[statusIndex]).trim().toLowerCase() : 'saved') : 'saved',
        snapshot
      };
    });
  }

  function invoiceArchiveCsv(records) {
    const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['invoice_no', 'customer_name', 'total', 'invoice_date', 'status', 'snapshot'];
    const rows = records.map(record => [
      record.invoiceNo,
      record.customerName,
      Number(record.total).toFixed(2),
      record.invoiceDate,
      ['draft', 'quotation'].includes(record.status) ? record.status : 'saved',
      JSON.stringify(record.snapshot)
    ]);
    return `\uFEFF${headers.join(',')}\r\n${rows.map(row => row.map(quote).join(',')).join('\r\n')}${rows.length ? '\r\n' : ''}`;
  }

  async function persistInvoiceArchive(records) {
    if (!invoiceCsvHandle) throw new Error('Connect invoices.csv before saving or deleting archived invoices.');
    records = await externalizeInvoiceRecords(records);   // pictures are stored once in csv/images; the invoices keep a short reference
    const writable = await invoiceCsvHandle.createWritable();
    try {
      await writable.write(invoiceArchiveCsv(records));
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch (abortError) { console.warn('Could not abort the failed invoice archive write.', abortError); }
      throw new Error(`Could not update invoices.csv: ${error.message}`);
    }
    const previousRecords = archivedInvoices;
    archivedInvoices = records;
    await syncStockWithInvoices(previousRecords, records);
  }

  async function connectInvoiceCsv(handle) {
    const records = parseInvoiceArchive(await (await handle.getFile()).text());
    invoiceCsvHandle = handle;
    archivedInvoices = records;
    return true;
  }

  function parseCustomerCsv(text) {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('The CSV file is empty.');

    const normalizeHeader = value => value.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const headers = rows[0].map(normalizeHeader);
    const findColumn = (...names) => headers.findIndex(header => names.includes(header));
    const columns = {
      name: findColumn('name', 'customername', 'businessname'),
      address: findColumn('address', 'billing', 'billingaddress'),
      phone: findColumn('phone', 'mobile', 'phonenumber', 'mobilenumber'),
      email: findColumn('email', 'emailid'),
      gstin: findColumn('gstin'),
      priceList: findColumn('pricelist', 'pricetype', 'customertype'),
      contacts: findColumn('contacts', 'extracontacts', 'othercontacts'),
      shippingAddresses: findColumn('shippingaddresses', 'shipto', 'deliveryaddresses'),
      active: findColumn('active', 'status')
    };

    if (columns.name < 0) throw new Error('A "name" column is required.');
    if (columns.address < 0) throw new Error('An "address" or "billing address" column is required.');
    if (rows.length < 2) return { customers: [], invalidRows: 0 };

    const customers = [];
    let invalidRows = 0;
    rows.slice(1).forEach(values => {
      if (values.length > headers.length) {
        invalidRows++;
        return;
      }
      const value = key => columns[key] < 0 ? '' : String(values[columns[key]] || '').trim();
      const name = value('name');
      if (!name) {
        invalidRows++;
        return;
      }
      customers.push({
        name,
        gstin: value('gstin'),
        phone: value('phone'),
        email: value('email'),
        billing: value('address'),
        priceList: normalizePriceList(value('priceList')),
        contacts: normalizeContacts(value('contacts')),
        shippingAddresses: normalizeShipAddresses(value('shippingAddresses')),
        active: !/^(false|no|0|inactive)$/i.test(value('active')),
        shipSame: true,
        shipping: '',
        shippingPhone: '',
        shippingEmail: ''
      });
    });
    if (!customers.length) throw new Error('No valid customer rows were found. Each row needs a customer name.');
    return { customers, invalidRows };
  }

  function directoryPaginationHTML(kind, total) {
    const state = directoryPagination[kind];
    const pageCount = Math.max(1, Math.ceil(total / state.pageSize));
    state.page = Math.min(state.page, pageCount);
    const start = total ? (state.page - 1) * state.pageSize + 1 : 0;
    const end = Math.min(state.page * state.pageSize, total);
    const firstPage = Math.max(1, Math.min(state.page - 2, pageCount - 4));
    const lastPage = Math.min(pageCount, firstPage + 4);
    const pageButtons = Array.from({ length: lastPage - firstPage + 1 }, (_, offset) => {
      const page = firstPage + offset;
      return `<li class="page-item ${page === state.page ? 'active' : ''}">
        <button class="page-link" type="button" data-directory-page="${kind}:${page}" ${page === state.page ? 'aria-current="page"' : ''}>${page}</button>
      </li>`;
    }).join('');
    return `<div class="directory-table-footer">
      <div class="directory-table-count" aria-live="polite">Showing ${start}–${end} of ${total}</div>
      <div class="directory-table-controls">
        <label class="directory-page-size-label" for="${kind}PageSize">Rows per page
          <select class="form-select form-select-sm" id="${kind}PageSize" data-directory-page-size="${kind}">
            ${directoryPageSizes.map(size => `<option value="${size}" ${size === state.pageSize ? 'selected' : ''}>${size}</option>`).join('')}
          </select>
        </label>
        <nav aria-label="${kind === 'customer' ? 'Customer' : kind === 'item' ? 'Item' : kind === 'invoice' ? 'Invoice' : kind === 'seller' ? 'Seller profile' : kind === 'bank' ? 'Bank profile' : 'Terms'} table pages">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item ${state.page === 1 ? 'disabled' : ''}">
              <button class="page-link" type="button" data-directory-page="${kind}:${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>
            </li>
            ${pageButtons}
            <li class="page-item ${state.page === pageCount ? 'disabled' : ''}">
              <button class="page-link" type="button" data-directory-page="${kind}:${state.page + 1}" ${state.page === pageCount ? 'disabled' : ''} aria-label="Next page">›</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>`;
  }

  function customerDirectoryHTML() {
    return `
      <div class="kpi-grid" id="customerKpis">${customerKpisHTML()}</div>
      <div class="customer-import-controls">
        <div class="customer-import-heading">
          <div><strong>Import customers from another CSV</strong><div class="form-text">Imported rows are added to the connected database. Required: name and address. Optional: phone, email, gstin. Duplicate customers are skipped.</div></div>
          <button class="btn btn-sm btn-outline-secondary" type="button" data-customer-template>Download CSV template</button>
        </div>
        <label class="visually-hidden" for="customerCsvFile">Choose a CSV file</label>
        <input class="form-control" type="file" id="customerCsvFile" accept=".csv,text/csv" title="Choose a customer CSV file to import">
      </div>
      <div class="customer-import-status" id="customerImportStatus" role="status" aria-live="polite"></div>
      <form id="customerAddForm" class="customer-add-form">
        <div class="customer-directory-heading"><strong>Add a customer</strong></div>
        <div class="customer-add-grid">
          <label class="customer-field">Customer name<input class="form-control" name="name" required maxlength="200" autocomplete="organization" placeholder="Customer name"></label>
          <label class="customer-field">Billing address<input class="form-control" name="address" required maxlength="500" autocomplete="street-address" placeholder="Billing address"></label>
          <label class="customer-field">Phone<input class="form-control" name="phone" type="tel" maxlength="50" autocomplete="tel" placeholder="Phone number"></label>
          <label class="customer-field">Email<input class="form-control" name="email" type="email" maxlength="254" autocomplete="email" placeholder="Email address"></label>
          <label class="customer-field">GSTIN<input class="form-control" name="gstin" maxlength="30" placeholder="GSTIN (optional)"></label>
          <label class="customer-field">Price list${priceListSelectHTML('retail')}</label>
          <div class="customer-add-action"><button type="submit" class="btn btn-primary">Add Customer</button></div>
          <label class="customer-field customer-field-ship">Shipping address<input class="form-control" name="shippingAddress" maxlength="500" autocomplete="off" placeholder="Optional – if different from billing"></label>
        </div>
      </form>
      <div class="customer-directory-heading"><strong>Customer list</strong>
        <div class="customer-directory-tools">
          <select class="form-select form-select-sm customer-filter-select" id="customerFilterSelect" data-customer-filter-select aria-label="Filter customers">
            ${CUSTOMER_FILTERS.map(([value, label]) => `<option value="${value}" ${customerFilter === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <div class="directory-search-control">
            <input class="form-control form-control-sm directory-search" type="search" data-directory-search="customer" value="${esc(directorySearch.customer)}" placeholder="Search customers…" aria-label="Search customers">
            <svg class="directory-search-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"></circle><path d="m10.5 10.5 3 3"></path></svg>
          </div>
        </div>
      </div>
      <div id="customerDirectoryResults">${customerDirectoryResultsHTML()}</div>`;
  }

  /* ---------- customer directory: KPI cards + billing stats ---------- */
  const CUSTOMER_FILTERS = [
    ['all', 'All customers'], ['enabled', 'Status: Active'], ['disabled', 'Status: Inactive'],
    ['active', 'Billed in last 90 days'], ['inactive', 'Not billed in 90+ days'],
    ['new', 'New this month'], ['missing', 'Missing phone / GSTIN']
  ];
  const CUSTOMER_ACTIVE_DAYS = 90;

  // Billing stats per customer, matched to saved invoices by customer name.
  function customerStatsMap() {
    const stats = new Map();
    archivedInvoices.forEach(invoice => {
      if (invoice.status !== 'saved') return;
      const key = String(invoice.customerName || '').trim().toLowerCase();
      if (!key) return;
      const entry = stats.get(key) || { total: 0, count: 0, first: '', last: '' };
      const date = String(invoice.invoiceDate || '');
      entry.total += +invoice.total || 0;
      entry.count += 1;
      if (date && (!entry.first || date < entry.first)) entry.first = date;
      if (date && date > entry.last) entry.last = date;
      stats.set(key, entry);
    });
    return stats;
  }

  function customerRows() {
    const stats = customerStatsMap();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CUSTOMER_ACTIVE_DAYS);
    const cutoffIso = isoDate(cutoff);
    const [monthStart, monthEnd] = monthBounds(0);
    return importedCustomers.map((customer, index) => {
      const s = stats.get(String(customer.name || '').trim().toLowerCase()) || { total: 0, count: 0, first: '', last: '' };
      return {
        customer, index, ...s,
        active: Boolean(s.last) && s.last >= cutoffIso,
        isNew: Boolean(s.first) && s.first >= monthStart && s.first <= monthEnd,
        enabled: customer.active !== false,
        noPhone: !String(customer.phone || '').trim(),
        noGstin: !String(customer.gstin || '').trim(),
        missing: !String(customer.phone || '').trim() || !String(customer.gstin || '').trim()
      };
    });
  }

  function customerMatchesFilter(row) {
    switch (customerFilter) {
      case 'enabled': return row.enabled;
      case 'disabled': return !row.enabled;
      case 'active': return row.active;
      case 'inactive': return !row.active;
      case 'new': return row.isNew;
      case 'missing': return row.missing;
      default: return true;
    }
  }

  function customerKpisHTML() {
    const rows = customerRows();
    const active = rows.filter(r => r.active).length;
    const inactive = rows.length - active;
    const newCount = rows.filter(r => r.isNew).length;
    const top = rows.filter(r => r.total > 0).sort((a, b) => b.total - a.total)[0];
    const card = (cls, label, value, sub, filter) => `<${filter ? 'button type="button"' : 'div'} class="kpi-card ${cls} ${filter ? 'is-clickable' : ''} ${filter && customerFilter === filter ? 'is-selected' : ''}" ${filter ? `data-customer-filter="${filter}"` : ''}>
        <span class="kpi-label">${label}</span>
        <span class="kpi-value">${value}</span>
        <span class="kpi-sub">${sub}</span>
      </${filter ? 'button' : 'div'}>`;
    return [
      card('kpi-blue', 'Total Customers', String(rows.length), `${rows.filter(r => r.count).length} with invoices`, 'all'),
      card('kpi-green', 'Active Customers', String(active), `${rows.length ? Math.round(active / rows.length * 100) : 0}% of customers · last ${CUSTOMER_ACTIVE_DAYS} days`, 'active'),
      card('kpi-rose', 'Top Customer', top ? esc(top.customer.name) : '—', top ? `${rs(top.total)} · ${top.count} invoice${top.count === 1 ? '' : 's'}` : 'No invoices yet'),
      card('kpi-violet', 'New This Month', String(newCount), 'First invoice this month', 'new'),
      card('kpi-amber', 'Inactive Customers', String(inactive), `No invoice in ${CUSTOMER_ACTIVE_DAYS}+ days or never`, 'inactive'),
      card('kpi-rose', 'Missing Details', String(rows.filter(r => r.missing).length), `${rows.filter(r => r.noPhone).length} without phone · ${rows.filter(r => r.noGstin).length} without GSTIN`, 'missing')
    ].join('');
  }

  function refreshCustomerDirectory() {
    const set = (selector, html) => { const el = $(selector); if (el) el.innerHTML = html; };
    set('#customerKpis', customerKpisHTML());
    set('#customerDirectoryResults', customerDirectoryResultsHTML());
    const select = $('#customerFilterSelect');
    if (select) select.value = customerFilter;
  }

  const CUSTOMER_SORT_VALUES = {
    name: r => String(r.customer.name || '').toLowerCase(),
    billing: r => String(r.customer.billing || '').toLowerCase(),
    phone: r => String(r.customer.phone || ''),
    email: r => String(r.customer.email || '').toLowerCase(),
    gstin: r => String(r.customer.gstin || '').toLowerCase(),
    total: r => r.total,
    count: r => r.count,
    last: r => r.last,
    status: r => (r.enabled ? 1 : 0)
  };

  function customerBulkBarHTML() {
    if (!selectedCustomers.size) return '';
    return `<div class="bulk-bar" role="region" aria-label="Bulk actions">
      <span class="bulk-count"><strong>${selectedCustomers.size}</strong> selected</span>
      <button type="button" class="btn btn-sm btn-success" data-customer-bulk="whatsapp">Share on WhatsApp</button>
      <button type="button" class="btn btn-sm btn-outline-primary" data-customer-bulk="export">Export CSV</button>
      <button type="button" class="btn btn-sm btn-outline-success" data-customer-bulk="activate">Mark active</button>
      <button type="button" class="btn btn-sm btn-outline-secondary" data-customer-bulk="deactivate">Mark inactive</button>
      <button type="button" class="btn btn-sm btn-outline-danger" data-customer-bulk="delete">Delete</button>
      <button type="button" class="btn btn-sm btn-link" data-customer-bulk="clear">Clear selection</button>
    </div>`;
  }

  async function bulkUpdateCustomers(action) {
    if (!customerCsvHandle) {
      showCsvHelp('customers', 'Connect the customer CSV before changing customers.');
      return;
    }
    const picked = new Set(selectedCustomers);
    if (!picked.size) return;
    const updated = action === 'delete'
      ? importedCustomers.filter((_, index) => !picked.has(index))
      : importedCustomers.map((customer, index) => (picked.has(index) ? { ...customer, active: action === 'activate' } : customer));
    const labels = { delete: 'deleted', activate: 'marked active', deactivate: 'marked inactive' };
    try {
      await persistCustomerList(updated, true);
      selectedCustomers.clear();
      render();
      openEditor('customerDirectory');
      $('#customerImportStatus').className = 'customer-import-status success';
      $('#customerImportStatus').textContent = `${picked.size} customer${picked.size === 1 ? '' : 's'} ${labels[action]} and saved to customers.csv.`;
    } catch (error) {
      console.error('Bulk customer update failed.', error);
      $('#customerImportStatus').className = 'customer-import-status error';
      $('#customerImportStatus').textContent = error.message;
    }
  }

  async function toggleCustomerActive(index, active) {
    const customer = importedCustomers[index];
    if (!customer) return;
    if (!customerCsvHandle) {
      showCsvHelp('customers', 'Connect the customer CSV before changing a customer.');
      refreshCustomerDirectory();
      return;
    }
    try {
      await persistCustomerList(importedCustomers.map((existing, i) => (i === index ? { ...existing, active } : existing)), true);
      render();
      refreshCustomerDirectory();
      $('#customerImportStatus').className = 'customer-import-status success';
      $('#customerImportStatus').textContent = `${customer.name} is now ${active ? 'active' : 'inactive and hidden from the invoice customer list'}.`;
    } catch (error) {
      console.error('Could not change the customer status.', error);
      refreshCustomerDirectory();
      $('#customerImportStatus').className = 'customer-import-status error';
      $('#customerImportStatus').textContent = error.message;
    }
  }

  function exportSelectedCustomers() {
    const chosen = importedCustomers.filter((_, index) => selectedCustomers.has(index));
    if (!chosen.length) return;
    downloadCustomerCsv(chosen, 'customers-selected.csv');
    $('#customerImportStatus').className = 'customer-import-status success';
    $('#customerImportStatus').textContent = `${chosen.length} customer${chosen.length === 1 ? '' : 's'} exported to customers-selected.csv.`;
  }

  /* ----- bulk WhatsApp: one editable message, one Send button per customer ----- */
  const whatsappNumber = phone => {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length === 10) digits = '91' + digits;
    return digits.length >= 11 ? digits : '';
  };

  function whatsappMessageFor(template, customer) {
    return template
      .replace(/\{name\}/gi, customer.name || '')
      .replace(/\{business\}/gi, S.seller.name || '');
  }

  function openCustomerWhatsapp() {
    const chosen = [...selectedCustomers].sort((a, b) => a - b).map(index => ({ index, customer: importedCustomers[index] })).filter(entry => entry.customer);
    if (!chosen.length) return;
    $('#waMessage').value = `Hello {name},\n\nGreetings from ${S.seller.name || '{business}'}. `;
    const withPhone = chosen.filter(({ customer }) => whatsappNumber(customer.phone)).length;
    $('#waSummary').textContent = `${withPhone} of ${chosen.length} selected customer${chosen.length === 1 ? ' has' : 's have'} a valid phone number.`;
    $('#waRecipients').innerHTML = chosen.map(({ index, customer }) => {
      const hasPhone = Boolean(whatsappNumber(customer.phone));
      return `<li class="wa-recipient">
        <div class="wa-recipient-info"><strong>${esc(customer.name)}</strong><span>${hasPhone ? esc(customer.phone) : 'No valid phone number'}</span></div>
        <button type="button" class="btn btn-sm btn-success" data-wa-send="${index}" ${hasPhone ? '' : 'disabled'}>${hasPhone ? 'Send' : 'No phone'}</button>
      </li>`;
    }).join('');
    bootstrap.Modal.getOrCreateInstance($('#customerWhatsappModal')).show();
  }

  function sendCustomerWhatsapp(index, button) {
    const customer = importedCustomers[index];
    const number = whatsappNumber(customer?.phone);
    if (!number) return;
    const text = whatsappMessageFor($('#waMessage').value, customer);
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    button.textContent = 'Opened ✓';
    button.classList.replace('btn-success', 'btn-outline-success');
  }

  /* ----- customer detail drawer ----- */
  const COPY_ICON = '<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M8 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v9a2 2 0 002 2h7a2 2 0 002-2v-1h1a2 2 0 002-2V6.4a2 2 0 00-.59-1.41l-2.4-2.4A2 2 0 0013.6 2H8zm0 2h5v3a1 1 0 001 1h2v6h-1V9.4a2 2 0 00-.59-1.4L12 5.4A2 2 0 0010.6 5H8V4zM5 7h5v3a1 1 0 001 1h2v6H5V7z"/></svg>';

  const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

  function daysBetween(fromIso, toDate = new Date()) {
    const from = new Date(`${fromIso}T00:00:00`);
    return Math.max(0, Math.floor((toDate - from) / 86400000));
  }

  const agoText = days => (days === 0 ? 'today' : days === 1 ? 'yesterday' : days < 60 ? `${days} days ago` : days < 730 ? `${Math.round(days / 30)} months ago` : `${Math.round(days / 365)} years ago`);

  // GST included in one saved invoice's lines.
  function invoiceGstAmount(invoice) {
    const snap = invoice.snapshot || {};
    const incl = snap.priceMode === 'incl';
    return (snap.items || []).reduce((sum, line) => {
      const g = +line.gst || 0, base = (+line.rate || 0) * (+line.qty || 0) - (+line.disc || 0);
      return sum + (incl ? base - base / (1 + g / 100) : base * g / 100);
    }, 0) * snapshotNetFactor(snap);
  }

  const contactRowHTML = (c = {}) => `<div class="rep-row" data-rep-row>
      <input class="form-control form-control-sm" name="contactName" maxlength="80" value="${esc(c.name || '')}" placeholder="Contact name" aria-label="Contact name">
      <input class="form-control form-control-sm" name="contactRole" maxlength="40" value="${esc(c.role || '')}" placeholder="Role (e.g. Accounts)" aria-label="Contact role">
      <input class="form-control form-control-sm" name="contactPhone" type="tel" maxlength="50" value="${esc(c.phone || '')}" placeholder="Phone" aria-label="Contact phone">
      <input class="form-control form-control-sm" name="contactEmail" type="email" maxlength="254" value="${esc(c.email || '')}" placeholder="Email" aria-label="Contact email">
      <button type="button" class="btn btn-sm btn-outline-danger rep-remove" data-rep-remove>Remove</button>
    </div>`;
  const shipRowHTML = (a = {}) => `<div class="rep-row" data-rep-row>
      <input class="form-control form-control-sm rep-wide" name="shipLabel" maxlength="60" value="${esc(a.label || '')}" placeholder="Label (e.g. Warehouse, Branch – Pune)" aria-label="Address label">
      <textarea class="form-control form-control-sm rep-wide" name="shipAddress" rows="2" maxlength="500" placeholder="Full shipping address" aria-label="Shipping address">${esc(a.address || '')}</textarea>
      <input class="form-control form-control-sm" name="shipPhone" type="tel" maxlength="50" value="${esc(a.phone || '')}" placeholder="Phone at this address" aria-label="Shipping phone">
      <input class="form-control form-control-sm" name="shipEmail" type="email" maxlength="254" value="${esc(a.email || '')}" placeholder="Email at this address" aria-label="Shipping email">
      <button type="button" class="btn btn-sm btn-outline-danger rep-remove" data-rep-remove>Remove</button>
    </div>`;
  const REP_KINDS = { contacts: contactRowHTML, ship: shipRowHTML };
  const repeaterHTML = (kind, title, hint, rows, addLabel) => `<div class="rep-block" data-rep="${kind}">
      <div class="rep-head"><strong>${title}</strong><span class="form-text">${hint}</span></div>
      <div class="rep-rows">${rows.map(REP_KINDS[kind]).join('')}</div>
      <button type="button" class="btn btn-sm btn-outline-primary" data-rep-add="${kind}">+ ${addLabel}</button>
    </div>`;
  const customerExtrasEditorHTML = record =>
    repeaterHTML('contacts', 'Other contacts', 'People to reach besides the main phone and email above.', normalizeContacts(record.contacts), 'Add contact')
    + repeaterHTML('ship', 'Shipping addresses', 'Pick one of these as “Ship to” while creating an invoice.', normalizeShipAddresses(record.shippingAddresses), 'Add shipping address');

  function customerExtrasForm(form) {
    const data = new FormData(form);
    const all = key => data.getAll(key).map(value => String(value));
    const names = all('contactName'), roles = all('contactRole'), phones = all('contactPhone'), emails = all('contactEmail');
    const labels = all('shipLabel'), addresses = all('shipAddress'), shipPhones = all('shipPhone'), shipEmails = all('shipEmail');
    const incompleteShip = addresses.some((address, i) => !address.trim() && (labels[i].trim() || shipPhones[i].trim() || shipEmails[i].trim()));
    return {
      contacts: normalizeContacts(names.map((name, i) => ({ name, role: roles[i], phone: phones[i], email: emails[i] }))),
      shippingAddresses: normalizeShipAddresses(addresses.map((address, i) => ({ label: labels[i], address, phone: shipPhones[i], email: shipEmails[i] }))),
      incompleteShip
    };
  }

  function customerDetailHTML(index) {
    const customer = importedCustomers[index];
    const history = archivedInvoices.map((invoice, archiveIndex) => ({ invoice, archiveIndex }))
      .filter(({ invoice }) => sameName(invoice.customerName, customer.name))
      .sort((a, b) => String(b.invoice.invoiceDate || '').localeCompare(String(a.invoice.invoiceDate || '')));
    const saved = history.filter(({ invoice }) => invoice.status === 'saved');
    const drafts = history.filter(({ invoice }) => invoice.status === 'draft').length;
    const total = saved.reduce((sum, { invoice }) => sum + (+invoice.total || 0), 0);
    const gstTotal = saved.reduce((sum, { invoice }) => sum + invoiceGstAmount(invoice), 0);
    const dates = saved.map(({ invoice }) => String(invoice.invoiceDate || '')).filter(Boolean).sort();
    const first = dates[0] || '', last = dates[dates.length - 1] || '';

    // Top items bought by this customer (by amount).
    const itemTotals = new Map();
    saved.forEach(({ invoice }) => {
      const snap = invoice.snapshot || {};
      (snap.items || []).forEach(line => {
        const name = String(line.name || '').trim();
        if (!name) return;
        const entry = itemTotals.get(name.toLowerCase()) || { name, qty: 0, amount: 0, unit: line.unit || '' };
        entry.qty += +line.qty || 0;
        entry.amount += invoiceLineAmount(line, snap.priceMode === 'incl') * snapshotNetFactor(snap);
        itemTotals.set(name.toLowerCase(), entry);
      });
    });
    const topItems = [...itemTotals.values()].sort((a, b) => b.amount - a.amount);

    // State from the GSTIN → tells whether invoices carry CGST+SGST or IGST.
    const gstCode = String(customer.gstin || '').trim().match(/^(\d{2})/)?.[1];
    const stateName = STATES.find(([code]) => code === gstCode)?.[1];
    const sellerCode = normalizeSellerState(S.seller.state);
    const taxType = stateName && sellerCode ? (gstCode === sellerCode ? 'CGST + SGST (same state)' : 'IGST (other state)') : '';

    const gstinInfo = validateGstin(customer.gstin);
    const number = whatsappNumber(customer.phone);
    const copy = value => (value ? `<button type="button" class="copy-btn" data-copy-text="${esc(value)}" title="Copy" aria-label="Copy">${COPY_ICON}</button>` : '');
    const row = (label, value, copyValue) => `<div class="cd-row"><span class="cd-label">${label}</span><span class="cd-value">${value || '<span class="text-muted">—</span>'}${copy(copyValue)}</span></div>`;
    const card = (label, value, sub = '') => `<div class="item-detail-cell"><span>${label}</span><strong>${value}</strong>${sub ? `<small class="text-muted">${sub}</small>` : ''}</div>`;
    const missing = [];
    if (!String(customer.phone || '').trim()) missing.push('No phone number – the customer can’t be reached on WhatsApp.');
    if (!String(customer.gstin || '').trim()) missing.push('No GSTIN – invoices are billed as an unregistered customer.');

    return `
      <div class="cd-actions">
        <a class="btn btn-sm btn-success ${number ? '' : 'disabled'}" ${number ? `href="https://wa.me/${number}" target="_blank" rel="noopener"` : 'aria-disabled="true"'}>WhatsApp</a>
        <a class="btn btn-sm btn-outline-primary ${customer.phone ? '' : 'disabled'}" ${customer.phone ? `href="tel:${esc(String(customer.phone).replace(/[^\d+]/g, ''))}"` : 'aria-disabled="true"'}>Call</a>
        <a class="btn btn-sm btn-outline-primary ${customer.email ? '' : 'disabled'}" ${customer.email ? `href="mailto:${esc(customer.email)}"` : 'aria-disabled="true"'}>Email</a>
      </div>
      ${missing.length ? `<div class="alert alert-warning py-2 px-3 small mb-3"><ul class="mb-0 ps-3">${missing.map(note => `<li>${esc(note)}</li>`).join('')}</ul></div>` : ''}

      <h3 class="item-detail-heading">Contact &amp; tax details</h3>
      <div class="cd-rows">
        ${row('Phone', esc(customer.phone), customer.phone)}
        ${row('Email', esc(customer.email), customer.email)}
        ${row('GSTIN', esc(customer.gstin), customer.gstin)}
        ${String(customer.gstin || '').trim() ? row('GSTIN check', `<div class="gstin-check-block">${gstinHintHTML(customer.gstin)}</div>`, '') : ''}
        ${gstinInfo.pan ? row('PAN', esc(gstinInfo.pan), gstinInfo.pan) : ''}
        ${gstinInfo.holderType ? row('Registered as', esc(gstinInfo.holderType), '') : ''}
        ${row('State', stateName ? `${esc(stateName)} (${gstCode})` : '', '')}
        ${row('Tax on invoices', taxType ? esc(taxType) : '', '')}
        ${row('Billing address', esc(customer.billing).replace(/\n/g, '<br>'), customer.billing)}
      </div>

      ${(() => {
        const contacts = normalizeContacts(customer.contacts);
        const addresses = normalizeShipAddresses(customer.shippingAddresses);
        const contactItems = contacts.map(c => {
          const wa = whatsappNumber(c.phone);
          return `<div class="cd-list-item"><div><strong>${esc(c.name || 'Unnamed contact')}</strong>${c.role ? ` <span class="text-muted">· ${esc(c.role)}</span>` : ''}</div>
            <div class="cd-list-sub">${[c.phone ? esc(c.phone) : '', c.email ? esc(c.email) : ''].filter(Boolean).join(' · ') || '<span class="text-muted">No phone or email</span>'}</div>
            <div class="cd-list-actions">${wa ? `<a class="btn btn-sm btn-outline-success py-0" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${c.phone ? `<a class="btn btn-sm btn-outline-primary py-0" href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">Call</a>` : ''}${c.email ? `<a class="btn btn-sm btn-outline-primary py-0" href="mailto:${esc(c.email)}">Email</a>` : ''}</div></div>`;
        }).join('');
        const addressItems = addresses.map((a, i) => `<div class="cd-list-item"><div><strong>${esc(a.label || `Address ${i + 1}`)}</strong></div>
            <div class="cd-list-sub">${esc(a.address).replace(/\n/g, '<br>')}</div>
            ${a.phone || a.email ? `<div class="cd-list-sub">${[a.phone ? esc(a.phone) : '', a.email ? esc(a.email) : ''].filter(Boolean).join(' · ')}</div>` : ''}</div>`).join('');
        return `<h3 class="item-detail-heading">Other contacts</h3>${contactItems || '<p class="text-muted small">No extra contacts. Add them with Edit.</p>'}
        <h3 class="item-detail-heading">Shipping addresses</h3>${addressItems || '<p class="text-muted small">No saved shipping addresses. Add them with Edit.</p>'}`;
      })()}

      <h3 class="item-detail-heading">Billing summary</h3>
      <div class="item-detail-grid">
        ${card('Total billed', saved.length ? rs(total) : '—', saved.length ? `${saved.length} invoice${saved.length === 1 ? '' : 's'}` : 'No saved invoices')}
        ${card('Average invoice', saved.length ? rs(total / saved.length) : '—')}
        ${card('Customer since', first ? esc(dt(first)) : '—', first ? agoText(daysBetween(first)) : '')}
        ${card('Last invoice', last ? esc(dt(last)) : '—', last ? agoText(daysBetween(last)) : '')}
        ${card('GST collected', saved.length ? rs(gstTotal) : '—')}
        ${card('Drafts', String(drafts), drafts ? 'Not counted in totals' : '')}
      </div>

      <h3 class="item-detail-heading">Invoice history</h3>
      ${history.length
        ? `<table class="table table-sm item-detail-table"><thead><tr><th>Invoice</th><th>Date</th><th class="text-end">Amount</th><th>Status</th><th></th></tr></thead><tbody>${history.slice(0, 10).map(({ invoice, archiveIndex }) => `<tr>
            <td>${displayInvoiceNo(invoice)}</td><td>${invoice.invoiceDate ? esc(dt(invoice.invoiceDate)) : '—'}</td>
            <td class="text-end">${rs(invoice.total)}</td>
            <td><span class="badge ${invoice.status === 'draft' ? 'text-bg-warning' : invoice.status === 'quotation' ? 'text-bg-info' : 'text-bg-success'}">${invoice.status === 'draft' ? 'Draft' : invoice.status === 'quotation' ? 'Quotation' : 'Saved'}</span></td>
            <td class="text-end"><button type="button" class="btn btn-sm btn-outline-primary py-0" data-customer-invoice-view="${archiveIndex}">View</button></td></tr>`).join('')}</tbody></table>
          ${history.length > 10 ? `<p class="text-muted small">Showing the latest 10 of ${history.length} invoices.</p>` : ''}`
        : '<p class="text-muted small">No invoices for this customer yet.</p>'}

      <h3 class="item-detail-heading">Top items bought</h3>
      ${topItems.length
        ? `<table class="table table-sm item-detail-table"><thead><tr><th>Item</th><th class="text-end">Qty</th><th class="text-end">Amount</th></tr></thead><tbody>${topItems.slice(0, 5).map(entry => `<tr>
            <td>${esc(entry.name)}</td><td class="text-end">${qtyText(entry.qty)} ${esc(entry.unit)}</td><td class="text-end">${rs(entry.amount)}</td></tr>`).join('')}</tbody></table>
          <p class="text-muted small">${topItems.length} different item${topItems.length === 1 ? '' : 's'} bought in total.</p>`
        : '<p class="text-muted small">No items billed to this customer yet.</p>'}`;
  }

  let customerDetailIndex = -1;
  let customerDetailTrigger = null;

  function openCustomerDetail(index) {
    const customer = importedCustomers[index];
    if (!customer) return;
    customerDetailTrigger = document.activeElement;
    customerDetailIndex = index;
    const active = customer.active !== false;
    $('#customerDetailTitle').innerHTML = `${esc(customer.name)} <span class="badge ${active ? 'text-bg-success' : 'text-bg-secondary'} align-middle ms-1">${active ? 'Active' : 'Inactive'}</span>`;
    $('#customerDetailIntro').textContent = customer.gstin ? `GSTIN ${customer.gstin}` : 'Customer details';
    $('#customerDetailBody').innerHTML = customerDetailHTML(index);
    $('#customerDetailBody').scrollTop = 0;
    const drawer = $('#customerDetailDrawer');
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    const backdrop = $('#customerDetailBackdrop');
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
  }

  function closeCustomerDetail() {
    const drawer = $('#customerDetailDrawer');
    if (customerDetailTrigger?.isConnected) customerDetailTrigger.focus();
    drawer.classList.remove('is-open');
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
    const backdrop = $('#customerDetailBackdrop');
    backdrop.classList.remove('is-open');
    backdrop.hidden = true;
    customerDetailTrigger = null;
    customerDetailIndex = -1;
  }

  // Start a new invoice with this customer already filled in.
  function startInvoiceForCustomer(index) {
    const customer = importedCustomers[index];
    if (!customer) return;
    closeCustomerDetail();
    showGeneratePage();
    const fill = freshInvoice => {
      if (freshInvoice) startNewInvoice();
      S.customer = structuredClone(customer);
      save();
      render();
    };
    if (currentInvoiceIsBlank()) {
      fill(false);
      return;
    }
    confirmDestructiveAction({
      title: 'Discard the current invoice?',
      message: `The invoice you are working on has not been saved. Discard it and start a new invoice for ${customer.name}, or cancel to keep working on it.`,
      confirmLabel: 'Discard',
      action: () => fill(true)
    });
  }

  function customerDirectoryResultsHTML() {
    const query = directorySearch.customer.trim().toLowerCase();
    const filtered = customerRows()
      .filter(customerMatchesFilter)
      .filter(({ customer }) => [customer.name, customer.billing, customer.phone, customer.email, customer.gstin]
        .some(value => String(value || '').toLowerCase().includes(query)));
    applyTableSort('customer', filtered, CUSTOMER_SORT_VALUES);
    const pagination = directoryPagination.customer;
    pagination.page = Math.min(pagination.page, Math.max(1, Math.ceil(filtered.length / pagination.pageSize)));
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const pageRows = filtered.slice(startIndex, startIndex + pagination.pageSize);
    const allPageSelected = pageRows.length > 0 && pageRows.every(row => selectedCustomers.has(row.index));
    const list = filtered.length
      ? pageRows.map(({ customer, index, total, count, last, enabled, noPhone, noGstin }) => {
        return `<tr class="${enabled ? '' : 'item-inactive-row'} ${selectedCustomers.has(index) ? 'item-selected-row' : ''}">
          <th scope="row" class="item-select-cell directory-row-number"><div class="item-select-wrap"><input class="form-check-input" type="checkbox" data-customer-select="${index}" ${selectedCustomers.has(index) ? 'checked' : ''} aria-label="Select ${esc(customer.name)}"><span>${index + 1}</span></div></th>
          <td><button type="button" class="item-name-link" data-customer-detail="${index}" title="View customer details">${esc(customer.name)}</button>${normalizePriceList(customer.priceList) === 'wholesale' ? ' <span class="badge text-bg-info" title="Billed at wholesale rates">Wholesale</span>' : ''}</td>
          <td>${esc(customer.billing)}</td>
          <td>${noPhone ? '<span class="badge text-bg-warning" title="No phone number – cannot be reached on WhatsApp">Missing</span>' : esc(customer.phone)}</td>
          <td>${esc(customer.email)}</td>
          <td>${noGstin ? '<span class="badge text-bg-light border" title="No GSTIN – billed as an unregistered customer">Missing</span>' : esc(customer.gstin) + gstinBadgeHTML(customer.gstin)}</td>
          <td class="text-end">${count ? rs(total) : '—'}</td>
          <td class="text-center">${count}</td>
          <td>${last ? esc(dt(last)) : '—'}</td>
          <td class="text-center"><div class="form-check form-switch item-status-switch"><input class="form-check-input" type="checkbox" role="switch" data-customer-toggle="${index}" ${enabled ? 'checked' : ''} aria-label="${enabled ? 'Active' : 'Inactive'}: ${esc(customer.name)}" title="${enabled ? 'Active – shown in the invoice customer list' : 'Inactive – hidden from the invoice customer list'}"></div></td>
          <td class="directory-row-actions">
            <button type="button" class="btn btn-sm btn-outline-primary" data-customer-edit="${index}" aria-label="Edit ${esc(customer.name)}">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-customer-remove="${index}" aria-label="Delete ${esc(customer.name)}">Delete</button>
          </td>
        </tr>`;
      }).join('')
      : `<tr><td colspan="11" class="customer-directory-empty">${query || customerFilter !== 'all' ? 'No customers match your search or filter.' : 'No customers added or imported yet.'}</td></tr>`;
    return `
      ${customerBulkBarHTML()}
      <div class="customer-directory-table-wrap">
        <table class="table table-sm table-striped table-hover table-bordered align-middle customer-directory-table customer-select-table">
          <thead class="table-light"><tr><th scope="col" class="item-select-cell"><div class="item-select-wrap"><input class="form-check-input" type="checkbox" data-customer-select-all="${pageRows.map(row => row.index).join(',')}" ${allPageSelected ? 'checked' : ''} ${pageRows.length ? '' : 'disabled'} aria-label="Select all customers on this page"><span>#</span></div></th>${sortHeader('customer', 'name', 'Name')}${sortHeader('customer', 'billing', 'Address')}${sortHeader('customer', 'phone', 'Phone')}${sortHeader('customer', 'email', 'Email')}${sortHeader('customer', 'gstin', 'GSTIN')}${sortHeader('customer', 'total', 'Total Billed', 'text-end')}${sortHeader('customer', 'count', 'Invoices', 'text-center')}${sortHeader('customer', 'last', 'Last Invoice')}${sortHeader('customer', 'status', 'Active', 'text-center')}<th>Action</th></tr></thead>
          <tbody>${list}</tbody>
        </table>
      </div>
      ${directoryPaginationHTML('customer', filtered.length)}`;
  }

  function customerDuplicateKey(customer) {
    const gstin = String(customer.gstin || '').trim().toLowerCase();
    return gstin
      ? `gstin:${gstin}`
      : `details:${[customer.name, customer.phone, customer.billing].map(value => String(value || '').trim().toLowerCase()).join('|')}`;
  }

  function customerCsvContent(customers) {
    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return `\uFEFFname,address,phone,email,gstin,active,price_list,contacts,shipping_addresses\r\n${customers.map(customer => {
      const contacts = normalizeContacts(customer.contacts);
      const addresses = normalizeShipAddresses(customer.shippingAddresses);
      return [
      customer.name, customer.billing, customer.phone, customer.email, customer.gstin, customer.active === false ? 'no' : 'yes', normalizePriceList(customer.priceList),
      contacts.length ? JSON.stringify(contacts) : '', addresses.length ? JSON.stringify(addresses) : ''
    ].map(escapeCsv).join(',');
    }).join('\r\n')}\r\n`;
  }

  async function writeCustomerCsvFile(handle, customers) {
    const writable = await handle.createWritable();
    try {
      await writable.write(customerCsvContent(customers));
      await writable.close();
    } catch (error) {
      try {
        await writable.abort();
      } catch (abortError) {
        console.warn('Could not abort the failed CSV write.', abortError);
      }
      throw error;
    }
  }

  async function persistCustomerList(customers, requireFile = false) {
    if (requireFile && !customerCsvHandle) {
      throw new Error('Choose csv\\customers.csv before saving customer changes.');
    }
    const previousCustomers = importedCustomers;
    if (!saveImportedCustomers(customers)) {
      throw new Error('Could not save customer details in browser storage.');
    }
    importedCustomers = customers;
    try {
      if (customerCsvHandle) await writeCustomerCsvFile(customerCsvHandle, customers);
    } catch (error) {
      importedCustomers = previousCustomers;
      if (!saveImportedCustomers(previousCustomers)) {
        console.error('Could not restore the customer list after a CSV write failure.');
      }
      throw new Error(`Could not update customers.csv: ${error.message}`);
    }
  }

  async function connectCustomerCsv(providedHandle = null, navigate = true) {
    try {
      const handle = providedHandle || await pickConnectedCsvFile('customers');

      const file = await handle.getFile();
      const { customers: fileCustomers } = parseCustomerCsv(await file.text());
      const mergedCustomers = [...fileCustomers];
      const seen = new Set(mergedCustomers.map(customerDuplicateKey));
      importedCustomers.forEach(customer => {
        const key = customerDuplicateKey(customer);
        if (!seen.has(key)) {
          seen.add(key);
          mergedCustomers.push(customer);
        }
      });
      if (!saveImportedCustomers(mergedCustomers)) {
        throw new Error('Could not save customer details in browser storage.');
      }
      const previousCustomers = importedCustomers;
      const previousHandle = customerCsvHandle;
      customerCsvHandle = handle;
      importedCustomers = mergedCustomers;
      try {
        await writeCustomerCsvFile(handle, mergedCustomers);
      } catch (error) {
        customerCsvHandle = previousHandle;
        importedCustomers = previousCustomers;
        if (!saveImportedCustomers(previousCustomers)) {
          console.error('Could not restore the customer list after a CSV connection failure.');
        }
        throw error;
      }
      if (navigate) {
        render();
        openEditor('customerDirectory');
        const result = $('#customerImportStatus');
        result.classList.add('success');
        result.textContent = 'customers.csv is connected. Customer changes will update this file directly.';
      }
      return true;
    } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error('Could not connect customers.csv.', error);
      if (navigate) showCsvHelp('customers', error.message || 'Could not connect customers.csv.');
      else throw error;
      return false;
    }
  }

  function downloadCustomerCsv(customers, filename = 'customers-template.csv') {
    const blob = new Blob([customerCsvContent(customers)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function addCustomerFromForm(form, gstinConfirmed = false) {
    const formData = new FormData(form);
    const customer = {
      name: String(formData.get('name') || '').trim(),
      billing: String(formData.get('address') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      gstin: String(formData.get('gstin') || '').trim().toUpperCase(),
      priceList: normalizePriceList(formData.get('priceList')),
      shippingAddresses: normalizeShipAddresses([{ label: 'Shipping address', address: formData.get('shippingAddress') }]),
      active: true,
      shipSame: true,
      shipping: '',
      shippingPhone: '',
      shippingEmail: ''
    };
    const status = $('#customerImportStatus');
    status.className = 'customer-import-status';
    status.textContent = '';
    if (!customerCsvHandle) {
      showCsvHelp('customers', 'Connect the CSV file before adding a customer. Your details will be saved to customers.csv.');
      return;
    }
    if (!customer.name || !customer.billing) {
      status.classList.add('error');
      status.textContent = 'Customer name and address are required.';
      return;
    }
    const gstinCheck = validateGstin(customer.gstin);
    if (gstinCheck.status === 'error') {
      status.classList.add('error');
      status.textContent = `GSTIN: ${gstinCheck.message}`;
      return;
    }
    if (gstinCheck.status === 'warn' && !gstinConfirmed) {
      confirmDestructiveAction({
        title: 'This GSTIN may be mistyped',
        message: `${gstinCheck.message} Save “${customer.name}” anyway?`,
        confirmLabel: 'Save anyway',
        action: () => addCustomerFromForm(form, true)
      });
      return;
    }
    const duplicateKeys = new Set(customerOptions().map(customerDuplicateKey));
    if (duplicateKeys.has(customerDuplicateKey(customer))) {
      status.classList.add('error');
      status.textContent = 'This customer is already in the customer list.';
      return;
    }
    const updatedCustomers = [...importedCustomers, customer];
    try {
      await persistCustomerList(updatedCustomers, true);
      directoryPagination.customer.page = Math.ceil(updatedCustomers.length / directoryPagination.customer.pageSize);
    } catch (error) {
      console.error('Could not save the customer.', error);
      status.classList.add('error');
      status.textContent = error.message;
      return;
    }
    render();
    openEditor('customerDirectory');
    const result = $('#customerImportStatus');
    result.classList.add('success');
    result.textContent = 'Customer saved to customers.csv.';
  }

  async function importCustomerCsv(file) {
    const status = $('#customerImportStatus');
    if (!file) return;
    status.className = 'customer-import-status';
    status.textContent = '';
    try {
      if (!customerCsvHandle) {
        showCsvHelp('customers', 'Connect the CSV file before importing customer records.');
        return;
      }
      if (!/\.csv$/i.test(file.name)) throw new Error('Choose a CSV file.');
      const { customers, invalidRows } = parseCustomerCsv(await file.text());
      const seen = new Set(importedCustomers.map(customerDuplicateKey));
      const additions = customers.filter(customer => {
        const key = customerDuplicateKey(customer);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (!additions.length) {
        status.classList.add('error');
        status.textContent = `No new customers to add. ${invalidRows ? `${invalidRows} invalid row(s) skipped.` : 'All valid rows were already imported.'}`;
        return;
      }
      const updatedCustomers = [...importedCustomers, ...additions];
      await persistCustomerList(updatedCustomers, true);
      directoryPagination.customer.page = Math.ceil(updatedCustomers.length / directoryPagination.customer.pageSize);
      render();
      openEditor('customerDirectory');
      const result = $(`#edBody #customerImportStatus`);
      result.classList.add('success');
      const badGstin = additions.filter(customer => ['error', 'warn'].includes(validateGstin(customer.gstin).status)).length;
      result.textContent = `${additions.length} customer(s) imported and saved to customers.csv. ${customers.length - additions.length} duplicate(s) skipped.${invalidRows ? ` ${invalidRows} invalid row(s) skipped.` : ''}${badGstin ? ` ${badGstin} imported GSTIN(s) need checking – look for the “Check” or “Invalid” tag in the table.` : ''}`;
    } catch (error) {
      console.error('Could not import customer CSV.', error);
      status.classList.add('error');
      status.textContent = error.message || 'Could not read the CSV file.';
    }
  }

  async function removeCustomer(index) {
    if (!customerCsvHandle) {
      showCsvHelp('customers', 'Connect the customer CSV before removing a customer.');
      return;
    }
    const status = $('#customerImportStatus');
    const updatedCustomers = importedCustomers.filter((_, customerIndex) => customerIndex !== index);
    try {
      await persistCustomerList(updatedCustomers, true);
      selectedCustomers.clear();
      directoryPagination.customer.page = Math.min(
        directoryPagination.customer.page,
        Math.max(1, Math.ceil(updatedCustomers.length / directoryPagination.customer.pageSize))
      );
      render();
      openEditor('customerDirectory');
    } catch (error) {
      console.error('Could not remove customer.', error);
      status.className = 'customer-import-status error';
      status.textContent = error.message;
    }
  }

  async function saveCustomerEdit(index, gstinConfirmed = false) {
    const form = $('#directoryDrawerForm');
    if (!customerCsvHandle) {
      showCsvHelp('customers', 'Connect the customer CSV before saving customer edits.');
      return;
    }
    const status = $('#customerImportStatus');
    const field = key => String(new FormData(form).get(key) || '').trim();
    const customer = {
      ...importedCustomers[index],
      name: field('name'),
      billing: field('billing'),
      phone: field('phone'),
      email: field('email'),
      gstin: field('gstin').toUpperCase(),
      priceList: normalizePriceList(field('priceList'))
    };
    const extras = customerExtrasForm(form);
    customer.contacts = extras.contacts;
    customer.shippingAddresses = extras.shippingAddresses;
    if (extras.incompleteShip) {
      $('#directoryDrawerError').textContent = 'Each shipping address row needs the full address. Fill it in or remove the row.';
      $('#directoryDrawerError').hidden = false;
      return;
    }
    if (!customer.name || !customer.billing) {
      $('#directoryDrawerError').textContent = 'Customer name and address are required.';
      $('#directoryDrawerError').hidden = false;
      return;
    }
    const gstinCheck = validateGstin(customer.gstin);
    if (gstinCheck.status === 'error') {
      $('#directoryDrawerError').textContent = `GSTIN: ${gstinCheck.message}`;
      $('#directoryDrawerError').hidden = false;
      return;
    }
    if (gstinCheck.status === 'warn' && !gstinConfirmed) {
      confirmDestructiveAction({
        title: 'This GSTIN may be mistyped',
        message: `${gstinCheck.message} Save the changes anyway?`,
        confirmLabel: 'Save anyway',
        action: () => saveCustomerEdit(index, true)
      });
      return;
    }
    const key = customerDuplicateKey(customer);
    if (customerOptions().some((existing, existingIndex) =>
      !(existingIndex === DEMO_CUSTOMERS.length + index) && customerDuplicateKey(existing) === key)) {
      $('#directoryDrawerError').textContent = 'Another customer already has the same GSTIN or customer details.';
      $('#directoryDrawerError').hidden = false;
      return;
    }
    const updatedCustomers = importedCustomers.map((existing, customerIndex) => customerIndex === index ? customer : existing);
    try {
      await persistCustomerList(updatedCustomers, true);
      directoryPagination.customer.page = Math.min(
        directoryPagination.customer.page,
        Math.max(1, Math.ceil(updatedCustomers.length / directoryPagination.customer.pageSize))
      );
      closeDirectoryDrawer();
      render();
      openEditor('customerDirectory');
      $('#customerImportStatus').className = 'customer-import-status success';
      $('#customerImportStatus').textContent = 'Customer details updated in customers.csv.';
    } catch (error) {
      console.error('Could not update customer details.', error);
      $('#directoryDrawerError').textContent = error.message;
      $('#directoryDrawerError').hidden = false;
      status.className = 'customer-import-status error';
      status.textContent = error.message;
    }
  }

  function loadCatalogItems() {
    try {
      const saved = localStorage.getItem(ITEM_KEY);
      if (!saved) return [];
      const items = JSON.parse(saved);
      if (!Array.isArray(items)) throw new Error('Saved item list is not an array.');
      return items.filter(item => item && typeof item.name === 'string' && item.name.trim()
        && String(item.hsn || '').trim() && Number.isFinite(Number(item.rate)) && Number(item.rate) >= 0)
        .map(normalizeItem);
    } catch (error) {
      console.warn('Could not load saved catalog items.', error);
      return [];
    }
  }

  function saveCatalogItems(items) {
    try {
      localStorage.setItem(ITEM_KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error('Could not save catalog items.', error);
      return false;
    }
  }

  // Re-applies the current price list to every row picked from the item list (custom rows keep their typed rate).
  function repriceInvoiceRows() {
    const options = itemOptions();
    S.items.forEach(row => {
      if (row.custom || !row.name) return;
      const key = String(row.name).trim().toLowerCase();
      const match = options.find(option => String(option.name).trim().toLowerCase() === key && String(option.hsn) === String(row.hsn))
        || options.find(option => String(option.name).trim().toLowerCase() === key);
      if (match) row.rate = itemRateFor(match, S.customer?.priceList);
    });
  }

  function itemOptions() {
    return [...DEMO_ITEMS, ...catalogItems];
  }

  function normalizeItemUnit(value) {
    const text = String(value ?? '').trim().toLowerCase();
    return QUANTITY_UNITS.find(unit => unit.toLowerCase() === text) || 'Nos';
  }

  function normalizeItemGst(value) {
    const text = String(value ?? '').trim().replace('%', '');
    const rate = text === '' ? NaN : Number(text);
    return KNOWN_GST_RATES.includes(rate) ? rate : 18;
  }

  function itemGstSelectHTML(selected = 18) {
    return `<select class="form-select" name="gst">${gstOptionsFor(selected).map(rate =>
      `<option value="${rate}" ${rate === selected ? 'selected' : ''}>${gstLabel(rate)}</option>`).join('')}</select>`;
  }

  function itemUnitSelectHTML(selected = 'Nos') {
    return `<select class="form-select" name="unit">${QUANTITY_UNITS.map(unit =>
      `<option value="${esc(unit)}" ${unit === selected ? 'selected' : ''}>${esc(unit)}</option>`).join('')}</select>`;
  }

  // Price lists: Retail = the item's rate; Wholesale = its optional wholesale rate (falls back to retail when not set).
  const PRICE_LISTS = [['retail', 'Retail price'], ['wholesale', 'Wholesale price']];
  const normalizePriceList = value => (String(value ?? '').trim().toLowerCase() === 'wholesale' ? 'wholesale' : 'retail');
  const itemRateFor = (item, list) => (normalizePriceList(list) === 'wholesale' && +item.wholesaleRate > 0 ? +item.wholesaleRate : +item.rate);
  const priceListSelectHTML = (selected = 'retail', attrs = 'name="priceList"') =>
    `<select class="form-select" ${attrs}>${PRICE_LISTS.map(([value, label]) => `<option value="${value}" ${value === normalizePriceList(selected) ? 'selected' : ''}>${label}</option>`).join('')}</select>`;

  // Stock: null = not tracked (blank); a number = quantity on hand (may go negative if oversold).
  function parseStockValue(value) {
    const text = String(value ?? '').trim().replace(/,/g, '');
    if (text === '') return null;
    const n = Number(text);
    return Number.isFinite(n) ? round2(n) : null;
  }
  const itemTracksStock = item => item.stock !== null && item.stock !== undefined;
  // Alert levels: under 10 = warning, under 5 = danger (0 or less = out of stock).
  const STOCK_WARNING_BELOW = 10, STOCK_DANGER_BELOW = 5;
  const itemStockState = item => {
    if (!itemTracksStock(item)) return 'none';
    if (item.stock <= 0) return 'out';
    if (item.stock < STOCK_DANGER_BELOW) return 'danger';
    return item.stock < STOCK_WARNING_BELOW ? 'warning' : 'ok';
  };

  // Quantity of each item sold on saved invoices (quotations and drafts do not use stock).
  function stockUsageMap(records) {
    const usage = new Map();
    records.forEach(invoice => {
      if (invoice.status !== 'saved') return;
      (invoice.snapshot?.items || []).forEach(line => {
        const key = String(line.name || '').trim().toLowerCase();
        const qty = +line.qty || 0;
        if (key && qty) usage.set(key, (usage.get(key) || 0) + qty);
      });
    });
    return usage;
  }

  // Called after invoices are saved/changed/deleted: stock moves by the difference in quantities sold.
  async function syncStockWithInvoices(before, after) {
    const oldUsage = stockUsageMap(before), newUsage = stockUsageMap(after);
    const keys = new Set([...oldUsage.keys(), ...newUsage.keys()]);
    let changed = false;
    const updated = catalogItems.map(item => {
      const key = String(item.name || '').trim().toLowerCase();
      const delta = (newUsage.get(key) || 0) - (oldUsage.get(key) || 0);
      if (!keys.has(key) || !delta || !itemTracksStock(item)) return item;
      changed = true;
      return { ...item, stock: round2(item.stock - delta) };
    });
    if (!changed) return;
    try {
      await persistCatalogItems(updated);
      const touched = item => { const k = String(item.name || '').trim().toLowerCase(); return (newUsage.get(k) || 0) !== (oldUsage.get(k) || 0); };
      const list = items => `${items.slice(0, 3).map(item => `${item.name} (${qtyText(item.stock)} left)`).join(', ')}${items.length > 3 ? ` and ${items.length - 3} more` : ''}`;
      const changedItems = updated.filter(touched);
      const danger = changedItems.filter(item => ['out', 'danger'].includes(itemStockState(item)));
      const warning = changedItems.filter(item => itemStockState(item) === 'warning');
      if (warning.length) showToast(`Low stock: ${list(warning)}.`, { type: 'warning' });
      if (danger.length) showToast(`Very low stock: ${list(danger)}. Restock soon.`, { type: 'danger', duration: 10000 });
    } catch (error) {
      console.error('Could not update stock after saving the invoice.', error);
      showInvoiceToast('Invoice saved, but item stock could not be updated.');
    }
  }

  // Item model: name, hsn, rate, unit, gst + cost (purchase price), stock, active flag, price history.
  function normalizeItem(raw) {
    const cost = Number(raw.cost);
    const history = Array.isArray(raw.history)
      ? raw.history.filter(entry => entry && Number.isFinite(Number(entry.rate))).map(entry => ({ date: String(entry.date || ''), rate: Number(entry.rate) }))
      : [];
    return {
      name: String(raw.name).trim(),
      hsn: String(raw.hsn).trim(),
      rate: Number(raw.rate),
      unit: normalizeItemUnit(raw.unit),
      gst: normalizeItemGst(raw.gst),
      cost: Number.isFinite(cost) && cost > 0 ? cost : 0,
      stock: parseStockValue(raw.stock),
      wholesaleRate: Number(raw.wholesaleRate) > 0 ? Number(raw.wholesaleRate) : 0,
      active: !(raw.active === false || /^(false|no|0|inactive)$/i.test(String(raw.active ?? '').trim())),
      history
    };
  }

  const hsnIsValid = hsn => /^(\d{4}|\d{6}|\d{8})$/.test(String(hsn || '').trim());
  const itemMargin = item => (item.cost > 0 && item.rate > 0 ? (item.rate - item.cost) / item.rate * 100 : null);

  // Blocking problems (returns a message) – used by the add form and the edit drawer.
  function itemValidationError(item, rateText = String(item.rate)) {
    if (!item.name || !item.hsn || !rateText || !Number.isFinite(item.rate) || item.rate < 0) return 'Enter an item name, HSN/SAC, and a non-negative rate.';
    if (!hsnIsValid(item.hsn)) return 'HSN/SAC must be numbers only, with 4, 6 or 8 digits.';
    if (!Number.isFinite(item.cost) || item.cost < 0) return 'Purchase price cannot be negative.';
    return '';
  }

  // Non-blocking hints shown after saving.
  function itemWarnings(item) {
    const warnings = [];
    if (item.gst === 0) warnings.push('0% GST applies only to exempt or nil-rated items. Check that this is correct.');
    if (isLegacyGst(item.gst)) warnings.push(`${item.gst}% was removed in the 22 Sep 2025 GST reform (rates are now 0%, 5%, 18% and 40%). Check the current rate for this item.`);
    if (item.gst === 40) warnings.push('40% applies only to select luxury and sin goods (for example tobacco, pan masala, aerated drinks, high-end cars). Check that this is correct.');
    if (item.cost > 0 && item.cost > item.rate) warnings.push('The purchase price is higher than the selling rate (negative margin).');
    if (item.wholesaleRate > 0 && item.wholesaleRate > item.rate) warnings.push('The wholesale rate is higher than the retail rate.');
    if (item.wholesaleRate > 0 && item.cost > 0 && item.cost > item.wholesaleRate) warnings.push('The purchase price is higher than the wholesale rate (negative margin on wholesale sales).');
    return warnings;
  }

  const itemNameKey = name => String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  function editDistance(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const temp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous = temp;
      }
    }
    return row[b.length];
  }

  // Catalog items whose name is the same as, or very close to, this item's name.
  function similarItems(item, ignoreIndex = -1) {
    const key = itemNameKey(item.name);
    if (!key) return [];
    const allowed = key.length >= 7 ? 2 : key.length >= 4 ? 1 : 0;
    return catalogItems.filter((other, index) => {
      if (index === ignoreIndex) return false;
      const otherKey = itemNameKey(other.name);
      if (!otherKey) return false;
      if (otherKey === key) return true;
      return allowed > 0 && Math.abs(otherKey.length - key.length) <= allowed && editDistance(otherKey, key) <= allowed;
    });
  }

  // After a duplicate warning the user submits the same item again to confirm it.
  let duplicateAcknowledged = '';
  function duplicateWarningFor(item, ignoreIndex = -1) {
    const key = `${itemNameKey(item.name)}|${item.hsn}`;
    if (duplicateAcknowledged === key) return '';
    const similar = similarItems(item, ignoreIndex);
    if (!similar.length) return '';
    duplicateAcknowledged = key;
    return `Similar item${similar.length > 1 ? 's' : ''} already in the list: ${similar.slice(0, 3).map(other => `${other.name} (HSN ${other.hsn})`).join(', ')}. Press the button again to save anyway.`;
  }

  function itemDuplicateKey(item) {
    return `${String(item.name || '').trim().toLowerCase()}|${String(item.hsn || '').trim().toLowerCase()}`;
  }

  function parseItemCsv(text) {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('The CSV file is empty.');
    const normalizeHeader = value => value.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const headers = rows[0].map(normalizeHeader);
    const findColumn = (...names) => headers.findIndex(header => names.includes(header));
    const columns = {
      name: findColumn('name', 'item', 'itemname', 'product', 'productname', 'service'),
      hsn: findColumn('hsn', 'sac', 'hsnsac', 'hsnsaccode'),
      rate: findColumn('rate', 'price', 'unitrate', 'unitprice'),
      unit: findColumn('unit', 'uom', 'unitofmeasure'),
      gst: findColumn('gst', 'gstrate', 'gstpercent', 'tax', 'taxrate'),
      cost: findColumn('cost', 'costprice', 'purchaseprice', 'purchase'),
      active: findColumn('active', 'status'),
      wholesale: findColumn('wholesalerate', 'wholesaleprice', 'wholesale'),
      stock: findColumn('stock', 'stockonhand', 'quantityonhand', 'openingstock'),
      history: findColumn('pricehistory', 'history')
    };
    if (columns.name < 0) throw new Error('A "name" column is required.');
    if (columns.hsn < 0) throw new Error('An "hsn/sac" column is required.');
    if (columns.rate < 0) throw new Error('A "rate" column is required.');
    if (rows.length < 2) return { items: [], invalidRows: 0 };

    let invalidRows = 0;
    const items = rows.slice(1).flatMap(values => {
      if (values.length > headers.length) {
        invalidRows++;
        return [];
      }
      const name = String(values[columns.name] || '').trim();
      const hsn = String(values[columns.hsn] || '').trim();
      const rawRate = String(values[columns.rate] || '').trim().replace(/,/g, '');
      const rate = Number(rawRate);
      if (!name || !hsn || !rawRate || !Number.isFinite(rate) || rate < 0) {
        invalidRows++;
        return [];
      }
      const unit = normalizeItemUnit(columns.unit < 0 ? '' : values[columns.unit]);
      const gst = normalizeItemGst(columns.gst < 0 ? '' : values[columns.gst]);
      let history = [];
      if (columns.history >= 0 && String(values[columns.history] || '').trim()) {
        try { history = JSON.parse(values[columns.history]); } catch { history = []; }
      }
      return [normalizeItem({
        name, hsn, rate, unit, gst, history,
        cost: columns.cost < 0 ? 0 : String(values[columns.cost] || '').replace(/,/g, ''),
        stock: columns.stock < 0 ? '' : values[columns.stock],
        wholesaleRate: columns.wholesale < 0 ? 0 : String(values[columns.wholesale] || '').replace(/,/g, ''),
        active: columns.active < 0 ? true : values[columns.active]
      })];
    });
    if (!items.length && invalidRows) throw new Error('No valid item rows were found. Each row needs a name, HSN/SAC, and non-negative rate.');
    return { items, invalidRows };
  }

  function itemCsvContent(items) {
    const escapeCsv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return `\uFEFFname,hsn/sac,rate,unit,gst,cost,active,price_history,stock,wholesale_rate\r\n${items.map(item => [item.name, item.hsn, item.rate, normalizeItemUnit(item.unit), normalizeItemGst(item.gst),
      item.cost > 0 ? item.cost : '', item.active === false ? 'no' : 'yes', item.history?.length ? JSON.stringify(item.history) : '',
      itemTracksStock(item) ? item.stock : '', item.wholesaleRate > 0 ? item.wholesaleRate : '']
      .map(escapeCsv).join(',')).join('\r\n')}${items.length ? '\r\n' : ''}`;
  }

  async function writeItemCsvFile(handle, items) {
    const writable = await handle.createWritable();
    try {
      await writable.write(itemCsvContent(items));
      await writable.close();
    } catch (error) {
      try {
        await writable.abort();
      } catch (abortError) {
        console.warn('Could not abort the failed item CSV write.', abortError);
      }
      throw error;
    }
  }

  async function persistCatalogItems(items, requireFile = false) {
    if (requireFile && !itemCsvHandle) throw new Error('Choose csv\\items.csv before saving item changes.');
    const previousItems = catalogItems;
    if (!saveCatalogItems(items)) throw new Error('Could not save item details in browser storage.');
    catalogItems = items;
    try {
      if (itemCsvHandle) await writeItemCsvFile(itemCsvHandle, items);
    } catch (error) {
      catalogItems = previousItems;
      if (!saveCatalogItems(previousItems)) console.error('Could not restore the item catalog after a CSV write failure.');
      throw new Error(`Could not update items.csv: ${error.message}`);
    }
  }

  function itemDirectoryHTML() {
    return `
      <div class="kpi-grid" id="itemKpis">${itemKpisHTML()}</div>
      <div class="customer-import-controls">
        <div class="customer-import-heading">
          <div><strong>Import items from another CSV</strong><div class="form-text">Required columns: name, hsn/sac, rate. Optional: unit (defaults to Nos), gst (0, 5, 18 or 40; defaults to 18 – old 12 and 28 values are still accepted but flagged). Duplicate items are skipped.</div></div>
          <button class="btn btn-sm btn-outline-secondary" type="button" data-item-template>Download CSV template</button>
        </div>
        <label class="visually-hidden" for="itemCsvFile">Choose an item CSV file</label>
        <input class="form-control" type="file" id="itemCsvFile" accept=".csv,text/csv" title="Choose an item CSV file to import">
      </div>
      <div class="customer-import-status" id="itemImportStatus" role="status" aria-live="polite"></div>
      <form id="itemAddForm" class="customer-add-form item-add-form">
        <div class="customer-directory-heading"><strong>Add an item</strong></div>
        <div class="customer-add-grid">
          <label class="customer-field">Item name<input class="form-control" name="name" required maxlength="200" placeholder="Enter product or service name"></label>
          <label class="customer-field">HSN/SAC<input class="form-control" name="hsn" required maxlength="50" placeholder="Enter HSN/SAC code"></label>
          <label class="customer-field">Rate<input class="form-control" name="rate" type="number" min="0" step="any" required placeholder="Enter unit rate"></label>
          <label class="customer-field">Wholesale rate<input class="form-control" name="wholesaleRate" type="number" min="0" step="any" placeholder="Optional" title="Used for customers on the Wholesale price list"></label>
          <label class="customer-field">Purchase price<input class="form-control" name="cost" type="number" min="0" step="any" placeholder="Optional cost"></label>
          <label class="customer-field">Opening stock<input class="form-control" name="stock" type="number" step="any" placeholder="Optional" title="Leave blank to not track stock for this item"></label>
          <label class="customer-field">Unit${itemUnitSelectHTML('Nos')}</label>
          <label class="customer-field">GST %${itemGstSelectHTML(18)}</label>
          <div class="customer-add-action"><button type="submit" class="btn btn-primary">Add Item</button></div>
        </div>
      </form>
      <div class="customer-directory-heading"><strong>Item list</strong>
        <div class="customer-directory-tools">
          <select class="form-select form-select-sm customer-filter-select" id="itemFilterSelect" data-item-filter-select aria-label="Filter items">
            ${ITEM_FILTERS.map(([value, label]) => `<option value="${value}" ${itemFilter === value ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
          <div class="directory-search-control">
            <input class="form-control form-control-sm directory-search" type="search" data-directory-search="item" value="${esc(directorySearch.item)}" placeholder="Search items…" aria-label="Search items">
            <svg class="directory-search-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"></circle><path d="m10.5 10.5 3 3"></path></svg>
          </div>
        </div>
      </div>
      <div id="itemDirectoryResults">${itemDirectoryResultsHTML()}</div>`;
  }

  /* ---------- item directory: KPI cards, sales stats, bulk actions, detail drawer ---------- */
  const ITEM_FILTERS = [
    ['all', 'All items'], ['active', 'Active only'], ['inactive', 'Inactive only'], ['sold', 'Sold'],
    ['unsold', 'Not sold (90 days)'], ['lowstock', 'Low stock (under 10)'], ['missing', 'Missing / invalid HSN or rate'], ['duplicate', 'Possible duplicates'], ['oldgst', 'Old GST rate (12% / 28%)']
  ];
  const ITEM_RECENT_DAYS = 90;
  const qtyText = n => String(round2(n));
  const percentText = n => `${n >= 0 ? '' : '−'}${Math.abs(n).toFixed(1)}%`;

  // Amount billed for one invoice line (GST included, discount subtracted).
  function invoiceLineAmount(line, priceIncludesGst) {
    const g = +line.gst || 0, q = +line.qty || 0, r = +line.rate || 0, d = +line.disc || 0, base = r * q - d;
    return priceIncludesGst ? base : base + base * g / 100;
  }

  // Sales per item name, taken from the line items of saved invoices.
  function itemStatsMap() {
    const stats = new Map();
    archivedInvoices.forEach(invoice => {
      if (invoice.status !== 'saved') return;
      const snap = invoice.snapshot || {};
      const incl = snap.priceMode === 'incl';
      const date = String(invoice.invoiceDate || '');
      (snap.items || []).forEach(line => {
        const key = String(line.name || '').trim().toLowerCase();
        if (!key) return;
        const entry = stats.get(key) || { qty: 0, revenue: 0, last: '' };
        entry.qty += +line.qty || 0;
        entry.revenue += invoiceLineAmount(line, incl) * snapshotNetFactor(snap);
        if (date && date > entry.last) entry.last = date;
        stats.set(key, entry);
      });
    });
    return stats;
  }

  // Every saved-invoice line for one item (newest first) – used by the detail drawer.
  function itemSalesLines(item) {
    const key = String(item.name || '').trim().toLowerCase();
    const lines = [];
    archivedInvoices.forEach(invoice => {
      if (invoice.status !== 'saved') return;
      const snap = invoice.snapshot || {};
      (snap.items || []).forEach(line => {
        if (String(line.name || '').trim().toLowerCase() !== key) return;
        lines.push({ invoice, qty: +line.qty || 0, amount: invoiceLineAmount(line, snap.priceMode === 'incl') * snapshotNetFactor(snap), date: String(invoice.invoiceDate || '') });
      });
    });
    return lines.sort((a, b) => b.date.localeCompare(a.date));
  }

  function itemRows() {
    const stats = itemStatsMap();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ITEM_RECENT_DAYS);
    const cutoffIso = isoDate(cutoff);
    const nameCounts = new Map();
    catalogItems.forEach(item => {
      const key = itemNameKey(item.name);
      nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
    });
    return catalogItems.map((item, index) => {
      const s = stats.get(String(item.name || '').trim().toLowerCase()) || { qty: 0, revenue: 0, last: '' };
      const invalidHsn = !hsnIsValid(item.hsn);
      return {
        item, index, ...s,
        sold: Boolean(s.last),
        recent: Boolean(s.last) && s.last >= cutoffIso,
        margin: itemMargin(item),
        active: item.active !== false,
        invalidHsn,
        duplicate: nameCounts.get(itemNameKey(item.name)) > 1,
        missing: invalidHsn || !(+item.rate > 0)
      };
    });
  }

  function itemMatchesFilter(row) {
    switch (itemFilter) {
      case 'active': return row.active;
      case 'inactive': return !row.active;
      case 'sold': return row.sold;
      case 'unsold': return !row.recent;
      case 'lowstock': return ['warning', 'danger', 'out'].includes(itemStockState(row.item));
      case 'missing': return row.missing;
      case 'duplicate': return row.duplicate;
      case 'oldgst': return isLegacyGst(row.item.gst);
      default: return true;
    }
  }

  function itemKpisHTML() {
    const rows = itemRows();
    const soldRows = rows.filter(r => r.sold);
    const bestQty = [...soldRows].sort((a, b) => b.qty - a.qty)[0];
    const bestRevenue = [...soldRows].sort((a, b) => b.revenue - a.revenue)[0];
    const unsold = rows.filter(r => !r.recent).length;
    const missing = rows.filter(r => r.missing).length;
    const lowStock = rows.filter(r => ['warning', 'danger', 'out'].includes(itemStockState(r.item))).length;
    const inactive = rows.filter(r => !r.active).length;
    const card = (cls, label, value, sub, filter) => `<${filter ? 'button type="button"' : 'div'} class="kpi-card ${cls} ${filter ? 'is-clickable' : ''} ${filter && itemFilter === filter ? 'is-selected' : ''}" ${filter ? `data-item-filter="${filter}"` : ''}>
        <span class="kpi-label">${label}</span>
        <span class="kpi-value">${value}</span>
        <span class="kpi-sub">${sub}</span>
      </${filter ? 'button' : 'div'}>`;
    return [
      card('kpi-blue', 'Total Items', String(rows.length), `${soldRows.length} sold · ${inactive} inactive`, 'all'),
      card('kpi-green', 'Best Seller', bestQty ? esc(bestQty.item.name) : '—', bestQty ? `${qtyText(bestQty.qty)} ${esc(bestQty.item.unit || 'Nos')} sold` : 'No sales yet'),
      card('kpi-violet', 'Top Revenue Item', bestRevenue ? esc(bestRevenue.item.name) : '—', bestRevenue ? `${rs(bestRevenue.revenue)} billed` : 'No sales yet'),
      card('kpi-amber', 'Not Sold (90 days)', String(unsold), 'No sale in 90 days or never', 'unsold'),
      card('kpi-red', 'Low Stock', String(lowStock), 'Under 10 in stock (red under 5)', 'lowstock'),
      card('kpi-rose', 'Missing Details', String(missing), 'Missing / invalid HSN or ₹0 rate', 'missing')
    ].join('');
  }

  function refreshItemDirectory() {
    const set = (selector, html) => { const el = $(selector); if (el) el.innerHTML = html; };
    set('#itemKpis', itemKpisHTML());
    set('#itemDirectoryResults', itemDirectoryResultsHTML());
    const select = $('#itemFilterSelect');
    if (select) select.value = itemFilter;
  }

  const ITEM_SORT_VALUES = {
    name: r => String(r.item.name || '').toLowerCase(),
    hsn: r => String(r.item.hsn || '').toLowerCase(),
    rate: r => +r.item.rate || 0,
    wholesale: r => +r.item.wholesaleRate || 0,
    cost: r => +r.item.cost || 0,
    margin: r => (r.margin === null ? -Infinity : r.margin),
    unit: r => String(r.item.unit || 'Nos').toLowerCase(),
    stock: r => (itemTracksStock(r.item) ? r.item.stock : -Infinity),
    gst: r => normalizeItemGst(r.item.gst),
    qty: r => r.qty,
    revenue: r => r.revenue,
    last: r => r.last,
    status: r => (r.active ? 1 : 0)
  };

  function itemBulkBarHTML() {
    if (!selectedItems.size && !bulkUndo) return '';
    const undoButton = bulkUndo ? `<button type="button" class="btn btn-sm btn-outline-dark" data-item-bulk="undo" title="Put the changed values back">↶ Undo: ${esc(bulkUndo.label)}</button>` : '';
    if (!selectedItems.size) return `<div class="bulk-bar" role="region" aria-label="Bulk actions">${undoButton}</div>`;
    return `<div class="bulk-bar" role="region" aria-label="Bulk actions">
      <span class="bulk-count"><strong>${selectedItems.size}</strong> selected</span>
      <div class="bulk-gst">
        <select class="form-select form-select-sm" id="bulkGstSelect" aria-label="GST rate to apply">${GST_RATES.map(rate => `<option value="${rate}" ${rate === 18 ? 'selected' : ''}>${rate}%</option>`).join('')}</select>
        <button type="button" class="btn btn-sm btn-outline-primary" data-item-bulk="gst">Set GST %</button>
      </div>
      <div class="bulk-gst">
        <select class="form-select form-select-sm" id="bulkUnitSelect" aria-label="Unit to apply">${QUANTITY_UNITS.map(unit => `<option value="${esc(unit)}" ${unit === 'Nos' ? 'selected' : ''}>${esc(unit)}</option>`).join('')}</select>
        <button type="button" class="btn btn-sm btn-outline-primary" data-item-bulk="unit">Set unit</button>
      </div>
      <button type="button" class="btn btn-sm btn-primary" data-item-bulk="price">Change prices…</button>
      <button type="button" class="btn btn-sm btn-primary" data-item-bulk="stock">Adjust stock…</button>
      <button type="button" class="btn btn-sm btn-outline-secondary" data-item-bulk="export">Export CSV</button>
      <button type="button" class="btn btn-sm btn-outline-success" data-item-bulk="activate">Mark active</button>
      <button type="button" class="btn btn-sm btn-outline-secondary" data-item-bulk="deactivate">Mark inactive</button>
      <button type="button" class="btn btn-sm btn-outline-danger" data-item-bulk="delete">Delete</button>
      ${undoButton}
      <button type="button" class="btn btn-sm btn-link" data-item-bulk="clear">Clear selection</button>
    </div>`;
  }

  function stockCellHTML(item) {
    const state = itemStockState(item);
    if (state === 'none') return '—';
    const badge = state === 'out' ? ' <span class="badge text-bg-danger">Out</span>' : state === 'danger' ? ' <span class="badge text-bg-danger">Very low</span>' : state === 'warning' ? ' <span class="badge text-bg-warning">Low</span>' : '';
    return `${qtyText(item.stock)}${badge}`;
  }

  function itemDirectoryResultsHTML() {
    const query = directorySearch.item.trim().toLowerCase();
    const filtered = itemRows()
      .filter(itemMatchesFilter)
      .filter(({ item }) => [item.name, item.hsn, item.rate]
        .some(value => String(value ?? '').toLowerCase().includes(query)));
    applyTableSort('item', filtered, ITEM_SORT_VALUES);
    const pagination = directoryPagination.item;
    pagination.page = Math.min(pagination.page, Math.max(1, Math.ceil(filtered.length / pagination.pageSize)));
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const pageRows = filtered.slice(startIndex, startIndex + pagination.pageSize);
    const allPageSelected = pageRows.length > 0 && pageRows.every(row => selectedItems.has(row.index));
    const rows = filtered.length
      ? pageRows.map(({ item, index, qty, revenue, last, sold, margin, active, invalidHsn, duplicate }) => {
        return `<tr class="${active ? '' : 'item-inactive-row'} ${selectedItems.has(index) ? 'item-selected-row' : ''}">
          <th scope="row" class="item-select-cell directory-row-number"><div class="item-select-wrap"><input class="form-check-input" type="checkbox" data-item-select="${index}" ${selectedItems.has(index) ? 'checked' : ''} aria-label="Select ${esc(item.name)}"><span>${index + 1}</span></div></th>
          <td><button type="button" class="item-name-link" data-item-detail="${index}" title="View item details">${esc(item.name)}</button>${duplicate ? ' <span class="badge text-bg-warning" title="Another item has the same or a very similar name">Duplicate?</span>' : ''}</td>
          <td>${esc(item.hsn)}${invalidHsn ? ` <span class="badge text-bg-warning" title="HSN/SAC should be 4, 6 or 8 digits">${String(item.hsn || '').trim() ? 'Invalid' : 'Missing'}</span>` : ''}</td>
          <td class="text-end">${item.cost > 0 ? fmt(item.cost) : '—'}</td>
          <td class="text-end">${fmt(item.rate)}${!(+item.rate > 0) ? ' <span class="badge text-bg-warning">₹0</span>' : ''}</td>
          <td class="text-end">${item.wholesaleRate > 0 ? fmt(item.wholesaleRate) : '—'}</td>
          <td class="text-end ${margin === null ? '' : margin >= 0 ? 'text-success' : 'text-danger'}">${margin === null ? '—' : percentText(margin)}</td>
          <td class="text-end">${stockCellHTML(item)}</td>
          <td>${esc(item.unit || 'Nos')}</td>
          <td>${normalizeItemGst(item.gst)}%${isLegacyGst(item.gst) ? ' <span class="badge text-bg-warning" title="12% and 28% were removed in the 22 Sep 2025 GST reform – check the current rate">Old</span>' : ''}</td>
          <td class="text-end">${sold ? qtyText(qty) : '—'}</td>
          <td class="text-end">${sold ? rs(revenue) : '—'}</td>
          <td>${last ? esc(dt(last)) : '—'}</td>
          <td class="text-center"><div class="form-check form-switch item-status-switch"><input class="form-check-input" type="checkbox" role="switch" data-item-toggle="${index}" ${active ? 'checked' : ''} aria-label="${active ? 'Active' : 'Inactive'}: ${esc(item.name)}" title="${active ? 'Active – shown in the invoice item list' : 'Inactive – hidden from the invoice item list'}"></div></td>
          <td class="directory-row-actions">
            <button type="button" class="btn btn-sm btn-outline-primary" data-item-edit="${index}" aria-label="Edit ${esc(item.name)}">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-item-remove="${index}" aria-label="Delete ${esc(item.name)}">Delete</button>
          </td>
        </tr>`;
      }).join('')
      : `<tr><td colspan="15" class="customer-directory-empty">${query || itemFilter !== 'all' ? 'No items match your search or filter.' : 'No items added or imported yet.'}</td></tr>`;
    return `
      ${itemBulkBarHTML()}
      <div class="customer-directory-table-wrap item-table-wrap">
        <table class="table table-sm table-striped table-hover table-bordered align-middle customer-directory-table item-directory-table">
          <thead class="table-light"><tr>
            <th scope="col" class="item-select-cell"><div class="item-select-wrap"><input class="form-check-input" type="checkbox" data-item-select-all="${pageRows.map(row => row.index).join(',')}" ${allPageSelected ? 'checked' : ''} ${pageRows.length ? '' : 'disabled'} aria-label="Select all items on this page"><span>#</span></div></th>${sortHeader('item', 'name', 'Name', 'item-name-col')}${sortHeader('item', 'hsn', '<span class="two-line-label">HSN/<br>SAC</span>')}${sortHeader('item', 'cost', 'Cost', 'text-end')}${sortHeader('item', 'rate', 'Retail', 'text-end')}${sortHeader('item', 'wholesale', 'Wholesale', 'text-end')}${sortHeader('item', 'margin', 'Margin', 'text-end')}${sortHeader('item', 'stock', 'Stock', 'text-end')}${sortHeader('item', 'unit', 'Unit')}${sortHeader('item', 'gst', 'GST')}${sortHeader('item', 'qty', '<span class="two-line-label">Qty<br>Sold</span>', 'text-end')}${sortHeader('item', 'revenue', 'Revenue', 'text-end')}${sortHeader('item', 'last', '<span class="two-line-label">Last<br>Sold</span>')}${sortHeader('item', 'status', 'Active', 'text-center')}<th>Action</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${directoryPaginationHTML('item', filtered.length)}`;
  }

  /* ----- bulk price / stock editing, export and undo ----- */
  function undoEntryFor(item, patch) {
    const prev = {};
    Object.keys(patch).forEach(field => { prev[field] = item[field]; });
    return { key: itemDuplicateKey(item), prev };
  }

  // Applies { index → partial item } to the catalog, saves it, and remembers how to undo it.
  async function applyBulkPatches(label, patches, doneMessage) {
    const undoEntries = [];
    const updated = catalogItems.map((item, index) => {
      const patch = patches.get(index);
      if (!patch) return item;
      undoEntries.push(undoEntryFor(item, patch));
      return { ...item, ...patch };
    });
    await persistCatalogItems(updated, true);
    bulkUndo = { label, entries: undoEntries };
    selectedItems.clear();
    render();
    openEditor('itemDirectory');
    $('#itemImportStatus').className = 'customer-import-status success';
    $('#itemImportStatus').textContent = doneMessage;
  }

  async function undoBulkItemChange() {
    if (!bulkUndo) return;
    if (!itemCsvHandle) { showCsvHelp('items', 'Connect the item CSV before changing items.'); return; }
    const previous = new Map(bulkUndo.entries.map(entry => [entry.key, entry.prev]));
    const updated = catalogItems.map(item => (previous.has(itemDuplicateKey(item)) ? { ...item, ...previous.get(itemDuplicateKey(item)) } : item));
    try {
      await persistCatalogItems(updated, true);
      const label = bulkUndo.label;
      bulkUndo = null;
      render();
      openEditor('itemDirectory');
      $('#itemImportStatus').className = 'customer-import-status success';
      $('#itemImportStatus').textContent = `Undone: ${label}.`;
    } catch (error) {
      console.error('Could not undo the bulk change.', error);
      $('#itemImportStatus').className = 'customer-import-status error';
      $('#itemImportStatus').textContent = error.message;
    }
  }

  function exportSelectedItems() {
    const picked = catalogItems.filter((_, index) => selectedItems.has(index));
    if (!picked.length) return;
    const url = URL.createObjectURL(new Blob([itemCsvContent(picked)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `items-selected-${isoDate(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`${picked.length} item${picked.length === 1 ? '' : 's'} exported to CSV.`, { type: 'success' });
  }

  const bulkRound = (value, mode) => {
    if (mode === '1') return Math.round(value);
    if (mode === '5') return Math.round(value / 5) * 5;
    if (mode === '10') return Math.round(value / 10) * 10;
    if (mode === '99') return Math.floor(value) + 0.99;
    return round2(value);
  };

  const BULK_PRICE_METHODS = [
    ['pct-up', 'Increase by %'], ['pct-down', 'Decrease by %'], ['amt-up', 'Increase by ₹'], ['amt-down', 'Decrease by ₹'],
    ['set', 'Set to exact value'], ['margin', 'Set margin % (from purchase price)']
  ];

  function bulkPriceFormHTML() {
    return `<div class="row g-2">
      <div class="col-6"><label class="form-label small mb-1" for="bulkPriceField">Change</label>
        <select class="form-select form-select-sm" id="bulkPriceField"><option value="rate">Retail rate</option><option value="wholesaleRate">Wholesale rate</option><option value="cost">Purchase price</option></select></div>
      <div class="col-6"><label class="form-label small mb-1" for="bulkPriceMethod">How</label>
        <select class="form-select form-select-sm" id="bulkPriceMethod"></select></div>
      <div class="col-6"><label class="form-label small mb-1" for="bulkPriceValue" id="bulkPriceValueLabel">Percent</label>
        <input class="form-control form-control-sm" id="bulkPriceValue" type="number" min="0" step="any" placeholder="Enter value"></div>
      <div class="col-6"><label class="form-label small mb-1" for="bulkPriceRound">Round the result</label>
        <select class="form-select form-select-sm" id="bulkPriceRound"><option value="none">No rounding (2 decimals)</option><option value="1">Nearest ₹1</option><option value="5">Nearest ₹5</option><option value="10">Nearest ₹10</option><option value="99">Ends in .99</option></select></div>
    </div>
    <div class="bulk-preview" id="bulkPreview" aria-live="polite"></div>`;
  }

  function bulkStockFormHTML() {
    return `<div class="row g-2">
      <div class="col-6"><label class="form-label small mb-1" for="bulkStockMethod">How</label>
        <select class="form-select form-select-sm" id="bulkStockMethod"><option value="add">Add stock (received)</option><option value="sub">Remove stock</option><option value="set">Set to exact quantity</option></select></div>
      <div class="col-6"><label class="form-label small mb-1" for="bulkStockValue">Quantity</label>
        <input class="form-control form-control-sm" id="bulkStockValue" type="number" min="0" step="any" placeholder="Enter quantity"></div>
    </div>
    <div class="form-text">Items whose stock is not tracked are skipped, except with "Set to exact quantity", which starts tracking them.</div>
    <div class="bulk-preview" id="bulkPreview" aria-live="polite"></div>`;
  }

  function openBulkModal(kind) {
    if (!selectedItems.size) return;
    if (!itemCsvHandle) { showCsvHelp('items', 'Connect the item CSV before changing items.'); return; }
    bulkModalKind = kind;
    $('#bulkItemTitle').textContent = kind === 'price' ? `Change prices · ${selectedItems.size} item${selectedItems.size === 1 ? '' : 's'}` : `Adjust stock · ${selectedItems.size} item${selectedItems.size === 1 ? '' : 's'}`;
    $('#bulkItemBody').innerHTML = kind === 'price' ? bulkPriceFormHTML() : bulkStockFormHTML();
    $('#bulkItemError').textContent = '';
    if (kind === 'price') syncBulkPriceMethods();
    refreshBulkPreview();
    bootstrap.Modal.getOrCreateInstance($('#bulkItemModal')).show();
  }

  // "Set margin" only makes sense for the selling rate.
  function syncBulkPriceMethods() {
    const field = $('#bulkPriceField').value;
    const select = $('#bulkPriceMethod');
    const current = select.value;
    const methods = BULK_PRICE_METHODS.filter(([value]) => field !== 'cost' || value !== 'margin');
    select.innerHTML = methods.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    select.value = methods.some(([value]) => value === current) ? current : methods[0][0];
    const method = select.value;
    $('#bulkPriceValueLabel').textContent = method.startsWith('pct') ? 'Percent (%)' : method === 'margin' ? 'Target margin (%)' : method === 'set' ? 'Value (₹)' : 'Amount (₹)';
  }

  // One row per selected item: what it is now, what it would become, or why it is skipped.
  function bulkPlan() {
    const rows = [];
    const raw = $('#bulkPriceValue') ? $('#bulkPriceValue').value : $('#bulkStockValue')?.value;
    const entered = raw === '' || raw === undefined ? NaN : Number(raw);
    const selected = [...selectedItems].sort((a, b) => a - b).filter(index => catalogItems[index]);
    if (bulkModalKind === 'price') {
      const field = $('#bulkPriceField').value, method = $('#bulkPriceMethod').value, rounding = $('#bulkPriceRound').value;
      selected.forEach(index => {
        const item = catalogItems[index];
        const oldValue = +item[field] || 0;
        const base = oldValue || (field === 'wholesaleRate' ? +item.rate || 0 : 0);   // an unset wholesale rate starts from the retail rate
        let next = null, reason = '';
        if (!Number.isFinite(entered) || entered < 0) reason = 'Enter a value';
        else if (method === 'margin') {
          if (!(+item.cost > 0)) reason = 'No purchase price';
          else if (entered >= 100) reason = 'Margin must be under 100%';
          else next = item.cost / (1 - entered / 100);
        } else if (method === 'pct-up') next = base * (1 + entered / 100);
        else if (method === 'pct-down') next = base * (1 - entered / 100);
        else if (method === 'amt-up') next = base + entered;
        else if (method === 'amt-down') next = base - entered;
        else next = entered;
        if (next !== null) {
          next = bulkRound(next, rounding);
          if (!Number.isFinite(next) || next < 0) { next = null; reason = 'Would go below ₹0'; }
        }
        rows.push({ index, item, oldValue, next, reason, unchanged: next !== null && round2(next) === round2(oldValue) });
      });
    } else {
      const method = $('#bulkStockMethod').value;
      selected.forEach(index => {
        const item = catalogItems[index];
        const tracked = itemTracksStock(item);
        const oldValue = tracked ? item.stock : null;
        let next = null, reason = '';
        if (!Number.isFinite(entered) || entered < 0) reason = 'Enter a quantity';
        else if (method === 'set') next = entered;
        else if (!tracked) reason = 'Stock not tracked';
        else next = method === 'add' ? item.stock + entered : item.stock - entered;
        if (next !== null) next = round2(next);
        rows.push({ index, item, oldValue, next, reason, unchanged: next !== null && oldValue !== null && next === oldValue });
      });
    }
    return rows;
  }

  function refreshBulkPreview() {
    const box = $('#bulkPreview');
    if (!box) return;
    const rows = bulkPlan();
    const changing = rows.filter(row => row.next !== null && !row.unchanged);
    const skipped = rows.filter(row => row.next === null);
    const show = value => (value === null ? '—' : bulkModalKind === 'price' ? `₹${fmt(value)}` : qtyText(value));
    const preview = rows.slice(0, 8).map(row => `<tr class="${row.next === null ? 'is-skipped' : ''}">
      <td>${esc(row.item.name)}</td><td class="text-end">${show(row.oldValue)}</td>
      <td class="text-end">${row.next === null ? `<span class="text-muted">${esc(row.reason)}</span>` : `<strong>${show(row.next)}</strong>`}</td></tr>`).join('');
    box.innerHTML = `<div class="bulk-preview-summary"><strong>${changing.length}</strong> will change${skipped.length ? ` · <strong>${skipped.length}</strong> skipped` : ''}${rows.length - changing.length - skipped.length ? ` · ${rows.length - changing.length - skipped.length} unchanged` : ''}</div>
      <table class="table table-sm bulk-preview-table"><thead><tr><th>Item</th><th class="text-end">Now</th><th class="text-end">After</th></tr></thead><tbody>${preview}</tbody></table>
      ${rows.length > 8 ? `<div class="form-text">…and ${rows.length - 8} more.</div>` : ''}`;
    $('#bulkItemApply').disabled = !changing.length;
  }

  async function applyBulkModal() {
    const rows = bulkPlan().filter(row => row.next !== null && !row.unchanged);
    if (!rows.length) { $('#bulkItemError').textContent = 'Nothing to change. Check the value you entered.'; return; }
    const patches = new Map();
    let label, message;
    if (bulkModalKind === 'price') {
      const field = $('#bulkPriceField').value;
      rows.forEach(({ index, item, next }) => {
        if (field !== 'rate') { patches.set(index, { [field]: next }); return; }
        const history = [...(item.history || [])];
        if (!history.length) history.push({ date: '', rate: item.rate });
        history.push({ date: isoDate(new Date()), rate: next });
        patches.set(index, { rate: next, history });
      });
      const fieldName = { rate: 'retail rate', wholesaleRate: 'wholesale rate', cost: 'purchase price' }[field];
      label = `${fieldName} change`;
      message = `${rows.length} item${rows.length === 1 ? '' : 's'} updated: ${fieldName} changed and saved to items.csv.`;
    } else {
      rows.forEach(({ index, next }) => patches.set(index, { stock: next }));
      label = 'stock change';
      message = `Stock updated for ${rows.length} item${rows.length === 1 ? '' : 's'} and saved to items.csv.`;
    }
    try {
      $('#bulkItemApply').disabled = true;
      await applyBulkPatches(label, patches, message);
      bootstrap.Modal.getOrCreateInstance($('#bulkItemModal')).hide();
    } catch (error) {
      console.error('Bulk item edit failed.', error);
      $('#bulkItemError').textContent = error.message || 'Could not save the changes.';
      $('#bulkItemApply').disabled = false;
    }
  }

  /* ----- bulk actions + active toggle ----- */
  async function bulkUpdateItems(action, value) {
    if (!itemCsvHandle) {
      showCsvHelp('items', 'Connect the item CSV before changing items.');
      return;
    }
    const picked = new Set(selectedItems);
    if (!picked.size) return;
    const undoEntries = [];
    const patchOf = item => {
      if (action === 'gst') return { gst: normalizeItemGst(value) };
      if (action === 'unit') return { unit: normalizeItemUnit(value) };
      return { active: action === 'activate' };
    };
    const updated = action === 'delete'
      ? catalogItems.filter((_, index) => !picked.has(index))
      : catalogItems.map((item, index) => {
        if (!picked.has(index)) return item;
        const patch = patchOf(item);
        undoEntries.push(undoEntryFor(item, patch));
        return { ...item, ...patch };
      });
    const labels = { delete: 'deleted', gst: `set to ${value}% GST`, unit: `set to unit ${value}`, activate: 'marked active', deactivate: 'marked inactive' };
    const undoLabels = { gst: 'GST change', unit: 'unit change', activate: 'mark active', deactivate: 'mark inactive' };
    try {
      await persistCatalogItems(updated, true);
      bulkUndo = action === 'delete' ? null : { label: undoLabels[action], entries: undoEntries };
      selectedItems.clear();
      render();
      openEditor('itemDirectory');
      $('#itemImportStatus').className = 'customer-import-status success';
      $('#itemImportStatus').textContent = `${picked.size} item${picked.size === 1 ? '' : 's'} ${labels[action]} and saved to items.csv.`;
    } catch (error) {
      console.error('Bulk item update failed.', error);
      $('#itemImportStatus').className = 'customer-import-status error';
      $('#itemImportStatus').textContent = error.message;
    }
  }

  async function toggleItemActive(index, active) {
    const item = catalogItems[index];
    if (!item) return;
    if (!itemCsvHandle) {
      showCsvHelp('items', 'Connect the item CSV before changing an item.');
      refreshItemDirectory();
      return;
    }
    try {
      await persistCatalogItems(catalogItems.map((existing, i) => (i === index ? { ...existing, active } : existing)), true);
      render();
      refreshItemDirectory();
      $('#itemImportStatus').className = 'customer-import-status success';
      $('#itemImportStatus').textContent = `${item.name} is now ${active ? 'active' : 'inactive and hidden from the invoice item list'}.`;
    } catch (error) {
      console.error('Could not change the item status.', error);
      refreshItemDirectory();
      $('#itemImportStatus').className = 'customer-import-status error';
      $('#itemImportStatus').textContent = error.message;
    }
  }

  /* ----- item detail drawer ----- */
  function itemDetailHTML(index) {
    const item = catalogItems[index];
    const row = itemRows()[index];
    const lines = itemSalesLines(item);
    const margin = itemMargin(item);
    const notes = [];
    if (!hsnIsValid(item.hsn)) notes.push(String(item.hsn || '').trim() ? 'HSN/SAC should be 4, 6 or 8 digits.' : 'HSN/SAC is missing.');
    if (!(+item.rate > 0)) notes.push('The selling rate is ₹0.');
    if (row.duplicate) notes.push('Another item has the same or a very similar name.');
    notes.push(...itemWarnings(item));

    const history = item.history || [];
    const historyRows = history.map((entry, i) => {
      const previous = history[i - 1];
      const change = previous && previous.rate > 0 ? (entry.rate - previous.rate) / previous.rate * 100 : null;
      const changeHtml = change === null ? '<span class="text-muted">First rate</span>'
        : change === 0 ? '<span class="text-muted">No change</span>'
          : `<span class="${change > 0 ? 'text-success' : 'text-danger'}">${change > 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(1)}%</span>`;
      return `<tr><td>${entry.date ? esc(dt(entry.date)) : 'Earlier'}</td><td class="text-end">${rs(entry.rate)}</td><td class="text-end">${changeHtml}</td></tr>`;
    }).reverse().join('');

    const detail = (label, value) => `<div class="item-detail-cell"><span>${label}</span><strong>${value}</strong></div>`;
    return `
      ${notes.length ? `<div class="alert alert-warning py-2 px-3 small mb-3"><ul class="mb-0 ps-3">${notes.map(note => `<li>${esc(note)}</li>`).join('')}</ul></div>` : ''}
      <div class="item-detail-grid">
        ${detail('Selling rate', rs(item.rate))}
        ${detail('Purchase price', item.cost > 0 ? rs(item.cost) : '—')}
        ${detail('Margin', margin === null ? '—' : `<span class="${margin >= 0 ? 'text-success' : 'text-danger'}">${percentText(margin)} (${rs(item.rate - item.cost)})</span>`)}
        ${detail('GST', `${normalizeItemGst(item.gst)}%`)}
        ${detail('Unit', esc(item.unit || 'Nos'))}
        ${detail('Status', item.active === false ? 'Inactive' : 'Active')}
      </div>
      <h3 class="item-detail-heading">Sales</h3>
      <div class="item-detail-grid">
        ${detail('Invoices', String(lines.length))}
        ${detail('Quantity sold', row.sold ? `${qtyText(row.qty)} ${esc(item.unit || 'Nos')}` : '—')}
        ${detail('Revenue', row.sold ? rs(row.revenue) : '—')}
        ${detail('Last sold', row.last ? esc(dt(row.last)) : '—')}
      </div>
      <h3 class="item-detail-heading">Price history</h3>
      ${historyRows
        ? `<table class="table table-sm item-detail-table"><thead><tr><th>Date</th><th class="text-end">Rate</th><th class="text-end">Change</th></tr></thead><tbody>${historyRows}</tbody></table>`
        : '<p class="text-muted small">No rate changes recorded yet. Changes are tracked from now on when you edit the rate.</p>'}
      <h3 class="item-detail-heading">Recent invoices</h3>
      ${lines.length
        ? `<table class="table table-sm item-detail-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th class="text-end">Qty</th><th class="text-end">Amount</th></tr></thead><tbody>${lines.slice(0, 10).map(line => `<tr>
            <td>${esc(line.invoice.invoiceNo)}</td><td>${esc(line.invoice.customerName)}</td><td>${line.date ? esc(dt(line.date)) : '—'}</td>
            <td class="text-end">${qtyText(line.qty)}</td><td class="text-end">${rs(line.amount)}</td></tr>`).join('')}</tbody></table>
          ${lines.length > 10 ? `<p class="text-muted small">Showing the latest 10 of ${lines.length} invoices.</p>` : ''}`
        : '<p class="text-muted small">This item has not been billed on a saved invoice yet.</p>'}`;
  }

  let itemDetailIndex = -1;
  let itemDetailTrigger = null;

  function openItemDetail(index) {
    const item = catalogItems[index];
    if (!item) return;
    itemDetailTrigger = document.activeElement;
    itemDetailIndex = index;
    $('#itemDetailTitle').textContent = item.name;
    $('#itemDetailIntro').textContent = `HSN/SAC ${item.hsn} · ${item.unit || 'Nos'}`;
    $('#itemDetailBody').innerHTML = itemDetailHTML(index);
    const drawer = $('#itemDetailDrawer');
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    const backdrop = $('#itemDetailBackdrop');
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
  }

  function closeItemDetail() {
    const drawer = $('#itemDetailDrawer');
    if (itemDetailTrigger?.isConnected) itemDetailTrigger.focus();
    drawer.classList.remove('is-open');
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
    const backdrop = $('#itemDetailBackdrop');
    backdrop.classList.remove('is-open');
    backdrop.hidden = true;
    itemDetailTrigger = null;
    itemDetailIndex = -1;
  }

  /* ---------- invoice archive: date range + KPI cards ---------- */
  const ARCHIVE_RANGES = [
    ['all', 'All time'], ['this-month', 'This month'], ['last-month', 'Last month'],
    ['this-quarter', 'This quarter'], ['this-fy', 'This financial year'], ['custom', 'Custom range']
  ];

  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function monthBounds(offset = 0) {
    const now = new Date();
    return [isoDate(new Date(now.getFullYear(), now.getMonth() + offset, 1)), isoDate(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0))];
  }

  function archiveRangeBounds() {
    const now = new Date();
    switch (archiveRange) {
      case 'this-month': return monthBounds(0);
      case 'last-month': return monthBounds(-1);
      case 'this-quarter': {
        const q = Math.floor(now.getMonth() / 3) * 3;
        return [isoDate(new Date(now.getFullYear(), q, 1)), isoDate(new Date(now.getFullYear(), q + 3, 0))];
      }
      case 'this-fy': {
        const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        return [`${y}-04-01`, `${y + 1}-03-31`];
      }
      case 'custom': return [archiveFrom, archiveTo];
      default: return ['', ''];
    }
  }

  function inDateRange(invoice, [from, to]) {
    if (!from && !to) return true;
    const date = String(invoice.invoiceDate || '');
    if (!date) return false;
    return (!from || date >= from) && (!to || date <= to);
  }

  const invoiceKind = invoice => (invoice.status === 'draft' ? (invoice.snapshot?.docType === 'quotation' ? 'quotation' : 'draft') : invoice.status === 'quotation' ? 'quotation' : 'saved');
  const sumTotals = list => round2(list.reduce((a, invoice) => a + (+invoice.total || 0), 0));

  function invoiceArchiveFilterHTML() {
    const options = ARCHIVE_RANGES.map(([value, label]) => `<option value="${value}" ${archiveRange === value ? 'selected' : ''}>${label}</option>`).join('');
    return `<div class="archive-filter-bar">
      <label class="archive-filter-label" for="archiveRangeSelect">Period</label>
      <select class="form-select form-select-sm archive-range-select" id="archiveRangeSelect" data-archive-range>${options}</select>
      ${archiveRange === 'custom' ? `<div class="archive-custom-range">
        <input type="date" class="form-control form-control-sm" data-archive-from value="${esc(archiveFrom)}" max="${esc(archiveTo)}" aria-label="From date">
        <span>to</span>
        <input type="date" class="form-control form-control-sm" data-archive-to value="${esc(archiveTo)}" min="${esc(archiveFrom)}" aria-label="To date">
      </div>` : ''}
    </div>`;
  }

  function invoiceArchiveKpisHTML() {
    const bounds = archiveRangeBounds();
    const inRange = archivedInvoices.filter(invoice => inDateRange(invoice, bounds));
    const saved = inRange.filter(invoice => invoiceKind(invoice) === 'saved');
    const rangeLabel = (ARCHIVE_RANGES.find(([value]) => value === archiveRange) || [])[1] || 'All time';

    // This-month vs last-month always compares calendar months, independent of the selected period.
    const allSaved = archivedInvoices.filter(invoice => invoiceKind(invoice) === 'saved');
    const thisMonth = allSaved.filter(invoice => inDateRange(invoice, monthBounds(0)));
    const lastMonth = allSaved.filter(invoice => inDateRange(invoice, monthBounds(-1)));
    const thisTotal = sumTotals(thisMonth), lastTotal = sumTotals(lastMonth);
    let trend = '<span class="kpi-trend is-flat">No sales last month to compare</span>';
    if (lastTotal > 0) {
      const pct = (thisTotal - lastTotal) / lastTotal * 100;
      trend = `<span class="kpi-trend ${pct >= 0 ? 'is-up' : 'is-down'}">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}% vs last month</span>`;
    } else if (thisTotal > 0) {
      trend = '<span class="kpi-trend is-up">▲ New this month</span>';
    }

    const byCustomer = new Map();
    saved.forEach(invoice => {
      const name = String(invoice.customerName || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      const entry = byCustomer.get(key) || { name, total: 0, count: 0 };
      entry.total += +invoice.total || 0;
      entry.count += 1;
      byCustomer.set(key, entry);
    });
    const top = [...byCustomer.values()].sort((a, b) => b.total - a.total)[0];

    const card = (cls, label, value, sub, attrs = '') => `<${attrs ? 'button type="button"' : 'div'} class="kpi-card ${cls}" ${attrs}>
        <span class="kpi-label">${label}</span>
        <span class="kpi-value">${value}</span>
        <span class="kpi-sub">${sub}</span>
      </${attrs ? 'button' : 'div'}>`;

    return [
      card('kpi-blue', 'Total Invoiced', rs(sumTotals(saved)), `${saved.length} saved invoice${saved.length === 1 ? '' : 's'} · ${esc(rangeLabel)}`),
      card('kpi-green', "This Month's Sales", rs(thisTotal), `${trend}`),
      card('kpi-violet', 'Average Invoice Value', rs(saved.length ? sumTotals(saved) / saved.length : 0), saved.length ? 'Per saved invoice' : 'No saved invoices'),
      card('kpi-rose', 'Top Customer', top ? esc(top.name) : '—', top ? `${rs(top.total)} · ${top.count} invoice${top.count === 1 ? '' : 's'}` : 'No customer data yet')
    ].join('');
  }

  function refreshInvoiceArchive() {
    const set = (selector, html) => { const el = $(selector); if (el) el.innerHTML = html; };
    set('#invoiceArchiveKpis', invoiceArchiveKpisHTML());
    set('#invoiceArchiveTabs', invoiceArchiveTabsHTML());
    set('#invoiceArchiveResults', invoiceArchiveResultsHTML());
  }

  function invoiceArchiveTabsHTML() {
    const bounds = archiveRangeBounds();
    const count = status => archivedInvoices.filter(invoice => invoiceKind(invoice) === status && inDateRange(invoice, bounds)).length;
    const tab = (key, label) => `<button type="button" class="archive-tab ${archiveTab === key ? 'is-active' : ''}" role="tab" aria-selected="${archiveTab === key}" data-archive-tab="${key}">${label}<span class="archive-tab-count">${count(key)}</span></button>`;
    return `<div class="archive-tabs" role="tablist" aria-label="Invoice type">${tab('saved', 'Saved Invoices')}${tab('draft', 'Draft Invoices')}${tab('quotation', 'Quotations')}</div>`;
  }

  function invoiceArchiveHTML() {
    return `${invoiceCsvHandle ? '' : '<div class="alert alert-warning" role="status">Connect Database to load and manage saved invoices.</div>'}
      ${invoiceArchiveFilterHTML()}
      <div class="kpi-grid" id="invoiceArchiveKpis">${invoiceArchiveKpisHTML()}</div>
      <div id="invoiceArchiveTabs">${invoiceArchiveTabsHTML()}</div>
      <div class="invoice-archive-heading">
        <div>
          <strong>${archiveTab === 'draft' ? 'Draft invoices' : archiveTab === 'quotation' ? 'Quotations' : 'Saved invoices'}</strong>
          <div class="form-text">${archiveTab === 'quotation' ? 'Search by quotation number (for example QTN/25-26/001) or customer name.' : 'Search by invoice number (for example INV/25-26/0001) or customer name.'}</div>
        </div>
        <div class="customer-directory-tools">
          <label class="visually-hidden" for="invoiceArchiveSearch">Search invoices</label>
          <div class="directory-search-control invoice-archive-search-control">
            <input class="form-control form-control-sm invoice-archive-search" id="invoiceArchiveSearch" type="search" data-invoice-search value="${esc(archiveSearch)}" placeholder="Type invoice number or customer name">
            <svg class="directory-search-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"></circle><path d="m10.5 10.5 3 3"></path></svg>
          </div>
        </div>
      </div>
      <div id="invoiceArchiveStatus" class="customer-import-status" role="status" aria-live="polite"></div>
      <div id="invoiceArchiveResults">${invoiceArchiveResultsHTML()}</div>`;
  }

  const INVOICE_SORT_VALUES = {
    invoiceNo: r => String(r.invoice.invoiceNo || '').toLowerCase(),
    customerName: r => String(r.invoice.customerName || '').toLowerCase(),
    total: r => +r.invoice.total || 0,
    invoiceDate: r => String(r.invoice.invoiceDate || '')
  };

  function invoiceArchiveResultsHTML() {
    const query = archiveSearch.trim().toLowerCase();
    const bounds = archiveRangeBounds();
    const filtered = archivedInvoices.map((invoice, index) => ({ invoice, index }))
      .filter(({ invoice }) => invoiceKind(invoice) === archiveTab)
      .filter(({ invoice }) => inDateRange(invoice, bounds))
      .filter(({ invoice }) => !query
        || invoice.invoiceNo.toLowerCase().includes(query)
        || invoice.customerName.toLowerCase().includes(query));
    applyTableSort('invoice', filtered, INVOICE_SORT_VALUES);
    const pagination = directoryPagination.invoice;
    pagination.page = Math.min(pagination.page, Math.max(1, Math.ceil(filtered.length / pagination.pageSize)));
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const rows = filtered.length
      ? filtered.slice(startIndex, startIndex + pagination.pageSize).map(({ invoice, index }, position) => `<tr>
          <th scope="row" class="directory-row-number">${startIndex + position + 1}</th>
          <td class="invoice-number-cell">${displayInvoiceNo(invoice)}${invoice.status === 'quotation' && invoice.snapshot?.convertedTo ? ` <span class="badge text-bg-success" title="Converted to invoice ${esc(invoice.snapshot.convertedTo)}">Invoiced</span>` : ''}</td>
          <td>${esc(invoice.customerName)}</td>
          <td>${rs(invoice.total)}</td>
          <td class="invoice-date-cell">${esc(dt(invoice.invoiceDate))}</td>
          <td class="directory-row-actions">
            <div class="invoice-archive-actions">
              <button type="button" class="btn btn-sm btn-outline-primary" data-invoice-view="${index}">View</button>
              ${invoice.status === 'draft' ? '' : `<button type="button" class="btn btn-sm btn-outline-secondary" data-invoice-share="${index}">Share</button>`}
              <button type="button" class="btn btn-sm btn-outline-danger" data-invoice-delete="${index}">Delete</button>
            </div>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="6" class="customer-directory-empty">${query || archiveRange !== 'all' ? 'No invoices match your search or selected period.' : archiveTab === 'draft' ? 'No draft invoices yet. Use Invoice Actions, then Save as Draft on the invoice page.' : archiveTab === 'quotation' ? 'No quotations yet. Turn on the Quotation switch on the Generate Invoice page, then save.' : 'No invoices saved yet. Use Invoice Actions, then Save & Print Invoice on the invoice page.'}</td></tr>`;
    return `<div class="customer-directory-table-wrap">
      <table class="table table-sm table-striped table-hover table-bordered align-middle customer-directory-table invoice-archive-table">
        <colgroup>
          <col class="invoice-row-number-column">
          <col class="invoice-number-column">
          <col class="invoice-customer-column">
          <col class="invoice-total-column">
          <col class="invoice-date-column">
          <col class="invoice-actions-column">
        </colgroup>
        <thead class="table-light"><tr><th scope="col">#</th>${sortHeader('invoice', 'invoiceNo', archiveTab === 'quotation' ? 'Quotation No.' : 'Invoice No.')}${sortHeader('invoice', 'customerName', 'Customer Name')}${sortHeader('invoice', 'total', 'Total Amount')}${sortHeader('invoice', 'invoiceDate', archiveTab === 'quotation' ? 'Quotation Date' : 'Invoice Date')}<th scope="col">Actions</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${directoryPaginationHTML('invoice', filtered.length)}`;
  }

  async function saveCurrentInvoiceToArchive(invoiceStatus = 'saved') {
    const isQuote = isQuotation();
    const isDraftSave = invoiceStatus === 'draft';
    if (isQuote && !isDraftSave) invoiceStatus = 'quotation';   // quotations are stored in invoices.csv with their own status
    const docWord = isQuote ? 'quotation' : 'invoice';
    const status = $('#invoiceSaveStatus');
    status.textContent = '';
    status.className = 'invoice-save-status no-print';
    if (!invoiceCsvHandle) {
      showCsvHelp('all', `Connect the database, including invoices.csv, before saving a ${docWord}.`);
      return false;
    }

    // A draft is saved without a number. It is numbered later, when it is saved and printed from the draft.
    if (isDraftSave) {
      const draftId = S.draftId || newDraftId();
      const draftRecord = {
        invoiceNo: '',
        customerName: String(S.customer.name || '').trim(),
        total: calc().total,
        invoiceDate: String(S.meta.date || ''),
        status: 'draft',
        snapshot: { ...structuredClone(S), draftId, watermark: 'draft', paper: invoicePaper(), meta: { ...structuredClone(S.meta), no: '' } }   // a saved draft is stamped DRAFT automatically
      };
      const draftArchive = [...archivedInvoices];
      const draftIndex = draftArchive.findIndex(item => item.snapshot?.draftId === draftId);
      if (draftIndex >= 0) draftArchive[draftIndex] = draftRecord; else draftArchive.push(draftRecord);
      try {
        await persistInvoiceArchive(draftArchive);
        S.draftId = draftId;   // saving the same draft again updates it instead of adding another
        showInvoiceToast(`Draft ${docWord} saved. It gets its ${docWord} number when you save and print it.`);
        return true;
      } catch (error) {
        console.error('Could not save the draft.', error);
        status.classList.add('text-danger');
        status.textContent = error.message || 'Could not save this draft.';
        return false;
      }
    }

    const invoiceNo = String(S.meta.no || '').trim();
    if (!invoiceNo) {
      status.classList.add('text-danger');
      status.textContent = `Enter a ${docWord} number before saving this ${docWord}.`;
      return false;
    }
    const matchesInvoiceNo = invoice => invoice.status !== 'draft' && invoice.invoiceNo.trim().toLowerCase() === invoiceNo.toLowerCase();
    const existingIndex = archivedInvoices.findIndex(matchesInvoiceNo);
    const isOverride = existingIndex !== -1;
    const existingWasDraft = isOverride && isQuote && archivedInvoices[existingIndex].status === 'quotation';
    // Replacing a finalised (saved) invoice needs confirmation; saving a quotation over itself does not.
    if (isOverride && !existingWasDraft && !await confirmInvoiceOverride(invoiceNo, invoiceStatus)) return false;
    const record = {
      invoiceNo,
      customerName: String(S.customer.name || '').trim(),
      total: calc().total,
      invoiceDate: String(S.meta.date || ''),
      status: invoiceStatus,
      snapshot: { ...structuredClone(S), paper: invoicePaper() }
    };
    const updatedArchive = archivedInvoices.filter(invoice => !matchesInvoiceNo(invoice));
    if (isOverride) updatedArchive.splice(Math.min(existingIndex, updatedArchive.length), 0, record);
    else updatedArchive.push(record);
    if (!isQuote && invoiceStatus === 'saved' && S.quoteRef) {
      const quoteRecord = updatedArchive.find(invoice => invoice.status === 'quotation' && invoice.invoiceNo === S.quoteRef);
      if (quoteRecord) quoteRecord.snapshot = { ...quoteRecord.snapshot, convertedTo: invoiceNo };
    }
    try {
      await persistInvoiceArchive(updatedArchive);
      noteInvoiceNumberUsed(invoiceNo);
      if (isQuote) {
        showInvoiceToast(`Quotation ${invoiceNo} was saved.`);
      } else if (isOverride) {
        showInvoiceToast(`Invoice ${invoiceNo} is already saved. The previous saved invoice has been overridden.`);
      } else {
        status.classList.add('text-success');
        status.textContent = `Invoice ${invoiceNo} saved to invoices.csv.`;
      }
      return true;
    } catch (error) {
      console.error('Could not save invoice to the archive.', error);
      status.classList.add('text-danger');
      status.textContent = error.message || 'Could not save this invoice.';
      return false;
    }
  }

  function confirmInvoiceOverride(invoiceNo, status = 'saved') {
    $('#invoiceOverrideMessage').textContent = status === 'draft'
      ? `Invoice ${invoiceNo} is already saved. Saving it as a draft will replace the saved invoice with the current details and move it to the Draft tab. Continue?`
      : `Invoice ${invoiceNo} is already saved. Do you want to override the previously saved invoice with the current details?`;
    return new Promise(resolve => {
      pendingInvoiceOverrideResolve = resolve;
      bootstrap.Modal.getOrCreateInstance($('#invoiceOverrideModal')).show();
    });
  }

  function resolveInvoiceOverride(confirmed) {
    if (!pendingInvoiceOverrideResolve) return;
    const resolve = pendingInvoiceOverrideResolve;
    pendingInvoiceOverrideResolve = null;
    resolve(confirmed);
  }

  function showInvoiceToast(message) {
    const failed = /could not|couldn't|cannot|can't|failed|not valid|unable|already used|is no longer|enter /i.test(String(message));
    showToast(message, { type: failed ? 'error' : 'success' });
  }

  async function saveArchivePreviewEditsAndPrint(status = 'saved') {
    // Editing a draft, or finalising it straight from its read-only preview.
    if (!archivePreviewInvoice || (!archivePreviewEditing && archivePreviewInvoice.status !== 'draft')) return;
    if (!invoiceCsvHandle) {
      showCsvHelp('all', 'Connect the database, including invoices.csv, before saving this invoice.');
      return;
    }
    const isQuote = isQuotation();
    const finalising = archivePreviewInvoice.status === 'draft' && status === 'saved';
    const recordIndex = recordIndexOf(archivePreviewInvoice);
    if (recordIndex < 0) {
      showInvoicePreviewSaveError(`This ${isQuote ? 'quotation' : 'invoice'} is no longer in the saved list.`);
      return;
    }

    let invoiceNo = '';
    if (finalising) {
      // The draft gets the next free number and today's date only now, and goes to the end of the list.
      const today = todayISO();
      S.meta.date = today;
      if (isQuote && (!S.meta.valid || S.meta.valid < today)) S.meta.valid = addDays(today, QUOTE_VALID_DAYS);
      invoiceNo = nextInvoiceNumber(today, { quote: isQuote });
      S.meta.no = invoiceNo;
      delete S.draftId;
      if (S.watermark === 'draft') S.watermark = '';   // a finished invoice should not carry the DRAFT stamp
    } else {
      S.meta.no = '';
      S.watermark = 'draft';
      S.draftId = S.draftId || archivePreviewInvoice.snapshot?.draftId || newDraftId();
    }

    const updatedRecord = {
      invoiceNo,
      customerName: String(S.customer.name || '').trim(),
      total: calc().total,
      invoiceDate: String(S.meta.date || ''),
      status: finalising ? (isQuote ? 'quotation' : 'saved') : 'draft',
      snapshot: { ...structuredClone(S), paper: invoicePaper() }
    };
    const updatedArchive = archivedInvoices.filter((_, index) => index !== recordIndex);
    if (finalising) updatedArchive.push(updatedRecord);
    else updatedArchive.splice(recordIndex, 0, updatedRecord);
    try {
      await persistInvoiceArchive(updatedArchive);
      if (finalising) noteInvoiceNumberUsed(invoiceNo);
      archivePreviewInvoice = updatedRecord;
      updateArchivePreviewHeader(updatedRecord);
      $('#invoicePreviewSaveStatus').hidden = true;
      setArchivePreviewEditing(false);
      showInvoiceToast(finalising ? `${isQuote ? 'Quotation' : 'Invoice'} ${invoiceNo} was saved.` : `Draft ${isQuote ? 'quotation' : 'invoice'} was updated in invoices.csv.`);
      if (finalising) {
        archiveTab = isQuote ? 'quotation' : 'saved';
        printCurrentInvoice();
      }
    } catch (error) {
      console.error('Could not update the archived invoice.', error);
      showInvoicePreviewSaveError(error.message || 'Could not save this invoice.');
    }
  }

  function showInvoicePreviewSaveError(message) {
    const status = $('#invoicePreviewSaveStatus');
    status.textContent = message;
    status.hidden = false;
  }

  async function deleteArchivedInvoice(index) {
    const invoice = archivedInvoices[index];
    if (!invoice) return;
    try {
      await persistInvoiceArchive(archivedInvoices.filter((_, invoiceIndex) => invoiceIndex !== index));
      openEditor('invoiceArchive');
      $('#invoiceArchiveStatus').className = 'customer-import-status success';
      $('#invoiceArchiveStatus').textContent = `${invoiceLabel(invoice)} was deleted from invoices.csv.`;
    } catch (error) {
      console.error('Could not delete the archived invoice.', error);
      const status = $('#invoiceArchiveStatus');
      status.className = 'customer-import-status error';
      status.textContent = error.message || 'Could not delete this invoice.';
    }
  }

  function profileCsvContent(kind, profiles) {
    const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = kind === 'seller'
      ? ['name', 'gstin', 'address', 'mobile', 'email', 'state', 'logo']
      : kind === 'bank'
        ? ['bank', 'account', 'ifsc', 'branch', 'upi', 'include_invoice_total']
        : ['set_name', 'term'];
    const rows = [];
    profiles.forEach(profile => {
      if (kind === 'seller') rows.push([profile.name, profile.gstin, profile.addr, profile.mobile, profile.email, profile.state, profile.logo || '']);
      else if (kind === 'bank') rows.push([profile.bank, profile.acc, profile.ifsc, profile.branch, profile.upi, profile.qrAmt ? 'true' : 'false']);
      else profile.terms.forEach(term => rows.push([profile.profileName, term]));
    });
    return `\uFEFF${headers.join(',')}\r\n${rows.map(row => row.map(quote).join(',')).join('\r\n')}${rows.length ? '\r\n' : ''}`;
  }

  function parseProfileCsv(kind, text) {
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('The CSV file is empty.');
    const normalize = value => value.replace(/^\uFEFF/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const headers = rows[0].map(normalize);
    const column = (...aliases) => headers.findIndex(header => aliases.includes(header));
    const requiredColumn = (...aliases) => {
      const index = column(...aliases);
      if (index < 0) throw new Error(`The CSV is missing a required column: ${aliases[0]}.`);
      return index;
    };
    const optionalColumn = (...aliases) => column(...aliases);
    if (kind === 'seller') {
      const cols = {
        name: requiredColumn('name', 'businessname'), gstin: optionalColumn('gstin'),
        addr: requiredColumn('address', 'addr', 'billingaddress'), mobile: optionalColumn('mobile', 'phone'),
        email: optionalColumn('email'), state: optionalColumn('state', 'sellerstate'), logo: optionalColumn('logo', 'logourl', 'logopath')
      };
      const profiles = rows.slice(1).filter(row => row.some(value => value.trim())).map(row => normalizeProfile('seller', Object.fromEntries(
        Object.entries(cols).map(([key, index]) => [key, index < 0 ? '' : row[index] || ''])
      )));
      const invalidProfile = profiles.map(profile => validateProfile('seller', profile)).find(Boolean);
      if (invalidProfile) throw new Error(invalidProfile);
      return profiles;
    }
    if (kind === 'bank') {
      const cols = {
        bank: requiredColumn('bank', 'bankname'),
        acc: optionalColumn('account', 'accountnumber', 'acc'), ifsc: optionalColumn('ifsc'),
        branch: optionalColumn('branch'), upi: optionalColumn('upi', 'upiid'), qrAmt: optionalColumn('includeinvoicetotal', 'qramt', 'includeamount')
      };
      const profiles = rows.slice(1).filter(row => row.some(value => value.trim())).map(row => normalizeProfile('bank', Object.fromEntries(
        Object.entries(cols).map(([key, index]) => [key, index < 0 ? '' : key === 'qrAmt' ? /^(true|yes|1)$/i.test(row[index] || '') : row[index] || ''])
      )));
      const invalidProfile = profiles.map(profile => validateProfile('bank', profile)).find(Boolean);
      if (invalidProfile) throw new Error(invalidProfile);
      return profiles;
    }
    const nameColumn = requiredColumn('setname', 'profilename', 'name');
    const termColumn = requiredColumn('term', 'terms', 'condition');
    const grouped = new Map();
    rows.slice(1).forEach(row => {
      const name = String(row[nameColumn] || '').trim();
      const term = String(row[termColumn] || '').trim();
      if (!name && !term) return;
      if (!name || !term) throw new Error('Every terms CSV row needs both a set name and a term.');
      if (!grouped.has(name.toLowerCase())) grouped.set(name.toLowerCase(), { profileName: name, terms: [] });
      grouped.get(name.toLowerCase()).terms.push(term);
    });
    const profiles = [...grouped.values()].map(profile => normalizeProfile('terms', profile));
    const invalidProfile = profiles.map(profile => validateProfile('terms', profile)).find(Boolean);
    if (invalidProfile) throw new Error(invalidProfile);
    return profiles;
  }

  function profileStatus(kind) {
    return $('#profileStatus');
  }

  function profileDirectoryHTML(kind) {
    const profiles = profileList(kind);
    const pagination = directoryPagination[kind];
    pagination.page = Math.min(pagination.page, Math.max(1, Math.ceil(profiles.length / pagination.pageSize)));
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const fields = profileFields(kind);
    const activeIndex = activeProfileIndex(kind);
    const filename = `${kind}.csv`;
    const title = kind === 'seller' ? 'seller profile' : kind === 'bank' ? 'bank profile' : 'terms set';
    const plural = kind === 'seller' ? 'seller profiles' : kind === 'bank' ? 'bank profiles' : 'terms sets';
    const options = fields;
    const fieldInput = ([key, label, type, required], value = '', editing = false) => {
      const attrs = `${required ? 'required' : ''} aria-label="${esc(label)}"`;
      const placeholders = {
        name: 'Enter business name',
        gstin: 'Enter GSTIN (optional)',
        addr: 'Enter business address',
        mobile: 'Enter mobile number',
        email: 'Enter email address',
        bank: 'Enter bank name',
        acc: 'Enter account number',
        ifsc: 'Enter IFSC code',
        branch: 'Enter bank branch',
        upi: 'Enter UPI ID',
        profileName: 'Enter a name for this set',
        terms: 'Enter one term or condition per line'
      };
      if (type === 'checkbox') return `<input class="form-check-input" type="checkbox" name="${key}" ${value ? 'checked' : ''} ${editing ? `data-profile-edit-field="${key}"` : ''} ${attrs}>`;
      if (type === 'textarea') return `<textarea class="form-control" name="${key}" rows="3" placeholder="${placeholders[key]}" ${editing ? `data-profile-edit-field="${key}"` : ''} ${attrs}>${esc(Array.isArray(value) ? value.join('\n') : value)}</textarea>`;
      if (type === 'state') return `<select class="form-select form-select-sm" name="${key}" ${editing ? `data-profile-edit-field="${key}"` : ''} ${attrs}>${stateOpts(value)}</select>`;
      if (type === 'file') return `<input class="form-control form-control-sm" type="file" accept="image/*" name="${key}" title="Choose an image file" ${editing ? `data-profile-edit-field="${key}"` : ''} ${attrs}>${editing && value ? '<small class="form-text">Current image kept unless replaced.</small>' : ''}`;
      return `<input class="form-control form-control-sm" type="${type}" name="${key}" value="${esc(value)}" placeholder="${placeholders[key] || `Enter ${label.toLowerCase()}`}" ${editing ? `data-profile-edit-field="${key}"` : ''} ${attrs}>`;
    };
    const renderRow = (profile, index) => {
      const cells = kind === 'seller'
        ? `<td>${esc(profile.name)}</td><td>${esc(profile.gstin)}</td><td>${esc(profile.addr)}</td><td>${esc(profile.mobile)}</td><td>${esc(profile.email)}</td><td>${esc(profile.state)}</td><td>${profile.logo ? 'Set' : ''}</td>`
        : kind === 'bank'
          ? `<td>${esc(profile.bank)}</td><td>${esc(profile.acc)}</td><td>${esc(profile.ifsc)}</td><td>${esc(profile.branch)}</td><td>${esc(profile.upi)}</td><td>${profile.qrAmt ? 'Yes' : 'No'}</td>`
          : `<td>${esc(profile.profileName)}</td><td colspan="2">${profile.terms.map((term, termIndex) => `${termIndex + 1}. ${esc(term)}`).join('<br>')}</td>`;
      return `<tr class="${activeIndex === index ? 'profile-active-row' : ''}"><th scope="row" class="directory-row-number">${index + 1}</th>${cells}<td class="directory-row-actions">
        <button type="button" class="btn btn-sm btn-outline-primary" data-profile-activate="${kind}:${index}" ${activeIndex === index ? 'disabled' : ''}>${activeIndex === index ? 'Active' : 'Use'}</button><button type="button" class="btn btn-sm btn-outline-secondary" data-profile-edit="${kind}:${index}">Edit</button><button type="button" class="btn btn-sm btn-outline-danger" data-profile-delete="${kind}:${index}">Delete</button>
      </td></tr>`;
    };
    const sh = (key, label) => sortHeader(kind, key, label);
    const columns = kind === 'seller'
      ? `<th scope="col">#</th>${sh('name', 'Business name')}${sh('gstin', 'GSTIN')}${sh('addr', 'Address')}${sh('mobile', 'Mobile')}${sh('email', 'Email')}${sh('state', 'State')}${sh('logo', 'Logo')}<th>Actions</th>`
      : kind === 'bank'
        ? `<th scope="col">#</th>${sh('bank', 'Bank')}${sh('acc', 'Account')}${sh('ifsc', 'IFSC')}${sh('branch', 'Branch')}${sh('upi', 'UPI ID')}${sh('qrAmt', 'QR total')}<th>Actions</th>`
        : `<th scope="col">#</th>${sh('profileName', 'Set name')}<th colspan="2">Terms</th><th>Actions</th>`;
    const rowSpan = kind === 'bank' ? 8 : kind === 'seller' ? 9 : 5;
    const text = key => entry => String(entry.profile[key] || '').toLowerCase();
    const sortValues = kind === 'seller'
      ? { name: text('name'), gstin: text('gstin'), addr: text('addr'), mobile: text('mobile'), email: text('email'), state: text('state'), logo: entry => (entry.profile.logo ? 1 : 0) }
      : kind === 'bank'
        ? { bank: text('bank'), acc: text('acc'), ifsc: text('ifsc'), branch: text('branch'), upi: text('upi'), qrAmt: entry => (entry.profile.qrAmt ? 1 : 0) }
        : { profileName: text('profileName') };
    const sortedProfiles = applyTableSort(kind, profiles.map((profile, index) => ({ profile, index })), sortValues);
    const rows = profiles.length
      ? sortedProfiles.slice(startIndex, startIndex + pagination.pageSize).map(({ profile, index }) => renderRow(profile, index)).join('')
      : `<tr><td colspan="${rowSpan}" class="customer-directory-empty">No ${plural} saved yet.</td></tr>`;
    return `
      <div class="customer-import-controls">
        <div class="customer-import-heading">
          <div><strong>Import ${plural} from another CSV</strong><div class="form-text">${kind === 'terms' ? 'Required columns: set_name, term (one row per term).' : kind === 'seller' ? 'Required columns: name and address. Optional: GSTIN, mobile, email, state, logo.' : 'Required column: bank. Account, IFSC, branch, UPI, and QR option are optional. The bank name identifies each profile.'}</div></div>
          <button class="btn btn-sm btn-outline-secondary" type="button" data-profile-template="${kind}">Download CSV template</button>
        </div>
        <label class="visually-hidden" for="profileCsvFile">Choose a CSV file</label>
        <input class="form-control" type="file" id="profileCsvFile" accept=".csv,text/csv" data-profile-import="${kind}" title="Choose a CSV file to import">
      </div>
      <div class="customer-import-status" id="profileStatus" role="status" aria-live="polite"></div>
      <form id="profileAddForm" class="customer-add-form profile-add-form" data-profile-form="${kind}">
        <div class="customer-directory-heading"><strong>Add a ${esc(title)}</strong></div>
        <div class="profile-add-grid ${kind === 'terms' ? 'terms-profile-grid' : ''}">
          ${options.map(field => `<label class="customer-field">${esc(field[1])}${fieldInput(field, kind === 'terms' && field[0] === 'terms' ? [] : '', false)}</label>`).join('')}
          <div class="customer-add-action"><button type="submit" class="btn btn-primary">Add ${esc(kind === 'terms' ? 'Set' : kind === 'seller' ? 'Seller Profile' : 'Bank Profile')}</button></div>
        </div>
      </form>
      <div class="customer-directory-heading"><strong>Saved ${esc(plural)}</strong></div>
      <div class="customer-directory-table-wrap profile-table-wrap">
        <table class="table table-sm table-striped table-hover table-bordered align-middle customer-directory-table profile-directory-table profile-${kind}-table">
          <thead class="table-light"><tr>${columns}</tr></thead><tbody>${rows}</tbody>
        </table>
      </div>
      ${directoryPaginationHTML(kind, profiles.length)}`;
  }

  async function persistProfiles(kind, profiles, requireFile = true) {
    const handle = profileCsvHandles[kind];
    if (requireFile && !handle) throw new Error(`Choose csv\\${kind}.csv before saving changes.`);
    const previousProfiles = profileList(kind);
    if (!saveProfiles(kind, profiles)) throw new Error(`Could not save ${kind} profiles in browser storage.`);
    if (kind === 'seller') sellerProfiles = profiles;
    else if (kind === 'bank') bankProfiles = profiles;
    else termsProfiles = profiles;
    try {
      if (handle) {
        const writable = await handle.createWritable();
        try {
          await writable.write(profileCsvContent(kind, kind === 'seller' ? await externalizeSellerProfiles(profiles) : profiles));
          await writable.close();
        } catch (error) {
          try { await writable.abort(); } catch (abortError) { console.warn(`Could not abort the failed ${kind} CSV write.`, abortError); }
          throw error;
        }
      }
    } catch (error) {
      if (kind === 'seller') sellerProfiles = previousProfiles;
      else if (kind === 'bank') bankProfiles = previousProfiles;
      else termsProfiles = previousProfiles;
      if (!saveProfiles(kind, previousProfiles)) console.error(`Could not restore ${kind} profiles after a CSV write failure.`);
      throw new Error(`Could not update ${kind}.csv: ${error.message}`);
    }
  }

  async function connectProfileCsv(kind, providedHandle = null, navigate = true) {
    try {
      const handle = providedHandle || await pickConnectedCsvFile(kind);
      const expectedName = `${kind}.csv`;
      const fileProfiles = parseProfileCsv(kind, await (await handle.getFile()).text());
      const merged = [...fileProfiles];
      const seen = new Set(merged.map(profile => profileIdentity(kind, profile)));
      profileList(kind).forEach(profile => {
        const key = profileIdentity(kind, profile);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(profile);
        }
      });
      const previousHandle = profileCsvHandles[kind];
      profileCsvHandles[kind] = handle;
      try {
        await persistProfiles(kind, merged, false);
      } catch (error) {
        profileCsvHandles[kind] = previousHandle;
        throw error;
      }
      directoryPagination[kind].page = 1;
      if (navigate) {
        openEditor(kind === 'terms' ? 'terms' : kind);
        profileStatus(kind).className = 'customer-import-status success';
        profileStatus(kind).textContent = `${expectedName} connected. ${pluralizeProfiles(kind, merged.length)} are saved in the file.`;
      }
      return true;
    } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error(`Could not connect ${kind}.csv.`, error);
      if (navigate) showCsvHelp(kind, error.message || `Could not connect ${kind}.csv.`);
      else throw error;
      return false;
    }
  }

  function pluralizeProfiles(kind, count) {
    const label = kind === 'seller' ? 'seller profile' : kind === 'bank' ? 'bank profile' : 'terms set';
    return `${count} ${label}${count === 1 ? '' : 's'}`;
  }

  async function importProfileCsv(kind, file) {
    const status = profileStatus(kind);
    if (!file) return;
    try {
      if (!profileCsvHandles[kind]) {
        showCsvHelp(kind, `Connect the CSV file before importing ${CSV_FILE_LABELS[kind]}.`);
        return;
      }
      const additions = parseProfileCsv(kind, await file.text());
      const seen = new Set(profileList(kind).map(profile => profileIdentity(kind, profile)));
      const uniqueAdditions = additions.filter(profile => {
        const key = profileIdentity(kind, profile);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (!uniqueAdditions.length) throw new Error('No new profiles to add. All valid CSV entries already exist.');
      await persistProfiles(kind, [...profileList(kind), ...uniqueAdditions]);
      directoryPagination[kind].page = Math.ceil(profileList(kind).length / directoryPagination[kind].pageSize);
      openEditor(kind === 'terms' ? 'terms' : kind);
      profileStatus(kind).className = 'customer-import-status success';
      profileStatus(kind).textContent = `${uniqueAdditions.length} ${kind === 'terms' ? 'terms set(s)' : `${kind} profile(s)`} imported and saved.`;
    } catch (error) {
      console.error(`Could not import ${kind} CSV.`, error);
      status.className = 'customer-import-status error';
      status.textContent = error.message || `Could not read ${kind}.csv.`;
    }
  }

  function downloadProfileTemplate(kind) {
    const url = URL.createObjectURL(new Blob([profileCsvContent(kind, [])], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kind}-template.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Reads a logo or signature image and shrinks it (longest side 500 px) so it stays small in the browser and in every saved invoice.
  const IMAGE_MAX_FILE_BYTES = 10 * 1024 * 1024;
  const IMAGE_MAX_SIDE = 500;
  function readFileDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//i.test(file.type || '')) { reject(new Error('Please choose an image file (PNG, JPG, WebP or GIF).')); return; }
      if (file.size > IMAGE_MAX_FILE_BYTES) { reject(new Error('That image is larger than 10 MB. Please choose a smaller one.')); return; }
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
          const width = Math.max(1, Math.round((image.naturalWidth || IMAGE_MAX_SIDE) * scale));
          const height = Math.max(1, Math.round((image.naturalHeight || IMAGE_MAX_SIDE) * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(image, 0, 0, width, height);
          const keepsTransparency = /png|gif|webp|svg/i.test(file.type);
          resolve(keepsTransparency ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.88));
        } catch (error) {
          reject(new Error('Could not process that image.'));
        }
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as an image.')); };
      image.src = url;
    });
  }

  async function readProfileForm(kind, form) {
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    profileFields(kind).forEach(([key, , type]) => {
      if (type === 'checkbox') values[key] = form.elements.namedItem(key).checked;
    });
    if (kind === 'seller') {
      const logo = form.elements.namedItem('logo').files[0];
      values.logo = logo ? await readFileDataUrl(logo) : '';
    }
    return normalizeProfile(kind, values);
  }

  function validateProfile(kind, profile) {
    if (kind === 'seller') {
      if (!profile.name || !profile.addr) return 'Business name and address are required.';
      if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return 'Enter a valid business email address.';
      if (profile.gstin && !GST_RE.test(profile.gstin.toUpperCase())) return 'Enter a valid GSTIN or leave it blank.';
    } else if (kind === 'bank') {
      if (!profile.bank) return 'Bank name is required.';
      if (profile.ifsc && !IFSC_RE.test(profile.ifsc.toUpperCase())) return 'Enter a valid IFSC code or leave it blank.';
    } else if (!profile.profileName || !profile.terms.length) return 'Set name and at least one term are required.';
    return '';
  }

  async function syncCurrentProfile(kind, profile) {
    const normalized = normalizeProfile(kind, profile);
    if (kind === 'bank' && !normalized.bank) return;
    if (kind === 'terms' && !normalized.terms.length) return;
    const profiles = profileList(kind);
    const activeIndex = activeProfileIndex(kind);
    const duplicateIndex = profiles.findIndex(item => profileIdentity(kind, item) === profileIdentity(kind, normalized));
    const targetIndex = activeIndex >= 0 ? activeIndex : duplicateIndex;
    const updated = targetIndex >= 0
      ? profiles.map((item, index) => index === targetIndex ? normalized : item)
      : [...profiles, normalized];
    await persistProfiles(kind, updated, false);
  }

  async function syncSetupProfiles() {
    await syncCurrentProfile('seller', S.seller);
    const hasBankDetails = [S.bank.bank, S.bank.acc, S.bank.ifsc, S.bank.branch, S.bank.upi].some(value => String(value || '').trim())
      || S.bank.qrAmt;
    if (hasBankDetails) {
      await syncCurrentProfile('bank', S.bank);
    }
    await syncCurrentProfile('terms', { profileName: 'Default terms', terms: S.terms.list });
  }

  async function saveProfileForm(kind, form) {
    const status = profileStatus(kind);
    if (!profileCsvHandles[kind]) {
      showCsvHelp(kind, `Connect the CSV file before adding ${kind === 'terms' ? 'a terms set' : `a ${kind} profile`}.`);
      return;
    }
    let profile;
    try {
      profile = await readProfileForm(kind, form);
    } catch (error) {
      status.className = 'customer-import-status error';
      status.textContent = error.message || 'Could not read the selected logo.';
      return;
    }
    const errorMessage = validateProfile(kind, profile);
    if (errorMessage) {
      status.className = 'customer-import-status error';
      status.textContent = errorMessage;
      return;
    }
    const duplicateKey = profileIdentity(kind, profile);
    if (profileList(kind).some(existing => profileIdentity(kind, existing) === duplicateKey)) {
      status.className = 'customer-import-status error';
      status.textContent = `This ${kind} profile already exists.`;
      return;
    }
    const previousProfiles = profileList(kind);
    const previousCurrent = structuredClone(profileCurrent(kind));
    try {
      await persistProfiles(kind, [...previousProfiles, profile]);
      directoryPagination[kind].page = Math.ceil(profileList(kind).length / directoryPagination[kind].pageSize);
      applyProfile(kind, profile);
      if (!save()) throw new Error('Profile added, but the active invoice selection could not be saved.');
      openEditor(kind === 'terms' ? 'terms' : kind);
      profileStatus(kind).className = 'customer-import-status success';
      profileStatus(kind).textContent = `Profile added and set as active.`;
      render();
    } catch (error) {
      applyProfile(kind, previousCurrent);
      if (profileList(kind) !== previousProfiles) {
        try { await persistProfiles(kind, previousProfiles, false); }
        catch (rollbackError) { console.error(`Could not restore ${kind} profiles after a save failure.`, rollbackError); }
      }
      console.error(`Could not save ${kind} profile.`, error);
      status.className = 'customer-import-status error';
      status.textContent = error.message;
    }
  }

  async function saveProfileEdit(kind, index) {
    if (!profileCsvHandles[kind]) {
      showCsvHelp(kind, `Connect the CSV file before saving ${kind} profile edits.`);
      return;
    }
    const form = $('#directoryDrawerForm');
    const status = profileStatus(kind);
    const current = profileList(kind)[index];
    if (!current) return;
    const values = { ...current };
    for (const [key, , type] of profileFields(kind)) {
      const input = form.elements.namedItem(key);
      if (!input) continue;
      if (type === 'checkbox') values[key] = input.checked;
      else if (type === 'file') {
        if (input.files[0]) {
          try { values[key] = await readFileDataUrl(input.files[0]); }
          catch (error) {
            $('#directoryDrawerError').textContent = error.message || 'Could not read the selected logo.';
            $('#directoryDrawerError').hidden = false;
            return;
          }
        }
      } else values[key] = input.value;
    }
    const profile = normalizeProfile(kind, values);
    const errorMessage = validateProfile(kind, profile);
    if (errorMessage) {
      $('#directoryDrawerError').textContent = errorMessage;
      $('#directoryDrawerError').hidden = false;
      return;
    }
    if (profileList(kind).some((existing, existingIndex) => existingIndex !== index
      && profileIdentity(kind, existing) === profileIdentity(kind, profile))) {
      $('#directoryDrawerError').textContent = `This ${kind} profile already exists.`;
      $('#directoryDrawerError').hidden = false;
      return;
    }
    const wasActive = profileMatchesCurrent(kind, current);
    const previousProfiles = profileList(kind);
    const previousCurrent = structuredClone(profileCurrent(kind));
    const updated = previousProfiles.map((item, itemIndex) => itemIndex === index ? profile : item);
    try {
      await persistProfiles(kind, updated);
      if (wasActive) applyProfile(kind, profile);
      if (!save()) throw new Error('Profile updated, but the active invoice selection could not be saved.');
      closeDirectoryDrawer();
      render();
      openEditor(kind === 'terms' ? 'terms' : kind);
      profileStatus(kind).className = 'customer-import-status success';
      profileStatus(kind).textContent = 'Profile updated.';
    } catch (error) {
      if (wasActive) applyProfile(kind, previousCurrent);
      if (profileList(kind) !== previousProfiles) {
        try { await persistProfiles(kind, previousProfiles, false); }
        catch (rollbackError) { console.error(`Could not restore ${kind} profiles after an edit failure.`, rollbackError); }
      }
      console.error(`Could not update ${kind} profile.`, error);
      $('#directoryDrawerError').textContent = error.message;
      $('#directoryDrawerError').hidden = false;
      status.className = 'customer-import-status error';
      status.textContent = error.message;
    }
  }

  async function deleteProfile(kind, index) {
    if (!profileCsvHandles[kind]) {
      showCsvHelp(kind, `Connect the CSV file before deleting ${kind === 'terms' ? 'a terms set' : `a ${kind} profile`}.`);
      return;
    }
    try {
      await persistProfiles(kind, profileList(kind).filter((_, profileIndex) => profileIndex !== index));
      openEditor(kind === 'terms' ? 'terms' : kind);
      profileStatus(kind).className = 'customer-import-status success';
      profileStatus(kind).textContent = 'Profile deleted. Current invoice details are unchanged.';
    } catch (error) {
      console.error(`Could not delete ${kind} profile.`, error);
      const status = profileStatus(kind);
      status.className = 'customer-import-status error';
      status.textContent = error.message;
    }
  }

  function activateProfile(kind, index) {
    const profile = profileList(kind)[index];
    if (!profile) return;
    const previousCurrent = structuredClone(profileCurrent(kind));
    applyProfile(kind, profile);
    if (!save()) {
      applyProfile(kind, previousCurrent);
      const status = profileStatus(kind);
      status.className = 'customer-import-status error';
      status.textContent = 'The active profile could not be saved in browser storage.';
      return;
    }
    render();
    openEditor(kind === 'terms' ? 'terms' : kind);
    profileStatus(kind).className = 'customer-import-status success';
    profileStatus(kind).textContent = `${profileTitle(kind, profile)} is now active for this invoice.`;
  }

  async function connectItemCsv(providedHandle = null, navigate = true) {
    try {
      const handle = providedHandle || await pickConnectedCsvFile('items');

      const { items: fileItems } = parseItemCsv(await (await handle.getFile()).text());
      const mergedItems = [...fileItems];
      const seen = new Set(mergedItems.map(itemDuplicateKey));
      catalogItems.forEach(item => {
        const key = itemDuplicateKey(item);
        if (!seen.has(key)) {
          seen.add(key);
          mergedItems.push(item);
        }
      });
      const previousItems = catalogItems;
      const previousHandle = itemCsvHandle;
      if (!saveCatalogItems(mergedItems)) throw new Error('Could not save item details in browser storage.');
      catalogItems = mergedItems;
      itemCsvHandle = handle;
      try {
        await writeItemCsvFile(handle, mergedItems);
      } catch (error) {
        catalogItems = previousItems;
        itemCsvHandle = previousHandle;
        if (!saveCatalogItems(previousItems)) console.error('Could not restore the catalog after a CSV connection failure.');
        throw error;
      }
      if (navigate) {
        render();
        openEditor('itemDirectory');
        const result = $('#itemImportStatus');
        result.classList.add('success');
        result.textContent = 'items.csv is connected. Item changes will update this file directly.';
      }
      return true;
    } catch (error) {
      if (error.name === 'AbortError') return false;
      console.error('Could not connect items.csv.', error);
      if (navigate) showCsvHelp('items', error.message || 'Could not connect items.csv.');
      else throw error;
      return false;
    }
  }

  async function connectAllCsvs(directoryHandle = null, {
    requestPermission = true,
    showPicker = true,
    showErrors = true,
    rememberDirectory = true
  } = {}) {
    let handles;
    const createdFiles = [];
    const pickedByUser = !directoryHandle;   // only a folder chosen just now may get missing files created (never a remembered folder)
    try {
      if (!directoryHandle) {
        if (!showPicker || typeof window.showDirectoryPicker !== 'function') {
          throw new Error('Choose the csv folder again using Connect Database.');
        }
        directoryHandle = await window.showDirectoryPicker({
          id: 'invoice-all-csv-folder',
          mode: 'readwrite'
        });
      }
      let permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted' && requestPermission) {
        permission = await directoryHandle.requestPermission({ mode: 'readwrite' });
      }
      if (permission !== 'granted') throw new Error('Write permission was not granted for the selected csv folder.');

      handles = {};
      if (pickedByUser) {
        // A new, empty folder is fine: the app creates the data files itself. Ask first if the folder has none of them yet.
        const missing = [];
        for (const kind of CSV_FILES) {
          try { await directoryHandle.getFileHandle(`${kind}.csv`); } catch (error) {
            if (error.name !== 'NotFoundError') throw error;
            missing.push(kind);
          }
        }
        if (missing.length === CSV_FILES.length && !confirm(`The folder “${directoryHandle.name}” has no InvoiceGen data yet.

Set it up as your new data folder? Six empty data files (customers, items, seller, bank, terms, invoices) will be created in it.

Choose Cancel if this is the wrong folder.`)) return;
        for (const kind of missing) {
          const created = await directoryHandle.getFileHandle(`${kind}.csv`, { create: true });
          const writable = await created.createWritable();
          try {
            await writable.write(emptyCsvContent(kind));
            await writable.close();
          } catch (error) {
            try { await writable.abort(); } catch { /* already closed */ }
            throw error;
          }
          createdFiles.push(`${kind}.csv`);
        }
      }
      for (const kind of CSV_FILES) {
        const filename = `${kind}.csv`;
        let handle;
        try {
          handle = await directoryHandle.getFileHandle(filename);
        } catch (error) {
          if (error.name === 'NotFoundError') {
            throw new Error(`The selected csv folder is missing ${filename}. Choose a folder that has all six data files, or an empty folder to start fresh.`);
          }
          throw error;
        }
        let filePermission = await handle.queryPermission({ mode: 'readwrite' });
        if (filePermission !== 'granted' && requestPermission) {
          filePermission = await handle.requestPermission({ mode: 'readwrite' });
        }
        if (filePermission !== 'granted') throw new Error(`Write permission was not granted for ${filename}.`);
        const contents = await (await handle.getFile()).text();
        if (kind === 'customers') parseCustomerCsv(contents);
        else if (kind === 'items') parseItemCsv(contents);
        else if (kind === 'invoices') parseInvoiceArchive(contents);
        else parseProfileCsv(kind, contents);
        handles[kind] = handle;
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Could not prepare the app CSV files.', error);
      csvConnectionNotice = error.message || 'Could not access all required CSV files in the selected folder.';
      refreshCsvConnectionStatus();
      if (showErrors) showCsvHelp('all', csvConnectionNotice);
      return false;
    }

    const connectors = {
      customers: () => connectCustomerCsv(handles.customers, false),
      items: () => connectItemCsv(handles.items, false),
      seller: () => connectProfileCsv('seller', handles.seller, false),
      bank: () => connectProfileCsv('bank', handles.bank, false),
      terms: () => connectProfileCsv('terms', handles.terms, false),
      invoices: () => connectInvoiceCsv(handles.invoices)
    };
    const failures = [];
    for (const kind of CSV_FILES) {
      try {
        if (!await connectors[kind]()) failures.push(`${kind}.csv`);
      } catch (error) {
        console.error(`Could not connect ${kind}.csv.`, error);
        failures.push(`${kind}.csv (${error.message || 'connection failed'})`);
      }
    }

    refreshCsvConnectionStatus();
    if (failures.length) {
      csvConnectionNotice = `Could not connect: ${failures.join(', ')}. Correct the file or permissions and try again.`;
      refreshCsvConnectionStatus();
      if (showErrors) showCsvHelp('all', csvConnectionNotice);
      return false;
    }
    const folderNotes = await onFolderConnected(directoryHandle);   // pictures folder, one-time clean-up, app-settings.json
    csvConnectionNotice = '';
    if (rememberDirectory) {
      try {
        await saveCsvDirectory(directoryHandle);
      } catch (error) {
        console.error('CSV files are connected, but the folder could not be remembered.', error);
        csvConnectionNotice = 'Connected for this session, but this browser could not remember the folder. It may need to be selected again after refresh.';
      }
    }
    refreshCsvConnectionStatus();
    bootstrap.Modal.getOrCreateInstance($('#csvHelpModal')).hide();
    render();
    if (edSec === 'invoiceArchive' && !$('#dashboardPage').hidden) openEditor('invoiceArchive');
    if (createdFiles.length) showToast(`New data folder ready: created ${createdFiles.join(', ')}. Start with Business & Invoice Setup.`, { type: 'success', duration: 9000 });
    folderNotes.forEach(note => showToast(note, { type: 'info' }));
    return true;
  }

  // The content of a brand-new data file: just the header row.
  function emptyCsvContent(kind) {
    if (kind === 'customers') return customerCsvContent([]);
    if (kind === 'items') return itemCsvContent([]);
    if (kind === 'invoices') return invoiceArchiveCsv([]);
    return profileCsvContent(kind, []);
  }

  async function restoreCsvConnection() {
    try {
      const directoryHandle = await withTimeout(getSavedCsvDirectory(), 4000, null);
      if (!directoryHandle) return;
      const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        csvConnectionNotice = 'The saved CSV folder needs permission again. Use “Connect Database” to reconnect.';
        refreshCsvConnectionStatus();
        return;
      }
      await connectAllCsvs(directoryHandle, {
        requestPermission: false,
        showPicker: false,
        showErrors: false,
        rememberDirectory: false
      });
    } catch (error) {
      console.error('Could not restore the saved CSV connection.', error);
      csvConnectionNotice = 'The saved CSV folder could not be restored. Use “Connect Database” to reconnect.';
      refreshCsvConnectionStatus();
    }
  }

  function downloadItemCsvTemplate() {
    const url = URL.createObjectURL(new Blob([itemCsvContent([])], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'items-template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importItemCsv(file) {
    const status = $('#itemImportStatus');
    if (!file) return;
    status.className = 'customer-import-status';
    status.textContent = '';
    try {
      if (!itemCsvHandle) {
        showCsvHelp('items', 'Connect the CSV file before importing items.');
        return;
      }
      if (!/\.csv$/i.test(file.name)) throw new Error('Choose a CSV file.');
      const { items, invalidRows } = parseItemCsv(await file.text());
      const seen = new Set(itemOptions().map(itemDuplicateKey));
      const additions = items.filter(item => {
        const key = itemDuplicateKey(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (!additions.length) {
        status.classList.add('error');
        status.textContent = `No new items to add. ${invalidRows ? `${invalidRows} invalid row(s) skipped.` : 'All valid rows were already in the catalog.'}`;
        return;
      }
      await persistCatalogItems([...additions, ...catalogItems], true);
      selectedItems.clear();
      tableSort.item.key = null;
      itemFilter = 'all';
      directorySearch.item = '';
      directoryPagination.item.page = 1;
      render();
      openEditor('itemDirectory');
      const result = $('#itemImportStatus');
      result.classList.add('success');
      result.textContent = `${additions.length} item(s) imported and saved to items.csv. ${items.length - additions.length} duplicate(s) skipped.${invalidRows ? ` ${invalidRows} invalid row(s) skipped.` : ''}`;
    } catch (error) {
      console.error('Could not import item CSV.', error);
      status.classList.add('error');
      status.textContent = error.message || 'Could not read the item CSV file.';
    }
  }

  async function addCatalogItem(form) {
    const formData = new FormData(form);
    const rate = Number(formData.get('rate'));
    const item = normalizeItem({
      name: formData.get('name'),
      hsn: formData.get('hsn'),
      rate,
      cost: formData.get('cost') || 0,
      stock: formData.get('stock'),
      wholesaleRate: formData.get('wholesaleRate'),
      unit: formData.get('unit'),
      gst: formData.get('gst'),
      history: [{ date: isoDate(new Date()), rate }]
    });
    const status = $('#itemImportStatus');
    status.className = 'customer-import-status';
    status.textContent = '';
    if (!itemCsvHandle) {
      showCsvHelp('items', 'Connect the CSV file before adding an item.');
      return;
    }
    const validationError = itemValidationError(item, String(formData.get('rate') || ''));
    if (validationError) {
      status.classList.add('error');
      status.textContent = validationError;
      return;
    }
    if (new Set(itemOptions().map(itemDuplicateKey)).has(itemDuplicateKey(item))) {
      status.classList.add('error');
      status.textContent = 'This item is already in the item list.';
      return;
    }
    const duplicateWarning = duplicateWarningFor(item);
    if (duplicateWarning) {
      status.classList.add('error');
      status.textContent = duplicateWarning;
      return;
    }
    try {
      // New items go to the top of the list; clear sort/filter/search so the new item is visible there.
      await persistCatalogItems([item, ...catalogItems], true);
      duplicateAcknowledged = '';
      selectedItems.clear();
      tableSort.item.key = null;
      itemFilter = 'all';
      directorySearch.item = '';
      directoryPagination.item.page = 1;
      render();
      openEditor('itemDirectory');
      const result = $('#itemImportStatus');
      result.classList.add('success');
      result.textContent = ['Item saved to items.csv.', ...itemWarnings(item)].join(' ');
    } catch (error) {
      console.error('Could not save catalog item.', error);
      status.classList.add('error');
      status.textContent = error.message;
    }
  }

  async function removeCatalogItem(index) {
    if (!itemCsvHandle) {
      showCsvHelp('items', 'Connect the item CSV before removing an item.');
      return;
    }
    const status = $('#itemImportStatus');
    try {
      await persistCatalogItems(catalogItems.filter((_, itemIndex) => itemIndex !== index), true);
      selectedItems.clear();
      render();
      openEditor('itemDirectory');
    } catch (error) {
      console.error('Could not remove catalog item.', error);
      status.className = 'customer-import-status error';
      status.textContent = error.message;
    }
  }

  async function saveCatalogItemEdit(index) {
    const form = $('#directoryDrawerForm');
    if (!itemCsvHandle) {
      showCsvHelp('items', 'Connect the item CSV before saving item edits.');
      return;
    }
    const status = $('#itemImportStatus');
    const field = key => String(new FormData(form).get(key) || '').trim();
    const rateValue = field('rate');
    const previous = catalogItems[index];
    const newRate = Number(rateValue);
    // Price history: keep every rate the item has had; log a new entry only when the rate changes.
    let history = [...(previous?.history || [])];
    if (previous && Number.isFinite(newRate) && newRate !== previous.rate) {
      if (!history.length) history.push({ date: '', rate: previous.rate });
      history.push({ date: isoDate(new Date()), rate: newRate });
    }
    const item = normalizeItem({
      name: field('name'),
      hsn: field('hsn'),
      rate: newRate,
      cost: field('cost') || 0,
      stock: field('stock'),
      wholesaleRate: field('wholesaleRate'),
      unit: field('unit'),
      gst: field('gst'),
      active: previous?.active !== false,
      history
    });
    const showDrawerError = message => {
      $('#directoryDrawerError').textContent = message;
      $('#directoryDrawerError').hidden = false;
    };
    const validationError = itemValidationError(item, rateValue);
    if (validationError) {
      showDrawerError(validationError);
      return;
    }
    const key = itemDuplicateKey(item);
    if (itemOptions().some((existing, existingIndex) =>
      !(existingIndex === DEMO_ITEMS.length + index) && itemDuplicateKey(existing) === key)) {
      showDrawerError('An item with the same name and HSN/SAC already exists.');
      return;
    }
    const duplicateWarning = duplicateWarningFor(item, index);
    if (duplicateWarning) {
      showDrawerError(duplicateWarning.replace('Press the button again', 'Press Save changes again'));
      return;
    }
    const updatedItems = catalogItems.map((existing, itemIndex) => itemIndex === index ? item : existing);
    try {
      await persistCatalogItems(updatedItems, true);
      duplicateAcknowledged = '';
      directoryPagination.item.page = Math.min(
        directoryPagination.item.page,
        Math.max(1, Math.ceil(updatedItems.length / directoryPagination.item.pageSize))
      );
      closeDirectoryDrawer();
      render();
      openEditor('itemDirectory');
      $('#itemImportStatus').className = 'customer-import-status success';
      $('#itemImportStatus').textContent = ['Item details updated in items.csv.', ...itemWarnings(item)].join(' ');
    } catch (error) {
      console.error('Could not update item details.', error);
      $('#directoryDrawerError').textContent = error.message;
      $('#directoryDrawerError').hidden = false;
      status.className = 'customer-import-status error';
      status.textContent = error.message;
    }
  }

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ml = s => esc(s).replace(/\s*\n\s*/g, ' ');
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const fmt = n => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rs = n => '₹' + fmt(n);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dt = v => { const p = (v || '').split('-'); return p.length === 3 ? `${+p[2]} ${(docLang() === 'hi' ? HI_MON : MON)[+p[1] - 1]} ${p[0]}` : ''; };
const stName = c => { const x = STATES.find(a => a[0] === c); return x ? (docLang() === 'hi' ? (HI_STATES[x[1]] || x[1]) : x[1]) : c; };

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
const three = n => { const h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' Hundred' + (r ? ' And ' : '') : '') + (r ? two(r) : ''); };
function words(n) {
  if (!n) return 'Zero';
  const p = [], cr = Math.floor(n / 1e7), la = Math.floor(n % 1e7 / 1e5), th = Math.floor(n % 1e5 / 1e3), rest = n % 1e3;
  if (cr) p.push(words(cr) + ' Crore');
  if (la) p.push(two(la) + ' Lakh');
  if (th) p.push(two(th) + ' Thousand');
  if (rest) p.push((p.length && rest < 100 ? 'And ' : '') + three(rest));
  return p.join(', ');
}
function totalWords(t) {
  t = round2(Math.abs(Number(t) || 0));               // never negative or fractional beyond paise
  if (docLang() === 'hi') return totalWordsHi(t);
  const r = Math.floor(t), ps = Math.round((t - r) * 100);
  return 'INR ' + words(r) + (r === 1 ? ' Rupee' : ' Rupees') + (ps ? ' And ' + two(ps) + ' Paise' : '') + ' Only.';
}

/* ---------- GST calculation ---------- */
function calc() {
  const intra = Boolean(S.seller.state && S.meta.pos && S.seller.state === S.meta.pos);
  const rows = S.items.map(i => {
    const g = Math.max(0, +i.gst || 0), q = Math.max(0, +i.qty || 0), r = Math.max(0, +i.rate || 0);
    const gross = r * q, wanted = Math.max(0, +i.disc || 0);
    const d = Math.min(wanted, gross);                 // a discount cannot be more than the line amount
    const capped = wanted > gross;
    const base = gross - d;
    let tx, tax, amt;
    if (S.priceMode === 'incl') { amt = round2(base); tx = round2(base / (1 + g / 100)); tax = round2(amt - tx); }
    else { tx = round2(base); tax = round2(tx * g / 100); amt = round2(tx + tax); }
    const unit = S.priceMode === 'incl' ? r / (1 + g / 100) : r;
    const filled = Boolean(String(i.name || '').trim() || String(i.hsn || '').trim() || +i.rate || +i.disc);   // a quantity alone (the default 1) does not make a row count
    return { ...i, g, q, unit, tx, tax, amt, filled, capped };
  });
  const groups = {};
  rows.forEach(r => {
    if (r.filled) (groups[r.g] ||= { tax: 0 }).tax = round2(groups[r.g].tax + r.tax);
  });
  const beforeDiscount = round2(rows.reduce((a, r) => a + r.tx, 0));
  const grossBefore = round2(rows.reduce((a, r) => a + r.amt, 0));
  const disc = invoiceDiscountAmount(beforeDiscount, S.discount, grossBefore);
  let taxable = beforeDiscount;
  let sum = grossBefore;
  // Take `amount` off the taxable value, share it over the GST slabs in proportion to their taxable value,
  // then work the GST out again on what is left.
  const slabs = Object.keys(groups);
  const slabTaxable = {};
  rows.forEach(r => { if (r.filled) slabTaxable[r.g] = round2((slabTaxable[r.g] || 0) + r.tx); });
  const applyDiscount = amount => {
    let given = 0;
    slabs.forEach(g => {
      groups[g].taxable = slabTaxable[g] || 0;
      groups[g].discount = round2(amount * groups[g].taxable / beforeDiscount);
      given = round2(given + groups[g].discount);
    });
    const largest = slabs.reduce((best, g) => (groups[g].taxable > (groups[best]?.taxable ?? -1) ? g : best), slabs[0]);
    if (largest !== undefined) groups[largest].discount = round2(groups[largest].discount + amount - given);   // rounding leftover
    slabs.forEach(g => { groups[g].tax = round2((groups[g].taxable - groups[g].discount) * g / 100); });
    const net = round2(beforeDiscount - amount);
    return { net, gross: round2(net + slabs.reduce((a, g) => a + groups[g].tax, 0)) };
  };
  let discountAmount = disc.amount;
  if (disc.amount > 0) {
    let result = applyDiscount(discountAmount);
    if (S.discount?.basis === 'final' && S.discount?.type === 'amount' && disc.billDiscount) {
      // Paise rounding can leave the bill a paisa away from "bill amount minus the rupees given". Pick the nearest amount that hits it exactly.
      const target = round2(grossBefore - disc.billDiscount);
      for (const step of [0, 0.01, -0.01, 0.02, -0.02]) {
        const candidate = round2(disc.amount + step);
        if (candidate <= 0 || candidate > beforeDiscount) continue;
        const attempt = applyDiscount(candidate);
        if (attempt.gross === target) { discountAmount = candidate; result = attempt; break; }
      }
      if (discountAmount === disc.amount) result = applyDiscount(discountAmount);   // no exact hit: keep the plain figure
    }
    taxable = result.net;
    sum = result.gross;
  }
  const total = S.round ? Math.round(sum) : sum;
  return { intra, rows, groups, taxable, sum, total, roundoff: round2(total - sum), beforeDiscount, discount: discountAmount, discountPercent: beforeDiscount > 0 ? Math.round(discountAmount / beforeDiscount * 1e6) / 1e4 : 0, discountCapped: disc.capped, billDiscount: round2(grossBefore - sum) };
}

/* ---------- invoice markup ---------- */
function sheetHTML(label) {
  label = L(label);
  const C = calc(), s = S.seller, m = S.meta, c = S.customer, b = S.bank;
  const customers = templatePreviewing ? [] : customerOptions();       // previews never list your real customers or items
  const availableItems = templatePreviewing ? [] : itemOptions();
  // HSN, value and GST are fetched from Item Details, so they are locked, and open up only on a custom item.
  // (An item whose name is not in Item Details, such as a row saved before custom items existed, counts as custom too.)
  const catalogNames = new Set(availableItems.map(item => String(item.name || '').trim().toLowerCase()));
  const isCustomRow = index => !templatePreviewing && (Boolean(S.items[index].custom) || (String(S.items[index].name || '').trim() !== '' && !catalogNames.has(String(S.items[index].name).trim().toLowerCase())));
  const hasItems = C.rows.some(r => r.filled);
  const hasCustomerDetails = ['name', 'gstin', 'phone', 'email', 'billing', 'shipping', 'shippingPhone', 'shippingEmail']
    .some(key => String(c[key] || '').trim());
  const signName = S.sign.companyName || s.name;
  const eb = (k, spacing = 'me-0') => k !== 'customer' || (archivePreviewInvoice && !archivePreviewEditing)
    ? ''
    : `<button class="eb no-print btn btn-sm btn-dark e ${spacing}" data-edit="${k}">Edit</button>`;
  const row = (l, v) => `<div>${l}</div><div>${v}</div>`;
  const dateRow = (l, v, key) => `<div>${l}</div><div class="inv-date-cell"><input type="date" class="inv-date-input no-print" value="${v || ''}" data-meta="${key}" aria-label="${l}" title="Select ${l.toLowerCase()}"><span class="inv-date-text">${dt(v)}</span></div>`;
  const taxLabel = C.intra ? 'CGST+SGST' : 'IGST';

  let taxRows = '';
  let printTaxRows = '';
  Object.keys(C.groups).sort((a, b) => a - b).forEach(g => {
    const t = C.groups[g].tax;
    if (C.intra) {
      const h = round2(t / 2);
      const label = `GST ${g}% (CGST ${g / 2}% + SGST ${g / 2}%)`;
      const value = `${rs(t)} (${rs(h)} + ${rs(round2(t - h))})`;
      taxRows += `<div>${label}</div><div>${value}</div>`;
      printTaxRows += `<tr><td colspan="6">${label}</td><td colspan="2">${value}</td></tr>`;
    }
    else {
      const label = `IGST ${g}%`;
      const value = rs(t);
      taxRows += row(label, value);
      printTaxRows += `<tr><td colspan="6">${label}</td><td colspan="2">${value}</td></tr>`;
    }
  });
  const roundRow = S.round ? row(L('Round off'), (C.roundoff < 0 ? '-' : '') + rs(Math.abs(C.roundoff))) : '';
  const printRoundRow = S.round
    ? `<tr><td colspan="6">${L('Round off')}</td><td colspan="2">${(C.roundoff < 0 ? '-' : '') + rs(Math.abs(C.roundoff))}</td></tr>`
    : '';
  const discountLabel = S.discount?.type === 'amount' ? L('Discount (before GST)') : `${L('Discount')} (${+C.discountPercent.toFixed(2)}%)`;
  const discountRows = C.discount ? row(L('Amount before discount'), rs(C.beforeDiscount)) + row(discountLabel, '- ' + rs(C.discount)) : '';
  const printDiscountRows = C.discount
    ? `<tr><td colspan="6">${L('Amount before discount')}</td><td colspan="2">${rs(C.beforeDiscount)}</td></tr><tr><td colspan="6">${discountLabel}</td><td colspan="2">- ${rs(C.discount)}</td></tr>`
    : '';
  const printTotals = `${printDiscountRows}<tr><td colspan="6">${L('Taxable Amount')}</td><td colspan="2">${hasItems ? rs(C.taxable) : ''}</td></tr>${printTaxRows}${printRoundRow}<tr><td colspan="6">${L('Total')}</td><td colspan="2"><b>${hasItems ? rs(C.total) : ''}</b></td></tr>`;
  const items = C.rows.map((r, i) => `<tr>
    <td class="c">${i + 1}</td><td ><b>${esc(r.name)}</b></td><td class="c">${esc(r.hsn)}</td>
    <td class="n">${rs(r.unit)}</td><td class="c">${r.q}</td><td class="n">${rs(r.tx)}</td>
    <td class="n">${rs(r.tax)}<br><b>${taxLabel} (${r.g}%)</b></td><td class="n">${rs(r.amt)}</td></tr>`).join('');

  let qr = '';
  if (b.upi && typeof qrcode !== 'undefined') {
    const q = qrcode(0, 'M');
    q.addData(`upi://pay?pa=${b.upi}&pn=${encodeURIComponent(s.name)}${b.qrAmt ? '&am=' + C.total.toFixed(2) : ''}&cu=INR`);
    q.make(); qr = q.createImgTag(3, 0);
  }
  const terms = S.terms.list.filter(term => term.trim()).map((term, i) => `${i + 1}. ${esc(term)}`).join('<br>');
  const ship = c.shipSame ? c.billing : c.shipping;
  const shipContact = c.shipSame
    ? `${c.phone ? `<br><b>${L('Phone:')}</b> ` + esc(c.phone) : ''}${c.email ? `<br><b>${L('Email:')}</b> ` + esc(c.email) : ''}${c.gstin ? '<br><b>GSTIN:</b> ' + esc(c.gstin) : ''}`
    : `${c.shippingPhone ? `<br><b>${L('Ph:')}</b> ` + esc(c.shippingPhone) : ''}${c.shippingEmail ? `<br><b>${L('Email:')}</b> ` + esc(c.shippingEmail) : ''}`;

  const st = invoiceStyle();
  const smallPaper = document.body.classList.contains('printing') && ['a5', 'a4half'].includes(invoicePaper());   // smaller pages use the compact layout
  const sheetClasses = ['sheet', `tpl-${st.template}`, st.compact || smallPaper ? 'is-compact' : '', st.showLogo ? '' : 'no-logo', st.accent.toLowerCase() === '#000000' ? '' : 'accented', st.fontSize !== 'md' ? `fs-${st.fontSize}` : '', st.logoPosition === 'left' ? 'logo-left' : ''].filter(Boolean).join(' ');

  /* ---- Shared pieces: every template shows the same content; a template only arranges these differently. ---- */
  const sellerInfo = `<div><b class="comp-name">${esc(s.name)}</b><br><b>GSTIN:</b> ${esc(s.gstin)}<br><b>${L('Address:')}</b> <span class="address-text">${ml(s.addr)}</span><br><b>${L('Mobile:')}</b> ${esc(s.mobile)}<br><b>${L('Email:')}</b> ${esc(s.email)}</div>`;
  const sellerElegant = `<div class="le-seller"><b class="comp-name">${esc(s.name)}</b><div class="le-contact">${[s.addr ? `<span class="address-text">${ml(s.addr)}</span>` : '', s.mobile ? `${L('Mobile:')} ${esc(s.mobile)}` : '', s.email ? `${L('Email:')} ${esc(s.email)}` : ''].filter(Boolean).join('<span class="le-dot">•</span>')}</div>${s.gstin ? `<div class="le-gstin">GSTIN: ${esc(s.gstin)}</div>` : ''}</div>`;
  const logoDiv = !st.showLogo ? '' : `<div class="logo">${imageSrc(s.logo) ? `<img src="${esc(imageSrc(s.logo))}" alt="Logo">` : ''}</div>`;
  const dateInput = (l, v, key) => `<input type="date" class="inv-date-input no-print" value="${v || ''}" data-meta="${key}" aria-label="${l}" title="Select ${l.toLowerCase()}"><span class="inv-date-text">${dt(v)}</span>`;
  const quote = isQuotation();
  const docTitle = quote ? L('QUOTATION') : L('TAX INVOICE');
  if (quote) label = '';
  const numberText = archivePreviewInvoice && archivePreviewInvoice.status === 'draft' ? esc(L('Draft')) : esc(m.no);   // a draft has no number yet
  const metaItems = quote
    ? [[L('Quotation No'), numberText, false], [L('Quotation Date'), dateInput('Quotation Date', m.date, 'date'), true], [L('Place of Supply'), stName(m.pos), false], [L('Valid Until'), dateInput('Valid Until', m.valid, 'valid'), true]]
    : [[L('Invoice No'), numberText, false], [L('Invoice Date'), dateInput('Invoice Date', m.date, 'date'), true], [L('Place of Supply'), stName(m.pos), false], [L('Due Date'), dateInput('Due Date', m.due, 'due'), true]];
  const metaRows = metaItems.map(([l, v, isDate]) => isDate ? `<div>${l}</div><div class="inv-date-cell">${v}</div>` : `<div>${l}</div><div>${v}</div>`).join('');
  const metaChips = metaItems.map(([l, v, isDate]) => `<div class="meta-chip"><span class="meta-chip-label">${l}</span><span class="meta-chip-value ${isDate ? 'inv-date-cell' : ''}">${v}</span></div>`).join('');
  const custInner = `    <div class="cust-header"><b class="cust-section-title cust-heading">${L('Customer Details:')}</b>
      <div class="cust-picker-wrap no-print">
        <input type="text" class="cust-search-input" placeholder="Search or select customer…" value="${esc(c.name)}" data-custpick="1" autocomplete="off">
        <div class="cust-dropdown" id="custDropdown">
          <div class="cust-dropdown-list">
            ${customers.map((dc, i) => dc.active === false ? '' : `<div class="cust-option" data-custidx="${i}">
            <span class="cust-opt-name">${esc(dc.name)}</span>
            <span class="cust-opt-loc">${esc(dc.billing.split('\n').pop())}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
      ${hasCustomerDetails ? eb('customer', '') : ''}
      ${hasCustomerDetails ? '<button type="button" class="cust-clear-btn no-print" data-custclear="1" aria-label="Clear selected customer" title="Clear selected customer">Clear</button>' : ''}
      <button type="button" class="cust-add-btn no-print ms-5" data-custedit="1" aria-label="Add custom customer" title="Add custom customer">Add Customer <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd" />
          </svg></button>
      </div>
      <span class="cust-name-print">${esc(c.name)}</span>
      <b class="cust-section-title cust-address-label">${L('Address:')}</b>
      <span class="cust-address cust-address-value fw-light"><span class="address-text">${ml(c.billing)}</span>${c.phone ? `<br><b>${L('Phone:')}</b> ` + esc(c.phone) : ''}${c.email ? `<br><b>${L('Email:')}</b> ` + esc(c.email) : ''}${c.gstin ? '<br><b>GSTIN:</b> ' + esc(c.gstin) : ''}</span>
    <div class="price-list-corner no-print"><select class="form-select form-select-sm price-list-select no-print" data-pricelist="1" aria-label="Price list for this invoice" title="Price list: decides which rate is used when you pick items">${PRICE_LISTS.map(([value, label]) => `<option value="${value}" ${value === normalizePriceList(c.priceList) ? 'selected' : ''}>${label}</option>`).join('')}</select></div>`;
  const shipOptions = normalizeShipAddresses(c.shippingAddresses);
  const shipSelected = c.shipSame ? -1 : shipOptions.findIndex(a => a.address === c.shipping);
  const shipPicker = shipOptions.length
    ? `<div class="ship-to-pick no-print"><select class="form-select form-select-sm ship-to-select" data-shipto="1" aria-label="Ship to" title="Choose which saved address this invoice is shipped to"><option value="">Ship to: same as billing</option>${shipOptions.map((a, i) => `<option value="${i}" ${i === shipSelected ? 'selected' : ''}>Ship to: ${esc(a.label || `Address ${i + 1}`)}</option>`).join('')}</select></div>`
    : '';
  const shipInner = `${shipPicker}<b>${L('Shipping address:')}</b><br><span class="fw-light"><span class="address-text">${ml(ship)}</span>${shipContact}</span>`;
  const bankDetailsHTML = `<div><b>${L('Bank Details:')} </b><br> <span class="fw-light">${L('Bank:')} ${esc(b.bank)}<br>${L('Account #:')} ${esc(b.acc)}<br>IFSC: ${esc(b.ifsc)}<br>${L('Branch:')} ${esc(b.branch)}</span></div>`;
  const qrHTML = `<div><b>${L('Pay using UPI:')}</b><div class="qr qr-code">${qr}</div></div>`;
  const signInner = `<b>${L('Authorized Signatory')}</b>${imageSrc(S.sign.sig) ? `<img src="${esc(imageSrc(S.sign.sig))}" alt="Signature">` : '<span style="height:60px"></span>'}${signName ? `<span>${L('For')} ${esc(signName)}</span>` : ''}`;
  const termsInner = `<b>${L('Terms and Conditions:')}</b><br> <span class="fw-light">${terms}</span>`;

  /* ---- Top section layouts (title, seller, invoice details, customer) ---- */
  const topLayouts = {
    classic: () => `<div class="top"><h1>${docTitle}</h1><span>${label}</span></div>

  <div class="blk two sellerrow border-bottom-0">
    <div class="cell border-end-0 align-items-center">${eb('seller')}
      ${sellerInfo}
      ${logoDiv}
    </div>
    <div class="cell p0"><div class="meta sec pt-0">${eb('meta')}
      ${metaRows}
    </div></div>
  </div>

  <div class="blk two ${quote ? 'single' : ''}">
    <div class="cell cust-cell ${quote ? '' : 'border-end-0'}">${custInner}</div>
    ${quote ? '' : `<div class="cell Shipping1 ">${shipInner}</div>`}
  </div>`,
    modern: () => `<div class="lay-top lay-modern-top">
    <div class="lm-band">
      <div class="lm-brand cell">${eb('seller')}${logoDiv}${sellerInfo}</div>
      <div class="lm-title"><h1>${docTitle}</h1><span>${label}</span></div>
    </div>
    <div class="lm-chips cell">${eb('meta')}${metaChips}</div>
    <div class="lm-parties ${quote ? 'single' : ''}">
      <div class="lm-party cell cust-cell">${custInner}</div>
      ${quote ? '' : `<div class="lm-party cell Shipping1">${shipInner}</div>`}
    </div>
  </div>`,
    minimal: () => `<div class="lay-top lay-minimal-top">
    <div class="mn-head">
      <div class="mn-brand cell">${eb('seller')}${logoDiv}${sellerInfo}</div>
      <div class="mn-title">
        <h1>${docTitle}</h1><span>${label}</span>
        <div class="mn-meta">${metaItems.map(([l, v, isDate]) => `<div class="mn-meta-row"><span>${l}</span><b class="${isDate ? 'inv-date-cell' : ''}">${v}</b></div>`).join('')}</div>
      </div>
    </div>
    <div class="mn-parties ${quote ? 'single' : ''}">
      <div class="mn-party cell cust-cell">${custInner}</div>
      ${quote ? '' : `<div class="mn-party cell Shipping1">${shipInner}</div>`}
    </div>
  </div>`,
    corporate: () => `<div class="lay-top lay-corp-top">
    <div class="cp-head">
      <div class="cp-brand cell">${eb('seller')}${logoDiv}${sellerInfo}</div>
      <div class="cp-doc">
        <h1>${docTitle}</h1><span>${label}</span>
        <div class="cp-meta">${metaItems.map(([l, v, isDate]) => `<span>${l}</span><b class="${isDate ? 'inv-date-cell' : ''}">${v}</b>`).join('')}</div>
      </div>
    </div>
    <div class="cp-parties ${quote ? 'single' : ''}">
      <div class="cp-party cell cust-cell">${custInner}</div>
      ${quote ? '' : `<div class="cp-party cell Shipping1">${shipInner}</div>`}
    </div>
  </div>`,
    elegant: () => `<div class="lay-top lay-elegant-top">
    <div class="le-head cell">${eb('seller')}${logoDiv}${sellerElegant}</div>
    <div class="le-title"><div class="le-title-text"><h1>${docTitle}</h1><span>${label}</span></div></div>
    <div class="le-chips cell">${eb('meta')}${metaChips}</div>
    <div class="le-parties ${quote ? 'single' : ''}">
      <div class="le-party cell cust-cell">${custInner}</div>
      ${quote ? '' : `<div class="le-party cell Shipping1">${shipInner}</div>`}
    </div>
  </div>`
  };

  /* ---- Bottom section layouts (bank, UPI QR, signature, terms) ---- */
  const bottomLayouts = {
    classic: () => {
      const showQr = st.showQr && !quote;   // no payment QR on a quotation
      const bankCell = st.showBank || showQr;
      const bankInner = (st.showBank ? bankDetailsHTML : '') + (showQr ? qrHTML : '');
      const bankSign = bankCell || st.showSignature
        ? `<div class="blk two ${bankCell && st.showSignature ? '' : 'single'}">
    ${bankCell ? `<div class="cell">${eb('bank')}<div class="upi">${bankInner}</div></div>` : ''}
    ${st.showSignature ? `<div class="cell signbox">${eb('sign')}${signInner}</div>` : ''}
  </div>` : '';
      const termsBlock = st.showTerms
        ? `<div class="blk"><div class="cell terms-cell">${eb('terms')}${termsInner}</div></div>` : '';
      return bankSign + termsBlock;
    },
    modern: () => {
      const cards = [
        st.showBank ? `<div class="lm-card cell">${eb('bank')}${bankDetailsHTML}</div>` : '',
        st.showQr && !quote ? `<div class="lm-card cell">${qrHTML}</div>` : '',
        st.showSignature ? `<div class="lm-card cell signbox">${eb('sign')}${signInner}</div>` : ''
      ].filter(Boolean);
      const cardRow = cards.length ? `<div class="lm-bottom" style="--cols:${cards.length}">${cards.join('')}</div>` : '';
      const termsStrip = st.showTerms ? `<div class="lm-terms cell">${eb('terms')}${termsInner}</div>` : '';
      return cardRow + termsStrip;
    },
    minimal: () => {
      const cols = [
        st.showBank ? `<div class="mn-block cell">${eb('bank')}${bankDetailsHTML}</div>` : '',
        st.showQr && !quote ? `<div class="mn-block mn-qr cell">${qrHTML}</div>` : '',
        st.showSignature ? `<div class="mn-block mn-sign cell signbox">${eb('sign')}${signInner}</div>` : ''
      ].filter(Boolean);
      const colRow = cols.length ? `<div class="mn-cols" style="--cols:${cols.length}">${cols.join('')}</div>` : '';
      const termsStrip = st.showTerms ? `<div class="mn-terms cell">${eb('terms')}${termsInner}</div>` : '';
      return colRow + termsStrip;
    },
    corporate: () => {
      const cards = [
        st.showBank ? `<div class="cp-card cell">${eb('bank')}${bankDetailsHTML}</div>` : '',
        st.showQr && !quote ? `<div class="cp-card cp-qr cell">${qrHTML}</div>` : '',
        st.showSignature ? `<div class="cp-card cp-sign cell signbox">${eb('sign')}${signInner}</div>` : ''
      ].filter(Boolean);
      const cardRow = cards.length ? `<div class="cp-cards" style="--cols:${cards.length}">${cards.join('')}</div>` : '';
      const termsStrip = st.showTerms ? `<div class="cp-terms cell">${eb('terms')}${termsInner}</div>` : '';
      return cardRow + termsStrip;
    },
    elegant: () => {
      const cards = [
        st.showBank ? `<div class="le-card cell">${eb('bank')}${bankDetailsHTML}</div>` : '',
        st.showQr && !quote ? `<div class="le-card le-qr cell">${qrHTML}</div>` : '',
        st.showSignature ? `<div class="le-card cell signbox">${eb('sign')}${signInner}</div>` : ''
      ].filter(Boolean);
      const cardRow = cards.length ? `<div class="le-cards" style="--cols:${cards.length}">${cards.join('')}</div>` : '';
      const termsStrip = st.showTerms ? `<div class="le-terms cell">${eb('terms')}${termsInner}</div>` : '';
      return cardRow + termsStrip;
    }
  };
  const topHTML = (topLayouts[st.template] || topLayouts.classic)();
  const bottomHTML = (bottomLayouts[st.template] || bottomLayouts.classic)();

  const watermark = INVOICE_WATERMARKS[S.watermark];

  // Thermal paper: a compact receipt. It is used only for print / PDF / picture output; the screen keeps the normal editable sheet.
  if (document.body.classList.contains('printing') && PAPERS[invoicePaper()].receipt) {
    const paperKey = invoicePaper();
    const filled = C.rows.map((r, i) => ({ r, line: S.items[i] || {} })).filter(({ r }) => r.filled);
    const rcLine = (left, right, cls = '') => `<div class="rc-row ${cls}"><span>${left}</span><span>${right}</span></div>`;
    const rcItems = filled.map(({ r, line }) => `<div class="rc-item">
      <div class="rc-item-name">${esc(r.name)}</div>
      ${rcLine(`${esc(String(r.q))}${line.unit ? ' ' + esc(line.unit) : ''} × ${rs(r.unit)}`, rs(r.amt))}
      <div class="rc-item-sub">${r.hsn ? 'HSN ' + esc(r.hsn) + ' · ' : ''}${taxLabel} ${r.g}% = ${rs(r.tax)}</div>
    </div>`).join('') || '<div class="rc-empty">No items</div>';
    const rcTax = Object.keys(C.groups).sort((a, b) => a - b).map(g => rcLine(`${taxLabel} ${g}%`, rs(C.groups[g].tax))).join('');
    const rcCustomer = c.name ? `<div class="rc-block"><b>${esc(c.name)}</b>${c.phone ? '<br>' + L('Phone:') + ' ' + esc(c.phone) : ''}${c.gstin ? '<br>GSTIN: ' + esc(c.gstin) : ''}</div>` : '';
    return `<section class="sheet receipt receipt-${paperKey === 'thermal58' ? '58' : '80'}">
      ${watermark ? `<div class="inv-watermark ${watermark.cls}" aria-hidden="true">${watermark.text}</div>` : ''}
      <div class="rc-center rc-seller"><b class="rc-name">${esc(s.name)}</b>
        ${s.addr ? `<div>${ml(s.addr)}</div>` : ''}${s.mobile ? `<div>${L('Mobile:')} ${esc(s.mobile)}</div>` : ''}${s.gstin ? `<div>GSTIN: ${esc(s.gstin)}</div>` : ''}</div>
      <div class="rc-center rc-title">${quote ? L('QUOTATION') : L('TAX INVOICE')}</div>
      <div class="rc-block">${rcLine(quote ? L('Quotation No') : L('Invoice No'), archivePreviewInvoice && archivePreviewInvoice.status === 'draft' ? esc(L('Draft')) : esc(m.no))}${rcLine(L('Date'), esc(dt(m.date)))}${m.pos ? rcLine(L('Place of Supply'), esc(stName(m.pos))) : ''}</div>
      ${rcCustomer}
      <div class="rc-rule"></div>
      ${rcItems}
      <div class="rc-rule"></div>
      ${C.discount ? rcLine(L('Amount before discount'), rs(C.beforeDiscount)) + rcLine(discountLabel, '- ' + rs(C.discount)) : ''}
      ${rcLine(L('Taxable Amount'), hasItems ? rs(C.taxable) : '')}
      ${rcTax}
      ${S.round ? rcLine(L('Round off'), (C.roundoff < 0 ? '-' : '') + rs(Math.abs(C.roundoff))) : ''}
      <div class="rc-rule rc-rule-strong"></div>
      ${rcLine(L('Total'), hasItems ? rs(C.total) : '', 'rc-total')}
      <div class="rc-rule"></div>
      ${qr && st.showQr && !quote ? `<div class="rc-center rc-qr"><div>${L('Pay using UPI:')}</div>${qr}</div>` : ''}
      ${st.showTerms && terms ? `<div class="rc-terms">${terms}</div>` : ''}
      <div class="rc-center rc-thanks">Thank you! Visit again.</div>
    </section>`;
  }

  return `<section class="${sheetClasses}" style="${accentVars(st.accent)}">
  ${watermark ? `<div class="inv-watermark ${watermark.cls}" aria-hidden="true">${watermark.text}</div>` : ''}
  ${topHTML}
  <div class="sec items-section">
  <table class="items"><thead style="background: #e3e3e385;"><tr><th>#</th><th class="text-start">${L('Item')}</th><th class="text-start">${L('HSN/SAC')}</th><th class="text-start">${L('Rate')}</th><th class="no-print text-start">Qty</th><th class="print-only-th">${L('Qty')}</th><th class="text-start">${L('Value')}</th><th class="no-print text-start">GST %</th><th class="text-start">${L('Tax Amount')}</th><th class="text-end">${L('Total Amount')}</th><th class="no-print">Delete</th></tr></thead>
  <tbody>${C.rows.map((r, i) => {
    const quantityUnit = QUANTITY_UNITS.includes(S.items[i].unit) ? S.items[i].unit : 'Nos';
    const quantityMenuOpen = openQuantityMenuRow === i;
    const rateFitsOneLine = Math.abs(r.unit) <= 10000000;
    const valueFitsOneLine = Math.abs(r.tx) <= 10000000;
    const taxFitsOneLine = Math.abs(r.tax) <= 10000000;
    const totalFitsOneLine = Math.abs(r.amt) <= 10000000;
    return `<tr>
    <td class="c">${i + 1}</td>
    <td class="item-name-cell">
      <span class="print-only-text"><b>${esc(r.name)}</b></span>
${S.items[i].custom ? `      <div class="item-picker-wrap no-print is-custom">
        <input type="text" class="item-search-input" placeholder="Enter item name" value="${esc(r.name)}" data-icustomname="${i}" autocomplete="off" aria-label="Item name for item ${i + 1}">
        <button type="button" class="item-custom-back" data-icustomback="${i}" title="Choose item from list" aria-label="Choose item from list"><svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
` : `      <div class="item-picker-wrap no-print">
        <input type="text" class="item-search-input" placeholder="Search item…" value="${esc(r.name)}" data-itempick="${i}" autocomplete="off">
        <div class="item-dropdown">
          <div class="item-dd-opt item-dd-custom" data-itemcustom="${i}">
            <span class="item-dd-name">Custom Item <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd" /></svg></span>
          </div>
          ${availableItems.map((di, j) => di.active === false ? '' : `<div class="item-dd-opt" data-itemidx="${j}" data-itemrow="${i}">
            <span class="item-dd-name">${esc(di.name)}</span>
            <span class="item-dd-info">HSN ${esc(di.hsn)} · ₹${fmt(itemRateFor(di, S.customer?.priceList))}</span>
          </div>`).join('')}
        </div>
      </div>
`}
    </td>
    <td class="c text-start">
      <input class="inline-item-field inline-hsn no-print" type="text" placeholder="${isCustomRow(i) ? 'HSN/SAC' : 'Auto'}" value="${esc(r.hsn)}" data-ihsn="${i}" ${isCustomRow(i) ? '' : 'readonly tabindex="-1"'} title="${isCustomRow(i) ? 'Type the HSN/SAC code' : 'Fetched from Item Details'}" aria-label="HSN/SAC for item ${i + 1}">
      <span class="print-only-text">${esc(r.hsn)}</span>
    </td>
    <td class="n text-start ${rateFitsOneLine ? 'currency-one-line' : ''}">
      <span class="inline-money-field no-print"><span aria-hidden="true">₹</span><input class="inline-item-field inline-rate" type="number" min="0" step="any" placeholder="${isCustomRow(i) ? 'Rate' : 'Auto'}" value="${S.items[i].rate === '' ? '' : r.unit.toFixed(2)}" data-irate="${i}" ${isCustomRow(i) ? '' : 'readonly tabindex="-1"'} title="${isCustomRow(i) ? 'Type the rate' : 'Fetched from Item Details'}" aria-label="Rate for item ${i + 1}"></span>
      <span class="print-only-text">${r.filled ? rs(r.unit) : ''}</span>
    </td>
    <td class="c no-print text-start"><div class="quantity-unit-picker${quantityMenuOpen ? ' open' : ''}">
      <button type="button" class="quantity-unit-toggle" data-quantity-toggle="${i}" aria-expanded="${quantityMenuOpen}" aria-controls="quantityMenu${i}" aria-label="Quantity and unit for item ${i + 1}"><span class="quantity-unit-label">${+S.items[i].qty > 0 ? r.q : 'Qty'} ${esc(quantityUnit)}</span><span class="quantity-unit-caret" aria-hidden="true"></span></button>
      <div id="quantityMenu${i}" class="quantity-unit-menu${quantityMenuOpen ? ' show' : ''}">
        <div class="quantity-unit-columns">
          <div class="quantity-unit-column">
            <div class="quantity-unit-heading">Quantity</div>
            <div class="quantity-unit-options">
              <div class="quantity-custom-entry" data-custom-entry="${i}" ${openCustomQuantityRow === i ? '' : 'hidden'}>
                <input class="form-control form-control-sm" type="number" min="0.01" step="any" value="${openCustomQuantityRow === i && +S.items[i].qty > 0 ? esc(S.items[i].qty) : +S.items[i].qty > 100 ? esc(S.items[i].qty) : ''}" data-custom-quantity-input="${i}" aria-label="Custom quantity for item ${i + 1}" placeholder="Enter quantity">
                <div class="quantity-custom-error" data-custom-quantity-error="${i}" role="alert"></div>
              </div>
              <button type="button" class="quantity-unit-option quantity-custom-trigger ${+S.items[i].qty > 100 ? 'active' : ''}" data-custom-quantity="${i}" ${openCustomQuantityRow === i ? 'hidden' : ''}>Custom…</button>
              ${Array.from({ length: 100 }, (_, index) => index + 1).map(quantity => `<button type="button" class="quantity-unit-option ${+S.items[i].qty === quantity ? 'active' : ''}" data-quantity="${quantity}" data-row="${i}">${quantity}</button>`).join('')}
            </div>
          </div>
          <div class="quantity-unit-column">
            <div class="quantity-unit-heading">Unit</div>
            <div class="quantity-unit-options quantity-unit-list">${QUANTITY_UNITS.map(unit => `<button type="button" class="quantity-unit-option ${unit === quantityUnit ? 'active' : ''}" data-unit="${esc(unit)}" data-row="${i}">${esc(unit)}</button>`).join('')}</div>
          </div>
        </div>
      </div>
    </div></td>
    <td class="c print-only-td text-start">${+S.items[i].qty > 0 ? `${r.q} ${esc(quantityUnit)}` : ''}</td>
    <td class="n text-start ${valueFitsOneLine ? 'currency-one-line' : ''}">
      <span class="inline-money-field no-print"><span aria-hidden="true">₹</span><input class="inline-item-field inline-value" type="number" min="0" step="any" placeholder="Auto" value="${r.filled ? r.tx.toFixed(2) : ''}" data-ivalue="${i}" ${isCustomRow(i) ? '' : 'readonly tabindex="-1"'} title="${isCustomRow(i) ? 'Type the taxable value, or fill the rate and quantity' : 'Calculated from rate and quantity'}" aria-label="Taxable value for item ${i + 1}"></span>
      <span class="print-only-text">${r.filled ? rs(r.tx) : ''}</span>
    </td>
    <td class="c no-print text-start "><select class="inline-gst" data-igst="${i}" ${isCustomRow(i) ? '' : 'disabled title="Fetched from Item Details"'}><option value="" disabled ${S.items[i].gst === '' ? 'selected' : ''}>GST</option>${gstOptionsFor(S.items[i].gst).map(g => `<option value="${g}" ${S.items[i].gst !== '' && g == r.g ? 'selected' : ''}>${gstLabel(g)}</option>`).join('')}</select></td>
    <td class="n text-start ${taxFitsOneLine ? 'currency-one-line' : ''}">${r.filled ? `${rs(r.tax)}<br><b class="tax-label">(${taxLabel} ${r.g}%)</b>` : ''}</td>
    <td class="n ${totalFitsOneLine ? 'currency-one-line' : ''}">${r.filled ? rs(r.amt) : ''}</td>
    <td class="c no-print"><button class="inline-del" data-idel="${i}" title="Delete">✕</button></td>
  </tr>`;
  }).join('')}</tbody>
  </table>
  ${C.rows.some(r => r.capped) ? `<div class="no-print discount-warning" role="alert">${C.rows.map((r, i) => r.capped ? i + 1 : 0).filter(Boolean).map(n => `Discount on item ${n} is more than its amount, so it was limited to the amount.`).join(' ')}</div>` : ''}
  ${C.discountCapped ? '<div class="no-print discount-warning" role="alert">The invoice discount is more than the amount, so it was limited to the amount.</div>' : ''}
  <div class="no-print items-footer"><button class="inline-add-row" data-addrow="1">Add Row <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd" />
          </svg></button><div class="wm-picker" role="group" aria-label="Invoice watermark" title="Stamp across the invoice. Click the selected one again to remove it."><span class="inline-discount-title">Watermark</span><span class="disc-seg wm-seg">${Object.entries(INVOICE_WATERMARKS).filter(([key]) => key !== 'draft').map(([key, w]) => `<button type="button" class="disc-seg-btn ${S.watermark === key ? 'is-active' : ''}" data-wm="${key}" aria-pressed="${S.watermark === key}">${w.label}</button>`).join('')}</span></div><div class="inline-footer-right"><div class="inline-discount" role="group" aria-label="Invoice discount"><span class="inline-discount-title">Discount</span><input type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(S.discount?.value ?? '')}" data-disc="value" aria-label="Invoice discount"><span class="disc-seg" role="group" aria-label="Discount type"><button type="button" class="disc-seg-btn ${S.discount?.type === 'amount' ? '' : 'is-active'}" data-disc-type="percent" aria-pressed="${S.discount?.type === 'amount' ? 'false' : 'true'}" aria-label="Discount in percent">%</button><button type="button" class="disc-seg-btn ${S.discount?.type === 'amount' ? 'is-active' : ''}" data-disc-type="amount" aria-pressed="${S.discount?.type === 'amount' ? 'true' : 'false'}" aria-label="Discount in rupees">₹</button></span>${S.discount?.type === 'amount' ? `<span class="disc-seg disc-basis" role="group" aria-label="Discount applies to"><button type="button" class="disc-seg-btn ${S.discount?.basis === 'final' ? '' : 'is-active'}" data-disc-basis="taxable" aria-pressed="${S.discount?.basis === 'final' ? 'false' : 'true'}" title="Taken off the amount before GST. The GST is worked out on what is left.">Before GST</button><button type="button" class="disc-seg-btn ${S.discount?.basis === 'final' ? 'is-active' : ''}" data-disc-basis="final" aria-pressed="${S.discount?.basis === 'final' ? 'true' : 'false'}" title="The customer pays this much less on the final bill, GST included.">On final amount</button></span>` : ''}${C.discount ? `<span class="disc-result ${C.discountCapped ? 'is-capped' : ''}">= ${S.discount?.type !== 'amount' ? `−${rs(C.discount)}` : S.discount?.basis === 'final' ? `−${rs(C.discount)} before GST` : `${+C.discountPercent.toFixed(2)}%`}</span>` : ''}${String(S.discount?.value ?? '') !== '' ? '<button type="button" class="disc-clear" data-disc-clear title="Clear discount" aria-label="Clear discount">✕</button>' : ''}</div><div class="inline-roundoff"><input type="checkbox" id="inlineRo" class="setting-checkbox me-1" ${S.round ? 'checked' : ''}><label for="inlineRo" title="New invoices start with whatever you last chose here">Round off total</label></div></div></div>
  </div>

  <div class="blk tot no-print">${discountRows}${row(L('Taxable Amount'), hasItems ? rs(C.taxable) : '')}${taxRows}${roundRow}<div>${L('Total')}</div><div class="big">${hasItems ? rs(C.total) : ''}</div></div>
  <div class="invoice-summary">
  <table class="invoice-totals print-only-totals"><tbody>${printTotals}</tbody></table>
  ${hasItems ? `<div class="blk words text-end inword"><span class="fw-light me-2">${L('Total amount (in words):')} </span>${totalWords(C.total)}</div>` : ''}

  ${bottomHTML}
  </div>
  <div class="foot">${L('Page')} 1 / 1 &nbsp; ${quote ? L('This is a quotation, not a tax invoice.') : L('This is a digitally signed document.')}</div>
</section>`;
}

function render(n = 1) {
  renderInto(archivePreviewInvoice ? $('#archivePreviewSheets') : $('#sheets'), n);
}

function invoiceSurface() {
  return archivePreviewInvoice ? $('#archivePreviewSheets') : $('#sheets');
}

// Stamp across the invoice, picked on the Generate Invoice page before printing or saving.
const INVOICE_WATERMARKS = {
  paid: { text: 'PAID', label: 'Paid', cls: 'is-paid' },
  notpaid: { text: 'NOT PAID', label: 'Not paid', cls: 'is-notpaid' },
  draft: { text: 'DRAFT', label: 'Draft', cls: 'is-draft' }
};

function renderInto(target, n = 1) {
  closeDiscountMenu();   // a rebuilt sheet would leave the suggestion list pointing at nothing
  closeSelectMenu();
  if (!archivePreviewInvoice) S.style = defaultTemplateStyle();
  target.innerHTML = LABELS.slice(0, isQuotation() ? 1 : n).map(sheetHTML).join('');   // a quotation is a single copy
  $('#pm').value = S.priceMode; $('#cp').value = S.copies;
  $('#paperSel').value = invoicePaper();
  syncQuotationToggle();
  refreshCsvConnectionStatus();
}

/* ---------- Invoice Templates page + side drawer ---------- */
const PREVIEW_ITEMS = [
  { name: 'Basmati Rice', hsn: '1006', rate: 95, qty: 10, unit: 'Kg', unitExplicit: true, gst: 5, disc: 0 },
  { name: 'Refined Sunflower Oil', hsn: '1512', rate: 140, qty: 5, unit: 'Litre', unitExplicit: true, gst: 5, disc: 0 },
  { name: 'LED Bulb 9W', hsn: '8539', rate: 120, qty: 4, unit: 'Nos', unitExplicit: true, gst: 18, disc: 0 }
];
const TEMPLATE_PAGE_WIDTH = 780; // px width the invoice is laid out at before it is scaled down for previews

// Sample invoice used for template previews, with the style being previewed.
function previewState(style) {
  // Always sample data, never what is being typed in Generate Invoice.
  const base = structuredClone(DEMO_DATA);
  base.items = structuredClone(PREVIEW_ITEMS);
  base.copies = 1;
  base.lang = uiLang;
  base.style = style;
  return base;
}

let templatePreviewing = false;
function templatePreviewHTML(style) {
  const live = S;
  S = previewState(style);
  templatePreviewing = true;
  try {
    return sheetHTML(LABELS[0]);
  } finally {
    S = live;
    templatePreviewing = false;
  }
}

function templateTileFooterHTML(key) {
  const [, label, description] = TEMPLATES.find(([templateKey]) => templateKey === key);
  const isDefault = templateSettings.defaultTemplate === key;
  return `<div class="template-tile-info">
    <strong>${esc(label)}</strong>${key === 'classic' ? '<span class="badge text-bg-dark ms-2">Default</span>' : ''}
    <small>${esc(description)}</small>
  </div>
  ${isDefault ? '<button type="button" class="btn btn-success template-tile-btn" disabled>Active template</button>' : `<button type="button" class="btn btn-primary template-tile-btn" data-template-default="${key}">Use this template</button>`}`;
}

function invoiceTemplatesHTML() {
  const tiles = TEMPLATES.map(([key, label, description]) => {
    const isDefault = templateSettings.defaultTemplate === key;
    return `<article class="template-tile ${isDefault ? 'is-default' : ''}" data-template-tile="${key}">
      <div class="template-tile-preview" role="button" tabindex="0" data-template-open="${key}" aria-label="Preview and style the ${esc(label)} template">
        <span class="template-thumb"><span class="template-thumb-inner tpl-preview">${templatePreviewHTML(templateStyle(key))}</span></span>
        <span class="template-tile-hint">Click to preview &amp; style</span>
      </div>
      <div class="template-tile-footer">${templateTileFooterHTML(key)}</div>
    </article>`;
  }).join('');
  return `<div class="template-page-intro">
      <strong>Choose how your invoice looks.</strong> Each template changes the layout of the top (company, invoice details, customer) and the bottom (bank, QR, signature, terms). The items table is the same in every template. The default template is used for every new invoice.
    </div>
    <div class="template-grid">${tiles}</div>`;
}

// Scale every invoice preview so it exactly fits the width of its box.
function fitTemplatePreviews() {
  document.querySelectorAll('.template-thumb, .template-drawer-stage').forEach(box => {
    const inner = box.firstElementChild;
    if (!inner || !box.clientWidth) return;
    const scale = box.clientWidth / TEMPLATE_PAGE_WIDTH;
    inner.style.setProperty('--tpl-scale', scale);
    box.style.setProperty('--tpl-height', `${inner.offsetHeight * scale}px`);
  });
}

let templateDrawerKey = null;
let templateDrawerTrigger = null;

function templateDrawerRefresh() {
  const key = templateDrawerKey;
  if (!key) return;
  const style = templateStyle(key);
  const isDefault = templateSettings.defaultTemplate === key;
  $('#templateDrawerPreview').innerHTML = templatePreviewHTML(style);
  fitTemplatePreviews();
  const drawer = $('#templateDrawer');
  drawer.querySelectorAll('[data-tpl-opt]').forEach(control => {
    const value = style[control.dataset.tplOpt];
    if (control.type === 'checkbox') control.checked = Boolean(value);
    else control.value = value;
  });
  drawer.querySelectorAll('[data-tpl-accent]').forEach(swatch => {
    swatch.classList.toggle('is-selected', swatch.dataset.tplAccent.toLowerCase() === style.accent.toLowerCase());
  });
  const paperSelect = drawer.querySelector('[data-paper-default]');
  if (paperSelect) paperSelect.value = templateSettings.paper;
  $('#templateDrawerBadge').hidden = !isDefault;
  const defaultButton = $('#btnTemplateSetDefault');
  defaultButton.disabled = isDefault;
  defaultButton.textContent = isDefault ? 'This is the active template' : 'Use this template';
}

function refreshTemplateTile(key) {
  const tile = document.querySelector(`[data-template-tile="${key}"]`);
  if (!tile) return;
  tile.classList.toggle('is-default', templateSettings.defaultTemplate === key);
  tile.querySelector('.template-tile-footer').innerHTML = templateTileFooterHTML(key);
  tile.querySelector('.template-thumb-inner').innerHTML = templatePreviewHTML(templateStyle(key));
  fitTemplatePreviews();
}

function openTemplateDrawer(key) {
  const entry = TEMPLATES.find(([templateKey]) => templateKey === key);
  if (!entry) return;
  templateDrawerTrigger = document.activeElement;
  templateDrawerKey = key;
  $('#templateDrawerTitle').textContent = `${entry[1]} template`;
  $('#templateDrawerIntro').textContent = entry[2];
  const drawer = $('#templateDrawer');
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('is-open');
  const backdrop = $('#templateDrawerBackdrop');
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    backdrop.classList.add('is-open');
    templateDrawerRefresh();
  });
}

function closeTemplateDrawer() {
  const drawer = $('#templateDrawer');
  if (templateDrawerTrigger?.isConnected) templateDrawerTrigger.focus();
  drawer.classList.remove('is-open');
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');
  const backdrop = $('#templateDrawerBackdrop');
  backdrop.classList.remove('is-open');
  backdrop.hidden = true;
  templateDrawerKey = null;
  templateDrawerTrigger = null;
}

function setDefaultTemplate(key) {
  if (!TEMPLATES.some(([templateKey]) => templateKey === key)) return;
  const previous = templateSettings.defaultTemplate;
  templateSettings.defaultTemplate = key;
  saveTemplateSettings();
  if (!archivePreviewInvoice) render();      // the invoice being edited now follows the new default
  refreshTemplateTile(previous);
  refreshTemplateTile(key);
  if (templateDrawerKey) templateDrawerRefresh();
}

function changeTemplateOption(key, changes) {
  templateSettings.options[key] = { ...(templateSettings.options[key] || {}), ...changes };
  saveTemplateSettings();
  templateDrawerRefresh();
  refreshTemplateTile(key);
  if (key === templateSettings.defaultTemplate && !archivePreviewInvoice) render();
}

document.addEventListener('click', e => {
  const t = e.target;
  const open = t.closest('[data-template-open]');
  if (open) { openTemplateDrawer(open.dataset.templateOpen); return; }
  const makeDefault = t.closest('[data-template-default]');
  if (makeDefault) { setDefaultTemplate(makeDefault.dataset.templateDefault); return; }
  if (t.closest('[data-template-drawer-close]') || t.id === 'templateDrawerBackdrop') { closeTemplateDrawer(); return; }
  if (t.closest('#btnTemplateSetDefault') && templateDrawerKey) { setDefaultTemplate(templateDrawerKey); return; }
  const swatch = t.closest('[data-tpl-accent]');
  if (swatch && templateDrawerKey) { changeTemplateOption(templateDrawerKey, { accent: swatch.dataset.tplAccent }); return; }
  if (t.closest('[data-tpl-reset]') && templateDrawerKey) {
    delete templateSettings.options[templateDrawerKey];
    saveTemplateSettings();
    templateDrawerRefresh();
    refreshTemplateTile(templateDrawerKey);
    if (templateDrawerKey === templateSettings.defaultTemplate && !archivePreviewInvoice) render();
  }
});

document.addEventListener('input', e => {
  const option = e.target.dataset?.tplOpt;
  if (!option || !templateDrawerKey) return;
  changeTemplateOption(templateDrawerKey, { [option]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
});

document.addEventListener('keydown', e => {
  const tile = e.target.closest?.('.template-tile-preview[data-template-open]');
  if (tile && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    openTemplateDrawer(tile.dataset.templateOpen);
    return;
  }
  if (e.key === 'Escape' && templateDrawerKey) closeTemplateDrawer();
});

window.addEventListener('resize', () => fitTemplatePreviews());

let customerDrawerTrigger = null;

function openCustomerDrawer(mode) {
  customerDrawerTrigger = document.activeElement;
  const customer = mode === 'add'
    ? { name: '', gstin: '', phone: '', email: '', billing: '', shipSame: true, shipping: '', shippingPhone: '', shippingEmail: '' }
    : S.customer;
  const form = $('#invoiceCustomerForm');
  Object.entries({
    name: customer.name,
    gstin: customer.gstin,
    phone: customer.phone,
    email: customer.email,
    billing: customer.billing,
    // When the customer has no shipping details on this invoice yet, offer their first saved shipping address.
    shipping: customer.shipping || normalizeShipAddresses(customer.shippingAddresses)[0]?.address,
    shippingPhone: customer.shipping ? customer.shippingPhone : normalizeShipAddresses(customer.shippingAddresses)[0]?.phone || customer.shippingPhone,
    shippingEmail: customer.shipping ? customer.shippingEmail : normalizeShipAddresses(customer.shippingAddresses)[0]?.email || customer.shippingEmail
  }).forEach(([key, value]) => { form.elements.namedItem(key).value = value || ''; });
  form.elements.namedItem('shipSame').checked = customer.shipSame !== false;
  $('[data-customer-shipping]').hidden = form.elements.namedItem('shipSame').checked;
  form.elements.namedItem('gstin').dispatchEvent(new Event('input', { bubbles: true }));
  $('#customerDrawerTitle').textContent = mode === 'add' ? 'Add customer to invoice' : 'Edit invoice customer';
  $('#customerDrawerIntro').textContent = 'Changes apply to this invoice only. The customer CSV will not be changed.';
  $('#customerDrawerSubmit').textContent = mode === 'add' ? 'Add to invoice' : 'Save changes';
  $('#customerDrawerError').hidden = true;
  const drawer = $('#customerDrawer');
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('is-open');
  const backdrop = $('#customerDrawerBackdrop');
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add('is-open'));
  requestAnimationFrame(() => form.elements.namedItem('name').focus());
}

function closeCustomerDrawer() {
  const drawer = $('#customerDrawer');
  if (customerDrawerTrigger?.isConnected) customerDrawerTrigger.focus();
  drawer.classList.remove('is-open');
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');
  const backdrop = $('#customerDrawerBackdrop');
  backdrop.classList.remove('is-open');
  backdrop.hidden = true;
  customerDrawerTrigger = null;
}

function openDirectoryDrawer(kind, index) {
  const record = kind === 'customer' ? importedCustomers[index] : catalogItems[index];
  if (!record) return;

  directoryDrawerTrigger = document.activeElement;
  directoryDrawerKind = kind;
  directoryDrawerIndex = index;
  const fields = kind === 'customer'
    ? [
      ['name', 'Customer name', record.name, 'text', 200, true],
      ['billing', 'Address', record.billing, 'text', 500, true],
      ['phone', 'Phone', record.phone, 'tel', 50, false],
      ['email', 'Email', record.email, 'email', 254, false],
      ['gstin', 'GSTIN', record.gstin, 'text', 30, false]
    ]
    : [
      ['name', 'Item name', record.name, 'text', 200, true],
      ['hsn', 'HSN/SAC', record.hsn, 'text', 50, true],
      ['rate', 'Rate', record.rate, 'number', null, true],
      ['wholesaleRate', 'Wholesale rate (optional)', record.wholesaleRate > 0 ? record.wholesaleRate : '', 'number', null, false],
      ['cost', 'Purchase price (optional)', record.cost > 0 ? record.cost : '', 'number', null, false],
      ['stock', 'Stock on hand (blank = not tracked)', itemTracksStock(record) ? record.stock : '', 'number', null, false]
    ];
  const placeholders = {
    name: kind === 'customer' ? 'Enter customer name' : 'Enter product or service name',
    billing: 'Enter billing address',
    phone: 'Enter phone number',
    email: 'Enter email address',
    gstin: 'Enter GSTIN (optional)',
    hsn: 'Enter HSN/SAC code',
    rate: 'Enter unit rate',
    cost: 'Enter purchase price (optional)',
    wholesaleRate: 'Leave blank to use the retail rate',
    stock: 'Leave blank to not track stock'
  };
  $('#directoryDrawerFields').innerHTML = fields.map(([name, label, value, type, maxLength, required]) =>
    `<label class="customer-drawer-field">${label}<input class="form-control" name="${name}" type="${type}" value="${esc(value)}" placeholder="${placeholders[name]}" ${maxLength ? `maxlength="${maxLength}"` : 'min="0" step="any"'} ${required ? 'required' : ''} autocomplete="off">${name === 'gstin' ? `<span class="gstin-hint d-block" data-gstin-hint>${gstinHintHTML(value)}</span>` : ''}</label>`
  ).join('') + (kind === 'item'
    ? `<label class="customer-drawer-field">Unit${itemUnitSelectHTML(normalizeItemUnit(record.unit))}</label><label class="customer-drawer-field">GST %${itemGstSelectHTML(normalizeItemGst(record.gst))}</label>`
    : `<label class="customer-drawer-field">Price list${priceListSelectHTML(record.priceList)}</label>${customerExtrasEditorHTML(record)}`);
  $('#directoryDrawerTitle').textContent = kind === 'customer' ? 'Edit customer details' : 'Edit item details';
  $('#directoryDrawerIntro').textContent = `Changes will be saved to ${kind === 'customer' ? 'customers.csv' : 'items.csv'}.`;
  $('#directoryDrawerError').textContent = '';
  $('#directoryDrawerError').hidden = true;
  const drawer = $('#directoryDrawer');
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('is-open');
  const backdrop = $('#directoryDrawerBackdrop');
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add('is-open'));
  requestAnimationFrame(() => $('#directoryDrawerFields input').focus());
}

function openProfileDrawer(kind, index) {
  const profile = profileList(kind)[index];
  if (!profile) return;

  directoryDrawerTrigger = document.activeElement;
  directoryDrawerKind = `profile:${kind}`;
  directoryDrawerIndex = index;
  const placeholders = {
    name: 'Enter business name',
    gstin: 'Enter GSTIN (optional)',
    addr: 'Enter business address',
    mobile: 'Enter mobile number',
    email: 'Enter email address',
    bank: 'Enter bank name',
    acc: 'Enter account number',
    ifsc: 'Enter IFSC code',
    branch: 'Enter bank branch',
    upi: 'Enter UPI ID',
    profileName: 'Enter a name for this set',
    terms: 'Enter one term or condition per line'
  };
  const fields = profileFields(kind).map(([key, label, type, required]) => {
    const value = profile[key];
    if (type === 'checkbox') {
      return `<div class="form-check mb-3"><input class="form-check-input" id="profileDrawer-${key}" type="checkbox" name="${key}" ${value ? 'checked' : ''}><label class="form-check-label" for="profileDrawer-${key}">${esc(label)}</label></div>`;
    }
    if (type === 'state') {
      return `<label class="customer-drawer-field">${esc(label)}<select class="form-select" name="${key}" ${required ? 'required' : ''}>${stateOpts(value)}</select></label>`;
    }
    if (type === 'file') {
      return `<label class="customer-drawer-field">${esc(label)}<input class="form-control" type="file" accept="image/*" name="${key}" title="Choose an image file">${value ? '<span class="form-text">Current image will be kept unless replaced.</span>' : '<span class="form-text">Upload a logo image.</span>'}</label>`;
    }
    if (type === 'textarea') {
      const text = Array.isArray(value) ? value.join('\n') : String(value || '');
      return `<label class="customer-drawer-field">${esc(label)}<textarea class="form-control" name="${key}" rows="5" placeholder="${placeholders[key]}" ${required ? 'required' : ''}>${esc(text)}</textarea></label>`;
    }
    const inputType = type === 'email' || type === 'tel' ? type : 'text';
    return `<label class="customer-drawer-field">${esc(label)}<input class="form-control" type="${inputType}" name="${key}" value="${esc(value)}" placeholder="${placeholders[key] || `Enter ${label.toLowerCase()}`}" ${required ? 'required' : ''} autocomplete="off"></label>`;
  }).join('');

  $('#directoryDrawerFields').innerHTML = fields;
  $('#directoryDrawerTitle').textContent = kind === 'seller' ? 'Edit seller info'
    : kind === 'bank' ? 'Edit bank & UPI details' : 'Edit terms & conditions';
  $('#directoryDrawerIntro').textContent = `Changes will be saved to ${kind}.csv.`;
  $('#directoryDrawerSubmit').textContent = 'Save changes';
  $('#directoryDrawerError').textContent = '';
  $('#directoryDrawerError').hidden = true;
  const drawer = $('#directoryDrawer');
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('is-open');
  const backdrop = $('#directoryDrawerBackdrop');
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add('is-open'));
  requestAnimationFrame(() => $('#directoryDrawerFields').querySelector('input, textarea, select')?.focus());
}

function closeDirectoryDrawer() {
  const drawer = $('#directoryDrawer');
  if (directoryDrawerTrigger?.isConnected) directoryDrawerTrigger.focus();
  drawer.classList.remove('is-open');
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');
  const backdrop = $('#directoryDrawerBackdrop');
  backdrop.classList.remove('is-open');
  backdrop.hidden = true;
  directoryDrawerTrigger = null;
  directoryDrawerKind = null;
  directoryDrawerIndex = -1;
}

function saveInvoiceCustomer(form, gstinConfirmed = false) {
  const data = new FormData(form);
  const gstinCheck = validateGstin(data.get('gstin'));
  if (gstinCheck.status === 'error') {
    $('#customerDrawerError').textContent = `GSTIN: ${gstinCheck.message}`;
    $('#customerDrawerError').hidden = false;
    return;
  }
  if (gstinCheck.status === 'warn' && !gstinConfirmed) {
    confirmDestructiveAction({
      title: 'This GSTIN may be mistyped',
      message: `${gstinCheck.message} Use it on this invoice anyway?`,
      confirmLabel: 'Use anyway',
      action: () => saveInvoiceCustomer(form, true)
    });
    return;
  }
  const previousCustomer = S.customer;
  S.customer = {
    ...S.customer,
    name: String(data.get('name') || '').trim(),
    gstin: String(data.get('gstin') || '').trim().toUpperCase(),
    phone: String(data.get('phone') || '').trim(),
    email: String(data.get('email') || '').trim(),
    billing: String(data.get('billing') || '').trim(),
    shipSame: form.elements.namedItem('shipSame').checked,
    shipping: String(data.get('shipping') || '').trim(),
    shippingPhone: String(data.get('shippingPhone') || '').trim(),
    shippingEmail: String(data.get('shippingEmail') || '').trim()
  };
  if (!save()) {
    S.customer = previousCustomer;
    $('#customerDrawerError').textContent = 'Could not save the invoice customer details. Check browser storage and try again.';
    $('#customerDrawerError').hidden = false;
    return;
  }
  closeCustomerDrawer();
  render();
}

/* ---------- section editor ---------- */
const stateOpts = v => `<option value="" disabled ${v ? '' : 'selected'}>Select a state</option>${STATES.map(([c, n]) => `<option value="${c}" ${c === v ? 'selected' : ''}>${c}-${n}</option>`).join('')}`;
const SECT = {
  seller: ['Seller', [['name', 'Business name'], ['gstin', 'GSTIN', 'text', GST_RE], ['addr', 'Address', 'area'], ['mobile', 'Mobile'], ['email', 'Email'], ['state', 'Seller state', 'state'], ['logo', 'Logo (shows beside the address)', 'file']]],
  meta: ['Invoice details', [['no', 'Invoice #'], ['date', 'Invoice date', 'date'], ['due', 'Due date', 'date'], ['pos', 'Place of supply', 'state']]],
  customer: ['Customer', [['name', 'Customer name'], ['gstin', 'Customer GSTIN (optional)', 'text', GST_RE], ['phone', 'Billing phone number'], ['email', 'Billing email address', 'email'], ['billing', 'Billing address', 'area'], ['shipSame', 'Shipping same as billing', 'check'], ['shipping', 'Shipping address', 'area'], ['shippingPhone', 'Shipping phone number'], ['shippingEmail', 'Shipping email address', 'email']]],
  bank: ['Bank and UPI', [['bank', 'Bank'], ['acc', 'Account #'], ['ifsc', 'IFSC', 'text', IFSC_RE], ['branch', 'Branch'], ['upi', 'UPI ID'], ['qrAmt', 'Include invoice total in QR', 'check']]],
  sign: ['Signature', [['sig', 'Signature image', 'file'], ['companyName', 'Name shown below signature']]],

};

function fieldHTML(sec, [k, label, type, re]) {
  const v = sec === 'sign' && k === 'companyName' ? (S.sign.companyName ?? S.seller.name) : (S[sec][k] ?? ''), a = `data-p="${sec}.${k}"`;
  if (type === 'check') return `<div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="f_${k}" ${a} ${v ? 'checked' : ''}><label class="form-check-label" for="f_${k}">${label}</label></div>`;
  const placeholders = {
    name: 'Enter business or customer name',
    gstin: 'Enter GSTIN (optional)',
    addr: 'Enter business address',
    mobile: 'Enter mobile number',
    email: 'Enter email address',
    no: 'Enter invoice number',
    phone: 'Enter phone number',
    billing: 'Enter billing address',
    shipping: 'Enter shipping address',
    shippingPhone: 'Enter shipping phone number',
    shippingEmail: 'Enter shipping email address',
    bank: 'Enter bank name',
    acc: 'Enter account number',
    ifsc: 'Enter IFSC code',
    branch: 'Enter bank branch',
    upi: 'Enter UPI ID',
    companyName: 'Enter name to show below signature',
    text: 'Enter one term per line'
  };
  let inp;
  if (type === 'area') inp = `<textarea class="form-control" rows="4" placeholder="${placeholders[k] || `Enter ${label.toLowerCase()}`}" ${a}>${esc(v)}</textarea>`;
  else if (type === 'state') inp = `<select class="form-select" ${a}>${stateOpts(v)}</select>`;
  else if (type === 'file') inp = `<input class="form-control" type="file" accept="image/*" ${a}>${v ? `<button class="btn btn-sm btn-link px-0" data-clear="${sec}.${k}">Remove image</button>` : '<div class="form-text">Upload a logo or signature image.</div>'}`;
  else inp = `<input class="form-control ${re && v && !re.test(String(v).toUpperCase()) ? 'is-invalid' : ''}" type="${type === 'date' || type === 'email' ? type : 'text'}" value="${esc(v)}" aria-label="${esc(label)}" ${type !== 'date' ? `placeholder="${placeholders[k] || `Enter ${label.toLowerCase()}`}"` : `title="Select ${label.toLowerCase()}"`} ${a} ${re ? `data-re="${re === GST_RE ? 'g' : 'i'}"` : ''}>${re === GST_RE ? `<span class="gstin-hint d-block" data-gstin-hint>${gstinHintHTML(v)}</span>` : re ? '<div class="invalid-feedback">Format looks wrong. Check it before sending.</div>' : ''}`;
  const hidden = sec === 'customer' && ['shippingPhone', 'shippingEmail'].includes(k) && S.customer.shipSame ? ' hidden' : '';
  return `<div class="mb-3"${hidden}><label class="form-label">${label}</label>${inp}</div>`;
}

function numberingPreviewText() {
  return nextInvoiceNumber(S.meta.date || todayISO(), { includeCurrent: true });
}

function numberingSettingsHTML() {
  return `<div class="numbering-box" id="numberingBox">
    <div class="numbering-title">Invoice numbering</div>
    <div class="form-check mb-2">
      <input class="form-check-input" type="checkbox" id="numAuto" data-num="auto" ${numbering.auto ? 'checked' : ''}>
      <label class="form-check-label" for="numAuto">Auto-number by financial year (April to March)</label>
    </div>
    <div class="row g-2 align-items-end">
      <div class="col-12 col-md-6">
        <label class="form-label small mb-0" for="numPrefix">Prefix</label>
        <input class="form-control form-control-sm" id="numPrefix" data-num="prefix" maxlength="10" value="${esc(numbering.prefix)}" placeholder="INV">
      </div>
    </div>
    <div class="form-text mt-2">Next number: <strong id="numPreview">${esc(numberingPreviewText())}</strong>. Numbers start at 001, grow to 4 digits after 999, and restart at 001 every April.</div>
    <button class="btn btn-sm btn-outline-primary mt-2" type="button" data-num-apply>Use next number for this invoice</button>
    ${SHOW_TEST_TOOLS ? '<button class="btn btn-sm btn-outline-danger mt-2 ms-2" type="button" data-num-reset>Reset invoice number (testing)</button>' : ''}
  </div>`;
}

function itemsEditor() {
  const inp = (i, k, l, t = 'text') => `<div class="col-6"><label class="form-label small mb-0">${l}</label><input class="form-control form-control-sm" type="${t}" step="any" placeholder="${k === 'hsn' ? 'Enter HSN / SAC code' : k === 'rate' ? 'Enter unit rate' : k === 'qty' ? 'Enter quantity' : 'Enter discount (optional)'}" value="${esc(S.items[i][k])}" data-i="${i}" data-k="${k}"></div>`;
  return S.items.map((it, i) => `<div class="border rounded p-2 mb-3"><div class="row g-2">
    <div class="col-12"><label class="form-label small mb-0">Item ${i + 1}</label><input class="form-control form-control-sm" placeholder="Enter item or service name" value="${esc(it.name)}" data-i="${i}" data-k="name"></div>
    ${inp(i, 'hsn', 'HSN / SAC')}${inp(i, 'rate', 'Rate (₹)', 'number')}${inp(i, 'qty', 'Qty', 'number')}${inp(i, 'disc', 'Discount (₹)', 'number')}
    <div class="col-6"><label class="form-label small mb-0">GST %</label><select class="form-select form-select-sm" data-i="${i}" data-k="gst"><option value="" disabled ${it.gst === '' ? 'selected' : ''}>Select GST %</option>${gstOptionsFor(it.gst).map(g => `<option value="${g}" ${it.gst !== '' && g == it.gst ? 'selected' : ''}>${gstLabel(g)}</option>`).join('')}</select></div>
    <div class="col-6 d-flex align-items-end"><button class="btn btn-sm btn-outline-danger" data-del="${i}">Delete item</button></div>
  </div></div>`).join('') + '<button class="btn btn-sm btn-outline-primary" data-add="1">Add item</button>';
}

function termsEditor() {
  const terms = S.terms.list.length ? S.terms.list : [''];
  const fields = terms.map((term, index) => `
    <div class="terms-editor-row">
      <label class="form-label" for="term-${index}">Term ${index + 1}</label>
      <div class="terms-editor-input">
        <textarea class="form-control" id="term-${index}" rows="2" placeholder="Enter a term or condition" data-term-index="${index}">${esc(term)}</textarea>
        <button class="btn btn-outline-danger" type="button" aria-label="Delete term ${index + 1}" data-term-remove="${index}">Delete</button>
      </div>
    </div>`).join('');
  return `${fields}<button class="btn btn-outline-primary" type="button" data-term-add>Add more terms</button>`;
}

const SETUP_STEPS = [
  { section: 'seller', title: 'Seller information', intro: 'Add your business details. These appear at the top of every invoice.' },
  { section: 'bank', title: 'Bank & UPI', intro: 'Add payment details so customers know how to pay you.' },
  { section: 'sign', title: 'Signature', intro: 'Add a signature image and the name shown below it.' },
  { section: 'terms', title: 'Terms & conditions', intro: 'Add the terms that should appear on your invoices.' }
];
let edSec = null;
let setupWizard = false;
let setupStep = 0;

function highlightEditorSection(sec) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navSec = sec === 'customer' ? 'customerDirectory' : sec;
  const navBtn = sec === 'invoiceArchive'
    ? $('#nav-invoice-archive')
    : document.querySelector(`.nav-item[data-edit="${navSec}"]`);
  if (navBtn) navBtn.classList.add('active');
  const setupSubmenu = $('#businessSetupSubmenu');
  const activeSetupSection = Boolean(navBtn?.closest('#businessSetupSubmenu'));
  const setupCollapse = bootstrap.Collapse.getOrCreateInstance(setupSubmenu, { toggle: false });
  if (activeSetupSection) setupCollapse.show();
}

// Load a saved quotation into the Generate Invoice page, either to change it or to turn it into a tax invoice.
function openQuotationInEditor(record, mode) {
  if (!record || record.status !== 'quotation') return;
  if (mode === 'convert' && record.snapshot?.convertedTo
    && !confirm(`This quotation was already turned into invoice ${record.snapshot.convertedTo}. Create another invoice from it?`)) return;
  const snapshot = normalizeTerms(structuredClone(record.snapshot));
  leaveArchivePreview();
  applyUiLanguage(snapshot.lang || 'en');   // open it in the language it was written in
  S = snapshot;
  S.lang = uiLang;
  if (mode === 'convert') {
    delete S.convertedTo;
    const today = todayISO();
    S.docType = 'invoice';
    S.quoteRef = record.invoiceNo;
    S.meta.date = today;
    S.meta.due = '';
    delete S.meta.valid;
    S.meta.no = nextInvoiceNumber(today, { quote: false });
  } else {
    S.docType = 'quotation';
    delete S.quoteRef;
  }
  save();
  showGeneratePage();
  render();
  showInvoiceToast(mode === 'convert'
    ? `Quotation ${record.invoiceNo} is ready as invoice ${S.meta.no}. Check it, then use Invoice Actions to save.`
    : `Editing quotation ${record.invoiceNo}. Saving it replaces the saved quotation.`);
}

function leaveArchivePreview() {
  if (!archivePreviewInvoice) return;
  S = archivePreviewOriginalState;
  archivePreviewInvoice = null;
  archivePreviewOriginalState = null;
  archivePreviewEditing = false;
  document.body.classList.remove('invoice-preview-editing');
  const drawer = $('#invoicePreviewDrawer');
  drawer.classList.remove('is-open');
  drawer.classList.remove('is-editing');
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');
  const backdrop = $('#invoicePreviewBackdrop');
  backdrop.classList.remove('is-open');
  backdrop.hidden = true;
  $('#archivePreviewSheets').innerHTML = '';
  render();
}

function setArchivePreviewEditing(editing) {
  // Only drafts can be edited; saved invoices are read-only.
  if (editing && archivePreviewInvoice?.status !== 'draft') return;
  archivePreviewEditing = editing;
  const drawer = $('#invoicePreviewDrawer');
  drawer.classList.toggle('is-editing', editing);
  document.body.classList.toggle('invoice-preview-editing', editing);
  $('#invoicePreviewReadActions').hidden = editing;
  $('#invoicePreviewEditActions').hidden = !editing;
  $('#invoicePreviewSaveStatus').hidden = true;
  if (!editing && archivePreviewInvoice) {
    S = normalizeTerms(structuredClone(archivePreviewInvoice.snapshot));
    openQuantityMenuRow = -1;
    openCustomQuantityRow = -1;
    render();
  }
}

// Title, intro and buttons of the invoice preview drawer for one record.
function updateArchivePreviewHeader(record) {
  const isDraft = record.status === 'draft';
  const quote = record.status === 'quotation' || record.snapshot?.docType === 'quotation';
  const word = quote ? 'quotation' : 'invoice';
  const customer = record.customerName || 'customer';
  $('#invoicePreviewTitle').textContent = isDraft ? `Draft ${word}` : `${quote ? 'Quotation' : 'Invoice'} ${record.invoiceNo}`;
  $('#invoicePreviewIntro').textContent = isDraft
    ? `Draft ${word} for ${customer}. It gets its number when you save and print it.`
    : quote ? `Quotation for ${customer}.` : `Saved invoice for ${customer}.`;
  $('#btnSaveDraftArchivedInvoice').hidden = !isDraft;
  $('#btnSavePrintDraftInvoice').hidden = !isDraft;
  $('#btnPrintArchivedInvoice').hidden = isDraft;
  $('#btnEditArchivedInvoice').hidden = !isDraft;
  $('#btnEditQuotation').hidden = record.status !== 'quotation';
  $('#btnConvertQuotation').hidden = record.status !== 'quotation';
  $('#btnPrintArchivedInvoice').textContent = quote ? 'Print Quotation' : 'Print Invoice';
  $('#btnSavePrintDraftInvoice').textContent = quote ? 'Save & Print Quotation' : 'Save & Print Invoice';
  $('#btnSavePrintArchivedInvoice').textContent = quote ? 'Save & Print Quotation' : 'Save & Print Invoice';
}

function viewArchivedInvoice(index) {
  const record = archivedInvoices[index];
  if (!record) return;
  if (archivePreviewInvoice) leaveArchivePreview();
  archivePreviewOriginalState = S;
  archivePreviewInvoice = record;
  archivePreviewEditing = false;
  S = normalizeTerms(structuredClone(record.snapshot));
  renderInto($('#archivePreviewSheets'));
  updateArchivePreviewHeader(record);
  const drawer = $('#invoicePreviewDrawer');
  drawer.inert = false;
  drawer.classList.remove('is-editing');
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.add('is-open');
  const backdrop = $('#invoicePreviewBackdrop');
  backdrop.hidden = false;
  document.body.classList.remove('invoice-preview-editing');
  $('#invoicePreviewReadActions').hidden = false;
  $('#invoicePreviewEditActions').hidden = true;
  $('#invoicePreviewSaveStatus').hidden = true;
  requestAnimationFrame(() => backdrop.classList.add('is-open'));
  requestAnimationFrame(() => $('#btnPrintArchivedInvoice').focus());
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  $('#nav-invoice-archive').classList.add('active');
}

// Choose the language for the app screens and the current invoice / quotation.
function setLanguage(code) {
  if (archivePreviewInvoice) { const box = $('#langSelect'); if (box) box.value = uiLang; return; }
  applyUiLanguage(code);
  S.lang = code;
  save();
  render();
  if (!$('#dashboardPage').hidden && edSec) openEditor(edSec);
  else syncQuotationToggle();
}
document.addEventListener('change', e => {
  if (e.target.id === 'langSelect') setLanguage(e.target.value);
});

// Keep the Quotation switch, copies box and page title in step with the current document.
function syncQuotationToggle() {
  if (archivePreviewInvoice) return;
  const quote = isQuotation();
  const toggle = $('#quoteToggle');
  if (toggle) toggle.checked = quote;
  const langSelect = $('#langSelect');
  if (langSelect) langSelect.value = uiLang;
  const copies = document.querySelector('.topbar-copies-setting');
  if (copies) copies.hidden = quote;
  if (!$('#sheets').hidden) {
    $('#topbarTitle').textContent = quote ? 'Quotation Preview' : 'Tax Invoice Preview';
    $('#topbarIntro').textContent = quote ? 'Create and preview your quotation.' : 'Create and preview your GST invoice.';
  }
}
document.addEventListener('change', e => {
  if (e.target.id === 'quoteToggle') setDocType(e.target.checked ? 'quotation' : 'invoice');
});

function showGeneratePage() {
  resetDashboardCsvImport();
  leaveArchivePreview();
  setupWizard = false;
  $('#dashboardPage').hidden = true;
  $('#sheets').hidden = false;
  $('#topbarTitle').textContent = isQuotation() ? 'Quotation Preview' : 'Tax Invoice Preview';
  $('#topbarIntro').textContent = isQuotation() ? 'Create and preview your quotation.' : 'Create and preview your GST invoice.';
  document.title = 'Generate Invoice | GST Invoice Generator';
  document.body.classList.remove('dashboard-mode');
  refreshCsvConnectionStatus();
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  $('#nav-generate').classList.add('active');
  bootstrap.Collapse.getOrCreateInstance($('#businessSetupSubmenu'), { toggle: false }).hide();
}

function openEditor(sec) {
  resetDashboardCsvImport();
  leaveArchivePreview();
  setupWizard = false;
  edSec = sec;
  $('#dashboardPage').hidden = false;
  $('#sheets').hidden = true;
  const pageTitle = sec === 'seller' ? 'Seller Info'
    : sec === 'bank' ? 'Bank & UPI'
      : sec === 'terms' ? 'Terms & Conditions'
        : sec === 'customerDirectory' ? 'Customer Details'
          : sec === 'itemDirectory' ? 'Item Details'
            : sec === 'invoiceTemplates' ? 'Invoice Templates'
            : sec === 'backup' ? 'Backup & Restore'
            : sec === 'invoiceArchive' ? 'View All Invoices'
                : SECT[sec]?.[0] || 'Invoice Settings';
  document.title = `${pageTitle} | GST Invoice Generator`;
  document.body.classList.add('dashboard-mode');
  const descriptions = {
    seller: 'Manage your business identity and contact details shown on invoices.',
    meta: 'Set the invoice number, dates, and place of supply.',
    customer: 'Edit the customer details for this invoice.',
    customerDirectory: 'Import, add, edit, and manage customers saved in your local directory.',
    itemDirectory: 'Import, add, edit, and manage products and services in your local catalog.',
    invoiceArchive: 'Search, preview, and manage saved invoice records.',
    invoiceTemplates: 'Pick the invoice layout and style used for new invoices.',
    backup: 'Download a ZIP of all your CSV files, restore from one, and set a backup reminder.',
    bank: 'Manage bank transfer and UPI payment details printed on invoices.',
    sign: 'Choose a signature image and the name shown below it.',
    terms: 'Manage the terms and conditions shown on invoices.'
  };
  highlightEditorSection(sec);
  $('#topbarTitle').textContent = sec === 'seller' ? 'Seller Info'
    : sec === 'bank' ? 'Bank & UPI'
      : sec === 'customerDirectory' ? 'Customer Details'
    : sec === 'itemDirectory' ? 'Item Details'
    : sec === 'invoiceTemplates' ? 'Invoice Templates'
    : sec === 'backup' ? 'Backup & Restore'
    : sec === 'invoiceArchive' ? 'View All Invoices'
    : sec === 'terms' ? 'Terms & Conditions'
        : SECT[sec]?.[0] || 'Invoice settings';
  $('#topbarIntro').textContent = descriptions[sec] || '';
  const content = sec === 'items' ? itemsEditor()
    : sec === 'seller' || sec === 'bank' || sec === 'terms' ? profileDirectoryHTML(sec)
      : sec === 'customerDirectory' ? customerDirectoryHTML()
        : sec === 'itemDirectory' ? itemDirectoryHTML()
          : sec === 'invoiceTemplates' ? invoiceTemplatesHTML()
          : sec === 'backup' ? backupPageHTML()
          : sec === 'invoiceArchive' ? invoiceArchiveHTML()
          : SECT[sec][1].map(field => fieldHTML(sec, field)).join('') + (sec === 'meta' ? numberingSettingsHTML() : '');
  refreshCsvConnectionStatus();
  $('#edBody').innerHTML = `<section class="dashboard-card">${content}</section>`;
  if (sec === 'invoiceTemplates') fitTemplatePreviews();
  updateBackupReminder();
  // The CSV import panel is hidden by default. A "Show CSV import" button in the top right of the "Add …" card opens it inside that card, under the form fields.
  const csvImportControls = $('#edBody .customer-import-controls');
  const addHeading = $('#edBody .customer-add-form .customer-directory-heading');
  if (csvImportControls && addHeading) {
    const panel = document.createElement('div');
    panel.id = 'dashboardCsvImport';
    panel.className = 'dashboard-csv-import';
    panel.hidden = true;
    panel.append(csvImportControls);
    addHeading.closest('form').append(panel);   // inside the same card, under the form fields
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'btnToggleCsvImport';
    toggle.className = 'btn btn-sm btn-outline-secondary csv-import-toggle';
    toggle.setAttribute('aria-controls', 'dashboardCsvImport');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Show CSV import';
    addHeading.append(toggle);
  }
}

function resetDashboardCsvImport() {
  // The import panel and its button are rebuilt together with the page, so there is nothing left over to clear.
}

function renderSetupStep(message = '') {
  resetDashboardCsvImport();
  setupWizard = true;
  $('#dashboardPage').hidden = false;
  $('#sheets').hidden = true;
  document.title = 'Business Setup | GST Invoice Generator';
  document.body.classList.add('dashboard-mode');
  const step = SETUP_STEPS[setupStep];
  edSec = step.section;
  highlightEditorSection(step.section);
  $('#topbarTitle').textContent = `Set up your invoice · ${setupStep + 1} of ${SETUP_STEPS.length}`;
  $('#topbarIntro').textContent = step.intro;
  refreshCsvConnectionStatus();
  const fields = step.section === 'terms'
    ? termsEditor()
    : SECT[step.section][1].map(field => fieldHTML(step.section, field)).join('');
  const back = setupStep > 0 ? '<button class="btn btn-outline-secondary" type="button" data-setup-back>Back</button>' : '<span></span>';
  const forward = setupStep === SETUP_STEPS.length - 1
    ? '<button class="btn btn-primary" type="button" data-setup-finish>Finish setup</button>'
    : '<button class="btn btn-primary" type="button" data-setup-next>Next</button>';
  $('#edBody').innerHTML = `
    <section class="dashboard-card setup-wizard-page">
    <div class="setup-wizard-content">
      <div class="setup-wizard-progress" aria-label="Setup progress">
        ${SETUP_STEPS.map((item, index) => `<span class="${index <= setupStep ? 'active' : ''}"></span>`).join('')}
      </div>
      ${fields}
    </div>
    <div class="setup-wizard-footer">
      <div class="setup-wizard-error" role="alert">${esc(message)}</div>
      <div class="setup-wizard-actions">${back}<button class="btn btn-link" type="button" data-setup-later>Do this later</button>${forward}</div>
    </div>
    </section>
  `;
}

function showSetupStepError(message, section = setupStep) {
  if (section !== setupStep) setupStep = section;
  renderSetupStep(message);
  if (setupStep === 0) $('#edBody [data-p="seller.name"]').focus();
}

function validateSetupStep() {
  const invalidPattern = [...$('#edBody').querySelectorAll('[data-re]')].find(input => {
    if (!input.value) return false;
    const pattern = input.dataset.re === 'g' ? GST_RE : IFSC_RE;
    const invalid = !pattern.test(input.value.toUpperCase());
    input.classList.toggle('is-invalid', invalid);
    return invalid;
  });
  if (invalidPattern) {
    invalidPattern.focus();
    $('#edBody .setup-wizard-error').textContent = 'Check the highlighted GSTIN or IFSC format before continuing.';
    return false;
  }
  if (setupStep === 0) {
    const required = ['seller.name', 'seller.addr', 'seller.state'];
    const missing = required.map(path => $(`#edBody [data-p="${path}"]`)).filter(input => !input?.value.trim());
    if (missing.length) {
      missing.forEach(input => input?.classList.add('is-invalid'));
      missing[0]?.focus();
      $('#edBody .setup-wizard-error').textContent = 'Enter your business name, address, and seller state to continue.';
      return false;
    }
  }
  return true;
}

function openSetupWizard() {
  setupStep = 0;
  renderSetupStep();
}

/* ---------- events ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('#btnToggleCsvImport')) {
    const importSection = $('#dashboardCsvImport');
    importSection.hidden = !importSection.hidden;
    const expanded = !importSection.hidden;
    t.closest('#btnToggleCsvImport').textContent = expanded ? 'Hide CSV import' : 'Show CSV import';
    t.closest('#btnToggleCsvImport').setAttribute('aria-expanded', String(expanded));
    return;
  }
  const surface = invoiceSurface();
  const invoiceAction = t.closest('[data-invoice-action]');
  if (invoiceAction) {
    if (invoiceAction.dataset.invoiceAction === 'save-print') {
      if (await saveCurrentInvoiceToArchive('saved')) {
        archiveTab = isQuotation() ? 'quotation' : 'saved';
        printCurrentInvoice({ startNewAfter: true });   // saved first, then printed; a fresh invoice follows
      }
    } else if (invoiceAction.dataset.invoiceAction === 'save-draft') {
      if (await saveCurrentInvoiceToArchive('draft')) {
        archiveTab = isQuotation() ? 'quotation' : 'draft';
        archiveSearch = '';
        directoryPagination.invoice.page = 1;
        startNewInvoice();
      }
    }
    return;
  }
  const quantityToggle = t.closest('[data-quantity-toggle]');
  if (quantityToggle) {
    const row = +quantityToggle.dataset.quantityToggle;
    openCustomQuantityRow = -1;
    openQuantityMenuRow = openQuantityMenuRow === row ? -1 : row;
    render();
    return;
  }
  if (!t.closest('.quantity-unit-picker')) {
    surface.querySelectorAll('.quantity-unit-menu.show').forEach(menu => menu.classList.remove('show'));
    surface.querySelectorAll('.quantity-unit-picker.open').forEach(picker => picker.classList.remove('open'));
    surface.querySelectorAll('.quantity-unit-toggle[aria-expanded="true"]').forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
    openQuantityMenuRow = -1;
    openCustomQuantityRow = -1;
  }
  const pageButton = t.closest('[data-directory-page]');
  if (pageButton && !pageButton.disabled) {
    const [kind, page] = pageButton.dataset.directoryPage.split(':');
    directoryPagination[kind].page = Number(page);
    openEditor(kind === 'customer' ? 'customerDirectory' : kind === 'item' ? 'itemDirectory' : kind === 'invoice' ? 'invoiceArchive' : kind);
    return;
  }
  if (t.closest('[data-csv-help-connect]')) {
    const kind = t.closest('[data-csv-help-connect]').dataset.csvHelpConnect;
    if (kind === 'all') {
      await connectAllCsvs();
      return;
    }
    const connection = kind === 'customers' ? connectCustomerCsv()
      : kind === 'items' ? connectItemCsv()
        : connectProfileCsv(kind);
    bootstrap.Modal.getOrCreateInstance($('#csvHelpModal')).hide();
    await connection;
    return;
  }
  if (t.closest('#btnConnectAllCsv')) {
    showCsvHelp('all');
    return;
  }
  if (t.closest('#btnConfirmAction')) {
    const action = pendingActionConfirmation;
    pendingActionConfirmation = null;
    bootstrap.Modal.getOrCreateInstance('#actionConfirmModal').hide();
    if (action) await action();
    return;
  }
  if (t.closest('#btnConfirmInvoiceOverride')) {
    resolveInvoiceOverride(true);
    bootstrap.Modal.getOrCreateInstance($('#invoiceOverrideModal')).hide();
    return;
  }
  if (t.closest('[data-customer-drawer-close]') || t.id === 'customerDrawerBackdrop') {
    closeCustomerDrawer();
    return;
  }
  if (t.closest('[data-invoice-preview-close]') || t.id === 'invoicePreviewBackdrop') {
    leaveArchivePreview();
    openEditor('invoiceArchive');
    return;
  }
  if (t.closest('[data-directory-drawer-close]') || t.id === 'directoryDrawerBackdrop') {
    closeDirectoryDrawer();
    return;
  }
  if (t.closest('#btnSetup')) openSetupWizard();
  if (t.closest('[data-page="generate"]')) {
    showGeneratePage();
    return;
  }
  if (t.closest('[data-page="invoiceArchive"]')) {
    openEditor('invoiceArchive');
    return;
  }
  const itemDetailButton = t.closest('[data-item-detail]');
  if (itemDetailButton) {
    openItemDetail(+itemDetailButton.dataset.itemDetail);
    return;
  }
  if (t.closest('[data-item-detail-close]') || t.id === 'itemDetailBackdrop') {
    closeItemDetail();
    return;
  }
  if (t.closest('[data-item-detail-edit]')) {
    const index = itemDetailIndex;
    closeItemDetail();
    if (index >= 0) openDirectoryDrawer('item', index);
    return;
  }
  const customerDetailButton = t.closest('[data-customer-detail]');
  if (customerDetailButton) {
    openCustomerDetail(+customerDetailButton.dataset.customerDetail);
    return;
  }
  if (t.closest('[data-customer-detail-close]') || t.id === 'customerDetailBackdrop') {
    closeCustomerDetail();
    return;
  }
  if (t.closest('[data-customer-detail-edit]')) {
    const index = customerDetailIndex;
    closeCustomerDetail();
    if (index >= 0) openDirectoryDrawer('customer', index);
    return;
  }
  if (t.closest('[data-customer-detail-new]')) {
    if (customerDetailIndex >= 0) startInvoiceForCustomer(customerDetailIndex);
    return;
  }
  const customerInvoiceView = t.closest('[data-customer-invoice-view]');
  if (customerInvoiceView) {
    closeCustomerDetail();
    viewArchivedInvoice(+customerInvoiceView.dataset.customerInvoiceView);
    return;
  }
  const copyButton = t.closest('[data-copy-text]');
  if (copyButton) {
    navigator.clipboard?.writeText(copyButton.dataset.copyText).then(() => {
      copyButton.classList.add('is-copied');
      copyButton.title = 'Copied!';
      setTimeout(() => { copyButton.classList.remove('is-copied'); copyButton.title = 'Copy'; }, 1400);
    }).catch(error => console.warn('Could not copy to the clipboard.', error));
    return;
  }
  const waSendButton = t.closest('[data-wa-send]');
  if (waSendButton) {
    sendCustomerWhatsapp(+waSendButton.dataset.waSend, waSendButton);
    return;
  }
  const customerBulkButton = t.closest('[data-customer-bulk]');
  if (customerBulkButton) {
    const action = customerBulkButton.dataset.customerBulk;
    if (action === 'clear') {
      selectedCustomers.clear();
      refreshCustomerDirectory();
    } else if (action === 'whatsapp') {
      openCustomerWhatsapp();
    } else if (action === 'export') {
      exportSelectedCustomers();
    } else if (action === 'delete') {
      const count = selectedCustomers.size;
      confirmDestructiveAction({
        title: `Delete ${count} selected customer${count === 1 ? '' : 's'}?`,
        message: `${count === 1 ? 'This customer' : 'These customers'} will be deleted from the saved customers.csv file. Saved invoices are not affected.`,
        confirmLabel: 'Delete',
        action: () => bulkUpdateCustomers('delete')
      });
    } else {
      bulkUpdateCustomers(action);
    }
    return;
  }
  const bulkButton = t.closest('[data-item-bulk]');
  if (bulkButton) {
    const action = bulkButton.dataset.itemBulk;
    if (action === 'clear') {
      selectedItems.clear();
      refreshItemDirectory();
    } else if (action === 'gst') {
      bulkUpdateItems('gst', $('#bulkGstSelect').value);
    } else if (action === 'unit') {
      bulkUpdateItems('unit', $('#bulkUnitSelect').value);
    } else if (action === 'price' || action === 'stock') {
      openBulkModal(action);
    } else if (action === 'export') {
      exportSelectedItems();
    } else if (action === 'undo') {
      undoBulkItemChange();
    } else if (action === 'delete') {
      const count = selectedItems.size;
      confirmDestructiveAction({
        title: `Delete ${count} selected item${count === 1 ? '' : 's'}?`,
        message: `${count === 1 ? 'This item' : 'These items'} will be deleted from the saved items.csv file.`,
        confirmLabel: 'Delete',
        action: () => bulkUpdateItems('delete')
      });
    } else {
      bulkUpdateItems(action);
    }
    return;
  }
  const sortButton = t.closest('[data-table-sort]');
  if (sortButton) {
    const [kind, key] = sortButton.dataset.tableSort.split(':');
    const sort = tableSort[kind];
    // Click cycles: ascending → descending → unsorted.
    if (sort.key !== key) { sort.key = key; sort.dir = 'asc'; }
    else if (sort.dir === 'asc') sort.dir = 'desc';
    else sort.key = null;
    directoryPagination[kind].page = 1;
    if (kind === 'item') refreshItemDirectory();
    else if (kind === 'customer') refreshCustomerDirectory();
    else if (kind === 'invoice') refreshInvoiceArchive();
    else openEditor(kind);
    return;
  }
  const itemFilterCard = t.closest('[data-item-filter]');
  if (itemFilterCard) {
    itemFilter = itemFilterCard.dataset.itemFilter;
    directoryPagination.item.page = 1;
    refreshItemDirectory();
    return;
  }
  const customerFilterCard = t.closest('[data-customer-filter]');
  if (customerFilterCard) {
    customerFilter = customerFilterCard.dataset.customerFilter;
    directoryPagination.customer.page = 1;
    refreshCustomerDirectory();
    return;
  }
  const archiveTabButton = t.closest('[data-archive-tab]');
  if (archiveTabButton) {
    archiveTab = ['draft', 'quotation'].includes(archiveTabButton.dataset.archiveTab) ? archiveTabButton.dataset.archiveTab : 'saved';
    directoryPagination.invoice.page = 1;
    openEditor('invoiceArchive');
    return;
  }
  if (t.closest('[data-invoice-share]')) {
    const record = archivedInvoices[Number(t.closest('[data-invoice-share]').dataset.invoiceShare)];
    if (record && record.status !== 'draft') openShareInvoiceModal(record);
    return;
  }
  if (t.closest('#btnShareCopyImage')) {
    copyShareImage();
    return;
  }
  if (t.closest('[data-invoice-view]')) {
    viewArchivedInvoice(Number(t.closest('[data-invoice-view]').dataset.invoiceView));
    return;
  }
  if (t.closest('[data-invoice-delete]')) {
    const index = Number(t.closest('[data-invoice-delete]').dataset.invoiceDelete);
    const invoice = archivedInvoices[index];
    if (!invoice) return;
    confirmDestructiveAction({
      title: 'Delete this invoice?',
      message: `${invoiceLabel(invoice)}${invoice.customerName ? ` for ${invoice.customerName}` : ''} will be deleted from invoices.csv.`,
      confirmLabel: 'Delete Invoice',
      action: () => deleteArchivedInvoice(index)
    });
    return;
  }
  if (t.closest('#btnBackToInvoices')) {
    leaveArchivePreview();
    openEditor('invoiceArchive');
    return;
  }
  if (t.closest('#btnEditArchivedInvoice')) {
    setArchivePreviewEditing(true);
    return;
  }
  if (t.closest('#btnEditQuotation')) {
    openQuotationInEditor(archivePreviewInvoice, 'edit');
    return;
  }
  if (t.closest('#btnConvertQuotation')) {
    openQuotationInEditor(archivePreviewInvoice, 'convert');
    return;
  }
  if (t.closest('#btnCancelArchivedEdit')) {
    setArchivePreviewEditing(false);
    return;
  }
  if (t.closest('#btnSaveDraftArchivedInvoice')) {
    await saveArchivePreviewEditsAndPrint('draft');
    return;
  }
  if (t.closest('#btnSavePrintArchivedInvoice') || t.closest('#btnSavePrintDraftInvoice')) {
    await saveArchivePreviewEditsAndPrint('saved');
    return;
  }
  if (t.closest('#btnPrintArchivedInvoice')) {
    printCurrentInvoice();
    return;
  }
  if (t.closest('[data-setup-back]')) {
    setupStep = Math.max(0, setupStep - 1);
    renderSetupStep();
  }
  if (t.closest('[data-setup-next]')) {
    if (validateSetupStep()) {
      setupStep = Math.min(SETUP_STEPS.length - 1, setupStep + 1);
      renderSetupStep();
    }
  }
  if (t.closest('[data-setup-finish]')) {
    if (!validateSetupStep()) return;
    const missingSeller = ['name', 'addr', 'state'].some(key => !String(S.seller[key] ?? '').trim());
    if (missingSeller) {
      showSetupStepError('Complete your business name, address, and seller state before finishing.', 0);
      return;
    }
    try {
      await syncSetupProfiles();
    } catch (error) {
      console.error('Could not save setup profiles.', error);
      $('#edBody .setup-wizard-error').textContent = error.message;
      return;
    }
    if (!save()) {
      $('#edBody .setup-wizard-error').textContent = 'Your setup could not be saved. Check browser storage and try again.';
      return;
    }
    setupWizard = false;
    showGeneratePage();
    render();
  }
  if (t.closest('[data-setup-later]')) {
    try {
      await syncSetupProfiles();
    } catch (error) {
      console.error('Could not save setup profiles.', error);
      $('#edBody .setup-wizard-error').textContent = error.message;
      return;
    }
    setupWizard = false;
    showGeneratePage();
  }
  if (t.closest('[data-term-add]')) {
    S.terms.list.push('');
    save();
    render();
    if (setupWizard) renderSetupStep();
    else openEditor('terms');
  }
  if (t.closest('[data-term-remove]')) {
    const index = +t.closest('[data-term-remove]').dataset.termRemove;
    const term = S.terms.list[index];
    confirmDestructiveAction({
      title: 'Delete this term?',
      message: term ? `"${term}" will be deleted from your terms and conditions.` : 'This term will be deleted from your terms and conditions.',
      action: () => {
        S.terms.list.splice(index, 1);
        save();
        render();
        if (setupWizard) renderSetupStep();
        else openEditor('terms');
      }
    });
    return;
  }
  if (t.closest('[data-profile-template]')) {
    const kind = t.closest('[data-profile-template]').dataset.profileTemplate;
    try {
      downloadProfileTemplate(kind);
    } catch (error) {
      console.error('Could not download the profile CSV template.', error);
      const status = profileStatus(kind);
      status.className = 'customer-import-status error';
      status.textContent = 'Could not download the CSV template.';
    }
    return;
  }
  if (t.closest('[data-profile-edit]')) {
    const [kind, index] = t.closest('[data-profile-edit]').dataset.profileEdit.split(':');
    openProfileDrawer(kind, Number(index));
    return;
  }
  if (t.closest('[data-profile-delete]')) {
    const [kind, index] = t.closest('[data-profile-delete]').dataset.profileDelete.split(':');
    const profileIndex = Number(index);
    const profile = profileList(kind)[profileIndex];
    if (!profile) return;
    confirmDestructiveAction({
      title: `Delete this ${kind === 'terms' ? 'terms set' : `${kind} profile`}?`,
      message: `${profileTitle(kind, profile)} will be deleted from the saved ${kind === 'terms' ? 'terms sets' : `${kind} profiles`} CSV. Current invoice details will not change.`,
      action: () => deleteProfile(kind, profileIndex)
    });
    return;
  }
  if (t.closest('[data-profile-activate]')) {
    const [kind, index] = t.closest('[data-profile-activate]').dataset.profileActivate.split(':');
    activateProfile(kind, Number(index));
    return;
  }
  if (t.closest('[data-customer-edit]')) {
    openDirectoryDrawer('customer', +t.closest('[data-customer-edit]').dataset.customerEdit);
    return;
  }
  if (t.closest('[data-customer-remove]')) {
    const index = +t.closest('[data-customer-remove]').dataset.customerRemove;
    const customer = importedCustomers[index];
    if (!customer) return;
    confirmDestructiveAction({
      title: 'Delete this customer?',
      message: `${customer.name} will be deleted from the saved customers.csv file.`,
      action: () => removeCustomer(index)
    });
    return;
  }
  if (t.closest('[data-item-template]')) {
    try {
      downloadItemCsvTemplate();
    } catch (error) {
      console.error('Could not download the item CSV template.', error);
      const status = $('#itemImportStatus');
      status.className = 'customer-import-status error';
      status.textContent = 'Could not download the item CSV template.';
    }
    return;
  }
  if (t.closest('[data-item-edit]')) {
    openDirectoryDrawer('item', +t.closest('[data-item-edit]').dataset.itemEdit);
    return;
  }
  if (t.closest('[data-item-remove]')) {
    const index = +t.closest('[data-item-remove]').dataset.itemRemove;
    const item = catalogItems[index];
    if (!item) return;
    confirmDestructiveAction({
      title: 'Delete this item?',
      message: `${item.name} will be deleted from the saved items.csv file.`,
      action: () => removeCatalogItem(index)
    });
    return;
  }
  if (t.closest('[data-customer-template]')) {
    try {
      downloadCustomerCsv([], 'customers-template.csv');
    } catch (error) {
      console.error('Could not download the customer CSV template.', error);
      const status = $('#customerImportStatus');
      status.className = 'customer-import-status error';
      status.textContent = 'Could not download the CSV template.';
    }
  }
  const editTrigger = t.closest('[data-edit]');
  if (editTrigger?.dataset.edit === 'customer') {
    openCustomerDrawer('edit');
    return;
  }
  if (editTrigger) openEditor(editTrigger.dataset.edit);
  if (t.dataset.add) { S.items.push({ name: '', hsn: '', rate: 0, qty: 0, unit: S.items[0]?.unit || 'Nos', unitExplicit: false, gst: 18, disc: 0 }); save(); render(); openEditor('items'); }
  if (t.dataset.del) {
    const index = +t.dataset.del;
    const itemName = S.items[index]?.name.trim();
    confirmDestructiveAction({
      title: 'Delete this invoice item?',
      message: itemName ? `${itemName} and its quantity, rate, and tax will be deleted from this invoice.` : 'This item row will be deleted from this invoice.',
      action: () => {
        S.items.splice(index, 1);
        save();
        render();
        openEditor('items');
      }
    });
    return;
  }
  if (t.dataset.clear) {
    const [a, k] = t.dataset.clear.split('.');
    const label = k === 'logo' ? 'business logo' : 'signature image';
    confirmDestructiveAction({
      title: `Remove the ${label}?`,
      message: `The ${label} will be removed from your invoice details.`,
      action: () => {
        S[a][k] = null;
        save();
        render();
        if (setupWizard) renderSetupStep();
        else openEditor(edSec);
      }
    });
    return;
  }

  // Customer dropdown: select a saved customer
  if (t.closest('[data-custidx]')) {
    const idx = +t.closest('[data-custidx]').dataset.custidx;
    const dc = customerOptions()[idx];
    if (!dc) return;
    S.customer = structuredClone(dc);
    S.customer.priceList = normalizePriceList(dc.priceList);
    repriceInvoiceRows();   // the customer's price list decides the rates of rows already picked
    save(); render();
  }
  // Customer dropdown: add custom (clear fields first)
  if (t.closest('[data-custedit]')) {
    openCustomerDrawer('add');
    return;
  }
  if (t.closest('[data-custclear]')) {
    const customerName = S.customer.name.trim();
    confirmDestructiveAction({
      title: 'Clear the selected customer?',
      message: customerName
        ? `${customerName} and its details will be cleared from this invoice. Your saved customer records will not be affected.`
        : 'The customer details will be cleared from this invoice. Your saved customer records will not be affected.',
      confirmLabel: 'Clear Customer',
      action: () => {
        S.customer = structuredClone(EMPTY_STATE.customer);
        save();
        render();
      }
    });
    return;
  }

  const customQuantityTrigger = t.closest('[data-custom-quantity]');
  if (customQuantityTrigger) {
    const row = +customQuantityTrigger.dataset.customQuantity;
    openQuantityMenuRow = row;
    openCustomQuantityRow = row;
    render();
    invoiceSurface().querySelector(`[data-custom-quantity-input="${row}"]`)?.focus();
    return;
  }

  const quantityOption = t.closest('[data-quantity]');
  const unitOption = t.closest('[data-unit][data-row]');
  if (quantityOption || unitOption) {
    const option = quantityOption || unitOption;
    const row = +option.dataset.row;
    if (!S.items[row]) return;
    if (quantityOption) {
      S.items[row].qty = +quantityOption.dataset.quantity;
      openCustomQuantityRow = -1;
    } else {
      S.items[row].unit = option.dataset.unit;
      S.items[row].unitExplicit = true;
      S.items.forEach(item => {
        if (!item.unitExplicit) item.unit = option.dataset.unit;
      });
    }
    openQuantityMenuRow = shouldCloseQuantityMenu(row) ? -1 : row;
    save();
    render();
    return;
  }

  // Item dropdown: select a demo item
  if (t.closest('[data-itemidx]')) {
    const el = t.closest('[data-itemidx]');
    const j = +el.dataset.itemidx;
    const row = +el.dataset.itemrow;
    const di = itemOptions()[j];
    if (!di) return;
    S.items[row].name = di.name;
    S.items[row].hsn = di.hsn;
    S.items[row].rate = itemRateFor(di, S.customer?.priceList);
    S.items[row].unit = normalizeItemUnit(di.unit);
    S.items[row].unitExplicit = true;
    S.items[row].gst = normalizeItemGst(di.gst);
    if (!(+S.items[row].qty > 0)) S.items[row].qty = 1;   // every item starts with a quantity of 1
    save(); render();
  }
  // Item dropdown: custom item
  if (t.closest('[data-itemcustom]')) {
    const row = +t.closest('[data-itemcustom]').dataset.itemcustom;
    S.items[row] = { name: '', hsn: '', rate: 0, qty: S.items[row]?.qty || 1, unit: S.items[row]?.unit || S.items[0]?.unit || 'Nos', unitExplicit: S.items[row]?.unitExplicit || false, gst: S.items[row]?.gst || 18, disc: 0, custom: true };
    save(); render();
    const nameBox = document.querySelector(`[data-icustomname="${row}"]`);   // ready to type the name
    if (nameBox) nameBox.focus();
  }

  // Custom row: back to choosing from the list
  if (t.closest('[data-icustomback]')) {
    const row = +t.closest('[data-icustomback]').dataset.icustomback;
    const old = S.items[row] || {};
    S.items[row] = { name: '', hsn: '', rate: 0, qty: old.qty || 1, unit: old.unit || 'Nos', unitExplicit: false, gst: 18, disc: 0 };
    save(); render();
    return;
  }

  // Inline add row
  if (t.dataset.addrow || t.closest('[data-addrow]')) {
    S.items.push({ name: '', hsn: '', rate: 0, qty: 1, unit: S.items[0]?.unit || 'Nos', unitExplicit: false, gst: 18, disc: 0 });
    save(); render();
    // open the item list in the new row with the cursor in the search box
    const newInput = invoiceSurface().querySelector(`[data-itempick="${S.items.length - 1}"]`);
    if (newInput) { newInput.focus(); newInput.scrollIntoView({ block: 'nearest' }); }
    return;
  }

  // Inline delete row
  if (t.dataset.idel !== undefined || t.closest('[data-idel]')) {
    const el = t.dataset.idel !== undefined ? t : t.closest('[data-idel]');
    const idx = +el.dataset.idel;
    const itemName = S.items[idx]?.name.trim();
    confirmDestructiveAction({
      title: 'Delete this invoice item?',
      message: itemName ? `${itemName} and its quantity, rate, and tax will be deleted from this invoice.` : 'This item row will be deleted from this invoice.',
      action: () => {
        S.items.splice(idx, 1);
        if (S.items.length === 0) S.items.push({ name: '', hsn: '', rate: 0, qty: 0, unit: 'Nos', unitExplicit: false, gst: 18, disc: 0 });
        save();
        render();
      }
    });
  }

  // Close all dropdowns if clicking outside
  if (!t.closest('.cust-picker-wrap')) {
    invoiceSurface().querySelectorAll('.cust-dropdown.open').forEach(d => d.classList.remove('open'));
  }
  if (!t.closest('.item-picker-wrap')) {
    invoiceSurface().querySelectorAll('.item-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && openQuantityMenuRow >= 0) {
    const surface = invoiceSurface();
    surface.querySelectorAll('.quantity-unit-menu.show').forEach(menu => menu.classList.remove('show'));
    surface.querySelectorAll('.quantity-unit-picker.open').forEach(picker => picker.classList.remove('open'));
    surface.querySelectorAll('.quantity-unit-toggle[aria-expanded="true"]').forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
    openQuantityMenuRow = -1;
    openCustomQuantityRow = -1;
    return;
  }
  if (e.key === 'Enter' && e.target.dataset.customQuantityInput !== undefined) {
    e.preventDefault();
    const row = +e.target.dataset.customQuantityInput;
    const value = Number(e.target.value);
    const error = invoiceSurface().querySelector(`[data-custom-quantity-error="${row}"]`);
    if (!Number.isFinite(value) || value <= 0) {
      if (error) error.textContent = 'Enter a quantity greater than zero.';
      e.target.focus();
      return;
    }
    S.items[row].qty = value;
    openCustomQuantityRow = -1;
    openQuantityMenuRow = shouldCloseQuantityMenu(row) ? -1 : row;
    save();
    render();
    return;
  }
  if (e.key === 'Escape' && $('#customerDetailDrawer').classList.contains('is-open')) {
    closeCustomerDetail();
    return;
  }
  if (e.key === 'Escape' && $('#itemDetailDrawer').classList.contains('is-open')) {
    closeItemDetail();
    return;
  }
  if (e.key === 'Escape' && $('#directoryDrawer').classList.contains('is-open')) {
    closeDirectoryDrawer();
    return;
  }
  if (e.key === 'Escape' && $('#customerDrawer').classList.contains('is-open')) {
    closeCustomerDrawer();
    return;
  }
  if (e.key === 'Escape' && $('#invoicePreviewDrawer').classList.contains('is-open')) {
    if (archivePreviewEditing) setArchivePreviewEditing(false);
    else {
      leaveArchivePreview();
      openEditor('invoiceArchive');
    }
  }
});

// Open/filter customer dropdown
document.addEventListener('input', e => {
  const surface = invoiceSurface();
  if (e.target.dataset.customQuantityInput !== undefined) {
    const row = +e.target.dataset.customQuantityInput;
    const value = Number(e.target.value);
    const error = surface.querySelector(`[data-custom-quantity-error="${row}"]`);
    if (!Number.isFinite(value) || value <= 0) {
      if (error) error.textContent = e.target.value ? 'Enter a quantity greater than zero.' : '';
      return;
    }
    if (error) error.textContent = '';
    S.items[row].qty = value;
    save();
    const unit = QUANTITY_UNITS.includes(S.items[row].unit) ? S.items[row].unit : 'Nos';
    const toggleLabel = surface.querySelector(`[data-quantity-toggle="${row}"] .quantity-unit-label`);
    const printQuantity = surface.querySelectorAll('.print-only-td')[row];
    if (toggleLabel) toggleLabel.textContent = `${value} ${unit}`;
    if (printQuantity) printQuantity.textContent = `${value} ${unit}`;
    return;
  }
  if (e.target.dataset.custpick) {
    const val = e.target.value.toLowerCase();
    const dd = e.target.nextElementSibling;
    dd.classList.add('open');
    dd.querySelectorAll('.cust-option[data-custidx]').forEach(opt => {
      const name = (customerOptions()[+opt.dataset.custidx]?.name || '').toLowerCase();
      opt.style.display = name.includes(val) ? '' : 'none';
    });
  }
  // Open/filter item dropdown
  if (e.target.dataset.itempick !== undefined) {
    const row = +e.target.dataset.itempick;
    S.items[row].name = e.target.value;
    save();
    const val = e.target.value.toLowerCase();
    const dd = e.target.nextElementSibling;
    dd.classList.add('open');
    dd.querySelectorAll('.item-dd-opt[data-itemidx]').forEach(opt => {
      const name = (itemOptions()[+opt.dataset.itemidx]?.name || '').toLowerCase();
      opt.style.display = name.includes(val) ? '' : 'none';
    });
  }
});

document.addEventListener('focusout', e => {
  if (e.target.dataset.customQuantityInput === undefined) return;
  const row = +e.target.dataset.customQuantityInput;
  setTimeout(() => {
    const surface = invoiceSurface();
    const input = surface.querySelector(`[data-custom-quantity-input="${row}"]`);
    if (!input || surface.querySelector('.quantity-unit-menu.show')) return;
    openCustomQuantityRow = -1;
    render();
  }, 0);
});

// Show dropdown on focus
document.addEventListener('focusin', e => {
  if (e.target.dataset.custpick) {
    const dd = e.target.nextElementSibling;
    dd.classList.add('open');
    dd.querySelectorAll('.cust-option[data-custidx]').forEach(opt => {
      const name = (customerOptions()[+opt.dataset.custidx]?.name || '').toLowerCase();
      opt.style.display = name.includes(e.target.value.toLowerCase()) ? '' : 'none';
    });
  }
  if (e.target.dataset.itempick !== undefined) {
    const dd = e.target.nextElementSibling;
    dd.classList.add('open');
    dd.querySelectorAll('.item-dd-opt[data-itemidx]').forEach(opt => {
      const name = (itemOptions()[+opt.dataset.itemidx]?.name || '').toLowerCase();
      opt.style.display = name.includes(e.target.value.toLowerCase()) ? '' : 'none';
    });
  }
});

/* ----- one look for every dropdown -----
   Every <select> in the app opens the same white list as the discount suggestions. The real <select> stays in the page
   (it keeps the value, the keyboard focus and the change events), and only its pop-up is replaced. Phones and tablets keep
   their own native picker. Put data-native-select on a <select> to keep the browser's list for it. */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let selectMenu = null;
let selectMenuOwner = null;
let selectMenuIndex = -1;

function closeSelectMenu() {
  if (selectMenu) selectMenu.remove();
  selectMenu = null;
  selectMenuOwner = null;
  selectMenuIndex = -1;
}

const selectUsesMenu = select => Boolean(select) && select.tagName === 'SELECT' && finePointer.matches && !select.disabled
  && !select.multiple && !(select.size > 1) && !select.hasAttribute('data-native-select');

function selectMenuButtons() {
  return selectMenu ? [...selectMenu.querySelectorAll('.disc-menu-item:not(:disabled)')] : [];
}

function highlightSelectMenuItem(index) {
  const buttons = selectMenuButtons();
  if (!buttons.length) return;
  selectMenuIndex = (index + buttons.length) % buttons.length;
  buttons.forEach((button, position) => button.classList.toggle('is-highlight', position === selectMenuIndex));
  buttons[selectMenuIndex].scrollIntoView({ block: 'nearest' });
}

function placeSelectMenu() {
  if (!selectMenu || !selectMenuOwner) return;
  if (!selectMenuOwner.isConnected) { closeSelectMenu(); return; }
  const rect = selectMenuOwner.getBoundingClientRect();
  const height = selectMenu.offsetHeight;
  const roomBelow = window.innerHeight - rect.bottom - 8;
  const above = height > roomBelow && rect.top > roomBelow;
  selectMenu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - selectMenu.offsetWidth - 8))}px`;
  selectMenu.style.top = `${above ? Math.max(8, rect.top - height - 4) : rect.bottom + 4}px`;
}

function openSelectMenu(select) {
  closeSelectMenu();
  closeDiscountMenu();
  const choices = [...select.options].map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.hidden && !(option.disabled && option.value === ''));   // leave out empty placeholders
  if (!choices.length) return;
  const menu = document.createElement('div');
  menu.className = 'disc-menu select-menu no-print';
  menu.setAttribute('role', 'listbox');
  menu.innerHTML = choices.map(({ option, index }) => `<button type="button" role="option" tabindex="-1" class="disc-menu-item ${option.selected ? 'is-active' : ''}" data-select-index="${index}" ${option.disabled ? 'disabled' : ''}>${esc(option.textContent.trim())}</button>`).join('');
  const rect = select.getBoundingClientRect();
  menu.style.minWidth = `${Math.max(rect.width, 96)}px`;
  menu.style.visibility = 'hidden';
  document.body.appendChild(menu);
  selectMenu = menu;
  selectMenuOwner = select;
  placeSelectMenu();
  menu.style.visibility = '';
  const activeIndex = selectMenuButtons().findIndex(button => button.classList.contains('is-active'));
  highlightSelectMenuItem(activeIndex >= 0 ? activeIndex : 0);
}

function chooseSelectOption(index) {
  const select = selectMenuOwner;
  closeSelectMenu();
  if (!select || !select.isConnected || select.selectedIndex === index) return;
  select.selectedIndex = index;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

document.addEventListener('mousedown', e => {
  if (e.button !== 0 || e.target.closest?.('.select-menu')) return;
  const select = e.target.closest?.('select');
  if (!selectUsesMenu(select)) { if (selectMenu) closeSelectMenu(); return; }
  e.preventDefault();                       // stops the browser's own list from opening
  select.focus();
  if (selectMenu && selectMenuOwner === select) closeSelectMenu();
  else openSelectMenu(select);
}, true);

document.addEventListener('click', e => {
  const item = e.target.closest?.('.select-menu .disc-menu-item');
  if (item) { chooseSelectOption(Number(item.dataset.selectIndex)); return; }
  if (selectMenu && !e.target.closest?.('.select-menu') && !(selectUsesMenu(e.target.closest?.('select')))) closeSelectMenu();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && selectMenu) { closeSelectMenu(); return; }
  const select = e.target.closest?.('select');
  if (selectMenu && selectMenuOwner === select) {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlightSelectMenuItem(selectMenuIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlightSelectMenuItem(selectMenuIndex - 1); }
    else if (e.key === 'Home') { e.preventDefault(); highlightSelectMenuItem(0); }
    else if (e.key === 'End') { e.preventDefault(); highlightSelectMenuItem(selectMenuButtons().length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const button = selectMenuButtons()[selectMenuIndex];
      if (button) chooseSelectOption(Number(button.dataset.selectIndex)); else closeSelectMenu();
    } else if (e.key === 'Escape' || e.key === 'Tab') closeSelectMenu();
    return;
  }
  if (selectUsesMenu(select) && (e.key === ' ' || e.key === 'Enter' || e.key === 'F4' || (e.altKey && e.key === 'ArrowDown'))) {
    e.preventDefault();
    openSelectMenu(select);
  }
});

document.addEventListener('focusout', e => {
  if (selectMenu && e.target === selectMenuOwner) closeSelectMenu();
});
window.addEventListener('resize', placeSelectMenu);
window.addEventListener('scroll', e => { if (!e.target.closest?.('.select-menu') && selectMenu) placeSelectMenu(); }, true);

/* ----- invoice discount: live while typing, % / ₹ switch, quick chips, clear ----- */
// Suggestions that drop down under the discount box. The box itself stays as it is, so a value can still be typed.
const DISCOUNT_SUGGESTIONS = { percent: [5, 10, 15, 20], amount: [50, 100, 250, 500, 1000] };
let discountMenu = null;
let discountMenuMuted = false;   // true while the code itself puts the cursor back in the box

function closeDiscountMenu() {
  if (discountMenu) discountMenu.remove();
  discountMenu = null;
}

function openDiscountMenu(box) {
  if (discountMenuMuted || !box) return;
  closeDiscountMenu();
  const type = S.discount?.type === 'amount' ? 'amount' : 'percent';
  const current = Number(S.discount?.value);
  const menu = document.createElement('div');
  menu.className = 'disc-menu no-print';
  menu.setAttribute('role', 'listbox');
  menu.innerHTML = DISCOUNT_SUGGESTIONS[type].map(n => `<button type="button" role="option" tabindex="-1" class="disc-menu-item ${current === n ? 'is-active' : ''}" data-disc-option="${n}">${type === 'percent' ? `${n}%` : `₹${n.toLocaleString('en-IN')}`}</button>`).join('');
  const rect = box.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.minWidth = `${Math.max(rect.width, 96)}px`;
  document.body.appendChild(menu);
  discountMenu = menu;
}

function setDiscount(changes) {
  S.discount = { type: 'percent', value: '', ...(S.discount || {}), ...changes };
  save();
  render();
}

document.addEventListener('input', e => {
  const box = e.target.closest?.('[data-disc="value"]');
  if (!box) return;
  const caret = box.selectionStart ?? box.value.length;
  let text = box.value.replace(/[^0-9.]/g, '');
  const firstDot = text.indexOf('.');
  if (firstDot >= 0) text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, '');
  S.discount = { type: 'percent', value: '', ...(S.discount || {}), value: text };
  closeDiscountMenu();
  save();
  render();
  const fresh = document.querySelector('[data-disc="value"]');   // the sheet was rebuilt, so put the cursor back
  if (fresh) {
    discountMenuMuted = true;
    fresh.focus();
    discountMenuMuted = false;
    const position = Math.min(caret - (box.value.length - text.length), text.length);
    fresh.setSelectionRange(position, position);
  }
});

document.addEventListener('focusin', e => {
  if (e.target.matches?.('[data-disc="value"]')) openDiscountMenu(e.target);
});
document.addEventListener('focusout', e => {
  if (e.target.matches?.('[data-disc="value"]') && !discountMenuMuted) closeDiscountMenu();
});
document.addEventListener('mousedown', e => {
  if (e.target.closest?.('.disc-menu')) e.preventDefault();   // keep the cursor in the box while an option is clicked
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' || e.key === 'Tab') closeDiscountMenu();
});
// The list stays attached to the box when the page scrolls or resizes.
function placeDiscountMenu() {
  const box = document.querySelector('[data-disc="value"]');
  if (!discountMenu) return;
  if (!box) { closeDiscountMenu(); return; }
  const rect = box.getBoundingClientRect();
  discountMenu.style.left = `${rect.left}px`;
  discountMenu.style.top = `${rect.bottom + 4}px`;
}
window.addEventListener('resize', placeDiscountMenu);
window.addEventListener('scroll', placeDiscountMenu, true);

document.addEventListener('click', e => {
  const option = e.target.closest?.('[data-disc-option]');
  if (option) {
    const type = S.discount?.type === 'amount' ? 'amount' : 'percent';
    closeDiscountMenu();
    setDiscount({ type, value: option.dataset.discOption });
    return;
  }
  if (e.target.matches?.('[data-disc="value"]')) { if (!discountMenu) openDiscountMenu(e.target); return; }
  if (!e.target.closest?.('.disc-menu')) closeDiscountMenu();
  const typeButton = e.target.closest?.('[data-disc-type]');
  if (typeButton) {
    const type = typeButton.dataset.discType === 'amount' ? 'amount' : 'percent';
    if ((S.discount?.type || 'percent') === type) return;
    const current = calc();   // keep the same discount when switching between % and ₹
    const value = type === 'amount' ? (S.discount?.basis === 'final' ? current.billDiscount : current.discount) : current.discountPercent;
    setDiscount({ type, value: value ? String(+value.toFixed(type === 'amount' ? 2 : 4)) : '' });
    return;
  }
  const basisButton = e.target.closest?.('[data-disc-basis]');
  if (basisButton) {
    const basis = basisButton.dataset.discBasis === 'final' ? 'final' : 'taxable';
    if ((S.discount?.basis || 'taxable') !== basis) setDiscount({ basis });   // the rupees typed keep their number; what they apply to changes
    return;
  }
  const chip = e.target.closest?.('[data-disc-chip]');
  if (chip) { setDiscount({ type: 'percent', value: chip.dataset.discChip }); return; }
  if (e.target.closest?.('[data-disc-clear]')) setDiscount({ value: '' });
});

// Inline qty and GST changes
document.addEventListener('change', e => {
  if (e.target.dataset.icustomname !== undefined) {
    S.items[+e.target.dataset.icustomname].name = e.target.value.trim();
    save(); render();
  }
  if (e.target.dataset.ihsn !== undefined) {
    S.items[+e.target.dataset.ihsn].hsn = e.target.value;
    save(); render();
  }
  if (e.target.dataset.irate !== undefined) {
    const item = S.items[+e.target.dataset.irate];
    const displayedRate = e.target.value === '' ? '' : +e.target.value;
    item.rate = displayedRate === '' ? '' : displayedRate * (S.priceMode === 'incl' ? 1 + (+item.gst || 0) / 100 : 1);
    save(); render();
  }
  if (e.target.dataset.ivalue !== undefined) {
    const item = S.items[+e.target.dataset.ivalue];
    if (e.target.value === '') {
      item.rate = '';
    } else if (!(+item.qty > 0)) {
      alert('Set the item quantity before editing its value.');
      render();
      return;
    } else {
      const taxableValue = +e.target.value;
      const amountBeforeTax = S.priceMode === 'incl'
        ? taxableValue * (1 + (+item.gst || 0) / 100)
        : taxableValue;
      item.rate = (amountBeforeTax + (+item.disc || 0)) / +item.qty;
    }
    save(); render();
  }
  if (e.target.dataset.iqty !== undefined) {
    S.items[+e.target.dataset.iqty].qty = +e.target.value || 0;
    save(); render();
  }
  if (e.target.dataset.igst !== undefined) {
    S.items[+e.target.dataset.igst].gst = +e.target.value;
    save(); render();
  }
  if (e.target.dataset.meta) {
    S.meta[e.target.dataset.meta] = e.target.value;
    if (e.target.dataset.meta === 'date') syncInvoiceNumberWithDate();
    save(); render();
  }
});

$('#edBody').addEventListener('submit', e => {
  if (e.target.id === 'profileAddForm') {
    e.preventDefault();
    saveProfileForm(e.target.dataset.profileForm, e.target);
    return;
  }
  if (e.target.id === 'itemAddForm') {
    e.preventDefault();
    if (e.target.reportValidity()) addCatalogItem(e.target);
    return;
  }
  if (e.target.id !== 'customerAddForm') return;
  e.preventDefault();
  if (!e.target.reportValidity()) return;
  addCustomerFromForm(e.target);
});

$('#invoiceCustomerForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!e.target.reportValidity()) return;
  saveInvoiceCustomer(e.target);
});

$('#directoryDrawerForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!e.target.reportValidity()) return;
  if (directoryDrawerKind === 'customer') saveCustomerEdit(directoryDrawerIndex);
  else if (directoryDrawerKind === 'item') saveCatalogItemEdit(directoryDrawerIndex);
  else if (directoryDrawerKind?.startsWith('profile:')) {
    saveProfileEdit(directoryDrawerKind.slice('profile:'.length), directoryDrawerIndex);
  }
});

$('#edBody').addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.customerSelect !== undefined) {
    const index = +t.dataset.customerSelect;
    if (t.checked) selectedCustomers.add(index); else selectedCustomers.delete(index);
    refreshCustomerDirectory();
  } else if (t.dataset.customerSelectAll !== undefined) {
    t.dataset.customerSelectAll.split(',').filter(Boolean).map(Number)
      .forEach(index => (t.checked ? selectedCustomers.add(index) : selectedCustomers.delete(index)));
    refreshCustomerDirectory();
  } else if (t.dataset.customerToggle !== undefined) {
    toggleCustomerActive(+t.dataset.customerToggle, t.checked);
  } else if (t.dataset.itemSelect !== undefined) {
    const index = +t.dataset.itemSelect;
    if (t.checked) selectedItems.add(index); else selectedItems.delete(index);
    refreshItemDirectory();
  } else if (t.dataset.itemSelectAll !== undefined) {
    const indexes = t.dataset.itemSelectAll.split(',').filter(Boolean).map(Number);
    indexes.forEach(index => (t.checked ? selectedItems.add(index) : selectedItems.delete(index)));
    refreshItemDirectory();
  } else if (t.dataset.itemToggle !== undefined) {
    toggleItemActive(+t.dataset.itemToggle, t.checked);
  } else if (t.dataset.itemFilterSelect !== undefined) {
    itemFilter = t.value;
    directoryPagination.item.page = 1;
    refreshItemDirectory();
  } else if (t.dataset.customerFilterSelect !== undefined) {
    customerFilter = t.value;
    directoryPagination.customer.page = 1;
    refreshCustomerDirectory();
  } else if (t.dataset.archiveRange !== undefined) {
    archiveRange = t.value;
    if (archiveRange === 'custom' && !archiveFrom && !archiveTo) [archiveFrom, archiveTo] = monthBounds(0);
    directoryPagination.invoice.page = 1;
    openEditor('invoiceArchive');
  } else if (t.dataset.archiveFrom !== undefined || t.dataset.archiveTo !== undefined) {
    if (t.dataset.archiveFrom !== undefined) archiveFrom = t.value; else archiveTo = t.value;
    directoryPagination.invoice.page = 1;
    refreshInvoiceArchive();
  }
});

$('#invoiceCustomerForm').addEventListener('change', e => {
  if (e.target.name === 'shipSame') $('[data-customer-shipping]').hidden = e.target.checked;
});

$('#edBody').addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.invoiceSearch !== undefined) {
    archiveSearch = t.value;
    directoryPagination.invoice.page = 1;
    $('#invoiceArchiveResults').innerHTML = invoiceArchiveResultsHTML();
    return;
  }
  if (t.dataset.directorySearch) {
    const kind = t.dataset.directorySearch;
    directorySearch[kind] = t.value;
    directoryPagination[kind].page = 1;
    const results = kind === 'customer' ? $('#customerDirectoryResults') : $('#itemDirectoryResults');
    results.innerHTML = kind === 'customer' ? customerDirectoryResultsHTML() : itemDirectoryResultsHTML();
    return;
  }
  if (t.dataset.num) {
    if (t.dataset.num === 'auto') numbering.auto = t.checked;
    else if (t.dataset.num === 'prefix') numbering.prefix = t.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 10) || 'INV';
    saveNumbering();
    const preview = $('#numPreview');
    if (preview) preview.textContent = numberingPreviewText();
    return;
  }
  if (t.type === 'file') return;
  const v = t.type === 'checkbox' ? t.checked : t.value;
  if (t.dataset.termIndex !== undefined) {
    S.terms.list[+t.dataset.termIndex] = v;
  } else if (t.dataset.i !== undefined) {
    const num = ['rate', 'qty', 'disc', 'gst'].includes(t.dataset.k);
    S.items[+t.dataset.i][t.dataset.k] = num ? (v === '' ? 0 : +v) : v;
  } else if (t.dataset.p) {
    const [a, k] = t.dataset.p.split('.');
    S[a][k] = v;
    if (a === 'meta' && k === 'date') syncInvoiceNumberWithDate();
    if (t.dataset.re) t.classList.toggle('is-invalid', !!v && !(t.dataset.re === 'g' ? GST_RE : IFSC_RE).test(v.toUpperCase()));
    if (setupWizard && v && !t.classList.contains('is-invalid')) t.classList.remove('is-invalid');
    if (setupWizard && t.value.trim()) $('#edBody .setup-wizard-error').textContent = '';
  }
  save(); render();
});

$('#dashboardPage').addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.directoryPageSize) {
    const pagination = directoryPagination[t.dataset.directoryPageSize];
    pagination.pageSize = Number(t.value);
    pagination.page = 1;
    const kind = t.dataset.directoryPageSize;
    openEditor(kind === 'customer' ? 'customerDirectory' : kind === 'item' ? 'itemDirectory' : kind === 'invoice' ? 'invoiceArchive' : kind);
    return;
  }
  if (t.dataset.profileImport) {
    importProfileCsv(t.dataset.profileImport, t.files[0]);
    t.value = '';
    return;
  }
  if (t.dataset.profileEditField && t.type === 'file') return;
  if (t.id === 'itemCsvFile') {
    importItemCsv(t.files[0]);
    t.value = '';
    return;
  }
  if (t.id === 'customerCsvFile') {
    importCustomerCsv(t.files[0]);
    t.value = '';
    return;
  }
  if (t.dataset.p === 'customer.shipSame') {
    S.customer.shipSame = t.checked;
    save();
    render();
    ['shippingPhone', 'shippingEmail'].forEach(field => {
      const input = $(`#edBody [data-p="customer.${field}"]`);
      if (input) input.parentElement.hidden = t.checked;
    });
    return;
  }
  if (t.type !== 'file' || !t.files[0]) return;
  const [a, k] = t.dataset.p.split('.');
  readFileDataUrl(t.files[0]).then(dataUrl => {
    S[a][k] = dataUrl;
    save();
    render();
    if (setupWizard) renderSetupStep();
    else openEditor(edSec);
  }).catch(error => {
    t.value = '';
    showInvoiceToast(error.message || 'Could not use that image.');
  });
});

$('#pm').onchange = e => { S.priceMode = e.target.value; save(); render(); };
$('#paperSel').onchange = e => { S.paper = PAPERS[e.target.value] ? e.target.value : ''; save(); render(); };
$('#cp').onchange = e => { S.copies = +e.target.value; save(); };

// Inline round off checkbox
document.addEventListener('change', e => {
  if (e.target.id === 'inlineRo') {
    S.round = e.target.checked;
    setRoundOffDefault(S.round);
    save(); render();
  }
});



// Paper this invoice is printed on: its own choice, else the default from Invoice Templates (saved invoices keep what they were saved with).
function invoicePaper(state = S) {
  if (PAPERS[state?.paper]) return state.paper;
  return archivePreviewInvoice ? 'a4' : templateSettings.paper;
}
const isReceiptPaper = () => Boolean(PAPERS[invoicePaper()].receipt);

// Page size for printing / PDF. A receipt page is as tall as the receipt itself, so it is measured after drawing.
function applyPaperOutput() {
  const key = invoicePaper();
  const paper = PAPERS[key];
  document.body.classList.remove(...Object.keys(PAPERS).map(name => `paper-${name}`));
  document.body.classList.add(`paper-${key}`);
  let style = document.getElementById('paperPageStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'paperPageStyle';
    document.head.appendChild(style);
  }
  let heightMm = paper.h;
  if (paper.receipt) {
    const tallest = Math.max(0, ...[...document.querySelectorAll('#sheets .sheet')].map(sheet => sheet.getBoundingClientRect().height));
    heightMm = Math.max(60, Math.ceil(tallest * 25.4 / 96) + 4);
    style.textContent = `@page { size: ${paper.w}mm ${heightMm}mm; margin: 0; }`;
  } else {
    style.textContent = key === 'a4' ? '' : `@page { size: ${paper.w}mm ${paper.h}mm; margin: ${paper.margin}; }`;
  }
  return { key, paper, heightMm };
}

function clearPaperOutput() {
  document.body.classList.remove(...Object.keys(PAPERS).map(name => `paper-${name}`));
  const style = document.getElementById('paperPageStyle');
  if (style) style.textContent = '';
}

// jsPDF page settings for a paper.
function pdfPageFor({ key, paper, heightMm }) {
  if (key === 'a4') return { unit: 'mm', format: 'a4', orientation: 'portrait' };
  if (key === 'a5') return { unit: 'mm', format: 'a5', orientation: 'portrait' };
  if (key === 'a4half') return { unit: 'mm', format: [148.5, 210], orientation: 'landscape' };
  return { unit: 'mm', format: [paper.w, heightMm], orientation: 'portrait' };
}

function preparePrintRows() {
  if (isReceiptPaper()) return;   // a receipt has no items table to tidy up
  $('#sheets').querySelectorAll('.sheet').forEach(sheet => {
    const body = sheet.querySelector('.items tbody');
    const printRows = [];

    const descriptionLines = row => {
      const textNode = row.querySelector('.item-name-cell .print-only-text b')?.firstChild;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE || !textNode.textContent) return [];
      const range = document.createRange();
      const lines = [];
      let line = '';
      let lineTop = null;
      for (let offset = 0; offset < textNode.length; offset++) {
        range.setStart(textNode, offset);
        range.setEnd(textNode, offset + 1);
        const rect = range.getBoundingClientRect();
        if (lineTop !== null && Math.abs(rect.top - lineTop) > 1) {
          lines.push(line.trim());
          line = '';
        }
        lineTop = rect.top;
        line += textNode.textContent[offset];
      }
      if (line.trim()) lines.push(line.trim());
      return lines.filter(Boolean);
    };

    [...body.querySelectorAll(':scope > tr')].forEach(sourceRow => {
      const lines = descriptionLines(sourceRow);
      if (lines.length < 2) {
        printRows.push(sourceRow);
        return;
      }

      lines.forEach((line, lineIndex) => {
        const row = sourceRow.cloneNode(true);
        const description = row.querySelector('.item-name-cell .print-only-text b');
        if (description) description.textContent = line;
        if (lineIndex > 0) {
          row.classList.add('item-description-continuation');
          [...row.cells].forEach((cell, cellIndex) => {
            if (cellIndex !== 1) cell.textContent = '';
          });
        }
        if (lineIndex < lines.length - 1) row.classList.add('item-description-fragment');
        printRows.push(row);
      });
    });

    body.replaceChildren(...printRows);
  });

  const printableHeight = (PAPERS[invoicePaper()].printable || 277) * 96 / 25.4;
  $('#sheets').querySelectorAll('.sheet').forEach(sheet => {
    const fitsOnPage = sheet.getBoundingClientRect().height <= printableHeight * 0.9;
    sheet.classList.toggle('invoice-single-page', fitsOnPage);
    if (!fitsOnPage) return;

    const body = sheet.querySelector('.items tbody');
    const lastRow = body.querySelector(':scope > tr:last-child');
    if (!lastRow) return;
    const filler = lastRow.cloneNode(true);
    filler.className = 'print-body-filler';
    [...filler.cells].forEach(cell => cell.replaceChildren());
    filler.style.height = '100%';
    body.append(filler);
  });
}

document.addEventListener('click', e => {
  if (e.target.closest('#btnPrintPreview')) printCurrentInvoice();
});

/* ---------- WhatsApp share ---------- */
// Renders the invoice exactly like the print layout and captures it as an A4 PDF blob.
async function buildInvoicePdfBlob() {
  const sheets = $('#sheets'), dashboard = $('#dashboardPage');
  const wasSheetsHidden = sheets.hidden, wasDashboardHidden = dashboard.hidden;
  try {
    if (archivePreviewInvoice) { dashboard.hidden = true; sheets.hidden = false; }
    document.body.classList.add('printing');
    renderInto(sheets, 1);
    await new Promise(r => requestAnimationFrame(r));
    const output = applyPaperOutput();
    preparePrintRows();
    return await html2pdf().set({
      margin: 0,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: pdfPageFor(output),
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(sheets).outputPdf('blob');
  } finally {
    document.body.classList.remove('printing');
    clearPaperOutput();
    render(1);
    sheets.hidden = wasSheetsHidden;
    dashboard.hidden = wasDashboardHidden;
  }
}

/* ----- Share window: the invoice as a picture that can be copied and pasted into WhatsApp (or any app) ----- */
let shareImageBlob = null;
let shareImageUrl = '';
let shareImageToken = 0;

// Draws a saved invoice the same way it prints and returns it as one PNG picture (the whole invoice, even when it is long).
async function buildRecordImageBlob(record) {
  const sheets = $('#sheets'), dashboard = $('#dashboardPage');
  const wasSheetsHidden = sheets.hidden, wasDashboardHidden = dashboard.hidden;
  const liveState = S, livePreview = archivePreviewInvoice;
  try {
    S = normalizeTerms(structuredClone(record.snapshot));
    archivePreviewInvoice = record;
    dashboard.hidden = true;
    sheets.hidden = false;
    document.body.classList.add('printing');
    renderInto(sheets, 1);
    await new Promise(resolve => requestAnimationFrame(resolve));
    applyPaperOutput();
    preparePrintRows();
    const draw = async ignoreFileImages => {
      const canvas = await html2pdf().set({
        margin: 0,
        html2canvas: {
          scale: 2, useCORS: true, backgroundColor: '#ffffff',
          // Pictures that come from the app's own folder (the demo logo and signature) make the browser lock the canvas when the app is
          // opened from a file. Uploaded logos are stored inside the data, so they are never affected.
          ignoreElements: ignoreFileImages ? element => element.tagName === 'IMG' && !/^(data|blob):/i.test(element.getAttribute('src') || '') : undefined
        }
      }).from(sheets).toCanvas().get('canvas');
      return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not make the picture.'))), 'image/png'));
    };
    try {
      return await draw(false);
    } catch (error) {
      if (error?.name !== 'SecurityError' && !/tainted/i.test(error?.message || '')) throw error;
      return await draw(true);
    }
  } finally {
    document.body.classList.remove('printing');
    clearPaperOutput();
    S = liveState;
    archivePreviewInvoice = livePreview;
    render(1);
    sheets.hidden = wasSheetsHidden;
    dashboard.hidden = wasDashboardHidden;
  }
}

function setShareStatus(message, type = '') {
  const status = $('#shareImageStatus');
  status.textContent = message;
  status.className = `share-image-status ${type}`;
  status.hidden = !message;
}

async function openShareInvoiceModal(record) {
  const quote = record.status === 'quotation' || record.snapshot?.docType === 'quotation';
  const token = ++shareImageToken;
  if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
  shareImageBlob = null;
  shareImageUrl = '';
  $('#shareInvoiceTitle').textContent = `Share ${quote ? 'quotation' : 'invoice'} ${record.invoiceNo}`;
  $('#shareImagePreview').removeAttribute('src');
  $('#shareImagePreview').hidden = true;
  $('#shareImageLoading').hidden = false;
  $('#btnShareCopyImage').disabled = true;
  $('#btnShareCopyImage').textContent = 'Copy as image';
  setShareStatus('');
  bootstrap.Modal.getOrCreateInstance($('#shareInvoiceModal')).show();
  if (typeof html2pdf === 'undefined') {
    $('#shareImageLoading').hidden = true;
    setShareStatus('The picture tool could not be loaded. Check your internet connection and reload the page.', 'is-error');
    return;
  }
  try {
    const blob = await buildRecordImageBlob(record);
    if (token !== shareImageToken) return;               // the window was closed or another invoice was opened
    shareImageBlob = blob;
    shareImageUrl = URL.createObjectURL(blob);
    $('#shareImagePreview').src = shareImageUrl;
    $('#shareImagePreview').hidden = false;
    $('#btnShareCopyImage').disabled = false;
  } catch (error) {
    console.error('Could not make the invoice picture.', error);
    if (token === shareImageToken) setShareStatus(error.message || 'Could not make the picture of this invoice.', 'is-error');
  } finally {
    if (token === shareImageToken) $('#shareImageLoading').hidden = true;
  }
}

async function copyShareImage() {
  if (!shareImageBlob) return;
  const button = $('#btnShareCopyImage');
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('This browser cannot copy pictures.');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': shareImageBlob })]);
    button.textContent = 'Copied ✓';
    setShareStatus('Picture copied. Open the WhatsApp chat (or any app) and press Ctrl+V to paste it.', 'is-success');
    showToast('Invoice picture copied. Paste it into the chat with Ctrl+V.', { type: 'success' });
  } catch (error) {
    console.warn('Could not copy the picture.', error);
    button.textContent = 'Copy as image';
    setShareStatus('The browser did not allow copying. Right-click the picture above and choose "Copy image", or save it and attach it.', 'is-error');
  }
}

document.addEventListener('hidden.bs.modal', event => {
  if (event.target.id !== 'shareInvoiceModal') return;
  shareImageToken++;
  if (shareImageUrl) URL.revokeObjectURL(shareImageUrl);
  shareImageBlob = null;
  shareImageUrl = '';
});

async function shareInvoiceOnWhatsapp() {
  const btn = $('#btnInvoiceActions');
  const status = $('#invoiceSaveStatus');
  const C = calc(), s = S.seller, m = S.meta, c = S.customer;
  const money = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lines = [
    `*${isQuotation() ? 'Quotation' : 'Invoice'} ${m.no || ''}*`,
    s.name ? `From: ${s.name}` : '',
    c.name ? `To: ${c.name}` : '',
    m.date ? `Date: ${m.date}` : '',
    isQuotation() ? (m.valid ? `Valid until: ${m.valid}` : '') : (m.due ? `Due date: ${m.due}` : ''),
    '',
    ...C.rows.filter(r => r.filled).map((r, i) => `${i + 1}. ${r.name || 'Item'} - ${r.q} x ${money(r.rate)} = Rs. ${money(r.amt)}`),
    '',
    C.discount ? `Discount${S.discount?.type === 'amount' ? ' (before GST)' : ` (${+C.discountPercent.toFixed(2)}%)`}: -Rs. ${money(C.discount)}` : '',
    `*Total: Rs. ${money(C.total)}*`,
    '',
    s.mobile ? `Contact: ${s.mobile}` : '',
    isQuotation() ? 'We look forward to working with you.' : 'Thank you for your business!'
  ];
  const text = lines.filter((l, i) => l || (i && lines[i - 1] !== '')).join('\n');
  // Use the customer's number if present (10-digit numbers get India's +91), else let the user pick a chat.
  let digits = String(c.phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits;
  const url = `https://wa.me/${digits.length >= 11 ? digits : ''}?text=${encodeURIComponent(text)}`;
  const fileName = `${isQuotation() ? 'Quotation' : 'Invoice'}-${String(m.no || 'invoice').replace(/[^\w.-]+/g, '_')}.pdf`;

  btn.disabled = true;
  if (status) status.textContent = 'Preparing invoice PDF…';
  try {
    if (typeof html2pdf === 'undefined') throw new Error('PDF library failed to load. Check your internet connection.');
    const blob = await buildInvoicePdfBlob();
    const file = new File([blob], fileName, { type: 'application/pdf' });

    // Phones and some desktop browsers: share the PDF itself; user picks WhatsApp.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName, text });
        if (status) { status.textContent = ''; dismissStatusToast(status); }
        return true;
      } catch (err) {
        if (err.name === 'AbortError') { if (status) { status.textContent = ''; dismissStatusToast(status); } return false; }
        // other errors: fall through to download + WhatsApp link
      }
    }

    // Fallback: download the PDF, open WhatsApp with the message so the user can attach it.
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    window.open(url, '_blank', 'noopener');
    if (status) status.textContent = `${fileName} was downloaded. Attach it in the WhatsApp chat (use the + / paperclip button).`;
    return true;
  } catch (err) {
    console.error(err);
    if (status) status.textContent = `Could not create the PDF (${err.message}). Opened WhatsApp with the invoice text only.`;
    window.open(url, '_blank', 'noopener');
    return true;
  } finally {
    btn.disabled = false;
  }
}

function printCurrentInvoice({ startNewAfter = false } = {}) {
  startNewAfterPrint = startNewAfter && !archivePreviewInvoice;
  if (archivePreviewInvoice) {
    $('#dashboardPage').hidden = true;
    $('#sheets').hidden = false;
  }
  document.body.classList.add('printing');
  renderInto($('#sheets'), S.copies);
  printing = true;
  requestAnimationFrame(() => {
    applyPaperOutput();
    preparePrintRows();
    window.print();
  });
}

window.onafterprint = () => {
  if (!printing) return;
  printing = false;
  document.body.classList.remove('printing');
  clearPaperOutput();
  if (archivePreviewInvoice) {
    startNewAfterPrint = false;
    render();
    $('#sheets').hidden = true;
    $('#dashboardPage').hidden = false;
  } else {
    render(1);
    if (startNewAfterPrint) {
      startNewAfterPrint = false;
      startNewInvoice();
    }
  }
};

document.addEventListener('click', e => {
  if (e.target.closest('[data-num-reset]') && SHOW_TEST_TOOLS) {
    if (!confirm('Start invoice numbers again from 001? Saved invoices stay in the database; only the numbering starts over.')) return;
    numbering.counters = {};
    numbering.ignored = archivedInvoices.map(invoice => String(invoice.invoiceNo).toLowerCase());
    saveNumbering();
    S.meta.no = '';
    S.meta.no = numberingPreviewText();
    save();
    render();
    openEditor('meta');
    return;
  }
  if (!e.target.closest('[data-num-apply]')) return;
  S.meta.no = numberingPreviewText();
  save();
  render();
  const field = $('#edBody [data-p="meta.no"]');
  if (field) field.value = S.meta.no;
});

function startNewInvoice() {
  delete S.quoteRef;
  delete S.draftId;
  S.watermark = 'paid';
  S.paper = '';   // follow the default paper size again
  S.round = roundOffDefault;
  const today = todayISO();
  if (numbering.auto) {
    if (!invoiceCsvHandle) noteInvoiceNumberUsed(S.meta.no);   // no saved list to look at, so remember this one
    S.meta.no = nextInvoiceNumber(today);
    if (isQuotation()) S.meta.valid = addDays(today, QUOTE_VALID_DAYS);
  } else {
    S.meta.no = S.meta.no.replace(/\d+$/, n => String(+n + 1).padStart(n.length, '0'));
  }
  S.meta.date = today;
  S.meta.due = '';
  if (isQuotation()) S.meta.valid = addDays(today, QUOTE_VALID_DAYS);
  S.customer = { name: '', gstin: '', phone: '', email: '', billing: '', shipSame: true, shipping: '', shippingPhone: '', shippingEmail: '' };
  S.items = [{ name: '', hsn: '', rate: 0, qty: 1, unit: 'Nos', unitExplicit: false, gst: 18, disc: 0 }];
  S.discount = { type: 'percent', value: '', basis: 'taxable' };
  openQuantityMenuRow = -1;
  openCustomQuantityRow = -1;
  save();
  render();
}

function currentInvoiceIsBlank() {
  const customerEmpty = ['name', 'gstin', 'phone', 'email', 'billing', 'shipping', 'shippingPhone', 'shippingEmail']
    .every(key => !String(S.customer[key] || '').trim());
  const itemsEmpty = S.items.every(item => !String(item.name || '').trim() && !String(item.hsn || '').trim()
    && !Number(item.rate) && !Number(item.disc));
  return customerEmpty && itemsEmpty;
}

$('#btnNew').onclick = () => {
  if (currentInvoiceIsBlank()) {
    startNewInvoice();
    return;
  }
  confirmDestructiveAction({
    title: 'Discard the current invoice?',
    message: 'The invoice you are working on has not been saved. Discard it and start a new invoice, or cancel to keep working on it.',
    confirmLabel: 'Discard',
    action: startNewInvoice
  });
};

$('#btnReset').onclick = () => {
  bootstrap.Modal.getOrCreateInstance('#resetConfirmModal').show();
};

$('#btnDisconnectDatabase').onclick = () => {
  $('#disconnectDatabaseError').hidden = true;
  $('#disconnectDatabaseError').textContent = '';
  bootstrap.Modal.getOrCreateInstance('#disconnectDatabaseModal').show();
};

$('#actionConfirmModal').addEventListener('hidden.bs.modal', () => {
  pendingActionConfirmation = null;
});

$('#invoiceOverrideModal').addEventListener('hidden.bs.modal', () => {
  resolveInvoiceOverride(false);
});

async function disconnectDatabase() {
  try {
    await removeSavedCsvDirectory();
  } catch (error) {
    console.error('Could not disconnect the saved CSV folder.', error);
    $('#disconnectDatabaseError').textContent = 'The database could not be disconnected. Check browser storage permissions and try again.';
    $('#disconnectDatabaseError').hidden = false;
    bootstrap.Modal.getOrCreateInstance('#disconnectDatabaseModal').show();
    return;
  }

  customerCsvHandle = null;
  itemCsvHandle = null;
  Object.keys(profileCsvHandles).forEach(kind => {
    profileCsvHandles[kind] = null;
  });
  invoiceCsvHandle = null;
  archivedInvoices = [];
  csvDirectoryHandle = null;
  csvConnectionNotice = '';
  refreshCsvConnectionStatus();
}

$('#btnConfirmDisconnectDatabase').onclick = () => {
  $('#disconnectDatabaseModal').dataset.confirmed = 'true';
  bootstrap.Modal.getOrCreateInstance('#disconnectDatabaseModal').hide();
};

$('#disconnectDatabaseModal').addEventListener('hidden.bs.modal', () => {
  if (!$('#disconnectDatabaseModal').dataset.confirmed) return;
  delete $('#disconnectDatabaseModal').dataset.confirmed;
  disconnectDatabase();
});

function resetInvoiceToDemo() {
  S = structuredClone(DEMO_DATA);
  S.lang = uiLang;
  save();
  render();
}

$('#btnConfirmReset').onclick = () => {
  $('#resetConfirmModal').dataset.confirmed = 'true';
  bootstrap.Modal.getOrCreateInstance('#resetConfirmModal').hide();
};

$('#resetConfirmModal').addEventListener('hidden.bs.modal', () => {
  if (!$('#resetConfirmModal').dataset.confirmed) return;
  delete $('#resetConfirmModal').dataset.confirmed;
  resetInvoiceToDemo();
});


/* ----- notifications -----
   Every status message in the app (saved, imported, deleted, failed…) is shown as a dark toast at the top right and
   closes by itself after 5 seconds. The old status lines are still written to by the page code; this watches them,
   turns each message into a toast and empties the line, so nothing shows in the page itself. */
const TOAST_VISIBLE_MS = 5000;
const TOAST_MAX = 4;
const STATUS_SELECTOR = '.customer-import-status, .invoice-save-status, .backup-status';
const toastBySource = new WeakMap();
const ownClears = new WeakSet();

function toastLayerElement() {
  let layer = document.getElementById('toastLayer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'toastLayer';
    layer.className = 'toast-layer no-print';
    layer.setAttribute('aria-live', 'polite');
    layer.setAttribute('role', 'status');
    document.body.appendChild(layer);
  }
  return layer;
}

function dismissToast(toast) {
  if (!toast || toast.dataset.closing) return;
  toast.dataset.closing = '1';
  clearTimeout(toast._timer);
  toast.classList.add('is-leaving');
  setTimeout(() => toast.remove(), 220);
}

function startToastClock(toast) {
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => dismissToast(toast), toast._duration || TOAST_VISIBLE_MS);
}

// type: 'success', 'error' or 'info'. source: the status line the message came from (a newer message replaces its older toast).
function showToast(message, { type = 'info', source = null, duration = TOAST_VISIBLE_MS } = {}) {
  const text = String(message ?? '').trim();
  if (!text) return null;
  const layer = toastLayerElement();
  let toast = source ? toastBySource.get(source) : null;
  if (!toast || !toast.isConnected || toast.dataset.closing) {
    toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.innerHTML = '<span class="app-toast-text"></span><button type="button" class="app-toast-close" aria-label="Close"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg></button>';
    toast.addEventListener('mouseenter', () => clearTimeout(toast._timer));
    toast.addEventListener('mouseleave', () => startToastClock(toast));
    toast.querySelector('.app-toast-close').addEventListener('click', () => dismissToast(toast));
    layer.appendChild(toast);
    while (layer.children.length > TOAST_MAX) layer.firstElementChild.remove();
    if (source) toastBySource.set(source, toast);
  }
  toast.dataset.type = type;
  toast._duration = duration;
  toast.querySelector('.app-toast-text').textContent = text;
  startToastClock(toast);
  return toast;
}

function statusType(element) {
  const classes = element.className || '';
  if (/\b(error|text-danger)\b/.test(classes)) return 'error';
  if (/\b(success|text-success)\b/.test(classes)) return 'success';
  return 'info';
}

// Used when the page code finishes a step that had shown a progress message (such as "Preparing…").
function dismissStatusToast(element) {
  const toast = toastBySource.get(element);
  if (toast) dismissToast(toast);
}

function convertStatusToToast(element) {
  const text = element.textContent.trim();
  if (!text) {
    if (ownClears.has(element)) { ownClears.delete(element); return; }   // our own emptying
    const toast = toastBySource.get(element);                           // the page code cleared it (e.g. "Preparing…" is over)
    if (toast) dismissToast(toast);
    return;
  }
  showToast(text, { type: statusType(element), source: element });
  ownClears.add(element);
  element.textContent = '';
  if (element.classList.contains('backup-status')) element.hidden = true;
}

new MutationObserver(mutations => {
  const touched = new Set();
  mutations.forEach(mutation => {
    const host = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
    const owner = host?.closest?.(STATUS_SELECTOR);
    if (owner) touched.add(owner);
    mutation.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.matches(STATUS_SELECTOR)) touched.add(node);
      node.querySelectorAll?.(STATUS_SELECTOR).forEach(inner => touched.add(inner));
    });
  });
  touched.forEach(convertStatusToToast);
}).observe(document.body, { childList: true, characterData: true, subtree: true });

/* ----- Database lock -----
   Everything the app saves goes into the CSV files, so nothing can be done until the database is connected.
   While it is not connected, a window covers the app. It has no close button and cannot be dismissed with Esc or a click outside;
   it goes away by itself as soon as the database is connected, and comes back if the database is disconnected. */
// Waits for a promise, but gives up after `ms` and returns `fallback` (also when it fails), so a stuck browser store can never freeze the lock window.
function withTimeout(promise, ms, fallback) {
  return Promise.race([Promise.resolve(promise).catch(() => fallback), new Promise(resolve => setTimeout(() => resolve(fallback), ms))]);
}

let databaseGateReady = false;   // set once the automatic reconnect at start-up has finished, so the window does not flash for nothing

function updateDatabaseGate() {
  if (!databaseGateReady) return;
  const element = document.getElementById('databaseGateModal');
  if (!element) return;
  const connected = backupDatabaseConnected();
  const shown = element.classList.contains('show') || element.classList.contains('showing');
  const modal = bootstrap.Modal.getOrCreateInstance(element, { backdrop: 'static', keyboard: false });
  const notice = $('#databaseGateNotice');
  notice.textContent = csvConnectionNotice || '';
  notice.hidden = !csvConnectionNotice;
  const canPick = typeof window.showDirectoryPicker === 'function';
  $('#btnGateConnect').hidden = !canPick;
  $('#databaseGateUnsupported').hidden = canPick;
  if (!connected && !shown) modal.show();
  else if (connected && shown) modal.hide();
}

async function connectFromGate() {
  const button = $('#btnGateConnect');
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Connecting…';
  $('#databaseGateError').hidden = true;
  try {
    let result;
    const saved = await withTimeout(getSavedCsvDirectory(), 3000, null);     // the folder used last time (never waits forever)
    if (saved) {
      let permission = await saved.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') permission = await saved.requestPermission({ mode: 'readwrite' });   // allowed here: it follows a click
      if (permission === 'granted') result = await connectAllCsvs(saved, { requestPermission: false, showPicker: false, showErrors: false, rememberDirectory: false });
    }
    if (result !== true) result = await connectAllCsvs(null, { showErrors: false });                      // otherwise choose the folder
    if (result === false) {
      $('#databaseGateError').textContent = csvConnectionNotice || 'The database could not be connected. Choose your data folder (an empty folder is fine).';
      $('#databaseGateError').hidden = false;
    }
  } catch (error) {
    console.error('Could not connect the database.', error);
    $('#databaseGateError').textContent = error.message || 'The database could not be connected.';
    $('#databaseGateError').hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

document.addEventListener('click', e => {
  if (e.target.closest('#btnGateConnect')) connectFromGate();
});

showGeneratePage();
render();
restoreCsvConnection().finally(() => {
  databaseGateReady = true;
  updateDatabaseGate();
});


/* ---------- responsive sidebar (small screens) ---------- */
function setSidebarOpen(open) {
  document.body.classList.toggle('sidebar-open', open);
  const toggle = document.getElementById('btnSidebarToggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
}
document.addEventListener('click', e => {
  if (e.target.closest('#btnSidebarToggle')) {
    setSidebarOpen(!document.body.classList.contains('sidebar-open'));
  } else if (e.target.closest('#sidebarBackdrop')) {
    setSidebarOpen(false);
  } else if (e.target.closest('#sidebar .nav-item[data-page], #sidebar .nav-item[data-edit]')) {
    setSidebarOpen(false);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') setSidebarOpen(false); });
window.addEventListener('resize', () => { if (window.innerWidth >= 992) setSidebarOpen(false); });


// Bulk price / stock dialog: live preview while typing, apply button.
document.addEventListener('input', e => { if (e.target.closest?.('#bulkItemModal')) refreshBulkPreview(); });
document.addEventListener('change', e => {
  if (!e.target.closest?.('#bulkItemModal')) return;
  if (e.target.id === 'bulkPriceField') syncBulkPriceMethods();
  if (e.target.id === 'bulkPriceMethod') {
    const method = e.target.value;
    $('#bulkPriceValueLabel').textContent = method.startsWith('pct') ? 'Percent (%)' : method === 'margin' ? 'Target margin (%)' : method === 'set' ? 'Value (₹)' : 'Amount (₹)';
  }
  refreshBulkPreview();
});
document.addEventListener('click', e => { if (e.target.closest?.('#bulkItemApply')) applyBulkModal(); });


// Price list selector on the invoice: switching it re-prices the rows picked from the item list.
document.addEventListener('change', e => {
  if (e.target.dataset?.pricelist === undefined) return;
  S.customer.priceList = normalizePriceList(e.target.value);
  repriceInvoiceRows();
  save();
  render();
  showToast(`${S.customer.priceList === 'wholesale' ? 'Wholesale' : 'Retail'} price list applied to this invoice.`, { type: 'info' });
});

document.addEventListener('click', e => {
  const add = e.target.closest?.('[data-rep-add]');
  if (add) {
    const block = add.closest('[data-rep]');
    const rows = block.querySelector('.rep-rows');
    if (rows.children.length >= MAX_CUSTOMER_ENTRIES) return;
    rows.insertAdjacentHTML('beforeend', REP_KINDS[add.dataset.repAdd]());
    rows.lastElementChild.querySelector('input,textarea')?.focus();
    return;
  }
  const remove = e.target.closest?.('[data-rep-remove]');
  if (remove) remove.closest('[data-rep-row]')?.remove();
});

document.addEventListener('change', e => {
  const select = e.target.closest?.('[data-shipto]');
  if (!select) return;
  const address = normalizeShipAddresses(S.customer.shippingAddresses)[+select.value];
  if (select.value === '' || !address) {
    S.customer.shipSame = true;
  } else {
    S.customer.shipSame = false;
    S.customer.shipping = address.address;
    S.customer.shippingPhone = address.phone || '';
    S.customer.shippingEmail = address.email || '';
  }
  save();
  render();
});

document.addEventListener('input', e => {
  const input = e.target;
  if (!input?.matches?.('input[name="gstin"], input[data-p$=".gstin"]')) return;
  const result = validateGstin(input.value);
  input.classList.toggle('is-invalid', result.status === 'error');
  input.classList.toggle('gstin-warn', result.status === 'warn');
  input.title = result.status === 'error' || result.status === 'warn' ? result.message : '';
  const hint = input.parentElement.querySelector('[data-gstin-hint]');
  if (hint) hint.innerHTML = gstinHintHTML(input.value);
});

document.addEventListener('click', e => {
  const button = e.target.closest?.('[data-gst-verify]');
  if (!button) return;
  e.preventDefault();
  const gstin = button.dataset.gstVerify;
  try { navigator.clipboard?.writeText(gstin); } catch (error) { /* clipboard may be blocked; the user can still type it */ }
  window.open(GST_PORTAL_URL, '_blank', 'noopener');
  showToast(`GSTIN ${gstin} copied. Paste it on the GST portal’s “Search Taxpayer” page.`, { type: 'info' });
});

document.addEventListener('click', e => {
  const button = e.target.closest?.('[data-wm]');
  if (!button || archivePreviewInvoice) return;
  S.watermark = S.watermark === button.dataset.wm ? '' : button.dataset.wm;   // clicking the selected one again removes the stamp
  save();
  render();
});

document.addEventListener('change', e => {
  const select = e.target.closest?.('[data-paper-default]');
  if (!select || !PAPERS[select.value]) return;
  templateSettings.paper = select.value;
  saveTemplateSettings();
  if (!archivePreviewInvoice) render();   // the invoice you are working on follows the new default unless it has its own paper
  showToast(`Default paper size: ${PAPERS[select.value].label}. You can still change it for a single invoice on the Generate Invoice page.`, { type: 'info' });
});

/* ---------- Installable app (PWA) ----------
   Works when the app is opened from https:// or http://localhost (not from a double-clicked file). */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(error => console.warn('Offline start is not available.', error));
  });
}
let installPromptEvent = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPromptEvent = event;
  const button = $('#btnInstallApp');
  if (button) button.hidden = false;
});
window.addEventListener('appinstalled', () => {
  installPromptEvent = null;
  const button = $('#btnInstallApp');
  if (button) button.hidden = true;
  showToast('InvoiceGen is installed. Open it from your desktop or Start menu, then use Connect Database to pick your data folder.', { type: 'success', duration: 9000 });
});
document.addEventListener('click', async e => {
  if (!e.target.closest?.('#btnInstallApp') || !installPromptEvent) return;
  installPromptEvent.prompt();
  await installPromptEvent.userChoice.catch(() => null);
  installPromptEvent = null;
  $('#btnInstallApp').hidden = true;
});
