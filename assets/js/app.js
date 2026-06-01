// ─── Preserved shared field values across claim type switches ───────────
    const preserved = {};
    const sharedIds = ['recipient', 'followUpRecipient', 'client', 'customClient', 'clientClaim', 'tccClaim', 'insuranceClaim', 'cost', 'damageStreet', 'damageCity', 'deadlineDate'];

    function savePreserved() {
      sharedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) preserved[id] = el.value;
      });
    }

    function restorePreserved() {
      sharedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && preserved[id] !== undefined) el.value = preserved[id];
      });
    }

    // ─── Field definitions ───────────────────────────────────────────────────
    const clientField = {
      label: "Client Name",
      id: "client",
      type: "select",
      required: true,
      options: [
        { value: "CenterPoint Energy", text: "CenterPoint Energy" },
        { value: "Delta Utilities", text: "Delta Utilities" },
        { value: "One Gas", text: "One Gas" },
        { value: "custom", text: "Custom Client" }
      ],
      customInput: {
        label: "Custom Client Name",
        id: "customClient",
        placeholder: "Enter client name"
      }
    };

    const sharedFields = [
      { type: "section-title", label: "Contact" },
      { label: "Recipient's Name", id: "recipient", placeholder: "e.g. Jane Smith" },
      clientField,
      { type: "section-title", label: "Claim Details" },
      {
        type: "row",
        fields: [
          { label: "Client Claim Number", id: "clientClaim", placeholder: "e.g. CLM-12345", required: true },
          { label: "TCC Claim Number", id: "tccClaim", placeholder: "e.g. TCC-67890", required: true }
        ]
      },
      { label: "Total Cost of Damages ($)", id: "cost", placeholder: "e.g. 1500.00", required: true },
      { type: "section-title", label: "Damage Location" },
      {
        type: "row",
        fields: [
          { label: "Damage Address (Street)", id: "damageStreet", placeholder: "e.g. 123 Main St", required: true },
          { label: "City, State ZIP", id: "damageCity", placeholder: "e.g. Minneapolis, MN 55427", required: true }
        ]
      }
    ];

    const escalationFields = [
      { type: "section-title", label: "Contact" },
      { label: "Recipient's Name", id: "recipient", placeholder: "e.g. Jane Smith" },
      clientField,
      { type: "section-title", label: "Claim Details" },
      {
        type: "row",
        fields: [
          { label: "Client Claim Number", id: "clientClaim", placeholder: "e.g. CLM-12345", required: true },
          { label: "TCC Claim Number", id: "tccClaim", placeholder: "e.g. TCC-67890", required: true }
        ]
      },
      { type: "section-title", label: "Deadline" },
      { label: "Escalation Deadline", id: "deadlineDate", type: "date", required: true }
    ];

    const paymentFields = [
      { type: "section-title", label: "Payment" },
      clientField,
      {
        type: "row",
        fields: [
          { label: "Client Claim Number", id: "clientClaim", placeholder: "e.g. CLM-12345", required: true },
          { label: "TCC Claim Number", id: "tccClaim", placeholder: "e.g. TCC-67890", required: true }
        ]
      },
      { label: "Payment Amount ($)", id: "cost", placeholder: "e.g. 1500.00", required: true }
    ];

    const followUpFields = [
      { type: "section-title", label: "Contact" },
      { label: "Recipient's Name", id: "followUpRecipient", placeholder: "e.g. Jane Smith" },
      { type: "section-title", label: "Response Request" },
      {
        label: "Include 7-day soft deadline requesting a response",
        id: "hasSoftDeadline",
        type: "checkbox"
      },
      { label: "Soft Deadline Date", id: "deadlineDate", type: "date" }
    ];

    const insuranceFields = [
      { type: "section-title", label: "Claim Details" },
      clientField,
      {
        type: "row",
        fields: [
          { label: "Client Claim Number", id: "clientClaim", placeholder: "e.g. CLM-12345", required: true },
          { label: "TCC Claim Number", id: "tccClaim", placeholder: "e.g. TCC-67890", required: true }
        ]
      },
      {
        type: "row",
        fields: [
          { label: "Insurance Claim Number", id: "insuranceClaim", placeholder: "e.g. INS-24680", required: true },
          { label: "Claim Amount ($)", id: "cost", placeholder: "e.g. 1500.00", required: true }
        ]
      }
    ];

    const fields = {
      gas: [
        ...sharedFields,
        {
          label: "Incident Details",
          id: "incidentDetails",
          type: "textarea",
          rows: 5,
          placeholder: "the contractor struck the gas main while performing excavation at the listed address.",
          required: true
        },
        { type: "section-title", label: "Attachments" },
        {
          label: "Attachments",
          type: "checkbox-group",
          options: [
            { id: "hasLetter", text: "Demand Letter" },
            { id: "hasPhotos", text: "Damage Photos" },
            { id: "hasReport", text: "Damage Report" },
            { id: "hasTicket", text: "Locate Ticket" }
          ]
        }
      ],
      streetlight: [
        ...sharedFields,
        { label: "Locate Ticket #", id: "locateTicket", placeholder: "e.g. 2024-00987", required: true },
        {
          label: "Incident Description",
          id: "incidentDescription",
          type: "textarea",
          rows: 5,
          placeholder: "a utility installation project at the listed address.",
          required: true
        },
        { type: "section-title", label: "Attachments" },
        {
          label: "Attachments",
          type: "checkbox-group",
          options: [
            { id: "hasPhotos", text: "Damage Photos" },
            { id: "hasReport", text: "Damage Report" },
            { id: "hasTicket", text: "Locate Ticket" },
            { id: "hasLetter", text: "Demand Letter" }
          ]
        }
      ],
      escalation: [
        ...escalationFields
      ],
      payment: [
        ...paymentFields
      ],
      followup: [
        ...followUpFields
      ],
      insurance: [
        ...insuranceFields
      ]
    };

    // ─── Template metadata ───────────────────────────────────────────────────
    const TEMPLATE_VERSION = '2026.05.29';
    const DEFAULTS_KEY = 'claimGeneratorDefaults';
    const DEFAULT_SENDER_NAME = 'Kevin';
    const BLANK = '[fill in]';

    // ─── Form rendering ──────────────────────────────────────────────────────
    function renderForm(options = {}) {
      const shouldApplyDefaults = options.applyDefaults !== false;
      savePreserved();
      const type = document.getElementById('claimType').value;
      const formContainer = document.getElementById('formContainer');
      const senderSection = document.getElementById('senderSection');
      formContainer.innerHTML = '';
      senderSection.style.display = ['payment', 'followup'].includes(type) ? 'none' : 'block';
      clearValidation();

      formContainer.appendChild(buildTemplateCue(type));
      fields[type].forEach(field => buildField(field, formContainer));
      restorePreserved();
      if (shouldApplyDefaults) applySavedDefaultsToCurrentForm();
      setDefaultDeadlineDate();
      normalizeDeadlineInput();
      updatePreview();
    }

    function getTemplateName(type) {
      const selectedOption = document.querySelector(`#claimType option[value="${type}"]`);
      return selectedOption ? selectedOption.textContent : type;
    }

    function buildTemplateCue(type) {
      const div = document.createElement('div');
      div.className = 'template-cue';
      const label = document.createElement('span');
      label.textContent = 'Selected Template';
      div.appendChild(label);
      div.append(getTemplateName(type));
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
        field.fields.forEach(f => {
          const col = document.createElement('div');
          buildInputField(f, col);
          row.appendChild(col);
        });
        parent.appendChild(row);
        return;
      }

      const div = document.createElement('div');
      div.className = 'section';

      if (field.type === 'checkbox-group') {
        div.classList.add('checkbox-group');
        if (field.label) {
          const p = document.createElement('p');
          p.textContent = `${field.label}:`;
          div.appendChild(p);
        }
        field.options.forEach(opt => {
          const label = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.id = opt.id;
          label.appendChild(input);
          label.append(` ${opt.text}`);
          div.appendChild(label);
        });
      } else if (field.type === 'checkbox') {
        const label = document.createElement('label');
        label.className = 'checkbox-inline';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = field.id;
        label.appendChild(input);
        label.append(` ${field.label}`);
        div.appendChild(label);
      } else if (field.type === 'select') {
        const label = document.createElement('label');
        label.innerHTML = field.label + (field.required ? ' <span style="color:var(--red)">*</span>' : '');
        label.setAttribute('for', field.id);
        div.appendChild(label);
        const select = document.createElement('select');
        select.id = field.id;
        if (field.required) select.dataset.required = 'true';
        field.options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.text;
          select.appendChild(option);
        });
        div.appendChild(select);
        if (field.customInput) {
          const customWrap = document.createElement('div');
          customWrap.id = `${field.customInput.id}Wrap`;
          customWrap.style.display = 'none';
          customWrap.style.marginTop = '0.75rem';
          buildInputField({ ...field.customInput, required: false }, customWrap);
          div.appendChild(customWrap);

          const toggleCustomInput = () => {
            const customInput = document.getElementById(field.customInput.id);
            const isCustom = select.value === 'custom';
            customWrap.style.display = isCustom ? 'block' : 'none';
            if (customInput) {
              if (isCustom) {
                customInput.dataset.required = 'true';
              } else {
                customInput.removeAttribute('data-required');
                clearError(customInput, `err-${field.customInput.id}`);
              }
            }
            updatePreview();
          };

          select.addEventListener('change', toggleCustomInput);
          setTimeout(toggleCustomInput, 0);
        }
      } else {
        buildInputField(field, div);
      }

      parent.appendChild(div);
    }

    function buildInputField(field, container) {
      const label = document.createElement('label');
      label.setAttribute('for', field.id);
      label.innerHTML = field.label + (field.required ? ' <span style="color:var(--red)">*</span>' : '');
      container.appendChild(label);

      const input = field.type === 'textarea'
        ? document.createElement('textarea')
        : document.createElement('input');

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

      container.appendChild(input);

      const errDiv = document.createElement('div');
      errDiv.className = 'error-msg';
      errDiv.id = `err-${field.id}`;
      errDiv.textContent = field.id === 'cost' ? 'Enter a valid dollar amount.' : 'This field is required.';
      container.appendChild(errDiv);
    }

    // ─── Validation ──────────────────────────────────────────────────────────
    function validate() {
      let valid = true;
      const errors = [];

      const sender = document.getElementById('senderName');
      const type = document.getElementById('claimType').value;
      if (!['payment', 'followup'].includes(type) && !sender.value.trim()) {
        markError(sender, 'err-senderName', 'Required');
        errors.push('Your Name');
        valid = false;
      } else {
        clearError(sender, 'err-senderName');
      }

      document.querySelectorAll('[data-required="true"]').forEach(el => {
        const labelEl = document.querySelector(`label[for="${el.id}"]`);
        const labelText = labelEl ? labelEl.innerText.replace('*','').trim() : el.id;
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

      const banner = document.getElementById('validationBanner');
      if (!valid) {
        banner.style.display = 'block';
        banner.textContent = `Please fix the following fields: ${errors.join(', ')}.`;
      } else {
        banner.style.display = 'none';
      }

      return valid;
    }

    function markError(el, errId, message) {
      el.classList.add('error');
      const err = document.getElementById(errId);
      if (err) {
        if (message) err.textContent = message;
        err.style.display = 'block';
      }
    }

    function clearError(el, errId) {
      el.classList.remove('error');
      const err = document.getElementById(errId);
      if (err) err.style.display = 'none';
    }

    function clearValidation() {
      document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
      document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
      document.getElementById('validationBanner').style.display = 'none';
    }

    // ─── Formatting helpers ──────────────────────────────────────────────────
    function getValue(id, fallback = BLANK) {
      const value = document.getElementById(id)?.value.trim();
      return value || fallback;
    }

    function getCurrentGreetingWord() {
      const hour = new Date().getHours();
      if (hour < 12) return 'Morning';
      if (hour < 17) return 'Afternoon';
      return 'Evening';
    }

    function getGreetingWord() {
      return getCurrentGreetingWord();
    }

    function getClientName() {
      const selectedClient = document.getElementById('client')?.value.trim() || 'CenterPoint Energy';
      const customClient = document.getElementById('customClient')?.value.trim() || '';
      return selectedClient === 'custom' ? (customClient || BLANK) : selectedClient;
    }

    function isValidCurrency(raw) {
      const normalized = raw.replace(/[$,\s]/g, '');
      return /^\d+(\.\d{1,2})?$/.test(normalized) && Number(normalized) > 0;
    }

    function formatCost(raw) {
      const num = parseFloat(raw.replace(/[$,\s]/g, ''));
      if (isNaN(num)) return raw || BLANK;
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
      const parts = value.split('-').map(Number);
      if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function getDefaultDeadlineDate() {
      return moveWeekendForward(addDays(new Date(), 7));
    }

    function setDefaultDeadlineDate() {
      const deadlineInput = document.getElementById('deadlineDate');
      if (deadlineInput && !deadlineInput.value) {
        deadlineInput.value = toDateInputValue(getDefaultDeadlineDate());
      }
    }

    function normalizeDeadlineInput() {
      const deadlineInput = document.getElementById('deadlineDate');
      if (!deadlineInput?.value) return;
      const parsed = parseDateInputValue(deadlineInput.value);
      if (!parsed) return;
      deadlineInput.value = toDateInputValue(moveWeekendForward(parsed));
    }

    function getDeadlineDate() {
      const deadlineInput = document.getElementById('deadlineDate');
      const parsed = deadlineInput?.value ? parseDateInputValue(deadlineInput.value) : null;
      return formatShortDate(moveWeekendForward(parsed || getDefaultDeadlineDate()));
    }

    function getEscalationDueDate() {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      return formatShortDate(moveWeekendForward(dueDate));
    }

    function buildSubject(type, client, clientClaim, tccClaim, insuranceClaim = BLANK) {
      if (type === 'followup') return 'Follow Up Regarding Open Claim';
      if (type === 'payment') return `Payment Information | ${client} # ${clientClaim} | TCC # ${tccClaim}`;
      if (type === 'escalation') return `Claim Escalation | ${client} # ${clientClaim} | TCC # ${tccClaim}`;
      if (type === 'insurance') return `Insurance Claim # ${insuranceClaim} | ${client} # ${clientClaim} | TCC # ${tccClaim}`;
      return `${client} # ${clientClaim} | TCC # ${tccClaim}`;
    }

    // ─── Email composition ───────────────────────────────────────────────────
    function composeEmail() {
      const type = document.getElementById('claimType').value;
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
        return {
          subject,
          body: `To resolve this matter, please remit payment in the amount of ${cost}.\n\nIf paying by check, be sure to reference both the ${client} # ${clientClaim} and TCC File # ${tccClaim} on the check. Please provide images of the front and back of the check once mailed so we may verify payment has been issued and ensure quick application.\n\nPayment Instructions:\nPayee: ${client}\nMemo: ${client} #${clientClaim} | TCC #${tccClaim}\nMail To:\n${client}\nc/o The Claims Center LLC\nP.O. Box 270410\nMinneapolis, MN 55427\n\nOnline Payment:\nwww.theclaimscenter.com/payments\nIf proceeding with this method, please use master/reference #${tccClaim} to ensure quick resolution.`
        };
      }

      if (type === 'followup') {
        const followUpRecipient = getValue('followUpRecipient', '');
        const followUpGreeting = followUpRecipient ? `Good ${greetingWord} ${followUpRecipient},` : `Good ${greetingWord},`;
        const hasSoftDeadline = document.getElementById('hasSoftDeadline')?.checked;
        const deadlineText = hasSoftDeadline
          ? `\n\nIf possible, please send an update by ${getDeadlineDate()} so we can keep the claim moving forward.`
          : '';
        return {
          subject,
          body: `${followUpGreeting}\n\nI wanted to follow up on my previous message and see if you had a chance to review the information provided. Please let me know the current status or if there is anything else needed from our side to help move this toward resolution.${deadlineText}\n\nI appreciate your prompt attention and look forward to your response.`
        };
      }

      if (type === 'insurance') {
        const cost = formatCost(getValue('cost', ''));
        return {
          subject,
          body: `${greetingLine}\n\nI am reaching out to provide the supporting documents for the above referenced claim in the amount of ${cost}.\n\nPlease advise if you have any further questions or need any additional documentation for your review.\n\nRemittance Instructions:\nPayee: ${client}\nMemo: ${client} #${clientClaim} | TCC #${tccClaim}\nMail To: ${client}, c/o The Claims Center LLC, P.O. Box 270410, Minneapolis, MN 55427\nOnline Payment: www.theclaimscenter.com/payments\nPlease use TCC #${tccClaim} as the master/reference number for online payment.`
        };
      }

      if (type === 'escalation') {
        const dueDate = getDeadlineDate();
        return {
          subject,
          body: `Urgent Communication Required Regarding Claim Escalation\n\n${greetingLine}\n\nI am writing to express my concerns regarding our recent attempts to contact you. Despite multiple efforts, we have not received any response.\n\nDue to the lack of communication, this claim is due for escalation. Prompt communication is crucial to resolving this matter. If no response is received by ${dueDate} this claim will be sent for further recovery efforts.\n\nPlease contact us to resolve this claim and avoid unnecessary escalation.`
        };
      }

      const cost = formatCost(getValue('cost', ''));
      const damageStreet = getValue('damageStreet');
      const damageCity = getValue('damageCity');
      const hasLetter = document.getElementById('hasLetter')?.checked;
      const hasPhotos = document.getElementById('hasPhotos')?.checked;
      const hasReport = document.getElementById('hasReport')?.checked;
      const hasTicket = document.getElementById('hasTicket')?.checked;

      let body = `${greetingLine}\n\nMy name is ${senderName}, and I am contacting you on behalf of The Claims Center (TCC), a third-party administrator for ${client}.\nWe are reaching out regarding an open claim that our client has against you. The damage location is as follows:\n\nIncident Location:\n${damageStreet}\n${damageCity}\n\n`;

      if (type === 'gas') {
        const incidentDetails = getValue('incidentDetails');
        body += `Based on our client's investigation, it appears that ${incidentDetails}\n\n`;
        body += `The total cost of damages incurred is ${cost}.`;
        body += hasLetter
          ? ` Please see the attached demand letter.`
          : ` The demand letter is still being generated by our client; once it becomes available, we will provide it to you.`;
      } else {
        const locateTicket = getValue('locateTicket');
        const incidentDescription = getValue('incidentDescription');
        body += `Based on our review, the damage occurred during excavation work associated with ${incidentDescription} The submitted locate ticket for this work was Locate Ticket #${locateTicket} (attached for your reference). The submitted locate ticket was the most recent ticket filed in the area prior to the discovery of the damage by our client.\n\n`;
        body += `The total cost of repairs incurred by ${client} is ${cost}.`;
        body += hasLetter
          ? ` Please see the attached demand letter.`
          : ` The demand letter is still being generated by our client; once it becomes available, we will provide it to you.`;
      }

      const attachments = [];
      if (hasPhotos) attachments.push('damage photos');
      if (hasReport) attachments.push('damage report');
      if (hasTicket) attachments.push('locate ticket');
      if (attachments.length > 0) {
        body += `\n\nI have attached ${attachments.join(', ')} for your review.`;
      }

      body += `\n\nTo resolve this matter, please remit payment in the amount of ${cost}.\n\nIf paying by check, be sure to reference both the ${client} # ${clientClaim} and TCC File # ${tccClaim} on the check. Please provide images of the front and back of the check once mailed so we may verify payment has been issued and ensure quick application.\n\nPayment Instructions:\nPayee: ${client}\nMemo: ${client} #${clientClaim} | TCC #${tccClaim}\nMail To:\n${client}\nc/o The Claims Center LLC\nP.O. Box 270410\nMinneapolis, MN 55427\n\nOnline Payment:\nwww.theclaimscenter.com/payments\nIf proceeding with this method, please use master/reference #${tccClaim} to ensure quick resolution.\n\nWe have a limited window to resolve this claim. If no meaningful progress is made toward a resolution within that time, the claim may be escalated for further recovery efforts.\n\nPlease contact me with any questions.`;

      return { subject, body };
    }

    function updatePreview() {
      const { subject, body } = composeEmail();
      document.getElementById('subjectOutput').innerText = subject;
      document.getElementById('emailOutput').innerText = body;
    }

    function generateEmail() {
      if (!validate()) return;
      saveDefaults();
      updatePreview();
      document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ─── Defaults ────────────────────────────────────────────────────────────
    function getSavedDefaults() {
      try {
        return JSON.parse(localStorage.getItem(DEFAULTS_KEY)) || {};
      } catch {
        return {};
      }
    }

    function applySavedDefaultsToCurrentForm() {
      const defaults = getSavedDefaults();
      const sender = document.getElementById('senderName');
      if (sender && defaults.senderName && !sender.value) sender.value = defaults.senderName;

      const client = document.getElementById('client');
      if (client && defaults.client) client.value = defaults.client;
      const customClient = document.getElementById('customClient');
      if (customClient && defaults.customClient) customClient.value = defaults.customClient;
      client?.dispatchEvent(new Event('change'));
    }

    function saveDefaults() {
      const defaults = {
        senderName: document.getElementById('senderName')?.value.trim() || '',
        client: document.getElementById('client')?.value || '',
        customClient: document.getElementById('customClient')?.value.trim() || ''
      };
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
    }

    // ─── Copy to clipboard ───────────────────────────────────────────────────
    function showCopyFeedback(message) {
      const fb = document.getElementById('copyFeedback');
      fb.textContent = message;
      fb.classList.add('show');
      setTimeout(() => fb.classList.remove('show'), 2500);
    }

    function copySubject() {
      navigator.clipboard.writeText(document.getElementById('subjectOutput').innerText).then(() => {
        showCopyFeedback('Subject copied!');
      });
    }

    function copyEmail() {
      navigator.clipboard.writeText(document.getElementById('emailOutput').innerText).then(() => {
        showCopyFeedback('Body copied!');
      });
    }

    // ─── Reset ───────────────────────────────────────────────────────────────
    function resetForm() {
      document.getElementById('senderName').value = DEFAULT_SENDER_NAME;
      Object.keys(preserved).forEach(k => delete preserved[k]);
      renderForm({ applyDefaults: false });
    }



    // ─── AI Case Review ─────────────────────────────────────────────────────
    function renderSelectedFiles() {
      const input = document.getElementById('caseFiles');
      const list = document.getElementById('selectedFiles');
      if (!input.files || input.files.length === 0) {
        list.textContent = 'No files selected.';
        return;
      }
      list.innerHTML = Array.from(input.files).map(file => {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        return `<div>${escapeHtml(file.name)} · ${sizeMb} MB</div>`;
      }).join('');
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>'"]/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[char]));
    }

    function setAIStatus(message, type = 'info') {
      const status = document.getElementById('aiStatus');
      status.textContent = message;
      status.className = `status-box ${type}`;
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          resolve(result.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    async function analyzeCaseWithAI() {
      const input = document.getElementById('caseFiles');
      const files = Array.from(input.files || []);
      const notes = document.getElementById('caseNotes').value.trim();
      const claimType = document.getElementById('aiClaimType').value;

      if (!files.length && !notes) {
        setAIStatus('Upload at least one file or enter case notes before analyzing.', 'error');
        return;
      }

      const maxFileSize = 20 * 1024 * 1024;
      const oversized = files.find(file => file.size > maxFileSize);
      if (oversized) {
        setAIStatus(`${oversized.name} is larger than 20 MB. Remove it or reduce the file size.`, 'error');
        return;
      }

      setAIStatus('Analyzing case materials. Keep this page open until the review appears.', 'info');
      document.getElementById('aiCaseOutput').textContent = 'Review in progress...';

      try {
        const encodedFiles = await Promise.all(files.map(async file => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: await fileToBase64(file)
        })));

        const response = await fetch('/.netlify/functions/analyze-case', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claimType, notes, files: encodedFiles })
        });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          const looksLikeHtml = text.trim().startsWith('<');
          throw new Error(looksLikeHtml
            ? 'The Netlify AI function is not active. Deploy this version through Git or the Netlify CLI so netlify/functions/analyze-case.js is published.'
            : 'The AI function returned an unexpected response. Check the Netlify function deployment and logs.');
        }

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'The AI review failed.');

        document.getElementById('aiCaseOutput').textContent = result.analysis || 'No analysis returned.';
        setAIStatus('Case review completed. Verify the facts before sending or saving the analysis.', 'info');
      } catch (error) {
        document.getElementById('aiCaseOutput').innerHTML = '<span class="empty-preview">The AI case review could not be completed.</span>';
        setAIStatus(error.message || 'The AI review failed.', 'error');
      }
    }

    function clearAIReview() {
      document.getElementById('caseFiles').value = '';
      document.getElementById('caseNotes').value = '';
      renderSelectedFiles();
      document.getElementById('aiCaseOutput').innerHTML = '<span class="empty-preview">Upload files, add notes if needed, then click Analyze Case.</span>';
      document.getElementById('aiStatus').className = 'status-box';
      document.getElementById('aiStatus').textContent = '';
    }

    function copyAIReview() {
      navigator.clipboard.writeText(document.getElementById('aiCaseOutput').innerText).then(() => {
        showCopyFeedback('Case breakdown copied!');
      });
    }

    // ─── Init ────────────────────────────────────────────────────────────────
    document.addEventListener('input', event => {
      savePreserved();
      updatePreview();
    }, true);

    document.addEventListener('blur', event => {
      if (event.target.id === 'cost' && isValidCurrency(event.target.value)) {
        event.target.value = formatCost(event.target.value);
        savePreserved();
        updatePreview();
      }
      if (event.target.id === 'deadlineDate') {
        normalizeDeadlineInput();
        savePreserved();
        updatePreview();
      }
    }, true);

    document.addEventListener('change', () => {
      normalizeDeadlineInput();
      savePreserved();
      updatePreview();
      saveDefaults();
    });

    document.addEventListener('DOMContentLoaded', () => {
      const config = window.CLAIMS_GENERATOR_CONFIG || {};
      const versionEl = document.getElementById('appVersion');
      if (versionEl && config.version) versionEl.textContent = config.version;
      const defaults = getSavedDefaults();
      document.getElementById('senderName').value = defaults.senderName || DEFAULT_SENDER_NAME;
      renderForm();
    });
