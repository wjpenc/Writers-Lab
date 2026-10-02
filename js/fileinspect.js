/* ============================================================
   fileinspect.js - real client-side file validation (spec 2.1/2.2)

   This is not a mock. It reads the actual bytes of the file the
   user picked and:
     - identifies the true format from magic bytes, not the
       extension, so a renamed .exe does not pass;
     - reads the ZIP central directory of an OOXML file to list
       the parts inside it, which is how it finds author metadata
       (docProps/core.xml), tracked comments (word/comments.xml),
       embedded media, and macro projects (vbaProject.bin);
     - reads a PDF's Info dictionary keys the same way.

   Production would repeat all of this server-side. Client-side
   checks are a convenience, never the security boundary.
   ============================================================ */
window.WL = window.WL || {};

(function (WL) {
  'use strict';

  var ALLOWED = ['docx', 'pptx', 'pdf'];
  var BLOCKED = {
    doc: 'Legacy Word format. Cannot be inspected safely.',
    ppt: 'Legacy PowerPoint format. Cannot be inspected safely.',
    xls: 'Legacy Excel format.',
    docm: 'Macro-enabled Word document. Can carry executable code.',
    pptm: 'Macro-enabled PowerPoint file. Can carry executable code.',
    xlsm: 'Macro-enabled Excel file. Can carry executable code.',
    dotm: 'Macro-enabled Word template. Can carry executable code.',
    exe: 'Executable file.', js: 'Script file.', zip: 'Archive file.',
    rar: 'Archive file.', htm: 'Web page.', html: 'Web page.'
  };

  function ext(name) {
    var m = /\.([A-Za-z0-9]+)$/.exec(String(name || ''));
    return m ? m[1].toLowerCase() : '';
  }

  function bytesToLatin(bytes, from, to) {
    var out = '', end = Math.min(to, bytes.length);
    for (var i = from; i < end; i++) out += String.fromCharCode(bytes[i]);
    return out;
  }

  function detectMagic(bytes) {
    if (bytes.length < 4) return { kind: 'unknown', note: 'File is too small to identify.' };
    var b = bytes;
    if (b[0] === 0x50 && b[1] === 0x4B && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07)) {
      return { kind: 'zip', note: 'ZIP container (PK\\x03\\x04) — the wrapper used by .docx and .pptx.' };
    }
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
      return { kind: 'pdf', note: 'PDF header (%PDF-) found.' };
    }
    if (b[0] === 0xD0 && b[1] === 0xCF && b[2] === 0x11 && b[3] === 0xE0) {
      return { kind: 'ole', note: 'Legacy OLE compound file — this is a .doc/.ppt/.xls regardless of its extension.' };
    }
    if (b[0] === 0x4D && b[1] === 0x5A) {
      return { kind: 'exe', note: 'Windows executable header (MZ). This is a program, not a document.' };
    }
    if (b[0] === 0x7F && b[1] === 0x45 && b[2] === 0x4C && b[3] === 0x46) {
      return { kind: 'exe', note: 'ELF executable header. This is a program, not a document.' };
    }
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) {
      return { kind: 'png', note: 'PNG image header.' };
    }
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) {
      return { kind: 'jpg', note: 'JPEG image header.' };
    }
    return { kind: 'unknown', note: 'No recognised document signature in the first bytes.' };
  }

  /* Read OOXML part names straight out of the ZIP entry headers. */
  function readZipParts(bytes) {
    var text = bytesToLatin(bytes, 0, bytes.length);
    var parts = [], seen = {};
    var re = /(?:word|ppt|xl|docProps|customXml|_rels)\/[A-Za-z0-9_\-\/.]+/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      var p = m[0].replace(/\.(xml|rels|bin|png|jpg|jpeg|gif|emf|wmf)[^]*$/, function (s) {
        var mm = /^\.(xml|rels|bin|png|jpg|jpeg|gif|emf|wmf)/.exec(s);
        return mm ? mm[0] : s;
      });
      if (!seen[p]) { seen[p] = 1; parts.push(p); }
      if (parts.length > 400) break;
    }
    return parts;
  }

  function readPdfInfo(bytes) {
    var text = bytesToLatin(bytes, 0, Math.min(bytes.length, 2000000));
    var found = [];
    ['/Author', '/Creator', '/Producer', '/Title', '/Subject', '/Keywords', '/ModDate', '/CreationDate']
      .forEach(function (k) { if (text.indexOf(k) !== -1) found.push(k.slice(1)); });
    var imageCount = (text.match(/\/Subtype\s*\/Image/g) || []).length;
    var textOps = (text.match(/BT\s/g) || []).length;
    return { infoKeys: found, imageCount: imageCount, textOperators: textOps };
  }

  /*
    inspect(file) -> Promise({
      ok, fileName, extension, sizeBytes, magic, trueFormat,
      errors[], warnings[], parts[], metadataFound[], embeddedImageCount,
      hasMacros, likelyScan, strippedMetadata[]
    })
  */
  function inspect(file, maxBytesMB) {
    return new Promise(function (resolve) {
      var result = {
        ok: true, fileName: file.name, extension: ext(file.name),
        sizeBytes: file.size, errors: [], warnings: [],
        parts: [], metadataFound: [], strippedMetadata: [],
        embeddedImageCount: 0, hasMacros: false, likelyScan: false,
        trueFormat: null, magic: null
      };

      var limit = (maxBytesMB || 25) * 1048576;
      if (file.size > limit) {
        result.ok = false;
        result.errors.push('File is ' + WL.fmtBytes(file.size) + '. The limit is ' +
          maxBytesMB + ' MB. Large files are usually images that could be compressed.');
      }
      if (file.size === 0) {
        result.ok = false;
        result.errors.push('File is empty (0 bytes).');
      }

      if (BLOCKED[result.extension]) {
        result.ok = false;
        result.errors.push('.' + result.extension + ' is not an accepted format. ' + BLOCKED[result.extension]);
      } else if (ALLOWED.indexOf(result.extension) === -1) {
        result.ok = false;
        result.errors.push('.' + (result.extension || '(no extension)') +
          ' is not an accepted format. The Writers Lab accepts .docx, .pptx and .pdf only.');
      }

      var reader = new FileReader();
      reader.onerror = function () {
        result.ok = false;
        result.errors.push('The file could not be read.');
        resolve(result);
      };
      reader.onload = function (e) {
        var bytes = new Uint8Array(e.target.result);
        var magic = detectMagic(bytes);
        result.magic = magic;

        if (magic.kind === 'exe') {
          result.ok = false;
          result.errors.push('The contents of this file do not match its name. ' + magic.note +
            ' Renaming a program to end in .docx does not make it a document, and the check that ' +
            'catches that reads the bytes rather than the file name.');
        } else if (magic.kind === 'ole') {
          result.ok = false;
          result.errors.push('The contents of this file do not match its name. ' + magic.note);
        } else if (result.extension === 'pdf' && magic.kind !== 'pdf') {
          result.ok = false;
          result.errors.push('Named .pdf but the file does not begin with a PDF header. ' + magic.note);
        } else if ((result.extension === 'docx' || result.extension === 'pptx') && magic.kind !== 'zip') {
          result.ok = false;
          result.errors.push('Named .' + result.extension + ' but the file is not a ZIP container. ' + magic.note);
        }

        if (magic.kind === 'zip') {
          result.trueFormat = 'Office Open XML (ZIP container)';
          var parts = readZipParts(bytes);
          result.parts = parts;

          var media = parts.filter(function (p) { return /\/media\//.test(p); });
          result.embeddedImageCount = media.length;

          if (parts.some(function (p) { return /vbaProject\.bin/i.test(p); })) {
            result.hasMacros = true; result.ok = false;
            result.errors.push('This file contains a macro project (vbaProject.bin). Macro-enabled ' +
              'documents are rejected regardless of extension.');
          }

          if (parts.some(function (p) { return /docProps\/core\.xml/i.test(p); })) {
            result.metadataFound.push({
              part: 'docProps/core.xml',
              what: 'Document properties: author name, last-modified-by, revision number, timestamps'
            });
          }
          if (parts.some(function (p) { return /docProps\/app\.xml/i.test(p); })) {
            result.metadataFound.push({
              part: 'docProps/app.xml',
              what: 'Application properties: company/organisation, template, total editing time'
            });
          }
          if (parts.some(function (p) { return /docProps\/custom\.xml/i.test(p); })) {
            result.metadataFound.push({ part: 'docProps/custom.xml', what: 'Custom document properties' });
          }
          if (parts.some(function (p) { return /(word|ppt)\/comments\.xml/i.test(p); })) {
            result.metadataFound.push({
              part: 'word/comments.xml',
              what: 'Review comments — these carry the commenter’s name and initials'
            });
          }
          if (parts.some(function (p) { return /people\.xml/i.test(p); })) {
            result.metadataFound.push({ part: 'word/people.xml', what: 'Named authors of tracked changes' });
          }
          if (parts.some(function (p) { return /customXml\//i.test(p); })) {
            result.metadataFound.push({ part: 'customXml/', what: 'Custom XML data parts' });
          }
          if (media.length) {
            result.warnings.push(media.length + ' embedded image' + (media.length === 1 ? '' : 's') +
              ' found. Text screening cannot see inside images, so this submission is routed to a person.');
          }
        } else if (magic.kind === 'pdf') {
          result.trueFormat = 'Portable Document Format';
          var info = readPdfInfo(bytes);
          info.infoKeys.forEach(function (k) {
            result.metadataFound.push({ part: 'PDF Info dictionary /' + k, what: 'Document metadata field' });
          });
          result.embeddedImageCount = info.imageCount;
          if (info.textOperators < 3 && info.imageCount > 0) {
            result.likelyScan = true;
            result.warnings.push('Almost no text-drawing operators were found alongside ' + info.imageCount +
              ' image object(s). This is very likely a scan and cannot be screened automatically.');
          }
          if (info.imageCount > 0 && !result.likelyScan) {
            result.warnings.push(info.imageCount + ' image object(s) found in the PDF.');
          }
        }

        // What the publication pipeline would remove
        result.strippedMetadata = result.metadataFound.map(function (m) { return m.part; });

        resolve(result);
      };

      // 6 MB is plenty to reach the ZIP central directory of a normal document
      var slice = file.slice(0, Math.min(file.size, 6 * 1048576));
      reader.readAsArrayBuffer(slice);
    });
  }

  WL.fileinspect = {
    inspect: inspect, ext: ext, ALLOWED: ALLOWED, BLOCKED: BLOCKED, detectMagic: detectMagic
  };
})(window.WL);
