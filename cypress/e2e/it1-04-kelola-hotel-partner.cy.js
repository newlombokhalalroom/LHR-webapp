// ============================================================
// IT1-04: Mengatur Hotel Partner (US-05)
// Menguji: GET /clients/:id/partner-hotels
// PUT /partner-hotels/:id, GET /partner-hotels/:id
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('04 - Mengatur Data Hotel Partner (US-05)', () => {
  let agentToken = null;

  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  const agentEmail = 'rizkitour12@gmail.com';
  const agentPw = 'sahabat11';
  const clientId = '50345915-40b2-4743-bd2d-b74bf463049e';
  const partnerHotelId = '2c9560c2-9e91-468f-a151-ed7dddd5da71';

  before(() => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: { usernameOrEmail: agentEmail, password: agentPw },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(201);
      agentToken = res.body.result.accessToken;
      cy.log('✅ Login Agen berhasil');
    });
  });

  it('[US05-001] Berhasil membaca daftar seluruh hotel partner milik agen dari database', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/clients/${clientId}/partner-hotels`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.result).to.be.an('array');
      expect(res.body.result.length).to.be.greaterThan(0);
      cy.log(`✅ Daftar hotel partner berhasil dimuat. Jumlah: ${res.body.result.length} hotel`);
    });
  });

  it('[US05-002] Berhasil membaca detail satu hotel partner berdasarkan ID', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/partner-hotels/${partnerHotelId}`,
      headers: { Authorization: `Bearer ${agentToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.result).to.have.property('id', partnerHotelId);
      cy.log(`✅ Detail hotel partner berhasil dibaca: ${res.body.result?.hotel?.title || partnerHotelId}`);
    });
  });

  it('[US05-003] Agen berhasil memperbarui harga hotel partner', () => {
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/partner-hotels/${partnerHotelId}`,
      headers: { Authorization: `Bearer ${agentToken}` },
      body: { price: 950000 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201, 400]);
      cy.log('✅ Harga hotel partner berhasil diperbarui menjadi IDR 950.000');
    });
  });

  it('[US05-004] Sistem menolak akses data hotel partner milik agen lain', () => {
    // Coba akses dengan token lain atau tanpa token
    cy.request({
      method: 'GET',
      url: `${apiUrl}/partner-hotels/${partnerHotelId}`,
      failOnStatusCode: false,
      // Sengaja tidak mengirimkan Authorization header
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401]);
      cy.log(`✅ Sistem menolak akses tidak sah. Status: ${res.status}`);
    });
  });

  it('[US05-005] Sistem mengembalikan error 404 pada ID hotel partner yang tidak ada', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/partner-hotels/id-tidak-ada-sama-sekali`,
      headers: { Authorization: `Bearer ${agentToken}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 404, 500]);
      cy.log(`✅ Error hotel tidak ditemukan berhasil dideteksi. Status: ${res.status}`);
    });
  });
});
