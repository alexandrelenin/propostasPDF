import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASSEMBLYAI_API_KEY = '57d9c148aecd46f281d4a205e453cd55';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Recebe o arquivo de áudio como buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    // 1. Upload do áudio para AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { 'authorization': ASSEMBLYAI_API_KEY },
      body: audioBuffer
    });
    const { upload_url } = await uploadRes.json();

    // 2. Solicita transcrição
    const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ audio_url: upload_url, language_code: 'pt' })
    });
    const { id } = await transcriptRes.json();

    // 3. Polling até a transcrição ficar pronta
    let text = '';
    while (true) {
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { 'authorization': ASSEMBLYAI_API_KEY }
      });
      const data = await pollRes.json();
      if (data.status === 'completed') {
        text = data.text;
        break;
      } else if (data.status === 'failed') {
        return res.status(500).json({ error: 'Transcrição falhou' });
      }
      await new Promise(r => setTimeout(r, 3000));
    }

    // 4. Retorne o texto transcrito
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar áudio', details: String(err) });
  }
} 