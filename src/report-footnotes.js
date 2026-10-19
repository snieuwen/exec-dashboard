/* Presentation only: general definitions live in Oracle explained, not beside amounts. */
const ReportFootnotes = (() => {
  function apply(root) {
    const doc = root.ownerDocument;
    if (!doc.getElementById('report-footnote-style')) {
      const style = doc.createElement('style');
      style.id = 'report-footnote-style';
      style.textContent = '.purchase-total-label{font-size:11px;font-weight:400;display:block;margin-top:5px}';
      doc.head.append(style);
    }
    const text = node => node.textContent.trim().replace(/\s+/g, ' ');
    // Keep actual row evidence and short labels distinguishing separate totals.
    for (const table of root.querySelectorAll('table')) {
      for (const n of table.querySelectorAll('td .basis-tiny')) {
        const value = text(n);
        if (/Order date:|Completed years since/.test(value)) continue;
        if (value === 'Software above; hardware separately:') {
          n.className = 'purchase-total-label';n.textContent = 'Hardware:';
          const label = doc.createElement('span');label.className = 'purchase-total-label';label.textContent = 'Software:';n.closest('td').prepend(label);
        } else if (/^(Source|Converted|Conversion unavailable|Not applicable \/ unavailable|No hardware selected)/.test(value)) n.remove();
      }
      const wrap = table.closest('.table-scroll, .table-wrap') || table;
      const existing = wrap.nextElementSibling;
      if (existing?.matches('p.small') && /— means/.test(text(existing))) existing.remove();
      else if (existing?.matches('p.small') && /Amounts sum the included source lines/.test(text(existing))) {
        // This is a dataset-specific caveat, not a term or currency definition.
        existing.textContent = 'Repeated purchase amounts remain included and may need allocation review.';
      }
    }
    // Restore per-KPI inclusion/exclusion explanations; remove only currency provenance.
    for (const card of root.querySelectorAll('.stat')) {
      for (const n of card.querySelectorAll('.basis, p')) {
        if (n.matches('.basis') || /^(Source ·|Converted ·|Conversion unavailable)/.test(text(n))) n.remove();
      }
    }
  }
  return {apply};
})();
