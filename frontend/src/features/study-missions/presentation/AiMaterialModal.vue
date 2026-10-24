<script setup>
import { ref } from 'vue';
import AppIcon from '@/shared/components/AppIcon.vue';
import BaseModal from '@/shared/components/BaseModal.vue';
import { useToast } from '@/shared/composables/useToast.js';
import { useMissionsStore } from '../application/missions.store.js';

const emit = defineEmits(['close', 'created']);

const store = useMissionsStore();
const toast = useToast();

const title = ref('');
const subject = ref('');
const content = ref('');
const cardCount = ref(3);
const busy = ref(false);
const errorMsg = ref('');

const sampleTemplates = [
  {
    title: 'Normalisasi Basis Data (1NF, 2NF, 3NF)',
    subject: 'Sistem Basis Data',
    content: 'Normalisasi adalah proses pengorganisasian data dalam basis data untuk menghindari redundansi dan anomali saat manipulasi data. 1NF (Bentuk Normal Pertama) mensyaratkan setiap kolom bernilai atomik dan tidak ada grup berulang. 2NF (Bentuk Normal Kedua) harus memenuhi 1NF dan tidak memiliki ketergantungan parsial, di mana setiap atribut non-kunci bergantung penuh pada primary key. 3NF (Bentuk Normal Ketiga) harus memenuhi 2NF dan tidak memiliki ketergantungan transitif, di mana atribut non-kunci tidak boleh bergantung pada atribut non-kunci lainnya.'
  },
  {
    title: 'Prinsip Clean Architecture & Domain-Driven',
    subject: 'Pemrograman Web',
    content: 'Clean Architecture memisahkan kode ke dalam lapisan terisolasi dengan Aturan Dependensi (Dependency Rule), di mana ketergantungan kode hanya boleh mengarah ke dalam menuju lapisan Domain. Lapisan Domain berisi entitas bisnis dan aturan validasi murni yang tidak boleh bergantung pada database, framework, atau UI. Lapisan Application mengatur alur use-case sistem, sedangkan Lapisan Infrastructure menangani implementasi teknis seperti SQLite database dan HTTP handler.'
  },
  {
    title: 'Model Jaringan Komputer & Protokol HTTP',
    subject: 'Jaringan Komputer',
    content: 'Model OSI terdiri dari 7 lapisan yang mengatur standardisasi komunikasi jaringan: Physical, Data Link, Network, Transport, Session, Presentation, dan Application. HTTP adalah protokol lapisan aplikasi tanpa status (stateless) yang berjalan di atas TCP/IP. Metode HTTP GET bersifat aman (safe) dan idempoten untuk mengambil resource, sedangkan metode POST digunakan untuk membuat resource baru di server dan bersifat tidak idempoten.'
  }
];

const applyTemplate = (template) => {
  title.value = template.title;
  subject.value = template.subject;
  content.value = template.content;
  errorMsg.value = '';
};

const handleGenerate = async () => {
  errorMsg.value = '';

  if (!title.value.trim()) {
    errorMsg.value = 'Judul materi wajib diisi';
    return;
  }
  if (!subject.value.trim()) {
    errorMsg.value = 'Mata kuliah / topik wajib diisi';
    return;
  }
  if (content.value.trim().length < 20) {
    errorMsg.value = 'Isi materi minimal 20 karakter agar AI dapat menganalisis konsep';
    return;
  }

  busy.value = true;
  try {
    const result = await store.generateAiDeck({
      title: title.value.trim(),
      subject: subject.value.trim(),
      content: content.value.trim(),
      cardCount: Number(cardCount.value),
      saveAsDeck: true
    });

    toast.success(result.message || 'Kuis Active Recall berhasil dihasilkan oleh AI!');
    emit('created', result.deck);
    emit('close');
  } catch (err) {
    errorMsg.value = err.message || 'Gagal menghasilkan kuis dengan AI. Coba lagi.';
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <BaseModal title="Materi Pembelajaran & Generator Active Recall AI" wide @close="emit('close')">
    <div class="space-y-4">
      <div class="p-3 bg-brand-50 border border-brand-200 rounded-lg text-sm text-brand-900 flex items-start gap-2.5">
        <span class="text-xl">✨</span>
        <div class="flex-1">
          <p class="font-semibold text-brand-800">Ubah Materi Kuliah Jadi Kuis Active Recall</p>
          <p class="text-xs text-brand-700 mt-0.5">
            Masukkan catatan kuliah atau pilih contoh di bawah. AI akan menganalisis definisi, aturan, dan fungsi inti menjadi flashcards untuk menguji ingatan aktifmu.
          </p>
        </div>
      </div>

      <!-- Quick Template Selection -->
      <div>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pilih Contoh Cepat Materi Kuliah:</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            v-for="(tpl, idx) in sampleTemplates"
            :key="idx"
            type="button"
            class="text-left p-2 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors text-xs group"
            @click="applyTemplate(tpl)"
          >
            <span class="font-semibold text-slate-800 group-hover:text-brand-600 block line-clamp-1">{{ tpl.title }}</span>
            <span class="text-slate-500 text-[11px] block mt-0.5">{{ tpl.subject }}</span>
          </button>
        </div>
      </div>

      <!-- Form Inputs -->
      <div class="space-y-3 pt-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="ai-title" class="block text-xs font-semibold text-slate-700 mb-1">Judul Topik / Bab Materi <span class="text-rose-500">*</span></label>
            <input
              id="ai-title"
              v-model="title"
              type="text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
              placeholder="Contoh: Normalisasi Basis Data"
            />
          </div>
          <div>
            <label for="ai-subject" class="block text-xs font-semibold text-slate-700 mb-1">Mata Kuliah <span class="text-rose-500">*</span></label>
            <input
              id="ai-subject"
              v-model="subject"
              type="text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
              placeholder="Contoh: Sistem Basis Data"
            />
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label for="ai-content" class="block text-xs font-semibold text-slate-700">
              Isi Catatan / Ringkasan Materi Pembelajaran <span class="text-rose-500">*</span>
            </label>
            <span class="text-[11px] text-slate-400 font-mono">{{ content.length }} karakter</span>
          </div>
          <textarea
            id="ai-content"
            v-model="content"
            rows="5"
            class="w-full p-3 text-sm rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 transition-all outline-none"
            placeholder="Tuliskan atau tempel catatan materi kuliahmu di sini... Misalnya definisi konsep, aturan, perbedaan, atau fungsi utama."
          ></textarea>
        </div>

        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-2">
            <label for="card-count" class="text-xs font-semibold text-slate-700">Jumlah Kartu:</label>
            <select
              id="card-count"
              v-model="cardCount"
              class="px-2 py-1 text-xs border border-slate-300 rounded-md focus:border-brand-500 outline-none bg-white font-semibold"
            >
              <option :value="2">2 Kartu</option>
              <option :value="3">3 Kartu (Direkomendasikan)</option>
              <option :value="5">5 Kartu</option>
            </select>
          </div>
        </div>

        <p v-if="errorMsg" class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2" role="alert">
          <AppIcon name="alert" :size="16" />
          {{ errorMsg }}
        </p>
      </div>

      <!-- Footer Buttons -->
      <div class="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          :disabled="busy"
          @click="emit('close')"
        >
          Batal
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 transition-all"
          :disabled="busy || !title || !content"
          @click="handleGenerate"
        >
          <span v-if="busy" class="inline-block animate-spin">⏳</span>
          <span v-else>✨</span>
          <span>{{ busy ? 'Menganalisis dengan AI...' : 'Buat Kuis dengan AI' }}</span>
        </button>
      </div>
    </div>
  </BaseModal>
</template>
