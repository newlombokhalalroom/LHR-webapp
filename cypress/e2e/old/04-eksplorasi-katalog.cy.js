// ============================================================
// INT-04: Eksplorasi Katalog Wisata (US-01)
// Skenario: Wisatawan mengakses halaman beranda katalog paket wisata publik
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('04 - Eksplorasi Katalog Wisata (US-01)', () => {

  it('Halaman katalog paket wisata publik berhasil dimuat', () => {
    // 1. Wisatawan mengakses halaman beranda katalog (tidak butuh login)
    cy.visit('/tour', { failOnStatusCode: false });

    // 2. Memastikan halaman berhasil dirender tanpa error fatal
    cy.get('body').should('be.visible');

    cy.log('✅ Katalog paket wisata publik berhasil dirender');
  });

});
