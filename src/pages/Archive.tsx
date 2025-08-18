import React, { useState, useEffect } from 'react';
import { Archive as ArchiveIcon, RotateCcw, Calendar, TrendingUp, FileText, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import { useApi } from '../hooks/useApi';
import { toast } from 'sonner';
import { Code, Statistics } from '../types';

const Archive: React.FC = () => {
  const [archivedCodes, setArchivedCodes] = useState<Code[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const codesPerPage = 20;

  const { apiClient, loading } = useApi();


  useEffect(() => {
    loadArchivedCodes();
    loadStatistics();
  }, [currentPage]);

  const loadArchivedCodes = async () => {
    try {
      const response = await apiClient.getArchivedCodes(currentPage, codesPerPage);
      setArchivedCodes(response.codes);
      setTotalPages(Math.ceil(response.total / codesPerPage));
    } catch (error) {
      toast.error('Falha ao carregar códigos arquivados');
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await apiClient.getStatistics();
      setStatistics(stats);
    } catch (error) {
      toast.error('Falha ao carregar estatísticas');
    }
  };

  const handleCodeSelect = (codeId: string) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(codeId)) {
      newSelected.delete(codeId);
    } else {
      newSelected.add(codeId);
    }
    setSelectedCodes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCodes.size === filteredCodes.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(filteredCodes.map(code => code.id)));
    }
  };

  const handleRestore = async () => {
    if (selectedCodes.size === 0) {
      toast.error('Selecione pelo menos um código para restaurar');
      return;
    }

    try {
      const codeIds = Array.from(selectedCodes);
      await apiClient.restoreCodes(codeIds);
      
      // Remover códigos restaurados da lista
      setArchivedCodes(prevCodes => 
        prevCodes.filter(code => !selectedCodes.has(code.id))
      );
      
      setSelectedCodes(new Set());
      setShowRestoreModal(false);
      toast.success(`${codeIds.length} códigos restaurados com sucesso`);
      
      // Recarregar estatísticas
      loadStatistics();
    } catch (error) {
      toast.error('Falha ao restaurar códigos');
    }
  };

  const filteredCodes = archivedCodes.filter(code => 
    code.combined_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.column_a_value && code.column_a_value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Arquivo</h1>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Sessões</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_sessions}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Códigos Processados</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_codes}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Códigos Enviados</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_sent}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Códigos Arquivados</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total_archived}</p>
                </div>
                <ArchiveIcon className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity Chart */}
      {statistics && statistics.recent_activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">
                      {new Date(activity.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{activity.sessions} sessões</span>
                    <span>{activity.codes_processed} processados</span>
                    <span>{activity.codes_sent} enviados</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archived Codes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArchiveIcon className="h-5 w-5" />
              Códigos Arquivados
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedCodes.size > 0 && (
                <Button
                  onClick={() => setShowRestoreModal(true)}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar ({selectedCodes.size})
                </Button>
              )}
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                disabled={filteredCodes.length === 0}
              >
                {selectedCodes.size === filteredCodes.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar códigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Carregando códigos...</p>
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-8">
              <ArchiveIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Nenhum código encontrado' : 'Nenhum código arquivado'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredCodes.map((code) => (
                  <div
                    key={code.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedCodes.has(code.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleCodeSelect(code.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-medium">
                        {code.combined_code}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        Arquivado
                      </span>
                    </div>
                    {code.column_a_value && (
                      <div className="text-xs text-gray-600 truncate mb-1">
                        {code.column_a_value}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Arquivado em: {formatDate(code.archived_at!)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleRestore}
        title="Restaurar Códigos"
        message={`Tem certeza que deseja restaurar ${selectedCodes.size} códigos selecionados? Eles voltarão a ficar disponíveis para envio.`}
        confirmText="Restaurar"
        variant="default"
        loading={loading}
      />
    </div>
  );
};

export default Archive;