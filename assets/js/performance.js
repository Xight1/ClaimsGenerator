(function () {
  const originalUpdatePreview = window.updatePreview;
  const originalSaveDefaults = window.saveDefaults;

  let previewFrame = null;
  let lastSubject = '';
  let lastBody = '';
  let defaultsTimer = null;

  window.updatePreview = function optimizedUpdatePreview() {
    if (previewFrame) window.cancelAnimationFrame(previewFrame);

    previewFrame = window.requestAnimationFrame(() => {
      previewFrame = null;
      if (typeof window.composeEmail !== 'function') {
        if (typeof originalUpdatePreview === 'function') originalUpdatePreview();
        return;
      }

      const output = window.composeEmail();
      if (!output) return;

      const subjectEl = document.getElementById('subjectOutput');
      const bodyEl = document.getElementById('emailOutput');

      if (subjectEl && output.subject !== lastSubject) {
        subjectEl.innerText = output.subject;
        lastSubject = output.subject;
      }

      if (bodyEl && output.body !== lastBody) {
        bodyEl.innerText = output.body;
        lastBody = output.body;
      }
    });
  };

  window.saveDefaults = function optimizedSaveDefaults() {
    window.clearTimeout(defaultsTimer);
    defaultsTimer = window.setTimeout(() => {
      if (typeof originalSaveDefaults === 'function') originalSaveDefaults();
    }, 200);
  };
})();
