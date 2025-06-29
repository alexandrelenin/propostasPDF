import React, { useRef, useState } from 'react';

const AudioUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript('');
    setError('');
  };

  const startRecording = async () => {
    setTranscript('');
    setError('');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setFile(null);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleUpload = async (audio: File | Blob | null) => {
    if (!audio) return;
    setLoading(true);
    setTranscript('');
    setError('');
    try {
      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: audio,
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
      <div className="mb-4">
        <label className="block font-medium mb-1">Gravar Áudio</label>
        <button
          className={`px-4 py-2 rounded text-white ${recording ? 'bg-red-600 hover:bg-red-700' : 'bg-sky-600 hover:bg-sky-700'} mr-2`}
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
        >
          {recording ? 'Parar Gravação' : 'Gravar Áudio'}
        </button>
        {audioUrl && (
          <>
            <audio src={audioUrl} controls className="mt-2" />
            <button
              className="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              onClick={() => handleUpload(audioBlob)}
              disabled={loading}
            >
              {loading ? 'Transcrevendo...' : 'Enviar Gravação'}
            </button>
          </>
        )}
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Ou envie um arquivo de áudio</label>
        <input type="file" accept="audio/*" onChange={handleFileChange} className="mb-2" />
        <button
          className="bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700 disabled:opacity-50"
          onClick={() => handleUpload(file)}
          disabled={!file || loading}
        >
          {loading ? 'Transcrevendo...' : 'Enviar e Transcrever'}
        </button>
      </div>
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