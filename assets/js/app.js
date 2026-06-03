// Claim Generator core logic
const $ = (id) => document.getElementById(id);
let previewFrame = 0;

function schedulePreviewUpdate() {
  if (previewFrame) return;
  previewFrame = requestAnimationFrame(() => {
    previewFrame = 0;
    updatePreview();
    updateProgressBar();
  });
}

const preserved = {};
const sharedIds = ['recipient', 'followUpRecipient', 'client', 'customClient', 'clientClaim', 'tccClaim', 'insuranceClaim', 'cost', 'damageStreet', 'damageCity', 'deadlineDate'];
const DEFAULTS_KEY = 'claimGeneratorDefaults';
const DEFAULT_SENDER_NAME = 'Kevin';
const BLANK = '[fill in]';

const clientField = {
  label: 'Client Name',
  id: 'client',
  type: 'select',
  required: true,
  options: [
    { value: 'CenterPoint Energy', text: 'CenterPoint Energy' },
    { value: 'Delta Utilities', text: 'Delta Utilities' },
    { value: 'One Gas', text: 'One Gas' },
    { value: 'custom', text: 'Custom Client' }
  ],
  customInput: {
    label: 'Custom Client Name',
    id: 'customClient',
    placeholder: 'Enter client name'
  }
};

const claimNumberRow = {
  type: 'row',
  fields: [
    { label: 'Client Claim Number', id: 'clientClaim', placeholder: 'e.g. CLM-12345', required: true },
    { label: 'TCC Claim Number', id: 'tccClaim', placeholder: 'e.g. TCC-67890', required: true }
  ]
};

const sharedFields = [
  { type: 'section-title', label: 'Contact' },
  { label: "Recipient's Name", id: 'recipient', placeholder: 'e.g. Jane Smith' },
  clientField,
  { type: 'section-title', label: 'Claim Details' },
  claimNumberRow,
  { label: 'Total Cost of Damages ($)', id: 'cost', placeholder: 'e.g. 1500.00', required: true },
  { type: 'section-title', label: 'Damage Location' },
  {
    type: 'row',
    fields: [
      { label: 'Damage Address (Street)', id: 'damageStreet', placeholder: 'e.g. 123 Main St', required: true },
      { label: 'City, State ZIP', id: 'damageCity', placeholder: 'e.g. Minneapolis, MN 55427', required: true }
    ]
  }
];

const fields = {
  gas: [
    ...sharedFields,
    { label: 'Incident Details', id: 'incidentDetails', type: 'textarea', rows: 5, placeholder: 'the contractor struck the gas main while performing excavation at the listed address.', required: true },
    { type: 'section-title', label: 'Attachments' },
    { label: 'Attachments', type: 'checkbox-group', options: [
      { id: 'hasLetter', text: 'Demand Letter' },
      { id: 'hasPhotos', text: 'Damage Photos' },
      { id: 'hasReport', text: 'Damage Report' },
      { id: 'hasTicket', text: 'Locate Ticket' }
    ] }
  ],
  streetlight: [
    ...sharedFields,
    { label: 'Locate Ticket #', id: 'locateTicket', placeholder: 'e.g. 2024-00987', required: true },
    { label: 'Incident Description', id: 'incidentDescription', type: 'textarea', rows: 5, placeholder: 'a utility installation project at the listed address.', required: true },
    { type: 'section-title', label: 'Attachments' },
    { label: 'Attachments', type: 'checkbox-group', options: [
      { id: 'hasLetter', text: 'Demand Letter' },
      { id: 'hasPhotos', text: 'Damage Photos' },
      { id: 'hasReport', text: 'Damage Report' },
      { id: 'hasTicket', text: 'Locate Ticket' }
    ] }
  ],
  escalation: [
    { type: 'section-title', label: 'Contact' },
    { label: "Recipient's Name", id: 'recipient', placeholder: 'e.g. Jane Smith' },
    clientField,
    { type: 'section-title', label: 'Claim Details' },
    claimNumberRow,
    { type: 'section-title', label: 'Deadline' },
    { label: 'Escalation Deadline', id: 'deadlineDate', type: 'date', required: true }
  ],
  payment: [
    { type: 'section-title', label: 'Payment' },
    clientField,
    claimNumberRow,
    { label: 'Payment Amount ($)', id: 'cost', placeholder: 'e.g. 1500.00', required: true }
  ],
  followup: [
    { type: 'section-title', label: 'Contact' },
    { label: "Recipient's Name", id: 'followUpRecipient', placeholder: 'e.g. Jane Smith' },
    { type: 'section-title', label: 'Response Request' },
    { label: 'Include 7-day soft deadline requesting a response', id: 'hasSoftDeadline', type: 'checkbox' },
    { label: 'Soft Deadline Date', id: 'deadlineDate', type: 'date' }
  ],
  insurance: [
    { type: 'section-title', label: 'Claim Details' },
    clientField,
    claimNumberRow,
    { type: 'row', fields: [
      { label: 'Insurance Claim Number', id: 'insuranceClaim', placeholder: 'e.g. INS-24680', required: true },
      { label: 'Claim Amount ($)', id: 'cost', placeholder: 'e.g. 1500.00', required: true }
    ] }
  ]
};

function savePreserved(id) {
  if (id) {
    if (!sharedIds.includes(id)) return;
    const el = $(id);
    if (el) preserved[id] = el.value;
    return;
  }
  sharedIds.forEach((id) => {
    const el = $(id);
    if (el) preserved[id] = el.value;
  });
}

function restorePreserved() {
  sharedIds.forEach((id) => {
    const el = $(id);
    if (el && preserved[id] !== undefined) el.value = preserved[id];
  });
}

function renderForm(options = {}) {
  const shouldApplyDefaults = options.applyDefaults !== false;
  const shouldSetDefaultDeadline = options.setDefaultDeadline !== false;
  const shouldPreserveValues = options.preserveValues !== false;
  const type = $('claimType').value;
  const formContainer = $('formContainer');
  const senderSection = $('senderSection');

  if (!fields[type]) return;

  if (shouldPreserveValues) savePreserved();
  formContainer.textContent = '';
  senderSection.style.display = ['payment', 'followup'].includes(type) ? 'none' : 'block';
  clearValidation();
  const fragment = document.createDocumentFragment();
  fragment.appendChild(buildTemplateCue(type));
  fields[type].forEach((field) => buildField(field, fragment));
  formContainer.appendChild(fragment);
  if (shouldPreserveValues) restorePreserved();
  if (shouldApplyDefaults) applySavedDefaultsToCurrentForm();
  if (shouldSetDefaultDeadline) setDefaultDeadlineDate();
  normalizeDeadlineInput();
  updatePreview();
  updateProgressBar();
}

function getTemplateName(type) {
  return document.querySelector(`#claimType option[value="${type}"]`)?.textContent || type;
}

function buildTemplateCue(type) {
  const div = document.createElement('div');
  const label = document.createElement('span');
  div.className = 'template-cue';
  label.textContent = 'Selected Template';
  div.append(label, getTemplateName(type));
  return div;
}

function buildField(field, parent) {
  if (field.type === 'section-title') {
    const heading = document.createElement('div');
    heading.className = 'section-heading';
    heading.textContent = field.label;
    parent.appendChild(heading);
    return;
  }

  if (field.type === 'row') {
    const row = document.createElement('div');
    row.className = 'row-2 section';
    field.fields.forEach((childField) => {
      const col = document.createElement('div');
      buildInputField(childField, col);
      row.appendChild(col);
    });
    parent.appendChild(row);
    return;
  }

  const div = document.createElement('div');
  div.className = 'section';

  if (field.type === 'checkbox-group') {
    div.classList.add('checkbox-group');
    const p = document.createElement('p');
    p.textContent = `${field.label}:`;
    div.appendChild(p);
    field.options.forEach((opt) => div.appendChild(buildCheckbox(opt.id, opt.text)));
  } else if (field.type === 'checkbox') {
    div.appendChild(buildCheckbox(field.id, field.label, 'checkbox-inline'));
  } else if (field.type === 'select') {
    buildSelectField(field, div);
  } else {
    buildInputField(field, div);
  }

  parent.appendChild(div);
}

function buildCheckbox(id, text, className = '') {
  const label = document.createElement('label');
  const input = document.createElement('input');
  if (className) label.className = className;
  input.type = 'checkbox';
  input.id = id;
  label.append(input, ` ${text}`);
  return label;
}

function buildSelectField(field, container) {
  const label = document.createElement('label');
  const select = document.createElement('select');
  label.setAttribute('for', field.id);
  label.innerHTML = field.label + (field.required ? ' <span style="color:var(--red)">*</span>' : '');
  select.id = field.id;
  if (field.required) select.dataset.required = 'true';
  field.options.forEach((opt) => select.add(new Option(opt.text, opt.value)));
  container.append(label, select);

  if (!field.customInput) return;

  const customWrap = document.createElement('div');
  customWrap.id = `${field.customInput.id}Wrap`;
  customWrap.style.display = 'none';
  customWrap.style.marginTop = '0.75rem';
  buildInputField({ ...field.customInput, required: false }, customWrap);
  container.appendChild(customWrap);

  const toggleCustomInput = () => {
    const customInput = $(field.customInput.id);
    const isCustom = select.value === 'custom';
    customWrap.style.display = isCustom ? 'block' : 'none';
    if (!customInput) return;
    if (isCustom) {
      customInput.dataset.required = 'true';
    } else {
      customInput.removeAttribute('data-required');
      clearError(customInput, `err-${field.customInput.id}`);
    }
    schedulePreviewUpdate();
  };

  select.addEventListener('change', toggleCustomInput);
  queueMicrotask(toggleCustomInput);
}

function buildInputField(field, container) {
  const label = document.createElement('label');
  const input = field.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
  label.setAttribute('for', field.id);
  label.innerHTML = field.label + (field.required ? ' <span style="color:var(--red)">*</span>' : '');
  input.id = field.id;
  input.placeholder = field.placeholder || '';

  if (field.type === 'textarea') {
    input.rows = field.rows || 4;
  } else if (field.type === 'date') {
    input.type = 'date';
  } else {
    input.type = 'text';
    if (field.id === 'cost') input.inputMode = 'decimal';
  }

  if (field.required) input.dataset.required = 'true';
  const errDiv = document.createElement('div');
  errDiv.className = 'error-msg';
  errDiv.id = `err-${field.id}`;
  errDiv.textContent = field.id === 'cost' ? 'Enter a valid dollar amount.' : 'This field is required.';
  container.append(label, input, errDiv);
}

function validate() {
  let valid = true;
  const errors = [];
  const sender = $('senderName');
  const type = $('claimType').value;

  if (!['payment', 'followup'].includes(type) && !sender.value.trim()) {
    markError(sender, 'err-senderName', 'Required');
    errors.push('Your Name');
    valid = false;
  } else {
    clearError(sender, 'err-senderName');
  }

  document.querySelectorAll('[data-required="true"]').forEach((el) => {
    const labelText = document.querySelector(`label[for="${el.id}"]`)?.innerText.replace('*', '').trim() || el.id;
    if (!el.value.trim()) {
      markError(el, `err-${el.id}`, 'This field is required.');
      errors.push(labelText);
      valid = false;
    } else if (el.id === 'cost' && !isValidCurrency(el.value)) {
      markError(el, `err-${el.id}`, 'Enter a valid dollar amount.');
      errors.push(labelText);
      valid = false;
    } else {
      clearError(el, `err-${el.id}`);
    }
  });

  const banner = $('validationBanner');
  banner.style.display = valid ? 'none' : 'block';
  if (!valid) banner.textContent = `Please fix the following fields: ${errors.join(', ')}.`;
  return valid;
}

function markError(el, errId, message) {
  if (!el) return;
  el.classList.add('error');
  const err = $(errId);
  if (err) {
    if (message) err.textContent = message;
    err.style.display = 'block';
  }
}

function clearError(el, errId) {
  if (el) el.classList.remove('error');
  const err = $(errId);
  if (err) err.style.display = 'none';
}

function clearValidation() {
  document.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));
  document.querySelectorAll('.error-msg').forEach((el) => { el.style.display = 'none'; });
  const banner = $('validationBanner');
  if (banner) banner.style.display = 'none';
}

function getValue(id, fallback = BLANK) {
  const value = $(id)?.value.trim();
  return value || fallback;
}

function getGreetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function getClientName() {
  const selectedClient = $('client')?.value.trim() || 'CenterPoint Energy';
  const customClient = $('customClient')?.value.trim() || '';
  return selectedClient === 'custom' ? (customClient || BLANK) : selectedClient;
}

function isValidCurrency(raw) {
  const normalized = String(raw || '').replace(/[$,\s]/g, '');
  return /^\d+(\.\d{1,2})?$/.test(normalized) && Number(normalized) > 0;
}

function formatCost(raw) {
  const num = parseFloat(String(raw || '').replace(/[$,\s]/g, ''));
  if (Number.isNaN(num)) return raw || BLANK;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatShortDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function moveWeekendForward(date) {
  const result = new Date(date);
  const day = result.getDay();
  if (day === 6) result.setDate(result.getDate() + 2);
  if (day === 0) result.setDate(result.getDate() + 1);
  return result;
}

function toDateInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInputValue(value) {
  const parts = String(value || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getDefaultDeadlineDate() {
  return moveWeekendForward(addDays(new Date(), 7));
}

function setDefaultDeadlineDate() {
  const deadlineInput = $('deadlineDate');
  if (deadlineInput && !deadlineInput.value) deadlineInput.value = toDateInputValue(getDefaultDeadlineDate());
}

function normalizeDeadlineInput() {
  const deadlineInput = $('deadlineDate');
  if (!deadlineInput?.value) return;
  const parsed = parseDateInputValue(deadlineInput.value);
  if (parsed) deadlineInput.value = toDateInputValue(moveWeekendForward(parsed));
}

function getDeadlineDate() {
  const parsed = $('deadlineDate')?.value ? parseDateInputValue($('deadlineDate').value) : null;
  return formatShortDate(moveWeekendForward(parsed || getDefaultDeadlineDate()));
}

function buildSubject(type, client, clientClaim, tccClaim, insuranceClaim = BLANK) {
  if (type === 'followup') return 'Follow Up Regarding Open Claim';
  if (type === 'payment') return `Payment Information | ${client} # ${clientClaim} | TCC # ${tccClaim}`;
  if (type === 'escalation') return `Claim Escalation | ${client} # ${clientClaim} | TCC # ${tccClaim}`;
  if (type === 'insurance') return `Insurance Claim # ${insuranceClaim} | ${client} # ${clientClaim} | TCC # ${tccClaim}`;
  return `${client} # ${clientClaim} | TCC # ${tccClaim}`;
}

function formatAttachmentList(attachments) {
  if (attachments.length <= 2) return attachments.join(' and ');
  return `${attachments.slice(0, -1).join(', ')}, and ${attachments[attachments.length - 1]}`;
}

function composeEmail() {
  const type = $('claimType').value;
  const senderName = getValue('senderName');
  const greetingWord = getGreetingWord();
  const recipient = getValue('recipient', '');
  const greetingLine = recipient ? `Good ${greetingWord} ${recipient},` : `Good ${greetingWord},`;
  const client = getClientName();
  const clientClaim = getValue('clientClaim');
  const tccClaim = getValue('tccClaim');
  const insuranceClaim = getValue('insuranceClaim');
  const subject = buildSubject(type, client, clientClaim, tccClaim, insuranceClaim);

  if (type === 'payment') {
    const cost = formatCost(getValue('cost', ''));
    return { subject, body: `To resolve this matter, please remit payment in the amount of ${cost}.\n\nIf paying by check, be sure to reference both the ${client} # ${clientClaim} and TCC File # ${tccClaim} on the check. Please provide images of the front and back of the check once mailed so we may verify payment has been issued and ensure quick application.\n\nPayment Instructions:\nPayee: ${client}\nMemo: ${client} #${clientClaim} | TCC #${tccClaim}\nMail To:\n${client}\nc/o The Claims Center LLC\nP.O. Box 270410\nMinneapolis, MN 55427\n\nOnline Payment:\nwww.theclaimscenter.com/payments\nIf proceeding with this method, please use master/reference #${tccClaim} to ensure quick resolution.` };
  }

  if (type === 'followup') {
    const followUpRecipient = getValue('followUpRecipient', '');
    const followUpGreeting = followUpRecipient ? `Good ${greetingWord} ${followUpRecipient},` : `Good ${greetingWord},`;
    const deadlineText = $('hasSoftDeadline')?.checked ? `\n\nIf possible, please send an update by ${getDeadlineDate()} so we can keep the claim moving forward.` : '';
    return { subject, body: `${followUpGreeting}\n\nI wanted to follow up on my previous message and see if you had a chance to review the information provided. Please let me know the current status or if there is anything else needed from our side to help move this toward resolution.${deadlineText}\n\nI appreciate your prompt attention and look forward to your response.` };
  }

  if (type === 'insurance') {
    const cost = formatCost(getValue('cost', ''));
    return { subject, body: `${greetingLine}\n\nI am reaching out to provide the supporting documents for the above referenced claim in the amount of ${cost}.\n\nPlease advise if you have any further questions or need any additional documentation for your review.\n\nRemittance Instructions:\nPayee: ${client}\nMemo: ${client} #${clientClaim} | TCC #${tccClaim}\nMail To: ${client}, c/o The Claims Center LLC, P.O. Box 270410, Minneapolis, MN 55427\nOnline Payment: www.theclaimscenter.com/payments\nPlease use TCC #${tccClaim} as the master/reference number for online payment.` };
  }

  if (type === 'escalation') {
    const dueDate = getDeadlineDate();
    return { subject, body: `Urgent Communication Required Regarding Claim Escalation\n\n${greetingLine}\n\nI am writing to express my concerns regarding our recent attempts to contact you. Despite multiple efforts, we have not received any response.\n\nDue to the lack of communication, this claim is due for escalation. Prompt communication is crucial to resolving this matter. If no response is received by ${dueDate} this claim will be sent for further recovery efforts.\n\nPlease contact us to resolve this claim and avoid unnecessary escalation.` };
  }

  const cost = formatCost(getValue('cost', ''));
  const damageStreet = getValue('damageStreet');
  const damageCity = getValue('damageCity');
  const hasLetter = $('hasLetter')?.checked;
  const hasPhotos = $('hasPhotos')?.checked;
  const hasReport = $('hasReport')?.checked;
  const hasTicket = $('hasTicket')?.checked;
  let body = `${greetingLine}\n\nMy name is ${senderName}, and I am contacting you on behalf of The Claims Center (TCC), a third-party administrator for ${client}.\nWe are reaching out regarding an open claim that our client has against you. The damage location is as follows:\n\nIncident Location:\n${damageStreet}\n${damageCity}\n\n`;

  if (type === 'gas') {
    body += `Based on our client's investigation, it appears that ${getValue('incidentDetails')}\n\n`;
    body += `The total cost of damages incurred is ${cost}.`;
  } else {
    body += `Based on our review, the damage occurred during excavation work associated with ${getValue('incidentDescription')} The submitted locate ticket for this work was Locate Ticket #${getValue('locateTicket')} (attached for your reference). The submitted locate ticket was the most recent ticket filed in the area prior to the discovery of the damage by our client.\n\n`;
    body += `The total cost of repairs incurred by ${client} is ${cost}.`;
  }

  body += hasLetter ? ' Please see the attached demand letter.' : ' The demand letter is still being generated by our client; once it becomes available, we will provide it to you.';

  const attachments = [];
  if (hasPhotos) attachments.push('the damage photos');
  if (hasReport) attachments.push('the damage report');
  if (hasTicket) attachments.push('the locate ticket');
  if (attachments.length) body += `\n\nI have attached ${formatAttachmentList(attachments)} for your review.`;

  body += `\n\nTo resolve this matter, please remit payment in the amount of ${cost}.\n\nIf paying by check, be sure to reference both the ${client} # ${clientClaim} and TCC File # ${tccClaim} on the check. Please provide images of the front and back of the check once mailed so we may verify payment has been issued and ensure quick application.\n\nPayment Instructions:\nPayee: ${client}\nMemo: ${client} #${clientClaim} | TCC #${tccClaim}\nMail To:\n${client}\nc/o The Claims Center LLC\nP.O. Box 270410\nMinneapolis, MN 55427\n\nOnline Payment:\nwww.theclaimscenter.com/payments\nIf proceeding with this method, please use master/reference #${tccClaim} to ensure quick resolution.\n\nWe have a limited window to resolve this claim. If no meaningful progress is made toward a resolution within that time, the claim may be escalated for further recovery efforts.\n\nPlease contact me with any questions.`;
  return { subject, body };
}

function updatePreview() {
  const { subject, body } = composeEmail();
  const subjectOutput = $('subjectOutput');
  const emailOutput = $('emailOutput');
  if (subjectOutput) subjectOutput.innerText = subject;
  if (emailOutput) emailOutput.innerText = body;
}

function updateProgressBar() {
  const progress = $('formProgress');
  if (!progress) return;

  const type = $('claimType').value;
  if (!['gas', 'streetlight'].includes(type)) {
    progress.style.display = 'none';
    return;
  }

  let total = 0;
  let filled = 0;

  const sender = $('senderName');
  if (sender) {
    total++;
    if (sender.value.trim()) filled++;
  }

  document.querySelectorAll('[data-required="true"]').forEach((el) => {
    total++;
    const val = el.value.trim();
    if (val && (el.id !== 'cost' || isValidCurrency(val))) filled++;
  });

  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const bar = $('formProgressBar');
  const text = $('formProgressText');
  const isComplete = filled === total && total > 0;

  if (bar) {
    bar.style.width = `${pct}%`;
    bar.classList.toggle('complete', isComplete);
  }
  if (text) {
    text.textContent = `${filled} of ${total} required fields complete`;
  }

  progress.style.display = 'block';
}

function generateEmail() {
  if (!validate()) return;
  saveDefaults();
  updatePreview();
  $('outputSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getSavedDefaults() {
  try {
    return JSON.parse(localStorage.getItem(DEFAULTS_KEY)) || {};
  } catch {
    return {};
  }
}

function applySavedDefaultsToCurrentForm() {
  const defaults = getSavedDefaults();
  const sender = $('senderName');
  if (sender && defaults.senderName && !sender.value) sender.value = defaults.senderName;
  if ($('client') && defaults.client) $('client').value = defaults.client;
  if ($('customClient') && defaults.customClient) $('customClient').value = defaults.customClient;
  $('client')?.dispatchEvent(new Event('change'));
}

function saveDefaults() {
  const defaults = {
    senderName: $('senderName')?.value.trim() || '',
    client: $('client')?.value || '',
    customClient: $('customClient')?.value.trim() || ''
  };
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
}

function showCopyFeedback(message) {
  const fb = $('copyFeedback');
  if (!fb) return;
  fb.textContent = message;
  fb.classList.add('show');
  setTimeout(() => fb.classList.remove('show'), 2500);
}

function copySubject() {
  navigator.clipboard.writeText($('subjectOutput').innerText).then(() => showCopyFeedback('Subject copied!'));
}

function copyEmail() {
  navigator.clipboard.writeText($('emailOutput').innerText).then(() => showCopyFeedback('Body copied!'));
}

function resetForm() {
  $('senderName').value = '';
  Object.keys(preserved).forEach((key) => delete preserved[key]);
  renderForm({ applyDefaults: false, setDefaultDeadline: false, preserveValues: false });
}

document.addEventListener('input', () => {
  savePreserved();
  schedulePreviewUpdate();
}, true);

document.addEventListener('blur', (event) => {
  if (event.target.id === 'cost' && isValidCurrency(event.target.value)) {
    event.target.value = formatCost(event.target.value);
    savePreserved();
    schedulePreviewUpdate();
  }
  if (event.target.id === 'deadlineDate') {
    normalizeDeadlineInput();
    savePreserved();
    schedulePreviewUpdate();
  }
}, true);

document.addEventListener('change', () => {
  normalizeDeadlineInput();
  savePreserved();
  schedulePreviewUpdate();
  saveDefaults();
});

document.addEventListener('DOMContentLoaded', () => {
  const config = window.CLAIMS_GENERATOR_CONFIG || {};
  const versionEl = $('appVersion');
  if (versionEl && config.version) versionEl.textContent = config.version;
  $('senderName').value = getSavedDefaults().senderName || DEFAULT_SENDER_NAME;
  renderForm();
});
