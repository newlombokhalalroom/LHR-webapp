// ============================================================
// INT-IT3-02: Validasi Pesanan oleh Agen (US-11)
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('10 - Validasi Pesanan oleh Agen (US-11)', () => {
  let agentToken = null;
  let currentOrderId = null;

  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  const agentEmail = 'rizkitour12@gmail.com';
  const agentPw = 'sahabat11';

  before(() => {
    // 1. Baca Order ID yang diteruskan dari test sebelumnya
    cy.readFile('cypress/fixtures/tempOrder.json').then((data) => {
      currentOrderId = data.orderId;
    });

    // 2. Login Agen
    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: { usernameOrEmail: agentEmail, password: agentPw },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(201);
      agentToken = res.body.result.accessToken;
    });
  });

  it('Agen menyetujui pesanan masuk dan mengubah status menjadi progress', () => {
    expect(currentOrderId).to.not.be.null; // Pastikan Order ID ada

    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/${currentOrderId}/confirmation/progress`,
      headers: { Authorization: `Bearer ${agentToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
    });
  });
});
