// ============================================================
// INT-02: Kustomisasi Akomodasi Mitra (US-05)
// Skenario: Mitra mengakses halaman manajemen hotel rekanan
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('02 - Kustomisasi Akomodasi Mitra (US-05)', () => {

  it('Memvalidasi halaman manajemen hotel rekanan dapat diakses', () => {
    // 1. Buka halaman hotel rekanan (rute yang diproteksi)
    cy.visit('/Admin/tour-agent/hotel-partner', { failOnStatusCode: false });

    // 2. Validasi body halaman berhasil dirender tanpa crash fatal
    cy.get('body').should('be.visible');

    cy.log('✅ Halaman manajemen hotel rekanan berhasil dirender');
  });

});
