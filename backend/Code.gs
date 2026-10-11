/**
 * Portfolio contact form backend
 * Google Apps Script Web App -> private Google Sheet.
 * Setup and deployment steps: docs/BACKEND_SETUP.md
 */

const CONFIG = {
  SHEET_NAME: 'Contact Submissions',
  HEADERS: ['Submission ID', 'Timestamp', 'Full Name', 'Email Address', 'Subject', 'Message', 'Status'],
  STATUSES: ['New', 'Read', 'Replied', 'Spam'],
  DEFAULT_STATUS: 'New',
  MAX: { name: 80, email: 254, subject: 150, message: 2000 },   // keep in sync with js/contact.js
  MAX_BODY_CHARS: 10000,           // reject oversized requests before parsing
  LOCK_WAIT_MS: 10000,
  RATE: {
    perEmail: { max: 3, windowSec: 600 },    // 3 messages per email address per 10 minutes
    global: { max: 40, windowSec: 3600 }     // 40 messages in total per hour
  },
  DUPLICATE_WINDOW_SEC: 600
};

/* The spreadsheet ID is NOT hardcoded. Store it in Project Settings > Script properties
   as SPREADSHEET_ID. If the script is bound to the sheet (Extensions > Apps Script),
   the property can be left out. */
function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No spreadsheet configured');
  return ss;
}

/* Health check. Returns no data from the sheet. */
function doGet() {
  return json_({ ok: true, service: 'portfolio-contact' });
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > CONFIG.MAX_BODY_CHARS) return json_(fail_('BAD_REQUEST', 'Invalid request.'));

    let data;
    try { data = JSON.parse(raw); } catch (_) { return json_(fail_('BAD_REQUEST', 'Invalid request.')); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json_(fail_('BAD_REQUEST', 'Invalid request.'));

    // Honeypot: real visitors never fill this hidden field. Pretend success, save nothing.
    if (typeof data.website === 'string' && data.website.trim() !== '') return json_({ ok: true });

    const result = validate_(data);
    if (!result.ok) return json_({ ok: false, code: 'VALIDATION', message: 'Please check the highlighted fields.', fields: result.errors });

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(CONFIG.LOCK_WAIT_MS)) return json_(fail_('BUSY', 'The server is busy. Please try again in a moment.'));
    try {
      const v = result.values;
      const cache = CacheService.getScriptCache();

      const dupKey = 'dup:' + digest_(v.email + '|' + v.message);
      if (cache.get(dupKey)) return json_(fail_('DUPLICATE', 'This message was already received. Thank you!'));

      if (!hit_(cache, 'rl:g', CONFIG.RATE.global) || !hit_(cache, 'rl:e:' + digest_(v.email), CONFIG.RATE.perEmail)) {
        return json_(fail_('RATE_LIMITED', 'Too many messages. Please try again later.'));
      }

      const id = save_(v);
      cache.put(dupKey, '1', CONFIG.DUPLICATE_WINDOW_SEC);
      return json_({ ok: true, id: id });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));       // visible only in Apps Script Executions
    return json_(fail_('SERVER_ERROR', 'Something went wrong on the server. Please try again later.'));
  }
}

/* ---------- validation and cleaning ---------- */

function validate_(d) {
  const M = CONFIG.MAX, errors = {};
  const name = clean_(d.name, false), email = clean_(d.email, false).toLowerCase();
  const subject = clean_(d.subject, false), message = clean_(d.message, true);

  if (!name) errors.name = 'Name is required.';
  else if (name.length > M.name) errors.name = 'Name is too long.';

  if (!email) errors.email = 'Email is required.';
  else if (email.length > M.email || !/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(email) || email.indexOf('..') !== -1) errors.email = 'Email address is not valid.';

  if (!subject) errors.subject = 'Subject is required.';
  else if (subject.length > M.subject) errors.subject = 'Subject is too long.';

  if (!message) errors.message = 'Message is required.';
  else if (message.length > M.message) errors.message = 'Message is too long.';

  return Object.keys(errors).length ? { ok: false, errors: errors } : { ok: true, values: { name: name, email: email, subject: subject, message: message } };
}

/* Accepts strings only. Strips control characters; single-line fields lose line breaks. */
function clean_(value, multiline) {
  if (typeof value !== 'string') return '';
  let s = value.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  if (!multiline) s = s.replace(/\s+/g, ' ');
  return s.trim();
}

/* Formula-injection guard: text that starts with = + - @ (or tab/CR) is prefixed with an
   apostrophe so Sheets, Excel and CSV readers treat it as plain text. */
function safe_(text) {
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

/* ---------- storage ---------- */

function getSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) initSheet_(sheet);
  return sheet;
}

function initSheet_(sheet) {
  const H = CONFIG.HEADERS, cols = H.length;
  sheet.getRange(1, 1, 1, cols).setValues([H]).setFontWeight('bold').setBackground('#0b3a52').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  // Plain-text columns so nothing typed by a visitor is ever parsed as a formula or number
  [1, 3, 4, 5, 6, 7].forEach(function (c) { sheet.getRange(1, c, sheet.getMaxRows(), 1).setNumberFormat('@'); });
  sheet.getRange(1, 2, sheet.getMaxRows(), 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');   // real date-time, good for Excel and Pandas
  sheet.getRange(2, 6, sheet.getMaxRows() - 1, 1).setWrap(true);
  sheet.getRange(2, 7, sheet.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(CONFIG.STATUSES, true).setAllowInvalid(false).build());
  [150, 160, 160, 220, 220, 420, 90].forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.getRange(1, 1, sheet.getMaxRows(), cols).createFilter();
}

function save_(v) {
  const sheet = getSheet_(), now = new Date();
  const tz = getSpreadsheet_().getSpreadsheetTimeZone();
  const id = 'MS-' + Utilities.formatDate(now, tz, 'yyyyMMdd') + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  const row = sheet.getLastRow() + 1;      // safe: we hold the script lock
  sheet.getRange(row, 1, 1, CONFIG.HEADERS.length).setValues([[
    id, now, safe_(v.name), safe_(v.email), safe_(v.subject), safe_(v.message), CONFIG.DEFAULT_STATUS
  ]]);
  SpreadsheetApp.flush();                  // make sure the row is committed before we confirm
  return id;
}

/* ---------- helpers ---------- */

/* Fixed-window counter in the script cache. Returns false when the limit is exceeded. */
function hit_(cache, key, rule) {
  const now = Date.now();
  let state = null;
  try { state = JSON.parse(cache.get(key)); } catch (_) {}
  if (!state || now - state.t > rule.windowSec * 1000) state = { n: 0, t: now };
  if (state.n >= rule.max) return false;
  state.n++;
  cache.put(key, JSON.stringify(state), Math.min(rule.windowSec, 21600));
  return true;
}

function digest_(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8));
}

function fail_(code, message) { return { ok: false, code: code, message: message }; }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- run these from the editor ---------- */

/* Run once: creates the worksheet, headers and formatting, and triggers the permission prompt. */
function setup() {
  getSheet_();
  console.log('Sheet ready: ' + CONFIG.SHEET_NAME);
}

/* Adds one clearly labelled test row. Delete it afterwards. */
function testSubmission() {
  const res = doPost({ postData: { contents: JSON.stringify({ name: 'Test User', email: 'test@example.com', subject: 'Editor test', message: 'Test message ' + new Date().toISOString() }) } });
  console.log(res.getContent());
}
