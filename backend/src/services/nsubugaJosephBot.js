// Nsubuga Joseph — the product-management AI bot.
// Job: clean up seller-submitted listings before they reach pending_review —
// fixing casing/formatting, tightening titles, filling a short description
// when the seller left one blank, and flagging anything that looks incomplete.
//
// Now wired to real Claude reasoning (via anthropicClient.js) when
// ANTHROPIC_API_KEY is set. Falls back automatically to the deterministic
// heuristic below on any error (missing key, API failure, bad JSON) so the
// listing flow never breaks because of an AI outage.

import { isClaudeConfigured, askClaudeForJson } from './anthropicClient.js';

function titleCase(str = '') {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function heuristicPolish({ title, description, category, specs }) {
  const notes = [];

  let polishedTitle = (title || '').trim();
  if (polishedTitle.length > 80) {
    notes.push('Title shortened to fit marketplace display.');
    polishedTitle = polishedTitle.slice(0, 80).trim();
  }
  polishedTitle = titleCase(polishedTitle);

  let polishedDescription = (description || '').trim();
  if (!polishedDescription) {
    const specEntries = specs ? Object.entries(specs).filter(([, v]) => v) : [];
    const specLine = specEntries.length
      ? ` Key details: ${specEntries.map(([k, v]) => `${k}: ${v}`).join(', ')}.`
      : '';
    polishedDescription = `${polishedTitle} — listed in the ${(category || 'general').replace('_', ' ')} category on JEDIDA Marketplace.${specLine}`;
    notes.push('Generated a starter description from the listing details — the seller can edit it any time.');
  }

  if (!specs || Object.keys(specs).length === 0) {
    notes.push('No specs provided — consider adding details like size, material or origin to help buyers compare.');
  }

  return { title: polishedTitle, description: polishedDescription, notes: notes.join(' ') };
}

export async function polishListing({ title, description, category, specs }) {
  if (!isClaudeConfigured()) {
    return heuristicPolish({ title, description, category, specs });
  }

  try {
    const result = await askClaudeForJson(
      `You are Nsubuga Joseph, the product-listing quality bot for JEDIDA Marketplace, an African-rooted e-commerce platform. Given a seller's raw listing details, return polished marketplace copy.`,
      `Title: ${title}\nDescription: ${description || '(none provided)'}\nCategory: ${category || 'other'}\nSpecs: ${JSON.stringify(specs || {})}\n\nReturn JSON: {"title": "polished title, max 80 chars, title case", "description": "2-3 sentence polished description", "notes": "one short sentence of feedback for the seller"}`,
      { maxTokens: 400 }
    );
    if (!result.title || !result.description) throw new Error('Incomplete Claude response');
    return result;
  } catch (err) {
    console.error('Nsubuga Joseph: Claude call failed, falling back to heuristic polish.', err.message);
    return heuristicPolish({ title, description, category, specs });
  }
}
