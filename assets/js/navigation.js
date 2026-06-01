function getSelectedClaimType() {
  const claimType = document.getElementById('claimType');
  const settlementClaimType = document.getElementById('settlementClaimType');
  if (document.activeElement === settlementClaimType && settlementClaimType) {
    return settlementClaimType.value;
  }
  return claimType ? claimType.value : 'gas';
}

function syncClaimTypeSelects(value) {
  const claimType = document.getElementById('claimType');
  const settlementClaimType = document.getElementById('settlementClaimType');
  if (claimType) claimType.value = value;
  if (settlementClaimType) settlementClaimType.value = value;
}

function ensureSettlementPanel() {
  const existing = document.getElementById('settlementCalculatorPanel');
  if (existing) return existing;

  const mount = document.getElementById('settlementMount');
  if (!mount) return null;

  const panel = document.createElement('section');
  panel.className = 'ai-review-panel settlement-card';
  panel.id = 'settlementCalculatorPanel';
  panel.style.display = 'none';

  panel.innerHTML = `
    <div class="section" style="max-width: 380px; margin-bottom: 1rem;">
      <label for="settlementClaimType">Claim Type</label>
      <select id="settlementClaimType" onchange="handleClaimTypeChange()">
        <option value="gas">Gas Claim</option>
        <option value="streetlight">Streetlight Claim</option>
        <option value="escalation">Escalation of Claim</option>
        <option value="payment">Payment Information</option>
        <option value="followup">Follow Up</option>
        <option value="insurance">Insurance Adjuster</option>
        <option value="settlement" selected>Settlement Calculator</option>
      </select>
    </div>
    <h2>Settlement Calculator</h2>
    <p class="helper-text">Calculate a settlement offer using the total cost and a percentage reduction. Any reduction over 10% will display a SIF authority warning.</p>
    <div class="ai-review-grid">
      <div>
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
      </div>
      <div>
        <div class="preview-label">Settlement Summary</div>
        <div class="subject-box">Reduction Amount: <span id="settlementReductionAmount">$0.00</span><br />Settlement Offer: <span id="settlementOfferAmount">$0.00</span></div>
        <div class="preview-label">Settlement Statement</div>
        <div id="settlementStatement">Enter a total cost and percentage reduction to generate settlement language.</div>
        <div class="btn-row">
          <button type="button" class="btn-copy" onclick="copySettlementStatement()">Copy Settlement Statement</button>
        </div>
      </div>
    </div>
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
  const claimWorkspace = document.getElementById('claimWorkspace');
  const settlementPanel = selectedType === 'settlement' ? ensureSettlementPanel() : document.getElementById('settlementCalculatorPanel');

  syncClaimTypeSelects(selectedType);

  if (selectedType === 'settlement') {
    if (claimWorkspace) claimWorkspace.style.display = 'none';
    if (settlementPanel) settlementPanel.style.display = 'block';
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
  const claimType = document.getElementById('claimType');
  if (claimType && claimType.value === 'settlement') {
    handleClaimTypeChange();
  }
});
