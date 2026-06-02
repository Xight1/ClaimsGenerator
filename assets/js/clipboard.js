function selectAndCopyRenderedElement(element) {
  if (!element) return false;

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    selection.removeAllRanges();
  }

  return copied;
}

function fallbackCopyPlainText(text) {
  return navigator.clipboard.writeText(String(text || ''));
}

function showFeedbackById(feedbackId, message, duration = 2500) {
  const feedback = document.getElementById(feedbackId);
  if (!feedback) return;
  if (message) feedback.textContent = message;
  feedback.classList.add('show');
  setTimeout(() => feedback.classList.remove('show'), duration);
}

window.copySubject = function copySubjectRich() {
  const subject = document.getElementById('subjectOutput')?.textContent || '';
  navigator.clipboard.writeText(subject)
    .then(() => showFeedbackById('copyFeedback', 'Subject copied!'))
    .catch(() => showFeedbackById('copyFeedback', 'Copy failed — please copy manually.'));
};

window.copyEmail = function copyEmailRenderedPreview() {
  const outputSection = document.getElementById('outputSection');
  const emailOutput = document.getElementById('emailOutput');
  const target = outputSection || emailOutput;

  if (selectAndCopyRenderedElement(target)) {
    showFeedbackById('copyFeedback', 'Body copied!');
    return;
  }

  fallbackCopyPlainText(emailOutput?.innerText || emailOutput?.textContent || '')
    .then(() => showFeedbackById('copyFeedback', 'Body copied as plain text.'))
    .catch(() => showFeedbackById('copyFeedback', 'Copy failed — please copy manually.'));
};

window.copyRenderedElementById = function copyRenderedElementById(elementId, feedbackId, successMessage) {
  const target = document.getElementById(elementId);

  if (selectAndCopyRenderedElement(target)) {
    showFeedbackById(feedbackId, successMessage || 'Copied!');
    return Promise.resolve();
  }

  return fallbackCopyPlainText(target?.innerText || target?.textContent || '')
    .then(() => showFeedbackById(feedbackId, 'Copied as plain text.'))
    .catch(() => showFeedbackById(feedbackId, 'Copy failed — please copy manually.'));
};
