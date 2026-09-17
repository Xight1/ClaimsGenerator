function formatSettlementCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "$0.00";
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatExpirationDate(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function parseSettlementInput(raw, isCurrency = false) {
  const text = String(raw ?? '').trim();
  const pattern = isCurrency
    ? /^\$?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/
    : /^\d+(?:\.\d+)?%?$/;
  if (!pattern.test(text)) return NaN;
  const value = Number(text.replace(/[$,%]/g, ''));
  return Number.isFinite(value) ? value : NaN;
}

function calculateSettlement() {
  const totalCostInput = document.getElementById("settlementTotalCost");
  const reductionInput = document.getElementById("settlementReductionPercent");
  const includeExpirationInput = document.getElementById("includeSettlementExpiration");
  const reductionAmountOutput = document.getElementById("settlementReductionAmount");
  const offerAmountOutput = document.getElementById("settlementOfferAmount");
  const warningOutput = document.getElementById("settlementWarning");
  const statementOutput = document.getElementById("settlementStatement");

  const totalCost = parseSettlementInput(totalCostInput?.value, true);
  const reductionPercent = parseSettlementInput(reductionInput?.value);
  const copyButton = document.getElementById('copySettlementBtn');
  const originalAmountOutput = document.getElementById('settlementOriginalAmount');
  const feedback = document.getElementById('settlementCopyFeedback');
  if (feedback) feedback.classList.remove('show');

  if (!Number.isFinite(totalCost) || totalCost <= 0 || !Number.isFinite(reductionPercent) || reductionPercent < 0 || reductionPercent > 100) {
    if (originalAmountOutput) originalAmountOutput.textContent = "—";
    if (reductionAmountOutput) reductionAmountOutput.textContent = "Invalid input";
    if (offerAmountOutput) offerAmountOutput.textContent = "Invalid input";
    if (warningOutput) {
      warningOutput.textContent = "Enter a total greater than $0 (up to two decimal places) and a reduction from 0 to 100%.";
      warningOutput.style.display = "block";
    }
    if (statementOutput) statementOutput.textContent = "Enter valid amounts to generate settlement language.";
    if (copyButton) copyButton.disabled = true;
    return false;
  }

  const reductionAmount = totalCost * (reductionPercent / 100);
  const settlementOffer = Math.max(totalCost - reductionAmount, 0);

  if (originalAmountOutput) originalAmountOutput.textContent = formatSettlementCurrency(totalCost);
  if (reductionAmountOutput) reductionAmountOutput.textContent = formatSettlementCurrency(reductionAmount);
  if (offerAmountOutput) offerAmountOutput.textContent = formatSettlementCurrency(settlementOffer);

  if (warningOutput) {
    if (reductionPercent > 10) {
      warningOutput.textContent = "Warning: This settlement reduction exceeds 10% SIF authority. Additional approval may be required before extending this offer.";
      warningOutput.style.display = "block";
    } else {
      warningOutput.textContent = "";
      warningOutput.style.display = "none";
    }
  }

  let statement = "In the interest of resolving this matter amicably, we are willing to offer a settlement in the amount of " + formatSettlementCurrency(settlementOffer) + ".\n\n";
  statement += "Please advise whether this settlement is acceptable and whether you wish to proceed. Upon acceptance of this offer and receipt and clearance of payment, this claim will be considered fully resolved and closed, and no further action will be taken regarding this matter.";

  if (includeExpirationInput?.checked) {
    const expirationDate = formatExpirationDate(addDays(new Date(), 7));
    statement += "\n\nThis settlement offer will remain open through " + expirationDate + ". If we do not receive your acceptance by that date, this offer will automatically expire and be considered withdrawn. Neither our office nor our client is obligated to renew, extend, or reissue this offer.";
  }

  if (statementOutput) statementOutput.textContent = statement;
  if (copyButton) copyButton.disabled = false;
  return true;
}

function resetSettlementCalculator() {
  const totalCostInput = document.getElementById("settlementTotalCost");
  const reductionInput = document.getElementById("settlementReductionPercent");
  const includeExpirationInput = document.getElementById("includeSettlementExpiration");
  const reductionAmountOutput = document.getElementById("settlementReductionAmount");
  const offerAmountOutput = document.getElementById("settlementOfferAmount");
  const warningOutput = document.getElementById("settlementWarning");
  const statementOutput = document.getElementById("settlementStatement");

  if (totalCostInput) totalCostInput.value = "";
  if (reductionInput) reductionInput.value = "";
  if (includeExpirationInput) includeExpirationInput.checked = false;
  const originalAmountOutput = document.getElementById("settlementOriginalAmount");
  if (originalAmountOutput) originalAmountOutput.textContent = "—";
  if (reductionAmountOutput) reductionAmountOutput.textContent = "$0.00";
  if (offerAmountOutput) offerAmountOutput.textContent = "$0.00";
  if (warningOutput) {
    warningOutput.textContent = "";
    warningOutput.style.display = "none";
  }
  if (statementOutput) statementOutput.textContent = "Enter a total cost and percentage reduction to generate settlement language.";
  const copyButton = document.getElementById('copySettlementBtn');
  if (copyButton) copyButton.disabled = true;
  document.getElementById('settlementCopyFeedback')?.classList.remove('show');
}

function copySettlementStatement() {
  if (!calculateSettlement()) return;
  const statement = document.getElementById("settlementStatement").textContent;
  navigator.clipboard.writeText(statement).then(() => {
    const feedback = document.getElementById("settlementCopyFeedback");
    if (!feedback) return;
    feedback.classList.add("show");
    setTimeout(() => feedback.classList.remove("show"), 1400);
  }).catch((err) => console.error('Failed to copy:', err));
}
