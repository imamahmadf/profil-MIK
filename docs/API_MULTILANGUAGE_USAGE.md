# Panduan Penggunaan API Multi-Language

## Overview

Backend sekarang mendukung multi-language untuk semua endpoint berita. Setiap berita dapat memiliki terjemahan dalam beberapa bahasa (Indonesian, English, Arabic, dll).

## Cara Menggunakan

### 1. Mendapatkan Berita dengan Bahasa Tertentu

Gunakan parameter `lang` di query string atau header `Accept-Language`:

```bash
# Menggunakan query parameter
GET /api/berita?lang=en
GET /api/berita?lang=id
GET /api/berita?lang=ar

# Dengan pagination dan search
GET /api/berita?lang=en&page=1&limit=10&search=news

# Menggunakan header
GET /api/berita
Accept-Language: en
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "slug": "berita-1",
      "foto": "/uploads/berita/image.jpg",
      "judul": "News Title in English",
      "isi": "News content...",
      "meta_title": "Meta Title",
      "meta_description": "Meta Description",
      "language": "en",
      "fotos": [...],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 2. Mendapatkan Berita by ID

```bash
GET /api/berita/1?lang=en
```

### 3. Mendapatkan Berita by Slug

```bash
GET /api/berita/slug/berita-1?lang=en
```

### 4. Membuat Berita Baru (Multi-Language)

**Format Request Body:**

```json
{
  "slug": "berita-1",
  "foto": "/uploads/berita/image.jpg",
  "translations": [
    {
      "language_code": "id",
      "judul": "Judul Berita dalam Bahasa Indonesia",
      "isi": "Isi berita dalam bahasa Indonesia...",
      "slug": "berita-1-id",
      "meta_title": "Meta Title ID",
      "meta_description": "Meta Description ID"
    },
    {
      "language_code": "en",
      "judul": "News Title in English",
      "isi": "News content in English...",
      "slug": "berita-1-en",
      "meta_title": "Meta Title EN",
      "meta_description": "Meta Description EN"
    },
    {
      "language_code": "ar",
      "judul": "عنوان الخبر بالعربية",
      "isi": "محتوى الخبر بالعربية...",
      "slug": "berita-1-ar",
      "meta_title": "Meta Title AR",
      "meta_description": "Meta Description AR"
    }
  ]
}
```

**Catatan:**

- Minimal harus ada terjemahan untuk bahasa default (biasanya 'id')
- `slug` di root adalah slug global (opsional)
- `slug` di dalam translation adalah slug per bahasa (opsional)
- Jika tidak ada slug, akan di-generate dari judul bahasa default

**Backward Compatibility:**
Format lama masih didukung untuk kemudahan migrasi:

```json
{
  "judul": "Judul Berita",
  "isi": "Isi berita...",
  "slug": "berita-1"
}
```

Format ini akan otomatis dikonversi menjadi format multi-language dengan bahasa default.

### 5. Update Berita

**Format Request Body:**

```json
{
  "slug": "berita-1-updated",
  "foto": "/uploads/berita/new-image.jpg",
  "is_published": true,
  "translations": [
    {
      "language_code": "id",
      "judul": "Judul Updated",
      "isi": "Isi Updated"
    },
    {
      "language_code": "en",
      "judul": "Updated Title",
      "isi": "Updated Content"
    }
  ]
}
```

**Catatan:**

- Jika translation dengan language_code sudah ada, akan di-update
- Jika translation dengan language_code belum ada, akan di-create
- Field yang tidak dikirim tidak akan di-update

### 6. Delete Berita

```bash
DELETE /api/berita/1
```

Semua translations akan otomatis terhapus karena CASCADE.

## Bahasa yang Tersedia

Default languages yang sudah di-setup:

- `id` - Indonesian (default)
- `en` - English
- `ar` - Arabic

Untuk menambah bahasa baru, insert ke tabel `languages`:

```sql
INSERT INTO languages (code, name, is_default, is_active)
VALUES ('fr', 'French', false, true);
```

## Priority Bahasa

Sistem akan menggunakan bahasa berdasarkan priority berikut:

1. Query parameter `?lang=xx` (highest priority)
2. Header `Accept-Language`
3. Bahasa default (id)

## Error Handling

### Bahasa Tidak Ditemukan

```json
{
  "success": false,
  "message": "Bahasa tidak ditemukan"
}
```

### Terjemahan Default Wajib

```json
{
  "success": false,
  "message": "Terjemahan untuk bahasa default (id) wajib diisi"
}
```

### Slug Sudah Digunakan

```json
{
  "success": false,
  "message": "Slug sudah digunakan"
}
```

## Contoh Penggunaan dengan cURL

```bash
# Get all berita dalam bahasa Inggris
curl -X GET "http://localhost:3000/api/berita?lang=en"

# Get berita by ID dalam bahasa Indonesia
curl -X GET "http://localhost:3000/api/berita/1?lang=id"

# Create berita dengan multi-language
curl -X POST "http://localhost:3000/api/berita" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "slug": "berita-1",
    "translations": [
      {
        "language_code": "id",
        "judul": "Judul Berita",
        "isi": "Isi berita..."
      },
      {
        "language_code": "en",
        "judul": "News Title",
        "isi": "News content..."
      }
    ]
  }'

# Update berita
curl -X PUT "http://localhost:3000/api/berita/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "translations": [
      {
        "language_code": "id",
        "judul": "Judul Updated"
      }
    ]
  }'
```

## Migration

Sebelum menggunakan API multi-language, pastikan untuk menjalankan migration:

```bash
npx sequelize-cli db:migrate
```

Migration akan:

1. Membuat tabel `languages` dengan bahasa default
2. Update tabel `berita` (hapus kolom judul, isi)
3. Membuat tabel `berita_translations`
4. Migrasi data existing ke `berita_translations` dengan bahasa default

## Catatan Penting

1. **Data Existing**: Data berita yang sudah ada akan otomatis di-migrate ke format multi-language dengan bahasa default (id)

2. **Slug Strategy**:

   - Slug global disimpan di tabel `berita`
   - Slug per bahasa (opsional) disimpan di `berita_translations`
   - Jika mencari by slug, sistem akan cek di kedua tempat

3. **Foto/Media**:

   - Foto tidak perlu diterjemahkan, tetap disimpan di tabel `berita`
   - Upload foto tetap menggunakan middleware yang sama

4. **Validation**:
   - Setiap create/update harus memiliki terjemahan untuk bahasa default
   - Language code harus valid (ada di tabel languages)
