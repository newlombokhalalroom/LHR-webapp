// ============================================================
// INT-01: Pendaftaran dan Otorisasi (US-15)
// Skenario: Mitra Tour Agent mengakses form pendaftaran akun baru
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('01 - Pendaftaran dan Otorisasi (US-15)', () => {

  it('Memvalidasi form pendaftaran mitra Tour Agent dapat diakses dan dirender', () => {
    // 1. Buka halaman pendaftaran mitra
    cy.visit('/Authentication/signup-client', { failOnStatusCode: false });

    // 2. Pilih jenis bisnis Tour Agent
    cy.contains('Tour Agent').click();

    // 3. Validasi form pendaftaran berhasil muncul
    cy.contains('Continue').should('be.visible');

    cy.log('✅ Halaman registrasi mitra Tour Agent berhasil dirender');
  });

});
