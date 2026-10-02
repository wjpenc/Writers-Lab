/* ============================================================
   store.js - application state, persistence, permissions,
   and every action that mutates data (each one audited).
   ============================================================ */
window.WL = window.WL || {};

(function (WL) {
  'use strict';

  var STORAGE_KEY = 'writers-lab-prototype-v1';
  var listeners = [];
  var state = null;

  /* ---------------- Persistence ---------------- */

  function freshState() {
    return {
      currentUserId: 'u_student',
      users: JSON.parse(JSON.stringify(WL.SEED_USERS)),
      works: JSON.parse(JSON.stringify(WL.SEED_WORKS)),
      flags: JSON.parse(JSON.stringify(WL.SEED_FLAGS)),
      comments: JSON.parse(JSON.stringify(WL.SEED_COMMENTS)),
      commentReports: JSON.parse(JSON.stringify(WL.SEED_COMMENT_REPORTS)),
      applications: JSON.parse(JSON.stringify(WL.SEED_APPLICATIONS)),
      audit: JSON.parse(JSON.stringify(WL.SEED_AUDIT)),
      notifications: JSON.parse(JSON.stringify(WL.SEED_NOTIFICATIONS)),
      claims: JSON.parse(JSON.stringify(WL.SEED_CLAIMS)),
      tags: WL.SEED_TAGS.slice(),
      keywords: WL.SEED_KEYWORDS.slice(),
      settings: JSON.parse(JSON.stringify(WL.SEED_SETTINGS)),
      versions: [
        { id: 'v_01', workId: 'w_03', versionNumber: 1, fileName: 'drive home draft.docx', createdAt: WL.ago(12), note: 'Original submission' },
        { id: 'v_02', workId: 'w_06', versionNumber: 1, fileName: 'commonapp_draft1.docx', createdAt: WL.ago(14), note: 'Original submission' },
        { id: 'v_03', workId: 'w_06', versionNumber: 2, fileName: 'commonapp_draft2.docx', createdAt: WL.ago(7), note: 'Cut 90 words from the opening; kept feedback from version 1.' }
      ],
      // Maya has not submitted before, so the consent screen still shows for
      // her — it is one of the things administrators ask to see.
      consentGiven: { u_reviewer: true, u_officer: true, u_teacher: true },
      pendingTransfer: null,
      seq: 100
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.users && parsed.works) return parsed;
      }
    } catch (e) { /* private mode / file:// - fall through */ }
    return freshState();
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* quota or file:// - the demo still works in memory */ }
  }

  function reset() {
    state = freshState();
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    emit();
  }

  /* ---------------- Pub/sub ---------------- */

  function subscribe(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }
  function emit() { save(); listeners.forEach(function (f) { f(state); }); }

  function nextId(prefix) { state.seq += 1; return prefix + '_' + state.seq; }
  function nowISO() { return new Date().toISOString(); }

  /* ---------------- Lookups ---------------- */

  function me() { return byId(state.users, state.currentUserId); }
  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function user(id) { return byId(state.users, id); }
  function work(id) { return byId(state.works, id); }
  function comment(id) { return byId(state.comments, id); }
  function userName(id) { var u = user(id); return u ? u.displayName : 'Unknown user'; }

  function roleLabel(roleKey) { return (WL.ROLES[roleKey] || {}).label || roleKey; }
  function roleRank(roleKey) { return (WL.ROLES[roleKey] || {}).rank || 0; }

  function effectiveRole(u) {
    // Expired elevated roles fall back to the base student role (spec 1.4)
    if (!u) return 'student';
    if (u.role === 'teacher_advisor') return u.role;
    if (state.settings.roleExpiryEnabled && u.roleExpiresAt &&
        new Date(u.roleExpiresAt).getTime() < Date.now()) return 'student';
    return u.role;
  }

  function workComments(workId) {
    return state.comments.filter(function (c) { return c.workId === workId; });
  }
  function visibleComments(workId) {
    return workComments(workId).filter(function (c) { return !c.heldForApproval || can('moderate'); });
  }
  function workFlags(workId) {
    return state.flags.filter(function (f) { return f.workId === workId; });
  }
  function openFlags(workId) {
    return workFlags(workId).filter(function (f) { return !f.resolved; });
  }

  /* ---------------- Permissions (spec 1.2) ---------------- */

  function can(capability, ctx) {
    var u = me();
    if (!u) return false;
    if (u.suspendedAt) return capability === 'browse';
    var role = effectiveRole(u);
    var rank = roleRank(role);
    var isAdmin = rank >= 3;
    var isTeacher = rank >= 4;

    switch (capability) {
      case 'browse':
      case 'upload':
      case 'reportComment':
      case 'applyReviewer':
        return true;

      case 'comment':
        // Reviewers and administrators may comment on anything.
        // Ordinary students may reply only on their own work.
        if (rank >= 2) return true;
        return !!(ctx && ctx.work && ctx.work.authorUserId === u.id);

      case 'commentAnywhere':
        return rank >= 2;

      case 'moderate':            // approve / deny submissions, clear flags
      case 'reviewApplications':
      case 'deleteComment':
      case 'revokeReviewer':
      case 'manageAccounts':
      case 'viewAudit':
        return isAdmin;

      case 'viewAuthorIdentity':
        if (isTeacher) return true;
        if (rank === 3) return !!state.settings.officersCanSeeAuthors;
        return false;

      case 'grantAdmin':
      case 'transferAdvisor':
      case 'fullSettings':
        return isTeacher;

      case 'limitedSettings':
        return isAdmin;

      case 'viewAnalytics':
        return isAdmin;

      default:
        return false;
    }
  }

  // Can the current viewer see who wrote this work?
  function canSeeAuthorOf(w) {
    if (!w) return false;
    var u = me();
    if (u && w.authorUserId === u.id) return true;
    return can('viewAuthorIdentity');
  }

  function authorLabel(w) {
    if (!w) return '—';
    if (canSeeAuthorOf(w)) {
      var u = user(w.authorUserId);
      var self = me() && w.authorUserId === me().id ? ' (you)' : '';
      return (u ? u.displayName : 'Unknown') + self;
    }
    return 'Anonymous author';
  }

  /* ---------------- Audit & notifications ---------------- */

  function audit(action, targetType, targetId, reason, meta) {
    state.audit.unshift({
      id: nextId('a'), actorUserId: state.currentUserId, action: action,
      targetType: targetType, targetId: targetId, reason: reason || null,
      metadata: meta || null, createdAt: nowISO()
    });
  }

  function notify(userId, type, title, body, link) {
    if (!userId) return;
    state.notifications.unshift({
      id: nextId('n'), userId: userId, type: type, title: title,
      body: body, link: link || null, createdAt: nowISO(), readAt: null
    });
  }

  function notifyAdmins(type, title, body, link, settingKey) {
    if (settingKey && !state.settings[settingKey]) return;
    state.users.forEach(function (u) {
      if (roleRank(u.role) >= 3 && !u.suspendedAt) notify(u.id, type, title, body, link);
    });
  }

  function unreadCount(userId) {
    return state.notifications.filter(function (n) { return n.userId === userId && !n.readAt; }).length;
  }

  /* ---------------- Queue counts for nav badges ---------------- */

  function queueCount() {
    return state.works.filter(function (w) {
      return w.status === 'pending' || w.status === 'flagged';
    }).length;
  }
  function applicationCount() {
    return state.applications.filter(function (a) { return a.status === 'pending'; }).length;
  }
  function reportCount() {
    return state.commentReports.filter(function (r) { return r.status === 'open'; }).length;
  }

  /* ============================================================
     ACTIONS
     ============================================================ */

  var A = {};

  A.switchAccount = function (userId) {
    state.currentUserId = userId;
    var u = user(userId);
    if (u) u.lastActiveAt = nowISO();
    emit();
  };

  /* ----- Submissions ----- */

  A.createWork = function (data) {
    var u = me();
    var id = nextId('w');
    var flags = data.flags || [];
    var hasBlocking = flags.some(function (f) { return f.severity === 'high' || f.severity === 'medium'; });

    var w = {
      id: id, authorUserId: u.id, title: data.title, description: data.description || '',
      genre: data.genre, tags: data.tags || [], feedbackFocus: data.feedbackFocus || 'General impressions',
      status: hasBlocking ? 'flagged' : 'pending',
      createdAt: nowISO(), moderatedAt: null, moderatedBy: null, withdrawnAt: null,
      originalFileName: data.fileName || (data.title + '.txt'),
      format: data.format || 'txt', fileSize: data.fileSize || (data.body || '').length,
      body: data.body || '', hasEmbeddedImages: !!data.hasEmbeddedImages,
      strippedMetadata: data.strippedMetadata || [],
      publishedFileKey: 'pub_' + id + (state.settings.convertToPdf ? '.pdf' : '.' + (data.format || 'txt')),
      originalFileKey: 'orig_' + id + '.' + (data.format || 'txt')
    };
    state.works.unshift(w);

    flags.forEach(function (f) {
      state.flags.unshift({
        id: nextId('f'), workId: id, category: f.category, severity: f.severity,
        source: f.source, matchedExcerpt: f.matchedExcerpt, matchedTerms: f.matchedTerms || [],
        createdAt: nowISO(), resolved: false
      });
    });

    state.versions.push({
      id: nextId('v'), workId: id, versionNumber: 1,
      fileName: w.originalFileName, createdAt: nowISO(), note: 'Original submission'
    });

    audit('work.submit', 'work', id, null);
    notifyAdmins('work.new', 'New submission awaiting review', '"' + w.title + '" entered the queue.', '#/queue', 'notifyAdminNewSubmission');
    if (flags.some(function (f) { return f.severity === 'high'; })) {
      notifyAdmins('flag.high', 'High-severity flag raised', '"' + w.title + '" was held from publication pending review.', '#/queue', 'notifyAdminHighSeverity');
    }
    emit();
    return w;
  };

  A.approveWork = function (workId, note) {
    var w = work(workId); if (!w) return;
    w.status = 'approved'; w.moderatedAt = nowISO(); w.moderatedBy = state.currentUserId;
    w.denialReason = null;
    openFlags(workId).forEach(function (f) {
      f.resolved = true; f.resolvedBy = state.currentUserId; f.resolvedAt = nowISO();
      f.resolveNote = note || 'Cleared on approval.';
    });
    audit('work.approve', 'work', workId, note || null);
    notify(w.authorUserId, 'work.approved', 'Your submission was approved',
      '"' + w.title + '" is now visible to other users.', '#/work/' + workId);
    emit();
  };

  A.denyWork = function (workId, reason) {
    var w = work(workId); if (!w) return;
    w.status = 'denied'; w.moderatedAt = nowISO(); w.moderatedBy = state.currentUserId;
    w.denialReason = reason;
    audit('work.deny', 'work', workId, reason);
    notify(w.authorUserId, 'work.denied', 'Your submission was not approved',
      '"' + w.title + '" — reason: ' + reason, '#/mywork');
    emit();
  };

  A.requestChanges = function (workId, reason) {
    var w = work(workId); if (!w) return;
    w.status = 'changes_requested'; w.moderatedAt = nowISO(); w.moderatedBy = state.currentUserId;
    w.denialReason = reason;
    audit('work.request_changes', 'work', workId, reason);
    notify(w.authorUserId, 'work.changes', 'Changes requested on your submission',
      '"' + w.title + '" — ' + reason, '#/mywork');
    emit();
  };

  A.clearFlag = function (flagId, note) {
    var f = byId(state.flags, flagId); if (!f) return;
    f.resolved = true; f.resolvedBy = state.currentUserId; f.resolvedAt = nowISO(); f.resolveNote = note;
    audit('flag.clear', 'work', f.workId, note);
    emit();
  };

  A.withdrawWork = function (workId) {
    var w = work(workId); if (!w) return;
    w.status = 'withdrawn'; w.withdrawnAt = nowISO();
    audit('work.withdraw', 'work', workId, null);
    emit();
  };

  A.restoreWork = function (workId) {
    var w = work(workId); if (!w) return;
    w.status = 'pending'; w.withdrawnAt = null; w.moderatedAt = null; w.moderatedBy = null;
    audit('work.resubmit', 'work', workId, 'Author restored a withdrawn submission to the queue.');
    notifyAdmins('work.new', 'Resubmitted work awaiting review', '"' + w.title + '" was returned to the queue.', '#/queue', 'notifyAdminNewSubmission');
    emit();
  };

  A.requestDeletion = function (workId, reason) {
    var w = work(workId); if (!w) return;
    w.status = 'withdrawn'; w.withdrawnAt = w.withdrawnAt || nowISO();
    w.deletionRequestedAt = nowISO(); w.deletionReason = reason || null;
    audit('work.deletion_requested', 'work', workId, reason || null);
    notifyAdmins('work.deletion', 'Deletion request received',
      'An author requested permanent deletion of a submission. Retention policy applies.', '#/queue', 'notifyAdminNewSubmission');
    emit();
  };

  A.addVersion = function (workId, data) {
    var w = work(workId); if (!w) return;
    var existing = state.versions.filter(function (v) { return v.workId === workId; });
    state.versions.push({
      id: nextId('v'), workId: workId, versionNumber: existing.length + 1,
      fileName: data.fileName, createdAt: nowISO(),
      note: data.keepFeedback ? 'Revision — feedback on the earlier version kept.' : 'Revision — earlier feedback discarded by the author.'
    });
    if (data.body) w.body = data.body;
    if (data.fileName) w.originalFileName = data.fileName;
    if (!data.keepFeedback) {
      state.comments.forEach(function (c) {
        if (c.workId === workId && !c.deletedAt) { c.archivedVersion = true; }
      });
    }
    w.status = 'pending'; w.moderatedAt = null; w.moderatedBy = null; w.denialReason = null;
    audit('work.new_version', 'work', workId, data.keepFeedback ? 'Feedback retained.' : 'Feedback discarded.');
    notifyAdmins('work.new', 'Revised submission awaiting review', '"' + w.title + '" has a new version in the queue.', '#/queue', 'notifyAdminNewSubmission');
    emit();
  };

  /* ----- Comments ----- */

  A.addComment = function (workId, body, parentCommentId) {
    var u = me(); var w = work(workId); if (!w) return;
    var role = effectiveRole(u);
    var priorCount = state.comments.filter(function (c) {
      return c.authorUserId === u.id && !c.deletedAt;
    }).length;
    var onProbation = state.settings.probationaryComments && role === 'reviewer' &&
      priorCount < state.settings.probationCommentCount && u.reviewerSince &&
      WL.daysBetween(u.reviewerSince, nowISO()) < 400;

    var c = {
      id: nextId('c'), workId: workId, authorUserId: u.id, authorRoleAtTime: role,
      parentCommentId: parentCommentId || null, body: body,
      createdAt: nowISO(), editedAt: null, deletedAt: null,
      heldForApproval: !!onProbation
    };
    state.comments.push(c);
    audit('comment.create', 'comment', c.id, null);
    if (!onProbation && w.authorUserId !== u.id) {
      notify(w.authorUserId, 'comment.new', 'New feedback on "' + w.title + '"',
        roleLabel(role) + ' left a comment on your submission.', '#/work/' + workId);
    }
    if (onProbation) {
      notifyAdmins('comment.probation', 'Probationary comment awaiting approval',
        'A newly approved reviewer left a comment that is held for review.', '#/reports', 'notifyAdminCommentReported');
    }
    emit();
    return c;
  };

  A.editComment = function (commentId, body) {
    var c = comment(commentId); if (!c) return;
    c.editHistory = c.editHistory || [];
    c.editHistory.push({ body: c.body, at: nowISO() });
    c.body = body; c.editedAt = nowISO();
    audit('comment.edit', 'comment', commentId, null);
    emit();
  };

  A.approveHeldComment = function (commentId) {
    var c = comment(commentId); if (!c) return;
    c.heldForApproval = false;
    audit('comment.approve', 'comment', commentId, 'Probationary comment released.');
    var w = work(c.workId);
    if (w) notify(w.authorUserId, 'comment.new', 'New feedback on "' + w.title + '"',
      'A peer reviewer left a comment on your submission.', '#/work/' + c.workId);
    emit();
  };

  A.deleteComment = function (commentId, reason) {
    var c = comment(commentId); if (!c) return;
    c.deletedAt = nowISO(); c.deletedBy = state.currentUserId; c.deleteReason = reason;
    c.originalBody = c.body; c.body = '[removed]';
    audit('comment.delete', 'comment', commentId, reason);
    notify(c.authorUserId, 'comment.deleted', 'A comment you wrote was removed',
      'Reason given: ' + reason, '#/notifications');
    emit();
  };

  A.reportComment = function (commentId, reason) {
    var c = comment(commentId); if (!c) return;
    state.commentReports.unshift({
      id: nextId('cr'), commentId: commentId, reporterUserId: state.currentUserId,
      reason: reason, status: 'open', createdAt: nowISO(), resolvedBy: null, resolvedAt: null
    });
    audit('comment.report', 'comment', commentId, reason);
    notifyAdmins('comment.reported', 'A comment was reported',
      'Reason given: ' + WL.truncate(reason, 90), '#/reports', 'notifyAdminCommentReported');
    notify(state.currentUserId, 'report.received', 'Your report was received',
      'An administrator will review the comment you reported.', '#/notifications');
    emit();
  };

  A.resolveReport = function (reportId, resolution) {
    var r = byId(state.commentReports, reportId); if (!r) return;
    r.status = 'resolved'; r.resolvedBy = state.currentUserId; r.resolvedAt = nowISO(); r.resolution = resolution;
    audit('report.resolve', 'comment', r.commentId, resolution);
    notify(r.reporterUserId, 'report.resolved', 'Your report was resolved', resolution, '#/notifications');
    emit();
  };

  /* ----- Reviewer applications ----- */

  A.submitApplication = function (data) {
    var u = me();
    state.applications.unshift({
      id: nextId('ra'), userId: u.id, status: 'pending', createdAt: nowISO(),
      gradeLevel: u.gradeLevel, englishCourse: data.englishCourse,
      teacherReference: data.teacherReference || null, statement: data.statement
    });
    u.reviewerStatus = 'pending';
    audit('application.submit', 'user', u.id, null);
    notifyAdmins('application.new', 'New reviewer application',
      u.gradeLevel ? ('A grade ' + u.gradeLevel + ' student applied to be a peer reviewer.') : 'A new reviewer application arrived.',
      '#/applications', 'notifyAdminNewApplication');
    emit();
  };

  A.decideApplication = function (appId, decision, reason) {
    var a = byId(state.applications, appId); if (!a) return;
    a.status = decision; a.decidedAt = nowISO(); a.decidedBy = state.currentUserId; a.decisionReason = reason;
    var u = user(a.userId);
    if (u) {
      if (decision === 'approved') {
        u.role = roleRank(u.role) >= 2 ? u.role : 'reviewer';
        u.reviewerStatus = 'approved';
        u.reviewerSince = nowISO();
        u.roleExpiresAt = state.settings.roleExpiresOn;
      } else {
        u.reviewerStatus = 'rejected';
        a.mayReapply = true;
      }
    }
    audit('application.' + (decision === 'approved' ? 'approve' : 'reject'), 'user', a.userId, reason);
    notify(a.userId, 'application.decided',
      decision === 'approved' ? 'Your reviewer application was approved' : 'Your reviewer application was not approved',
      decision === 'approved'
        ? 'You can now leave feedback on any approved submission.'
        : reason + ' You may reapply next semester.',
      '#/notifications');
    emit();
  };

  /* ----- Accounts ----- */

  A.setReviewerStatus = function (userId, grant, reason) {
    var u = user(userId); if (!u) return;
    if (grant) {
      u.reviewerStatus = 'approved';
      if (roleRank(u.role) < 2) u.role = 'reviewer';
      u.reviewerSince = nowISO();
      u.roleExpiresAt = state.settings.roleExpiresOn;
      audit('reviewer.grant', 'user', userId, reason);
      notify(userId, 'role.changed', 'You are now a peer reviewer', reason || 'Granted by an administrator.', '#/notifications');
    } else {
      u.reviewerStatus = 'revoked';
      if (u.role === 'reviewer') u.role = 'student';
      audit('reviewer.revoke', 'user', userId, reason);
      notify(userId, 'role.changed', 'Your reviewer status was revoked', reason || 'Revoked by an administrator.', '#/notifications');
    }
    emit();
  };

  A.setAdminStatus = function (userId, grant, reason) {
    var u = user(userId); if (!u) return;
    if (grant) {
      u.role = 'officer_admin';
      u.reviewerStatus = 'approved';
      u.roleExpiresAt = state.settings.roleExpiresOn;
      audit('admin.grant', 'user', userId, reason);
      notify(userId, 'role.changed', 'You are now an officer administrator', reason || 'Granted by the faculty advisor.', '#/notifications');
    } else {
      u.role = u.reviewerStatus === 'approved' ? 'reviewer' : 'student';
      audit('admin.revoke', 'user', userId, reason);
      notify(userId, 'role.changed', 'Officer administrator status removed', reason || 'Revoked by the faculty advisor.', '#/notifications');
    }
    emit();
  };

  A.setSuspended = function (userId, suspend, reason) {
    var u = user(userId); if (!u) return;
    u.suspendedAt = suspend ? nowISO() : null;
    u.suspendReason = suspend ? reason : null;
    audit(suspend ? 'account.suspend' : 'account.reinstate', 'user', userId, reason);
    notify(userId, 'account.status', suspend ? 'Your account was suspended' : 'Your account was reinstated',
      reason || '', '#/notifications');
    emit();
  };

  A.renewRole = function (userId) {
    var u = user(userId); if (!u) return;
    u.roleExpiresAt = state.settings.roleExpiresOn;
    audit('role.renew', 'user', userId, 'Elevated role re-confirmed for the current school year.');
    notify(userId, 'role.changed', 'Your elevated role was renewed',
      'Re-confirmed through ' + WL.fmtDate(u.roleExpiresAt) + '.', '#/notifications');
    emit();
  };

  A.expireRole = function (userId) {
    var u = user(userId); if (!u) return;
    u.role = 'student'; u.reviewerStatus = 'none'; u.roleExpiresAt = null;
    audit('role.expire', 'user', userId, 'Elevated role allowed to lapse at annual review.');
    notify(userId, 'role.changed', 'Your elevated role has ended',
      'Roles lapse at the end of each school year. You can reapply.', '#/notifications');
    emit();
  };

  /* ----- Advisor transfer (two-step, spec 1.3) ----- */

  A.proposeTransfer = function (toUserId, reason) {
    state.pendingTransfer = {
      fromUserId: state.currentUserId, toUserId: toUserId,
      reason: reason, createdAt: nowISO()
    };
    audit('advisor.transfer_proposed', 'user', toUserId, reason);
    notify(toUserId, 'advisor.transfer', 'You have been offered the primary advisor role',
      userName(state.currentUserId) + ' proposed transferring the primary faculty advisor role to you. It does not take effect until you accept.',
      '#/accounts');
    emit();
  };

  A.cancelTransfer = function () {
    if (!state.pendingTransfer) return;
    audit('advisor.transfer_cancelled', 'user', state.pendingTransfer.toUserId, null);
    state.pendingTransfer = null;
    emit();
  };

  A.acceptTransfer = function () {
    var t = state.pendingTransfer; if (!t) return;
    if (t.toUserId !== state.currentUserId) return;
    var from = user(t.fromUserId), to = user(t.toUserId);
    if (from) from.isPrimaryAdvisor = false;
    if (to) { to.isPrimaryAdvisor = true; to.role = 'teacher_advisor'; }
    audit('advisor.transfer_accepted', 'user', t.toUserId, 'Primary advisor role transferred and accepted.');
    notify(t.fromUserId, 'advisor.transfer', 'Primary advisor transfer completed',
      userName(t.toUserId) + ' accepted the primary advisor role.', '#/accounts');
    state.pendingTransfer = null;
    emit();
  };

  // Guard from spec 1.2: never zero primary advisors
  function primaryAdvisorCount() {
    return state.users.filter(function (u) { return u.isPrimaryAdvisor; }).length;
  }

  /* ----- Settings, tags, keywords ----- */

  A.setSetting = function (key, value, reason) {
    state.settings[key] = value;
    audit('settings.change', 'setting', key, reason || ('Set to ' + JSON.stringify(value) + '.'));
    emit();
  };

  A.addTag = function (name) {
    if (!name) return;
    if (state.tags.indexOf(name) === -1) {
      state.tags.push(name);
      audit('settings.tag_add', 'setting', 'tags', 'Added tag "' + name + '" to the controlled vocabulary.');
      emit();
    }
  };

  A.removeTag = function (name) {
    state.tags = state.tags.filter(function (t) { return t !== name; });
    audit('settings.tag_remove', 'setting', 'tags', 'Removed tag "' + name + '" from the controlled vocabulary.');
    emit();
  };

  A.addKeyword = function (word) {
    if (!word) return;
    if (state.keywords.indexOf(word) === -1) {
      state.keywords.push(word);
      audit('settings.keyword_add', 'setting', 'keywords', 'Added "' + word + '" to the school keyword list.');
      emit();
    }
  };

  A.removeKeyword = function (word) {
    state.keywords = state.keywords.filter(function (k) { return k !== word; });
    audit('settings.keyword_remove', 'setting', 'keywords', 'Removed "' + word + '" from the school keyword list.');
    emit();
  };

  /* ----- Claims (soft claim, spec 4.4) ----- */

  A.claimWork = function (workId) {
    var existing = state.claims.filter(function (c) {
      return c.workId === workId && new Date(c.expiresAt).getTime() > Date.now();
    });
    if (existing.length) return false;
    state.claims.push({
      id: nextId('cl'), workId: workId, userId: state.currentUserId,
      createdAt: nowISO(), expiresAt: new Date(Date.now() + 48 * 3600000).toISOString()
    });
    emit();
    return true;
  };

  A.releaseClaim = function (workId) {
    state.claims = state.claims.filter(function (c) {
      return !(c.workId === workId && c.userId === state.currentUserId);
    });
    emit();
  };

  function activeClaim(workId) {
    var list = state.claims.filter(function (c) {
      return c.workId === workId && new Date(c.expiresAt).getTime() > Date.now();
    });
    return list.length ? list[list.length - 1] : null;
  }

  A.markNeedsAttention = function (workId, on) {
    var w = work(workId); if (!w) return;
    w.needsAttention = !!on;
    audit(on ? 'work.prioritise' : 'work.unprioritise', 'work', workId, null);
    emit();
  };

  /* ----- Notifications ----- */

  A.markRead = function (notifId) {
    var n = byId(state.notifications, notifId); if (!n) return;
    n.readAt = nowISO(); emit();
  };
  A.markAllRead = function () {
    state.notifications.forEach(function (n) {
      if (n.userId === state.currentUserId && !n.readAt) n.readAt = nowISO();
    });
    emit();
  };

  A.giveConsent = function () {
    state.consentGiven[state.currentUserId] = true;
    audit('consent.given', 'user', state.currentUserId, 'Accepted the submission terms.');
    emit();
  };

  /* ---------------- Exports ---------------- */

  state = load();

  WL.store = {
    get state() { return state; },
    save: save, reset: reset, subscribe: subscribe, emit: emit,
    nextId: nextId, nowISO: nowISO
  };
  WL.actions = A;
  WL.me = me;
  WL.user = user;
  WL.work = work;
  WL.comment = comment;
  WL.userName = userName;
  WL.byId = byId;
  WL.can = can;
  WL.canSeeAuthorOf = canSeeAuthorOf;
  WL.authorLabel = authorLabel;
  WL.roleLabel = roleLabel;
  WL.roleRank = roleRank;
  WL.effectiveRole = effectiveRole;
  WL.workComments = workComments;
  WL.visibleComments = visibleComments;
  WL.workFlags = workFlags;
  WL.openFlags = openFlags;
  WL.unreadCount = unreadCount;
  WL.queueCount = queueCount;
  WL.applicationCount = applicationCount;
  WL.reportCount = reportCount;
  WL.activeClaim = activeClaim;
  WL.primaryAdvisorCount = primaryAdvisorCount;
})(window.WL);
