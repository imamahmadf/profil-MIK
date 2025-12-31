# Desain Database Multi-Language untuk Website Profile

## Pendahuluan

Dokumen ini menjelaskan struktur tabel database yang direkomendasikan untuk website profile yang mendukung lebih dari 1 bahasa (multi-language).

## Pendekatan yang Direkomendasikan: Translation Table Pattern

Pendekatan ini menggunakan tabel terpisah untuk menyimpan terjemahan. Setiap entitas memiliki tabel utama (base table) dan tabel terjemahan (translation table).

### Keuntungan:

- ✅ Scalable: Mudah menambah bahasa baru tanpa mengubah struktur tabel utama
- ✅ Normalized: Database tetap ter-normalisasi dengan baik
- ✅ Flexible: Setiap bahasa bisa memiliki konten yang berbeda
- ✅ Maintainable: Mudah di-maintain dan di-query
- ✅ Performance: Query lebih efisien dengan indexing yang tepat

## Struktur Tabel

### 1. Tabel Bahasa (languages)

Tabel untuk menyimpan daftar bahasa yang didukung.

```sql
CREATE TABLE languages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(5) NOT NULL UNIQUE,  -- 'id', 'en', 'ar', dll
  name VARCHAR(50) NOT NULL,         -- 'Indonesian', 'English', 'Arabic'
  is_default BOOLEAN DEFAULT FALSE,  -- Bahasa default
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Tabel Berita dengan Translation

#### Tabel Utama: `berita`

Menyimpan data yang tidak bergantung pada bahasa (non-translatable).

```sql
CREATE TABLE berita (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(255) UNIQUE,          -- Slug bisa per bahasa atau global
  foto VARCHAR(255),                  -- Foto tidak perlu diterjemahkan
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabel Terjemahan: `berita_translations`

Menyimpan konten yang perlu diterjemahkan.

```sql
CREATE TABLE berita_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  berita_id INT NOT NULL,
  language_id INT NOT NULL,
  judul VARCHAR(255) NOT NULL,
  isi TEXT NOT NULL,
  slug VARCHAR(255),                  -- Slug per bahasa (opsional)
  meta_title VARCHAR(255),            -- Untuk SEO
  meta_description TEXT,              -- Untuk SEO
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (berita_id) REFERENCES berita(id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
  UNIQUE KEY unique_berita_language (berita_id, language_id)
);
```

### 3. Tabel Galeri dengan Translation

#### Tabel Utama: `galeri`

```sql
CREATE TABLE galeri (
  id INT PRIMARY KEY AUTO_INCREMENT,
  foto VARCHAR(255) NOT NULL,
  urutan INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabel Terjemahan: `galeri_translations`

```sql
CREATE TABLE galeri_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  galeri_id INT NOT NULL,
  language_id INT NOT NULL,
  judul VARCHAR(255) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (galeri_id) REFERENCES galeri(id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
  UNIQUE KEY unique_galeri_language (galeri_id, language_id)
);
```

### 4. Tabel Rekam Jejak dengan Translation

#### Tabel Utama: `rekam_jejak`

```sql
CREATE TABLE rekam_jejak (
  id INT PRIMARY KEY AUTO_INCREMENT,
  foto VARCHAR(255),
  tahun INT,
  urutan INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tabel Terjemahan: `rekam_jejak_translations`

```sql
CREATE TABLE rekam_jejak_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rekam_jejak_id INT NOT NULL,
  language_id INT NOT NULL,
  judul VARCHAR(255) NOT NULL,
  isi TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rekam_jejak_id) REFERENCES rekam_jejak(id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
  UNIQUE KEY unique_rekam_jejak_language (rekam_jejak_id, language_id)
);
```

## Alternatif: Pendekatan Hybrid (Slug Global)

Jika Anda ingin slug yang sama untuk semua bahasa, struktur bisa disederhanakan:

### Tabel Berita (Hybrid)

```sql
CREATE TABLE berita (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(255) UNIQUE NOT NULL,  -- Slug global (sama untuk semua bahasa)
  foto VARCHAR(255),
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE berita_translations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  berita_id INT NOT NULL,
  language_id INT NOT NULL,
  judul VARCHAR(255) NOT NULL,
  isi TEXT NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (berita_id) REFERENCES berita(id) ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
  UNIQUE KEY unique_berita_language (berita_id, language_id)
);
```

## Query Examples

### 1. Get Berita dengan Bahasa Tertentu

```sql
SELECT
  b.id,
  b.slug,
  b.foto,
  bt.judul,
  bt.isi,
  l.code as language_code
FROM berita b
INNER JOIN berita_translations bt ON b.id = bt.berita_id
INNER JOIN languages l ON bt.language_id = l.id
WHERE l.code = 'id' AND b.is_published = TRUE
ORDER BY b.created_at DESC;
```

### 2. Get Berita dengan Fallback ke Bahasa Default

```sql
SELECT
  b.id,
  b.slug,
  b.foto,
  COALESCE(bt.judul, bt_default.judul) as judul,
  COALESCE(bt.isi, bt_default.isi) as isi
FROM berita b
LEFT JOIN berita_translations bt ON b.id = bt.berita_id
  AND bt.language_id = (SELECT id FROM languages WHERE code = 'en')
LEFT JOIN berita_translations bt_default ON b.id = bt_default.berita_id
  AND bt_default.language_id = (SELECT id FROM languages WHERE is_default = TRUE)
WHERE b.is_published = TRUE;
```

## Rekomendasi Implementasi

1. **Gunakan Migration**: Buat migration untuk setiap tabel baru
2. **Sequelize Scopes**: Buat scope untuk query dengan bahasa tertentu
3. **Middleware**: Buat middleware untuk detect bahasa dari request header
4. **Default Language**: Selalu set bahasa default (biasanya 'id' untuk Indonesia)
5. **Validation**: Pastikan setiap entitas memiliki terjemahan untuk bahasa default

## Indexing

Untuk performa yang optimal, tambahkan index:

```sql
-- Index untuk query berdasarkan bahasa
CREATE INDEX idx_berita_translations_language ON berita_translations(language_id);
CREATE INDEX idx_berita_translations_berita ON berita_translations(berita_id);

-- Index untuk slug (jika menggunakan slug per bahasa)
CREATE INDEX idx_berita_translations_slug ON berita_translations(slug);
```

## Catatan Penting

1. **Slug Strategy**:

   - Jika slug per bahasa: `berita-1-id`, `berita-1-en`
   - Jika slug global: `berita-1` (sama untuk semua bahasa)

2. **Foto/Media**:

   - Foto, video, dan media lainnya biasanya tidak perlu diterjemahkan
   - Simpan di tabel utama

3. **Metadata**:

   - Pertimbangkan untuk menambahkan meta_title dan meta_description untuk SEO

4. **Fallback**:
   - Selalu implementasikan fallback ke bahasa default jika terjemahan tidak tersedia
