export type HomepageConfig = {
  seo: {
    title: string;
    description: string;
  };
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  seo: {
    title: "",
    description: "",
  },
};

export const HOMEPAGE_SETTING_KEY = "homepage_config";
