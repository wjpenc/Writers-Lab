/* ============================================================
   views/audit.js - append-only audit log (spec 3.4)
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon;

  var st = { q: '', actor: '', kind: '', page: 1, pageSize: 20 };

  var ACTION_LABELS = {
    'work.submit': ['Submission created', 'blue'],
    'work.approve': ['Submission approved', 'green'],
    'work.deny': ['Submission denied', 'red'],
    'work.request_changes': ['Changes requested', 'volcano'],
    'work.withdraw': ['Withdrawn by author', 'grey'],
    'work.resubmit': ['Returned to queue', 'blue'],
    'work.new_version': ['New version uploaded', 'blue'],
    'work.deletion_requested': ['Deletion requested', 'red'],
    'work.prioritise': ['Marked as needing attention', 'gold'],
    'work.unprioritise': ['Priority flag removed', 'grey'],
    'flag.clear': ['Screening flag cleared', 'gold'],
    'comment.create': ['Comment written', 'cyan'],
    'comment.edit': ['Comment edited', 'cyan'],
    'comment.delete': ['Comment deleted', 'red'],
    'comment.approve': ['Probationary comment released', 'green'],
    'comment.report': ['Comment reported', 'volcano'],
    'report.resolve': ['Report resolved', 'green'],
    'application.submit': ['Reviewer application submitted', 'blue'],
    'application.approve': ['Reviewer application approved', 'green'],
    'application.reject': ['Reviewer application rejected', 'red'],
    'reviewer.grant': ['Reviewer status granted', 'green'],
    'reviewer.revoke': ['Reviewer status revoked', 'red'],
    'admin.grant': ['Officer admin granted', 'purple'],
    'admin.revoke': ['Officer admin removed', 'red'],
    'account.suspend': ['Account suspended', 'red'],
    'account.reinstate': ['Account reinstated', 'green'],
    'role.renew': ['Elevated role re-confirmed', 'green'],
    'role.expire': ['Elevated role lapsed', 'grey'],
    'advisor.transfer_proposed': ['Advisor transfer offered', 'gold'],
    'advisor.transfer_accepted': ['Advisor transfer completed', 'purple'],
    'advisor.transfer_cancelled': ['Advisor transfer cancelled', 'grey'],
    'settings.change': ['Site setting changed', 'purple'],
    'settings.tag_add': ['Tag added', 'cyan'],
    'settings.tag_remove': ['Tag removed', 'grey'],
    'settings.keyword_add': ['Keyword added', 'cyan'],
    'settings.keyword_remove': ['Keyword removed', 'grey'],
    'consent.given': ['Submission terms accepted', 'grey']
  };

  function targetLabel(a) {
    if (a.targetType === 'work') {
      var w = WL.work(a.targetId);
      return w ? w.title : a.targetId;
    }
    if (a.targetType === 'user') return WL.userName(a.targetId);
    if (a.targetType === 'comment') {
      var c = WL.comment(a.targetId);
      var w2 = c ? WL.work(c.workId) : null;
      return w2 ? 'comment on “' + WL.truncate(w2.title, 34) + '”' : a.targetId;
    }
    return a.targetId;
  }

  WL.views.audit = function () {
    var S = WL.store.state;
    if (!WL.can('viewAudit')) return WL.views.denied('the audit log');

    var rows = S.audit.filter(function (a) {
      if (st.actor && a.actorUserId !== st.actor) return false;
      if (st.kind && a.action.split('.')[0] !== st.kind) return false;
      if (st.q) {
        var hay = (a.action + ' ' + (a.reason || '') + ' ' + WL.userName(a.actorUserId) + ' ' + targetLabel(a)).toLowerCase();
        if (hay.indexOf(st.q.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var actors = WL.uniq(S.audit.map(function (a) { return a.actorUserId; }));
    var kinds = WL.uniq(S.audit.map(function (a) { return a.action.split('.')[0]; }));

    var table = ui.dataTable({
      columns: [
        {
          key: 'when', label: 'When', width: '16%', tight: true, top: true,
          render: function (a) {
            return h('div', null,
              h('div.small', null, WL.fmtDate(a.createdAt)),
              h('div.small.muted', null, WL.fmtDateTime(a.createdAt).split(' at ')[1]));
          }
        },
        {
          key: 'actor', label: 'Who', width: '17%', top: true,
          render: function (a) {
            var u = WL.user(a.actorUserId);
            return h('div.row', { style: 'align-items:center;gap:9px' },
              WL.avatar(WL.userName(a.actorUserId), a.actorUserId),
              h('div', null,
                h('div.small', null, WL.userName(a.actorUserId)),
                h('div.small.muted', null, WL.roleLabel(u ? u.role : 'student'))));
          }
        },
        {
          key: 'action', label: 'Action', width: '20%', top: true,
          render: function (a) {
            var m = ACTION_LABELS[a.action] || [a.action, 'grey'];
            return ui.tag(m[0], m[1], { plain: true });
          }
        },
        {
          key: 'target', label: 'Target', width: '22%', top: true,
          render: function (a) {
            return h('div', null,
              h('div.small', null, WL.truncate(targetLabel(a), 60)),
              h('div.small.muted', null, a.targetType));
          }
        },
        {
          key: 'reason', label: 'Reason given', width: '25%', top: true,
          render: function (a) {
            return a.reason
              ? h('div.small', { style: 'line-height:1.6;color:#595959' }, a.reason)
              : h('span.muted.small', null, '—');
          }
        }
      ],
      rows: rows,
      page: st.page, pageSize: st.pageSize,
      onPage: function (n) { st.page = n; WL.render(); window.scrollTo(0, 0); },
      onPageSize: function (n) { st.pageSize = n; st.page = 1; WL.render(); },
      totalLabel: 'entries',
      emptyTitle: 'No entries match these filters'
    });

    return h('div.container', null,
      h('div.spread.mb8', null,
        h('h1.page-title.with-sub', { style: 'margin-bottom:0' }, 'Audit Log'),
        h('button.btn', {
          type: 'button',
          onclick: function () {
            var csv = WL.toCSV([['timestamp', 'actor', 'actor_role', 'action', 'target_type', 'target', 'reason']]
              .concat(rows.map(function (a) {
                var u = WL.user(a.actorUserId);
                return [a.createdAt, WL.userName(a.actorUserId), u ? u.role : '', a.action,
                  a.targetType, targetLabel(a), a.reason || ''];
              })));
            WL.downloadText('writers-lab-audit-log.csv', csv, 'text/csv');
            ui.toast('Audit log exported as CSV.');
          }
        }, icon('download', 15), 'Export CSV')),
      h('p.page-sub', null,
        'Append-only. Nothing here can be edited or removed through the application. This is what protects the advisor and the club if a moderation decision is ever questioned by a student, a parent or an administrator — and it is what lets next year’s officers see how this year’s decisions were made.'),

      h('div.toolbar', null,
        h('span.ctrl.ctrl-search', null,
          h('input.input', {
            type: 'search', placeholder: 'Search the log', value: st.q,
            'aria-label': 'Search the audit log',
            oninput: function (e) { st.q = e.target.value; st.page = 1; WL.render(); }
          }),
          h('span.ctrl-icon', null, icon('search', 15))),
        h('span.ctrl.ctrl-select', null,
          ui.select([{ value: '', label: 'Filter by Person' }].concat(actors.map(function (id) {
            return { value: id, label: WL.userName(id) };
          })), st.actor, function (v) { st.actor = v; st.page = 1; WL.render(); },
            { label: 'Filter by person', placeholderWhenEmpty: true })),
        h('span.ctrl.ctrl-select', null,
          ui.select([{ value: '', label: 'Filter by Category' }].concat(kinds.map(function (k) {
            return { value: k, label: k.charAt(0).toUpperCase() + k.slice(1) };
          })), st.kind, function (v) { st.kind = v; st.page = 1; WL.render(); },
            { label: 'Filter by category', placeholderWhenEmpty: true })),
        h('button.btn.btn-danger', {
          type: 'button',
          onclick: function () { st.q = ''; st.actor = ''; st.kind = ''; st.page = 1; WL.render(); }
        }, 'Reset Filters')),

      ui.card(null, table)
    );
  };
})(window.WL);
