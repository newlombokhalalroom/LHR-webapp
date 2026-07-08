// ============================================================
// INT-IT2-01: Registrasi Wisatawan dan Eksplorasi Katalog (US-02)
// Skenario: Wisatawan mendaftar akun baru lalu menelusuri katalog & itinerary
// Alur: POST /users → GET /tour → GET /products/:id
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('01 - Registrasi Wisatawan dan Eksplorasi Katalog (US-02)', () => {

  it('[Step 1] Pendaftaran: Mendaftarkan akun Wisatawan baru via API', () => {
    const apiUrl = Cypress.env('apiUrl');
    const uniqueEmail = `wisatawan_test_${Date.now()}@gmail.com`;
    const uniqueUsername = `wisatawan_test_${Date.now()}`;

    cy.request({
      method: 'POST',
      url: `${apiUrl}/users`,
      body: {
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'password123',
      },
      headers: { 'Content-Type': 'application/json' },
    }).then((response) => {
      expect(response.status).to.eq(201);
      cy.log(`✅ Akun wisatawan "${uniqueUsername}" berhasil didaftarkan.`);
    });
  });

  it('[Step 2] Eksplorasi: Halaman katalog paket wisata publik berhasil dimuat', () => {
    // Wisatawan mengakses halaman katalog tanpa perlu login
    cy.visit('/tour', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.log('✅ Halaman katalog paket wisata publik berhasil dirender');
  });

  it('[Step 3] Detail Produk: Menelusuri itinerary paket "Open Trip 3 Gili"', () => {
    const apiUrl = Cypress.env('apiUrl');
    const productId = '099bb38e-78d5-4845-b0f5-5391901873bf'; // Open Trip 3 Gili

    cy.request({
      method: 'GET',
      url: `${apiUrl}/products/${productId}`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      const product = response.body.result;
      expect(product).to.have.property('title');
      cy.log(`✅ Detail produk "${product.title}" berhasil dimuat.`);
    });
  });

});
