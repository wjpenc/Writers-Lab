/* ============================================================
   views/misc.js - notification centre, terms, privacy, about
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon, A = WL.actions;

  var NOTIF_STYLE = {
    'work.approved': ['checkCircle', '#52c41a', '#f6ffed'],
    'work.denied': ['xCircle', '#f5222d', '#fff1f0'],
    'work.changes': ['edit', '#fa541c', '#fff2e8'],
    'work.new': ['inbox', '#1890ff', '#e6f7ff'],
    'work.withdrawn': ['eyeOff', '#8c8c8c', '#fafafa'],
    'work.deletion': ['trash', '#f5222d', '#fff1f0'],
    'comment.new': ['msg', '#1890ff', '#e6f7ff'],
    'comment.deleted': ['trash', '#f5222d', '#fff1f0'],
    'comment.reported': ['flag', '#fa541c', '#fff2e8'],
    'comment.probation': ['clock', '#faad14', '#fffbe6'],
    'flag.high': ['warn', '#f5222d', '#fff1f0'],
    'application.new': ['users', '#722ed1', '#f9f0ff'],
    'application.decided': ['award', '#52c41a', '#f6ffed'],
    'role.changed': ['award', '#722ed1', '#f9f0ff'],
    'role.expiring': ['clock', '#faad14', '#fffbe6'],
    'advisor.transfer': ['swap', '#722ed1', '#f9f0ff'],
    'account.status': ['lock', '#f5222d', '#fff1f0'],
    'queue.needs_review': ['list', '#1890ff', '#e6f7ff'],
    'report.received': ['flag', '#8c8c8c', '#fafafa'],
    'report.resolved': ['checkCircle', '#52c41a', '#f6ffed']
  };

  function notifRow(n, compact) {
    var s = NOTIF_STYLE[n.type] || ['info', '#1890ff', '#e6f7ff'];
    return h('div.notif' + (n.readAt ? '' : '.unread'), {
      role: n.link ? 'button' : null,
      tabindex: n.link ? '0' : null,
      style: n.link ? 'cursor:pointer' : null,
      onclick: n.link ? function () { A.markRead(n.id); location.hash = n.link; } : null,
      onkeydown: n.link ? function (e) {
        if (e.key === 'Enter') { A.markRead(n.id); location.hash = n.link; }
      } : null
    },
      h('span.ic', { style: 'background:' + s[2] + ';color:' + s[1] }, icon(s[0], 16)),
      h('div.tx', null,
        h('b', null, n.title),
        h('span', null, n.body)),
      h('time', { datetime: n.createdAt }, WL.fmtAgo(n.createdAt))
    );
  }

  WL.views.notifRow = notifRow;

  WL.views.notifications = function () {
    var S = WL.store.state;
    var me = WL.me();
    var mine = S.notifications.filter(function (n) { return n.userId === me.id; });
    var unread = mine.filter(function (n) { return !n.readAt; }).length;

    return h('div.container.narrow', null,
      h('div.spread.mb8', null,
        h('h1.page-title.with-sub', { style: 'margin-bottom:0' }, 'Notifications'),
        unread ? h('button.btn', {
          type: 'button', onclick: function () { A.markAllRead(); ui.toast('All marked as read.'); }
        }, 'Mark all as read') : null),
      h('p.page-sub', null,
        'In-app only in this prototype — there is no email integration. In production these would also be delivered by email, with every administrator notification type individually switchable both site-wide and per account, so that school mail filtering cannot silently swallow them.'),

      ui.card(null, mine.length
        ? h('div', null, mine.map(function (n) { return notifRow(n); }))
        : ui.empty('Nothing yet', 'Notifications about your work and your role appear here.'))
    );
  };

  /* ---------------- Legal pages ---------------- */

  WL.views.terms = function () {
    return h('div.container.narrow', null,
      h('h1.page-title.with-sub', null, 'Terms of Use'),
      h('p.page-sub', null, 'Draft for advisor and district review. Nothing here is legal advice, and it should be read by the faculty advisor — and by district staff if the district requires it — before the site opens.'),
      ui.card(null, h('div.legal', null,
        h('h2', null, 'Who may use this site'),
        h('p', null, 'The Writers Lab is operated by the school’s National English Honor Society chapter under the supervision of a faculty advisor. Accounts are for current students and staff of the school.'),

        h('h2', null, 'What you may submit'),
        h('p', null, 'Submit your own writing. Do not submit:'),
        h('ul', null,
          h('li', null, 'work that is not yours, or work that copies a published source without attribution;'),
          h('li', null, 'anything that identifies another student by name in a way that would embarrass them, or that discusses a specific classmate’s grades, discipline record or private circumstances;'),
          h('li', null, 'material that would violate the school’s student conduct policy if you said it out loud in a classroom.'),
          h('li', null, 'files in any format other than .docx, .pptx or .pdf.')),
        h('p', null, 'Writing about difficult subjects is not prohibited. Fiction about violence, essays about grief, and honest personal writing all belong here. What matters is the treatment, and a person makes that judgement — not a filter.'),

        h('h2', null, 'Conduct expected of reviewers'),
        h('p', null, 'Feedback is about the writing. A comment that is about the writer rather than the work will be removed.'),
        h('ul', null,
          h('li', null, 'Name something specific that works, and say why.'),
          h('li', null, 'Point at the sentence or paragraph that is unclear, not at the whole piece.'),
          h('li', null, 'Offer one concrete thing the writer could do next.'),
          h('li', null, 'Do not attempt to identify an anonymous author, and do not share what you read here outside the site.')),

        h('h2', null, 'Moderation and enforcement'),
        h('p', null, 'Every submission is read by an officer administrator or the faculty advisor before publication. Denials come with a written reason. Comments may be removed, and reviewer status revoked, with the reason recorded in an audit log that administrators cannot edit.'),
        h('p', null, 'Automated screening flags submissions for human attention. It never rejects anything on its own, and a flag is not an accusation — most flags are ordinary writing.'),

        h('h2', null, 'Your control over your work'),
        h('p', null, 'You keep ownership of everything you write. Submitting it here does not give the school or the club any right to publish it elsewhere. You can withdraw a submission from public view at any time, yourself, without asking anyone. You can request permanent deletion, subject to the retention policy.'),

        h('h2', null, 'Anonymity, and its limits'),
        h('p', null, 'Your name is not shown to other students, and it is not present in the file they can download. Administrators can see it, subject to the site’s author-visibility setting; the faculty advisor always can.'),
        h('p', null, 'The system removes hidden file metadata automatically. It cannot remove your name if you typed it into the body of your document, into a header, or into a footer.'),

        h('h2', null, 'Safety'),
        h('p', null, 'If writing submitted here suggests that a student may be at risk of harm, the faculty advisor will follow the school’s existing reporting obligations. Anonymity on this site does not override those obligations.')
      )));
  };

  WL.views.privacy = function () {
    return h('div.container.narrow', null,
      h('h1.page-title.with-sub', null, 'Privacy Policy'),
      h('p.page-sub', null, 'Draft for advisor and district review.'),
      ui.card(null, h('div.legal', null,
        h('h2', null, 'What is collected'),
        h('ul', null,
          h('li', null, h('b', null, 'Account information: '), 'your name, your school email address, your grade level, and your role on the site.'),
          h('li', null, h('b', null, 'Submissions: '), 'the file you upload, the text extracted from it for screening, the title, description and tags you supply, and the identity of the account that submitted it.'),
          h('li', null, h('b', null, 'Comments: '), 'the text you write, the work it is attached to, and the role you held when you wrote it.'),
          h('li', null, h('b', null, 'Administrative records: '), 'every moderation decision, role change and account action, with who did it, when, and the reason given.'),
          h('li', null, h('b', null, 'Activity: '), 'when you last used the site.')),

        h('h2', null, 'Who can see what'),
        h('p', null, 'Author names are stored in the database and shown only to roles permitted to see them. Whether officer administrators — who are students themselves — can see author names is a site setting decided by the faculty advisor.'),
        h('p', null, 'Comment authors are never anonymous to administrators, even on submissions where the writer is. This is deliberate: peer review is where one student writes directly about another student’s work, and someone has to be accountable for what is written.'),
        h('p', null, 'No student data is sold, shared with advertisers, or used to train anything.'),

        h('h2', null, 'Files'),
        h('p', null, 'Two copies of each submission are kept. The original retains its metadata and is reachable only by administrators. The published copy is stripped of document properties, tracked changes and revision history, renamed to a generated identifier, and is the only version other users can download.'),
        h('p', null, 'Files are served through authenticated, time-limited links rather than from a public storage path.'),

        h('h2', null, 'How long it is kept'),
        h('p', null, 'Set by the school’s retention policy, which the faculty advisor is responsible for establishing before launch. The decision about what happens to the archive if the program ends is documented in the operations handbook rather than left to whoever is holding the password.'),

        h('h2', null, 'Deleting your data'),
        h('p', null, 'You can withdraw any submission from public view immediately and without approval. You can request permanent deletion through the site; the request and its date are recorded, and the work is withdrawn from view in the meantime.'),
        h('p', null, 'Comments are soft-deleted rather than erased, so that the audit trail behind a moderation decision survives. The text stops being visible to users and remains visible to administrators.'),

        h('h2', null, 'Security'),
        h('ul', null,
          h('li', null, 'HTTPS everywhere, with HSTS.'),
          h('li', null, 'Authorisation checked on the server for every request. A hidden button is not a permission.'),
          h('li', null, 'Uploaded files validated by content rather than filename, scanned for malware, and rejected if macro-enabled.'),
          h('li', null, 'Comment text sanitised before rendering.'),
          h('li', null, 'Rate limits on uploads, comments, applications and sign-in attempts.'),
          h('li', null, 'Automated, tested backups of the database and of stored files.')),

        h('h2', null, 'Who to contact'),
        h('p', null, 'The faculty advisor is the point of contact for any question about data on this site, including from a parent or guardian.')
      )));
  };

  /* ---------------- About the prototype ---------------- */

  WL.views.about = function () {
    var S = WL.store.state;
    return h('div.container.narrow', null,
      h('h1.page-title.with-sub', null, 'About This Prototype'),
      h('p.page-sub', null,
        'A working demonstration of the Writers Lab Online proposal, built so the features can be shown to school administrators before any commitment is made to build the real thing.'),

      h('div.stack', null,
        ui.card(h('h3', null, 'What is real here, and what is staged'),
          h('div', null,
            h('div.legal', null,
              h('h3', null, 'Genuinely working'),
              h('ul', null,
                h('li', null, 'The role model. All four roles enforce the capability table from the specification — try the same page as each account.'),
                h('li', null, 'File validation. Choosing a file on the submission page reads its actual bytes: format is identified from magic numbers rather than the extension, and the parts inside a .docx or .pptx are listed straight out of the ZIP structure. Rename a program to end in .docx and it will be caught.'),
                h('li', null, 'Metadata detection. The report showing docProps/core.xml and friends is reading your real file, not a canned list.'),
                h('li', null, 'Content screening. Paste text containing something that should be flagged and watch the tiered severity, the category, and the flagged passage in context.'),
                h('li', null, 'The audit log, notifications, moderation decisions, role changes and the advisor transfer handshake — all of it writes real records you can inspect from another account.')),
              h('h3', null, 'Staged for the demonstration'),
              h('ul', null,
                h('li', null, 'No authentication. Account switching is a dropdown, deliberately, so that a room full of people can see all four perspectives in two minutes. The real system authenticates properly and enforces every one of these checks on the server.'),
                h('li', null, 'No email. Notifications appear in the in-app notification centre only.'),
                h('li', null, 'Malware scanning and PDF conversion are shown as pipeline steps rather than performed.'),
                h('li', null, 'Data lives in your browser. Nothing is transmitted anywhere.'))))),

        ui.card(h('h3', null, 'The four demonstration accounts'),
          h('div', null, S.users.filter(function (u) { return u.demoAccount; }).map(function (u) {
            return h('div', { style: 'padding:14px 0;border-bottom:1px solid #f0f0f0' },
              h('div.row', { style: 'align-items:center;gap:11px;margin-bottom:8px' },
                WL.avatar(u.displayName, u.id),
                h('b', null, u.displayName),
                ui.roleBadge(u.role)),
              h('div.small.muted', { style: 'line-height:1.7' }, u.demoBlurb),
              h('div.mt8', null,
                h('button.btn.btn-sm', {
                  type: 'button',
                  onclick: function () { A.switchAccount(u.id); ui.toast('Now signed in as ' + u.displayName + '.'); }
                }, 'Switch to this account')));
          }))),

        ui.card(h('h3', null, 'Suggested walkthrough'),
          h('div.legal', null,
            h('p', null, 'Roughly ten minutes, and it hits every part administrators tend to ask about.'),
            h('ul', null,
              h('li', null, h('b', null, 'As Maya Chen (student): '), 'submit a piece. Paste text containing the word “knife” to see the screening tier fire. Note that the flagged submission is held rather than rejected.'),
              h('li', null, h('b', null, 'As Priya Raman (officer): '), 'open the review queue. The flagged piece is at the top with the passage in context. Approve it over the flag with a recorded reason — or deny it, which forces a written explanation.'),
              h('li', null, h('b', null, 'Back as Maya: '), 'the notification is waiting, and the decision reason is on the submission.'),
              h('li', null, h('b', null, 'As Devon Brooks (reviewer): '), 'open Needs Review — pieces with no feedback are first — and leave a comment. Try a two-word one and watch what happens.'),
              h('li', null, h('b', null, 'As Priya again: '), 'note the author name is hidden from officers by site policy. Open the audit log.'),
              h('li', null, h('b', null, 'As Ms. Hartley (advisor): '), 'the author name is visible. Turn the officer visibility policy on or off in Settings and watch the queue change. Offer the advisor role to another teacher and see that it does not take effect until they accept.'))))
      ));
  };
})(window.WL);
