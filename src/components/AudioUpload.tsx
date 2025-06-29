import React, { useState } from 'react';

const AudioUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setTranscript('');
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setTranscript('');
    setError('');
    try {
      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: file,
      });
      const data = await res.json();
      if (data.text) {
        setTranscript(data.text);
      } else {
        setError(data.error || 'Erro desconhecido');
      }
    } catch (err) {
      setError('Erro ao enviar áudio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-4 text-sky-700">Transcrição de Áudio (AssemblyAI)</h2>
      <input type="file" accept="audio/*" onChange={handleFileChange} className="mb-2" />
      <button
        className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700 disabled:opacity-50"
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? 'Transcrevendo...' : 'Enviar e Transcrever'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {transcript && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Transcrição:</h3>
          <pre className="bg-slate-100 p-2 rounded whitespace-pre-wrap text-sm">{transcript}</pre>
        </div>
      )}
    </div>
  );
};

export default AudioUpload; 