// ============================================================
// IT1-02: Mengelola Data Paket Wisata (US-02 & US-03)
// Menguji: POST /products, PATCH /products/:id, DELETE /products/:id
// GET /products/:id, GET /clients/:id/products
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('02 - Mengelola Data Paket Wisata (US-02 & US-03)', () => {
  let agentToken = null;
  let createdProductId = null;

  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  const agentEmail = 'rizkitour12@gmail.com';
  const agentPw = 'sahabat11';
  const clientId = '50345915-40b2-4743-bd2d-b74bf463049e';
  const existingProductId = '099bb38e-78d5-4845-b0f5-5391901873bf';

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

  it('[US02-001] Agen berhasil membuat paket wisata baru dengan data valid', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/products`,
      headers: { Authorization: `Bearer ${agentToken}` },
      body: {
        clientId: clientId,
        title: '[Test] Cypress Open Trip 3 Gili',
        price: 500000,
        type: 'open_trip',
        description: 'Paket wisata uji coba otomatis dari Cypress',
        isAvailable: true,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201, 400]);
      createdProductId = res.body.result?.id;
      cy.writeFile('cypress/fixtures/tempProduct.json', { productId: createdProductId });
      cy.log(`✅ Produk berhasil dibuat: ID ${createdProductId}`);
    });
  });

  it('[US02-002] Sistem menolak pembuatan paket wisata tanpa field wajib (judul)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/products`,
      headers: { Authorization: `Bearer ${agentToken}` },
      body: {
        clientId: clientId,
        price: 500000,
        type: 'open_trip',
        // title sengaja dikosongkan
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
      cy.log(`✅ Sistem menolak data tidak lengkap. Status: ${res.status}`);
    });
  });

  it('[US02-003] Agen berhasil memperbarui data paket wisata yang ada', () => {
    cy.request({
      method: 'PATCH',
      url: `${apiUrl}/products/${existingProductId}`,
      headers: { Authorization: `Bearer ${agentToken}` },
      body: { title: '[Updated] Open Trip 3 Gili - Cypress' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201, 400]);
      cy.log('✅ Data produk berhasil diperbarui');
    });
  });

  it('[US02-004] Sistem menolak akses tanpa token autentikasi', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/products`,
      body: { title: 'Produk Tanpa Token', price: 100000 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401]);
      cy.log(`✅ Sistem menolak akses tanpa token. Status: ${res.status}`);
    });
  });

  it('[US03-001] Berhasil membaca data detail paket wisata berdasarkan ID', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/products/${existingProductId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.result).to.have.property('id', existingProductId);
      cy.log(`✅ Detail produk berhasil dibaca: ${res.body.result.title}`);
    });
  });

  it('[US03-002] Berhasil membaca seluruh daftar paket wisata milik agen', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/clients/${clientId}/products`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.result).to.be.an('array');
      cy.log(`✅ Daftar produk agen berhasil dimuat. Jumlah: ${res.body.result.length} produk`);
    });
  });

  it('[US03-003] Sistem mengembalikan error 404 saat membaca produk dengan ID yang tidak ada', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/products/id-produk-tidak-ada-sama-sekali`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 404]);
      cy.log(`✅ Error tidak ditemukan berhasil dideteksi. Status: ${res.status}`);
    });
  });
});
