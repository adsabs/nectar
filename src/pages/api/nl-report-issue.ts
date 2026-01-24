import { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse<IssueResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ id: '', success: false, message: 'Method not allowed' });
  }

  const nlsServerUrl = process.env.NLS_SERVER_URL || 'http://localhost:8001';

  try {
    const report: IssueReport = req.body;

    const response = await fetch(`${nlsServerUrl}/report-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (!response.ok) {
      throw new Error(`NLS server error: ${response.statusText}`);
    }

    const data: IssueResponse = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error reporting issue:', error);
    return res.status(500).json({
      id: '',
      success: false,
      message: error instanceof Error ? error.message : 'Failed to report issue',
    });
  }
}
