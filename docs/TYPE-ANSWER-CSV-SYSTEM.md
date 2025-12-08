# Type The Answer - CSV Data Export System

## Overview

Sistem ini secara otomatis mengexport data **Type The Answer Game** ke dalam 3 file CSV yang disimpan di `prisma/seeder/data/`:

1. **type-answer-games.data.csv** - Data game (judul, deskripsi, thumbnail, settings, dll)
2. **type-answer-questions.data.csv** - Data pertanyaan beserta jawabannya
3. **type-answer-results.data.csv** - Data hasil permainan (skor, waktu, dll)

## Auto-Sync Features

CSV akan **otomatis terupdate** setiap kali ada perubahan data:

### ✅ Trigger Events:
- **Create Game** - Saat game baru dibuat
- **Update Game** - Saat game di-edit (judul, deskripsi, pertanyaan, thumbnail, timer, points)
- **Update Status** - Saat game dipublish/draft
- **Submit Result** - Saat pemain menyelesaikan game
- **Delete Game** - Cascade delete akan menghapus data terkait, kemudian sync CSV

### 📋 CSV File Structure

#### 1. type-answer-games.data.csv
```csv
id,templateId,creatorId,creator_username,title,description,thumbnailUrl,timeLimitSec,pointsPerQuestion,status,publishedAt,createdAt,updatedAt
```

**Fields:**
- `id` - UUID game
- `templateId` - UUID template (cc7634f2-ddd9-450e-a0c7-7e80c7cd206d untuk type-the-answer)
- `creatorId` - UUID pembuat game
- `creator_username` - Username pembuat
- `title` - Judul game
- `description` - Deskripsi game
- `thumbnailUrl` - Path ke file thumbnail
- `timeLimitSec` - Batas waktu (detik)
- `pointsPerQuestion` - Poin per pertanyaan benar
- `status` - DRAFT atau PUBLISHED
- `publishedAt` - Tanggal publish (kosong jika DRAFT)
- `createdAt` - Tanggal dibuat
- `updatedAt` - Tanggal terakhir diupdate

#### 2. type-answer-questions.data.csv
```csv
id,gameId,order,text,answer
```

**Fields:**
- `id` - UUID pertanyaan
- `gameId` - UUID game (foreign key ke type-answer-games)
- `order` - Urutan pertanyaan (1, 2, 3, ...)
- `text` - Teks pertanyaan
- `answer` - Jawaban yang benar (case-insensitive saat checking)

#### 3. type-answer-results.data.csv
```csv
id,gameId,playerId,player_username,score,correctAnswers,totalQuestions,completionTime,percentage,createdAt
```

**Fields:**
- `id` - UUID result
- `gameId` - UUID game (foreign key ke type-answer-games)
- `playerId` - UUID pemain
- `player_username` - Username pemain
- `score` - Total skor (correctAnswers × pointsPerQuestion)
- `correctAnswers` - Jumlah jawaban benar
- `totalQuestions` - Total pertanyaan
- `completionTime` - Waktu penyelesaian (detik)
- `percentage` - Persentase kebenaran (0-100)
- `createdAt` - Tanggal result dibuat

## Manual Export

Jika perlu export manual, jalankan script:

```bash
bunx tsx scripts/export-type-answer-data.ts
```

Script ini akan:
1. Query semua data TypeAnswerGame dari database
2. Generate 3 file CSV
3. Overwrite file CSV yang ada
4. Tampilkan summary: jumlah games, questions, dan results

## Implementation Details

### Service Layer (`type-the-answer.service.ts`)

```typescript
import { syncTypeAnswerCSV } from '@/utils/csv-sync.util';

// Dipanggil setelah operasi berhasil
syncTypeAnswerCSV().catch(err => console.error('CSV sync error:', err));
```

### Utility (`csv-sync.util.ts`)

Fungsi `syncTypeAnswerCSV()` melakukan:
1. Query all TypeAnswerGame dengan relations (questions, results, creator, player)
2. Transform data ke format CSV
3. Escape special characters (quote doubling untuk CSV standard)
4. Write ke file dengan `writeFileSync`
5. Return summary statistics

### Error Handling

- CSV sync berjalan **asynchronous** untuk tidak block response
- Error di-log tapi tidak mempengaruhi response API
- Jika sync gagal, data tetap tersimpan di database
- Manual export dapat dilakukan kapan saja

## Data Consistency

### Cascade Delete
Database schema menggunakan `onDelete: Cascade`:
- Delete User → Delete TypeAnswerGames → Delete Questions & Results
- CSV akan tersync otomatis setelah delete

### Update Flow
1. User submit form edit
2. Backend update database (transaction)
3. Response dikirim ke frontend
4. CSV sync triggered (async, non-blocking)
5. Console log: "✅ CSV Synced: X games, Y questions, Z results"

## CSV Format Notes

- **Encoding**: UTF-8
- **Line Ending**: LF (`\n`)
- **Quote Character**: Double quote (`"`)
- **Escape Method**: Quote doubling (`"` becomes `""`)
- **Delimiter**: Comma (`,`)
- **Header**: First line always contains column names

## Use Cases

1. **Backup & Recovery** - CSV sebagai backup data yang readable
2. **Data Analysis** - Import ke Excel/Google Sheets untuk analisis
3. **Seeding** - Bisa digunakan untuk seed database baru
4. **Documentation** - Track perubahan data dari waktu ke waktu
5. **Debugging** - Quick view data tanpa query database

## Monitoring

Log output dari sync:
```
✅ CSV Synced: 12 games, 22 questions, 15 results
```

Jika ada error:
```
CSV sync error: <error message>
```

## Future Enhancements

Potential improvements:
- [ ] Incremental update (hanya update baris yang berubah)
- [ ] CSV versioning (timestamp di filename)
- [ ] Compression untuk file besar
- [ ] Export ke format lain (JSON, XML)
- [ ] Scheduled backup (cron job)
- [ ] Delta tracking (log changes)

## Related Files

```
FP-PemrogramanWebsite-BE-2025/
├── prisma/
│   └── seeder/
│       └── data/
│           ├── type-answer-games.data.csv
│           ├── type-answer-questions.data.csv
│           └── type-answer-results.data.csv
├── scripts/
│   └── export-type-answer-data.ts
└── src/
    ├── api/game/game-list/type-the-answer/
    │   └── type-the-answer.service.ts
    └── utils/
        └── csv-sync.util.ts
```

---

**Last Updated**: December 7, 2025  
**Current Stats**: 12 games, 22 questions, 15 results
