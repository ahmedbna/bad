// store/cadStore.js
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useCADStore = create(
  immer((set, get) => ({
    // Object management
    objects: [],
    selectedObjectIds: [],

    // Commands
    activeCommand: null,
    commandHistory: [],

    // View settings
    viewSettings: {
      grid: true,
      snap: true,
      units: 'mm',
      viewMode: '3d', // '2d' or '3d'
    },

    // Actions
    addObject: (object) =>
      set((state) => {
        state.objects.push({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          ...object,
        });
      }),

    removeObject: (id) =>
      set((state) => {
        state.objects = state.objects.filter((obj) => obj.id !== id);
        state.selectedObjectIds = state.selectedObjectIds.filter(
          (objId) => objId !== id
        );
      }),

    updateObject: (id, updates) =>
      set((state) => {
        const index = state.objects.findIndex((obj) => obj.id === id);
        if (index !== -1) {
          state.objects[index] = { ...state.objects[index], ...updates };
        }
      }),

    setSelection: (ids) =>
      set((state) => {
        state.selectedObjectIds = ids;
      }),

    startCommand: (command) =>
      set((state) => {
        state.activeCommand = command;
      }),

    finishCommand: () =>
      set((state) => {
        if (state.activeCommand) {
          state.commandHistory.push(state.activeCommand);
          state.activeCommand = null;
        }
      }),
  }))
);
