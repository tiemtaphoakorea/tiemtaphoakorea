export interface RadiusToken {
  name: string;
  tailwind: string;
  computed: string;
  usage: string;
}

export const radiusTokens: RadiusToken[] = [
  { name: "--radius-sm", tailwind: "rounded-sm", computed: "4px", usage: "Checkboxes, small tags" },
  { name: "--radius-md", tailwind: "rounded-md", computed: "6px", usage: "Buttons, inputs" },
  { name: "--radius-lg", tailwind: "rounded-lg", computed: "8px", usage: "Default radius" },
  { name: "--radius-xl", tailwind: "rounded-xl", computed: "12px", usage: "Cards, popovers" },
  { name: "--radius-2xl", tailwind: "rounded-2xl", computed: "16px", usage: "Large cards, modals" },
  { name: "--radius-3xl", tailwind: "rounded-3xl", computed: "20px", usage: "Hero surfaces" },
  { name: "--radius-4xl", tailwind: "rounded-4xl", computed: "24px", usage: "Pill-style elements" },
  { name: "N/A", tailwind: "rounded-full", computed: "9999px", usage: "Avatars, badges" },
];
