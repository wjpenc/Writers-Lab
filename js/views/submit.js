/* ============================================================
   views/submit.js - upload flow (spec 2.1-2.3, 3.1)
   Four steps: consent, file, details, processing.
   ============================================================ */
window.WL = window.WL || {}; WL.views = WL.views || {};

(function (WL) {
  'use strict';
  var h = WL.h, ui = WL.ui, icon = WL.icon, A = WL.actions;

  var f = null;

  function fresh() {
    return {
      step: 1, file: null, inspection: null, inspecting: false,
      body: '', title: '', description: '', genre: '', focus: 'General impressions',
      tags: [], consent: { visible: false, ownership: false, moderation: false, withdraw: false },
      processing: null, result: null, errors: []
    };
  }

  function go(n) { f.step = n; WL.render(); window.scrollTo(0, 0); }

  /* ---------------- Step chrome ---------------- */

  function steps(current) {
    var labels = ['Consent', 'Your writing', 'Details', 'Processing'];
    return h('div.steps', null, labels.map(function (l, i) {
      var n = i + 1;
      return h('div.step' + (n === current ? '.on' : n < current ? '.done' : ''), null,
        h('span.num', null, n < current ? '✓' : String(n)),
        h('span.tt', null, l),
        i < labels.length - 1 ? h('span.line') : null
      );
    }));
  }

  /* ---------------- Step 1: consent ---------------- */

  function stepConsent() {
    var c = f.consent;
    var items = [
      ['visible', 'I understand that my work will be visible to other users of the Writers Lab once it is approved, and that approved peer reviewers will be able to leave written feedback on it.'],
      ['ownership', 'I understand that I keep ownership of my writing. Submitting it here does not give the school or the club any right to publish it elsewhere.'],
      ['moderation', 'I understand that every submission is reviewed by an officer administrator or the faculty advisor before it is published, and that it may be denied or returned to me for changes.'],
      ['withdraw', 'I understand that I can withdraw my work at any time, and that I can request permanent deletion under the retention policy.']
    ];
    var allChecked = items.every(function (it) { return c[it[0]]; });

    return h('div.stack', null,
      ui.card(h('h3', null, 'Before your first submission'),
        h('div', null,
          h('p', { style: 'font-size:15px;line-height:1.8' },
            'This screen appears once. Read it and tick each line — the four points below are the whole agreement.'),
          h('div.mt24'),
          items.map(function (it) {
            var id = 'cs_' + it[0];
            return h('label.checkline', { for: id },
              h('input', {
                type: 'checkbox', id: id, checked: c[it[0]],
                onchange: function (e) { c[it[0]] = e.target.checked; WL.render(); }
              }),
              h('span', null, it[1]));
          }),
          h('div.mt24'),
          ui.alert('warn', h('div', null,
            h('b', null, 'One thing the system cannot do for you. '),
            'Uploading removes hidden file metadata — your name is written into a Word document automatically, whether or not you put it there. ',
            'It cannot remove your name if you have typed it into the body of the document, into a header, or into a footer. Check those yourself.')),
          h('div.mt16'),
          h('p.small.muted', null,
            'By continuing you also accept the ',
            h('button.btn-link', { type: 'button', onclick: function () { location.hash = '#/terms'; } }, 'terms of use'),
            ' and the ',
            h('button.btn-link', { type: 'button', onclick: function () { location.hash = '#/privacy'; } }, 'privacy policy'),
            '.')
        )),
      h('div.btn-row', null,
        h('button.btn.btn-primary.btn-lg', {
          type: 'button', disabled: !allChecked,
          onclick: function () { A.giveConsent(); go(2); }
        }, 'I agree — continue')
      )
    );
  }

  /* ---------------- Step 2: the writing ---------------- */

  function inspectionReport(r) {
    if (!r) return null;
    var rows = [];

    function line(ok, label, detail) {
      return h('div.scan-line', null,
        h('span.st', { style: 'color:' + (ok === true ? '#52c41a' : ok === false ? '#f5222d' : '#faad14') },
          icon(ok === true ? 'checkCircle' : ok === false ? 'xCircle' : 'warn', 16)),
        h('span.lb', null, label),
        detail ? h('span.rs', null, detail) : null);
    }

    rows.push(line(r.errors.length === 0, 'File type accepted', '.' + r.extension));
    rows.push(line(r.magic && ['zip', 'pdf'].indexOf(r.magic.kind) !== -1,
      'Format verified from file contents, not the extension',
      r.magic ? r.magic.note.split('—')[0].trim() : ''));
    rows.push(line(r.sizeBytes <= 25 * 1048576, 'Within the size limit', WL.fmtBytes(r.sizeBytes)));
    rows.push(line(!r.hasMacros, r.hasMacros ? 'Macro project found — rejected' : 'No macro project found',
      r.hasMacros ? 'vbaProject.bin' : ''));
    rows.push(line(true, 'Malware scan', 'clean (simulated)'));

    return h('div', null,
      h('div', null, rows),
      r.errors.length ? h('div.mt16', null, ui.alert('error', h('div', null,
        h('b', null, 'This file cannot be accepted.'),
        h('ul', null, r.errors.map(function (e) { return h('li', null, e); }))
      ))) : null,

      r.metadataFound.length ? h('div.mt16', null, ui.alert('warn', h('div', null,
        h('b', null, 'Identifying metadata found inside this file. '),
        'These parts were read directly out of the file you just chose. They will be removed from the published copy:',
        h('ul', null, r.metadataFound.map(function (m) {
          return h('li', null, h('span.mono', null, m.part), ' — ' + m.what);
        }))
      ))) : (r.ok && r.parts.length ? h('div.mt16', null,
        ui.alert('ok', 'No document-property parts found in this file.')) : null),

      r.warnings.length ? h('div.mt16', null, ui.alert('info', h('div', null,
        h('ul', { style: 'margin:0;padding-left:20px' }, r.warnings.map(function (wn) { return h('li', null, wn); }))
      ))) : null,

      r.parts.length ? h('details.mt16', null,
        h('summary', { style: 'cursor:pointer;font-size:13px;color:#8c8c8c' },
          'Show the ' + r.parts.length + ' parts found inside the file'),
        h('div.mono.mt8', { style: 'max-height:190px;overflow:auto;background:#fafafa;border:1px solid #f0f0f0;padding:12px;border-radius:4px' },
          r.parts.map(function (p) { return h('div', null, p); }))
      ) : null
    );
  }

  function stepFile() {
    var fileInput = h('input', {
      type: 'file', accept: '.docx,.pptx,.pdf', style: 'display:none',
      'aria-label': 'Choose a .docx, .pptx or .pdf file to submit',
      onchange: function (e) { handleFile(e.target.files[0]); }
    });

    function handleFile(file) {
      if (!file) return;
      f.file = file; f.inspecting = true; f.inspection = null; WL.render();
      WL.fileinspect.inspect(file, WL.store.state.settings.maxFileSizeMB).then(function (r) {
        f.inspecting = false; f.inspection = r;
        if (!f.title) f.title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
        WL.render();
      });
    }

    var dz = h('div.dropzone', {
      role: 'button', tabindex: '0',
      onclick: function () { fileInput.click(); },
      onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } },
      ondragover: function (e) { e.preventDefault(); dz.classList.add('drag'); },
      ondragleave: function () { dz.classList.remove('drag'); },
      ondrop: function (e) { e.preventDefault(); dz.classList.remove('drag'); handleFile(e.dataTransfer.files[0]); }
    },
      h('div', { style: 'color:#1890ff' }, icon('upload', 34, { w: 1.4 })),
      h('div.big', null, 'Choose a file or drag it here'),
      h('div.sm', null, '.docx, .pptx or .pdf only — up to ' + WL.store.state.settings.maxFileSizeMB + ' MB.'),
      h('div.sm', null, 'Legacy .doc/.ppt and every macro-enabled format are rejected: they can carry executable code.'),
      fileInput
    );

    var bodyTa = h('textarea.input', {
      rows: 9, value: f.body,
      placeholder: 'Paste the text of your piece here…',
      oninput: function (e) { f.body = e.target.value; }
    });

    var canContinue = (f.inspection && f.inspection.ok) || f.body.trim().length > 40;

    return h('div.stack', null,
      ui.card(h('h3', null, 'Upload your file'),
        h('div', null,
          f.file ? h('div.stack', null,
            h('div.filelist', null,
              h('span', { style: 'color:#1890ff' }, icon('file', 18)),
              h('span.nm', null, f.file.name),
              h('span.small.muted', null, WL.fmtBytes(f.file.size)),
              h('button.btn.btn-sm', {
                type: 'button',
                onclick: function () { f.file = null; f.inspection = null; WL.render(); }
              }, 'Remove')),
            f.inspecting
              ? h('div.row', { style: 'align-items:center;gap:10px;padding:14px 0' },
                  h('span.spin'), h('span.muted', null, 'Reading the file…'))
              : inspectionReport(f.inspection)
          ) : dz
        )),

      ui.card(h('div.spread.grow', null,
        h('h3', null, 'Text for preview and screening'),
        ui.tag('Prototype', 'purple')),
        h('div', null,
          h('p.muted', { style: 'line-height:1.75' },
            'The production system extracts text from the uploaded file on the server before screening it. ' +
            'This prototype runs in your browser, so paste the text of your piece here — the in-browser preview and ' +
            'the automated content screening both run on what you paste.'),
          bodyTa,
          h('div.hint', null, 'You can also submit text only, with no file at all.')
        )),

      h('div.btn-row', null,
        h('button.btn', { type: 'button', onclick: function () { go(1); } }, 'Back'),
        h('button.btn.btn-primary.btn-lg', {
          type: 'button', disabled: !canContinue,
          onclick: function () { go(3); }
        }, 'Continue to details')
      )
    );
  }

  /* ---------------- Step 3: details ---------------- */

  function stepDetails() {
    var S = WL.store.state;

    var titleIn = h('input.input', {
      type: 'text', value: f.title, placeholder: 'The title readers will see',
      oninput: function (e) { f.title = e.target.value; }
    });
    var descIn = h('textarea.input', {
      rows: 3, value: f.description,
      placeholder: 'Anything a reviewer should know before reading — where you are stuck, what stage this is at…',
      oninput: function (e) { f.description = e.target.value; }
    });

    var genreSel = ui.select(
      [{ value: '', label: 'Choose a genre…' }].concat(WL.GENRES),
      f.genre, function (v) { f.genre = v; }, { label: 'Genre' });

    var focusSel = ui.select(WL.FEEDBACK_FOCUS, f.focus, function (v) { f.focus = v; }, { label: 'Feedback focus' });

    var tagChips = h('div.chips', null, S.tags.map(function (t) {
      var on = f.tags.indexOf(t) !== -1;
      return h('button.chip', {
        type: 'button', 'aria-pressed': on ? 'true' : 'false',
        onclick: function () {
          if (on) f.tags = f.tags.filter(function (x) { return x !== t; });
          else f.tags = f.tags.concat([t]);
          WL.render();
        }
      }, t);
    }));

    return h('div.stack', null,
      ui.card(h('h3', null, 'Submission details'),
        h('div', null,
          ui.field('Title', titleIn, null, true),
          ui.field('Context for reviewers', descIn,
            'Optional, but pieces with a note here get noticeably more useful feedback.'),
          h('div.field-row', null,
            ui.field('Genre', genreSel, null, true),
            ui.field('What kind of feedback do you want?', focusSel,
              'Reviewers see this at the top of the feedback form.')),
          h('div.field', null,
            h('label.lbl', null, 'Tags'),
            tagChips,
            h('div.hint', null,
              'Chosen from a list the administrators maintain. A free-text tag field turns into three hundred spellings of “rough draft” by December.'))
        )),
      h('div.btn-row', null,
        h('button.btn', { type: 'button', onclick: function () { go(2); } }, 'Back'),
        h('button.btn.btn-primary.btn-lg', {
          type: 'button',
          onclick: function () {
            var errs = [];
            if (!f.title.trim()) errs.push('a title');
            if (!f.genre) errs.push('a genre');
            if (errs.length) { ui.toast('Please add ' + errs.join(' and ') + '.', 'warn'); return; }
            runProcessing();
          }
        }, 'Submit for review')
      )
    );
  }

  /* ---------------- Step 4: processing ---------------- */

  function runProcessing() {
    var S = WL.store.state;
    f.step = 4;
    f.processing = { done: [], current: 0 };
    f.result = null;
    WL.render();
    window.scrollTo(0, 0);

    var pipeline = [
      { label: 'Validating file type from magic bytes', detail: f.inspection ? (f.inspection.magic ? f.inspection.magic.kind.toUpperCase() : 'text only') : 'text only' },
      { label: 'Scanning for malware', detail: 'clean' },
      { label: 'Stripping document properties and revision history',
        detail: (f.inspection && f.inspection.strippedMetadata.length)
          ? f.inspection.strippedMetadata.length + ' part(s) removed' : 'nothing to remove' },
      { label: 'Renaming file to a generated identifier', detail: 'original name discarded' },
      { label: S.settings.convertToPdf ? 'Converting to PDF for the published copy' : 'Preparing the published copy', detail: 'normalised' },
      { label: 'Extracting text for automated screening', detail: (f.body.trim().length || 0) + ' characters' },
      { label: 'Running content safety classification', detail: 'complete' }
    ];

    var i = 0;
    function tick() {
      if (i < pipeline.length) {
        f.processing.done.push(pipeline[i]);
        f.processing.current = ++i;
        WL.render();
        setTimeout(tick, 340);
      } else {
        finish();
      }
    }
    setTimeout(tick, 200);
  }

  function finish() {
    var S = WL.store.state;
    var screenSource = [f.title, f.description, f.body].join('\n\n');
    var findings = WL.screening.screenText(screenSource, S.keywords)
      .concat(WL.screening.screenStructure(f.inspection));

    var created = A.createWork({
      title: f.title.trim(),
      description: f.description.trim(),
      genre: f.genre,
      feedbackFocus: f.focus,
      tags: f.tags,
      body: f.body.trim(),
      fileName: f.file ? f.file.name : (f.title.trim() + '.txt'),
      format: f.file ? WL.fileinspect.ext(f.file.name) : 'txt',
      fileSize: f.file ? f.file.size : f.body.length,
      hasEmbeddedImages: !!(f.inspection && f.inspection.embeddedImageCount),
      strippedMetadata: f.inspection ? f.inspection.strippedMetadata : [],
      flags: findings
    });

    f.result = { work: created, findings: findings };
    WL.render();
    window.scrollTo(0, 0);
  }

  function stepProcessing() {
    if (!f.result) {
      return ui.card(h('h3', null, 'Processing your submission'),
        h('div', null,
          f.processing.done.map(function (p, idx) {
            var isLast = idx === f.processing.done.length - 1 && f.processing.current < 7;
            return h('div.scan-line', null,
              h('span.st', { style: 'color:' + (isLast ? '#1890ff' : '#52c41a') },
                isLast ? h('span.spin') : icon('checkCircle', 16)),
              h('span.lb', null, p.label),
              h('span.rs', null, p.detail));
          })
        ));
    }

    var r = f.result;
    var severity = WL.screening.highest(r.findings);
    var held = r.work.status === 'flagged';

    return h('div.stack', null,
      held
        ? ui.alert('warn', h('div', null,
            h('b', null, 'Submitted, and held for a person to read. '),
            'Automated screening raised ' + WL.plural(r.findings.length, 'flag') +
            ' on this piece. Screening never rejects anything on its own — it only decides what an administrator sees first. ' +
            'Most flags turn out to be ordinary writing.'))
        : ui.alert('ok', h('div', null,
            h('b', null, 'Submitted. '),
            'Your piece is in the review queue. You will be notified when an administrator has looked at it.')),

      ui.card(h('h3', null, 'What happened to your file'),
        h('div', null,
          h('dl.desc', null,
            h('dt', null, 'Status'), h('dd', null, ui.statusTag(r.work.status)),
            h('dt', null, 'Stored under'), h('dd.mono', null, r.work.originalFileKey),
            h('dt', null, 'Published copy'), h('dd.mono', null, r.work.publishedFileKey),
            h('dt', null, 'Original filename'),
            h('dd', null, h('span.mono', null, r.work.originalFileName),
              h('div.hint', null, 'Kept in administrator-only storage. Never served — a filename like “Nguyen_Rough_Draft.docx” defeats anonymity on its own.')),
            h('dt', null, 'Metadata removed'),
            h('dd', null, (r.work.strippedMetadata && r.work.strippedMetadata.length)
              ? h('div', null, r.work.strippedMetadata.map(function (p) { return h('div.mono', null, p); }))
              : h('span.muted', null, 'Nothing found to remove.'))
          )
        )),

      r.findings.length ? ui.card(
        h('div.spread.grow', null, h('h3', null, 'Screening flags'), ui.severityTag(severity)),
        h('div', null, r.findings.map(function (fd) {
          return h('div', { style: 'padding:14px 0;border-bottom:1px solid #f0f0f0' },
            h('div.row.wrap', { style: 'align-items:center;gap:10px;margin-bottom:8px' },
              ui.severityDot(fd.severity), h('b', null, fd.category),
              ui.severityTag(fd.severity), ui.tag(fd.source, 'grey', { plain: true })),
            ui.excerpt(fd.matchedExcerpt, fd.matchedTerms, fd.severity));
        }),
          h('div.hint.mt16', null,
            'An administrator sees exactly this — the category, the severity, and the passage in context — so they do not have to read the whole document to find what was flagged.'))
      ) : null,

      h('div.btn-row', null,
        h('button.btn.btn-primary', {
          type: 'button', onclick: function () { location.hash = '#/mywork'; }
        }, 'Go to my submissions'),
        h('button.btn', {
          type: 'button', onclick: function () { f = fresh(); go(1); }
        }, 'Submit another piece')
      )
    );
  }

  /* ---------------- Page ---------------- */

  WL.views.submit = function () {
    var S = WL.store.state;
    var me = WL.me();
    if (!f) f = fresh();
    if (f.step === 1 && (S.consentGiven[me.id] || !S.settings.requireConsent)) f.step = 2;

    if (me.suspendedAt) {
      return h('div.container.narrow', null,
        h('h1.page-title', null, 'Submit Work'),
        ui.alert('error', h('div', null,
          h('b', null, 'This account is suspended. '),
          'You can still browse approved work. ',
          (me.suspendReason || ''))));
    }

    var content;
    if (f.step === 1) content = stepConsent();
    else if (f.step === 2) content = stepFile();
    else if (f.step === 3) content = stepDetails();
    else content = stepProcessing();

    return h('div.container.mid', null,
      h('h1.page-title.with-sub', null, 'Submit Work'),
      h('p.page-sub', null,
        'Everything you submit is read by an officer administrator or the faculty advisor before anyone else sees it.'),
      steps(f.step),
      content
    );
  };

  WL.views.submit.resetForm = function () { f = fresh(); };
})(window.WL);
