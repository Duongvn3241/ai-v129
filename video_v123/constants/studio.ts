export const studioColors = {
  canvas: "#090A0C",
  surface: "#151719",
  surfaceRaised: "#202326",
  ink: "#F4F5F6",
  muted: "#A2A8AE",
  line: "#2C3034",
  lime: "#FFDA1A",
  forest: "#24C4CF",
  forestSoft: "#17353A",
  violet: "#A696FF",
  violetSoft: "#2D2945",
  amber: "#FFB84A",
  amberSoft: "#3A2D1A",
  red: "#FF4667",
  redSoft: "#3B222A",
  white: "#F5F6F7",
};

export type SubtitleProject = {
  id: string;
  title: string;
  language: string;
  updated: string;
  cueCount: number;
  progress: number;
  color: string;
};

export const sampleProjects: SubtitleProject[] = [
  {
    id: "kyoto",
    title: "Một ngày ở Kyoto",
    language: "EN → VI",
    updated: "Sửa gần đây · 14:32",
    cueCount: 48,
    progress: 0.72,
    color: "#24373A",
  },
  {
    id: "studio",
    title: "Behind the studio",
    language: "JA → VI",
    updated: "Hôm qua · 18:06",
    cueCount: 32,
    progress: 1,
    color: "#302B43",
  },
  {
    id: "travel",
    title: "Weekend travel notes",
    language: "EN → VI",
    updated: "12 thg 10 · 09:18",
    cueCount: 26,
    progress: 0.38,
    color: "#3A3023",
  },
];

export type SubtitleCue = {
  id: string;
  start: string;
  end: string;
  source: string;
  translated: string;
};

export const sampleCues: SubtitleCue[] = [
  {
    id: "01",
    start: "00:00:02,120",
    end: "00:00:04,380",
    source: "The morning light is beautiful here.",
    translated: "Ánh nắng buổi sớm ở đây thật đẹp.",
  },
  {
    id: "02",
    start: "00:00:04,620",
    end: "00:00:06,900",
    source: "It makes the whole street feel quiet.",
    translated: "Cả con phố như chậm lại trong yên bình.",
  },
  {
    id: "03",
    start: "00:00:07,100",
    end: "00:00:09,420",
    source: "Let's take the small road by the river.",
    translated: "Mình đi lối nhỏ ven bờ sông nhé.",
  },
];
