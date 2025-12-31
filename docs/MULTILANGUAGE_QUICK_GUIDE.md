# Quick Guide: Struktur Database Multi-Language

## Ringkasan Pendekatan

Menggunakan **Translation Table Pattern** - setiap entitas memiliki:

1. **Tabel Utama**: Menyimpan data non-translatable (foto, slug, status, dll)
2. **Tabel Translation**: Menyimpan konten yang perlu diterjemahkan (judul, isi, dll)

## Diagram Struktur

```
┌─────────────────┐
│   languages     │  ← Tabel master bahasa
│─────────────────│
│ id              │
│ code (id/en/ar) │
│ name            │
│ is_default      │
│ is_active       │
└─────────────────┘
         │
         │ (referensi)
         │
┌─────────────────┐      ┌──────────────────────┐
│     berita      │◄─────┤ berita_translations  │
│─────────────────│      │──────────────────────│
│ id              │      │ id                   │
│ slug (global)   │      │ berita_id (FK)       │
│ foto            │      │ language_id (FK)     │
│ is_published    │      │ judul                │
└─────────────────┘      │ isi                  │
                         │ slug (per bahasa)    │
                         │ meta_title           │
                         │ meta_description     │
                         └──────────────────────┘
```

## Struktur Minimal yang Diperlukan

### 1. Tabel `languages`

```sql
- id (PK)
- code (UNIQUE) - 'id', 'en', 'ar'
- name - 'Indonesian', 'English', 'Arabic'
- is_default - TRUE untuk bahasa default
- is_active
```

### 2. Tabel Utama (contoh: `berita`)

```sql
- id (PK)
- slug (UNIQUE) - bisa global atau per bahasa
- foto - media tidak perlu diterjemahkan
- is_published
- created_at, updated_at
```

### 3. Tabel Translation (contoh: `berita_translations`)

```sql
- id (PK)
- berita_id (FK → berita.id)
- language_id (FK → languages.id)
- judul
- isi
- slug (opsional, jika per bahasa)
- UNIQUE(berita_id, language_id)
```

## Keuntungan Pendekatan Ini

✅ **Scalable**: Tambah bahasa baru = insert ke tabel languages, tidak perlu alter table
✅ **Normalized**: Database tetap ter-normalisasi
✅ **Flexible**: Setiap bahasa bisa punya konten berbeda
✅ **Maintainable**: Mudah di-query dan di-maintain
✅ **Performance**: Bisa di-index dengan baik

## Contoh Query

### Get berita dengan bahasa tertentu:

```sql
SELECT b.*, bt.judul, bt.isi
FROM berita b
JOIN berita_translations bt ON b.id = bt.berita_id
JOIN languages l ON bt.language_id = l.id
WHERE l.code = 'id' AND b.is_published = TRUE;
```

### Get dengan fallback ke default:

```sql
SELECT
  b.*,
  COALESCE(bt.judul, bt_default.judul) as judul,
  COALESCE(bt.isi, bt_default.isi) as isi
FROM berita b
LEFT JOIN berita_translations bt ON b.id = bt.berita_id
  AND bt.language_id = (SELECT id FROM languages WHERE code = 'en')
LEFT JOIN berita_translations bt_default ON b.id = bt_default.berita_id
  AND bt_default.language_id = (SELECT id FROM languages WHERE is_default = TRUE);
```

## Langkah Implementasi

1. ✅ Buat tabel `languages` dan insert bahasa default
2. ✅ Update tabel utama (hapus kolom translatable)
3. ✅ Buat tabel `*_translations` untuk setiap entitas
4. ✅ Update model Sequelize dengan associations
5. ✅ Update controller untuk handle multi-language
6. ✅ Buat middleware untuk detect language dari request
7. ✅ Update API endpoints untuk accept `?lang=` parameter

## Data yang Perlu Diterjemahkan

**Perlu Translation:**

- Judul/Title
- Isi/Content
- Keterangan/Description
- Meta Title (SEO)
- Meta Description (SEO)
- Slug (opsional, bisa per bahasa atau global)

**Tidak Perlu Translation:**

- Foto/Image
- Video
- File/Media
- Status flags (is_published, is_active)
- Dates (created_at, updated_at)
- Numeric values (tahun, urutan)

## Tips Implementasi

1. **Slug Strategy**:

   - Pilih salah satu: slug global (sama semua bahasa) atau slug per bahasa
   - Slug global lebih simple, slug per bahasa lebih SEO-friendly

2. **Default Language**:

   - Selalu set bahasa default (biasanya 'id')
   - Pastikan setiap entitas punya terjemahan untuk bahasa default

3. **Fallback**:

   - Implementasikan fallback ke bahasa default jika terjemahan tidak tersedia
   - Jangan return error jika terjemahan tidak ada, gunakan fallback

4. **Validation**:

   - Validasi bahwa setiap create/update punya terjemahan untuk bahasa default
   - Optional: validasi untuk bahasa lain

5. **API Design**:
   - Gunakan query param `?lang=id` atau header `Accept-Language`
   - Default ke bahasa default jika tidak spesifik

## File yang Perlu Dibuat/Update

1. **Migration**:

   - `create-languages.js`
   - `update-berita-for-multilanguage.js`
   - `create-berita-translations.js`
   - (dan migration serupa untuk galeri, rekam_jejak, dll)

2. **Models**:

   - `Language.js` (baru)
   - `BeritaTranslation.js` (baru)
   - Update `berita.js` (hapus kolom translatable, tambah associations)
   - (dan model serupa untuk entitas lain)

3. **Controllers**:

   - Update semua controller untuk handle translations
   - Tambah logic untuk get/create/update dengan bahasa tertentu

4. **Middleware**:

   - `languageMiddleware.js` (baru) - untuk detect bahasa dari request

5. **Routes**:
   - Update routes untuk include language middleware

## Contoh Response API

### GET /api/berita?lang=en

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
      "language": "en"
    }
  ]
}
```

### POST /api/berita

```json
{
  "slug": "berita-1",
  "foto": "/uploads/berita/image.jpg",
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
}
```

---

**Lihat file lengkap:**

- `MULTILANGUAGE_DATABASE_DESIGN.md` - Desain detail
- `MULTILANGUAGE_IMPLEMENTATION_EXAMPLE.md` - Contoh kode implementasi
