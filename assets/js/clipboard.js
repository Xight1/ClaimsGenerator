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

function plainTextToClipboardHtml(text) {
  const normalizedText = normalizeClipboardText(text);
  const paragraphs = normalizedText.split(/\n{2,}/);

  const htmlBody = paragraphs
    .map((paragraph) => {
      const safeParagraph = escapeHtmlForClipboard(paragraph).replace(/\n/g, '<br>');
      return `<div style="margin:0; padding:0; line-height:1.45; font-family:Arial, sans-serif; font-size:14px; color:#000000;">${safeParagraph}</div>`;
    })
    .join('<div style="margin:0; padding:0; line-height:1.45;"><br></div>');

  return `<!DOCTYPE html><html><body><!--StartFragment-->${htmlBody}<!--EndFragment--></body></html>`;
}

async function copyRichText(text) {
  const plainText = normalizeClipboardText(text).replace(/\n/g, '\r\n');
  const htmlText = plainTextToClipboardHtml(text);

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
