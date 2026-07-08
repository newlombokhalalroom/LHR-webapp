// ============================================================
// INT-03: Persiapan Aset Perjalanan (US-03)
// Skenario: Mitra melakukan login lalu membuat paket wisata baru via API
// Alur: POST /authentications → GET /amenities → POST /products
// ============================================================

Cypress.on('uncaught:exception', () => false);

const FIREBASE_PICTURE_URL = 'https://firebasestorage.googleapis.com/v0/b/lombok-halal-room-sandbox.appspot.com/o/products%2Ff265ff57-78d1-48c7-b33c-83dc27dcc4d3%2Fpicture-2eedcec4-13bf-46bd-b650-f9261c39cd74?alt=media&token=f35adbef-19a7-4dc1-ac1b-5c262b7a1e04';

describe('03 - Persiapan Aset Perjalanan (US-03)', () => {

  it('[Step 1] Autentikasi: Login dan mendapatkan JWT Token', () => {
    const apiUrl = Cypress.env('apiUrl');
    cy.log(`Menghubungi API Backend di: ${apiUrl}`);

    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: {
        usernameOrEmail: 'rizkitour12@gmail.com',
        password: 'sahabat11',
      },
      headers: { 'Content-Type': 'application/json' },
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.result).to.have.property('accessToken');
      cy.log('✅ JWT Token berhasil didapatkan: ' + response.body.result.accessToken.substring(0, 30) + '...');
    });
  });

  it('[Step 2] Membuat Paket Wisata Baru via API (POST /products)', () => {
    const apiUrl = Cypress.env('apiUrl');

    // STEP A: Login untuk mendapatkan token JWT yang segar
    cy.request({
      method: 'POST',
      url: `${apiUrl}/authentications`,
      body: { usernameOrEmail: 'rizkitour12@gmail.com', password: 'sahabat11' },
      headers: { 'Content-Type': 'application/json' },
    }).then((loginResp) => {
      expect(loginResp.status).to.eq(201);
      const token = loginResp.body.result.accessToken;
      cy.log('✅ Token JWT diterima. Mengambil data amenities...');

      // STEP B: Ambil daftar amenities yang tersedia di database
      cy.request({
        method: 'GET',
        url: `${apiUrl}/amenities`,
        headers: { 'Authorization': `Bearer ${token}` },
      }).then((amenitiesResp) => {
        const amenitiesList = amenitiesResp.body.result || amenitiesResp.body.data || [];
        const amenities = amenitiesList.slice(0, 2).map(a => ({ id: a.id }));
        cy.log(`✅ ${amenities.length} data amenities ditemukan. Mulai POST produk...`);

        // STEP C: Kirim request pembuatan paket wisata baru
        cy.request({
          method: 'POST',
          url: `${apiUrl}/products`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: {
            title: 'Paket Wisata Rinjani 3D2N - Integration Test',
            price: 1500000,
            description: 'Paket wisata Gunung Rinjani selama 3 hari 2 malam. Meliputi pendakian, camping di Danau Segara Anak, dan menikmati pemandangan sunrise terbaik.',
            units: 'package',
            availability: true,
            amenities: amenities.length > 0 ? amenities : [{ id: '00000000-0000-0000-0000-000000000001' }],
            details: [
              { title: 'Days', amount: 3 },
              { title: 'Nights', amount: 2 },
            ],
            pictures: [
              {
                picture: FIREBASE_PICTURE_URL,
                title: 'Paket Wisata Rinjani 3D2N',
                description: 'Pemandangan Gunung Rinjani',
              },
            ],
            trip_detail: { trip_type: 'Open trip' },
            itineraries: [
              {
                day: 1,
                time: '07:00 - 18:00',
                activity: 'Perjalanan ke Basecamp & Mulai Pendakian',
                description: 'Berangkat dari Mataram menuju Basecamp Sembalun, kemudian memulai pendakian ke pos 1.',
              },
              {
                day: 2,
                time: '05:00 - 16:00',
                activity: 'Puncak Rinjani & Danau Segara Anak',
                description: 'Summit attack ke puncak Rinjani 3726 mdpl dan turun menuju Danau Segara Anak untuk berkemah.',
              },
              {
                day: 3,
                time: '08:00 - 17:00',
                activity: 'Turun Gunung & Kepulangan',
                description: 'Turun dari basecamp dan kembali ke Mataram. Acara selesai.',
              },
            ],
            schedules: [
              {
                departure_date: '2025-08-15',
                return_date: '2025-08-17',
                total_quota: 12,
              },
              {
                departure_date: '2025-09-05',
                return_date: '2025-09-07',
                total_quota: 15,
              },
            ],
          },
        }).then((productResp) => {
          expect(productResp.status).to.eq(201);
          const productId = productResp.body.result?.productId || productResp.body.data?.productId;
          cy.log(`✅ Paket Wisata berhasil dibuat! Product ID: ${productId}`);
        });
      });
    });
  });

});
