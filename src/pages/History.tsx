import React, { useState, useEffect } from 'react';
import { Clock, Send, Archive, RefreshCw, Activity } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { useApi } from '../hooks/useApi';
import { toast } from 'sonner';
import { HistoryItem, Statistics } from '../types';

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { apiClient } = useApi();

  const itemsPerPage = 20;

  useEffect(() => {
    loadHistory();
    loadStatistics();
  }, [currentPage]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHistory(currentPage, itemsPerPage);
      setHistory(response.history);
      setStatistics(response.statistics);
    } catch (error) {
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await apiClient.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.log('Erro ao carregar estatísticas');
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_whatsapp':
        return <Send className="h-4 w-4 text-green-600" />;
      case 'send_email':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-orange-600" />;
      case 'unarchive':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'send_whatsapp':
        return 'Envio WhatsApp';
      case 'send_email':
        return 'Envio Email';
      case 'archive':
        return 'Arquivar';
      case 'unarchive':
        return 'Desarquivar';
      default:
        return actionType;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'success':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            Sucesso
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            Falhou
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            Pendente
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
        <Button 
          onClick={loadHistory}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Ações</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.total_actions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Send className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">WhatsApp Enviados</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.whatsapp_sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Emails Enviados</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.email_sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Archive className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Códigos Arquivados</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.archived_codes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma ação realizada ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getActionIcon(item.action_type)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {getActionLabel(item.action_type)}
                      </p>
                      {item.destination && (
                        <p className="text-sm text-gray-500">
                          Para: {item.destination}
                        </p>
                      )}
                      {item.details && (
                        <p className="text-sm text-gray-500">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(item.status)}
                    <p className="text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {history.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(history.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                loading={loading}
                showNumbers={false}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;