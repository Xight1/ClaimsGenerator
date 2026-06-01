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

function getPreferredTheme() {
  const savedTheme = localStorage.getItem('claimsGeneratorTheme');
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  document.body.classList.toggle('dark-mode', isDark);
  const toggle = document.getElementById('floatingThemeToggle');
  if (toggle) {
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.innerHTML = isDark ? '<span aria-hidden="true">☀</span>' : '<span aria-hidden="true">☀</span>';
  }
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('claimsGeneratorTheme', nextTheme);
  localStorage.setItem('claimsGeneratorDarkMode', nextTheme === 'dark' ? 'true' : 'false');
  applyTheme(nextTheme);
  showToast(nextTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
}

function initializeTheme() {
  const legacyPreference = localStorage.getItem('claimsGeneratorDarkMode');
  if (!localStorage.getItem('claimsGeneratorTheme') && legacyPreference === 'true') {
    localStorage.setItem('claimsGeneratorTheme', 'dark');
  }
  applyTheme(getPreferredTheme());

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener?.('change', (event) => {
      if (!localStorage.getItem('claimsGeneratorTheme')) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }
}

function initializeUIEnhancements() {
  initializeTheme();

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
