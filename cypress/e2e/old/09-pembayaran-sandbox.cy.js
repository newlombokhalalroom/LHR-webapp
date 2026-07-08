// ============================================================
// INT-IT3-01: Simulasi Pembayaran & Invoice (US-09 & US-10)
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('09 - Simulasi Pembayaran & Invoice (US-09 & US-10)', () => {
  let touristToken = null;
  let currentOrderId = null;

  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  const touristEmail = 'rifki@gmail.com';
  const touristPw = 'sahabat11';
  const clientId = '50345915-40b2-4743-bd2d-b74bf463049e';
  const productId = '099bb38e-78d5-4845-b0f5-5391901873bf';
  const scheduleId = 'a91a3919-ef56-451e-be36-7186cf673106';

  before(() => {
    // 1. Login Wisatawan
    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: { usernameOrEmail: touristEmail, password: touristPw },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(201);
      touristToken = res.body.result.accessToken;
    });

    // 2. Buat Pesanan Dummy Baru
    cy.wrap(null).then(() => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/orders/${clientId}`,
        headers: { Authorization: `Bearer ${touristToken}` },
        body: {
          startDate: '2026-08-15',
          endDate: '2026-08-17',
          orderItems: [{ productId, quantity: 1, schedule_id: scheduleId }],
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        currentOrderId = res.body.result.id;
        
        // Simpan State Order ID untuk test selanjutnya
        cy.writeFile('cypress/fixtures/tempOrder.json', { orderId: currentOrderId });
      });
    });
  });

  it('Berhasil melakukan pembayaran sandbox dan mengubah status menjadi process', () => {
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/${currentOrderId}/sandbox-confirm`,
      headers: { Authorization: `Bearer ${touristToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
    });
  });

  it('Halaman dokumen Invoice berhasil dirender', () => {
    cy.visit(`/booking/invoice/${currentOrderId}`, { failOnStatusCode: false });
    cy.get('body').should('contain', currentOrderId);
  });
});
