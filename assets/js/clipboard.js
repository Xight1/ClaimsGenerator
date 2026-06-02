function escapeHtmlForClipboard(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeClipboardText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function buildClipboardParts(text) {
  const normalizedText = normalizeClipboardText(text);
  const paragraphs = normalizedText.split(/\n{2,}/).filter(Boolean);

  const plainText = paragraphs
    .map((paragraph) => paragraph.replace(/\n/g, '\r\n'))
    .join('\r\n\r\n');

  const htmlBody = paragraphs
    .map((paragraph) => {
      const safeLines = paragraph.split('\n').map(escapeHtmlForClipboard).join('<br>');
      return `<p style="margin:0 0 16px 0; padding:0; font-family:Arial, sans-serif; font-size:14px; line-height:1.45; color:#000000; mso-margin-top-alt:0in; mso-margin-bottom-alt:12pt;">${safeLines}</p>`;
    })
    .join('');

  const htmlText = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0; padding:0; font-family:Arial, sans-serif; font-size:14px; line-height:1.45; color:#000000;"><!--StartFragment-->${htmlBody}<!--EndFragment--></body></html>`;

  return { plainText, htmlText };
}

async function copyRichText(text) {
  const { plainText, htmlText } = buildClipboardParts(text);

  if (navigator.clipboard && window.ClipboardItem && navigator.clipboard.write) {
    const item = new ClipboardItem({
      'text/html': new Blob([htmlText], { type: 'text/html' }),
      'text/plain': new Blob([plainText], { type: 'text/plain' })
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
  let body = '';
  if (typeof composeEmail === 'function') {
    body = composeEmail()?.body || '';
  }
  if (!body) body = document.getElementById('emailOutput')?.innerText || document.getElementById('emailOutput')?.textContent || '';

  copyRichText(body)
    .then(() => showFeedbackById('copyFeedback', 'Body copied with formatting!'))
    .catch(() => showFeedbackById('copyFeedback', 'Copy failed — please copy manually.'));
};
