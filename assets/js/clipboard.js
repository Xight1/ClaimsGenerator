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
  const paragraphs = normalizedText.split(/\n{2,}/).filter(Boolean);

  const htmlBody = paragraphs
    .map((paragraph) => {
      const safeParagraph = escapeHtmlForClipboard(paragraph).replace(/\n/g, '<br>');
      return `<p style="margin:0 0 14px 0; padding:0; line-height:1.45; font-family:Arial, sans-serif; font-size:14px; color:#000000;">${safeParagraph}</p>`;
    })
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><!--StartFragment-->${htmlBody}<!--EndFragment--></body></html>`;
}

function buildRichCopyNode(text) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-99999px';
  wrapper.style.top = '0';
  wrapper.style.width = '720px';
  wrapper.style.background = '#ffffff';
  wrapper.style.color = '#000000';
  wrapper.style.fontFamily = 'Arial, sans-serif';
  wrapper.style.fontSize = '14px';
  wrapper.style.lineHeight = '1.45';
  wrapper.style.whiteSpace = 'normal';

  const normalizedText = normalizeClipboardText(text);
  normalizedText.split(/\n{2,}/).filter(Boolean).forEach((paragraph) => {
    const paragraphNode = document.createElement('p');
    paragraphNode.style.margin = '0 0 14px 0';
    paragraphNode.style.padding = '0';
    paragraph.split('\n').forEach((line, index) => {
      if (index > 0) paragraphNode.appendChild(document.createElement('br'));
      paragraphNode.appendChild(document.createTextNode(line));
    });
    wrapper.appendChild(paragraphNode);
  });

  return wrapper;
}

function copyRichNode(text) {
  const node = buildRichCopyNode(text);
  document.body.appendChild(node);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } finally {
    selection.removeAllRanges();
    node.remove();
  }

  return copied;
}

async function copyRichText(text) {
  const normalizedText = normalizeClipboardText(text);
  const plainText = normalizedText.replace(/\n/g, '\r\n');
  const htmlText = plainTextToClipboardHtml(normalizedText);

  if (copyRichNode(normalizedText)) return;

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
