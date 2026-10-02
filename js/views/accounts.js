/* ============================================================
   views/accounts.js - account console, role review, advisor
   transfer (spec 1.3, 1.4)
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon, A = WL.actions;

  var st = { q: '', role: '', status: '', page: 1, pageSize: 10, sort: { key: 'name', dir: 'asc' }, detail: null };

  /* ---------------- Per-account detail ---------------- */

  function detailModal(u) {
    var S = WL.store.state;
    var works = S.works.filter(function (w) { return w.authorUserId === u.id; });
    var comments = S.comments.filter(function (c) { return c.authorUserId === u.id; });
    var actions = S.audit.filter(function (a) { return a.actorUserId === u.id; });
    var about = S.audit.filter(function (a) { return a.targetType === 'user' && a.targetId === u.id; });

    ui.modal({
      title: u.displayName, wide: true,
      body: h('div', null,
        h('div.row.mb24', { style: 'align-items:center;gap:14px' },
          WL.avatar(u.displayName, u.id, true),
          h('div', null,
            h('div', { style: 'font-size:15px;font-weight:600' }, u.displayName),
            h('div.small.muted', null, u.email)),
          h('div.grow'),
          ui.roleBadge(u.role),
          u.suspendedAt ? ui.tag('Suspended', 'red') : null),

        h('dl.desc', null,
          h('dt', null, 'Role'), h('dd', null, WL.roleLabel(u.role),
            u.isPrimaryAdvisor ? h('span', { style: 'margin-left:8px' }, ui.tag('Primary advisor', 'gold')) : null),
          h('dt', null, 'Reviewer status'), h('dd', null, u.reviewerStatus || 'none'),
          h('dt', null, 'Grade'), h('dd', null, u.gradeLevel ? 'Grade ' + u.gradeLevel : 'Staff'),
          h('dt', null, 'Role expires'),
          h('dd', null, u.roleExpiresAt
            ? WL.fmtDate(u.roleExpiresAt) + (new Date(u.roleExpiresAt) < new Date() ? ' — lapsed' : '')
            : h('span.muted', null, 'No expiry')),
          h('dt', null, 'Joined'), h('dd', null, WL.fmtDate(u.createdAt)),
          h('dt', null, 'Last active'), h('dd', null, WL.fmtAgo(u.lastActiveAt)),
          u.suspendedAt ? h('dt', null, 'Suspended') : null,
          u.suspendedAt ? h('dd', null, WL.fmtDate(u.suspendedAt) +
            (u.suspendReason ? ' — ' + u.suspendReason : '')) : null),

        h('h4.mt24.mb8', null, 'Submissions (' + works.length + ')'),
        works.length ? h('div', null, works.map(function (w) {
          return h('div', { style: 'padding:9px 0;border-bottom:1px solid #f0f0f0' },
            h('div.row', { style: 'align-items:center;gap:10px;flex-wrap:wrap' },
              h('button.cell-title', {
                type: 'button', onclick: function () { ui.closeModal(); location.hash = '#/work/' + w.id; }
              }, WL.truncate(w.title, 52)),
              ui.statusTag(w.status),
              h('span.small.muted', null, WL.fmtDate(w.createdAt))));
        })) : h('p.muted.small', null, 'None.'),

        h('h4.mt24.mb8', null, 'Comments written (' + comments.length + ')'),
        comments.length ? h('div', null, comments.slice(0, 6).map(function (c) {
          var w = WL.work(c.workId) || {};
          return h('div', { style: 'padding:9px 0;border-bottom:1px solid #f0f0f0' },
            h('div.row', { style: 'align-items:center;gap:8px;margin-bottom:4px' },
              ui.roleBadge(c.authorRoleAtTime),
              h('span.small.muted', null, 'on ' + WL.truncate(w.title || '', 40)),
              c.deletedAt ? ui.tag('Deleted', 'red') : null),
            h('div.small', { style: 'line-height:1.6;color:#595959' },
              WL.truncate(c.deletedAt ? (c.originalBody || c.body) : c.body, 160)));
        })) : h('p.muted.small', null, 'None.'),

        h('h4.mt24.mb8', null, 'Administrative actions taken by this account (' + actions.length + ')'),
        actions.length ? h('div', null, actions.slice(0, 8).map(function (a) {
          return h('div.row', { style: 'gap:10px;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:13px' },
            ui.tag(a.action, 'grey', { plain: true }),
            h('span.muted', null, WL.fmtDate(a.createdAt)),
            a.reason ? h('span.grow.muted', null, WL.truncate(a.reason, 80)) : null);
        })) : h('p.muted.small', null, 'None.'),

        h('h4.mt24.mb8', null, 'Actions taken about this account (' + about.length + ')'),
        about.length ? h('div', null, about.map(function (a) {
          return h('div.row', { style: 'gap:10px;padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:13px' },
            ui.tag(a.action, 'grey', { plain: true }),
            h('span.muted', null, WL.userName(a.actorUserId)),
            h('span.muted', null, WL.fmtDate(a.createdAt)),
            a.reason ? h('span.grow.muted', null, WL.truncate(a.reason, 70)) : null);
        })) : h('p.muted.small', null, 'None.')
      ),
      footer: [h('button.btn.btn-primary', { type: 'button', onclick: ui.closeModal }, 'Close')]
    });
  }

  /* ---------------- Advisor transfer ---------------- */

  function transferPanel() {
    var S = WL.store.state;
    var me = WL.me();
    var t = S.pendingTransfer;

    if (t && t.toUserId === me.id) {
      return ui.card(h('h3', null, 'Primary advisor transfer offered to you'),
        h('div', null,
          ui.alert('warn', h('div', null,
            h('b', null, WL.userName(t.fromUserId) + ' proposed transferring the primary advisor role to you. '),
            'Nothing has changed yet. A transfer only completes when the receiving teacher explicitly accepts it, so the site can never end up with nobody responsible for it.',
            t.reason ? h('div.mt8', null, '“' + t.reason + '”') : null)),
          h('div.btn-row.mt16', null,
            h('button.btn.btn-primary', {
              type: 'button',
              onclick: function () { A.acceptTransfer(); ui.toast('You are now the primary faculty advisor.'); }
            }, 'Accept the role'),
            h('button.btn', {
              type: 'button', onclick: function () { A.cancelTransfer(); ui.toast('Transfer declined.'); }
            }, 'Decline'))));
    }

    if (t) {
      return ui.card(h('h3', null, 'Advisor transfer pending'),
        h('div', null,
          ui.alert('info', h('div', null,
            h('b', null, 'Offered to ' + WL.userName(t.toUserId) + ' on ' + WL.fmtDate(t.createdAt) + '. '),
            'It takes effect only when they accept. Until then you remain the primary advisor.')),
          h('div.btn-row.mt16', null,
            h('button.btn', { type: 'button', onclick: function () { A.cancelTransfer(); ui.toast('Transfer cancelled.'); } },
              'Cancel the transfer'))));
    }

    if (!WL.can('transferAdvisor') || !me.isPrimaryAdvisor) return null;

    var teachers = WL.store.state.users.filter(function (u) {
      return u.role === 'teacher_advisor' && u.id !== me.id;
    });

    return ui.card(h('h3', null, 'Transfer the primary advisor role'),
      h('div', null,
        h('p.muted', { style: 'line-height:1.75' },
          'The system never allows zero primary advisors. The receiving teacher must accept before the transfer completes, and the whole exchange is written to the audit log.'),
        teachers.length ? h('div.btn-row', null, teachers.map(function (t2) {
          return h('button.btn', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Offer the primary advisor role to ' + t2.displayName,
                required: false, confirmLabel: 'Send the offer',
                intro: 'They will see the offer the next time they sign in and must accept it explicitly.',
                label: 'Note (optional)',
                onConfirm: function (r) { A.proposeTransfer(t2.id, r); ui.toast('Offer sent to ' + t2.displayName + '.'); }
              });
            }
          }, icon('swap', 15), 'Offer to ' + t2.displayName);
        })) : h('p.muted', null, 'No other teacher accounts exist yet.')));
  }

  /* ---------------- Annual role review ---------------- */

  function roleReviewPanel() {
    var S = WL.store.state;
    if (!S.settings.roleExpiryEnabled) return null;
    var elevated = S.users.filter(function (u) {
      return WL.roleRank(u.role) >= 2 && u.role !== 'teacher_advisor' && u.roleExpiresAt;
    });
    if (!elevated.length) return null;

    return ui.card(
      h('div.spread.grow', null,
        h('h3', null, 'Annual role review'),
        ui.tag('Expires ' + WL.fmtDate(S.settings.roleExpiresOn), 'gold')),
      h('div', null,
        h('p.muted', { style: 'line-height:1.75' },
          'Elevated roles carry an expiry date. Without one, administrator access accumulates across graduating cohorts — within three years the site has a dozen administrators, most of whom no longer attend the school.'),
        h('div.mt16'),
        elevated.map(function (u) {
          var lapsed = new Date(u.roleExpiresAt) < new Date();
          return h('div.switchline', null,
            h('div.txt', null,
              h('b', null, u.displayName, ' ', ui.roleBadge(u.role), lapsed ? ui.tag('Lapsed', 'red') : null),
              h('span', null, 'Grade ' + (u.gradeLevel || '—') + ' · expires ' + WL.fmtDate(u.roleExpiresAt))),
            h('div.btn-row', null,
              h('button.btn.btn-sm', {
                type: 'button', onclick: function () { A.renewRole(u.id); ui.toast('Role re-confirmed for this school year.'); }
              }, 'Re-confirm'),
              h('button.btn.btn-sm.btn-danger', {
                type: 'button',
                onclick: function () {
                  ui.confirmModal({
                    title: 'Let ' + u.displayName + '’s role lapse',
                    body: h('p', null, 'They drop back to the base student role. Their past comments keep the role badge they held when they wrote them.'),
                    confirmLabel: 'Let it lapse', danger: true,
                    onConfirm: function () { A.expireRole(u.id); ui.toast('Role ended.'); }
                  });
                }
              }, 'Let it lapse')));
        })));
  }

  /* ---------------- Page ---------------- */

  WL.views.accounts = function () {
    var S = WL.store.state;
    if (!WL.can('manageAccounts')) return WL.views.denied('the account console');

    var rows = S.users.filter(function (u) {
      if (st.role && u.role !== st.role) return false;
      if (st.status === 'suspended' && !u.suspendedAt) return false;
      if (st.status === 'active' && u.suspendedAt) return false;
      if (st.status === 'reviewer' && u.reviewerStatus !== 'approved') return false;
      if (st.q) {
        var hay = (u.displayName + ' ' + u.email + ' ' + u.role).toLowerCase();
        if (hay.indexOf(st.q.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var keyFns = {
      name: function (u) { return u.displayName.toLowerCase(); },
      role: function (u) { return -WL.roleRank(u.role); },
      joined: function (u) { return u.createdAt; },
      active: function (u) { return u.lastActiveAt; }
    };
    rows = WL.sortBy(rows, keyFns[st.sort.key] || keyFns.name, st.sort.dir);

    var table = ui.dataTable({
      columns: [
        {
          key: 'name', label: 'Account', sortable: true, width: '28%', top: true,
          render: function (u) {
            return h('div.row', { style: 'align-items:center;gap:11px' },
              WL.avatar(u.displayName, u.id),
              h('div', null,
                h('button.cell-title', { type: 'button', onclick: function () { detailModal(u); } }, u.displayName),
                h('div.small.muted', null, u.email)));
          }
        },
        {
          key: 'role', label: 'Role', sortable: true, width: '17%', top: true,
          render: function (u) {
            return h('div.row.wrap', { style: 'gap:6px' },
              ui.roleBadge(u.role),
              u.isPrimaryAdvisor ? ui.tag('Primary', 'gold') : null,
              u.suspendedAt ? ui.tag('Suspended', 'red') : null);
          }
        },
        {
          key: 'reviewer', label: 'Reviewer', width: '11%', tight: true, top: true,
          render: function (u) {
            var map = { approved: ['Approved', 'green'], pending: ['Applied', 'gold'], rejected: ['Rejected', 'red'], revoked: ['Revoked', 'red'], none: ['—', 'grey'] };
            var v = map[u.reviewerStatus || 'none'] || map.none;
            return v[0] === '—' ? h('span.muted', null, '—') : ui.tag(v[0], v[1]);
          }
        },
        {
          key: 'expiry', label: 'Role expires', width: '12%', tight: true, top: true,
          render: function (u) {
            if (!u.roleExpiresAt) return h('span.muted.small', null, '—');
            var lapsed = new Date(u.roleExpiresAt) < new Date();
            return h('span.small', { style: lapsed ? 'color:#f5222d' : '' }, WL.fmtDate(u.roleExpiresAt));
          }
        },
        {
          key: 'active', label: 'Last active', sortable: true, width: '11%', tight: true, top: true,
          render: function (u) { return h('span.small.muted', null, WL.fmtAgo(u.lastActiveAt)); }
        },
        {
          key: 'act', label: 'Actions', width: '21%', top: true,
          render: function (u) {
            var acts = [];
            acts.push(h('button.btn-link', { type: 'button', onclick: function () { detailModal(u); } }, 'Details'));

            if (u.role !== 'teacher_advisor') {
              acts.push(h('button.btn-link', {
                type: 'button',
                onclick: function () {
                  var grant = u.reviewerStatus !== 'approved';
                  ui.reasonModal({
                    title: (grant ? 'Grant' : 'Revoke') + ' reviewer status',
                    danger: !grant, confirmLabel: grant ? 'Grant' : 'Revoke',
                    intro: 'The reason is recorded on the account and in the audit log.',
                    label: 'Reason',
                    onConfirm: function (r) { A.setReviewerStatus(u.id, grant, r); ui.toast('Done.'); }
                  });
                }
              }, u.reviewerStatus === 'approved' ? 'Revoke reviewer' : 'Make reviewer'));
            }

            if (WL.can('grantAdmin') && u.role !== 'teacher_advisor') {
              var isAdmin = u.role === 'officer_admin';
              acts.push(h('button.btn-link', {
                type: 'button',
                onclick: function () {
                  ui.reasonModal({
                    title: (isAdmin ? 'Remove' : 'Grant') + ' officer administrator status',
                    danger: isAdmin, confirmLabel: isAdmin ? 'Remove status' : 'Grant status',
                    intro: isAdmin
                      ? 'They keep reviewer status and their past comments keep the officer badge they carried at the time.'
                      : 'Officer administrators can moderate submissions, decide reviewer applications, delete comments and manage accounts. Only the faculty advisor can grant this.',
                    label: 'Reason',
                    onConfirm: function (r) { A.setAdminStatus(u.id, !isAdmin, r); ui.toast('Role updated.'); }
                  });
                }
              }, isAdmin ? 'Remove admin' : 'Make admin'));
            }

            acts.push(h('button.btn-link' + (u.suspendedAt ? '' : '.danger'), {
              type: 'button',
              onclick: function () {
                if (u.suspendedAt) {
                  ui.reasonModal({
                    title: 'Reinstate ' + u.displayName, confirmLabel: 'Reinstate', required: false,
                    label: 'Note (optional)',
                    onConfirm: function (r) { A.setSuspended(u.id, false, r); ui.toast('Account reinstated.'); }
                  });
                } else {
                  ui.reasonModal({
                    title: 'Suspend ' + u.displayName, danger: true, confirmLabel: 'Suspend',
                    intro: 'Suspending stops the account from submitting or commenting. None of their existing content is deleted.',
                    label: 'Reason',
                    onConfirm: function (r) { A.setSuspended(u.id, true, r); ui.toast('Account suspended.'); }
                  });
                }
              }
            }, u.suspendedAt ? 'Reinstate' : 'Suspend'));

            return h('div.row.wrap', { style: 'gap:12px;font-size:13px' }, acts);
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
      totalLabel: 'accounts',
      emptyTitle: 'No accounts match'
    });

    return h('div.container', null,
      h('h1.page-title.with-sub', null, 'Accounts'),
      h('p.page-sub', null,
        'Every account, what they have submitted, what they have written, and what has been done about them. Role changes always carry a recorded reason.'),

      h('div.stack.mb24', null, transferPanel(), roleReviewPanel()),

      h('div.toolbar', null,
        h('span.ctrl.ctrl-search', null,
          h('input.input', {
            type: 'search', placeholder: 'Search accounts', value: st.q,
            'aria-label': 'Search accounts',
            oninput: function (e) { st.q = e.target.value; st.page = 1; WL.render(); }
          }),
          h('span.ctrl-icon', null, icon('search', 15))),
        h('span.ctrl.ctrl-select', null,
          ui.select([
            { value: '', label: 'Filter by Role' },
            { value: 'student', label: 'Student' },
            { value: 'reviewer', label: 'Peer Reviewer' },
            { value: 'officer_admin', label: 'Officer Administrator' },
            { value: 'teacher_advisor', label: 'Teacher Advisor' }
          ], st.role, function (v) { st.role = v; st.page = 1; WL.render(); },
            { label: 'Filter by role', placeholderWhenEmpty: true })),
        h('span.ctrl.ctrl-select', null,
          ui.select([
            { value: '', label: 'Filter by Status' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'reviewer', label: 'Approved reviewers' }
          ], st.status, function (v) { st.status = v; st.page = 1; WL.render(); },
            { label: 'Filter by status', placeholderWhenEmpty: true })),
        h('button.btn.btn-danger', {
          type: 'button',
          onclick: function () { st.q = ''; st.role = ''; st.status = ''; st.page = 1; WL.render(); }
        }, 'Reset Filters')),

      ui.card(null, table)
    );
  };
})(window.WL);
