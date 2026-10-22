const DECKS = [
  {
    title: 'Pemrograman Web & Clean Architecture',
    description: 'Konsep dasar web, REST API, Express.js, dan Clean Architecture',
    subject: 'Pemrograman Web',
    cards: [
      {
        question: 'Apa prinsip utama Clean Architecture pada lapisan domain?',
        answer: 'Domain layer berisi entitas dan aturan bisnis murni serta TIDAK boleh bergantung pada framework, database, atau UI.',
        explanation: 'Dependency Rule: dependensi source code hanya boleh mengarah ke dalam, menuju domain.'
      },
      {
        question: 'Apa perbedaan mendasar antara HTTP method GET, POST, PUT, dan DELETE?',
        answer: 'GET mengambil data, POST membuat resource baru, PUT memperbarui resource secara menyeluruh, dan DELETE menghapus resource.',
        explanation: 'GET bersifat safe dan idempotent, sedangkan POST tidak idempotent.'
      },
      {
        question: 'Mengapa password tidak boleh disimpan dalam plaintext di database?',
        answer: 'Jika database bocor, seluruh akun langsung terancam. Password harus di-hash dengan algoritma ber-salt seperti bcrypt.',
        explanation: 'Bcrypt menambahkan salt acak dan work factor untuk menghambat dictionary dan rainbow table attack.'
      }
    ]
  },
  {
    title: 'Literasi Finansial & Mindful Spending',
    description: 'Anggaran mahasiswa, aturan 50/30/20, dan mengendalikan belanja impulsif',
    subject: 'Literasi Finansial',
    cards: [
      {
        question: 'Apa rumus alokasi anggaran 50/30/20?',
        answer: '50% untuk kebutuhan pokok, 30% untuk keinginan, dan 20% untuk tabungan atau dana darurat.',
        explanation: 'Prinsip ini menjaga agar pengeluaran gaya hidup tidak menggerus kebutuhan dasar.'
      },
      {
        question: 'Apa yang dimaksud dengan delayed gratification dalam keuangan pribadi?',
        answer: 'Kemampuan menunda kepuasan instan demi tujuan jangka panjang yang lebih bermakna.',
        explanation: 'Mengaitkan belanja keinginan dengan misi belajar melatih penundaan kepuasan secara konkret.'
      },
      {
        question: 'Apa perbedaan esensial antara kebutuhan dan keinginan?',
        answer: 'Kebutuhan esensial bagi kelangsungan hidup dan studi (makan, buku, kos); keinginan hanya pelengkap kenyamanan.',
        explanation: 'Keinginan boleh dipenuhi bila kebutuhan primer aman.'
      }
    ]
  },
  {
    title: 'Struktur Data & Kompleksitas Algoritma',
    description: 'Konsep stack, queue, hash table, dan notasi Big-O',
    subject: 'Struktur Data',
    cards: [
      {
        question: 'Berapa kompleksitas waktu pencarian pada hash table dalam kasus rata-rata?',
        answer: 'O(1), atau waktu konstan.',
        explanation: 'Fungsi hash memetakan key langsung ke bucket, selama tabrakan hash tidak berlebihan.'
      },
      {
        question: 'Apa perbedaan utama antara stack dan queue?',
        answer: 'Stack bersifat LIFO (last in, first out), sedangkan queue bersifat FIFO (first in, first out).',
        explanation: 'Stack dipakai pada undo dan call stack; queue pada antrean pesan dan penjadwalan tugas.'
      }
    ]
  }
];

export const seedActiveRecallDecks = (db) => {
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM active_recall_decks').get();
  if (total > 0) {
    return;
  }

  const insertDeck = db.prepare('INSERT INTO active_recall_decks (title, description, subject) VALUES (?, ?, ?)');
  const insertCard = db.prepare(
    'INSERT INTO active_recall_cards (deck_id, question, answer, explanation) VALUES (?, ?, ?, ?)'
  );

  for (const deck of DECKS) {
    const { lastInsertRowid } = insertDeck.run(deck.title, deck.description, deck.subject);
    for (const card of deck.cards) {
      insertCard.run(lastInsertRowid, card.question, card.answer, card.explanation);
    }
  }
};
