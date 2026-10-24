export class AiQuizService {
  constructor({ apiKey = process.env.GEMINI_API_KEY, fetchFn = globalThis.fetch } = {}) {
    this.apiKey = apiKey;
    this.fetchFn = fetchFn;
  }

  async generate({ title, subject, content, cardCount = 3 }) {
    const targetCount = Math.max(1, Math.min(10, Number(cardCount) || 3));

    if (this.apiKey && typeof this.fetchFn === 'function') {
      try {
        const cards = await this.generateWithGemini({ title, subject, content, cardCount: targetCount });
        if (Array.isArray(cards) && cards.length > 0) {
          return cards.slice(0, targetCount);
        }
      } catch {
        // Fallback ke semantic extractor jika terjadi kesalahan jaringan / kuota Gemini
      }
    }

    return this.generateWithSemanticExtractor({ title, subject, content, cardCount: targetCount });
  }

  async generateWithGemini({ title, subject, content, cardCount }) {
    const prompt = `Anda adalah asisten AI pedagogis untuk mahasiswa.
Berdasarkan materi pembelajaran berikut, buatlah ${cardCount} kartu latihan Active Recall (flashcard kuis) berkualitas tinggi.
Materi Pembelajaran:
- Topik / Judul: ${title}
- Mata Kuliah: ${subject}
- Isi Materi:
"""
${content}
"""

Setiap kartu harus memiliki:
1. "question": pertanyaan konseptual yang menguji pemahaman aktif (bukan hafalan kata demi kata)
2. "answer": jawaban kunci yang jelas dan padat
3. "explanation": penjelasan singkat mengapa jawaban tersebut benar untuk memperkuat pemahaman

Keluaran WAJIB HANYA berupa JSON Array valid tanpa teks pembuka/penutup lainnya:
[
  {
    "question": "...",
    "answer": "...",
    "explanation": "..."
  }
]`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return Array.isArray(parsed) ? parsed : null;
  }

  generateWithSemanticExtractor({ title, subject, content, cardCount }) {
    const rawSentences = content
      .replace(/\r\n/g, '\n')
      .split(/[.\n;]+/)
      .map((s) => s.trim().replace(/^[-*•\d.)\s]+/, ''))
      .filter((s) => s.length >= 15);

    const cards = [];
    const usedSentences = new Set();

    const isDefinition = (s) => /\b(adalah|merupakan|yaitu|yakni|artinya|berarti|didefinisikan sebagai|ialah)\b/i.test(s);
    const isRule = (s) => /\b(harus|wajib|syarat|mensyaratkan|prinsip|aturan|ketentuan)\b/i.test(s);
    const isFunction = (s) => /\b(berfungsi|tujuan|bertujuan|digunakan untuk|fungsinya|kegunaan|manfaat)\b/i.test(s);

    for (const sentence of rawSentences) {
      if (cards.length >= cardCount) break;

      if (isDefinition(sentence)) {
        const parts = sentence.split(/\b(?:adalah|merupakan|yaitu|yakni|artinya|berarti|ialah)\b/i);
        if (parts.length >= 2 && parts[0].trim().length > 2) {
          const term = parts[0].trim();
          const definition = parts.slice(1).join(' ').trim();
          cards.push({
            question: `Apa yang dimaksud dengan ${term}?`,
            answer: definition.charAt(0).toUpperCase() + definition.slice(1),
            explanation: `Berdasarkan materi ${subject}: ${sentence}.`
          });
          usedSentences.add(sentence);
        }
      }
    }

    for (const sentence of rawSentences) {
      if (cards.length >= cardCount) break;
      if (usedSentences.has(sentence)) continue;

      if (isRule(sentence)) {
        cards.push({
          question: `Apa aturan atau prinsip utama yang harus dipenuhi dalam "${title}"?`,
          answer: sentence,
          explanation: `Aturan ini penting untuk memahami materi ${subject} secara mendalam.`
        });
        usedSentences.add(sentence);
      } else if (isFunction(sentence)) {
        cards.push({
          question: `Apa fungsi atau tujuan utama yang dijelaskan pada topik "${title}"?`,
          answer: sentence,
          explanation: `Fungsi ini menjadi inti implementasi materi ${subject}.`
        });
        usedSentences.add(sentence);
      }
    }

    for (const sentence of rawSentences) {
      if (cards.length >= cardCount) break;
      if (usedSentences.has(sentence)) continue;

      cards.push({
        question: `Bagaimana pemahamanmu mengenai pernyataan berikut pada topik "${title}": "${sentence.slice(0, 50)}..."?`,
        answer: sentence,
        explanation: `Pemahaman aktif atas konsep ini membantu mengingat materi ${subject}.`
      });
      usedSentences.add(sentence);
    }

    // Jika materi sangat singkat, lengkapi kartu dengan ringkasan konseptual
    while (cards.length < cardCount) {
      const idx = cards.length + 1;
      cards.push({
        question: `Jelaskan ringkasan konsep ke-${idx} dari materi "${title}" (${subject})!`,
        answer: content.trim().slice(0, 150) + (content.length > 150 ? '...' : ''),
        explanation: `Refleksikan pemahaman materi secara mandiri untuk memperkuat daya ingat.`
      });
    }

    return cards.slice(0, cardCount);
  }
}
