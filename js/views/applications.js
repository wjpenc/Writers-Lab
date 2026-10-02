/* ============================================================
   views/applications.js - reviewer applications (spec 4.1)
   Includes the student-facing application form.
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, A = WL.actions;

  var st = { tab: 'pending' };

  /* ---------------- Administrator queue ---------------- */

  WL.views.applications = function () {
    var S = WL.store.state;
    if (!WL.can('reviewApplications')) return WL.views.denied('reviewer applications');

    var all = S.applications;
    var lists = {
      pending: all.filter(function (a) { return a.status === 'pending'; }),
      approved: all.filter(function (a) { return a.status === 'approved'; }),
      rejected: all.filter(function (a) { return a.status === 'rejected'; })
    };
    var rows = lists[st.tab] || [];

    function appCard(a) {
      var u = WL.user(a.userId) || {};
      return h('div.card.mb16', null, h('div.card-body', null,
        h('div.spread.mb16', null,
          h('div.row', { style: 'align-items:center;gap:12px' },
            WL.avatar(u.displayName, u.id, true),
            h('div', null,
              h('div', { style: 'font-weight:600;font-size:15px' }, u.displayName || 'Unknown'),
              h('div.small.muted', null,
                'Grade ' + (a.gradeLevel || u.gradeLevel || '—') + ' · ' + (a.englishCourse || 'Course not given')))),
          h('div.row', { style: 'gap:8px;align-items:center' },
            a.status === 'pending' ? ui.tag('Pending', 'gold')
              : a.status === 'approved' ? ui.tag('Approved', 'green') : ui.tag('Not approved', 'red'),
            h('span.small.muted', null, WL.fmtAgo(a.createdAt)))),

        a.teacherReference ? h('div.mb16', null,
          h('span.small.muted', null, 'Teacher reference: '), h('b', null, a.teacherReference)) : null,

        h('div', { style: 'white-space:pre-wrap;line-height:1.8;background:#fafafa;border:1px solid #f0f0f0;border-radius:4px;padding:16px 18px' },
          a.statement),

        a.status !== 'pending' ? h('div.mt16', null,
          ui.alert(a.status === 'approved' ? 'ok' : 'info', h('div', null,
            h('b', null, a.status === 'approved' ? 'Approved ' : 'Not approved '),
            'by ' + WL.userName(a.decidedBy) + ' on ' + WL.fmtDate(a.decidedAt) + '.',
            a.decisionReason ? h('div.mt8', null, a.decisionReason) : null))) : null,

        a.status === 'pending' ? h('div.btn-row.mt16', null,
          h('button.btn.btn-primary', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Approve ' + u.displayName + ' as a peer reviewer',
                required: false, confirmLabel: 'Approve',
                intro: 'They will be able to comment on any approved submission. ' +
                  (S.settings.probationaryComments
                    ? 'Their first ' + S.settings.probationCommentCount + ' comments are held for administrator approval, because the probationary setting is on.'
                    : 'Their comments go live immediately — the probationary setting is off.'),
                label: 'Note (optional)',
                onConfirm: function (r) {
                  A.decideApplication(a.id, 'approved', r || 'Approved.');
                  ui.toast(u.displayName + ' is now a peer reviewer.');
                }
              });
            }
          }, 'Approve'),
          h('button.btn.btn-danger', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Do not approve this application', danger: true, confirmLabel: 'Send decision',
                intro: 'A written reason is required and is delivered to the applicant, along with whether they may reapply.',
                label: 'Reason',
                onConfirm: function (r) {
                  A.decideApplication(a.id, 'rejected', r);
                  ui.toast('Decision sent to the applicant.');
                }
              });
            }
          }, 'Do not approve')) : null
      ));
    }

    return h('div.container.mid', null,
      h('h1.page-title.with-sub', null, 'Reviewer Applications'),
      h('p.page-sub', null,
        'Applicants are never anonymous — an administrator sees who applied and what they wrote. A rejection requires a written reason, which is delivered to the applicant.'),

      h('div.tabs', null,
        ['pending', 'approved', 'rejected'].map(function (k) {
          var labels = { pending: 'Pending', approved: 'Approved', rejected: 'Not approved' };
          return h('button.tab' + (st.tab === k ? '.active' : ''), {
            type: 'button', onclick: function () { st.tab = k; WL.render(); }
          }, labels[k], h('span.cnt', null, '(' + lists[k].length + ')'));
        })),

      rows.length ? rows.map(appCard)
        : ui.card(null, ui.empty('Nothing in this list',
            st.tab === 'pending' ? 'No applications are waiting on a decision.' : null))
    );
  };

  /* ---------------- Student application form ---------------- */

  WL.views.apply = function () {
    var S = WL.store.state;
    var me = WL.me();
    var mine = S.applications.filter(function (a) { return a.userId === me.id; });
    var latest = mine.length ? mine[0] : null;

    if (WL.can('commentAnywhere')) {
      return h('div.container.narrow', null,
        h('h1.page-title', null, 'Peer Reviewer'),
        ui.card(null, h('div', null,
          ui.alert('ok', h('div', null,
            h('b', null, 'You are already an approved peer reviewer. '),
            'You can leave feedback on any approved submission.')),
          h('div.btn-row.mt24', null,
            h('button.btn.btn-primary', {
              type: 'button', onclick: function () { location.hash = '#/needs-review'; }
            }, 'Open the needs-review queue')))));
    }

    if (latest && latest.status === 'pending') {
      return h('div.container.narrow', null,
        h('h1.page-title', null, 'Peer Reviewer'),
        ui.card(h('h3', null, 'Your application'),
          h('div', null,
            ui.alert('info', h('div', null,
              h('b', null, 'Submitted ' + WL.fmtAgo(latest.createdAt) + '. '),
              'An officer administrator or the faculty advisor will decide on it. You will be notified either way.')),
            h('div.mt24'),
            h('div', { style: 'white-space:pre-wrap;line-height:1.8;background:#fafafa;border:1px solid #f0f0f0;border-radius:4px;padding:16px 18px' },
              latest.statement))));
    }

    var courseIn = h('input.input', { type: 'text', placeholder: 'e.g. AP Language — Ms. Hartley' });
    var refIn = h('input.input', { type: 'text', placeholder: 'Optional' });
    var stmtIn = h('textarea.input', {
      rows: 8,
      placeholder: 'What kind of feedback do you think is useful, and why? What would you want to focus on?'
    });

    return h('div.container.narrow', null,
      h('h1.page-title.with-sub', null, 'Apply to be a Peer Reviewer'),
      h('p.page-sub', null,
        'Peer reviewers can leave written feedback on any approved submission. Anyone signed in may apply.'),

      latest && latest.status === 'rejected' ? h('div.mb24', null,
        ui.alert('warn', h('div', null,
          h('b', null, 'A previous application was not approved. '),
          latest.decisionReason,
          latest.mayReapply ? h('div.mt8', null, 'You may reapply.') : null))) : null,

      ui.card(null, h('div', null,
        ui.field('Your English course this year', courseIn, null, true),
        ui.field('Teacher who would vouch for you', refIn, 'Optional. The advisor may check with them.'),
        ui.field('Why do you want to review, and how would you do it?', stmtIn,
          'The one thing the advisor is actually assessing is whether you describe how you would give feedback to another writer.', true),
        h('div.btn-row', null,
          h('button.btn.btn-primary.btn-lg', {
            type: 'button',
            onclick: function () {
              if (!courseIn.value.trim() || !stmtIn.value.trim()) {
                ui.toast('Fill in your course and your statement.', 'warn'); return;
              }
              A.submitApplication({
                englishCourse: courseIn.value.trim(),
                teacherReference: refIn.value.trim(),
                statement: stmtIn.value.trim()
              });
              ui.toast('Application submitted.');
              location.hash = '#/apply';
            }
          }, 'Submit application'))))
    );
  };
})(window.WL);
