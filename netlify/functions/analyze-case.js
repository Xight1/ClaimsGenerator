exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'OPENAI_API_KEY is not configured in Netlify environment variables.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { error: 'Invalid request body.' });
  }

  const claimType = String(body.claimType || 'General Utility Claim');
  const notes = String(body.notes || '').trim();
  const files = Array.isArray(body.files) ? body.files : [];

  if (!notes && files.length === 0) {
    return json(400, { error: 'Upload at least one file or enter case notes.' });
  }

  const maxFiles = 10;
  if (files.length > maxFiles) {
    return json(400, { error: `Upload ${maxFiles} files or fewer per review.` });
  }

  const content = [
    {
      type: 'input_text',
      text: buildInstructions(claimType, notes, files)
    }
  ];

  for (const file of files) {
    if (!file || !file.name || !file.data) continue;
    const mimeType = file.type || guessMimeType(file.name);
    content.push({
      type: 'input_file',
      filename: sanitizeFilename(file.name),
      file_data: `data:${mimeType};base64,${file.data}`
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        max_output_tokens: 1800,
        input: [
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: data.error?.message || 'OpenAI request failed.' });
    }

    const analysis = extractOutputText(data);
    return json(200, { analysis });
  } catch (error) {
    return json(500, { error: error.message || 'Unable to complete AI case review.' });
  }
};

function buildInstructions(claimType, notes, files) {
  const fileList = files.map((file, index) => `${index + 1}. ${file.name || 'Unnamed file'}`).join('\n') || 'No files uploaded.';
  return `You are reviewing claim materials for The Claims Center. Analyze the uploaded files and notes for a ${claimType}.

Rules:
- Use only facts supported by the uploaded documents or notes.
- Do not invent dates, parties, claim numbers, costs, evidence, admissions, statutes, or attachments.
- Separate confirmed facts from unclear points.
- Do not provide legal advice. Provide a professional claim handling analysis.
- Be firm, evidence based, and protective of the client position.
- If a document cannot be read, say that clearly.

Uploaded files:
${fileList}

Optional notes from user:
${notes || 'No additional notes provided.'}

Return the review in this exact structure:

Case Summary:

Parties Involved:

Timeline of Events:

Evidence Reviewed:

Known Facts Supported by the File:

Potential Liability Points:

Weaknesses or Missing Information:

Risk Issues:

Recommended Next Action:

Draft Claim Position:
`;
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) parts.push(content.text);
    }
  }
  return parts.join('\n').trim() || 'No analysis returned.';
}

function sanitizeFilename(name) {
  return String(name).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120) || 'uploaded-file';
}

function guessMimeType(name) {
  const lower = String(name).toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.csv')) return 'text/csv';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };
}
