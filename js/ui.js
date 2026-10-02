/* ============================================================
   ui.js - shared presentational components
   ============================================================ */
window.WL = window.WL || {};

(function (WL) {
  'use strict';
  var h = WL.h, icon = WL.icon;

  /* ---------------- Tags & badges ---------------- */

  function tag(text, color, opts) {
    return h('span.tag' + (color ? '.' + color : '') + ((opts && opts.plain) ? '.plain' : ''), null, text);
  }

  function roleBadge(roleKey) {
    var r = WL.ROLES[roleKey];
    if (!r) return tag(roleKey, 'grey');
    return tag(r.short, r.color);
  }

  function statusTag(status) {
    var s = WL.STATUS[status] || { label: status, color: 'grey' };
    return tag(s.label, s.color);
  }

  var SEVERITY = {
    high: { label: 'High', color: 'red', dot: '#f5222d' },
    medium: { label: 'Medium', color: 'volcano', dot: '#fa541c' },
    low: { label: 'Low', color: 'gold', dot: '#faad14' }
  };

  function severityTag(sev) {
    var s = SEVERITY[sev] || SEVERITY.low;
    return tag(s.label + ' severity', s.color);
  }

  function severityDot(sev) {
    var s = SEVERITY[sev] || SEVERITY.low;
    return h('span.dot-sev', { style: 'background:' + s.dot });
  }

  /* ---------------- Alerts ---------------- */

  function alert(kind, content, opts) {
    var icons = { info: 'info', warn: 'warn', error: 'xCircle', ok: 'checkCircle' };
    return h('div.alert.alert-' + kind, opts || null,
      h('span.ico', null, icon(icons[kind] || 'info', 16)),
      h('div.grow', null, content)
    );
  }

  /* ---------------- Toasts ---------------- */

  function toast(message, kind) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var ic = kind === 'error' ? icon('xCircle', 17) : kind === 'warn' ? icon('warn', 17) : icon('checkCircle', 17);
    var color = kind === 'error' ? '#f5222d' : kind === 'warn' ? '#faad14' : '#52c41a';
    var el = h('div.toast', { role: 'status' },
      h('span.ico', { style: 'color:' + color }, ic),
      h('span', null, message));
    host.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s'; el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 3600);
  }

  /* ---------------- Modal ---------------- */

  var openModal = null;

  function modal(opts) {
    closeModal();
    var body = opts.body;
    var footer = opts.footer || [];
    var mask = h('div.modal-mask', {
      role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Dialog',
      onclick: function (e) { if (e.target === mask && opts.dismissible !== false) closeModal(); }
    },
      h('div.modal' + (opts.wide ? '.lg' : ''), null,
        h('div.modal-head', null,
          h('h3', null, opts.title),
          h('button.x-btn', { type: 'button', 'aria-label': 'Close', onclick: closeModal }, '×')
        ),
        h('div.modal-body', null, body),
        footer.length ? h('div.modal-foot', null, footer) : null
      )
    );
    document.body.appendChild(mask);
    document.body.style.overflow = 'hidden';
    openModal = mask;
    var focusable = mask.querySelector('textarea, input, select, button.btn-primary, button');
    if (focusable) setTimeout(function () { focusable.focus(); }, 30);
    return mask;
  }

  function closeModal() {
    if (openModal && openModal.parentNode) openModal.parentNode.removeChild(openModal);
    openModal = null;
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // Modal that requires a written reason before the primary action fires
  function reasonModal(opts) {
    var ta = h('textarea.input', {
      rows: 5, placeholder: opts.placeholder || 'Write the reason…',
      id: 'reason-field', 'aria-describedby': 'reason-help'
    });
    var err = h('div.hint', { style: 'color:#f5222d;display:none' }, 'A written reason is required.');
    var confirm = h('button.btn' + (opts.danger ? '.btn-solid-danger' : '.btn-primary'), {
      type: 'button',
      onclick: function () {
        var v = ta.value.trim();
        if (!v && opts.required !== false) { err.style.display = 'block'; ta.focus(); return; }
        closeModal();
        opts.onConfirm(v);
      }
    }, opts.confirmLabel || 'Confirm');

    modal({
      title: opts.title,
      body: h('div', null,
        opts.intro ? h('p.mb16', null, opts.intro) : null,
        opts.extra || null,
        h('label.lbl', { for: 'reason-field' },
          opts.required === false ? null : h('span.req', null, '*'),
          opts.label || 'Reason'),
        ta,
        h('div.hint', { id: 'reason-help' }, opts.help ||
          'This is recorded in the audit log and delivered to the person affected.'),
        err
      ),
      footer: [
        h('button.btn', { type: 'button', onclick: closeModal }, 'Cancel'),
        confirm
      ]
    });
  }

  function confirmModal(opts) {
    modal({
      title: opts.title,
      body: h('div', null, opts.body),
      footer: [
        h('button.btn', { type: 'button', onclick: closeModal }, opts.cancelLabel || 'Cancel'),
        h('button.btn' + (opts.danger ? '.btn-solid-danger' : '.btn-primary'), {
          type: 'button',
          onclick: function () { closeModal(); opts.onConfirm(); }
        }, opts.confirmLabel || 'Confirm')
      ]
    });
  }

  /* ---------------- Empty state ---------------- */

  function empty(title, sub) {
    return h('div.empty', null,
      h('div', { style: 'color:#d9d9d9;margin-bottom:10px' }, icon('inbox', 40, { w: 1.2 })),
      h('div.big', null, title),
      sub ? h('div.small', null, sub) : null
    );
  }

  /* ---------------- Sortable / paginated table ---------------- */

  /*
    dataTable({
      columns: [{key,label,sortable,width,render(row),value(row)}],
      rows: [...],
      sort: {key, dir}, onSort(key),
      page, pageSize, onPage(n), onPageSize(n),
      emptyTitle, emptySub, totalLabel
    })
  */
  function dataTable(cfg) {
    var rows = cfg.rows || [];
    var pageSize = cfg.pageSize || 10;
    var total = rows.length;
    var pages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, cfg.page || 1), pages);
    var slice = cfg.paginate === false ? rows : rows.slice((page - 1) * pageSize, page * pageSize);

    var thead = h('thead', null, h('tr', null, cfg.columns.map(function (col) {
      var inner;
      if (col.sortable) {
        var active = cfg.sort && cfg.sort.key === col.key;
        inner = h('button.sortable', {
          type: 'button',
          'aria-label': 'Sort by ' + col.label,
          onclick: function () { cfg.onSort && cfg.onSort(col.key); }
        }, col.label, h('span.sort-arrows', null,
          h('i', { class: 'up' + (active && cfg.sort.dir === 'asc' ? ' on' : '') }),
          h('i', { class: 'dn' + (active && cfg.sort.dir === 'desc' ? ' on' : '') })
        ));
      } else inner = col.label;
      return h('th', col.width ? { style: 'width:' + col.width } : null, inner);
    })));

    var tbody = h('tbody', null, slice.map(function (row, i) {
      return h('tr', null, cfg.columns.map(function (col) {
        return h('td' + (col.tight ? '.tight' : '') + (col.top ? '.top' : ''), null, col.render(row, i));
      }));
    }));

    var table = h('div.table-wrap', null,
      h('table.data', null, thead, total ? tbody : null));

    if (!total) {
      return h('div', null, table, empty(cfg.emptyTitle || 'Nothing here yet', cfg.emptySub));
    }

    if (cfg.paginate === false) return table;

    return h('div', null, table, pagination({
      page: page, pages: pages, total: total, pageSize: pageSize,
      totalLabel: cfg.totalLabel || 'items',
      onPage: cfg.onPage, onPageSize: cfg.onPageSize
    }));
  }

  function pagination(o) {
    var nums = [];
    var add = function (n) {
      nums.push(h('button.pg' + (n === o.page ? '.active' : ''), {
        type: 'button', 'aria-label': 'Page ' + n,
        'aria-current': n === o.page ? 'page' : null,
        onclick: function () { o.onPage && o.onPage(n); }
      }, String(n)));
    };
    var ell = function () { nums.push(h('span.pg.ellipsis', null, '•••')); };

    if (o.pages <= 7) { for (var i = 1; i <= o.pages; i++) add(i); }
    else {
      add(1);
      var start = Math.max(2, o.page - 1), end = Math.min(o.pages - 1, o.page + 1);
      if (o.page <= 3) { start = 2; end = 4; }
      if (o.page >= o.pages - 2) { start = o.pages - 3; end = o.pages - 1; }
      if (start > 2) ell();
      for (var j = start; j <= end; j++) add(j);
      if (end < o.pages - 1) ell();
      add(o.pages);
    }

    var sizeSelect = h('select.select.pg-size', {
      'aria-label': 'Results per page',
      onchange: function (e) { o.onPageSize && o.onPageSize(parseInt(e.target.value, 10)); }
    }, [10, 20, 50].map(function (n) {
      return h('option', { value: n, selected: n === o.pageSize }, n + ' / page');
    }));

    return h('nav.pagination', { 'aria-label': 'Pagination' },
      h('span.pg-total', null, o.total + ' ' + o.totalLabel),
      h('button.pg', {
        type: 'button', 'aria-label': 'Previous page', disabled: o.page === 1,
        onclick: function () { o.onPage && o.onPage(o.page - 1); }
      }, '‹'),
      nums,
      h('button.pg', {
        type: 'button', 'aria-label': 'Next page', disabled: o.page === o.pages,
        onclick: function () { o.onPage && o.onPage(o.page + 1); }
      }, '›'),
      o.onPageSize ? sizeSelect : null
    );
  }

  /* ---------------- Form helpers ---------------- */

  function field(labelText, control, hint, required) {
    var id = control.id || ('f_' + Math.random().toString(36).slice(2, 8));
    control.id = id;
    return h('div.field', null,
      h('label.lbl', { for: id }, required ? h('span.req', null, '*') : null, labelText),
      control,
      hint ? h('div.hint', null, hint) : null
    );
  }

  function select(options, value, onChange, opts) {
    var el = h('select.select', {
      onchange: function (e) { onChange(e.target.value); },
      'aria-label': (opts && opts.label) || undefined
    });
    options.forEach(function (o) {
      var val = typeof o === 'string' ? o : o.value;
      var lab = typeof o === 'string' ? o : o.label;
      el.appendChild(h('option', { value: val, selected: String(val) === String(value) }, lab));
    });
    if (opts && opts.placeholderWhenEmpty && !value) el.classList.add('placeholder');
    return el;
  }

  function switchToggle(checked, onChange, ariaLabel, disabled) {
    return h('button.switch', {
      type: 'button', role: 'switch', 'aria-checked': checked ? 'true' : 'false',
      'aria-label': ariaLabel, disabled: !!disabled,
      onclick: function () { onChange(!checked); }
    });
  }

  function switchLine(title, desc, checked, onChange, disabled) {
    return h('div.switchline', null,
      h('div.txt', null, h('b', null, title), h('span', null, desc)),
      switchToggle(checked, onChange, title, disabled)
    );
  }

  /* ---------------- Cards ---------------- */

  function card(headContent, bodyContent, opts) {
    return h('div.card', opts || null,
      headContent ? h('div.card-head', null, headContent) : null,
      bodyContent ? h('div.card-body', null, bodyContent) : null
    );
  }

  function statCard(label, value, sub) {
    return h('div.stat', null,
      h('div.k', null, label),
      h('div.v', null, value),
      sub ? h('div.s', null, sub) : null
    );
  }

  /* ---------------- Excerpt with highlighted terms ---------------- */

  function excerpt(text, terms, severity) {
    var el = h('div.excerpt' + (severity === 'high' ? '.sev-high' : ''));
    var remaining = String(text || '');
    if (!terms || !terms.length) { el.textContent = remaining; return el; }
    var pattern = terms.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|');
    var re = new RegExp('(' + pattern + ')', 'ig');
    var last = 0, m;
    while ((m = re.exec(remaining)) !== null) {
      if (m.index > last) el.appendChild(document.createTextNode(remaining.slice(last, m.index)));
      el.appendChild(h('mark', null, m[0]));
      last = m.index + m[0].length;
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    if (last < remaining.length) el.appendChild(document.createTextNode(remaining.slice(last)));
    return el;
  }

  /* ---------------- Tag colour mapping ---------------- */

  var TAG_COLORS = ['blue', 'cyan', 'purple', 'green', 'gold', 'magenta'];
  function tagColor(name) {
    var n = 0; for (var i = 0; i < name.length; i++) n = (n * 31 + name.charCodeAt(i)) >>> 0;
    return TAG_COLORS[n % TAG_COLORS.length];
  }
  function tagList(names) {
    if (!names || !names.length) return tag('None', 'red');
    return h('span.tag-cell', null, names.map(function (t) { return tag(t, tagColor(t)); }));
  }

  /* ---------------- Breadcrumb ---------------- */

  function breadcrumb(items) {
    var parts = [];
    items.forEach(function (it, i) {
      if (i) parts.push(h('span', { style: 'margin:0 8px' }, '/'));
      if (it.href) parts.push(h('button.btn-link', {
        type: 'button', onclick: function () { location.hash = it.href; }
      }, it.label));
      else parts.push(h('span', null, it.label));
    });
    return h('div.breadcrumb', null, parts);
  }

  WL.ui = {
    tag: tag, roleBadge: roleBadge, statusTag: statusTag,
    severityTag: severityTag, severityDot: severityDot, SEVERITY: SEVERITY,
    alert: alert, toast: toast, modal: modal, closeModal: closeModal,
    reasonModal: reasonModal, confirmModal: confirmModal,
    empty: empty, dataTable: dataTable, pagination: pagination,
    field: field, select: select, switchToggle: switchToggle, switchLine: switchLine,
    card: card, statCard: statCard, excerpt: excerpt,
    tagList: tagList, tagColor: tagColor, breadcrumb: breadcrumb
  };
})(window.WL);
