# Dokumentasi CI/CD Pipeline (GitHub Actions) - Lombok Halal Room (LHR)

Dokumentasi ini menjelaskan alur **Continuous Integration & Continuous Deployment (CI/CD)** untuk repositori **LHR-webapp**. Dokumentasi ini dirancang agar dapat memahami infrastruktur deployment, kebutuhan rahasia (secrets), dan cara kerja pipeline otomatis ini.

---

## 🚀 Ringkasan Alur (Pipeline Overview)

Pipeline CI/CD ini berjalan menggunakan **GitHub Actions** yang dikonfigurasi di file [`.github/workflows/ci-cd.yaml`](file:///.github/workflows/ci-cd.yaml). Alur ini terbagi menjadi dua tahap utama:

```mermaid
graph TD
    A[Push / PR ke branch production] --> B[Job 1: Build & Push]
    B --> C[Verify Build Dockerfile]
    C --> D[Push Image ke Docker Hub]
    D --> E{Apakah Event PUSH/MERGE?}
    E -- Ya --> F[Job 2: Deploy ke VPS]
    E -- Tidak (Hanya PR) --> G[Selesai (Verifikasi Saja)]
    F --> H[Copy docker-compose.yml ke VPS]
    H --> I[Update Tag & Pull Image di VPS]
    I --> J[Restart Container & Health Check]
    J --> K[Deployment Selesai & Sukses]
```

### 1. Job 1: Build & Push Docker Image
* **Pemicu:** Setiap kali ada **Push** atau **Pull Request** ke branch `production`.
* **Proses:**
  * Mengambil kode terbaru dari repositori.
  * Membuat tag unik berbasis **Short Commit SHA** (7 karakter unik pertama dari commit).
  * Melakukan build Docker Image berdasarkan file [`Dockerfile`](file:///Dockerfile).
  * Mengunggah (push) Docker Image ke Docker Hub dengan dua tag sekaligus:
    * `lombokhalalroom/lombok-halal-room-web-app:latest`
    * `lombokhalalroom/lombok-halal-room-web-app:<short-sha>`
  * Menggunakan sistem caching GitHub Actions agar proses build berikutnya berjalan sangat cepat.

### 2. Job 2: Deploy to VPS
* **Pemicu:** **HANYA** berjalan saat ada event **Push (Merge)** langsung ke branch `production`. (Jika hanya Pull Request, tahap ini dilewati untuk keamanan).
* **Proses:**
  * Menyalin file [`docker-compose.yml`](file:///docker-compose.yml) terbaru dari repositori ke VPS pada direktori `/opt/lhr` menggunakan koneksi SCP aman.
  * Masuk ke VPS menggunakan SSH dan mengubah tag image secara dinamis di file `docker-compose.yml` agar menggunakan tag SHA terbaru.
  * Menarik image terbaru dari Docker Hub (`docker compose pull`).
  * Merestart container secara aman tanpa downtime yang lama (`docker compose up -d --remove-orphans`).
  * Melakukan **Health Check** (mengetes port `3001` secara berulang sampai merespons status `200 OK`).
  * Melakukan pembersihan (clean up) image-image lama yang tidak terpakai (`docker image prune -f`).

---

## 🔑 Kebutuhan Rahasia (GitHub Actions Secrets)

Agar pipeline dapat berjalan dengan sukses, Anda harus mendaftarkan beberapa variabel rahasia di repositori GitHub Anda. 

Masuk ke **GitHub Repositori -> Settings -> Secrets and variables -> Actions**, lalu tambahkan key-key berikut:

### Kredensial Docker Hub
| Nama Secret | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `DOCKERHUB_USERNAME` | Username akun Docker Hub organisasi / personal Anda. | `lombokhalalroom` |
| `DOCKERHUB_TOKEN` | Access Token (PAT) dari Docker Hub (bukan password biasa demi keamanan). | `dckr_pat_xxxxxx...` |

### Kredensial VPS (Deployment Target)
| Nama Secret | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `VPS_HOST` | Alamat IP Publik atau Domain dari VPS target. | `103.xxx.xx.xx` |
| `VPS_USER` | Username SSH untuk masuk ke VPS. | `root` atau `ubuntu` |
| `VPS_SSH_KEY` | Private SSH Key (`id_rsa`) yang digunakan untuk login ke VPS tanpa password. | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `VPS_PORT` | Port SSH VPS (Default biasanya 22). | `22` |

---

## 🛠️ Persiapan Lingkungan (Environment Setup) di VPS

Sebelum pipeline dijalankan untuk pertama kali, ada beberapa hal yang harus disiapkan di VPS tujuan:

### 1. Kebutuhan Server
Pastikan server VPS Anda sudah terpasang:
* **Docker** & **Docker Compose**
* **Curl** (untuk keperluan Health Check pipeline)

### 2. Struktur Direktori
Buat direktori kerja untuk aplikasi LHR di VPS:
```bash
sudo mkdir -p /opt/lhr
sudo chown -R $USER:$USER /opt/lhr
```

### 3. File Environment (`.env`)
Karena Nuxt menggunakan konfigurasi dinamis yang sensitif (lihat [`nuxt.config.ts`](file:///nuxt.config.ts)), Anda wajib membuat file `.env` di VPS pada direktori `/opt/lhr/.env`. 

---

## 🏃‍♂️ Cara Menjalankan Pipeline

Pipeline ini berjalan secara **otomatis penuh (Fully Automated)**. Developer tidak perlu melakukan trigger manual.

1. **Pengembangan Fitur:** Developer membuat branch baru untuk mengerjakan fitur baru (misal: `feature/tambah-tombol`).
2. **Pull Request:** Setelah selesai, buat Pull Request ke branch `production`. 
   * *Aksi otomatis:* GitHub Actions akan memicu Job 1 (`build-and-push`) untuk memverifikasi apakah kode baru sukses di-build ke dalam Docker tanpa error.
3. **Merge ke Production:** Setelah PR disetujui dan di-merge ke branch `production`.
   * *Aksi otomatis:* GitHub Actions akan mem-build image baru, mengunggah ke Docker Hub, mengirim file compose terbaru ke VPS, mengupdate container aplikasi di VPS secara otomatis, dan melakukan tes kesehatan (Health Check).

---

## 🔍 Cara Melakukan Debugging Jika Terjadi Error

Jika deployment gagal, Anda bisa mengecek log dengan langkah berikut:

1. **Lihat Log GitHub Actions:**
   Buka tab **Actions** di repositori GitHub Anda untuk melihat step mana yang berwarna merah/gagal.
2. **Cek Status Container di VPS:**
   Masuk ke VPS via SSH, lalu jalankan:
   ```bash
   cd /opt/lhr
   docker compose ps
   ```
3. **Membaca Log Aplikasi di VPS:**
   Untuk melihat log runtime dari aplikasi Nuxt jika container mendadak crash:
   ```bash
   docker compose logs -f webapp
   ```
