/* ============================================================
   app.js - shell, header, account switcher, router
   ============================================================ */
window.WL = window.WL || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon, A = WL.actions;

  var openDropdown = null; // 'account' | 'notifications' | 'admin' | null

  /* ---------------- Brand mark ---------------- */

  function brandMark() {
    var wrap = document.createElement('span');
    wrap.className = 'mark';
    wrap.style.display = 'inline-flex';
    wrap.innerHTML =
      '<svg width="34" height="30" viewBox="0 0 34 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<path d="M9 3 L17 11 L9 19 L1 11 Z" fill="#e02a35"/>' +
      '<path d="M23 3 L31 11 L23 19 L15 11 Z" fill="#1890ff"/>' +
      '<path d="M4 25 h26" stroke="#1f1f1f" stroke-width="2.2" stroke-linecap="round"/>' +
      '</svg>';
    return wrap.firstChild;
  }

  /* ---------------- Navigation ---------------- */

  function navItems() {
    var items = [
      { hash: '#/browse', label: 'Browse Work', icon: 'compass', show: true },
      { hash: '#/needs-review', label: 'Needs Review', icon: 'list', show: WL.can('commentAnywhere') },
      { hash: '#/mywork', label: 'My Work', icon: 'book', show: true },
      { hash: '#/submit', label: 'Submit', icon: 'upload', show: true }
    ];
    return items.filter(function (i) { return i.show; });
  }

  var ADMIN_LINKS = [
    { hash: '#/queue', label: 'Review Queue', icon: 'inbox', desc: 'Approve, deny, or send work back', count: WL.queueCount },
    { hash: '#/applications', label: 'Reviewer Applications', icon: 'users', desc: 'Decide who can leave feedback', count: WL.applicationCount },
    { hash: '#/reports', label: 'Comment Moderation', icon: 'flag', desc: 'Reported and held comments', count: WL.reportCount },
    { hash: '#/accounts', label: 'Accounts', icon: 'users', desc: 'Roles, suspensions, annual review' },
    { hash: '#/audit', label: 'Audit Log', icon: 'scroll', desc: 'Every administrative action, append-only' },
    { hash: '#/analytics', label: 'Analytics', icon: 'chart', desc: 'The case for keeping the program' },
    { hash: '#/settings', label: 'Site Settings', icon: 'gear', desc: 'Policy, screening, notifications' }
  ];

  function currentHash() {
    return location.hash || '#/browse';
  }

  function isActive(hash) {
    var c = currentHash();
    if (hash === '#/browse') return c === '#/browse' || c.indexOf('#/work/') === 0;
    return c === hash;
  }

  function adminBadgeCount() {
    return WL.queueCount() + WL.applicationCount() + WL.reportCount();
  }

  /* ---------------- Header ---------------- */

  function header() {
    var S = WL.store.state;
    var me = WL.me();
    var isAdmin = WL.can('moderate');
    var unread = WL.unreadCount(me.id);

    var nav = h('nav.main-nav', { 'aria-label': 'Main' },
      navItems().map(function (it) {
        return h('button.nav-item' + (isActive(it.hash) ? '.active' : ''), {
          type: 'button',
          'aria-current': isActive(it.hash) ? 'page' : null,
          onclick: function () { location.hash = it.hash; }
        }, icon(it.icon, 17), h('span.lbl-t', null, it.label));
      }),
      isAdmin ? adminMenu() : null
    );

    return h('header.site-header', null,
      h('a.brand', {
        href: '#/browse',
        style: 'text-decoration:none',
        onclick: function (e) { e.preventDefault(); location.hash = '#/browse'; }
      }, brandMark(), h('span.word', null, 'Writers Lab')),
      nav,
      h('div.header-right', null, notificationBell(unread), accountSwitcher(me))
    );
  }

  function adminMenu() {
    var count = adminBadgeCount();
    var open = openDropdown === 'admin';
    var anyActive = ADMIN_LINKS.some(function (l) { return isActive(l.hash); });

    return h('div.dropdown', { style: 'height:100%' },
      h('button.nav-item' + (anyActive ? '.active' : ''), {
        type: 'button', 'aria-expanded': open ? 'true' : 'false', 'aria-haspopup': 'true',
        onclick: function (e) { e.stopPropagation(); openDropdown = open ? null : 'admin'; WL.render(); }
      }, icon('shield', 17), h('span.lbl-t', null, 'Administration'),
        count ? h('span.nav-count', null, String(count)) : null,
        icon('chevDown', 13)),
      open ? h('div.dd-panel.wide.left', { onclick: function (e) { e.stopPropagation(); } },
        h('div.dd-head', null, 'Administration'),
        ADMIN_LINKS.map(function (l) {
          var n = l.count ? l.count() : 0;
          return h('button.dd-item' + (isActive(l.hash) ? '.current' : ''), {
            type: 'button',
            onclick: function () { openDropdown = null; location.hash = l.hash; }
          },
            h('span', { style: 'color:#1890ff;margin-top:2px' }, icon(l.icon, 16)),
            h('span.who', null, h('b', null, l.label), h('span', null, l.desc)),
            n ? h('span.nav-count', { style: 'margin-top:3px' }, String(n)) : null);
        })
      ) : null
    );
  }

  function notificationBell(unread) {
    var S = WL.store.state;
    var me = WL.me();
    var open = openDropdown === 'notifications';
    var mine = S.notifications.filter(function (n) { return n.userId === me.id; }).slice(0, 6);

    return h('div.dropdown', null,
      h('button.btn', {
        type: 'button', 'aria-label': 'Notifications' + (unread ? ' (' + unread + ' unread)' : ''),
        'aria-expanded': open ? 'true' : 'false',
        style: 'position:relative;padding:5px 10px',
        onclick: function (e) { e.stopPropagation(); openDropdown = open ? null : 'notifications'; WL.render(); }
      }, icon('bell', 17),
        unread ? h('span.nav-count', { style: 'position:absolute;top:-6px;right:-6px' }, String(unread)) : null),
      open ? h('div.dd-panel.wide', { onclick: function (e) { e.stopPropagation(); } },
        h('div.dd-head', null, 'Notifications' + (unread ? ' — ' + unread + ' unread' : '')),
        mine.length ? h('div', { style: 'padding:0 16px' },
          mine.map(function (n) { return WL.views.notifRow(n); }))
          : h('div.dd-note', null, 'Nothing yet.'),
        h('div.dd-sep'),
        h('button.dd-item', {
          type: 'button',
          onclick: function () { openDropdown = null; location.hash = '#/notifications'; }
        }, h('span.who', null, h('b', null, 'Open the notification centre')))
      ) : null
    );
  }

  function accountSwitcher(me) {
    var S = WL.store.state;
    var open = openDropdown === 'account';
    var demo = S.users.filter(function (u) { return u.demoAccount; });
    var role = WL.effectiveRole(me);

    return h('div.dropdown', null,
      h('button.acct-btn', {
        type: 'button', 'aria-expanded': open ? 'true' : 'false', 'aria-haspopup': 'true',
        onclick: function (e) { e.stopPropagation(); openDropdown = open ? null : 'account'; WL.render(); }
      },
        WL.avatar(me.displayName, me.id),
        h('span.acct-meta', null,
          h('span.nm', null, me.displayName),
          h('span.rl', null, WL.roleLabel(role))),
        icon('chevDown', 13)),

      open ? h('div.dd-panel.wide', { onclick: function (e) { e.stopPropagation(); } },
        h('div.dd-head', null, 'Switch account'),
        demo.map(function (u) {
          var isCurrent = u.id === me.id;
          return h('button.dd-item' + (isCurrent ? '.current' : ''), {
            type: 'button',
            onclick: function () {
              openDropdown = null;
              A.switchAccount(u.id);
              ui.toast('Signed in as ' + u.displayName + ' — ' + WL.roleLabel(u.role) + '.');
            }
          },
            WL.avatar(u.displayName, u.id),
            h('span.who', null,
              h('b', null, u.displayName, isCurrent ? ' — signed in' : ''),
              h('span', null, u.demoBlurb)),
            h('span', { style: 'margin-top:2px' }, ui.roleBadge(u.role)));
        }),
        h('div.dd-sep'),
        !WL.can('commentAnywhere') ? h('button.dd-item', {
          type: 'button',
          onclick: function () { openDropdown = null; location.hash = '#/apply'; }
        }, h('span', { style: 'color:#1890ff;margin-top:2px' }, icon('award', 16)),
          h('span.who', null, h('b', null, 'Apply to be a peer reviewer'))) : null,
        h('button.dd-item', {
          type: 'button',
          onclick: function () { openDropdown = null; location.hash = '#/about'; }
        }, h('span', { style: 'color:#1890ff;margin-top:2px' }, icon('info', 16)),
          h('span.who', null, h('b', null, 'About this prototype'),
            h('span', null, 'What is real, what is staged, and a walkthrough'))),
        h('div.dd-note', null,
          'No sign-in screen in this prototype. Switching is instantaneous and deliberate, so every role can be shown in one sitting. ' +
          'The real system authenticates properly and re-checks every permission on the server.')
      ) : null
    );
  }

  /* ---------------- Footer ---------------- */

  function footer() {
    return h('footer', { style: 'border-top:1px solid #f0f0f0;background:#fff;padding:24px 0;margin-top:40px' },
      h('div.container', { style: 'padding-top:0;padding-bottom:0' },
        h('div.spread', null,
          h('div.small.muted', null,
            'Writers Lab Online — prototype for administrator review. Not a live service; no data leaves this browser.'),
          h('div.row.wrap', { style: 'gap:20px' },
            h('button.btn-link.small', { type: 'button', onclick: function () { location.hash = '#/terms'; } }, 'Terms of use'),
            h('button.btn-link.small', { type: 'button', onclick: function () { location.hash = '#/privacy'; } }, 'Privacy policy'),
            h('button.btn-link.small', { type: 'button', onclick: function () { location.hash = '#/about'; } }, 'About this prototype')))));
  }

  /* ---------------- Router ---------------- */

  var ROUTES = [
    { re: /^#\/browse$/, view: function () { return WL.views.browse(); } },
    { re: /^#\/work\/([\w-]+)$/, view: function (m) { return WL.views.work({ id: m[1] }); } },
    { re: /^#\/submit$/, view: function () { return WL.views.submit(); } },
    { re: /^#\/mywork$/, view: function () { return WL.views.mywork(); } },
    { re: /^#\/needs-review$/, view: function () { return WL.views.needsReview(); } },
    { re: /^#\/queue$/, view: function () { return WL.views.queue(); } },
    { re: /^#\/applications$/, view: function () { return WL.views.applications(); } },
    { re: /^#\/apply$/, view: function () { return WL.views.apply(); } },
    { re: /^#\/reports$/, view: function () { return WL.views.reports(); } },
    { re: /^#\/accounts$/, view: function () { return WL.views.accounts(); } },
    { re: /^#\/audit$/, view: function () { return WL.views.audit(); } },
    { re: /^#\/analytics$/, view: function () { return WL.views.analytics(); } },
    { re: /^#\/settings$/, view: function () { return WL.views.settings(); } },
    { re: /^#\/notifications$/, view: function () { return WL.views.notifications(); } },
    { re: /^#\/terms$/, view: function () { return WL.views.terms(); } },
    { re: /^#\/privacy$/, view: function () { return WL.views.privacy(); } },
    { re: /^#\/about$/, view: function () { return WL.views.about(); } }
  ];

  function resolve() {
    var hash = currentHash();
    for (var i = 0; i < ROUTES.length; i++) {
      var m = ROUTES[i].re.exec(hash);
      if (m) {
        try { return ROUTES[i].view(m); }
        catch (err) {
          console.error(err);
          return h('div.container.narrow', null,
            ui.alert('error', h('div', null,
              h('b', null, 'Something went wrong rendering this page. '),
              String(err && err.message))));
        }
      }
    }
    return h('div.container.narrow', null,
      ui.empty('Page not found', 'That address does not match anything in the prototype.'));
  }

  /* ---------------- Render ---------------- */

  var rendering = false;

  function render() {
    if (rendering) return;
    rendering = true;
    try {
      var root = document.getElementById('app');
      WL.clear(root);
      root.appendChild(header());
      var main = h('main', { id: 'main', tabindex: '-1' }, resolve());
      root.appendChild(main);
      root.appendChild(footer());
    } finally { rendering = false; }
  }

  WL.render = render;

  /* ---------------- Boot ---------------- */

  document.addEventListener('click', function () {
    if (openDropdown) { openDropdown = null; render(); }
  });

  window.addEventListener('hashchange', function () {
    openDropdown = null;
    render();
    window.scrollTo(0, 0);
    var main = document.getElementById('main');
    // preventScroll matters: focusing <main> would otherwise scroll the
    // sticky header off the top of every page you navigate to.
    if (main) { try { main.focus({ preventScroll: true }); } catch (e) { /* older browsers */ } }
  });

  WL.store.subscribe(function () { render(); });

  document.addEventListener('DOMContentLoaded', function () {
    if (!location.hash) location.hash = '#/browse';
    render();
  });

  // If the script loads after DOMContentLoaded has already fired
  if (document.readyState !== 'loading') {
    if (!location.hash) location.hash = '#/browse';
    render();
  }
})(window.WL);
