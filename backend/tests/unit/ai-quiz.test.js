import { describe, expect, it, vi } from 'vitest';
import { openDatabase } from '../../src/core/database/connection.js';
import { CreateActiveRecallDeck } from '../../src/features/study-missions/application/create-active-recall-deck.js';
import { DeleteActiveRecallDeck } from '../../src/features/study-missions/application/delete-active-recall-deck.js';
import { GenerateAiQuiz } from '../../src/features/study-missions/application/generate-ai-quiz.js';
import { validateCreateDeck, validateGenerateAiCards } from '../../src/features/study-missions/domain/deck.validator.js';
import { AiQuizService } from '../../src/features/study-missions/infrastructure/ai-quiz.service.js';
import { migrateMissionSchema } from '../../src/features/study-missions/infrastructure/mission.schema.js';

describe('deck.validator', () => {
  it('validateGenerateAiCards memvalidasi title, subject, content, dan card_count', () => {
    expect(validateGenerateAiCards()).toMatchObject({
      title: expect.any(String),
      subject: expect.any(String),
      content: expect.any(String)
    });

    expect(validateGenerateAiCards({ title: 'a', subject: 's', content: 'terlalu pendek' })).toMatchObject({
      title: expect.stringContaining('2'),
      subject: expect.stringContaining('2'),
      content: expect.stringContaining('minimal')
    });

    expect(validateGenerateAiCards({
      title: 'T'.repeat(125),
      subject: 'S'.repeat(105),
      content: 'C'.repeat(30005),
      card_count: 15
    })).toMatchObject({
      title: expect.stringContaining('karakter'),
      subject: expect.stringContaining('karakter'),
      content: expect.stringContaining('maksimal'),
      card_count: expect.stringContaining('antara 1 sampai 10')
    });

    expect(validateGenerateAiCards({
      title: 'Valid Title',
      subject: 'Valid Subject',
      content: 'Valid content that is long enough to pass validation.',
      card_count: 3
    })).toEqual({});
  });

  it('validateCreateDeck memvalidasi title, subject, dan array kartu', () => {
    expect(validateCreateDeck()).toMatchObject({
      title: expect.any(String),
      subject: expect.any(String),
      cards: expect.any(String)
    });

    expect(validateCreateDeck({
      title: 'a',
      subject: 'b',
      cards: []
    })).toMatchObject({
      title: expect.stringContaining('2'),
      subject: expect.stringContaining('2'),
      cards: expect.stringContaining('Setidaknya satu')
    });

    expect(validateCreateDeck({
      title: 'T'.repeat(130),
      subject: 'S'.repeat(110),
      cards: [{ question: 'q', answer: 'a' }]
    })).toMatchObject({
      title: expect.stringContaining('karakter'),
      subject: expect.stringContaining('karakter'),
      card_0_question: expect.stringContaining('minimal 3'),
      card_0_answer: expect.stringContaining('minimal 2')
    });

    expect(validateCreateDeck({
      title: 'Pemrograman Web',
      subject: 'PABWE',
      cards: [{ question: 'Apa itu REST?', answer: 'Representational State Transfer' }]
    })).toEqual({});
  });
});

describe('AiQuizService', () => {
  it('menghasilkan kuis menggunakan semantic extractor ketika API key tidak ada', async () => {
    const service = new AiQuizService({ apiKey: null });
    const content = `
      Active Recall adalah metode belajar dengan menguji ingatan secara aktif bukan sekadar membaca ulang.
      Prinsip utama Active Recall harus dilakukan berulang dengan interval waktu tertentu untuk memperkuat daya ingat.
      Metode ini berfungsi untuk menstimulasi memori dan meningkatkan retensi informasi jangka panjang.
      Dalam implementasinya, mahasiswa dapat menyusun pertanyaan kartu flashcard.
    `;

    const cards = await service.generate({
      title: 'Active Recall',
      subject: 'Belajar Efektif',
      content,
      cardCount: 3
    });

    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveProperty('question');
    expect(cards[0]).toHaveProperty('answer');
    expect(cards[0]).toHaveProperty('explanation');
    expect(cards[0].question).toContain('Active Recall');
  });

  it('AiQuizService berhenti di loop definisi jika cardCount tercapai', async () => {
    const service = new AiQuizService({ apiKey: null });
    const content = `
      HTML adalah bahasa markup standar untuk membuat halaman web.
      CSS adalah bahasa style sheet untuk mendesain tampilan web.
    `;
    const cards = await service.generate({
      title: 'Web Basics',
      subject: 'PABWE',
      content,
      cardCount: 1
    });
    expect(cards).toHaveLength(1);
  });

  it('melengkapi kartu jika materi sangat singkat', async () => {
    const service = new AiQuizService({ apiKey: null });
    const cards = await service.generate({
      title: 'Sistem Operasi',
      subject: 'Informatika',
      content: 'Kernel adalah inti dari sebuah sistem operasi komputer.',
      cardCount: 4
    });

    expect(cards).toHaveLength(4);
    expect(cards[1].question).toContain('ringkasan konsep');
  });

  it('memanggil Gemini API jika apiKey tersedia dan sukses mengembalikan kartu', async () => {
    const mockCards = [
      { question: 'Q1?', answer: 'A1', explanation: 'E1' },
      { question: 'Q2?', answer: 'A2', explanation: 'E2' }
    ];

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockCards) }] } }]
      })
    });

    const service = new AiQuizService({ apiKey: 'dummy-key', fetchFn: fakeFetch });
    const cards = await service.generate({
      title: 'Struktur Data',
      subject: 'Algoritma',
      content: 'Tree adalah struktur data hierarkis.',
      cardCount: 2
    });

    expect(cards).toEqual(mockCards);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it('fallback ke semantic extractor jika Gemini API gagal atau respon tidak valid', async () => {
    const failingFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    const service = new AiQuizService({ apiKey: 'dummy-key', fetchFn: failingFetch });
    const cards = await service.generate({
      title: 'Jaringan Komputer',
      subject: 'Komunikasi Data',
      content: 'Router adalah perangkat yang meneruskan paket data antar jaringan komputer.',
      cardCount: 2
    });

    expect(cards).toHaveLength(2);
    expect(cards[0].question).toContain('Router');
  });

  it('fallback jika Gemini mengembalikan JSON objek bukan array atau candidates kosong', async () => {
    const objectFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ error: 'not array' }) }] } }]
      })
    });

    const service = new AiQuizService({ apiKey: 'dummy-key', fetchFn: objectFetch });
    const cards = await service.generate({
      title: 'Jaringan Komputer',
      subject: 'Komunikasi Data',
      content: 'Switch adalah perangkat jaringan yang menghubungkan perangkat dalam satu LAN.',
      cardCount: 'invalid'
    });
    expect(cards).toHaveLength(3);

    const emptyCandidatesFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] })
    });
    const serviceEmpty = new AiQuizService({ apiKey: 'dummy-key', fetchFn: emptyCandidatesFetch });
    const cardsEmpty = await serviceEmpty.generate({
      title: 'Jaringan Komputer',
      subject: 'Komunikasi Data',
      content: 'Switch adalah perangkat jaringan yang menghubungkan perangkat dalam satu LAN.',
      cardCount: 1
    });
    expect(cardsEmpty).toHaveLength(1);
  });

  it('AiQuizService mencakup kalimat yang bukan definisi, bukan rule, dan bukan fungsi dalam loop rule', async () => {
    const service = new AiQuizService({ apiKey: null });
    const content = `
      Algoritma Dijkstra menghitung jalur terpendek graf berbobot.
      Metode ini dirancang untuk simulasi graf sederhana di lab komputer.
    `;
    const cards = await service.generate({
      title: 'Dijkstra',
      subject: 'Graf',
      content,
      cardCount: 2
    });
    expect(cards).toHaveLength(2);
  });
});

describe('Use Cases: GenerateAiQuiz, CreateActiveRecallDeck, DeleteActiveRecallDeck', () => {
  it('default constructors and parameters are covered with execute', async () => {
    const defaultAi = new AiQuizService();
    expect(defaultAi).toBeDefined();

    const mockRepo = {
      createDeck: vi.fn().mockReturnValue({ id: 50 })
    };

    const defaultGen = new GenerateAiQuiz({
      aiQuizService: { generate: vi.fn().mockResolvedValue([{ question: 'Q', answer: 'A' }]) },
      missionRepository: mockRepo
    });
    const genRes = await defaultGen.execute({
      userId: 1,
      input: { title: 'T', subject: 'S', content: 'Konten belajar yang cukup panjang.', save_as_deck: true }
    });
    expect(genRes.deck).toEqual({ id: 50 });

    const defaultCreate = new CreateActiveRecallDeck({ missionRepository: mockRepo });
    const createRes = defaultCreate.execute({
      userId: 1,
      input: { title: 'T', subject: 'S', cards: [{ question: 'Q', answer: 'A' }] }
    });
    expect(createRes).toEqual({ id: 50 });
  });

  it('AiQuizService mencakup cabang fungsi, pernyataan umum, dan konten panjang', async () => {
    const service = new AiQuizService({ apiKey: null });
    const longSentence = 'Tujuan utama dari sistem ini adalah memastikan setiap pengeluaran terkunci dapat diverifikasi secara objektif melalui misi belajar yang terstruktur dan terukur dengan baik.';
    const functionContent = `
      Fitur ini berfungsi untuk membantu mahasiswa belajar secara konsisten.
      Mahasiswa menyusun catatan perkuliahan secara mandiri di perpustakaan kampus setiap sore.
      ${longSentence}
    `;

    const cards = await service.generate({
      title: 'Tujuan Belajar',
      subject: 'Disiplin',
      content: functionContent,
      cardCount: 4
    });

    expect(cards).toHaveLength(4);
    expect(cards.some((c) => c.question.includes('Bagaimana pemahamanmu'))).toBe(true);
  });

  it('AiQuizService melengkapi kartu jika konten panjang tapi kalimat sedikit', async () => {
    const service = new AiQuizService({ apiKey: null });
    const longText = 'Pengenalan pola arsitektur perangkat lunak modern untuk aplikasi web enterprise berbasis microservices dan event driven architecture.'.repeat(2);
    const cards = await service.generate({
      title: 'Arsitektur',
      subject: 'RPL',
      content: longText,
      cardCount: 3
    });
    expect(cards).toHaveLength(3);
  });

  it('GenerateAiQuiz menyimpan deck jika save_as_deck true dengan clock object dan clock function', async () => {
    const mockService = {
      generate: vi.fn().mockResolvedValue([{ question: 'Q?', answer: 'A', explanation: 'E' }])
    };
    const mockRepo = {
      createDeck: vi.fn().mockReturnValue({ id: 99, title: 'Test Deck' })
    };
    const fixedTime = new Date('2026-10-24T12:00:00.000Z');

    const ucWithFn = new GenerateAiQuiz({
      aiQuizService: mockService,
      missionRepository: mockRepo,
      clock: () => fixedTime
    });

    const res1 = await ucWithFn.execute({
      userId: 5,
      input: { title: 'Test Deck', subject: 'Web', content: 'Isi materi panjang untuk kuis.', save_as_deck: true }
    });
    expect(res1.deck).toEqual({ id: 99, title: 'Test Deck' });

    const ucWithObj = new GenerateAiQuiz({
      aiQuizService: mockService,
      missionRepository: mockRepo,
      clock: { now: () => fixedTime }
    });
    const res2 = await ucWithObj.execute({
      userId: 5,
      input: { title: 'Test Deck', subject: 'Web', content: 'Isi materi panjang untuk kuis.', save_as_deck: true }
    });
    expect(res2.deck).toEqual({ id: 99, title: 'Test Deck' });
  });

  it('GenerateAiQuiz tidak menyimpan deck jika save_as_deck false', async () => {
    const mockService = {
      generate: vi.fn().mockResolvedValue([{ question: 'Q?', answer: 'A', explanation: 'E' }])
    };
    const mockRepo = { createDeck: vi.fn() };

    const uc = new GenerateAiQuiz({
      aiQuizService: mockService,
      missionRepository: mockRepo
    });

    const result = await uc.execute({
      userId: 5,
      input: { title: 'Test Deck', subject: 'Web', content: 'Isi materi panjang untuk kuis.', save_as_deck: false }
    });

    expect(result.deck).toBeNull();
    expect(result.cards).toHaveLength(1);
    expect(mockRepo.createDeck).not.toHaveBeenCalled();
  });

  it('CreateActiveRecallDeck memanggil repository.createDeck dengan dan tanpa deskripsi/content', () => {
    const mockRepo = {
      createDeck: vi.fn().mockReturnValue({ id: 101 })
    };
    const uc = new CreateActiveRecallDeck({ missionRepository: mockRepo, clock: { now: () => new Date('2026-10-24T10:00:00Z') } });
    const res = uc.execute({
      userId: 7,
      input: { title: 'My Deck', subject: 'PABWE', cards: [{ question: 'Q', answer: 'A' }] }
    });
    expect(res).toEqual({ id: 101 });
    expect(mockRepo.createDeck).toHaveBeenCalledWith(expect.objectContaining({
      description: '',
      content: ''
    }));

    uc.execute({
      userId: 7,
      input: { title: 'My Deck 2', description: 'desc', subject: 'PABWE', content: 'cnt', cards: [{ question: 'Q', answer: 'A' }] }
    });
    expect(mockRepo.createDeck).toHaveBeenCalledWith(expect.objectContaining({
      description: 'desc',
      content: 'cnt'
    }));
  });

  it('DeleteActiveRecallDeck melempar NotFoundError jika gagal menghapus', () => {
    const mockRepo = { deleteDeck: vi.fn().mockReturnValue(false) };
    const uc = new DeleteActiveRecallDeck({ missionRepository: mockRepo });
    expect(() => uc.execute({ userId: 1, deckId: 999 })).toThrow(/tidak ditemukan atau bukan milikmu/);
  });

  it('DeleteActiveRecallDeck mengembalikan pesan sukses jika berhasil menghapus', () => {
    const mockRepo = { deleteDeck: vi.fn().mockReturnValue(true) };
    const uc = new DeleteActiveRecallDeck({ missionRepository: mockRepo });
    const res = uc.execute({ userId: 1, deckId: 10 });
    expect(res.success).toBe(true);
  });
});

import { SqliteMissionRepository } from '../../src/features/study-missions/infrastructure/mission.repository.js';

describe('SqliteMissionRepository findDecks and createDeck branches', () => {
  it('findDecks tanpa argumen dan createDeck tanpa penjelasan kartu', () => {
    const db = openDatabase(':memory:');
    db.exec(`
      CREATE TABLE active_recall_decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT,
        created_at TEXT
      );
      CREATE TABLE active_recall_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        explanation TEXT
      );
    `);

    const repo = new SqliteMissionRepository({ db });

    // createDeck dengan explanation null/undefined
    const created = repo.createDeck({
      title: 'Deck X',
      subject: 'Sub',
      cards: [{ question: 'Q1?', answer: 'A1' }, { question: 'Q2?', answer: 'A2', explanation: 'exp' }]
    });
    expect(created.cards).toHaveLength(2);

    // findDecks() tanpa argumen
    const allDecks = repo.findDecks();
    expect(allDecks).toHaveLength(1);

    // findDecks(userId) dengan argumen
    const userDecks = repo.findDecks(1);
    expect(userDecks).toHaveLength(1);

    db.close();
  });
});

describe('migrateMissionSchema', () => {
  it('menambahkan kolom user_id, content, created_at bila belum ada', () => {
    const db = openDatabase(':memory:');
    db.exec(`
      CREATE TABLE active_recall_decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        subject TEXT NOT NULL
      );
    `);

    migrateMissionSchema(db);

    const colsAfter = db.prepare('PRAGMA table_info(active_recall_decks)').all().map((c) => c.name);
    expect(colsAfter).toContain('user_id');
    expect(colsAfter).toContain('content');
    expect(colsAfter).toContain('created_at');

    // Idempotent test: run again
    migrateMissionSchema(db);
    db.close();
  });
});
