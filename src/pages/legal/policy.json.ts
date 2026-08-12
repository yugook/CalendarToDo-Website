import type { APIRoute } from 'astro';
import { LEGAL_PATHS, SITE_URL } from '../../config/site';

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
  };

  return new Response(`${JSON.stringify(policy, null, 2)}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
