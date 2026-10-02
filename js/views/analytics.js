/* ============================================================
   views/analytics.js - reporting dashboard (spec 7.3)
   The argument for keeping the program funded.
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon;

  function monthKey(iso) {
    var d = new Date(iso);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function monthLabel(key) {
    var p = key.split('-');
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return M[parseInt(p[1], 10) - 1];
  }

  function lastMonths(n) {
    var out = [], d = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'));
    }
    return out;
  }

  WL.views.analytics = function () {
    var S = WL.store.state;
    if (!WL.can('viewAnalytics')) return WL.views.denied('the analytics dashboard');

    var works = S.works;
    var liveComments = S.comments.filter(function (c) { return !c.deletedAt && !c.heldForApproval; });
    var approved = works.filter(function (w) { return w.status === 'approved'; });

    // time from publication to first comment
    var times = [];
    approved.forEach(function (w) {
      var cs = liveComments.filter(function (c) { return c.workId === w.id; });
      if (!cs.length) return;
      var first = WL.sortBy(cs, function (c) { return c.createdAt; }, 'asc')[0];
      times.push(WL.hoursBetween(w.moderatedAt || w.createdAt, first.createdAt));
    });
    var avgHours = times.length ? times.reduce(function (a, b) { return a + b; }, 0) / times.length : 0;

    var withFeedback = approved.filter(function (w) {
      return liveComments.some(function (c) { return c.workId === w.id; });
    }).length;
    var coverage = approved.length ? Math.round(100 * withFeedback / approved.length) : 0;

    var activeReviewers = WL.uniq(liveComments
      .filter(function (c) { return WL.daysBetween(c.createdAt, new Date().toISOString()) <= 60; })
      .map(function (c) { return c.authorUserId; })).length;

    var months = lastMonths(6);
    var subByMonth = {}, comByMonth = {};
    months.forEach(function (m) { subByMonth[m] = 0; comByMonth[m] = 0; });
    works.forEach(function (w) { var k = monthKey(w.createdAt); if (k in subByMonth) subByMonth[k]++; });
    liveComments.forEach(function (c) { var k = monthKey(c.createdAt); if (k in comByMonth) comByMonth[k]++; });
    var maxBar = Math.max(1, Math.max.apply(null, months.map(function (m) {
      return Math.max(subByMonth[m], comByMonth[m]);
    })));

    // per-reviewer contribution
    var perReviewer = {};
    liveComments.forEach(function (c) {
      perReviewer[c.authorUserId] = perReviewer[c.authorUserId] || { n: 0, chars: 0, last: c.createdAt };
      perReviewer[c.authorUserId].n++;
      perReviewer[c.authorUserId].chars += c.body.length;
      if (new Date(c.createdAt) > new Date(perReviewer[c.authorUserId].last)) {
        perReviewer[c.authorUserId].last = c.createdAt;
      }
    });
    var reviewerRows = Object.keys(perReviewer).map(function (id) {
      var r = perReviewer[id];
      return { id: id, n: r.n, avg: Math.round(r.chars / r.n), last: r.last };
    });
    reviewerRows = WL.sortBy(reviewerRows, 'n', 'desc');

    var genreCounts = WL.groupCount(approved, function (w) { return w.genre; });
    var genreRows = WL.sortBy(Object.keys(genreCounts).map(function (g) {
      return { genre: g, n: genreCounts[g] };
    }), 'n', 'desc');
    var maxGenre = genreRows.length ? genreRows[0].n : 1;

    function exportSummary() {
      var lines = [
        ['Writers Lab Online — summary report'],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Metric', 'Value'],
        ['Total submissions', works.length],
        ['Published works', approved.length],
        ['Comments written', liveComments.length],
        ['Registered accounts', S.users.length],
        ['Approved peer reviewers', S.users.filter(function (u) { return u.reviewerStatus === 'approved'; }).length],
        ['Active reviewers (60 days)', activeReviewers],
        ['Works receiving feedback', withFeedback + ' of ' + approved.length + ' (' + coverage + '%)'],
        ['Average time to first comment', avgHours.toFixed(1) + ' hours'],
        ['Submissions denied', works.filter(function (w) { return w.status === 'denied'; }).length],
        ['Submissions withdrawn by author', works.filter(function (w) { return w.status === 'withdrawn'; }).length],
        ['Screening flags raised', S.flags.length],
        ['Comment reports', S.commentReports.length],
        [],
        ['Per-reviewer contribution'],
        ['Reviewer', 'Comments', 'Average length (characters)', 'Last comment']
      ].concat(reviewerRows.map(function (r) {
        return [WL.userName(r.id), r.n, r.avg, WL.fmtDate(r.last)];
      })).concat([[], ['Submissions by month'], ['Month', 'Submissions', 'Comments']])
        .concat(months.map(function (m) { return [m, subByMonth[m], comByMonth[m]]; }));
      WL.downloadText('writers-lab-summary.csv', WL.toCSV(lines), 'text/csv');
      ui.toast('Summary exported. This is the file you hand to the administration.');
    }

    return h('div.container', null,
      h('div.spread.mb8', null,
        h('h1.page-title.with-sub', { style: 'margin-bottom:0' }, 'Analytics'),
        h('button.btn.btn-primary', { type: 'button', onclick: exportSummary },
          icon('download', 15), 'Export summary for administration')),
      h('p.page-sub', null,
        'The program was discontinued once. Concrete usage data is the strongest argument available for keeping the online version supported, and it has to be collected from the first day rather than reconstructed later.'),

      h('div.stat-grid.mb24', null,
        ui.statCard('Submissions', String(works.length), String(approved.length) + ' published'),
        ui.statCard('Comments written', String(liveComments.length),
          'across ' + WL.plural(withFeedback, 'piece')),
        ui.statCard('Works receiving feedback', coverage + '%',
          (approved.length - withFeedback) + ' still uncovered'),
        ui.statCard('Time to first comment', avgHours < 48 ? avgHours.toFixed(1) + ' h' : (avgHours / 24).toFixed(1) + ' d',
          'Average, published to first response'),
        ui.statCard('Active reviewers', String(activeReviewers), 'Commented in the last 60 days')
      ),

      h('div.split-2', null,
        h('div.stack', null,
          ui.card(h('h3', null, 'Submissions and comments by month'),
            h('div', null,
              h('div.bars', null, months.map(function (m) {
                return h('div.b', null,
                  h('div.vv', null, String(subByMonth[m])),
                  h('div.fill', { style: 'height:' + Math.round(100 * subByMonth[m] / maxBar) + '%' }),
                  h('div.lb', null, monthLabel(m)));
              })),
              h('div.legend', null,
                h('span', null, h('i', { style: 'background:#1890ff' }), 'Submissions per month')),
              h('div.divider'),
              h('div.bars', null, months.map(function (m) {
                return h('div.b', null,
                  h('div.vv', null, String(comByMonth[m])),
                  h('div.fill.alt', { style: 'height:' + Math.round(100 * comByMonth[m] / maxBar) + '%' }),
                  h('div.lb', null, monthLabel(m)));
              })),
              h('div.legend', null,
                h('span', null, h('i', { style: 'background:#69c0ff' }), 'Comments per month')))),

          ui.card(h('h3', null, 'Per-reviewer contribution'),
            h('div', null,
              h('p.muted.small', { style: 'line-height:1.7' },
                'For recognition, and for service-hour verification if the school counts it. Average comment length is included because comment count alone rewards “this is good!”.'),
              h('div.mt16'),
              ui.dataTable({
                columns: [
                  {
                    key: 'name', label: 'Reviewer', width: '38%',
                    render: function (r) {
                      var u = WL.user(r.id) || {};
                      return h('div.row', { style: 'align-items:center;gap:10px' },
                        WL.avatar(u.displayName, r.id),
                        h('div', null,
                          h('div.small', null, u.displayName || 'Unknown'),
                          h('div.small.muted', null, WL.roleLabel(u.role))));
                    }
                  },
                  { key: 'n', label: 'Comments', width: '16%', tight: true, render: function (r) { return String(r.n); } },
                  {
                    key: 'avg', label: 'Avg. length', width: '24%', tight: true,
                    render: function (r) {
                      return h('div', null,
                        h('div.small', null, r.avg + ' chars'),
                        h('div.meter.mt8', { style: 'width:110px' },
                          h('span', { style: 'width:' + Math.min(100, Math.round(r.avg / 6)) + '%' })));
                    }
                  },
                  { key: 'last', label: 'Last comment', width: '22%', tight: true, render: function (r) { return h('span.small.muted', null, WL.fmtAgo(r.last)); } }
                ],
                rows: reviewerRows, paginate: false,
                emptyTitle: 'No comments yet'
              })))
        ),

        h('div.stack', null,
          ui.card(h('h3', null, 'Published work by genre'),
            h('div', null, genreRows.map(function (g) {
              return h('div', { style: 'margin-bottom:14px' },
                h('div.spread', { style: 'margin-bottom:6px' },
                  h('span.small', null, g.genre),
                  h('span.small.muted', null, String(g.n))),
                h('div.meter', null, h('span', { style: 'width:' + Math.round(100 * g.n / maxGenre) + '%' })));
            }))),

          ui.card(h('h3', null, 'Moderation load'),
            h('div', null,
              h('dl.desc', null,
                h('dt', null, 'In the queue now'),
                h('dd', null, String(WL.queueCount())),
                h('dt', null, 'Screening flags raised'),
                h('dd', null, String(S.flags.length)),
                h('dt', null, 'High severity'),
                h('dd', null, String(S.flags.filter(function (f) { return f.severity === 'high'; }).length)),
                h('dt', null, 'Cleared as false positives'),
                h('dd', null, String(S.flags.filter(function (f) { return f.resolved; }).length)),
                h('dt', null, 'Submissions denied'),
                h('dd', null, String(works.filter(function (w) { return w.status === 'denied'; }).length)),
                h('dt', null, 'Comments removed'),
                h('dd', null, String(S.comments.filter(function (c) { return c.deletedAt; }).length)),
                h('dt', null, 'Comment reports'),
                h('dd', null, String(S.commentReports.length))))),

          ui.card(h('h3', null, 'Accounts'),
            h('div', null,
              h('dl.desc', null,
                h('dt', null, 'Total accounts'), h('dd', null, String(S.users.length)),
                h('dt', null, 'Approved reviewers'),
                h('dd', null, String(S.users.filter(function (u) { return u.reviewerStatus === 'approved'; }).length)),
                h('dt', null, 'Officer administrators'),
                h('dd', null, String(S.users.filter(function (u) { return u.role === 'officer_admin'; }).length)),
                h('dt', null, 'Teacher advisors'),
                h('dd', null, String(S.users.filter(function (u) { return u.role === 'teacher_advisor'; }).length)),
                h('dt', null, 'Suspended'),
                h('dd', null, String(S.users.filter(function (u) { return u.suspendedAt; }).length)))))
        )
      )
    );
  };
})(window.WL);
