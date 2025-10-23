# API Email Pass

API Email Pass adalah layanan backend yang menyediakan fungsionalitas untuk menghasilkan, memvalidasi, dan mengelola token akses. Ini dirancang untuk digunakan dalam skenario di mana diperlukan sistem token sederhana untuk otentikasi atau otorisasi. Aplikasi ini dibangun menggunakan FastAPI, SQLAlchemy, dan PostgreSQL.

## Fitur

- **Pembuatan Token**: Hasilkan token unik untuk akses.
- **Validasi Token**: Periksa validitas token yang diberikan.
- **Manajemen Token**: Admin dapat melihat, mengaktifkan/menonaktifkan, dan menghapus token.
- **Otentikasi Admin**: Akses aman ke endpoint manajemen token melalui otentikasi HTTP Basic.
- **Antarmuka Frontend Sederhana**: Antarmuka web dasar untuk berinteraksi dengan API.

## Teknologi yang Digunakan

- **FastAPI**: Kerangka kerja web modern dan cepat untuk membangun API dengan Python.
- **SQLAlchemy**: Toolkit SQL dan Pemeta Relasional Objek (ORM) untuk berinteraksi dengan database.
- **PostgreSQL**: Sistem manajemen database relasional yang kuat.
- **`python-dotenv`**: Untuk mengelola variabel lingkungan.
- **`passlib` & `bcrypt`**: Untuk hashing kata sandi yang aman.
- **`uvicorn`**: Server ASGI untuk menjalankan aplikasi FastAPI.
- **`docker-compose`**: Untuk orkestrasi lingkungan pengembangan.

## Struktur Proyek

```
.
├── .env                      # Variabel lingkungan
├── .ignore                   # File yang diabaikan oleh Git
├── database.py               # Konfigurasi database dan dependensi sesi
├── docker-compose.yml        # Konfigurasi Docker Compose
├── Dockerfile                # Dockerfile untuk aplikasi
├── main.py                   # Logika API utama dan definisi endpoint
├── models.py                 # Definisi model SQLAlchemy untuk database
├── requirements.txt          # Dependensi Python
├── schemas.py                # Skema Pydantic untuk validasi data
└── static/                   # File frontend statis (HTML, CSS, JS)
    ├── index.html
    ├── script.js
    └── style.css
```

## Memulai

Ikuti langkah-langkah ini untuk menyiapkan dan menjalankan proyek secara lokal.

### Prasyarat

- Docker dan Docker Compose terinstal.

### 1. Kloning Repositori

```bash
git clone https://github.com/your-username/api-email-pass.git
cd api-email-pass
```

### 2. Konfigurasi Variabel Lingkungan

Buat file `.env` di direktori root proyek dan tambahkan variabel berikut:

```
DATABASE_URL="postgresql://user:password@db:5432/mydatabase"
ADMIN_PASSWORD="your_secure_admin_password"
```

- `DATABASE_URL`: String koneksi untuk database PostgreSQL Anda. Jika menggunakan `docker-compose.yml` yang disediakan, `db` adalah nama layanan database.
- `ADMIN_PASSWORD`: Kata sandi untuk pengguna admin awal. Ini akan di-hash dan disimpan di database saat aplikasi pertama kali dijalankan.

### 3. Bangun dan Jalankan dengan Docker Compose

```bash
docker-compose up --build
```

Ini akan membangun citra Docker, memulai layanan database PostgreSQL, dan menjalankan aplikasi FastAPI. Aplikasi akan tersedia di `http://localhost:8000`.

### 4. Akses Aplikasi

- **Antarmuka Web**: Buka browser Anda dan navigasikan ke `http://localhost:8000`.
- **Dokumentasi API (Swagger UI)**: Akses dokumentasi API interaktif di `http://localhost:8000/docs`.
- **Dokumentasi API (ReDoc)**: Akses dokumentasi API di `http://localhost:8000/redoc`.

## Endpoint API

### Otentikasi Admin

Beberapa endpoint memerlukan otentikasi admin menggunakan HTTP Basic Auth. Gunakan `username: admin` dan `password: ADMIN_PASSWORD` yang Anda atur di file `.env`.

### Token

- **`POST /token/generate/`**
  - **Deskripsi**: Menghasilkan token baru. Membutuhkan otentikasi admin.
  - **Respons**: `Token`
- **`POST /token/check/`**
  - **Deskripsi**: Memvalidasi token yang diberikan.
  - **Permintaan**: `TokenCheck`
  - **Respons**: `TokenCheckResponse`
- **`GET /tokens/`**
  - **Deskripsi**: Mengambil semua token. Membutuhkan otentikasi admin.
  - **Respons**: Daftar `Token`
- **`PUT /tokens/{token_id}/`**
  - **Deskripsi**: Memperbarui status `is_active` token. Membutuhkan otentikasi admin.
  - **Permintaan**: `TokenBase` (hanya `is_active`)
  - **Respons**: `Token`
- **`DELETE /tokens/{token_id}/`**
  - **Deskripsi**: Menghapus token. Membutuhkan otentikasi admin.
  - **Respons**: Status 204 No Content

## Pengembangan

### Menjalankan Secara Lokal (tanpa Docker)

Jika Anda ingin menjalankan aplikasi tanpa Docker (misalnya, untuk pengembangan), Anda perlu:

1.  **Instal dependensi**:
    ```bash
    pip install -r requirements.txt
    ```
2.  **Siapkan database PostgreSQL secara manual** dan perbarui `DATABASE_URL` di `.env` Anda agar menunjuk ke sana.
3.  **Jalankan aplikasi**:
    ```bash
    uvicorn main:app --reload
    ```

### Migrasi Database

Proyek ini menggunakan SQLAlchemy, tetapi tidak secara eksplisit menyertakan alat migrasi seperti Alembic. Untuk perubahan skema database, Anda perlu:

1.  Perbarui model di `models.py`.
2.  Secara manual membuat ulang atau memodifikasi skema database Anda agar sesuai dengan perubahan model.

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk detail lebih lanjut.