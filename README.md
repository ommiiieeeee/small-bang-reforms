# Small-Bang Reforms — Repository and Content Management System

Centre for Law, Policy and Governance, NFPRC Foundation.

This is the public repository site together with a small content management
system. Anyone may read the site. Only a signed-in editor may change it, and
that permission is checked on the server rather than in the browser, so it
cannot be bypassed by inspecting the page.

---

## What an editor can change without touching code

Sign in using the **Editor** button in the top right, then:

- **Page text.** The **Page text** button opens a panel containing all forty
  pieces of wording on the site, grouped by section: navigation labels, the
  headline and introduction, the five headline statistics, every section
  heading and description, the four analysis card titles, the search box
  placeholder, and all footer headings. In the headline, any words wrapped in
  asterisks are shown in the accent colour, so `Small reforms. *Outsized gains*`
  produces the current appearance.
- **The About narrative.** The **Edit this text** button beneath the "What
  Small-Bang Reforms are" section. Lines beginning with `## ` become headings
  and blank lines separate paragraphs.
- **Reform ideas.** Add a new idea, or expand any existing one and choose Edit.
  Each idea holds a title, a stage, its ministries, departments and themes, a
  description of what is proposed, an outcome note for closed reforms, and a
  link to its working paper or closure document. The first ministry listed is
  treated as the lead and is the one shown on the collapsed card.

Every change is saved centrally and is visible to all visitors immediately.

---

## Deploying it

### Step 1 — Put the project on Vercel

Either drag this folder into the Vercel dashboard using **Add New → Project →
Deploy without Git**, or push it to a repository and import that repository.
Using a repository is recommended, because later edits to the code then deploy
automatically.

### Step 2 — Connect a content store

In the Vercel project, open the **Storage** tab and create a **KV** store, then
connect it to the project. Vercel adds the credentials automatically. The code
accepts either the `KV_REST_API_URL` and `KV_REST_API_TOKEN` pair or the
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` pair, so any Redis-style
store from the marketplace will work.

### Step 3 — Set the editor password

In **Settings → Environment Variables**, add:

| Name | Value | Notes |
| --- | --- | --- |
| `EDITOR_PASSWORD` | a strong password of your choosing | Required. This is what editors type to sign in. |
| `SESSION_SECRET` | any long random string | Optional but recommended. Signs the session cookie. |

Apply them to the Production environment, then redeploy once so they take
effect.

### Step 4 — Decide who can read the site

If the Vercel project has **Deployment Protection** switched on, only members of
the Vercel team can open the site at all. For a site that the public or a wider
group should read, open **Settings → Deployment Protection** and set Vercel
Authentication to **Disabled**. Editing remains protected by the password
regardless of this setting.

---

## How the pieces fit together

| Path | Purpose |
| --- | --- |
| `index.html` | The page shell. Sets `window.SBR_API` and routes all reads and writes to the API. |
| `app.css` | The full design system. |
| `data.js` | The seed content: 113 reform ideas, 29 ministries, 43 departments, 20 themes. Used only until the first save. |
| `app.js` | The application: rendering, filtering, and the editing interface. |
| `logo.svg` | The NFPRC and CLPG lockup, traced to vector. |
| `api/content.js` | Returns the published content to anyone. Accepts a write only from a signed-in editor. |
| `api/login.js` | Compares the submitted password with `EDITOR_PASSWORD` and issues a signed session cookie. |
| `api/logout.js` | Clears the session. |
| `api/session.js` | Reports whether the caller is a signed-in editor, and whether the store and password are configured. |
| `api/_lib.js` | Shared helpers for storage access and cookie signing. |

The session cookie is HttpOnly, marked Secure, signed with HMAC-SHA256, and
expires after twelve hours. A forged or expired cookie is rejected.

---

## Operating notes

- **Before the first save**, the site shows the seed content from `data.js`.
  The first save writes the whole content set to the store, and everything
  afterwards is read from there.
- **If the store or password is missing**, the site still displays correctly
  from the seed data, and an attempt to save returns a clear message naming what
  is missing.
- **Concurrent editing** follows a last-write-wins rule. The content set is
  saved as a single record, so two editors saving at the same moment will have
  the later save prevail. For a small editorial team this is normally
  sufficient. If several people will edit simultaneously, the next step would be
  per-record saving and a revision history.
- **Backups.** The content is a single JSON record under the key `sbr:content`.
  Copying that value to a file is a complete backup, and pasting it back is a
  complete restore.
