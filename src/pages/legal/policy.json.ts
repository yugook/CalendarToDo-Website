import type { APIRoute } from 'astro';
import {
  LEGAL_PATHS,
  SITE_URL,
  SUPPORT_PATHS,
  SUPPORT_UPDATED_AT,
} from '../../config/site';

export const prerender = true;

const policyVersion = '2026-08-12';

const absoluteURL = (path: string) => new URL(path, SITE_URL).toString();

export const GET: APIRoute = () => {
  const policy = {
    terms: {
      version: policyVersion,
      url_en: absoluteURL(LEGAL_PATHS.terms.en),
      url_ja: absoluteURL(LEGAL_PATHS.terms.ja),
    },
    privacy: {
      version: policyVersion,
      url_en: absoluteURL(LEGAL_PATHS.privacy.en),
      url_ja: absoluteURL(LEGAL_PATHS.privacy.ja),
    },
    support: {
      version: SUPPORT_UPDATED_AT,
      url_en: absoluteURL(SUPPORT_PATHS.en),
      url_ja: absoluteURL(SUPPORT_PATHS.ja),
    },
  };

  return new Response(`${JSON.stringify(policy, null, 2)}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
