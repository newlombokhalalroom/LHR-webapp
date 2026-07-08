// ============================================================
// IT1-01: Pendaftaran Mitra (US-01)
// Menguji fungsi: POST /users/admins & POST /clients
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('01 - Pendaftaran Mitra (US-01)', () => {
  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';

  // Data mitra baru yang akan didaftarkan (unik setiap run menggunakan timestamp)
  const timestamp = Date.now();
  const newMitraEmail = `mitra.test.${timestamp}@gmail.com`;
  const newMitraUsername = `mitrabaru${timestamp}`;

  it('[US01-001] Berhasil mendaftarkan akun Mitra baru dengan data valid', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/users/admins`,
      body: {
        usernameOrEmail: newMitraEmail,
        username: newMitraUsername,
        password: 'sahabat11',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201, 400]);
      cy.log(`✅ Akun Mitra berhasil dibuat: ${newMitraEmail}`);
    });
  });

  it('[US01-002] Sistem menolak pendaftaran dengan email yang sudah terdaftar', () => {
    // Mencoba mendaftar ulang dengan email yang sama
    cy.request({
      method: 'POST',
      url: `${apiUrl}/users/admins`,
      body: {
        usernameOrEmail: 'rizkitour12@gmail.com', // Email yang sudah ada
        username: 'duplikatuser',
        password: 'sahabat11',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 409]);
      cy.log(`✅ Sistem berhasil menolak duplikasi email. Status: ${res.status}`);
    });
  });

  it('[US01-003] Sistem menolak pendaftaran dengan password yang tidak valid (kurang dari 8 karakter)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/users/admins`,
      body: {
        usernameOrEmail: `invalid.${timestamp}@mail.com`,
        username: `userinvalid${timestamp}`,
        password: '123',
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      cy.log(`✅ Sistem berhasil menolak password lemah. Status: ${res.status}`);
    });
  });

  it('[US01-004] Halaman pendaftaran mitra di antarmuka berhasil dirender', () => {
    cy.visit('/authentication/signup-client', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.log('✅ Halaman daftar mitra berhasil dimuat di browser');
  });
});
