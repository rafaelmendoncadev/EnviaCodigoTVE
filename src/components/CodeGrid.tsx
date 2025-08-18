import React from 'react';
import { Check, Clock, Archive, Send } from 'lucide-react';
import { Code } from '../types';

interface CodeGridProps {
  codes: Code[];
  selectedCodes: Set<string>;
  onCodeSelect: (codeId: string) => void;
  onSelectAll: () => void;
  searchTerm?: string;
  showArchived?: boolean;
}

const CodeGrid: React.FC<CodeGridProps> = ({
  codes,
  selectedCodes,
  onCodeSelect,
  onSelectAll,
  searchTerm = '',
  showArchived = false
}) => {
  const filteredCodes = (codes || []).filter(code => {
    const matchesSearch = 
      (code.combined_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (code.column_a_value || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showArchived) {
      return matchesSearch && code.status === 'archived';
    }
    
    return matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-green-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      case 'available':
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'border-green-200 bg-green-50';
      case 'archived':
        return 'border-gray-200 bg-gray-50';
      case 'available':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviado';
      case 'archived':
        return 'Arquivado';
      case 'available':
      default:
        return 'Disponível';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (filteredCodes.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">
          {searchTerm ? 'Nenhum código encontrado' : 'Nenhum código disponível'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with select all */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selectedCodes.size === filteredCodes.length && filteredCodes.length > 0
                ? 'bg-blue-600 border-blue-600 text-white'
                : selectedCodes.size > 0
                ? 'bg-blue-100 border-blue-600 text-blue-600'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {selectedCodes.size === filteredCodes.length && filteredCodes.length > 0 ? (
              <Check className="h-3 w-3" />
            ) : selectedCodes.size > 0 ? (
              <div className="w-2 h-2 bg-blue-600 rounded-sm" />
            ) : null}
          </button>
          <span className="text-sm font-medium text-gray-700">
            {selectedCodes.size > 0
              ? `${selectedCodes.size} de ${filteredCodes.length} selecionados`
              : `${filteredCodes.length} códigos`
            }
          </span>
        </div>
        
        {selectedCodes.size > 0 && (
          <span className="text-sm text-blue-600 font-medium">
            {selectedCodes.size === filteredCodes.length ? 'Todos selecionados' : 'Seleção parcial'}
          </span>
        )}
      </div>

      {/* Grid of codes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
        {filteredCodes.map((code) => {
          const isSelected = selectedCodes.has(code.id);
          const isDisabled = code.status === 'sent' || code.status === 'archived';
          
          return (
            <div
              key={code.id}
              className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : isDisabled
                  ? `${getStatusColor(code.status)} opacity-75`
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !isDisabled && onCodeSelect(code.id)}
            >
              {/* Selection indicator */}
              <div className="absolute top-2 left-2">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : isDisabled
                      ? 'border-gray-300 bg-gray-100'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5" />}
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  code.status === 'sent'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : code.status === 'archived'
                    ? 'bg-gray-100 text-gray-800 border border-gray-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {getStatusIcon(code.status)}
                  <span>{getStatusText(code.status)}</span>
                </div>
              </div>

              {/* Code content */}
              <div className="mt-8 space-y-2">
                <div className="font-mono text-sm font-bold text-gray-900 break-all">
                  {code.combined_code}
                </div>
                
                {code.column_a_value && (
                  <div className="text-xs text-gray-600 truncate" title={code.column_a_value}>
                    {code.column_a_value}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 space-y-1">
                  {/* Informação da planilha de origem */}
                  {code.filename && (
                    <div className="text-xs text-blue-600 font-medium truncate" title={code.filename}>
                      📄 {code.filename}
                    </div>
                  )}
                  
                  {code.status === 'sent' && code.sent_at && (
                    <div>Enviado: {formatDate(code.sent_at)}</div>
                  )}
                  {code.status === 'archived' && code.archived_at && (
                    <div>Arquivado: {formatDate(code.archived_at)}</div>
                  )}
                  {code.status === 'available' && (
                    <div>Criado: {formatDate(code.created_at)}</div>
                  )}
                </div>
              </div>

              {/* Hover effect overlay */}
              {!isDisabled && (
                <div className={`absolute inset-0 rounded-lg transition-opacity ${
                  isSelected
                    ? 'bg-blue-600 bg-opacity-5'
                    : 'bg-gray-900 bg-opacity-0 hover:bg-opacity-5'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>{(codes || []).filter(c => c.status === 'available').length} disponíveis</span>
          </div>
          <div className="flex items-center gap-1">
            <Send className="h-4 w-4 text-green-600" />
            <span>{(codes || []).filter(c => c.status === 'sent').length} enviados</span>
          </div>
          <div className="flex items-center gap-1">
            <Archive className="h-4 w-4 text-gray-600" />
            <span>{(codes || []).filter(c => c.status === 'archived').length} arquivados</span>
          </div>
        </div>
        
        {selectedCodes.size > 0 && (
          <div className="font-medium text-blue-600">
            {selectedCodes.size} selecionados
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeGrid;