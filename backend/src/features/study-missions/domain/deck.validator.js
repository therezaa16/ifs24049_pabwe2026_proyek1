import { isNonBlankString, isPositiveInteger, toNumberOrNaN } from '../../../core/utils/validation.js';

const TITLE_MIN_LENGTH = 2;
const TITLE_MAX_LENGTH = 120;
const SUBJECT_MIN_LENGTH = 2;
const SUBJECT_MAX_LENGTH = 100;
const CONTENT_MIN_LENGTH = 15;
const CONTENT_MAX_LENGTH = 30000;

export const validateGenerateAiCards = (body = {}) => {
  const errors = {};

  if (!isNonBlankString(body.title)) {
    errors.title = 'Judul materi wajib diisi';
  } else if (body.title.trim().length < TITLE_MIN_LENGTH || body.title.trim().length > TITLE_MAX_LENGTH) {
    errors.title = `Judul materi harus ${TITLE_MIN_LENGTH} sampai ${TITLE_MAX_LENGTH} karakter`;
  }

  if (!isNonBlankString(body.subject)) {
    errors.subject = 'Mata kuliah wajib diisi';
  } else if (body.subject.trim().length < SUBJECT_MIN_LENGTH || body.subject.trim().length > SUBJECT_MAX_LENGTH) {
    errors.subject = `Mata kuliah harus ${SUBJECT_MIN_LENGTH} sampai ${SUBJECT_MAX_LENGTH} karakter`;
  }

  if (!isNonBlankString(body.content)) {
    errors.content = 'Teks materi pembelajaran wajib diisi';
  } else if (body.content.trim().length < CONTENT_MIN_LENGTH) {
    errors.content = `Materi pembelajaran terlalu singkat (minimal ${CONTENT_MIN_LENGTH} karakter)`;
  } else if (body.content.trim().length > CONTENT_MAX_LENGTH) {
    errors.content = `Materi pembelajaran maksimal ${CONTENT_MAX_LENGTH} karakter`;
  }

  if (body.card_count !== undefined && body.card_count !== null) {
    const count = toNumberOrNaN(body.card_count);
    if (!Number.isInteger(count) || count < 1 || count > 10) {
      errors.card_count = 'Jumlah kartu kuis harus antara 1 sampai 10';
    }
  }

  return errors;
};

export const validateCreateDeck = (body = {}) => {
  const errors = {};

  if (!isNonBlankString(body.title)) {
    errors.title = 'Judul materi wajib diisi';
  } else if (body.title.trim().length < TITLE_MIN_LENGTH || body.title.trim().length > TITLE_MAX_LENGTH) {
    errors.title = `Judul materi harus ${TITLE_MIN_LENGTH} sampai ${TITLE_MAX_LENGTH} karakter`;
  }

  if (!isNonBlankString(body.subject)) {
    errors.subject = 'Mata kuliah wajib diisi';
  } else if (body.subject.trim().length < SUBJECT_MIN_LENGTH || body.subject.trim().length > SUBJECT_MAX_LENGTH) {
    errors.subject = `Mata kuliah harus ${SUBJECT_MIN_LENGTH} sampai ${SUBJECT_MAX_LENGTH} karakter`;
  }

  if (!Array.isArray(body.cards) || body.cards.length === 0) {
    errors.cards = 'Setidaknya satu kartu pertanyaan harus disertakan';
  } else {
    for (let i = 0; i < body.cards.length; i += 1) {
      const card = body.cards[i];
      if (!isNonBlankString(card.question) || card.question.trim().length < 3) {
        errors[`card_${i}_question`] = `Pertanyaan kartu ${i + 1} minimal 3 karakter`;
      }
      if (!isNonBlankString(card.answer) || card.answer.trim().length < 2) {
        errors[`card_${i}_answer`] = `Jawaban kartu ${i + 1} minimal 2 karakter`;
      }
    }
  }

  return errors;
};
