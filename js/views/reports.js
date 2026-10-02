/* ============================================================
   views/reports.js - comment moderation (spec 3.3)
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, A = WL.actions;

  var st = { tab: 'open' };

  WL.views.reports = function () {
    var S = WL.store.state;
    if (!WL.can('deleteComment')) return WL.views.denied('comment moderation');

    var open = S.commentReports.filter(function (r) { return r.status === 'open'; });
    var resolved = S.commentReports.filter(function (r) { return r.status !== 'open'; });
    var held = S.comments.filter(function (c) { return c.heldForApproval && !c.deletedAt; });

    function reportCard(r) {
      var c = WL.comment(r.commentId);
      if (!c) return null;
      var w = WL.work(c.workId) || {};
      var author = WL.user(c.authorUserId) || {};

      return h('div.card.mb16', null, h('div.card-body', null,
        h('div.spread.mb16', null,
          h('div', null,
            h('div.small.muted', null, 'Comment on'),
            h('button.cell-title', {
              type: 'button', style: 'font-size:15px',
              onclick: function () { location.hash = '#/work/' + w.id; }
            }, w.title || 'Unknown work')),
          h('div.row', { style: 'gap:8px;align-items:center' },
            r.status === 'open' ? ui.tag('Open', 'red') : ui.tag('Resolved', 'green'),
            h('span.small.muted', null, WL.fmtAgo(r.createdAt)))),

        h('div.mb16', null,
          h('div.small.muted.mb8', null, 'Reported by ' + WL.userName(r.reporterUserId)),
          ui.alert('warn', r.reason)),

        h('div.mb16', null,
          h('div.small.muted.mb8', null, 'The comment'),
          h('div', { style: 'border:1px solid #f0f0f0;border-radius:4px;padding:16px 18px;background:#fafafa' },
            h('div.row.wrap', { style: 'align-items:center;gap:10px;margin-bottom:10px' },
              WL.avatar(author.displayName, author.id),
              h('b', null, author.displayName || 'Unknown'),
              ui.roleBadge(c.authorRoleAtTime),
              h('span.small.muted', null, WL.fmtDate(c.createdAt)),
              c.deletedAt ? ui.tag('Already deleted', 'grey') : null),
            h('div', { style: 'white-space:pre-wrap;line-height:1.75' },
              c.deletedAt ? (c.originalBody || c.body) : c.body))),

        h('div.hint.mb16', null,
          'Comment authors are never anonymous to administrators, even on submissions where the writer is.'),

        r.status === 'open' ? h('div.btn-row', null,
          !c.deletedAt ? h('button.btn.btn-danger', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Delete the comment', danger: true, confirmLabel: 'Delete and resolve',
                intro: 'Soft-deleted: the original text and this reason stay in the audit log.',
                label: 'Reason',
                onConfirm: function (reason) {
                  A.deleteComment(c.id, reason);
                  A.resolveReport(r.id, 'Comment deleted. ' + reason);
                  ui.toast('Comment deleted and the report resolved.');
                }
              });
            }
          }, 'Delete comment') : null,

          author.reviewerStatus === 'approved' ? h('button.btn.btn-danger', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Revoke reviewer status', danger: true, confirmLabel: 'Revoke',
                intro: 'Removes ' + author.displayName + '’s ability to comment on other students’ work. Their past comments stay, labelled with the role they held when they wrote them.',
                label: 'Reason',
                onConfirm: function (reason) {
                  A.setReviewerStatus(author.id, false, reason);
                  ui.toast('Reviewer status revoked.');
                }
              });
            }
          }, 'Revoke reviewer status') : null,

          h('button.btn', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Resolve without deleting', confirmLabel: 'Resolve report',
                intro: 'Use this when the comment is acceptable. The reporter is told the outcome.',
                label: 'What did you decide, and why?',
                onConfirm: function (reason) { A.resolveReport(r.id, reason); ui.toast('Report resolved.'); }
              });
            }
          }, 'Keep the comment and resolve'),

          h('button.btn', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Suspend ' + author.displayName, danger: true, confirmLabel: 'Suspend account',
                intro: 'Suspending stops the account from submitting or commenting. It does not delete any of their content.',
                label: 'Reason',
                onConfirm: function (reason) { A.setSuspended(author.id, true, reason); ui.toast('Account suspended.'); }
              });
            }
          }, 'Suspend the account')
        ) : ui.alert('ok', h('div', null,
            h('b', null, 'Resolved '), 'by ' + WL.userName(r.resolvedBy) + ' on ' + WL.fmtDate(r.resolvedAt) + '.',
            r.resolution ? h('div.mt8', null, r.resolution) : null))
      ));
    }

    function heldCard(c) {
      var w = WL.work(c.workId) || {};
      var author = WL.user(c.authorUserId) || {};
      return h('div.card.mb16', null, h('div.card-body', null,
        h('div.spread.mb16', null,
          h('div', null,
            h('div.small.muted', null, 'Probationary comment on'),
            h('button.cell-title', {
              type: 'button', style: 'font-size:15px',
              onclick: function () { location.hash = '#/work/' + w.id; }
            }, w.title || 'Unknown work')),
          ui.tag('Held', 'gold')),
        h('div.row.wrap.mb8', { style: 'align-items:center;gap:10px' },
          WL.avatar(author.displayName, author.id), h('b', null, author.displayName),
          ui.roleBadge(c.authorRoleAtTime), h('span.small.muted', null, WL.fmtAgo(c.createdAt))),
        h('div', { style: 'white-space:pre-wrap;line-height:1.75;background:#fafafa;border:1px solid #f0f0f0;border-radius:4px;padding:16px 18px' }, c.body),
        h('div.btn-row.mt16', null,
          h('button.btn.btn-primary', {
            type: 'button',
            onclick: function () { A.approveHeldComment(c.id); ui.toast('Comment released. The author was notified.'); }
          }, 'Publish this comment'),
          h('button.btn.btn-danger', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Reject this comment', danger: true, confirmLabel: 'Reject',
                label: 'Reason', onConfirm: function (reason) { A.deleteComment(c.id, reason); ui.toast('Comment rejected.'); }
              });
            }
          }, 'Reject it'))));
    }

    var tabs = {
      open: { label: 'Open reports', count: open.length, items: open, render: reportCard },
      held: { label: 'Held for approval', count: held.length, items: held, render: heldCard },
      resolved: { label: 'Resolved', count: resolved.length, items: resolved, render: reportCard }
    };
    var current = tabs[st.tab] || tabs.open;

    return h('div.container.mid', null,
      h('h1.page-title.with-sub', null, 'Comment Moderation'),
      h('p.page-sub', null,
        'Peer review is where most of the realistic risk lives, because it is where one student writes directly about another student’s work. Deletions are soft: the original text and the reason are kept in the audit log rather than erased.'),

      h('div.tabs', null, Object.keys(tabs).map(function (k) {
        return h('button.tab' + (st.tab === k ? '.active' : ''), {
          type: 'button', onclick: function () { st.tab = k; WL.render(); }
        }, tabs[k].label, h('span.cnt', null, '(' + tabs[k].count + ')'));
      })),

      current.items.length
        ? current.items.map(current.render)
        : ui.card(null, ui.empty('Nothing here',
            st.tab === 'open' ? 'No comment reports are waiting.'
              : st.tab === 'held' ? 'No probationary comments are waiting for approval.' : null))
    );
  };
})(window.WL);
