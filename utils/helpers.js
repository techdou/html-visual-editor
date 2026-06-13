window.HVE_Helpers = (function () {
  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#FFFFFF';
    if (rgb.startsWith('#')) return rgb.toUpperCase();
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';
    return '#' + match.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function parseTranslate(transform) {
    const match = (transform || '').match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    if (match) {
      return { tx: parseFloat(match[1]) || 0, ty: parseFloat(match[2]) || 0 };
    }
    return { tx: 0, ty: 0 };
  }

  function setTranslate(el, tx, ty) {
    const current = el.style.transform || '';
    const cleaned = current.replace(/translate\([^)]+\)\s*/g, '').trim();
    const translateStr = `translate(${tx}px, ${ty}px)`;
    el.style.transform = cleaned ? `${translateStr} ${cleaned}` : translateStr;
  }

  return { rgbToHex, parseTranslate, setTranslate };
})();
