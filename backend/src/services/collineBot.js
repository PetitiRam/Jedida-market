// Colline — the template & imagery AI bot.
// Job: given a category (and optionally a product name), generate a reusable
// listing template — a title pattern, a description skeleton, and a specs
// schema sellers can fill in fast — plus suggested product image URLs.
//
// Text generation upgrades to real Claude reasoning when ANTHROPIC_API_KEY
// is set (falls back to the deterministic schema below on any failure).
// Image sourcing upgrades to real Google Custom Search results when
// GOOGLE_SEARCH_API_KEY/GOOGLE_SEARCH_ENGINE_ID are set (falls back to
// Unsplash category URLs otherwise). Both upgrades are independent — you
// can have one configured without the other.

import { isClaudeConfigured, askClaudeForJson } from './anthropicClient.js';
import { isGoogleSearchConfigured, searchProductImages } from './googleClient.js';

const CATEGORY_SPEC_SCHEMAS = {
  agriculture: { produce_type: '', unit: 'kg', harvest_date: '', origin_farm: '', organic: 'no' },
  electronics: { brand: '', model: '', warranty: '', condition_notes: '' },
  fashion: { size: '', material: '', color: '', brand: '' },
  vehicles: { make: '', model: '', year: '', mileage_km: '', fuel_type: '' },
  food_and_beverages: { weight: '', expiry_date: '', ingredients: '' },
  other: { details: '' }
};

function heuristicTemplate({ shopName, category, productHint }) {
  const schema = CATEGORY_SPEC_SCHEMAS[category] || CATEGORY_SPEC_SCHEMAS.other;
  const niceCategory = (category || 'product').replace(/_/g, ' ');

  const titleTemplate = productHint
    ? `${productHint} — {condition} {category}`
    : `{product_name} — {condition} ${niceCategory}`;

  const descriptionTemplate =
    `{product_name} available from ${shopName || 'our shop'} on JEDIDA Marketplace. ` +
    `Category: ${niceCategory}. {short_pitch} Reach out with any questions before ordering.`;

  return { titleTemplate, descriptionTemplate, specsTemplate: schema };
}

async function resolveImages(category, productHint) {
  const niceCategory = (category || 'product').replace(/_/g, ' ');
  const searchTerm = productHint || niceCategory;

  if (isGoogleSearchConfigured()) {
    try {
      const results = await searchProductImages(`${searchTerm} product photo`, 4);
      if (results.length > 0) return results;
    } catch (err) {
      console.error('Colline: Google image search failed, falling back to placeholder images.', err.message);
    }
  }

return [
  `https://picsum.photos/seed/${encodeURIComponent(niceCategory)}/600/600`,
  `https://picsum.photos/seed/${encodeURIComponent(searchTerm)}/600/600`
];
}

export async function generateTemplate({ shopName, category, productHint }) {
  const niceCategory = (category || 'product').replace(/_/g, ' ');
  let textResult;

  if (isClaudeConfigured()) {
    try {
      textResult = await askClaudeForJson(
        `You are Colline, the listing-template AI bot for JEDIDA Marketplace, an African-rooted e-commerce platform. Generate a reusable listing template for a product category so a seller can quickly fill in details for many similar products.`,
        `Shop name: ${shopName || 'a JEDIDA shop'}\nCategory: ${niceCategory}\nProduct hint: ${productHint || '(none)'}\n\nReturn JSON: {"titleTemplate": "pattern using {product_name}, {condition}, {category} placeholders", "descriptionTemplate": "pattern using {product_name} and {short_pitch} placeholders", "specsTemplate": {"key1": "", "key2": ""}}. specsTemplate should have 3-6 fields relevant to this category, with empty string values.`,
        { maxTokens: 500 }
      );
      if (!textResult.titleTemplate || !textResult.specsTemplate) throw new Error('Incomplete Claude response');
    } catch (err) {
      console.error('Colline: Claude call failed, falling back to heuristic template.', err.message);
      textResult = heuristicTemplate({ shopName, category, productHint });
    }
  } else {
    textResult = heuristicTemplate({ shopName, category, productHint });
  }

  const suggestedImageUrls = await resolveImages(category, productHint);

  return {
    name: `${niceCategory} template`,
    category: category || 'other',
    titleTemplate: textResult.titleTemplate,
    descriptionTemplate: textResult.descriptionTemplate,
    specsTemplate: textResult.specsTemplate,
    suggestedImageUrls,
    generatedByAi: true
  };
}
