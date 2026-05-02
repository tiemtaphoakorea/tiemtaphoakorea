export type FooterConfig = {
  tagline: string;
  copyright: string;
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  tagline: "",
  copyright: `© ${new Date().getFullYear()} Cửa hàng`,
};

export const FOOTER_SETTING_KEY = "footer_config";
