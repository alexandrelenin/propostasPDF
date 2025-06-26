import React from 'react';
import { SavedProposalMeta } from '../types';
import { formatCurrency, formatDateForDisplay } from '../utils/formatters';

interface SavedProposalsViewProps {
  proposalsMeta: SavedProposalMeta[];
  onViewProposal: (id: string) => void;
  onDeleteProposal: (id: string) => void;
}

const SavedProposalsView: React.FC<SavedProposalsViewProps> = ({ proposalsMeta, onViewProposal, onDeleteProposal }) => {
  if (proposalsMeta.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h1 className="text-3xl font-bold text-sky-700 mb-6">Propostas Salvas</h1>
        <p className="text-gray-600 text-lg">Nenhuma proposta salva encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-sky-700 mb-8">Propostas Salvas</h1>
      {/* Tabela para telas médias e grandes */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Data da Proposta</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Valor Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Criada Em</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposalsMeta.map((meta) => (
                <tr key={meta.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meta.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDateForDisplay(meta.proposalDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(meta.totalValue)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDateForDisplay(meta.createdAt.split('T')[0])}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => onViewProposal(meta.id)}
                      className="text-sky-600 hover:text-sky-800 transition-colors duration-150"
                    >
                      Ver/Editar
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir a proposta para ${meta.clientName}?`)) {
                          onDeleteProposal(meta.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors duration-150"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Cards para telas pequenas */}
      <div className="md:hidden space-y-4">
        {proposalsMeta.map((meta) => (
          <div key={meta.id} className="bg-white shadow-md rounded-lg p-4 flex flex-col gap-2">
            <div>
              <span className="block text-xs text-gray-500 uppercase font-semibold">Cliente</span>
              <span className="block text-base font-bold text-gray-800">{meta.clientName}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <div>
                <span className="block text-xs text-gray-500 uppercase">Data da Proposta</span>
                <span>{formatDateForDisplay(meta.proposalDate)}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase">Valor Total</span>
                <span>{formatCurrency(meta.totalValue)}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 uppercase">Criada Em</span>
                <span>{formatDateForDisplay(meta.createdAt.split('T')[0])}</span>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => onViewProposal(meta.id)}
                className="flex-1 px-3 py-2 bg-sky-600 text-white rounded-md font-semibold text-sm shadow hover:bg-sky-700 transition-colors"
              >
                Ver/Editar
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja excluir a proposta para ${meta.clientName}?`)) {
                    onDeleteProposal(meta.id);
                  }
                }}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md font-semibold text-sm shadow hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedProposalsView;
