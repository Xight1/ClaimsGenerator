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
  indicator.innerHTML = `<span>Selected Template</span><strong>${selectedLabel}</strong>`;
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
        <input type="text" id="settlementTotalCost" inputmode="decimal" placeholder="e.g. 10000" oninput="calculateSettlement()" />
      </div>
      <div class="section">
        <label for="settlementReductionPercent">Percentage Reduction</label>
        <input type="text" id="settlementReductionPercent" inputmode="decimal" placeholder="e.g. 10" oninput="calculateSettlement()" />
      </div>
      <label class="checkbox-inline">
        <input type="checkbox" id="includeSettlementExpiration" checked onchange="calculateSettlement()" />
        Include 7 day expiration language
      </label>
      <div id="settlementWarning" class="status-box error" style="display:none;"></div>
    </section>

    <section class="preview-panel settlement-preview-panel">
      <div class="preview-sticky">
        <div class="preview-label">Settlement Summary</div>
        <div class="subject-box">Reduction Amount: <span id="settlementReductionAmount">$0.00</span><br />Settlement Offer: <span id="settlementOfferAmount">$0.00</span></div>
        <div class="preview-label">Settlement Statement</div>
        <div id="settlementStatement">Enter a total cost and percentage reduction to generate settlement language.</div>
        <div class="btn-row preview-actions settlement-actions">
          <button type="button" class="btn-primary" onclick="copySettlementStatement()">Copy Settlement Statement</button>
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
    script.onerror = () => reject(new Error('Failed to load settlement.js'));
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
      if (typeof calculateSettlement === 'function') calculateSettlement();
    }).catch(() => {});
    return;
  }

  if (settlementPanel) settlementPanel.style.display = 'none';
  if (claimWorkspace) claimWorkspace.style.display = 'grid';
  if (typeof renderForm === 'function') renderForm();
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
