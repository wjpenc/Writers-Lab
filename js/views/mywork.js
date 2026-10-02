/* ============================================================
   views/mywork.js - author controls (spec 2.4)
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon, A = WL.actions;

  var st = { page: 1, pageSize: 10, sort: { key: 'created', dir: 'desc' } };

  function revisionModal(w) {
    var keep = true;
    var fileName = h('input.input', { type: 'text', value: w.originalFileName.replace(/(\.\w+)$/, '_v2$1') });
    var bodyTa = h('textarea.input', { rows: 6, value: w.body || '', placeholder: 'Paste the revised text…' });

    var keepBtn = function () {
      return h('div.stack', null,
        h('label.checkline', null,
          h('input', {
            type: 'radio', name: 'keepfb', checked: keep,
            onchange: function () { keep = true; }
          }),
          h('span', null, h('b', null, 'Keep the feedback on the earlier version. '),
            h('span.muted', null, 'Comments stay on the page, marked as written about the previous draft.'))),
        h('label.checkline', null,
          h('input', {
            type: 'radio', name: 'keepfb', checked: !keep,
            onchange: function () { keep = false; }
          }),
          h('span', null, h('b', null, 'Start clean. '),
            h('span.muted', null, 'Earlier comments are archived out of view. Nothing is deleted — administrators keep the record.')))
      );
    };

    ui.modal({
      title: 'Upload a revised version',
      wide: true,
      body: h('div', null,
        ui.alert('info', 'A revision goes back through the review queue, the same as a first submission.'),
        h('div.mt24'),
        ui.field('File name', fileName),
        ui.field('Revised text', bodyTa),
        h('div.field', null, h('label.lbl', null, 'What happens to existing feedback?'), keepBtn())
      ),
      footer: [
        h('button.btn', { type: 'button', onclick: ui.closeModal }, 'Cancel'),
        h('button.btn.btn-primary', {
          type: 'button',
          onclick: function () {
            ui.closeModal();
            A.addVersion(w.id, { fileName: fileName.value, body: bodyTa.value, keepFeedback: keep });
            ui.toast('New version submitted. It is back in the review queue.');
          }
        }, 'Submit revision')
      ]
    });
  }

  WL.views.mywork = function () {
    var S = WL.store.state;
    var me = WL.me();

    var mine = S.works.filter(function (w) { return w.authorUserId === me.id; });

    var keyFns = {
      title: function (w) { return w.title.toLowerCase(); },
      status: function (w) { return w.status; },
      created: function (w) { return w.createdAt; },
      comments: function (w) { return WL.workComments(w.id).filter(function (c) { return !c.deletedAt; }).length; }
    };
    var rows = WL.sortBy(mine, keyFns[st.sort.key] || keyFns.created, st.sort.dir);

    var byStatus = WL.groupCount(mine, function (w) { return w.status; });

    var table = ui.dataTable({
      columns: [
        {
          key: 'title', label: 'Title', sortable: true, width: '32%', top: true,
          render: function (w) {
            return h('div', null,
              h('button.cell-title', {
                type: 'button', onclick: function () { location.hash = '#/work/' + w.id; }
              }, w.title),
              h('div.small.muted.mt8', null, w.genre),
              w.denialReason ? h('div.mt8', null,
                h('div.small', { style: 'color:#a8071a;line-height:1.6' },
                  h('b', null, w.status === 'denied' ? 'Denied: ' : 'Changes requested: '),
                  w.denialReason)) : null
            );
          }
        },
        {
          key: 'status', label: 'Status', sortable: true, width: '15%', top: true,
          render: function (w) {
            return h('div', null, ui.statusTag(w.status),
              w.deletionRequestedAt ? h('div.mt8', null, ui.tag('Deletion requested', 'red')) : null);
          }
        },
        {
          key: 'comments', label: 'Feedback', sortable: true, width: '11%', tight: true, top: true,
          render: function (w) {
            var n = WL.workComments(w.id).filter(function (c) { return !c.deletedAt && !c.heldForApproval; }).length;
            return h('span', null, String(n));
          }
        },
        {
          key: 'created', label: 'Submitted', sortable: true, width: '15%', tight: true, top: true,
          render: function (w) { return h('span.small', null, WL.fmtDate(w.createdAt)); }
        },
        {
          key: 'actions', label: 'Actions', width: '27%', top: true,
          render: function (w) {
            var acts = [];
            acts.push(h('button.btn-link', {
              type: 'button', onclick: function () { location.hash = '#/work/' + w.id; }
            }, 'View'));

            if (w.status !== 'withdrawn') {
              acts.push(h('button.btn-link', {
                type: 'button',
                onclick: function () {
                  ui.confirmModal({
                    title: 'Withdraw “' + WL.truncate(w.title, 40) + '”',
                    body: h('div', null,
                      h('p', null, 'It disappears from public view immediately — no email to an administrator, no waiting.'),
                      h('p.muted', null, 'Feedback already left on it is kept and stays visible to you. You can put it back later.')),
                    confirmLabel: 'Withdraw now', danger: true,
                    onConfirm: function () { A.withdrawWork(w.id); ui.toast('Withdrawn.'); }
                  });
                }
              }, 'Withdraw'));
            } else {
              acts.push(h('button.btn-link', {
                type: 'button',
                onclick: function () { A.restoreWork(w.id); ui.toast('Back in the review queue.'); }
              }, 'Restore'));
            }

            acts.push(h('button.btn-link', {
              type: 'button', onclick: function () { revisionModal(w); }
            }, 'New version'));

            if (!w.deletionRequestedAt) {
              acts.push(h('button.btn-link.danger', {
                type: 'button',
                onclick: function () {
                  ui.reasonModal({
                    title: 'Request permanent deletion',
                    danger: true, confirmLabel: 'Request deletion', required: false,
                    intro: 'The work is withdrawn from view straight away. Permanent deletion is subject to the retention policy the school sets — the request and its date go to the advisor.',
                    label: 'Reason (optional)',
                    help: 'This request is recorded in the audit log.',
                    onConfirm: function (r) { A.requestDeletion(w.id, r); ui.toast('Deletion requested. The work is withdrawn in the meantime.'); }
                  });
                }
              }, 'Request deletion'));
            }

            return h('div.row.wrap', { style: 'gap:14px;font-size:13px' }, acts);
          }
        }
      ],
      rows: rows,
      sort: st.sort,
      onSort: function (k) {
        if (st.sort.key === k) st.sort.dir = st.sort.dir === 'asc' ? 'desc' : 'asc';
        else st.sort = { key: k, dir: 'asc' };
        WL.render();
      },
      page: st.page, pageSize: st.pageSize,
      onPage: function (n) { st.page = n; WL.render(); },
      onPageSize: function (n) { st.pageSize = n; st.page = 1; WL.render(); },
      totalLabel: 'submissions',
      emptyTitle: 'You have not submitted anything yet',
      emptySub: 'Your work is reviewed before anyone else can see it.'
    });

    return h('div.container', null,
      h('div.spread.mb24', null,
        h('div', null,
          h('h1.page-title.with-sub', null, 'My Work'),
          h('p.page-sub', { style: 'margin-bottom:0' },
            'Every submission you have made, with its current status. You can withdraw anything from public view yourself, at any time.')),
        h('button.btn.btn-primary', {
          type: 'button',
          onclick: function () { WL.views.submit.resetForm(); location.hash = '#/submit'; }
        }, icon('plus', 15), 'Submit new work')
      ),

      h('div.stat-grid.mb24', null,
        ui.statCard('Approved and visible', String(byStatus.approved || 0)),
        ui.statCard('Waiting on review', String((byStatus.pending || 0) + (byStatus.flagged || 0))),
        ui.statCard('Needs your attention', String((byStatus.changes_requested || 0) + (byStatus.denied || 0))),
        ui.statCard('Withdrawn', String(byStatus.withdrawn || 0))
      ),

      ui.card(null, table)
    );
  };
})(window.WL);
