function formatSettlementCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "$0.00";
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatExpirationDate(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function calculateSettlement() {
  const totalCostInput = document.getElementById("settlementTotalCost");
  const reductionInput = document.getElementById("settlementReductionPercent");
  const includeExpirationInput = document.getElementById("includeSettlementExpiration");
  const reductionAmountOutput = document.getElementById("settlementReductionAmount");
  const offerAmountOutput = document.getElementById("settlementOfferAmount");
  const warningOutput = document.getElementById("settlementWarning");
  const statementOutput = document.getElementById("settlementStatement");

  const totalCost = Number.parseFloat(totalCostInput.value || "0");
  const reductionPercent = Number.parseFloat(reductionInput.value || "0");
  const validTotal = Number.isFinite(totalCost) && totalCost >= 0 ? totalCost : 0;
  const validReduction = Number.isFinite(reductionPercent) && reductionPercent >= 0 ? reductionPercent : 0;
  const reductionAmount = validTotal * (validReduction / 100);
  const settlementOffer = Math.max(validTotal - reductionAmount, 0);

  reductionAmountOutput.textContent = formatSettlementCurrency(reductionAmount);
  offerAmountOutput.textContent = formatSettlementCurrency(settlementOffer);

  if (validReduction > 10) {
    warningOutput.textContent = "Warning: This settlement reduction exceeds 10% SIF authority. Additional approval may be required before extending this offer.";
    warningOutput.style.display = "block";
  } else {
    warningOutput.textContent = "";
    warningOutput.style.display = "none";
  }

  let statement = "In the interest of resolving this matter amicably, we are willing to offer a settlement in the amount of " + formatSettlementCurrency(settlementOffer) + ".\n\n";
  statement += "Please advise whether this settlement is acceptable and whether you wish to proceed. Upon acceptance of this offer and receipt and clearance of payment, this claim will be considered fully resolved and closed, and no further action will be taken regarding this matter.";

  if (includeExpirationInput.checked) {
    const expirationDate = formatExpirationDate(addDays(new Date(), 7));
    statement += "\n\nThis settlement offer will remain open through " + expirationDate + ". If we do not receive your acceptance by that date, this offer will automatically expire and be considered withdrawn. Neither our office nor our client is obligated to renew, extend, or reissue this offer.";
  }

  statementOutput.textContent = statement;
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
  if (reductionAmountOutput) reductionAmountOutput.textContent = "$0.00";
  if (offerAmountOutput) offerAmountOutput.textContent = "$0.00";
  if (warningOutput) {
    warningOutput.textContent = "";
    warningOutput.style.display = "none";
  }
  if (statementOutput) statementOutput.textContent = "Enter a total cost and percentage reduction to generate settlement language.";
}

function copySettlementStatement() {
  const statement = document.getElementById("settlementStatement").textContent;
  navigator.clipboard.writeText(statement).then(() => {
    const feedback = document.getElementById("settlementCopyFeedback");
    if (!feedback) return;
    feedback.classList.add("show");
    setTimeout(() => feedback.classList.remove("show"), 1400);
  }).catch((err) => console.error('Failed to copy:', err));
}

