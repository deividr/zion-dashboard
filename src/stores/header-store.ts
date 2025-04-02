import { create } from "zustand";

interface HeaderState {
  titles: string[];
  setTitle: (titles: string[]) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  titles: [],
  setTitle: (titles) => set({ titles }),
}));
