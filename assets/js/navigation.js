function getSelectedClaimType() {
  const claimType = (typeof getCached === 'function' ? getCached('claimType') : document.getElementById('claimType'));
  const settlementClaimType = (typeof getCached === 'function' ? getCached('settlementClaimType') : document.getElementById('settlementClaimType'));
  if (document.activeElement === settlementClaimType && settlementClaimType) {
    return settlementClaimType.value;
  }
  return claimType ? claimType.value : 'gas';
}

function syncClaimTypeSelects(value) {
  const claimType = (typeof getCached === 'function' ? getCached('claimType') : document.getElementById('claimType'));
  const settlementClaimType = (typeof getCached === 'function' ? getCached('settlementClaimType') : document.getElementById('settlementClaimType'));
  if (claimType) claimType.value = value;
  if (settlementClaimType) settlementClaimType.value = value;
}

function getTemplateLabel(value) {
  const claimType = (typeof getCached === 'function' ? getCached('claimType') : document.getElementById('claimType'));
  const option = claimType?.querySelector(`option[value="${value}"]`);
  return option?.textContent || 'Gas Claim';
}

function updateSelectedTemplateIndicator(value) {
  const indicator = (typeof getCached === 'function' ? getCached('selectedTemplateIndicator') : document.getElementById('selectedTemplateIndicator'));
  if (!indicator) return;
  const selectedLabel = getTemplateLabel(value);
  const labelSpan = document.createElement('span');
  labelSpan.textContent = 'Selected Template';
  const valueStrong = document.createElement('strong');
  valueStrong.textContent = selectedLabel;
  indicator.replaceChildren(labelSpan, valueStrong);
}

function updateActiveTaskbar(value) {
  document.querySelectorAll('.topbar-nav button').forEach((button) => {
    const action = button.getAttribute('onclick') || '';
    const isActive = action.includes(`'${value}'`) || action.includes(`"${value}"`);
    button.classList.toggle('active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function ensureSettlementPanel() {
  const existing = (typeof getCached === 'function' ? getCached('settlementCalculatorPanel') : document.getElementById('settlementCalculatorPanel'));
  if (existing) return existing;

  const mount = (typeof getCached === 'function' ? getCached('settlementMount') : document.getElementById('settlementMount'));
  if (!mount) return null;

  const panel = document.createElement('section');
  panel.className = 'workspace settlement-workspace';
  panel.id = 'settlementCalculatorPanel';
  panel.style.display = 'none';

  panel.innerHTML = `
    <section class="form-panel settlement-form-panel">
      <div class="section-heading settlement-title">Settlement Calculator</div>
      <p class="helper-text">Calculate a settlement offer using the total cost and a percentage reduction. Any reduction over 10% will display a SIF authority warning.</p>
      <div class="section">
        <label for="settlementTotalCost">Total Cost</label>
        <div class="input-symbol-wrap">
          <span class="input-prefix">$</span>
          <input type="text" id="settlementTotalCost" inputmode="decimal" placeholder="e.g. 10000" />
        </div>
      </div>
      <div class="section">
        <label for="settlementReductionPercent">Percentage Reduction</label>
        <div class="input-symbol-wrap">
          <input type="text" id="settlementReductionPercent" inputmode="decimal" placeholder="e.g. 10" />
          <span class="input-suffix">%</span>
        </div>
      </div>
      <label class="checkbox-inline">
        <input type="checkbox" id="includeSettlementExpiration" />
        Include 7 day expiration language
      </label>
      <div id="settlementWarning" class="status-box error" style="display:none;"></div>
      <div class="btn-row">
        <button type="button" class="btn-danger" id="resetSettlementBtn">Reset</button>
      </div>
    </section>

    <section class="preview-panel settlement-preview-panel">
      <div class="preview-sticky">
        <div class="preview-label">Settlement Summary</div>
        <div class="subject-box">Original Amount: <span id="settlementOriginalAmount">—</span><br />Reduction Amount: <span id="settlementReductionAmount">$0.00</span><br />Settlement Offer: <span id="settlementOfferAmount">$0.00</span></div>
        <div class="preview-label">Settlement Statement</div>
        <div id="settlementStatement">Enter a total cost and percentage reduction to generate settlement language.</div>
        <div class="btn-row preview-actions settlement-actions">
          <button type="button" class="btn-primary" id="copySettlementBtn">Copy Settlement Statement</button>
          <span class="copy-feedback" id="settlementCopyFeedback">Copied!</span>
        </div>
      </div>
    </section>
  `;

  mount.replaceChildren(panel);
  return panel;
}

function ensureSettlementScriptLoaded() {
  if (typeof calculateSettlement === 'function') return Promise.resolve();
  if (window.__claimsSettlementLoadPromise) return window.__claimsSettlementLoadPromise;

  window.__claimsSettlementLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'assets/js/settlement.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      window.__claimsSettlementLoadPromise = null;
      reject(new Error('Failed to load settlement.js'));
    };
    document.head.appendChild(script);
  });

  return window.__claimsSettlementLoadPromise;
}

function handleClaimTypeChange() {
  const selectedType = getSelectedClaimType();
  const claimWorkspace = (typeof getCached === 'function' ? getCached('claimWorkspace') : document.getElementById('claimWorkspace'));
  const settlementPanel = selectedType === 'settlement' ? ensureSettlementPanel() : (typeof getCached === 'function' ? getCached('settlementCalculatorPanel') : document.getElementById('settlementCalculatorPanel'));

  syncClaimTypeSelects(selectedType);
  updateSelectedTemplateIndicator(selectedType);
  updateActiveTaskbar(selectedType);

  if (selectedType === 'settlement') {
    if (claimWorkspace) claimWorkspace.style.display = 'none';
    if (settlementPanel) settlementPanel.style.display = 'grid';
    ensureSettlementScriptLoaded().then(() => {
      const totalCostInput = document.getElementById('settlementTotalCost');
      const reductionInput = document.getElementById('settlementReductionPercent');
      const expirationInput = document.getElementById('includeSettlementExpiration');
      const resetBtn = document.getElementById('resetSettlementBtn');
      const copyBtn = document.getElementById('copySettlementBtn');
      if (settlementPanel && !settlementPanel.dataset.listenersAttached) {
        if (totalCostInput) totalCostInput.addEventListener('input', () => calculateSettlement());
        if (reductionInput) reductionInput.addEventListener('input', () => calculateSettlement());
        if (expirationInput) expirationInput.addEventListener('change', () => calculateSettlement());
        if (resetBtn) resetBtn.addEventListener('click', () => resetSettlementCalculator());
        if (copyBtn) copyBtn.addEventListener('click', () => copySettlementStatement());
        settlementPanel.dataset.listenersAttached = 'true';
      }
      if (totalCostInput && totalCostInput.value.trim() !== '') {
        calculateSettlement();
      }
    }).catch((err) => {
      console.error('Settlement script load failed:', err);
      const stmt = document.getElementById('settlementStatement');
      if (stmt) stmt.textContent = 'Calculator unavailable. Please reload the page.';
    });
    return;
  }

  if (settlementPanel) settlementPanel.style.display = 'none';
  if (claimWorkspace) claimWorkspace.style.display = 'grid';
  if (typeof renderForm === 'function') renderForm();
  newEmailFiles.length = 0;
  replyFiles.length = 0;
  renderNewEmailFileList();
  renderReplyFileList();
}

document.addEventListener('DOMContentLoaded', () => {
  const claimType = (typeof getCached === 'function' ? getCached('claimType') : document.getElementById('claimType'));
  const initialType = claimType?.value || 'gas';
  updateSelectedTemplateIndicator(initialType);
  updateActiveTaskbar(initialType);
  if (claimType && claimType.value === 'settlement') {
    handleClaimTypeChange();
  }
});
