function escapeHtmlForClipboard(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function plainTextToClipboardHtml(text) {
  const safeText = escapeHtmlForClipboard(text || '').replace(/\r\n/g, '\n');
  const paragraphs = safeText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, '<br>'))
    .map((paragraph) => `<p style="margin:0 0 12px 0; line-height:1.45;">${paragraph}</p>`)
    .join('');

  return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; font-size: 14px; color: #000000;">${paragraphs}</body></html>`;
}

async function copyRichText(text) {
  const plainText = String(text || '');
  const htmlText = plainTextToClipboardHtml(plainText);

  if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
    const item = new ClipboardItem({
      'text/plain': new Blob([plainText], { type: 'text/plain' }),
      'text/html': new Blob([htmlText], { type: 'text/html' })
    });
    await navigator.clipboard.write([item]);
    return;
  }

  await navigator.clipboard.writeText(plainText);
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

window.copyEmail = function copyEmailRich() {
  const body = document.getElementById('emailOutput')?.textContent || '';
  copyRichText(body)
    .then(() => showFeedbackById('copyFeedback', 'Body copied with formatting!'))
    .catch(() => showFeedbackById('copyFeedback', 'Copy failed — please copy manually.'));
};
