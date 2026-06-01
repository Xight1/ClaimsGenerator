function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(window.__claimsToastTimer);
  window.__claimsToastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function setClaimTypeFromShortcut(type) {
  const claimType = document.getElementById('claimType');
  const settlementClaimType = document.getElementById('settlementClaimType');
  if (claimType) claimType.value = type;
  if (settlementClaimType) settlementClaimType.value = type;
  if (typeof handleClaimTypeChange === 'function') handleClaimTypeChange();
  document.getElementById(type === 'settlement' ? 'settlementCalculatorPanel' : 'claimWorkspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const enabled = document.body.classList.contains('dark-mode');
  localStorage.setItem('claimsGeneratorDarkMode', enabled ? 'true' : 'false');
  showToast(enabled ? 'Dark mode enabled' : 'Light mode enabled');
}

function initializeUIEnhancements() {
  if (localStorage.getItem('claimsGeneratorDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  const originalWriteText = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
  if (originalWriteText && !navigator.clipboard.__claimsToastWrapped) {
    navigator.clipboard.writeText = function(text) {
      return originalWriteText(text).then((result) => {
        showToast('Copied to clipboard');
        return result;
      });
    };
    navigator.clipboard.__claimsToastWrapped = true;
  }
}

document.addEventListener('DOMContentLoaded', initializeUIEnhancements);
