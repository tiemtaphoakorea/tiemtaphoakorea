export type SocialConfig = {
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  zalo: string;
};

export const DEFAULT_SOCIAL_CONFIG: SocialConfig = {
  instagram: "",
  facebook: "",
  youtube: "",
  tiktok: "",
  zalo: "",
};

export const SOCIAL_SETTING_KEY = "social_config";
