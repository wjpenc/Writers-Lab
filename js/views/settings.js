/* ============================================================
   views/settings.js - site settings (spec 1.2 policy, 3.1, 6.1)
   Officer admins get a limited subset; the advisor gets all of it.
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, A = WL.actions;

  WL.views.settings = function () {
    var S = WL.store.state;
    if (!WL.can('limitedSettings')) return WL.views.denied('site settings');

    var full = WL.can('fullSettings');

    function set(key, label) {
      return function (v) {
        A.setSetting(key, v, label + ' set to ' + (v ? 'ON' : 'OFF') + '.');
        ui.toast('Setting saved and logged.');
      };
    }

    var tagInput = h('input.input', { type: 'text', placeholder: 'New tag name' });
    var kwInput = h('input.input', { type: 'text', placeholder: 'New keyword' });

    return h('div.container.mid', null,
      h('h1.page-title.with-sub', null, 'Site Settings'),
      h('p.page-sub', null,
        'Every change here is written to the audit log with who made it and when. ' +
        (full
          ? 'You are the faculty advisor, so all settings are available to you.'
          : 'You are an officer administrator, so the policy settings that govern what officers themselves can see are read-only.')),

      h('div.stack', null,
        ui.card(h('h3', null, 'Author visibility policy'),
          h('div', null,
            ui.alert(full ? 'info' : 'warn', h('div', null,
              h('b', null, 'This is the decision the whole anonymity model turns on. '),
              'Officer administrators are peers of the students submitting work. Students may write more honestly if only teachers can de-anonymise them. ' +
              'It is a site setting rather than a code path so it can be changed after a conversation with the advisor, not after a deployment.')),
            h('div.mt16'),
            ui.switchLine(
              'Officer administrators can see author identities',
              full
                ? 'Currently ' + (S.settings.officersCanSeeAuthors ? 'ON — officers see who wrote every submission.' : 'OFF — officers moderate without author names. The faculty advisor can always see them.')
                : 'Only the faculty advisor can change this setting.',
              S.settings.officersCanSeeAuthors,
              set('officersCanSeeAuthors', 'Officer author visibility'),
              !full))),

        ui.card(h('h3', null, 'Peer review'),
          h('div', null,
            ui.switchLine('Probationary period for new reviewers',
              'The first ' + S.settings.probationCommentCount + ' comments from a newly approved reviewer are held for administrator approval before the author sees them.',
              S.settings.probationaryComments, set('probationaryComments', 'Probationary comments')),
            ui.switchLine('Show the structured feedback scaffold',
              'Displays “what is working / what is unclear / one concrete suggestion” next to the comment box. An empty box reliably produces “this is good!”.',
              S.settings.showFeedbackScaffold, set('showFeedbackScaffold', 'Feedback scaffold')),
            h('div.switchline', null,
              h('div.txt', null,
                h('b', null, 'Minimum comment length'),
                h('span', null, 'Comments shorter than this get a warning before posting. They are not blocked.')),
              h('span.ctrl.ctrl-sm', null,
                ui.select([80, 140, 200, 300].map(function (n) { return { value: n, label: n + ' characters' }; }),
                  S.settings.minCommentLength,
                  function (v) { A.setSetting('minCommentLength', parseInt(v, 10), 'Minimum comment length changed.'); ui.toast('Saved.'); },
                  { label: 'Minimum comment length' }))))),

        ui.card(h('h3', null, 'Uploads and processing'),
          h('div', null,
            h('div.switchline', null,
              h('div.txt', null,
                h('b', null, 'Maximum file size'),
                h('span', null, 'Files above this are rejected before anything else happens.')),
              h('span.ctrl.ctrl-sm', null,
                ui.select([10, 25, 50].map(function (n) { return { value: n, label: n + ' MB' }; }),
                  S.settings.maxFileSizeMB,
                  function (v) { A.setSetting('maxFileSizeMB', parseInt(v, 10), 'Maximum file size changed.'); ui.toast('Saved.'); },
                  { label: 'Maximum file size' }))),
            ui.switchLine('Strip document metadata on upload',
              'Removes author name, organisation, editing history, tracked changes and resolved comments from the published copy. Turning this off breaks the anonymity guarantee.',
              S.settings.stripMetadata, set('stripMetadata', 'Metadata stripping'), !full),
            ui.switchLine('Convert every submission to PDF for publication',
              'Normalises rendering, removes macros, eliminates residual metadata, and prevents identification through formatting quirks. The original is retained in administrator-only storage.',
              S.settings.convertToPdf, set('convertToPdf', 'PDF conversion')),
            ui.switchLine('Malware scanning',
              'Every uploaded file is scanned before it is stored or made available.',
              S.settings.malwareScan, set('malwareScan', 'Malware scanning'), !full),
            ui.switchLine('Require the consent screen before a first upload',
              'Confirms the author understands visibility, ownership, moderation and withdrawal.',
              S.settings.requireConsent, set('requireConsent', 'Consent screen'), !full))),

        ui.card(h('h3', null, 'Automated content screening'),
          h('div', null,
            ui.switchLine('Run automated screening on submissions and comments',
              'Screening never rejects anything. It decides what an administrator sees first, and always shows the flagged passage in context.',
              S.settings.autoScreening, set('autoScreening', 'Automated screening')),
            h('div.mt24'),
            h('label.lbl', null, 'School-specific keyword list'),
            h('p.hint', { style: 'margin-bottom:12px' },
              'Staff names, local slurs, and anything else a general model would not know to look for. A match raises a medium-severity flag for a person to judge.'),
            h('div.chips.mb16', null, S.keywords.map(function (k) {
              return h('span.chip', null, k,
                h('button.rm', {
                  type: 'button', 'aria-label': 'Remove ' + k,
                  style: 'background:none;border:0;cursor:pointer;padding:0',
                  onclick: function () { A.removeKeyword(k); }
                }, '×'));
            })),
            h('div.row', { style: 'gap:10px;max-width:420px' },
              h('span.grow', null, kwInput),
              h('button.btn', {
                type: 'button',
                onclick: function () {
                  if (!kwInput.value.trim()) return;
                  A.addKeyword(kwInput.value.trim()); kwInput.value = ''; ui.toast('Keyword added.');
                }
              }, 'Add')))),

        ui.card(h('h3', null, 'Tag vocabulary'),
          h('div', null,
            h('p.muted', { style: 'line-height:1.75' },
              'Authors pick from this list rather than typing free text. Without a controlled vocabulary the site accumulates three hundred spellings of “rough draft” and the filters stop working.'),
            h('div.chips.mt16.mb16', null, S.tags.map(function (t) {
              return h('span.chip', null, t,
                h('button.rm', {
                  type: 'button', 'aria-label': 'Remove ' + t,
                  style: 'background:none;border:0;cursor:pointer;padding:0',
                  onclick: function () { A.removeTag(t); }
                }, '×'));
            })),
            h('div.row', { style: 'gap:10px;max-width:420px' },
              h('span.grow', null, tagInput),
              h('button.btn', {
                type: 'button',
                onclick: function () {
                  if (!tagInput.value.trim()) return;
                  A.addTag(tagInput.value.trim()); tagInput.value = ''; ui.toast('Tag added.');
                }
              }, 'Add')))),

        ui.card(h('h3', null, 'Administrator notifications'),
          h('div', null,
            h('p.muted', { style: 'line-height:1.75' },
              'Every administrator notification type is individually switchable. In this prototype notifications appear in the in-app notification centre only — there is no email integration.'),
            h('div.mt16'),
            ui.switchLine('New submission awaiting review', 'Fires whenever anything enters the queue.',
              S.settings.notifyAdminNewSubmission, set('notifyAdminNewSubmission', 'New submission notification')),
            ui.switchLine('High-severity content flag raised', 'The one you should not turn off.',
              S.settings.notifyAdminHighSeverity, set('notifyAdminHighSeverity', 'High-severity notification')),
            ui.switchLine('New reviewer application received', '',
              S.settings.notifyAdminNewApplication, set('notifyAdminNewApplication', 'Application notification')),
            ui.switchLine('Comment reported', '',
              S.settings.notifyAdminCommentReported, set('notifyAdminCommentReported', 'Comment report notification')),
            ui.switchLine('Weekly digest of queue status', 'Not implemented in the prototype.',
              S.settings.notifyAdminWeeklyDigest, set('notifyAdminWeeklyDigest', 'Weekly digest')))),

        ui.card(h('h3', null, 'Annual role review'),
          h('div', null,
            ui.switchLine('Elevated roles expire at the end of the school year',
              'Officer administrator and peer reviewer roles carry an expiry date of ' +
              WL.fmtDate(S.settings.roleExpiresOn) + '. Expired roles fall back to the base student role automatically rather than persisting silently.',
              S.settings.roleExpiryEnabled, set('roleExpiryEnabled', 'Role expiry'), !full),
            h('div.mt16'),
            ui.alert('info', h('div', null,
              h('b', null, 'Why this exists. '),
              'Without expiring roles, administrator access accumulates across graduating cohorts. Within three years the site has a dozen administrators, most of whom no longer attend the school.')))),

        ui.card(h('h3', null, 'Prototype controls'),
          h('div', null,
            h('p.muted', { style: 'line-height:1.75' },
              'This demonstration keeps its data in your browser. Resetting restores the seeded accounts, submissions, comments and audit entries exactly as they were.'),
            h('div.btn-row.mt16', null,
              h('button.btn.btn-danger', {
                type: 'button',
                onclick: function () {
                  ui.confirmModal({
                    title: 'Reset the demonstration data',
                    body: h('p', null, 'Everything you have done in this session — submissions, comments, decisions, role changes — is discarded and the original demonstration data comes back.'),
                    confirmLabel: 'Reset everything', danger: true,
                    onConfirm: function () {
                      WL.store.reset();
                      location.hash = '#/browse';
                      ui.toast('Demonstration data restored.');
                    }
                  });
                }
              }, 'Reset demonstration data'))))
      )
    );
  };
})(window.WL);
