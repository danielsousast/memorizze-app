const grade = (text: string, background: string) => ({ text, background });

export const lightColors = {
  background: "#F4F4F1",
  surface: "#FFFFFF",
  surface2: "#E9E9E4",
  border: "#E3E3DE",
  text: "#16161B",
  text2: "#5D5D68",
  accent: "#5B45E0",
  accentSoft: "#ECE9FC",
  accentInk: "#4330C4",
  onAccent: "#FFFFFF",
  grade: {
    again: grade("#B0222A", "#FCE6E6"),
    hard: grade("#964705", "#FDEAD6"),
    good: grade("#1A6B3C", "#DDF2E4"),
    easy: grade("#1C55BF", "#E1EBFD"),
  },
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  background: "#101013",
  surface: "#1A1A1F",
  surface2: "#24242A",
  border: "#2B2B32",
  text: "#F2F2F5",
  text2: "#A4A4B0",
  accent: "#9C8CFF",
  accentSoft: "#2A2448",
  accentInk: "#C5BCFF",
  onAccent: "#15121F",
  grade: {
    again: grade("#FF9C9C", "#3B1C1E"),
    hard: grade("#FFB677", "#3A2715"),
    good: grade("#80DBA2", "#15301F"),
    easy: grade("#93BBFF", "#16273F"),
  },
};
