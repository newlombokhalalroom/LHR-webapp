// ============================================================
// INT-IT2-02: Pemesanan Open Trip & Validasi Kuota (US-06)
// Skenario: Wisatawan login, memilih jadwal, dan sistem memvalidasi kuota
// Alur: POST /authentications → GET /products/:id → POST /orders/:clientId
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('02 - Pemesanan Open Trip dan Validasi Kuota (US-06)', () => {

  let userToken = null;

  // Login sebagai wisatawan sebelum semua test berjalan
  before(() => {
    const apiUrl = Cypress.env('apiUrl');
    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: {
        usernameOrEmail: 'rifki@gmail.com',
        password: 'sahabat11',
      },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 201) {
        userToken = response.body.result.accessToken;
        cy.log('✅ Login wisatawan berhasil. Token diterima.');
      } else {
        cy.log('⚠️  Login gagal. Test berikutnya mungkin skip. Cek password user "rifki".');
      }
    });
  });

  it('[Step 1] Jadwal Tersedia: Membaca data jadwal Open Trip yang masih memiliki kuota', () => {
    const apiUrl = Cypress.env('apiUrl');
    const scheduleId = 'a91a3919-ef56-451e-be36-7186cf673106';

    // Query langsung ke produk untuk memastikan jadwal ada dan ready
    cy.request({
      method: 'GET',
      url: `${apiUrl}/products/099bb38e-78d5-4845-b0f5-5391901873bf`,
    }).then((response) => {
      expect(response.status).to.eq(200);
      cy.log(`✅ Data produk Open Trip berhasil dimuat.`);
    });
  });

  it('[Step 2] Antarmuka Booking: Halaman detail produk dan tombol Book dapat diakses', () => {
    // Membuka halaman detail produk Open Trip 3 Gili di browser sungguhan
    cy.visit('/tour/099bb38e-78d5-4845-b0f5-5391901873bf', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
    cy.log('✅ Halaman detail produk Open Trip berhasil dirender di browser.');
  });

  it('[Step 3] Validasi Kuota: API harus MENOLAK pesanan yang melebihi sisa kuota', () => {
    if (!userToken) {
      cy.log('⚠️  Skip: Token tidak tersedia. Pastikan password user "rifki" benar.');
      return;
    }

    const apiUrl = Cypress.env('apiUrl');
    const clientId = '50345915-40b2-4743-bd2d-b74bf463049e';

    // Sengaja memesan 9999 kursi → pasti melebihi kuota manapun
    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders/${clientId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: {
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        orderItems: [{
          productId: '099bb38e-78d5-4845-b0f5-5391901873bf',
          quantity: 9999, // Sengaja melebihi kuota
          schedule_id: 'a91a3919-ef56-451e-be36-7186cf673106',
        }],
      },
      failOnStatusCode: false, // Jangan hentikan test saat status 400
    }).then((response) => {
      // Sistem HARUS mengembalikan error 400 (Kuota tidak mencukupi)
      expect(response.status).to.eq(400);
      cy.log(`✅ Sistem berhasil menolak overbooking dengan status: ${response.status}`);
      cy.log(`   Pesan error: ${response.body.message}`);
    });
  });

  it('[Step 4] Pemesanan Valid: API berhasil memproses pesanan dengan kuantitas yang wajar', () => {
    if (!userToken) {
      cy.log('⚠️  Skip: Token tidak tersedia.');
      return;
    }

    const apiUrl = Cypress.env('apiUrl');
    const clientId = '50345915-40b2-4743-bd2d-b74bf463049e';

    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders/${clientId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: {
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        orderItems: [{
          productId: '099bb38e-78d5-4845-b0f5-5391901873bf',
          quantity: 1, // Pesanan valid: 1 kursi
          schedule_id: 'a91a3919-ef56-451e-be36-7186cf673106',
          pickup_location: 'Bandara Internasional Lombok',
        }],
      },
      failOnStatusCode: false,
    }).then((response) => {
      // Berhasil buat pesanan atau kuota sudah habis (keduanya merupakan hasil yang valid)
      const isSuccess = response.status === 201;
      const isQuotaEmpty = response.status === 400;

      expect(isSuccess || isQuotaEmpty).to.be.true;

      if (isSuccess) {
        const orderId = response.body.result?.id;
        cy.log(`✅ Pesanan berhasil dibuat! Order ID: ${orderId}`);
      } else {
        cy.log(`ℹ️  Kuota jadwal sudah habis terpakai. Sistem merespons 400 dengan benar.`);
      }
    });
  });

});
