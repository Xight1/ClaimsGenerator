// Claim Generator core logic
const $ = (id) => document.getElementById(id);
let previewFrame = 0;

function schedulePreviewUpdate() {
  if (previewFrame) return;
  previewFrame = requestAnimationFrame(() => {
    previewFrame = 0;
    updatePreview();
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
      { id: 'hasPhotos', text: 'Damage Photos' },
      { id: 'hasReport', text: 'Damage Report' },
      { id: 'hasTicket', text: 'Locate Ticket' },
      { id: 'hasLetter', text: 'Demand Letter' }
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

function savePreserved() {
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
  const type = $('claimType').value;
  const formContainer = $('formContainer');
  const senderSection = $('senderSection');

  if (!fields[type]) return;

  savePreserved();
  formContainer.textContent = '';
  senderSection.style.display = ['payment', 'followup'].includes(type) ? 'none' : 'block';
  clearValidation();
  formContainer.appendChild(buildTemplateCue(type));
  fields[type].forEach((field) => buildField(field, formContainer));
  restorePreserved();
  if (shouldApplyDefaults) applySavedDefaultsToCurrentForm();
  setDefaultDeadlineDate();
  normalizeDeadlineInput();
  updatePreview();
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
    div.appendChild(buildCheckbox(fiel