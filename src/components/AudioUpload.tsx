import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Função melhorada para extrair dados do texto transcrito
function parseProposalData(text: string) {
  let cidade = '';
  let numeros: number[] = [];
  let template = '';

  // Extrai cidade entre "cidade" e "com os dados" ou "com dados"
  const cidadeMatch = text.match(/cidade\s+(.+?)\s+com\s+os?\s+dados?/i);
  if (cidadeMatch) {
    cidade = cidadeMatch[1].trim();
    // Remove "de " do início, se houver
    cidade = cidade.replace(/^de\s+/i, '');
    // Se não tiver " - ", tenta separar cidade e UF
    if (!cidade.includes(' - ')) {
      // Tenta pegar a última palavra como UF se for sigla
      const partes = cidade.split(/\s+/);
      if (partes.length > 1 && /^[A-Z]{2}$/i.test(partes[partes.length - 1])) {
        const uf = partes.pop();
        cidade = partes.join(' ') + ' - ' + uf?.toUpperCase();
      }
    }
  }

  // Extrai números entre "dados" e "e use o template"
  const numerosMatch = text.match(/dados?\s+([\d\s,\.]+)(?:\s+e\s+use|\s+e\s*o\s*template|$)/i);
  if (numerosMatch) {
    numeros = numerosMatch[1].split(/[\s,\.]+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
  }

  // Extrai template após "template"
  const templateMatch = text.match(/template\s+([\wÀ-ÿ ]+)/i);
  if (templateMatch) {
    template = templateMatch[1].trim();
  }

  return {
    cidade,
    numeros,
    template,
    textoOriginal: text
  };
}

const AudioUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript('');
    setParsed(null);
    setError('');
  };

  const startRecording = async () => {
    setTranscript('');
    setParsed(null);
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
    setParsed(null);
    setError('');
    try {
      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: audio,
      });
      const data = await res.json();
      if (data.text) {
        setTranscript(data.text);
        setParsed(parseProposalData(data.text));
      } else {
        setError(data.error ? `${data.error} (${data.details || ''})` : 'Erro desconhecido');
      }
    } catch (err) {
      setError('Erro ao enviar áudio');
    } finally {
      setLoading(false);
    }
  };

  const handlePreencherProposta = () => {
    if (!parsed) return;
    // Salvar os dados extraídos no localStorage para ProposalView consumir
    localStorage.setItem('proposta_audio', JSON.stringify(parsed));
    navigate('/');
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-2 text-sky-700">Transcrição de Áudio (AssemblyAI)</h2>
      <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded">
        <h3 className="font-semibold mb-1 text-sky-800">Como usar:</h3>
        <ul className="list-disc pl-5 text-sm text-sky-900">
          <li>Fale de forma clara e pausada.</li>
          <li>Exemplo de frase: <br /><span className="italic text-sky-700">"Faça uma proposta para a cidade Uberlândia com dados 10 20 30 40 50 e use o template Padrão"</span></li>
          <li>Inclua: <b>nome da cidade</b>, <b>os números dos dados</b> (quantidades), e <b>nome do template</b>.</li>
          <li>Você pode gravar o áudio ou enviar um arquivo pronto.</li>
        </ul>
      </div>
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
      {parsed && (
        <div className="mt-4 bg-slate-50 p-3 rounded border">
          <h3 className="font-semibold mb-2 text-sky-700">Dados extraídos para conferência:</h3>
          <ul className="text-sm">
            <li><b>Cidade:</b> {parsed.cidade || <span className="text-red-500">(não encontrado)</span>}</li>
            <li><b>Dados (números):</b> {parsed.numeros.length > 0 ? parsed.numeros.join(', ') : <span className="text-red-500">(não encontrado)</span>}</li>
            <li><b>Template:</b> {parsed.template || <span className="text-red-500">(não encontrado)</span>}</li>
          </ul>
          <button
            className="mt-4 bg-sky-700 text-white px-4 py-2 rounded hover:bg-sky-800"
            onClick={handlePreencherProposta}
          >
            Preencher proposta com estes dados
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioUpload; 