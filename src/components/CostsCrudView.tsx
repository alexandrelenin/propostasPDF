import React, { useEffect, useState } from 'react';
import { Cost } from '../types';
import { getAllCosts, saveCost, deleteCost } from '../services/costService';

const FIXED_ITEMS = [
  {
    id: '1',
    descricao: 'Equipamento Facial iD',
    formaCobranca: 'unidade',
  },
  {
    id: '2',
    descricao: 'Configuração e ativação',
    formaCobranca: 'por equipamento',
  },
  {
    id: '3',
    descricao: 'Software gestão escolar',
    formaCobranca: 'por aluno',
  },
  {
    id: '4',
    descricao: 'Software ponto e modulação',
    formaCobranca: 'por servidor',
  },
  {
    id: '5',
    descricao: 'Suporte',
    formaCobranca: 'mensal por escola',
  },
];

const getSuggestedVenda = (valorCompra: number, percent: number) => {
  return Math.round(valorCompra * (1 + percent / 100) * 100) / 100;
};

const getToday = () => new Date().toISOString().split('T')[0];

// Agrupa custos por vigência
function agruparPorVigencia(costs: Cost[]) {
  const grupos: { [vigencia: string]: Cost[] } = {};
  for (const c of costs) {
    if (!grupos[c.vigenciaInicio]) grupos[c.vigenciaInicio] = [];
    grupos[c.vigenciaInicio].push(c);
  }
  // Ordena por vigência decrescente
  return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]));
}

// Função utilitária para formatar moeda
function formatCurrencyBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const CostsCrudView: React.FC = () => {
  const [vigenciaInicio, setVigenciaInicio] = useState(getToday());
  const [precos, setPrecos] = useState(() =>
    FIXED_ITEMS.map(item => ({
      ...item,
      valorCompra: 0,
      valorVendaMin: 0,
      valorVendaMax: 0,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [costsList, setCostsList] = useState<Cost[]>([]);
  const [editVigencia, setEditVigencia] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAllCosts();
  }, []);

  const fetchAllCosts = async () => {
    setLoading(true);
    const all = await getAllCosts();
    setCostsList(all.sort((a, b) => b.vigenciaInicio.localeCompare(a.vigenciaInicio) || a.id.localeCompare(b.id)));
    setLoading(false);
  };

  const handleChange = (idx: number, field: 'valorCompra' | 'valorVendaMin' | 'valorVendaMax', value: number | string) => {
    let parsedValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    // Remover zeros à esquerda e garantir valor positivo
    if (typeof value === 'string') {
      parsedValue = parseFloat(value.replace(/^0+(?!$)/, '').replace(',', '.'));
    }
    const safeValue = isNaN(parsedValue) ? 0 : Math.abs(parsedValue);
    // Log para depuração
    if (field === 'valorCompra') {
      console.log('Valor digitado:', value, 'Valor tratado:', safeValue);
    }
    setPrecos(prev => prev.map((p, i) => {
      if (i !== idx) return p;
      let novo = { ...p, [field]: safeValue };
      return novo;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const now = new Date().toISOString();
    try {
      for (const item of precos) {
        const cost: Cost = {
          id: `${item.id}-${vigenciaInicio}`,
          descricao: item.descricao,
          formaCobranca: item.formaCobranca,
          valorCompra: item.valorCompra,
          valorVendaMin: item.valorVendaMin,
          valorVendaMax: item.valorVendaMax,
          vigenciaInicio: vigenciaInicio,
          createdAt: now,
          updatedAt: now,
        };
        await saveCost(cost);
      }
      setMessage({ text: 'Custos salvos com sucesso!', type: 'success' });
      setEditVigencia(null);
      fetchAllCosts();
    } catch {
      setMessage({ text: 'Erro ao salvar custos.', type: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = (vigencia: string) => {
    const grupo = costsList.filter(c => c.vigenciaInicio === vigencia);
    setPrecos(FIXED_ITEMS.map(item => {
      const found = grupo.find(c => c.id === `${item.id}-${vigencia}`);
      return found ? { ...item, valorCompra: found.valorCompra, valorVendaMin: found.valorVendaMin, valorVendaMax: found.valorVendaMax } : { ...item, valorCompra: 0, valorVendaMin: 0, valorVendaMax: 0 };
    }));
    setVigenciaInicio(vigencia.split('T')[0]);
    setEditVigencia(vigencia);
  };

  const handleDelete = async (vigencia: string) => {
    if (!window.confirm('Excluir todos os custos desta vigência?')) return;
    setLoading(true);
    try {
      const grupo = costsList.filter(c => c.vigenciaInicio === vigencia);
      for (const c of grupo) {
        await deleteCost(c.id);
      }
      setMessage({ text: 'Custos excluídos com sucesso!', type: 'success' });
      fetchAllCosts();
    } catch {
      setMessage({ text: 'Erro ao excluir custos.', type: 'error' });
    }
    setLoading(false);
  };

  // Agrupa custos por vigência
  const custosAgrupados = agruparPorVigencia(costsList);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-sky-700 mb-8">Cadastro de Custos</h1>
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>
      )}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4 mb-8 flex flex-col gap-4 max-w-3xl mx-auto">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Início da Vigência</label>
          <input name="vigenciaInicio" type="date" value={vigenciaInicio} onChange={e => setVigenciaInicio(e.target.value)} required className="input input-bordered max-w-xs" />
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-200">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">#</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Forma de Cobrança</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Valor Compra</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Venda Mín</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Venda Máx</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {precos.map((item, idx) => (
              <tr key={item.id}>
                <td className="px-2 py-2 text-sm text-gray-700 font-bold">{item.id}</td>
                <td className="px-2 py-2 text-sm text-gray-700">{item.formaCobranca}</td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valorCompra}
                    onChange={e => handleChange(idx, 'valorCompra', e.target.value)}
                    className="input input-bordered w-32 text-right"
                    placeholder="0,00"
                    required
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valorVendaMin}
                    onChange={e => handleChange(idx, 'valorVendaMin', e.target.value)}
                    className="input input-bordered w-32 text-right"
                    placeholder="0,00"
                    required
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.valorVendaMax}
                    onChange={e => handleChange(idx, 'valorVendaMax', e.target.value)}
                    className="input input-bordered w-32 text-right"
                    placeholder="0,00"
                    required
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-4 mt-4">
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md font-semibold shadow hover:bg-sky-700 transition-colors" disabled={loading}>
            Salvar Custos
          </button>
        </div>
      </form>
      <h2 className="text-2xl font-bold text-sky-700 mb-4">Custos Cadastrados</h2>
      {loading ? <div>Carregando...</div> : (
        <div className="space-y-8">
          {custosAgrupados.map(([vigencia, grupo]) => (
            <div key={vigencia} className="bg-white shadow-xl rounded-lg p-4">
              <div className="mb-2 font-semibold text-sky-700">Vigência: {vigencia.split('T')[0]}</div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Item</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Forma de Cobrança</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Compra (R$)</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Venda Mín (R$)</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-600 uppercase">Venda Máx (R$)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {FIXED_ITEMS.map(item => {
                    const custo = grupo.find(c => c.descricao === item.descricao);
                    return (
                      <tr key={item.id}>
                        <td className="px-2 py-2 text-sm text-gray-700 font-bold">{item.descricao}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{item.formaCobranca}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{custo ? formatCurrencyBRL(custo.valorCompra) : '-'}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{custo ? formatCurrencyBRL(custo.valorVendaMin) : '-'}</td>
                        <td className="px-2 py-2 text-sm text-gray-700">{custo ? formatCurrencyBRL(custo.valorVendaMax) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex gap-4 mt-4">
                <button onClick={() => handleEdit(vigencia)} className="text-sky-600 hover:text-sky-800 mr-2">Editar</button>
                <button onClick={() => handleDelete(vigencia)} className="text-red-600 hover:text-red-800">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CostsCrudView; 