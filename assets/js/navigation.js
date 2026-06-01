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

function handleClaimTypeChange() {
  const selectedType = getSelectedClaimType();
  const claimWorkspace = document.getElementById('claimWorkspace');
  const settlementPanel = document.getElementById('settlementCalculatorPanel');

  syncClaimTypeSelects(selectedType);

  if (selectedType === 'settlement') {
    if (claimWorkspace) claimWorkspace.style.display = 'none';
    if (settlementPanel) settlementPanel.style.display = 'block';
    if (typeof calculateSettlement === 'function') calculateSettlement();
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
