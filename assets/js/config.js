window.CLAIMS_GENERATOR_CONFIG = { version: "Claims Generator v2026-06-01 beta 26" };

(function () {
  // Simple DOM cache helper: caches commonly used elements on DOMContentLoaded
  // and provides getCached(id) to retrieve from cache (falls back to
  // document.getElementById when missing).
  window.DOM = window.DOM || {};

  window.getCached = function (id) {
    return (window.DOM && window.DOM[id]) || document.getElementById(id);
  };

  window.cacheDOM = function (ids) {
    window.DOM = window.DOM || {};
    ids.forEach((id) => {
      try {
        window.DOM[id] = document.getElementById(id);
      } catch (e) {
        window.DOM[id] = null;
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    // List of element IDs to cache for faster lookups in hot paths.
    cacheDOM([
      'subjectOutput',
      'emailOutput',
      'formContainer',
      'senderName',
      'claimType',
      'settlementMount',
      'settlementClaimType',
      'outputSection',
      'copyFeedback',
      'appVersion',
      'selectedTemplateIndicator',
      'settlementCalculatorPanel',
      'claimWorkspace',
      'toastNotification',
      'floatingThemeToggle'
    ]);
  });
})();
