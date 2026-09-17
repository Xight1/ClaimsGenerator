const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/settlement.js'), 'utf8');

function createCalculator() {
  const ids = ['settlementTotalCost', 'settlementReductionPercent', 'includeSettlementExpiration',
    'settlementReductionAmount', 'settlementOfferAmount', 'settlementWarning',
    'settlementStatement', 'settlementOriginalAmount', 'copySettlementBtn', 'settlementCopyFeedback'];
  const elements = Object.fromEntries(ids.map(id => [id, {
    value: '', textContent: '', checked: false, disabled: true, style: {},
    classList: { add() {}, remove() {} }
  }]));
  const copied = [];
  const context = vm.createContext({
    document: { getElementById: id => elements[id] },
    navigator: { clipboard: { writeText(text) { copied.push(text); return Promise.resolve(); } } },
    console,
    setTimeout() {},
    addDays(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
  });
  vm.runInContext(source, context);
  function calculate(total, reduction) {
    elements.settlementTotalCost.value = total;
    elements.settlementReductionPercent.value = reduction;
    return context.calculateSettlement();
  }
  return { elements, context, copied, calculate };
}

test('valid currency, percentages, authority warning, and expiration', () => {
  const { elements, calculate } = createCalculator();
  assert.equal(calculate(' $1,000.00 ', '10%'), true);
  assert.equal(elements.settlementOfferAmount.textContent, '$900.00');
  assert.equal(elements.settlementReductionAmount.textContent, '$100.00');
  assert.equal(elements.settlementWarning.style.display, 'none');
  assert.equal(elements.copySettlementBtn.disabled, false);
  elements.includeSettlementExpiration.checked = true;
  assert.equal(calculate('1000', '10.5'), true);
  assert.equal(elements.settlementOfferAmount.textContent, '$895.00');
  assert.match(elements.settlementWarning.textContent, /exceeds 10%/);
  assert.match(elements.settlementStatement.textContent, /remain open through/);
  assert.equal(calculate('1000', '0'), true);
  assert.equal(elements.settlementOfferAmount.textContent, '$1,000.00');
  assert.equal(calculate('1000', '100'), true);
  assert.equal(elements.settlementOfferAmount.textContent, '$0.00');
});

for (const [total, reduction] of [
  ['-1000', '10'], ['1000', '-10'], ['', '10'], ['1000', ''],
  ['0', '10'], ['abc', '10'], ['1000', 'abc'], ['1000', '101'],
  ['1,00', '10'], ['12.34.56', '10'], ['1000', '1.2.3'],
  ['1000xyz', '10'], ['1e3', '10'], ['1000', '1,0'],
  ['1000.001', '10'], ['9'.repeat(400), '10']
]) {
  test(`invalid total/reduction ${total.slice(0, 20)} / ${reduction} clears and blocks the offer`, () => {
    const { elements, context, copied, calculate } = createCalculator();
    calculate('1000', '20');
    assert.equal(calculate(total, reduction), false);
    assert.equal(elements.settlementOriginalAmount.textContent, '—');
    assert.equal(elements.settlementOfferAmount.textContent, 'Invalid input');
    assert.equal(elements.settlementReductionAmount.textContent, 'Invalid input');
    assert.doesNotMatch(elements.settlementStatement.textContent, /\$800|fully resolved/);
    assert.doesNotMatch(elements.settlementWarning.textContent, /SIF authority/);
    assert.equal(elements.copySettlementBtn.disabled, true);
    context.copySettlementStatement();
    assert.deepEqual(copied, []);
    assert.equal(calculate('2000', '10'), true);
    assert.equal(elements.settlementOfferAmount.textContent, '$1,800.00');
    assert.equal(elements.copySettlementBtn.disabled, false);
  });
}

test('copy recalculates current values and reset blocks copying', async () => {
  const { elements, context, copied, calculate } = createCalculator();
  calculate('1000', '10');
  elements.settlementTotalCost.value = '2000';
  context.copySettlementStatement();
  await Promise.resolve();
  assert.equal(copied.length, 1);
  assert.match(copied[0], /\$1,800.00/);
  context.resetSettlementCalculator();
  assert.equal(elements.settlementTotalCost.value, '');
  assert.equal(elements.settlementReductionPercent.value, '');
  assert.equal(elements.settlementOriginalAmount.textContent, '—');
  assert.equal(elements.copySettlementBtn.disabled, true);
  assert.doesNotMatch(elements.settlementStatement.textContent, /fully resolved/);
  context.copySettlementStatement();
  assert.equal(copied.length, 1);
});

test('settlement panel starts with copying disabled', () => {
  const navigation = fs.readFileSync(path.join(__dirname, '../assets/js/navigation.js'), 'utf8');
  assert.match(navigation, /id="copySettlementBtn" disabled/);
});
