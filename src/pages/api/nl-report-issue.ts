import type { NextApiRequest, NextApiResponse } from 'next';

const GITHUB_REPO = process.env.NL_SEARCH_ISSUE_REPO || 'sjarmak/nls-finetune-scix';
const GITHUB_TOKEN = process.env.NL_SEARCH_GITHUB_TOKEN;

interface IssueReport {
  input: string;
  actual: string;
  expected: string;
  category: string;
  notes?: string;
}

interface IssueResponse {
  id: string;
  success: boolean;
  message: string;
}

interface GitHubIssueResponse {
  number: number;
  html_url: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<IssueResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ id: '', success: false, message: 'Method not allowed' });
  }

  if (!GITHUB_TOKEN) {
    return res.status(503).json({
      id: '',
      success: false,
      message: 'Issue reporting not configured. Set NL_SEARCH_GITHUB_TOKEN.',
    });
  }

  try {
    const report: IssueReport = req.body;

    if (!report.input || !report.actual || !report.expected || !report.category) {
      return res.status(400).json({ id: '', success: false, message: 'Missing required fields' });
    }

    const title = `[NL Search] ${report.category}: ${report.input.slice(0, 80)}`;
    const body = [
      '## NL Search Issue Report',
      '',
      `**Category:** ${report.category}`,
      '',
      '### Natural Language Input',
      '```',
      report.input,
      '```',
      '',
      '### Model Output (actual)',
      '```',
      report.actual,
      '```',
      '',
      '### Expected Query',
      '```',
      report.expected,
      '```',
      '',
      ...(report.notes ? ['### Notes', report.notes, ''] : []),
      '---',
      '_Reported via NL Search UI_',
    ].join('\n');

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: ['nl-search', 'training-data'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[nl-report-issue] GitHub API error:', response.status, errorText);
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const issue: GitHubIssueResponse = await response.json();

    return res.status(200).json({
      id: `#${issue.number}`,
      success: true,
      message: issue.html_url,
    });
  } catch (error) {
    console.error('[nl-report-issue] Error:', error);
    return res.status(500).json({
      id: '',
      success: false,
      message: error instanceof Error ? error.message : 'Failed to report issue',
    });
  }
}
