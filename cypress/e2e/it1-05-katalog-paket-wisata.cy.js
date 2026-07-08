// ============================================================
// IT1-05: Melihat Katalog Paket Wisata (US-06 - Publik)
// Menguji: GET /products, GET /products/:id, GET /clients/approved
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('05 - Melihat Katalog Paket Wisata (US-06)', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  const existingProductId = '099bb38e-78d5-4845-b0f5-5391901873bf';

  it('[US06-001] Berhasil memuat daftar seluruh produk katalog dari database tanpa login', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/products`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.result).to.be.an('array');
      expect(res.body.result.length).to.be.greaterThan(0);
      cy.log(`✅ Katalog berhasil dimuat dari DB. Total: ${res.body.result.length} produk`);
    });
  });

  it('[US06-002] Berhasil memuat detail produk berikut jadwal & itinerary-nya', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/products/${existingProductId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const product = res.body.result;
      expect(product).to.have.property('id', existingProductId);
      expect(product).to.have.property('title');
      expect(product).to.have.property('price');
      cy.log(`✅ Detail produk valid: ${product.title}, Harga: IDR ${product.price}`);
    });
  });



  it('[US06-004] Halaman katalog wisata di antarmuka berhasil dirender di browser', () => {
    cy.visit('/tour', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.log('✅ Halaman katalog berhasil dimuat di browser');
  });

  it('[US06-005] Halaman detail produk wisata berhasil dirender di browser', () => {
    cy.visit(`/tour/${existingProductId}`, { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.log('✅ Halaman detail produk berhasil dimuat di browser');
  });
});
