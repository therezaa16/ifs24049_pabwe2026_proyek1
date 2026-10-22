import { reactive } from 'vue';

const state = reactive({ items: [] });
let nextId = 1;

const DEFAULT_DURATION_MS = 4200;

export const useToast = () => {
  const dismiss = (id) => {
    state.items = state.items.filter((item) => item.id !== id);
  };

  const push = (message, tone = 'info', duration = DEFAULT_DURATION_MS) => {
    const id = nextId;
    nextId += 1;
    state.items.push({ id, message, tone });
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  };

  return {
    items: state.items,
    dismiss,
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error', DEFAULT_DURATION_MS * 1.5),
    info: (message) => push(message, 'info')
  };
};
