export type FooterConfig = {
  tagline: string;
  hq: string;
  office: string;
  officeDetail: string;
  copyright: string;
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  tagline: "",
  hq: "",
  office: "",
  officeDetail: "",
  copyright: `© ${new Date().getFullYear()} Cửa hàng`,
};

export const FOOTER_SETTING_KEY = "footer_config";
