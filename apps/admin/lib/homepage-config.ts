export type HomepageConfig = {
  sections: {
    hero: boolean;
    flashSale: boolean;
    categories: boolean;
    bestSellers: boolean;
    newArrivals: boolean;
    blog: boolean;
  };
  productsPerSection: number;
  defaultSort: "bestseller" | "newest" | "price-asc";
  seo: {
    title: string;
    description: string;
  };
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sections: {
    hero: true,
    flashSale: true,
    categories: true,
    bestSellers: true,
    newArrivals: true,
    blog: false,
  },
  productsPerSection: 8,
  defaultSort: "bestseller",
  seo: {
    title: "",
    description: "",
  },
};

export const HOMEPAGE_SETTING_KEY = "homepage_config";
