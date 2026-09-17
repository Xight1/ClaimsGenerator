const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const appSource = fs.readFileSync(path.join(projectRoot, 'assets/js/app.js'), 'utf8');

function createApp(initialValues) {
  const elements = Object.fromEntries(
    Object.entries(initialValues).map(([id, properties]) => [
      id,
      {
        checked: false,
        value: '',
        ...properties
      }
    ])
  );

  const context = vm.createContext({
    console,
    document: {
      addEventListener() {},
      getElementById(id) {
        return elements[id] || null;
      }
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {}
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    window: {}
  });

  vm.runInContext(
    `${appSource}\nglobalThis.__app = { composeEmail, ensureSentenceEnding, fields };`,
    context
  );

  return { app: context.__app, elements };
}

function commonValues(type) {
  return {
    claimType: { value: type },
    senderName: { value: 'Kevin' },
    recipient: { value: 'Kimberly' },
    client: { value: 'CenterPoint Energy' },
    customClient: { value: '' },
    clientClaim: { value: 'SR2026275140-RR' },
    tccClaim: { value: '2MN380316' },
    insuranceClaim: { value: '' },
    cost: { value: '1554.91' },
    damageStreet: { value: '24500 Cinco Terrace Dr' },
    damageCity: { value: 'Katy, TX' },
    hasLetter: { checked: true },
    hasPhotos: { checked: false },
    hasReport: { checked: false },
    hasTicket: { checked: true }
  };
}

function collectFieldIds(definitions) {
  return definitions.flatMap((field) => {
    if (field.type === 'row') return collectFieldIds(field.fields);
    if (field.type === 'checkbox-group') return field.options.map((option) => option.id);
    if (!field.id) return [];
    return field.customInput ? [field.id, field.customInput.id] : [field.id];
  });
}

test('Gas and Streetlight retain their editable fields', () => {
  const { app } = createApp(commonValues('gas'));

  assert.deepEqual(Array.from(collectFieldIds(app.fields.gas)), [
    'recipient',
    'client',
    'customClient',
    'clientClaim',
    'tccClaim',
    'cost',
    'damageStreet',
    'damageCity',
    'incidentDetails',
    'hasLetter',
    'hasPhotos',
    'hasReport',
    'hasTicket'
  ]);
  assert.deepEqual(Array.from(collectFieldIds(app.fields.streetlight)), [
    'recipient',
    'client',
    'customClient',
    'clientClaim',
    'tccClaim',
    'cost',
    'damageStreet',
    'damageCity',
    'locateTicket',
    'incidentDescription',
    'hasLetter',
    'hasPhotos',
    'hasReport',
    'hasTicket'
  ]);
});

test('Gas email uses editable values and includes the dispute path', () => {
  const initialValues = {
    ...commonValues('gas'),
    incidentDetails: {
      value: 'the contractor struck the gas main while performing excavation at the listed address'
    }
  };
  const { app, elements } = createApp(initialValues);
  const valuesBeforeCompose = JSON.stringify(elements);
  const { body } = app.composeEmail();

  assert.match(body, /^Good (morning|afternoon|evening), Kimberly,/);
  assert.match(body, /open claim involving damage to a gas facility/);
  assert.match(body, /damage appears to have occurred when the contractor struck the gas main/);
  assert.match(body, /I have attached the locate ticket for your review\./);
  assert.match(body, /If you dispute this claim, please reply with the basis of your dispute/);
  assert.match(body, /payment, dispute information, or another meaningful response/);
  assert.equal(JSON.stringify(elements), valuesBeforeCompose);
});

test('Streetlight email preserves punctuation and uses editable values', () => {
  const initialValues = {
    ...commonValues('streetlight'),
    locateTicket: { value: '2573761754' },
    incidentDescription: { value: 'directional boring efforts.' }
  };
  const { app, elements } = createApp(initialValues);
  const valuesBeforeCompose = JSON.stringify(elements);
  const { body } = app.composeEmail();

  assert.match(body, /^Good (morning|afternoon|evening), Kimberly,/);
  assert.match(body, /open claim involving damage to a streetlight/);
  assert.match(body, /associated with directional boring efforts\. Locate Ticket #2573761754/);
  assert.doesNotMatch(body, /efforts\.\./);
  assert.match(body, /most recent ticket filed for the area before our client discovered the damage/);
  assert.match(body, /If you dispute this claim, please reply with the basis of your dispute/);
  assert.equal(JSON.stringify(elements), valuesBeforeCompose);
});

test('Insurance pending checkbox is optional and specific to Insurance Adjuster', () => {
  const { app } = createApp(commonValues('insurance'));
  const field = app.fields.insurance.find(field => field.id === 'insuranceDemandPending');
  assert.equal(field.type, 'checkbox');
  assert.equal(field.label, 'Demand letter pending');
  assert.equal(Boolean(field.required), false);
  for (const [type, definitions] of Object.entries(app.fields)) {
    if (type !== 'insurance') assert.equal(collectFieldIds(definitions).includes(field.id), false);
  }
});

test('Insurance pending text toggles without changing subject or other body text', () => {
  const { app, elements } = createApp({
    ...commonValues('insurance'),
    insuranceClaim: { value: 'ins-123' },
    insuranceDemandPending: { checked: false }
  });
  const original = app.composeEmail();
  const pendingText = '\n\nI am currently pending the demand letter, but can provide it once it becomes available.';
  assert.doesNotMatch(original.body, /pending the demand letter/);
  assert.match(original.body, /claim in the amount of \$1,554\.91\./);
  assert.match(original.subject, /Your Claim # INS-123/);
  elements.insuranceDemandPending.checked = true;
  const valuesBeforeCompose = JSON.stringify(elements);
  const pending = app.composeEmail();
  assert.equal(pending.subject, original.subject);
  assert.equal(pending.body.split(pendingText).length, 2);
  assert.equal(pending.body.replace(pendingText, ''), original.body);
  assert.equal(JSON.stringify(elements), valuesBeforeCompose);
  elements.insuranceDemandPending.checked = false;
  assert.deepEqual(app.composeEmail(), original);
  delete elements.insuranceDemandPending;
  assert.deepEqual(app.composeEmail(), original);
});

for (const type of ['gas', 'streetlight', 'escalation', 'payment', 'insurance']) {
  test(`${type} offers Northwestern Energy and uses it in generated output`, () => {
    const { app } = createApp({
      ...commonValues(type),
      client: { value: 'Northwestern Energy' }
    });
    const client = app.fields[type].find(field => field.id === 'client');
    assert.deepEqual(Array.from(client.options, option => option.value), [
      'CenterPoint Energy', 'Delta Utilities', 'One Gas', 'Northwestern Energy', 'custom'
    ]);
    assert.equal(client.options.find(option => option.value === 'Northwestern Energy').text, 'Northwestern Energy');
    const { subject, body } = app.composeEmail();
    assert.match(subject, /Northwestern Energy # SR2026275140-RR/);
    assert.doesNotMatch(subject + body, /CenterPoint Energy/);
    if (type !== 'escalation') {
      assert.match(body, /Payee: Northwestern Energy/);
      assert.match(body, /Mail To:\nNorthwestern Energy\nc\/o The Claims Center LLC/);
    }
  });
}

test('Navigation tabs and claim selector use the requested order', () => {
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const navigation = html.match(/<nav class="topbar-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
  const selector = html.match(/<select id="claimType"[^>]*>([\s\S]*?)<\/select>/)[1];
  const expectedOrder = ['gas', 'streetlight', 'followup', 'escalation', 'settlement', 'payment', 'insurance', 'demand'];
  assert.deepEqual(Array.from(navigation.matchAll(/setClaimTypeFromShortcut\('([^']+)'\)/g), match => match[1]), expectedOrder);
  assert.deepEqual(Array.from(selector.matchAll(/<option value="([^"]+)"/g), match => match[1]), expectedOrder);
});

test('Shortened tab labels match their selected-template labels', () => {
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  const navigation = html.match(/<nav class="topbar-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
  const tabs = Object.fromEntries(Array.from(navigation.matchAll(/setClaimTypeFromShortcut\('([^']+)'\)"[^>]*>([^<]+)<\/button>/g), match => [match[1], match[2]]));
  const options = Object.fromEntries(Array.from(html.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g), match => [match[1], match[2]]));
  for (const [type, label] of Object.entries({ gas: 'Gas', payment: 'Payment Info.', insurance: 'Insurance Adj.', demand: 'Demand Req.' })) {
    assert.equal(tabs[type], label);
    assert.equal(options[type], label);
  }
  assert.match(html, /<strong>Gas<\/strong>/);
  const { app } = createApp(commonValues('payment'));
  assert.match(app.composeEmail().subject, /^Payment Information \|/);
});

test('Current version matches the Beta release date', () => {
  const expectedVersion = 'v2026-09-17 - Beta';
  const config = fs.readFileSync(path.join(projectRoot, 'assets/js/config.js'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

  assert.match(config, new RegExp(expectedVersion));
  assert.match(html, new RegExp(expectedVersion));
});
