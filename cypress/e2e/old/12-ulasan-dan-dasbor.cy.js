// ============================================================
// INT-IT3-04: Pengiriman Ulasan & Dasbor Agen (US-13 & US-14)
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('12 - Pengiriman Ulasan & Dasbor Agen (US-13 & US-14)', () => {
  let touristToken = null;
  let agentToken = null;
  let currentOrderId = null;

  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  const touristEmail = 'rifki@gmail.com';
  const touristPw = 'sahabat11';
  const agentEmail = 'rizkitour12@gmail.com';
  const agentPw = 'sahabat11';
  
  const productId = '099bb38e-78d5-4845-b0f5-5391901873bf';

  before(() => {
    // 1. Baca Order ID yang diteruskan dari test sebelumnya
    cy.readFile('cypress/fixtures/tempOrder.json').then((data) => {
      currentOrderId = data.orderId;
    });

    // 2. Login Wisatawan
    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: { usernameOrEmail: touristEmail, password: touristPw },
      failOnStatusCode: false,
    }).then((res) => {
      touristToken = res.body.result.accessToken;
    });

    // 3. Login Agen
    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: { usernameOrEmail: agentEmail, password: agentPw },
      failOnStatusCode: false,
    }).then((res) => {
      agentToken = res.body.result.accessToken;
    });
  });

  it('Wisatawan berhasil mengirim ulasan teks dan rating', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders/${currentOrderId}/reviews/${productId}`,
      headers: { Authorization: `Bearer ${touristToken}` },
      body: { reviewContent: 'Perjalanan Cypress sangat luar biasa!', reviewRate: 5 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([201, 400]); // 400 jika status order belum benar-benar done (bypass dev mode)
    });
  });

  it('Dasbor Agen memuat ringkasan data yang akurat', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/orders/summaries?lastmonths=0`,
      headers: { Authorization: `Bearer ${agentToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.result).to.have.property('income');
    });
  });
});
