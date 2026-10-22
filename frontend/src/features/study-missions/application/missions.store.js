import { defineStore } from 'pinia';
import { ref } from 'vue';
import { missionsApi } from '../infrastructure/missions.api.js';

const DEFAULT_SETTINGS = Object.freeze({ timeScale: 1, passingScore: 70, minPomodoroMinutesToUnlock: 25, secondsPerCard: 15 });

export const useMissionsStore = defineStore('missions', () => {
  const settings = ref({ ...DEFAULT_SETTINGS });
  const decks = ref([]);
  const history = ref([]);
  const ready = ref(false);

  const loadHistory = async () => {
    history.value = (await missionsApi.history()).missions;
  };

  const load = async () => {
    const [settingsData, decksData] = await Promise.all([missionsApi.settings(), missionsApi.decks()]);
    settings.value = settingsData.settings;
    decks.value = decksData.decks;
    await loadHistory();
    ready.value = true;
  };

  const startSession = async (input) => (await missionsApi.start(input)).session;

  const completeSession = async (sessionId, score) => {
    const result = await missionsApi.complete(sessionId, score);
    await loadHistory();
    return result;
  };

  const reset = () => {
    settings.value = { ...DEFAULT_SETTINGS };
    decks.value = [];
    history.value = [];
    ready.value = false;
  };

  return { settings, decks, history, ready, load, loadHistory, startSession, completeSession, reset };
});
