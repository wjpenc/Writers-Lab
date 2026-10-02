/* ============================================================
   views/queue.js - administrator review queue (spec 3.2)
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon, A = WL.actions;

  var st = { sort: 'severity', page: 1, pageSize: 10, expanded: null };

  var SEV_RANK = { high: 3, medium: 2, low: 1 };

  function worstSeverity(workId) {
    var flags = WL.openFlags(workId);
    var worst = null;
    flags.forEach(function (f) {
      if (!worst || SEV_RANK[f.severity] > SEV_RANK[worst]) worst = f.severity;
    });
    return worst;
  }

  function previewModal(w) {
    ui.modal({
      title: w.title, wide: true,
      body: h('div', null,
        h('div.row.wrap.mb16', { style: 'gap:8px' },
          ui.tag(w.genre, ui.tagColor(w.genre)),
          ui.tagList(w.tags),
          ui.statusTag(w.status)),
        w.description ? h('p.muted', { style: 'line-height:1.75' }, w.description) : null,
        h('div.preview.mt16', null, w.body || '(no text preview)')
      ),
      footer: [
        h('button.btn', { type: 'button', onclick: ui.closeModal }, 'Close'),
        h('button.btn.btn-primary', {
          type: 'button',
          onclick: function () { ui.closeModal(); location.hash = '#/work/' + w.id; }
        }, 'Open full page')
      ]
    });
  }

  function decisionRow(w) {
    return h('div.btn-row', null,
      h('button.btn.btn-primary.btn-sm', {
        type: 'button',
        onclick: function () {
          var flags = WL.openFlags(w.id);
          if (flags.length) {
            ui.reasonModal({
              title: 'Approve over ' + WL.plural(flags.length, 'open flag'),
              required: false, confirmLabel: 'Approve and publish',
              intro: 'An administrator override is always allowed. The reason is recorded next to the flag so a later officer can see why the call was made.',
              label: 'Override reason (optional but recommended)',
              onConfirm: function (r) { A.approveWork(w.id, r); ui.toast('Approved and published.'); }
            });
          } else { A.approveWork(w.id); ui.toast('Approved and published.'); }
        }
      }, icon('check', 14), 'Approve'),
      h('button.btn.btn-sm', {
        type: 'button',
        onclick: function () {
          ui.reasonModal({
            title: 'Request changes', confirmLabel: 'Send back to author',
            intro: 'Returns the work to the author for revision rather than denying it outright.',
            label: 'What should the author change?',
            onConfirm: function (r) { A.requestChanges(w.id, r); ui.toast('Returned to the author.'); }
          });
        }
      }, 'Request changes'),
      h('button.btn.btn-danger.btn-sm', {
        type: 'button',
        onclick: function () {
          ui.reasonModal({
            title: 'Deny “' + WL.truncate(w.title, 40) + '”', danger: true, confirmLabel: 'Deny',
            intro: 'A written reason is required and is delivered to the author.',
            label: 'Reason for denial',
            onConfirm: function (r) { A.denyWork(w.id, r); ui.toast('Denied. The author was notified.'); }
          });
        }
      }, 'Deny'),
      h('button.btn.btn-sm', { type: 'button', onclick: function () { previewModal(w); } },
        icon('eye', 14), 'Preview')
    );
  }

  WL.views.queue = function () {
    var S = WL.store.state;
    if (!WL.can('moderate')) return WL.views.denied('the review queue');

    var pending = S.works.filter(function (w) {
      return w.status === 'pending' || w.status === 'flagged';
    });

    var sorters = {
      severity: function (w) { return -(SEV_RANK[worstSeverity(w.id)] || 0); },
      waiting: function (w) { return new Date(w.createdAt).getTime(); },
      newest: function (w) { return -new Date(w.createdAt).getTime(); }
    };
    var rows = WL.sortBy(pending, sorters[st.sort] || sorters.severity, 'asc');

    var highCount = pending.filter(function (w) { return worstSeverity(w.id) === 'high'; }).length;
    var oldest = pending.length
      ? WL.sortBy(pending, function (w) { return new Date(w.createdAt).getTime(); }, 'asc')[0] : null;

    var table = ui.dataTable({
      columns: [
        {
          key: 'work', label: 'Submission', width: '38%', top: true,
          render: function (w) {
            var flags = WL.openFlags(w.id);
            return h('div', null,
              h('button.cell-title', {
                type: 'button', onclick: function () { location.hash = '#/work/' + w.id; }
              }, w.title),
              h('div.row.wrap.mt8', { style: 'gap:8px' },
                ui.tag(w.genre, ui.tagColor(w.genre)),
                ui.tag('.' + (w.format || 'docx'), 'grey', { plain: true }),
                ui.tag(WL.fmtBytes(w.fileSize), 'grey', { plain: true })),
              w.description ? h('div.small.muted.mt8', { style: 'line-height:1.6' },
                WL.truncate(w.description, 130)) : null,
              flags.length ? h('div.mt16', null,
                flags.map(function (fl) {
                  return h('div.mb8', null,
                    h('div.row.wrap', { style: 'align-items:center;gap:8px;margin-bottom:6px' },
                      ui.severityDot(fl.severity),
                      h('b', { style: 'font-size:13px' }, fl.category),
                      ui.severityTag(fl.severity),
                      ui.tag(fl.source, 'grey', { plain: true })),
                    ui.excerpt(fl.matchedExcerpt, fl.matchedTerms, fl.severity),
                    h('div.mt8', null,
                      h('button.btn-link', {
                        type: 'button',
                        onclick: function () {
                          ui.reasonModal({
                            title: 'Clear this flag',
                            intro: 'Use this when the flagged passage is ordinary writing. The work stays in the queue for a publication decision.',
                            label: 'Why is this flag not a problem?', confirmLabel: 'Clear flag',
                            onConfirm: function (r) { A.clearFlag(fl.id, r); ui.toast('Flag cleared and logged.'); }
                          });
                        }
                      }, 'Clear this flag')));
                })) : null
            );
          }
        },
        {
          key: 'author', label: 'Author', width: '15%', top: true,
          render: function (w) {
            if (WL.can('viewAuthorIdentity')) {
              return h('div.row', { style: 'align-items:center;gap:8px' },
                WL.avatar(WL.userName(w.authorUserId), w.authorUserId),
                h('div', null,
                  h('div.small', null, WL.userName(w.authorUserId)),
                  h('div.small.muted', null, 'Grade ' + (WL.user(w.authorUserId) || {}).gradeLevel)));
            }
            return h('div', null,
              h('span.muted.small', null, 'Withheld'),
              h('div.hint', { style: 'margin-top:4px' }, 'Site policy hides authors from officers.'));
          }
        },
        {
          key: 'waiting', label: 'Waiting', width: '12%', tight: true, top: true,
          render: function (w) {
            var d = WL.daysBetween(w.createdAt, new Date().toISOString());
            return h('div', null,
              h('div.small', null, WL.fmtAgo(w.createdAt)),
              d >= 3 ? h('div.mt8', null, ui.tag(d + ' days', 'volcano')) : null);
          }
        },
        {
          key: 'status', label: 'Status', width: '12%', tight: true, top: true,
          render: function (w) { return ui.statusTag(w.status); }
        },
        {
          key: 'actions', label: 'Decision', width: '23%', top: true,
          render: function (w) { return decisionRow(w); }
        }
      ],
      rows: rows,
      page: st.page, pageSize: st.pageSize,
      onPage: function (n) { st.page = n; WL.render(); },
      onPageSize: function (n) { st.pageSize = n; st.page = 1; WL.render(); },
      totalLabel: 'awaiting a decision',
      emptyTitle: 'The queue is clear',
      emptySub: 'Nothing is waiting on a publication decision.'
    });

    return h('div.container', null,
      h('h1.page-title.with-sub', null, 'Review Queue'),
      h('p.page-sub', null,
        'Nothing reaches the site without a decision made here. Automated screening sorts the queue; it never approves or rejects anything by itself.'),

      h('div.stat-grid.mb24', null,
        ui.statCard('Awaiting a decision', String(pending.length)),
        ui.statCard('High-severity flags', String(highCount), highCount ? 'Held from publication' : 'None open'),
        ui.statCard('Longest wait', oldest ? WL.daysBetween(oldest.createdAt, new Date().toISOString()) + ' days' : '—',
          oldest ? WL.truncate(oldest.title, 34) : 'Queue is clear'),
        ui.statCard('Author names', WL.can('viewAuthorIdentity') ? 'Visible to you' : 'Hidden by policy',
          WL.can('viewAuthorIdentity') ? 'Your role permits de-anonymising' : 'Site setting, changeable by the advisor')
      ),

      h('div.toolbar', null,
        h('span.ctrl.ctrl-select', null,
          ui.select([
            { value: 'severity', label: 'Sort: flag severity' },
            { value: 'waiting', label: 'Sort: longest waiting' },
            { value: 'newest', label: 'Sort: newest first' }
          ], st.sort, function (v) { st.sort = v; st.page = 1; WL.render(); }, { label: 'Sort the queue' }))
      ),

      ui.card(null, table)
    );
  };

  /* --------- needs-review queue for reviewers (spec 4.4) --------- */

  WL.views.needsReview = function () {
    var S = WL.store.state;
    var me = WL.me();

    if (!WL.can('commentAnywhere')) {
      return h('div.container.narrow', null,
        h('h1.page-title', null, 'Needs Review'),
        ui.alert('info', h('div', null,
          h('b', null, 'This queue is for approved peer reviewers. '),
          'It lists the pieces that have waited longest with the least feedback. ',
          h('button.btn-link', { type: 'button', onclick: function () { location.hash = '#/apply'; } },
            'Apply to become a reviewer'), '.')));
    }

    function count(w) {
      return WL.workComments(w.id).filter(function (c) { return !c.deletedAt && !c.heldForApproval; }).length;
    }

    var approved = S.works.filter(function (w) { return w.status === 'approved' && w.authorUserId !== me.id; });
    var rows = approved.slice().sort(function (a, b) {
      if (!!b.needsAttention !== !!a.needsAttention) return b.needsAttention ? 1 : -1;
      var ca = count(a), cb = count(b);
      if (ca !== cb) return ca - cb;
      return new Date(a.moderatedAt || a.createdAt) - new Date(b.moderatedAt || b.createdAt);
    });

    var uncovered = approved.filter(function (w) { return count(w) === 0; }).length;
    var coverage = approved.length ? Math.round(100 * (approved.length - uncovered) / approved.length) : 100;

    return h('div.container', null,
      h('h1.page-title.with-sub', null, 'Needs Review'),
      h('p.page-sub', null,
        'Sorted by least feedback first, then longest waiting. This ordering is the main defence against the failure mode where three pieces get all the comments and nine authors conclude the site does not work.'),

      h('div.stat-grid.mb24', null,
        ui.statCard('Published pieces', String(approved.length)),
        ui.statCard('With no feedback at all', String(uncovered), uncovered ? 'These are at the top of the list' : 'Full coverage'),
        ui.statCard('Coverage', coverage + '%', 'Share of published work with at least one comment'),
        ui.statCard('Your comments', String(S.comments.filter(function (c) {
          return c.authorUserId === me.id && !c.deletedAt;
        }).length), 'All time')
      ),

      ui.card(null, ui.dataTable({
        columns: [
          {
            key: 'title', label: 'Piece', width: '40%', top: true,
            render: function (w) {
              var claim = WL.activeClaim(w.id);
              return h('div', null,
                h('button.cell-title', {
                  type: 'button', onclick: function () { location.hash = '#/work/' + w.id; }
                }, w.title),
                h('div.row.wrap.mt8', { style: 'gap:8px' },
                  ui.tag(w.genre, ui.tagColor(w.genre)),
                  w.needsAttention ? ui.tag('Admin priority', 'volcano') : null,
                  claim ? ui.tag(claim.userId === me.id ? 'You claimed this' : 'Claimed', 'cyan') : null),
                w.description ? h('div.small.muted.mt8', { style: 'line-height:1.6' },
                  WL.truncate(w.description, 120)) : null);
            }
          },
          {
            key: 'focus', label: 'Author asked about', width: '18%', top: true,
            render: function (w) { return ui.tag(w.feedbackFocus || 'General impressions', 'green'); }
          },
          {
            key: 'count', label: 'Comments', width: '10%', tight: true, top: true,
            render: function (w) {
              var n = count(w);
              return n === 0 ? ui.tag('None yet', 'red') : h('span', null, String(n));
            }
          },
          {
            key: 'waiting', label: 'Published', width: '14%', tight: true, top: true,
            render: function (w) { return h('span.small', null, WL.fmtAgo(w.moderatedAt || w.createdAt)); }
          },
          {
            key: 'act', label: '', width: '18%', top: true,
            render: function (w) {
              var claim = WL.activeClaim(w.id);
              return h('div.btn-row', null,
                h('button.btn.btn-primary.btn-sm', {
                  type: 'button', onclick: function () { location.hash = '#/work/' + w.id; }
                }, 'Review it'),
                claim && claim.userId === me.id
                  ? h('button.btn.btn-sm', { type: 'button', onclick: function () { A.releaseClaim(w.id); } }, 'Unclaim')
                  : h('button.btn.btn-sm', {
                      type: 'button', disabled: !!claim,
                      onclick: function () { if (A.claimWork(w.id)) ui.toast('Claimed for 48 hours.'); }
                    }, 'Claim'));
            }
          }
        ],
        rows: rows, page: 1, paginate: false,
        emptyTitle: 'Nothing is waiting', emptySub: 'Every published piece has feedback.'
      }))
    );
  };

  WL.views.denied = function (what) {
    return h('div.container.narrow', null,
      h('div.card', null, h('div.card-body', null,
        h('div', { style: 'text-align:center;padding:40px 20px' },
          h('div', { style: 'color:#d9d9d9' }, icon('lock', 40, { w: 1.2 })),
          h('h2.mt16', null, 'Not available to your role'),
          h('p.muted.mt8', { style: 'max-width:520px;margin:12px auto 0;line-height:1.75' },
            'You are signed in as ' + WL.roleLabel(WL.effectiveRole(WL.me())) +
            ', which does not have access to ' + what + '.'),
          h('p.muted.small', { style: 'margin-top:14px' },
            'Every check like this one is enforced on the server too. Hiding a button in the browser is not authorisation.'),
          h('div.mt24', null,
            h('button.btn.btn-primary', {
              type: 'button', onclick: function () { location.hash = '#/browse'; }
            }, 'Back to browsing'))))));
  };
})(window.WL);
