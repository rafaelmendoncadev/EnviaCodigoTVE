import React, { useState, useRef, useEffect } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, X, Send, Archive, Search, Copy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import CodeGrid from '../components/CodeGrid';
import { useApi } from '../hooks/useApi';
import { useSession } from '../contexts/SessionContext';
import { toast } from 'sonner';

const Upload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [sendMethod, setSendMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [recipient, setRecipient] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { apiClient, loading } = useApi();
  const { currentSession, availableCodes, setSessionData, addNewSessionCodes, updateCodesAfterAction } = useSession();

  // Limpar seleção quando os códigos mudarem
  useEffect(() => {
    setSelectedCodes(new Set());
  }, [availableCodes]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          selectedFile.type !== 'application/vnd.ms-excel') {
        toast.error('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const result = await apiClient.uploadFile(file);
      
      // Debug logs para diagnosticar o problema
      console.log('Resultado completo da API:', result);
      console.log('Session recebida:', result.session);
      console.log('Codes recebidos:', result.codes);
      console.log('Quantidade de códigos:', result.codes?.length || 0);
      
      // Usar addNewSessionCodes para preservar códigos existentes
      addNewSessionCodes(result.session, result.codes);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Planilha processada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Falha ao processar a planilha');
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
    if (selectedCodes.size === availableCodes.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(availableCodes.map(code => code.id)));
    }
  };

  const handleSend = async () => {
    if (selectedCodes.size === 0) {
      toast.error('Selecione pelo menos um código para enviar');
      return;
    }

    if (!recipient.trim()) {
      toast.error('Informe o destinatário para envio');
      return;
    }

    try {
      const codeIds = Array.from(selectedCodes);
      
      if (sendMethod === 'whatsapp') {
        await apiClient.sendWhatsApp(codeIds, recipient);
        toast.success(`${codeIds.length} códigos enviados via WhatsApp com sucesso`);
      } else {
        await apiClient.sendEmail(codeIds, recipient);
        toast.success(`${codeIds.length} códigos enviados via Email com sucesso`);
      }

      // Atualizar contexto removendo códigos enviados
      updateCodesAfterAction(codeIds, 'sent');
      
      setSelectedCodes(new Set());
      setShowSendModal(false);
      setRecipient('');
    } catch {
      toast.error('Falha ao enviar códigos');
    }
  };

  const handleArchive = async () => {
    if (selectedCodes.size === 0) {
      toast.error('Selecione pelo menos um código para arquivar');
      return;
    }

    try {
      const codeIds = Array.from(selectedCodes);
      await apiClient.archiveCodes(codeIds);
      
      // Atualizar contexto removendo códigos arquivados
      updateCodesAfterAction(codeIds, 'archived');
      
      setSelectedCodes(new Set());
      setShowArchiveModal(false);
      toast.success(`${codeIds.length} códigos arquivados com sucesso`);
    } catch {
      toast.error('Falha ao arquivar códigos');
    }
  };

  const handleCopyAllCodes = async () => {
    try {
      if (!availableCodes.length) {
        toast.error('Nenhum código disponível para copiar');
        return;
      }

      // Format all codes for copying
      const codesText = availableCodes.map(code => {
        const columnA = code.column_a_value || '';
        const columnD = code.column_d_value || '';
        return `${columnA}\t${columnD}`;
      }).join('\n');

      // Copy to clipboard
      await navigator.clipboard.writeText(codesText);
      toast.success(`${availableCodes.length} códigos copiados!`);
    } catch (error) {
      console.error('Erro ao copiar códigos:', error);
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido ao copiar dados');
    }
  };

  const handleCopySelectedCodes = async () => {
    try {
      if (selectedCodes.size === 0) {
        toast.error('Selecione pelo menos um código para copiar');
        return;
      }

      // Filter selected codes and format for copying
      const selectedCodesArray = availableCodes.filter(code => selectedCodes.has(code.id));
      const codesText = selectedCodesArray.map(code => {
        const columnA = code.column_a_value || '';
        const columnD = code.column_d_value || '';
        return `${columnA}\t${columnD}`;
      }).join('\n');

      // Copy to clipboard
      await navigator.clipboard.writeText(codesText);
      toast.success(`${selectedCodesArray.length} códigos selecionados copiados!`);
    } catch (error) {
      console.error('Erro ao copiar códigos selecionados:', error);
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido ao copiar dados');
    }
  };

  const selectedAvailableCodes = availableCodes.filter(code => selectedCodes.has(code.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Upload de Planilha</h1>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Selecionar Arquivo Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Selecione um arquivo Excel (.xlsx ou .xls)
                </p>
                <p className="text-xs text-gray-500">
                  O sistema extrairá os códigos das colunas A e D (a partir da linha 3)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                Escolher Arquivo
              </Button>
            </div>
            
            {file && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{file.name}</span>
                  <span className="text-xs text-blue-600">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setFile(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleUpload}
                    loading={loading}
                    size="sm"
                  >
                    Processar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Sessão Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{currentSession.total_codes}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{availableCodes.length}</div>
                <div className="text-sm text-gray-600">Disponíveis</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentSession.sent_codes}</div>
                <div className="text-sm text-gray-600">Enviados</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{currentSession.archived_codes}</div>
                <div className="text-sm text-gray-600">Arquivados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Codes Grid */}
      {availableCodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Códigos Extraídos</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopyAllCodes}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Todos
                </Button>
                {selectedCodes.size > 0 && (
                  <>
                    <Button
                      onClick={handleCopySelectedCodes}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Selecionados ({selectedCodes.size})
                    </Button>
                    <Button
                      onClick={() => setShowSendModal(true)}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Send className="h-4 w-4" />
                      Enviar ({selectedCodes.size})
                    </Button>
                    <Button
                      onClick={() => setShowArchiveModal(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Archive className="h-4 w-4" />
                      Arquivar ({selectedCodes.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar códigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CodeGrid
              codes={availableCodes}
              selectedCodes={selectedCodes}
              onCodeSelect={handleCodeSelect}
              onSelectAll={handleSelectAll}
              searchTerm={searchTerm}
            />
          </CardContent>
        </Card>
      )}

      {/* Send Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Enviar Códigos"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Envio
            </label>
            <div className="flex gap-2">
              <Button
                onClick={() => setSendMethod('whatsapp')}
                variant={sendMethod === 'whatsapp' ? 'primary' : 'outline'}
                size="sm"
              >
                WhatsApp
              </Button>
              <Button
                onClick={() => setSendMethod('email')}
                variant={sendMethod === 'email' ? 'primary' : 'outline'}
                size="sm"
              >
                Email
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {sendMethod === 'whatsapp' ? 'Número do WhatsApp' : 'Email do Destinatário'}
            </label>
            <input
              type={sendMethod === 'whatsapp' ? 'tel' : 'email'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={sendMethod === 'whatsapp' ? '+5511999999999' : 'destinatario@email.com'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            Serão enviados {(selectedAvailableCodes || []).length} códigos selecionados.
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setShowSendModal(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              loading={loading}
            >
              Enviar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleArchive}
        title="Arquivar Códigos"
        message={`Tem certeza que deseja arquivar ${selectedCodes.size} códigos selecionados? Esta ação não pode ser desfeita.`}
        confirmText="Arquivar"
        variant="destructive"
        loading={loading}
      />
    </div>
  );
};

export default Upload;