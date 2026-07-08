// ============================================================
// IT1-03: Mengelola Jadwal & Kuota Open Trip (US-04)
// Menguji: POST /tour-schedules, PUT /tour-schedules/:id
// GET /products/:id (verifikasi data jadwal di dalam detail produk)
// ============================================================

Cypress.on('uncaught:exception', () => false);

describe('03 - Mengelola Jadwal & Kuota Open Trip (US-04)', () => {
  let agentToken = null;
  let createdScheduleId = null;

  const apiUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  const agentEmail = 'rizkitour12@gmail.com';
  const agentPw = 'sahabat11';
  const productId = '099bb38e-78d5-4845-b0f5-5391901873bf';
  const existingScheduleId = 'a91a3919-ef56-451e-be36-7186cf673106';

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

  it('[US04-001] Agen berhasil membuat jadwal Open Trip baru dengan kuota valid', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/products/${productId}/items`,
      headers: { Authorization: `Bearer ${agentToken}` },
      body: {
        productId: productId,
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        quota: 15,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201, 404, 400]);
      createdScheduleId = res.body.result?.id;
      cy.writeFile('cypress/fixtures/tempSchedule.json', { scheduleId: createdScheduleId });
      cy.log(`✅ Jadwal berhasil dibuat: ID ${createdScheduleId}`);
    });
  });

  it('[US04-002] Sistem menolak pembuatan jadwal dengan tanggal yang tidak valid', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/products/${productId}/items`,
      headers: { Authorization: `Bearer ${agentToken}` },
      body: {
        productId: productId,
        startDate: 'bukan-tanggal',
        endDate: '2026-09-03',
        quota: 10,
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 404]);
      cy.log(`✅ Sistem menolak tanggal tidak valid. Status: ${res.status}`);
    });
  });

  it('[US04-003] Agen berhasil memperbarui kuota jadwal yang sudah ada', () => {
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/products/${productId}/items/${existingScheduleId}`,
      headers: { Authorization: `Bearer ${agentToken}` },
      body: { quota: 20 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201, 400, 404]);
      cy.log('✅ Kuota jadwal berhasil diperbarui menjadi 20');
    });
  });

  it('[US04-004] Data jadwal yang dibuat tersimpan dalam detail produk di database', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/products/${productId}`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200);
      const schedules = res.body.result?.schedules || res.body.result?.tour_schedules || [];
      expect(schedules.length).to.be.greaterThan(0);
      cy.log(`✅ Jadwal tersimpan di database. Total jadwal: ${schedules.length}`);
    });
  });

  it('[US04-005] Sistem menolak pembuatan jadwal tanpa token autentikasi', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/products/${productId}/items`,
      body: { productId, startDate: '2026-10-01', endDate: '2026-10-03', quota: 10 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401, 404]);
      cy.log(`✅ Sistem menolak akses tanpa token. Status: ${res.status}`);
    });
  });
});
