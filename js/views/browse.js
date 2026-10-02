/* ============================================================
   views/browse.js - public index of approved work (spec 5.1)
   Layout deliberately mirrors the HSE Courses search page.
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon;

  var st = { q: '', genre: '', tag: '', feedback: '', sort: { key: 'created', dir: 'desc' }, page: 1, pageSize: 10 };

  function reset() {
    st.q = ''; st.genre = ''; st.tag = ''; st.feedback = ''; st.page = 1;
    st.sort = { key: 'created', dir: 'desc' };
    WL.render();
  }

  function commentCount(w) {
    return WL.workComments(w.id).filter(function (c) { return !c.deletedAt && !c.heldForApproval; }).length;
  }

  WL.views.browse = function () {
    var S = WL.store.state;

    var all = S.works.filter(function (w) { return w.status === 'approved'; });

    var rows = all.filter(function (w) {
      if (st.genre && w.genre !== st.genre) return false;
      if (st.tag && (w.tags || []).indexOf(st.tag) === -1) return false;
      if (st.feedback === 'none' && commentCount(w) > 0) return false;
      if (st.feedback === 'some' && commentCount(w) === 0) return false;
      if (st.q) {
        var hay = (w.title + ' ' + (w.description || '') + ' ' + (w.tags || []).join(' ') + ' ' + w.genre).toLowerCase();
        if (hay.indexOf(st.q.toLowerCase()) === -1) return false;
      }
      return true;
    });

    var keyFns = {
      title: function (w) { return w.title.toLowerCase(); },
      genre: function (w) { return w.genre; },
      comments: commentCount,
      created: function (w) { return w.moderatedAt || w.createdAt; }
    };
    rows = WL.sortBy(rows, keyFns[st.sort.key] || keyFns.created, st.sort.dir);

    var searchBox = h('span.ctrl.ctrl-search', null,
      h('input.input', {
        type: 'search', placeholder: 'Search Work', value: st.q,
        'aria-label': 'Search approved work',
        oninput: function (e) { st.q = e.target.value; st.page = 1; WL.render(); }
      }),
      h('span.ctrl-icon', null, icon('search', 15))
    );

    var genreSel = h('span.ctrl.ctrl-select', null,
      ui.select(
        [{ value: '', label: 'Filter by Genre' }].concat(WL.GENRES.map(function (g) { return { value: g, label: g }; })),
        st.genre,
        function (v) { st.genre = v; st.page = 1; WL.render(); },
        { label: 'Filter by genre', placeholderWhenEmpty: true }
      )
    );

    var tagSel = h('span.ctrl.ctrl-select', null,
      ui.select(
        [{ value: '', label: 'Filter by Tags' }].concat(S.tags.map(function (t) { return { value: t, label: t }; })),
        st.tag,
        function (v) { st.tag = v; st.page = 1; WL.render(); },
        { label: 'Filter by tag', placeholderWhenEmpty: true }
      )
    );

    var fbSel = h('span.ctrl.ctrl-select', null,
      ui.select([
        { value: '', label: 'Filter by Feedback' },
        { value: 'none', label: 'No feedback yet' },
        { value: 'some', label: 'Has feedback' }
      ], st.feedback, function (v) { st.feedback = v; st.page = 1; WL.render(); },
        { label: 'Filter by feedback status', placeholderWhenEmpty: true })
    );

    var table = ui.dataTable({
      columns: [
        {
          key: 'title', label: 'Title (click for more info)', sortable: true, width: '34%',
          render: function (w) {
            return h('div', null,
              h('button.cell-title', {
                type: 'button',
                onclick: function () { location.hash = '#/work/' + w.id; }
              }, w.title),
              w.needsAttention ? h('div.mt8', null, ui.tag('Flagged for attention', 'volcano')) : null
            );
          }
        },
        {
          key: 'genre', label: 'Genre', sortable: true, width: '17%',
          render: function (w) { return ui.tag(w.genre, ui.tagColor(w.genre)); }
        },
        {
          key: 'tags', label: 'Tags', width: '20%',
          render: function (w) { return ui.tagList(w.tags); }
        },
        {
          key: 'comments', label: 'Comments', sortable: true, width: '11%', tight: true,
          render: function (w) {
            var n = commentCount(w);
            return h('span', null,
              String(n),
              n === 0 ? h('span', { style: 'margin-left:8px' }, ui.tag('Needs review', 'gold')) : null
            );
          }
        },
        {
          key: 'focus', label: 'Feedback Focus', width: '18%',
          render: function (w) { return ui.tag(w.feedbackFocus || 'General impressions', 'green'); }
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
      onPage: function (n) { st.page = n; WL.render(); window.scrollTo(0, 0); },
      onPageSize: function (n) { st.pageSize = n; st.page = 1; WL.render(); },
      totalLabel: 'approved works',
      emptyTitle: 'No work matches these filters',
      emptySub: 'Try clearing a filter, or reset them all.'
    });

    return h('div.container', null,
      h('h1.page-title', null, 'Browse Work'),
      h('div.toolbar', null,
        searchBox, genreSel, tagSel, fbSel,
        h('button.btn.btn-danger', { type: 'button', onclick: reset }, 'Reset Filters')
      ),
      table
    );
  };
})(window.WL);
