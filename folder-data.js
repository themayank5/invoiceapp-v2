/* ============================================================
   Data kept in the database folder, next to the CSV files

   1. Images (logo and signature) are stored ONCE as files in  csv/images/<fingerprint>.<ext>.
      The CSV files (invoices.csv, seller.csv) keep only a short reference such as  asset:3fa9c1d2e8b4a706.png
      instead of a full copy of the picture in every saved invoice. The same picture is therefore stored one time,
      and an old invoice still prints the logo it was made with, because that exact file is kept.
   2. app-settings.json holds the settings that used to live only in the browser (template choices, numbering,
      language, backup reminder). It travels with the folder and survives clearing the browser.

   Everything here is safe to fail: if the folder is not connected or a write fails, the app simply keeps working with
   pictures stored inside the data as before.
   ============================================================ */

let csvDirectoryHandle = null;               // the folder the six CSV files were connected from (null when files were picked one by one)
const imageCache = new Map();                // 'asset:3fa9….png' -> data URL, so pictures can be drawn without reading files again
const imageRefByData = new Map();            // data URL -> 'asset:…' (avoids hashing the same picture again and again)
const IMAGE_FOLDER = 'images';
const IMAGE_EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
const IMAGE_MIME_BY_EXTENSION = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

const isImageRef = value => typeof value === 'string' && /^asset:[0-9a-f]{16}\.(png|jpe?g|webp|gif|svg)$/i.test(value);
const isImageData = value => typeof value === 'string' && /^data:image\//i.test(value);

// The picture to draw for a stored value: a reference becomes its data URL, anything else is used as it is.
function imageSrc(value) {
  if (isImageRef(value)) return imageCache.get(value) || '';
  return value || '';
}

function parseImageDataUrl(dataUrl) {
  const match = /^data:(image\/[a-z0-9.+-]+)(;base64)?,(.*)$/is.exec(dataUrl);
  if (!match) return null;
  const [, mime, base64, payload] = match;
  const binary = base64 ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return { mime: mime.toLowerCase(), bytes };
}

async function imageFingerprint(bytes) {
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].slice(0, 8).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  let first = 0x811c9dc5, second = 0x01000193;            // fallback when the browser has no crypto.subtle
  bytes.forEach(byte => { first = Math.imul(first ^ byte, 0x01000193) >>> 0; second = Math.imul(second + byte, 0x85ebca6b) >>> 0; });
  return `${first.toString(16).padStart(8, '0')}${second.toString(16).padStart(8, '0')}`;
}

function bytesToDataUrl(bytes, mime) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return `data:${mime};base64,${btoa(binary)}`;
}

// Saves a picture once as a file and returns its reference. Returns null when it cannot be stored (the caller keeps the picture inline).
async function storeImageAsset(dataUrl) {
  if (!isImageData(dataUrl)) return null;
  if (imageRefByData.has(dataUrl)) return imageRefByData.get(dataUrl);
  if (!csvDirectoryHandle) return null;
  try {
    const parsed = parseImageDataUrl(dataUrl);
    const extension = parsed && IMAGE_EXTENSIONS[parsed.mime];
    if (!extension) return null;
    const ref = `asset:${await imageFingerprint(parsed.bytes)}.${extension}`;
    const folder = await csvDirectoryHandle.getDirectoryHandle(IMAGE_FOLDER, { create: true });
    const fileName = ref.slice('asset:'.length);
    let exists = true;
    try { await folder.getFileHandle(fileName); } catch { exists = false; }
    if (!exists) {
      const handle = await folder.getFileHandle(fileName, { create: true });
      const writable = await handle.createWritable();
      try {
        await writable.write(parsed.bytes);
        await writable.close();
      } catch (error) {
        try { await writable.abort(); } catch { /* already closed */ }
        throw error;
      }
    }
    imageCache.set(ref, dataUrl);
    imageRefByData.set(dataUrl, ref);
    return ref;
  } catch (error) {
    console.warn('Could not store the picture as a file; it stays inside the data.', error);
    return null;
  }
}

// Reads every picture file in csv/images into memory.
async function loadImageAssets(directory = csvDirectoryHandle) {
  if (!directory) return 0;
  let folder;
  try { folder = await directory.getDirectoryHandle(IMAGE_FOLDER); } catch { return 0; }
  let count = 0;
  for await (const [name, handle] of folder.entries()) {
    if (handle.kind && handle.kind !== 'file') continue;
    const extension = name.split('.').pop().toLowerCase();
    const mime = IMAGE_MIME_BY_EXTENSION[extension];
    if (!mime || !/^[0-9a-f]{16}\.[a-z]+$/i.test(name)) continue;
    try {
      const bytes = new Uint8Array(await (await handle.getFile()).arrayBuffer());
      const ref = `asset:${name}`;
      const dataUrl = bytesToDataUrl(bytes, mime);
      imageCache.set(ref, dataUrl);
      imageRefByData.set(dataUrl, ref);
      count++;
    } catch (error) { console.warn(`Could not read the picture ${name}.`, error); }
  }
  return count;
}

// The files of csv/images as { name, bytes } for a backup.
async function readImageFiles(directory = csvDirectoryHandle) {
  const files = [];
  if (!directory) return files;
  let folder;
  try { folder = await directory.getDirectoryHandle(IMAGE_FOLDER); } catch { return files; }
  for await (const [name, handle] of folder.entries()) {
    if (handle.kind && handle.kind !== 'file') continue;
    try { files.push({ name, bytes: new Uint8Array(await (await handle.getFile()).arrayBuffer()) }); } catch { /* skip an unreadable file */ }
  }
  return files;
}

// Puts picture files (from a backup) into csv/images. A file that already exists is left alone: its name is its fingerprint.
async function writeImageFiles(files, directory = csvDirectoryHandle) {
  if (!directory || !files.length) return 0;
  const folder = await directory.getDirectoryHandle(IMAGE_FOLDER, { create: true });
  let written = 0;
  for (const { name, bytes } of files) {
    if (!/^[0-9a-f]{16}\.[a-z]+$/i.test(name)) continue;
    let exists = true;
    try { await folder.getFileHandle(name); } catch { exists = false; }
    if (exists) continue;
    const handle = await folder.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    try { await writable.write(bytes); await writable.close(); } catch (error) { try { await writable.abort(); } catch { /* closed */ } throw error; }
    written++;
  }
  return written;
}

/* ----- picture fields inside the data ----- */
const hasInlineImages = snapshot => isImageData(snapshot?.seller?.logo) || isImageData(snapshot?.sign?.sig);

// A copy of one saved invoice with its pictures replaced by references (the original is returned when there is nothing to do).
async function externalizeSnapshotImages(snapshot) {
  if (!hasInlineImages(snapshot)) return snapshot;
  const copy = { ...snapshot, seller: { ...snapshot.seller }, sign: { ...snapshot.sign } };
  if (isImageData(copy.seller.logo)) copy.seller.logo = (await storeImageAsset(copy.seller.logo)) || copy.seller.logo;
  if (isImageData(copy.sign.sig)) copy.sign.sig = (await storeImageAsset(copy.sign.sig)) || copy.sign.sig;
  return copy;
}

async function externalizeInvoiceRecords(records) {
  if (!csvDirectoryHandle || !records.some(record => hasInlineImages(record.snapshot))) return records;
  const result = [];
  for (const record of records) {
    result.push(hasInlineImages(record.snapshot) ? { ...record, snapshot: await externalizeSnapshotImages(record.snapshot) } : record);
  }
  return result;
}

async function externalizeSellerProfiles(profiles) {
  if (!csvDirectoryHandle || !profiles.some(profile => isImageData(profile.logo))) return profiles;
  const result = [];
  for (const profile of profiles) {
    result.push(isImageData(profile.logo) ? { ...profile, logo: (await storeImageAsset(profile.logo)) || profile.logo } : profile);
  }
  return result;
}

// For the copies kept in the browser: references become pictures again, so nothing depends on the folder being connected.
function inlineStateImages(state) {
  const logo = state?.seller?.logo, sig = state?.sign?.sig;
  if (!isImageRef(logo) && !isImageRef(sig)) return state;
  return { ...state, seller: { ...state.seller, logo: isImageRef(logo) ? (imageCache.get(logo) || logo) : logo }, sign: { ...state.sign, sig: isImageRef(sig) ? (imageCache.get(sig) || sig) : sig } };
}
function inlineProfileImages(profiles) {
  return Array.isArray(profiles) ? profiles.map(profile => (isImageRef(profile?.logo) && imageCache.has(profile.logo) ? { ...profile, logo: imageCache.get(profile.logo) } : profile)) : profiles;
}
// Two picture values count as the same when they show the same picture, whether stored inline or as a reference.
const sameImage = (first, second) => imageSrc(first) === imageSrc(second);

/* ----- one-time clean-up of an existing database ----- */
async function folderTextSize(name) {
  try { return (await (await (await csvDirectoryHandle.getFileHandle(name)).getFile()).arrayBuffer()).byteLength; } catch { return 0; }
}

async function saveSafetyCopyOnce(csvName, copyName) {
  try { await csvDirectoryHandle.getFileHandle(copyName); return; } catch { /* not there yet */ }
  try {
    const source = await (await csvDirectoryHandle.getFileHandle(csvName)).getFile();
    const copy = await csvDirectoryHandle.getFileHandle(copyName, { create: true });
    const writable = await copy.createWritable();
    await writable.write(await source.arrayBuffer());
    await writable.close();
  } catch (error) { console.warn(`Could not save a safety copy of ${csvName}.`, error); }
}

// Moves pictures that are still stored inside invoices.csv / seller.csv out into csv/images. Returns what changed, or null.
async function migrateImagesToFolder() {
  if (!csvDirectoryHandle || !invoiceCsvHandle) return null;
  const invoiceNeeds = archivedInvoices.some(record => hasInlineImages(record.snapshot));
  const sellerNeeds = sellerProfiles.some(profile => isImageData(profile.logo));
  if (!invoiceNeeds && !sellerNeeds) return null;
  const sizeBefore = { invoices: await folderTextSize('invoices.csv'), seller: await folderTextSize('seller.csv') };
  if (invoiceNeeds) await saveSafetyCopyOnce('invoices.csv', 'invoices.before-image-cleanup.csv');
  if (sellerNeeds && profileCsvHandles.seller) await saveSafetyCopyOnce('seller.csv', 'seller.before-image-cleanup.csv');
  if (invoiceNeeds) await persistInvoiceArchive(archivedInvoices);
  if (sellerNeeds && profileCsvHandles.seller) await persistProfiles('seller', sellerProfiles);
  const sizeAfter = { invoices: await folderTextSize('invoices.csv'), seller: await folderTextSize('seller.csv') };
  return { before: sizeBefore.invoices + sizeBefore.seller, after: sizeAfter.invoices + sizeAfter.seller };
}

const formatBytes = bytes => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/* ----- app-settings.json ----- */
const SETTINGS_FILE = 'app-settings.json';
const SETTINGS_SAVED_KEY = 'gst_invoice_settings_saved_v1';   // when the settings last changed in this browser
let settingsApplying = false;
let settingsWriteTimer = null;

function settingsPayload() {
  return {
    app: 'invoice-app',
    version: 1,
    savedAt: localStorage.getItem(SETTINGS_SAVED_KEY) || new Date().toISOString(),
    templates: templateSettings,
    numbering: { auto: numbering.auto, prefix: numbering.prefix, counters: numbering.counters, ignored: numbering.ignored },
    language: uiLang,
    roundOffDefault,
    backup: { lastBackup: backupMeta.lastBackup, reminderDays: backupMeta.reminderDays }
  };
}

// Called whenever one of these settings changes. Notes the time, and copies the settings into the folder a moment later.
function touchSettings() {
  if (settingsApplying) return;
  try { localStorage.setItem(SETTINGS_SAVED_KEY, new Date().toISOString()); } catch { /* storage blocked */ }
  clearTimeout(settingsWriteTimer);
  settingsWriteTimer = setTimeout(() => { writeSettingsFile(); }, 600);
}

async function writeSettingsFile() {
  if (!csvDirectoryHandle) return false;
  try {
    const handle = await csvDirectoryHandle.getFileHandle(SETTINGS_FILE, { create: true });
    const writable = await handle.createWritable();
    try {
      await writable.write(JSON.stringify(settingsPayload(), null, 2));
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch { /* closed */ }
      throw error;
    }
    return true;
  } catch (error) {
    console.warn('Could not save app-settings.json.', error);
    return false;
  }
}

async function readSettingsFile() {
  if (!csvDirectoryHandle) return null;
  try {
    const handle = await csvDirectoryHandle.getFileHandle(SETTINGS_FILE);
    const data = JSON.parse(await (await handle.getFile()).text());
    return data && typeof data === 'object' ? data : null;
  } catch { return null; }
}

function applyRemoteSettings(remote) {
  settingsApplying = true;
  try {
    if (remote.templates && typeof remote.templates === 'object') {
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(remote.templates));
      templateSettings = loadTemplateSettings();
    }
    if (remote.numbering && typeof remote.numbering === 'object') {
      const merged = { ...remote.numbering, counters: { ...(remote.numbering.counters || {}) } };
      Object.entries(numbering.counters).forEach(([key, value]) => { merged.counters[key] = Math.max(Number(merged.counters[key]) || 0, Number(value) || 0); });
      localStorage.setItem(NUMBERING_KEY, JSON.stringify(merged));
      numbering = loadNumbering();
    }
    if (typeof remote.roundOffDefault === 'boolean') {
      localStorage.setItem(ROUND_DEFAULT_KEY, remote.roundOffDefault ? '1' : '0');
      roundOffDefault = loadRoundOffDefault();
    }
    if (remote.backup && typeof remote.backup === 'object') {
      const newest = [backupMeta.lastBackup, remote.backup.lastBackup].filter(Boolean).sort().pop() || null;
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ ...backupMeta, ...remote.backup, lastBackup: newest }));
      backupMeta = loadBackupMeta();
    }
    if (remote.language && remote.language !== uiLang && LANGUAGES.some(([code]) => code === remote.language)) {
      applyUiLanguage(remote.language);
      S.lang = remote.language;
    }
    if (remote.savedAt) localStorage.setItem(SETTINGS_SAVED_KEY, remote.savedAt);
  } finally {
    settingsApplying = false;
  }
}

// On connecting: the newer of the browser's settings and the folder's settings wins; the invoice counters are always the folder's own.
async function syncSettingsWithFolder() {
  const remote = await readSettingsFile();
  // Invoice numbers belong to the folder: the counters of a folder connected before (the sample data, another business)
  // must never carry over. Take this folder's own counters; without them the numbers follow its saved invoices.
  const own = remote?.numbering || {};
  numbering.counters = own.counters && typeof own.counters === 'object' ? { ...own.counters } : {};
  numbering.ignored = Array.isArray(own.ignored) ? [...own.ignored] : [];
  settingsApplying = true; try { saveNumbering(); } finally { settingsApplying = false; }
  if (!remote) { await writeSettingsFile(); return 'written'; }
  const localSaved = localStorage.getItem(SETTINGS_SAVED_KEY);
  if (!localSaved || (remote.savedAt && remote.savedAt > localSaved)) {
    applyRemoteSettings(remote);
    return 'applied';
  }
  if (remote.savedAt !== localSaved) await writeSettingsFile();
  return 'kept';
}

/* ----- everything that happens when the folder gets connected ----- */
async function onFolderConnected(directory) {
  csvDirectoryHandle = directory;
  const notes = [];
  try { await loadImageAssets(directory); } catch (error) { console.warn('Could not read the pictures folder.', error); }
  try {
    const result = await migrateImagesToFolder();
    if (result && result.before > result.after) notes.push(`Pictures in your saved invoices are now stored once, not in every invoice. invoices.csv and seller.csv went from ${formatBytes(result.before)} to ${formatBytes(result.after)}.`);
  } catch (error) { console.warn('Could not move the pictures out of the CSV files.', error); }
  try {
    const status = await syncSettingsWithFolder();
    if (status === 'applied') notes.push('Your settings were read from the database folder.');
  } catch (error) { console.warn('Could not sync the settings with the folder.', error); }
  return notes;
}
