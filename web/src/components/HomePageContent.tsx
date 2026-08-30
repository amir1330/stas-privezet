import { BrandGrid } from "@/components/BrandGrid";
import {
  AccessoriesSection,
  ClothingSection,
  FootwearSection,
} from "@/components/FootwearSection";
import { CuratedPicks } from "@/components/CuratedPicks";
import { GenderTabs } from "@/components/GenderTabs";
import { GiftCertPromo } from "@/components/GiftCertPromo";
import { HomeGuaranteeLine } from "@/components/HomeGuaranteeLine";
import { HomeSearchHero } from "@/components/HomeSearchHero";
import { LookbookSection } from "@/components/LookbookSection";
import { MegaCategoryGrid } from "@/components/MegaCategoryGrid";
import { PickupToday } from "@/components/PickupToday";
import { Reveal } from "@/components/Reveal";
import type { ProductListItem } from "@/lib/api";
import { sortedSections, type SiteConfig } from "@/lib/site-config";

type Props = {
  siteConfig: SiteConfig;
  products: ProductListItem[];
  inStock: ProductListItem[];
  categories: { id: string; name: string; slug: string }[];
  brands: string[];
  categoryThumbs: Record<string, string>;
};

export function HomePageContent({
  siteConfig,
  products,
  inStock,
  categories,
  brands,
  categoryThumbs,
}: Props) {
  const sections = sortedSections(siteConfig);
  const featured = products.slice(0, 24);

  const renderSection = (type: string) => {
    switch (type) {
      case "hero":
        return <HomeSearchHero key="hero" />;
      case "guarantee":
        return (
          <Reveal key="guarantee">
            <HomeGuaranteeLine />
          </Reveal>
        );
      case "mega_categories":
        return (
          <MegaCategoryGrid
            key="mega"
            products={products}
            categoryThumbs={categoryThumbs}
            siteConfig={siteConfig}
          />
        );
      case "brands":
        return (
          <Reveal key="brands">
            <div className="bg-[#f6f6f6] pb-2 pt-2">
              <BrandGrid brands={brands} />
            </div>
          </Reveal>
        );
      case "gender_tabs":
        return (
          <Reveal key="gender">
            <div className="bg-[#f6f6f6]">
              <GenderTabs />
            </div>
          </Reveal>
        );
      case "footwear":
        return (
          <FootwearSection
            key="footwear"
            categories={categories}
            products={featured}
            inStock={inStock}
            categoryThumbs={categoryThumbs}
            siteConfig={siteConfig}
          />
        );
      case "clothing":
        return (
          <ClothingSection
            key="clothing"
            categories={categories}
            products={featured}
            inStock={inStock}
            categoryThumbs={categoryThumbs}
            siteConfig={siteConfig}
          />
        );
      case "lookbook":
        return (
          <Reveal key="lookbook">
            <LookbookSection products={featured} />
          </Reveal>
        );
      case "accessories":
        return (
          <AccessoriesSection
            key="accessories"
            products={featured}
            inStock={inStock}
            categoryThumbs={categoryThumbs}
            siteConfig={siteConfig}
          />
        );
      case "curated":
        return (
          <Reveal key="curated">
            <CuratedPicks products={featured} />
          </Reveal>
        );
      case "pickup":
        return (
          <Reveal key="pickup">
            <PickupToday products={inStock.length > 0 ? inStock : featured} />
          </Reveal>
        );
      case "gift_cert":
        return (
          <Reveal key="gift">
            <GiftCertPromo />
          </Reveal>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white pb-4">
      <div className="mx-auto max-w-[1400px]">
        {sections.map((s) => renderSection(s.type))}
      </div>
    </div>
  );
}
