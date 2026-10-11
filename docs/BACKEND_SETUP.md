# Contact form backend: setup guide

## 1. Architecture

```
Visitor's browser (Netlify site)
   │  POST (text/plain JSON)
   ▼
Google Apps Script Web App   ← validates, rate-limits, locks, sanitises
   │  runs as YOU
   ▼
Private Google Sheet "Contact Submissions"   ← File > Download > Excel / CSV
```

- No server to maintain, no database to host, no secrets in the website.
- The sheet is never public. Only the script (running as you) can write to it.

## 2. Files

| File | Role |
|---|---|
| `backend/Code.gs` | Complete Apps Script backend (paste into the editor) |
| `backend/appsscript.json` | Optional manifest: minimum permission + deployment settings |
| `frontend/js/contact.js` | Form submit logic (loading state, validation, honest success message) |
| `frontend/js/data.js` | **Only line you edit:** `contactEndpoint: ""` |
| `frontend/index.html` | Contact form + hidden honeypot field + status line |
| `frontend/css/style.css` | Status message, spinner and honeypot styles |
| `netlify.toml` | Publishes only `frontend/`, adds security headers |

## 3. Create the private Google Sheet

1. Go to sheets.google.com and create a blank spreadsheet. Name it e.g. `Portfolio Contact Data`.
2. Do **not** click Share. Leave it private to your account.
3. The worksheet `Contact Submissions` with its 7 columns (Submission ID, Timestamp, Full Name, Email Address, Subject, Message, Status) is created automatically by the script.

## 4. Add the script

1. In the sheet: **Extensions → Apps Script**. (A script opened this way is bound to the sheet, so no ID is needed.)
2. Delete the sample code and paste all of `backend/Code.gs`. Save.
3. Optional but recommended (minimum permissions): **Project Settings → Show "appsscript.json" manifest file in editor**, open it and paste `backend/appsscript.json`.
4. **Spreadsheet ID (only if the script is NOT bound to the sheet):** Project Settings → Script properties → Add property `SPREADSHEET_ID` = the long ID in your sheet URL between `/d/` and `/edit`. The ID is never in code and never in responses.
5. Choose the function `setup` in the toolbar and click **Run**. Approve the permission prompt (Advanced → Go to project → Allow). Check that the sheet now has the headers.

## 5. Deploy as a Web App

**Deploy → New deployment → ⚙ → Web app**

| Setting | Value | Why |
|---|---|---|
| Execute as | **Me** | Visitors never need Google access to your sheet. The script writes on your behalf. |
| Who has access | **Anyone** | Visitors have no Google login, so they must be able to call the URL. |

Click **Deploy**, then copy the **Web app URL** (ends in `/exec`).

What "Anyone" means: anybody who knows the URL can *send a POST request* to your script. They **cannot** read the sheet, list records or download anything: the script has no read endpoint (`doGet` only returns `{ok:true}`). The URL is not a secret (it is visible in the website's JavaScript), which is why validation, a honeypot and rate limits are built in.

After editing the script later: **Deploy → Manage deployments → ✏ → Version: New version → Deploy**. The URL stays the same. (Saving alone does not update the live version.)

## 6. Connect the frontend

Open `frontend/js/data.js` and set:

```js
contactEndpoint: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

Until this is filled in, the form falls back to opening the visitor's email app (nothing is claimed as saved).

Why `text/plain`? Apps Script web apps cannot answer CORS preflight (`OPTIONS`) requests. A `POST` with `Content-Type: text/plain` is a CORS "simple request" (no preflight), and Google's response is readable by the page, so the site can confirm the row was really saved. No `no-cors` trick is used (it would hide the response and make real confirmation impossible).

## 7. Publish on GitHub and Netlify

1. Create a GitHub repo and upload everything in this folder (keep the folder structure).
2. Netlify → **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build command: *(empty)*. Publish directory: `frontend` (already set by `netlify.toml`). Deploy.
4. Later changes: edit files → commit → Netlify redeploys automatically.
5. The Content-Security-Policy in `netlify.toml` already allows `script.google.com` and `script.googleusercontent.com`. If you ever move to another host, copy those headers or remove the CSP line.

Vercel also works: import the repo, set **Root Directory** to `frontend`, framework preset **Other**.

## 8. Download your data

Open the sheet → **File → Download → Microsoft Excel (.xlsx)** or **Comma-separated values (.csv)** (downloads the current worksheet).

- Timestamp is a real date-time (`yyyy-mm-dd hh:mm:ss`), the rest are plain text: ready for Excel, Pandas (`pd.read_csv(..., parse_dates=["Timestamp"])`) and BI tools.
- Change the **Status** dropdown (New / Read / Replied / Spam) to keep track of replies.
- Text that began with `= + - @` is stored with a leading `'` (formula-injection guard), so a CSV opened in Excel can never run it as a formula.
- There is deliberately no public export endpoint.

## 9. Security notes and limits (read this)

Built in: server-side validation and length limits, 10 KB request cap, JSON-only parsing, formula-injection guard, honeypot field, per-email limit (3 per 10 min), global limit (40 per hour), duplicate-message block, script lock for concurrent writes, generic error messages (no IDs, stack traces or config in responses).

Honest limitations of an anonymous Apps Script endpoint:
- A **honeypot only stops simple bots**. A targeted spammer can skip the form and call the URL directly.
- Apps Script cannot see the visitor's IP address, so limits are per email and global, not per person. Someone rotating email addresses can still fill the global quota (40/hour), which temporarily blocks real visitors.
- Google enforces its own quotas on Apps Script (executions and sheet size). Very high traffic is not a good fit.

If the portfolio starts getting real traffic or spam: add **Cloudflare Turnstile or reCAPTCHA** (the frontend sends the token; the script verifies it with `UrlFetchApp` using a secret kept in Script properties), or move to a Netlify Function / Vercel serverless function that checks the visitor's IP and writes to the sheet with a service account.

## 10. Test plan

Run these on the live site after deploying (nothing here has been run against your real Google account yet):

| # | Test | Expected |
|---|---|---|
| 1 | Valid submission | Green "Thank you… (ref MS-…)" and one new row with ID, timestamp, status `New` |
| 2 | Leave fields empty | Red message, no request sent, no row |
| 3 | Email `abc` | "Please enter a valid email address." |
| 4 | Message of 2001+ characters | Rejected (also try the Apps Script `testSubmission` with a long text) |
| 5 | Double-click Send / send same text again | Button disabled while sending; repeat is blocked ("already sent") |
| 6 | Turn off Wi-Fi, then submit | Red network message, no success shown |
| 7 | Backend error: temporarily rename the sheet's script property to a wrong `SPREADSHEET_ID` | Generic server error, no ID or stack trace visible |
| 8 | Send 3 different messages | 3 new rows, in order, none overwritten |
| 9 | Concurrent: open the site in two browsers and press Send at the same moment (different emails) | Both rows saved, no gaps or overwrites |
| 10 | Count rows vs. successful confirmations | Equal |
| 11 | Honeypot: in DevTools type text into the hidden `website` field, submit | Looks successful, but **no row** is added |
| 12 | Formula: message `=1+1` | Stored as text `'=1+1` |
| 13 | Rate limit: send 4 different messages quickly with the same email | 4th is refused |
| 14 | Export | Download CSV/XLSX, row count and columns match the sheet |

## 11. Troubleshooting

| Problem | Cause / fix |
|---|---|
| "Network problem" right away | `contactEndpoint` wrong, or deployment access is not **Anyone**. Open the URL in a browser: you should see `{"ok":true,"service":"portfolio-contact"}`. |
| CORS error in console | You deployed with access "Only myself" or used a URL ending in `/dev`. Use the `/exec` URL from a deployment with access **Anyone**. |
| Edits to the script have no effect | Create a **new version** under Manage deployments. |
| "Authorization required" / nothing saved | Run `setup` once in the editor and approve permissions. |
| "SERVER_ERROR" message | Open Apps Script → **Executions** to read the real error (wrong `SPREADSHEET_ID`, deleted sheet, quota). |
| "Too many messages" while testing | Wait 10 minutes or use another email. The limits are working. |
| Form shows "Opening your email app" | `contactEndpoint` in `data.js` is still empty. |
| No row but green success | Only possible for the honeypot case (field filled). Check you did not autofill the hidden field. |
| Browser tab icon is old | Browsers cache favicons for a long time. Hard refresh (Ctrl+Shift+R) or open in a private window. |
