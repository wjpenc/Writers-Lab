/* ============================================================
   views/work.js - work detail page (spec 5.2) + comments (4.2/4.3)
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon, A = WL.actions;

  var draft = { body: '', showScaffold: true, editing: null, replyTo: null };

  function downloadPublished(w) {
    var S = WL.store.state;
    var header =
      'WRITERS LAB ONLINE — PUBLISHED COPY\n' +
      '====================================\n' +
      'Title: ' + w.title + '\n' +
      'Genre: ' + w.genre + '\n' +
      'Tags: ' + ((w.tags || []).join(', ') || 'none') + '\n' +
      'Submitted: ' + WL.fmtDate(w.createdAt) + '\n' +
      'Published file key: ' + (w.publishedFileKey || ('pub_' + w.id)) + '\n' +
      'Author: withheld — author identity is stored in the database, never in the file.\n' +
      (S.settings.stripMetadata
        ? 'Document properties, tracked changes and revision history were removed before publication.\n'
        : '') +
      '====================================\n\n';
    WL.downloadText((w.publishedFileKey || ('pub_' + w.id)) + '.txt', header + (w.body || ''));
    ui.toast('Downloaded the published copy. The original file stays in administrator-only storage.');
  }

  /* ---------------- Comment rendering ---------------- */

  function commentEl(c, w, allComments) {
    var S = WL.store.state;
    var me = WL.me();
    var isAdmin = WL.can('moderate');
    var author = WL.user(c.authorUserId);
    var isMine = me && c.authorUserId === me.id;
    var isWorkAuthor = c.authorUserId === w.authorUserId;

    // Comment authors are never anonymous to administrators (spec 3.3).
    // To everyone else, a comment left by the work's own author shows as
    // "Author" so the anonymity of the work is not broken by the reply.
    var nameShown;
    if (isWorkAuthor && !WL.canSeeAuthorOf(w)) nameShown = 'Author (anonymous)';
    else nameShown = author ? author.displayName : 'Unknown';

    var withinEditWindow = isMine && WL.hoursBetween(c.createdAt, new Date().toISOString()) < 24 && !c.deletedAt;

    var reports = S.commentReports.filter(function (r) { return r.commentId === c.id; });
    var openReport = reports.filter(function (r) { return r.status === 'open'; }).length > 0;

    var body;
    if (c.deletedAt) {
      body = h('div.comment-body', null,
        'This comment was removed by an administrator.',
        isAdmin ? h('div.mt8', null,
          ui.alert('warn', h('div', null,
            h('b', null, 'Administrator view. '),
            'Reason recorded: ' + c.deleteReason,
            h('div.mt8.small', null, 'Original text: “' + (c.originalBody || c.body) + '”')
          ))) : null
      );
    } else if (draft.editing === c.id) {
      var ta = h('textarea.input', { rows: 5, value: c.body });
      body = h('div', null, ta, h('div.btn-row.mt8', null,
        h('button.btn.btn-primary.btn-sm', {
          type: 'button',
          onclick: function () {
            if (!ta.value.trim()) return;
            A.editComment(c.id, ta.value.trim());
            draft.editing = null; ui.toast('Comment updated. The full edit history is retained internally.');
          }
        }, 'Save'),
        h('button.btn.btn-sm', { type: 'button', onclick: function () { draft.editing = null; WL.render(); } }, 'Cancel')
      ));
    } else {
      body = h('div.comment-body', null, c.body);
    }

    var actions = [];
    if (!c.deletedAt && draft.editing !== c.id) {
      if (WL.can('comment', { work: w }) && !c.parentCommentId) {
        actions.push(h('button.btn-link', {
          type: 'button',
          onclick: function () { draft.replyTo = draft.replyTo === c.id ? null : c.id; WL.render(); }
        }, 'Reply'));
      }
      if (withinEditWindow) {
        actions.push(h('button.btn-link', {
          type: 'button', onclick: function () { draft.editing = c.id; WL.render(); }
        }, 'Edit'));
      }
      if (!isMine) {
        actions.push(h('button.btn-link', {
          type: 'button',
          onclick: function () {
            ui.reasonModal({
              title: 'Report this comment',
              intro: 'Reports go to the officer administrators and the faculty advisor. Comment authors are never anonymous to them.',
              label: 'Why are you reporting this comment?',
              confirmLabel: 'Submit report',
              onConfirm: function (reason) {
                A.reportComment(c.id, reason);
                ui.toast('Report submitted. You will be notified when it is resolved.');
              }
            });
          }
        }, 'Report'));
      }
      if (isAdmin) {
        actions.push(h('button.btn-link.danger', {
          type: 'button',
          onclick: function () {
            ui.reasonModal({
              title: 'Delete this comment',
              danger: true, confirmLabel: 'Delete comment',
              intro: 'The comment is soft-deleted. The original text and this reason stay in the audit log.',
              label: 'Reason for deletion',
              onConfirm: function (reason) { A.deleteComment(c.id, reason); ui.toast('Comment removed and logged.'); }
            });
          }
        }, 'Delete'));
        if (WL.roleRank(author && author.role) >= 2 && author && author.reviewerStatus === 'approved') {
          actions.push(h('button.btn-link.danger', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Revoke reviewer status', danger: true, confirmLabel: 'Revoke status',
                intro: 'Removes ' + author.displayName + '’s ability to comment on other students’ work.',
                label: 'Reason',
                onConfirm: function (reason) { A.setReviewerStatus(author.id, false, reason); ui.toast('Reviewer status revoked.'); }
              });
            }
          }, 'Revoke reviewer'));
        }
      }
    }

    var replies = allComments.filter(function (x) { return x.parentCommentId === c.id; });

    var replyBox = draft.replyTo === c.id ? (function () {
      var ta = h('textarea.input', { rows: 3, placeholder: 'Write a reply…' });
      return h('div.mt16', { style: 'margin-left:34px' },
        ta,
        h('div.btn-row.mt8', null,
          h('button.btn.btn-primary.btn-sm', {
            type: 'button',
            onclick: function () {
              if (!ta.value.trim()) return;
              A.addComment(w.id, ta.value.trim(), c.id);
              draft.replyTo = null; ui.toast('Reply posted.');
            }
          }, 'Post reply'),
          h('button.btn.btn-sm', { type: 'button', onclick: function () { draft.replyTo = null; WL.render(); } }, 'Cancel'))
      );
    })() : null;

    return h('div', null,
      h('div.comment' + (c.deletedAt ? '.removed' : '') + (c.parentCommentId ? '.reply' : ''), null,
        h('div.comment-head', null,
          WL.avatar(nameShown, c.authorUserId),
          h('span.nm', null, nameShown),
          // Role badge uses the role held at the time of writing (spec 1.2)
          ui.roleBadge(c.authorRoleAtTime),
          h('time', { datetime: c.createdAt }, WL.fmtAgo(c.createdAt)),
          c.editedAt ? h('span.small.muted', null, '(edited)') : null,
          c.heldForApproval ? ui.tag('Held for approval', 'gold') : null,
          openReport && WL.can('moderate') ? ui.tag('Reported', 'red') : null,
          c.archivedVersion ? ui.tag('On an earlier version', 'grey') : null
        ),
        body,
        actions.length ? h('div.comment-actions', null, actions) : null
      ),
      replyBox,
      replies.map(function (r) { return commentEl(r, w, allComments); })
    );
  }

  /* ---------------- Comment composer ---------------- */

  function composer(w) {
    var S = WL.store.state;
    var me = WL.me();
    var canComment = WL.can('comment', { work: w });

    if (!canComment) {
      return ui.alert('info', h('div', null,
        h('b', null, 'You can read feedback here, but not leave it. '),
        'Only approved peer reviewers and administrators may comment on another student’s work. ',
        h('button.btn-link', {
          type: 'button', onclick: function () { location.hash = '#/apply'; }
        }, 'Apply to become a peer reviewer'),
        '.'
      ));
    }

    if (!WL.can('commentAnywhere') && w.authorUserId === me.id) {
      // author replying on their own work
    }

    var ta = h('textarea.input', {
      rows: 6,
      placeholder: 'Write feedback for this writer…',
      'aria-label': 'Write feedback'
    });

    var counter = h('div.hint', null, '0 characters. Aim for at least ' + S.settings.minCommentLength + '.');
    ta.addEventListener('input', function () {
      var n = ta.value.trim().length;
      counter.textContent = n + ' character' + (n === 1 ? '' : 's') +
        (n < S.settings.minCommentLength
          ? '. Aim for at least ' + S.settings.minCommentLength + ' — very short comments are not useful to the writer.'
          : '. Good length.');
      counter.style.color = n && n < S.settings.minCommentLength ? '#d48806' : '';
    });

    var onProbation = S.settings.probationaryComments &&
      WL.effectiveRole(me) === 'reviewer' &&
      me.reviewerSince && WL.daysBetween(me.reviewerSince, new Date().toISOString()) < 400 &&
      S.comments.filter(function (c) { return c.authorUserId === me.id && !c.deletedAt; }).length < S.settings.probationCommentCount;

    return h('div', null,
      S.settings.showFeedbackScaffold ? h('div.rubric', null,
        h('h4', null, 'Feedback scaffold — ' + w.genre),
        h('ol', null,
          h('li', null, 'What is working? Name one specific thing and say why it works.'),
          h('li', null, 'What is unclear? Point at the sentence or paragraph, not the whole piece.'),
          h('li', null, 'One concrete suggestion the writer could act on in the next draft.'),
          w.feedbackFocus ? h('li', null, h('b', null, 'The author asked specifically about: '), w.feedbackFocus) : null
        )
      ) : null,
      ta,
      counter,
      onProbation ? h('div.mt8', null, ui.alert('info',
        'You are within your first ' + S.settings.probationCommentCount +
        ' comments as a new reviewer, so this will be held for an administrator to approve before the author sees it.'
      )) : null,
      h('div.btn-row.mt16', null,
        h('button.btn.btn-primary', {
          type: 'button',
          onclick: function () {
            var v = ta.value.trim();
            if (!v) { ui.toast('Write something first.', 'warn'); return; }
            if (v.length < S.settings.minCommentLength) {
              ui.confirmModal({
                title: 'That is a very short comment',
                body: h('div', null,
                  h('p', null, 'Your comment is ' + v.length + ' characters. Comments under ' +
                    S.settings.minCommentLength + ' characters are usually some version of “this is good!”, which does not give the writer anything to do.'),
                  h('p.muted', null, 'You can post it anyway.')
                ),
                confirmLabel: 'Post it anyway',
                cancelLabel: 'Let me add more',
                onConfirm: function () { A.addComment(w.id, v); ui.toast('Comment posted.'); }
              });
              return;
            }
            A.addComment(w.id, v);
            ui.toast(onProbation ? 'Comment submitted for administrator approval.' : 'Comment posted.');
          }
        }, 'Post feedback')
      )
    );
  }

  /* ---------------- Page ---------------- */

  WL.views.work = function (params) {
    var S = WL.store.state;
    var w = WL.work(params.id);
    if (!w) {
      return h('div.container', null, ui.empty('That submission could not be found',
        'It may have been withdrawn by the author.'));
    }

    var isAdmin = WL.can('moderate');
    var me = WL.me();
    var isOwner = me && w.authorUserId === me.id;

    if (w.status !== 'approved' && !isAdmin && !isOwner) {
      return h('div.container', null,
        ui.breadcrumb([{ label: 'Browse Work', href: '#/browse' }, { label: 'Unavailable' }]),
        ui.empty('This submission is not published',
          'Work is visible only after an administrator approves it.'));
    }

    var comments = WL.workComments(w.id).filter(function (c) {
      return !c.heldForApproval || isAdmin || c.authorUserId === (me && me.id);
    });
    var top = comments.filter(function (c) { return !c.parentCommentId; });
    var flags = WL.workFlags(w.id);
    var versions = S.versions.filter(function (v) { return v.workId === w.id; });
    var claim = WL.activeClaim(w.id);

    var main = h('div.stack', null,
      // ----- meta card -----
      ui.card(
        h('div.grow', null,
          h('div.spread', null,
            h('h2', { style: 'font-size:24px' }, w.title),
            h('div.row', null, ui.statusTag(w.status))
          )
        ),
        h('div', null,
          w.description ? h('p', { style: 'font-size:15px;line-height:1.75' }, w.description) : null,
          h('dl.desc', null,
            h('dt', null, 'Author'),
            h('dd', null,
              WL.canSeeAuthorOf(w)
                ? h('span.row', { style: 'align-items:center;gap:8px' },
                    WL.avatar(WL.userName(w.authorUserId), w.authorUserId),
                    WL.authorLabel(w),
                    isAdmin && !isOwner ? ui.tag('Visible to you by role', 'purple') : null)
                : h('span', null, 'Anonymous ',
                    h('span.small.muted', null,
                      '— author identity is stored in the database and is not present anywhere on this page or in the file you can download.')),
            ),
            h('dt', null, 'Genre'), h('dd', null, ui.tag(w.genre, ui.tagColor(w.genre))),
            h('dt', null, 'Tags'), h('dd', null, ui.tagList(w.tags)),
            h('dt', null, 'Feedback focus'), h('dd', null, w.feedbackFocus || 'General impressions'),
            h('dt', null, 'Submitted'), h('dd', null, WL.fmtDate(w.createdAt) + ' (' + WL.fmtAgo(w.createdAt) + ')'),
            w.moderatedAt ? h('dt', null, 'Reviewed') : null,
            w.moderatedAt ? h('dd', null, WL.fmtDate(w.moderatedAt) +
              (isAdmin ? ' by ' + WL.userName(w.moderatedBy) : '')) : null,
            h('dt', null, 'Feedback received'),
            h('dd', null, WL.plural(top.filter(function (c) { return !c.deletedAt; }).length, 'comment'))
          )
        )
      ),

      // ----- preview -----
      ui.card(
        h('div.spread.grow', null,
          h('h3', null, 'Preview'),
          h('div.btn-row', null,
            h('button.btn', { type: 'button', onclick: function () { downloadPublished(w); } },
              icon('download', 15), 'Download published copy'),
            isAdmin ? h('button.btn', {
              type: 'button',
              onclick: function () {
                ui.modal({
                  title: 'Administrator file access',
                  body: h('div', null,
                    ui.alert('info', h('div', null,
                      h('b', null, 'Two copies are kept. '),
                      'The original retains its metadata for administrative purposes. The published copy is the stripped version everyone else receives.')),
                    h('dl.desc.mt16', null,
                      h('dt', null, 'Original file'), h('dd.mono', null, w.originalFileKey || ('orig_' + w.id)),
                      h('dt', null, 'Original name'), h('dd.mono', null, w.originalFileName),
                      h('dt', null, 'Published file'), h('dd.mono', null, w.publishedFileKey || ('pub_' + w.id)),
                      h('dt', null, 'Size'), h('dd', null, WL.fmtBytes(w.fileSize)),
                      h('dt', null, 'Stripped on upload'),
                      h('dd', null, (w.strippedMetadata && w.strippedMetadata.length)
                        ? h('div', null, w.strippedMetadata.map(function (p) { return h('div.mono', null, p); }))
                        : 'docProps/core.xml, docProps/app.xml')
                    ),
                    h('div.hint.mt16', null,
                      'In production these are served through authenticated, time-limited URLs rather than a guessable storage path.')
                  ),
                  footer: [h('button.btn.btn-primary', { type: 'button', onclick: ui.closeModal }, 'Close')]
                });
              }
            }, icon('lock', 15), 'Original file record') : null
          )
        ),
        h('div', null,
          h('div.preview', null, w.body || '(No text preview available for this file type.)'),
          h('div.hint.mt8', null,
            'Rendered from the published copy. The original ',
            h('span.mono', null, '.' + (w.format || 'docx')),
            ' had its document properties, tracked changes and revision history removed before publication.')
        )
      ),

      // ----- admin: flags -----
      isAdmin && flags.length ? ui.card(
        h('h3', null, 'Content screening record'),
        h('div', null, flags.map(function (f) {
          return h('div', { style: 'padding:14px 0;border-bottom:1px solid #f0f0f0' },
            h('div.row.wrap', { style: 'align-items:center;gap:10px;margin-bottom:8px' },
              ui.severityDot(f.severity),
              h('b', null, f.category),
              ui.severityTag(f.severity),
              ui.tag(f.source, 'grey', { plain: true }),
              f.resolved ? ui.tag('Cleared', 'green') : ui.tag('Open', 'red')
            ),
            ui.excerpt(f.matchedExcerpt, f.matchedTerms, f.severity),
            f.resolved ? h('div.hint.mt8', null,
              'Cleared by ' + WL.userName(f.resolvedBy) + ' on ' + WL.fmtDate(f.resolvedAt) +
              (f.resolveNote ? ' — “' + f.resolveNote + '”' : '')) : null
          );
        }))
      ) : null,

      // ----- versions -----
      versions.length > 1 ? ui.card(
        h('h3', null, 'Version history'),
        h('div', null, versions.slice().reverse().map(function (v) {
          return h('div', { style: 'padding:11px 0;border-bottom:1px solid #f0f0f0' },
            h('div.row', { style: 'align-items:center;gap:10px' },
              ui.tag('Version ' + v.versionNumber, v.versionNumber === versions.length ? 'blue' : 'grey'),
              h('span.small.muted', null, WL.fmtDate(v.createdAt))),
            h('div.small.mt8', null, v.note));
        }))
      ) : null,

      // ----- comments -----
      ui.card(
        h('div.spread.grow', null,
          h('h3', null, 'Feedback (' + top.filter(function (c) { return !c.deletedAt; }).length + ')'),
          claim ? ui.tag(
            claim.userId === (me && me.id) ? 'You claimed this piece' : 'Claimed by a reviewer',
            'cyan') : null
        ),
        h('div', null,
          top.length
            ? top.map(function (c) { return commentEl(c, w, comments); })
            : h('div', { style: 'padding:22px 0' },
                ui.alert('info', 'No feedback yet. Work with no comments is surfaced first in the reviewer queue.')),
          h('div.divider'),
          composer(w)
        )
      )
    );

    /* ----- sidebar ----- */
    var side = h('div.stack', null,
      isAdmin && (w.status === 'pending' || w.status === 'flagged') ? ui.card(
        h('h3', null, 'Moderation'),
        h('div.stack', null,
          h('button.btn.btn-primary', {
            type: 'button', onclick: function () { A.approveWork(w.id); ui.toast('Approved and published.'); }
          }, icon('check', 15), 'Approve and publish'),
          h('button.btn', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Request changes',
                intro: 'Returns the work to the author for revision instead of a flat denial.',
                label: 'What should the author change?', confirmLabel: 'Request changes',
                onConfirm: function (r) { A.requestChanges(w.id, r); ui.toast('Returned to the author.'); }
              });
            }
          }, 'Request changes'),
          h('button.btn.btn-danger', {
            type: 'button',
            onclick: function () {
              ui.reasonModal({
                title: 'Deny this submission', danger: true, confirmLabel: 'Deny submission',
                intro: 'A written reason is required and is sent to the author.',
                label: 'Reason for denial',
                onConfirm: function (r) { A.denyWork(w.id, r); ui.toast('Submission denied. The author was notified.'); }
              });
            }
          }, 'Deny')
        )
      ) : null,

      isOwner ? ui.card(
        h('h3', null, 'Your controls'),
        h('div.stack', null,
          w.status !== 'withdrawn'
            ? h('button.btn', {
                type: 'button',
                onclick: function () {
                  ui.confirmModal({
                    title: 'Withdraw this submission',
                    body: h('div', null,
                      h('p', null, 'It is removed from public view immediately. Feedback already left on it is preserved and stays visible to you.'),
                      h('p.muted', null, 'You can put it back in the queue at any time.')),
                    confirmLabel: 'Withdraw now', danger: true,
                    onConfirm: function () { A.withdrawWork(w.id); ui.toast('Withdrawn. It is no longer visible to others.'); }
                  });
                }
              }, 'Withdraw from public view')
            : h('button.btn.btn-primary', {
                type: 'button', onclick: function () { A.restoreWork(w.id); ui.toast('Returned to the review queue.'); }
              }, 'Put back in the queue'),
          h('button.btn', {
            type: 'button', onclick: function () { location.hash = '#/mywork'; }
          }, 'Upload a revised version')
        )
      ) : null,

      WL.can('commentAnywhere') && !isOwner && w.status === 'approved' ? ui.card(
        h('h3', null, 'Reviewer tools'),
        h('div.stack', null,
          claim && claim.userId === (me && me.id)
            ? h('button.btn', { type: 'button', onclick: function () { A.releaseClaim(w.id); ui.toast('Claim released.'); } },
                'Release my claim')
            : h('button.btn', {
                type: 'button', disabled: !!claim,
                onclick: function () {
                  if (A.claimWork(w.id)) ui.toast('Claimed for 48 hours. Other reviewers will see this piece is being worked on.');
                }
              }, icon('hand', 15), claim ? 'Claimed by someone else' : 'Claim this piece (48h)'),
          isAdmin ? h('button.btn', {
            type: 'button',
            onclick: function () { A.markNeedsAttention(w.id, !w.needsAttention); ui.toast(w.needsAttention ? 'Removed from priority.' : 'Raised in the reviewer queue.'); }
          }, w.needsAttention ? 'Remove priority flag' : 'Mark as needing attention') : null
        )
      ) : null,

      w.denialReason && (isOwner || isAdmin) ? ui.card(
        h('h3', null, w.status === 'denied' ? 'Denial reason' : 'Requested changes'),
        h('div', null, h('p', { style: 'line-height:1.75' }, w.denialReason))
      ) : null,

      ui.card(
        h('h3', null, 'About anonymity'),
        h('div.small', { style: 'line-height:1.8;color:#595959' },
          h('p', null, 'Author names are stored in the database and shown only to roles permitted to see them.'),
          h('p', null, 'The downloadable copy is regenerated from the submission, so document properties and revision history cannot leak a name.'),
          h('p', { style: 'margin:0' }, 'The system cannot remove a name typed into the body of a document, a header or a footer.'))
      )
    );

    return h('div.container', null,
      ui.breadcrumb([{ label: 'Browse Work', href: '#/browse' }, { label: WL.truncate(w.title, 48) }]),
      h('div.split-2', null, main, side)
    );
  };
})(window.WL);
