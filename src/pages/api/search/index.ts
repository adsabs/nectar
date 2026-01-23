import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { sessionConfig } from '@/config';

const ADS_API_BASE = process.env.API_HOST_SERVER || 'https://api.adsabs.harvard.edu/v1';

interface SearchResponse {
  response: {
    numFound: number;
    start: number;
    docs: unknown[];
  };
  responseHeader?: unknown;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SearchResponse | ErrorResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const session = await getIronSession(req, res, sessionConfig);
    const accessToken = session?.token?.access_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized - no session token' });
    }

    const queryParams = new URLSearchParams();
    const { q, rows, fl, sort, start } = req.query;

    if (typeof q === 'string') {
      queryParams.set('q', q);
    }
    if (typeof rows === 'string') {
      queryParams.set('rows', rows);
    }
    if (typeof fl === 'string') {
      queryParams.set('fl', fl);
    }
    if (typeof sort === 'string') {
      queryParams.set('sort', sort);
    }
    if (typeof start === 'string') {
      queryParams.set('start', start);
    }

    if (!queryParams.has('q')) {
      return res.status(400).json({ error: 'Missing required parameter: q' });
    }

    const searchUrl = `${ADS_API_BASE}/search/query?${queryParams.toString()}`;

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ADS search API error:', response.status, errorText);
      return res.status(response.status).json({
        error: `ADS API returned ${response.status}`,
      });
    }

    const data = (await response.json()) as SearchResponse;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Search proxy error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
