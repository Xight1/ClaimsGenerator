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
  assert.match(body, /open claim involving damage to gas infrastructure/);
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

test('Current version is marked Beta with today’s date', () => {
  const expectedVersion = 'v2026-07-28 - Beta';
  const config = fs.readFileSync(path.join(projectRoot, 'assets/js/config.js'), 'utf8');
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

  assert.match(config, new RegExp(expectedVersion));
  assert.match(html, new RegExp(expectedVersion));
});
