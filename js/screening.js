/* ============================================================
   screening.js - automated content screening (spec 3.1)

   This stands in for a hosted service such as Azure AI Content
   Safety. It classifies into the same category/severity shape the
   real service returns, so swapping it out later is a change to
   this one file. It NEVER rejects: it only raises flags for a
   human to judge, and it always returns the surrounding sentence
   so an administrator does not have to read the whole document.
   ============================================================ */
window.WL = window.WL || {};

(function (WL) {
  'use strict';

  var CATEGORIES = [
    {
      category: 'Violence', severity: 'high',
      terms: ['knife', 'gun', 'shooting', 'shoot', 'stabbed', 'stab', 'blood on', 'kill him', 'kill her', 'kill them', 'beat him', 'weapon']
    },
    {
      category: 'Self-harm / crisis language', severity: 'high',
      terms: ['kill myself', 'end it all', 'want to die', 'hurt myself', 'cutting myself', 'not worth living']
    },
    {
      category: 'Hate speech', severity: 'high',
      terms: ['go back to your country', 'people like them always', 'subhuman']
    },
    {
      category: 'Sexual content', severity: 'high',
      terms: ['explicit sexual', 'sex scene']
    },
    {
      category: 'Targeting a named person', severity: 'medium',
      terms: ['everyone knows he', 'everyone knows she', 'is a liar', 'nobody likes']
    },
    {
      category: 'Substance use', severity: 'medium',
      terms: ['got drunk', 'vaping in', 'weed in the', 'pills from']
    },
    {
      category: 'Profanity', severity: 'low',
      terms: ['damn', 'hell of', 'goddamn', 'bastard', 'tramp', 'crap']
    }
  ];

  /* Widen a match out to the sentence it sits in, so an administrator
     sees the passage in context rather than a bare word. */
  function sentenceAround(text, index, len) {
    var floor = Math.max(0, index - 180);
    var ceil = Math.min(text.length, index + len + 180);

    // walk back to the character after the nearest sentence boundary
    var start = floor;
    for (var i = index; i > floor; i--) {
      if (/[.!?\n]/.test(text.charAt(i - 1))) { start = i; break; }
    }

    // walk forward to the nearest sentence boundary
    var end = ceil;
    for (var j = index + len; j < ceil; j++) {
      if (/[.!?\n]/.test(text.charAt(j))) { end = j + 1; break; }
    }

    var raw = text.slice(start, end);
    var out = raw.trim();
    var truncatedStart = start > 0;
    var truncatedEnd = end < text.length && !/[.!?]\s*$/.test(out);
    if (truncatedStart) out = '…' + out;
    if (truncatedEnd) out = out + '…';
    return out;
  }

  /* Screen a block of text. Returns an array of findings. */
  function screenText(text, keywords) {
    var findings = [];
    if (!text) return findings;
    var lower = text.toLowerCase();

    CATEGORIES.forEach(function (cat) {
      var hits = [], firstIdx = -1, firstLen = 0;
      cat.terms.forEach(function (term) {
        var idx = lower.indexOf(term.toLowerCase());
        if (idx !== -1) {
          hits.push(text.substr(idx, term.length));
          if (firstIdx === -1 || idx < firstIdx) { firstIdx = idx; firstLen = term.length; }
        }
      });
      if (hits.length) {
        findings.push({
          category: cat.category,
          severity: cat.severity,
          source: 'Automated content screening',
          matchedTerms: WL.uniq(hits),
          matchedExcerpt: sentenceAround(text, firstIdx, firstLen)
        });
      }
    });

    // School-specific keyword list (staff names, local terms)
    (keywords || []).forEach(function (kw) {
      var idx = lower.indexOf(String(kw).toLowerCase());
      if (idx !== -1) {
        findings.push({
          category: 'Named staff member or school-specific term',
          severity: 'medium',
          source: 'School keyword list',
          matchedTerms: [text.substr(idx, kw.length)],
          matchedExcerpt: sentenceAround(text, idx, kw.length)
        });
      }
    });

    return findings;
  }

  /* Findings that come from the file's structure rather than its text */
  function screenStructure(inspection) {
    var out = [];
    if (!inspection) return out;

    if (inspection.embeddedImageCount > 0) {
      out.push({
        category: 'Embedded images — human review required',
        severity: 'medium',
        source: 'File structure inspection',
        matchedTerms: [],
        matchedExcerpt: 'File contains ' + inspection.embeddedImageCount +
          ' embedded image' + (inspection.embeddedImageCount === 1 ? '' : 's') +
          '. Automated text screening cannot inspect image content, so a person has to look at this one.'
      });
    }

    if (inspection.likelyScan) {
      out.push({
        category: 'Little or no extractable text — likely a scan',
        severity: 'medium',
        source: 'File structure inspection',
        matchedTerms: [],
        matchedExcerpt: 'Almost no machine-readable text was recovered from this PDF. Scanned pages have to be read by a person.'
      });
    }

    return out;
  }

  function highest(findings) {
    if (findings.some(function (f) { return f.severity === 'high'; })) return 'high';
    if (findings.some(function (f) { return f.severity === 'medium'; })) return 'medium';
    if (findings.length) return 'low';
    return null;
  }

  WL.screening = {
    screenText: screenText,
    screenStructure: screenStructure,
    highest: highest,
    CATEGORIES: CATEGORIES
  };
})(window.WL);
