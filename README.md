# Writers Lab Online — prototype

A working demonstration of the Writers Lab Online proposal, built so the features
can be shown to school administrators before anyone commits to building the real
thing. It implements the feature specification in Part Two of *Writers Lab Plan.docx*,
with the two integrations deliberately left out: **no Microsoft/Entra sign-in and no
email**.

---

## Running it

Double-click **`Start Writers Lab.bat`**, or open `index.html` in a browser.

There is nothing to install — no Node, no npm, no build step, no database. It is
plain HTML, CSS and JavaScript.

The `.bat` file starts a small local web server if Python is available, because that
lets the browser remember what you do between page reloads. Opening `index.html`
directly also works; it just resets when you reload the page.

Nothing is transmitted anywhere. All data stays in your browser.

---

## The four accounts

Use the **account button in the top-right corner** to switch between them instantly.
No passwords, no sign-in screen — the point is to show every perspective in one
sitting without logging in and out.

| Account | Role | What they can do |
|---|---|---|
| Maya Chen | Student | Submit work, browse approved pieces, reply to feedback on her own writing. Cannot comment on other students' work. |
| Devon Brooks | Peer Reviewer | Everything a student can, plus leave feedback on any approved submission and work the needs-review queue. |
| Priya Raman | Officer Administrator | Moderation queue, reviewer applications, comment reports, accounts, audit log, analytics. |
| Ms. Ellen Hartley | Teacher Advisor | Full authority: always sees author identities, grants and revokes officer status, transfers the advisor role. |

The capability table from section 1.2 of the specification is enforced exactly.
Switch to Maya and open `#/accounts` — you get a refusal page, not a hidden button.

---

## Suggested ten-minute walkthrough

1. **As Maya Chen (Student)** — go to **Submit**. The consent screen appears
   because she has not submitted before. On the next step, paste a paragraph
   containing the word *knife*, then finish the form and submit. Watch the
   processing pipeline, then read the result: the piece is **held, not rejected**,
   with the flagged passage quoted in context.
2. **Switch to Priya Raman (Officer Admin)** — open the **Review Queue**. The flagged
   piece is at the top, sorted by severity, with the passage highlighted. Note that
   the author's name says *Withheld — site policy hides authors from officers*.
   Approve it over the flag; you are asked for a reason, which is recorded.
3. **Switch back to Maya** — the notification is waiting, and the decision is on the
   submission. Try **Withdraw** on any of her pieces: it leaves public view
   immediately, with no email to an administrator.
4. **Switch to Devon Brooks (Reviewer)** — open **Needs Review**. Pieces with no
   feedback are first. Leave a comment on one. Then try posting a two-word comment
   and see what happens.
5. **Switch to Ms. Hartley (Advisor)** — the author's name is now visible everywhere.
   In **Site Settings**, flip *Officer administrators can see author identities* and
   switch back to Priya to watch the queue change. In **Accounts**, offer the primary
   advisor role to Mr. Okafor and note that nothing changes until he accepts.
6. **Open the Audit Log** — every action from the last ten minutes is there, with who
   did it, when, and why. Export it as CSV.

---

## What is genuinely working, and what is staged

This distinction matters if an administrator asks "is that real?"

**Real**

- **The role model.** All four roles enforce the specification's capability table,
  including the site-setting-controlled question of whether officers can de-anonymise
  authors.
- **File validation.** Choosing a file on the Submit page reads its actual bytes.
  The format is identified from magic numbers, not the extension — rename a program
  to `essay.docx` and it is caught. A `.doc` disguised as a `.docx` is caught. A
  macro project inside the file is caught.
- **Metadata detection.** The report listing `docProps/core.xml`, `docProps/app.xml`
  and `word/comments.xml` is read out of the ZIP structure of the file you actually
  chose. For PDFs it reads the Info dictionary keys. It is not a canned list.
- **Content screening.** Tiered severity, categories, and the flagged passage shown
  in its surrounding sentence. High and medium severity hold a submission from
  publication; low severity publishes and is logged.
- **Everything downstream.** Moderation decisions, notifications, the audit log,
  comment reports, role changes, role expiry, and the two-step advisor transfer all
  write real records you can inspect from another account.

**Staged**

- **No authentication.** Account switching is a dropdown, on purpose.
- **No email.** Notifications appear in the in-app notification centre only.
- **Malware scanning and PDF conversion** are shown as pipeline steps, not performed.
- **Screening** is a keyword-and-category classifier standing in for a hosted service
  such as Azure AI Content Safety. It lives in one file (`js/screening.js`) and
  returns the same shape the real service does, so swapping it is a contained change.
- **Data lives in your browser**, not on a server.

The prototype's own **About this prototype** page (in the account menu) says all of
this too, so it is visible during a demonstration without needing this file.

---

## Specification coverage

| Spec section | Where to see it |
|---|---|
| 1.2 Role model | Account switcher; any admin page as a student |
| 1.3 Account console | Administration → Accounts, and the per-account detail dialog |
| 1.3 Advisor transfer | Accounts, as Ms. Hartley — requires the recipient to accept |
| 1.4 Annual role review | Accounts → Annual role review panel |
| 2.1 File validation | Submit → choose a file |
| 2.2 Metadata stripping | Submit → the report after choosing a file; result screen |
| 2.3 Consent screen | Submit, as Maya Chen |
| 2.4 Author controls | My Work — withdraw, restore, new version, request deletion |
| 3.1 Automated filtering | Submit a piece with flagged language; Review Queue |
| 3.2 Review queue | Administration → Review Queue |
| 3.3 Comment moderation | Administration → Comment Moderation |
| 3.4 Audit log | Administration → Audit Log |
| 4.1 Reviewer applications | Account menu → Apply; Administration → Reviewer Applications |
| 4.2 Comments and role badges | Any work page |
| 4.3 Structured feedback prompts | The scaffold beside the comment box |
| 4.4 Needs-review queue and claims | Needs Review |
| 5.1 Browse and search | Browse Work |
| 5.2 Work detail page | Any work page |
| 6.1 Notifications | The bell, and Notifications |
| 7.1 Accessibility | Keyboard navigation, focus rings, labels, semantic markup throughout |
| 7.3 Analytics | Administration → Analytics, with CSV export |
| 7.5 Legal pages | Terms of use, Privacy policy (footer) |
| 8 Data model | `js/data.js` and `js/store.js` follow the suggested entities |

Not implemented: Entra ID sign-in and the local password fallback (1.1), email
delivery (6.1), and the operational items in 7.2 and 7.4, which are hosting and
process concerns rather than screens.

---

## File layout

```
index.html               page shell and script order
assets/styles.css        all styling
js/util.js               DOM helpers, icons, date and size formatting
js/data.js               seed accounts, submissions, comments, audit entries
js/store.js              state, persistence, the permission model, all actions
js/ui.js                 shared components: tables, tags, modals, toasts
js/screening.js          content screening — the piece you would swap for a real service
js/fileinspect.js        real byte-level file validation and metadata detection
js/views/                one file per page
js/app.js                header, account switcher, router
```

To reset everything to its original state: **Site Settings → Reset demonstration
data** (as an administrator), or clear the site data in your browser.

---

## A note for whoever builds the real thing

Two things in here are worth carrying over directly rather than rebuilt:

- The permission checks all go through one function (`WL.can` in `js/store.js`).
  Keeping that shape server-side means the authorisation rules stay readable and
  testable in one place. In production every one of those checks has to run on the
  server; the client-side version is a convenience for hiding controls, never the
  security boundary.
- Comments store `authorRoleAtTime`. An officer who graduates and loses admin status
  must not retroactively change how their old comments are labelled. It is a one-word
  decision that is painful to add later.
