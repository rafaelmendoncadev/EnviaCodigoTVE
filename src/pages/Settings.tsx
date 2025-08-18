import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, Eye, EyeOff, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useApi } from '../hooks/useApi';
import { toast } from 'sonner';
import { WhatsAppConfig, EmailConfig } from '../types';

const Settings: React.FC = () => {
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    access_token: '',
    phone_number_id: '',
    webhook_url: ''
  });
  
  const [hasWhatsAppConfig, setHasWhatsAppConfig] = useState(false);
  
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: ''
  });

  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'tutorials'>('whatsapp');

  const { apiClient, loading } = useApi();


  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const whatsappData = await apiClient.getWhatsAppConfig();
      if (whatsappData && whatsappData.phone_number_id) {
        setWhatsappConfig(prev => ({
          ...prev,
          phone_number_id: whatsappData.phone_number_id || '',
          webhook_url: whatsappData.webhook_url || ''
        }));
        setHasWhatsAppConfig(true);
        setWhatsappStatus(whatsappData.is_active ? 'success' : 'idle');
      }
    } catch (error) {
      console.log('Nenhuma configuração encontrada ainda');
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      const result = await apiClient.saveWhatsAppConfig(whatsappConfig);
      if (result.success) {
        toast.success('Configurações do WhatsApp salvas com sucesso');
        setHasWhatsAppConfig(true);
        setWhatsappStatus('idle');
        loadConfigurations(); // Reload to get updated status
      } else {
        toast.error(result.error || 'Falha ao salvar configurações do WhatsApp');
      }
    } catch (error) {
      toast.error('Falha ao salvar configurações do WhatsApp');
    }
  };

  const handleSaveEmail = async () => {
    try {
      await apiClient.saveEmailConfig(emailConfig);
      toast.success('Configurações de email salvas com sucesso');
      setEmailStatus('idle');
    } catch (error) {
      toast.error('Falha ao salvar configurações de email');
    }
  };

  const handleTestWhatsApp = async () => {
    if (!hasWhatsAppConfig) {
      toast.error('Salve a configuração antes de testar');
      return;
    }

    setTestingWhatsApp(true);
    try {
      const result = await apiClient.testWhatsAppConnection();
      if (result.success) {
        setWhatsappStatus('success');
        toast.success('Conexão com WhatsApp funcionando corretamente');
      } else {
        setWhatsappStatus('error');
        toast.error(result.message || 'Erro na conexão com WhatsApp');
      }
    } catch (error) {
      setWhatsappStatus('error');
      toast.error('Erro ao testar conexão com WhatsApp');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailConfig.smtp_host || !emailConfig.smtp_user || !emailConfig.smtp_password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setTestingEmail(true);
    try {
      const result = await apiClient.testEmailConnection(emailConfig);
      if (result.success) {
        setEmailStatus('success');
        toast.success('Conexão SMTP funcionando corretamente');
      } else {
        setEmailStatus('error');
        toast.error(result.message || 'Erro na conexão SMTP');
      }
    } catch (error) {
      setEmailStatus('error');
      toast.error('Erro ao testar conexão SMTP');
    } finally {
      setTestingEmail(false);
    }
  };

  const getStatusIcon = (status: 'idle' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'whatsapp'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            WhatsApp Business
          </button>
          <button
            onClick={() => setActiveTab('tutorials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tutorials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tutoriais
          </button>
        </nav>
      </div>

      {/* WhatsApp Configuration */}
      {activeTab === 'whatsapp' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Configuração WhatsApp Business
              </CardTitle>
              {getStatusIcon(whatsappStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token *
              </label>
              <div className="relative">
                <Input
                  type={showWhatsAppToken ? 'text' : 'password'}
                  value={whatsappConfig.access_token}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, access_token: e.target.value }))}
                  placeholder="Token de acesso da API do WhatsApp Business"
                />
                <button
                  type="button"
                  onClick={() => setShowWhatsAppToken(!showWhatsAppToken)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showWhatsAppToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID *
              </label>
              <Input
                value={whatsappConfig.phone_number_id}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phone_number_id: e.target.value }))}
                placeholder="ID do número de telefone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <Input
                value={whatsappConfig.webhook_url || ''}
                onChange={(e) => setWhatsappConfig(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="URL do webhook (opcional)"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveWhatsApp}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Configuração
              </Button>
              <Button
                onClick={handleTestWhatsApp}
                disabled={testingWhatsApp || !hasWhatsAppConfig}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testingWhatsApp ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Configuration */}
      {activeTab === 'email' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Configuração de Email
              </CardTitle>
              {getStatusIcon(emailStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servidor SMTP *
                </label>
                <Input
                  value={emailConfig.smtp_host}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porta SMTP *
                </label>
                <Input
                  type="number"
                  value={emailConfig.smtp_port}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                  placeholder="587"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário SMTP *
              </label>
              <Input
                type="email"
                value={emailConfig.smtp_user}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                placeholder="seu-email@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha SMTP *
              </label>
              <div className="relative">
                <Input
                  type={showEmailPassword ? 'text' : 'password'}
                  value={emailConfig.smtp_password}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                  placeholder="Senha ou senha de app"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email do Remetente *
                </label>
                <Input
                  type="email"
                  value={emailConfig.from_email}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, from_email: e.target.value }))}
                  placeholder="seu-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Remetente
                </label>
                <Input
                  value={emailConfig.from_name}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, from_name: e.target.value }))}
                  placeholder="Seu Nome ou Empresa"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveEmail}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Configuração
              </Button>
              <Button
                onClick={handleTestEmail}
                disabled={testingEmail || !emailConfig.smtp_host || !emailConfig.smtp_user || !emailConfig.smtp_password}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testingEmail ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tutorials */}
      {activeTab === 'tutorials' && (
        <div className="space-y-6">
          {/* WhatsApp Tutorial */}
          <Card>
            <CardHeader>
              <CardTitle>Como obter credenciais do WhatsApp Business API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <h4 className="text-lg font-semibold mb-3">Passo a passo:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Acesse o <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Facebook for Developers <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Crie uma conta ou faça login com sua conta do Facebook</li>
                  <li>Clique em "Meus Apps" e depois em "Criar App"</li>
                  <li>Selecione "Business" como tipo de app</li>
                  <li>Preencha as informações do app e clique em "Criar App"</li>
                  <li>No painel do app, adicione o produto "WhatsApp"</li>
                  <li>Configure um número de telefone de teste ou conecte seu número business</li>
                  <li>Na seção "API Setup", você encontrará:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><strong>Access Token:</strong> Token temporário (24h) ou permanente</li>
                      <li><strong>Phone Number ID:</strong> ID do número configurado</li>
                    </ul>
                  </li>
                  <li>Para produção, você precisará verificar seu negócio no Business Manager</li>
                </ol>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Importante:</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• O token temporário expira em 24 horas</li>
                    <li>• Para produção, configure um token permanente</li>
                    <li>• Verifique os limites de mensagens da sua conta</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Tutorial */}
          <Card>
            <CardHeader>
              <CardTitle>Como configurar SMTP para envio de emails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none">
                <h4 className="text-lg font-semibold mb-3">Gmail (recomendado):</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Acesse sua <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Conta Google <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Vá em "Segurança" → "Verificação em duas etapas" (ative se não estiver)</li>
                  <li>Em "Senhas de app", gere uma nova senha para "Email"</li>
                  <li>Use as seguintes configurações:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><strong>Servidor SMTP:</strong> smtp.gmail.com</li>
                      <li><strong>Porta:</strong> 587</li>
                      <li><strong>Usuário:</strong> seu-email@gmail.com</li>
                      <li><strong>Senha:</strong> a senha de app gerada</li>
                    </ul>
                  </li>
                </ol>
                
                <h4 className="text-lg font-semibold mb-3 mt-6">Outros provedores:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-semibold mb-2">Outlook/Hotmail</h5>
                    <ul className="space-y-1">
                      <li><strong>SMTP:</strong> smtp-mail.outlook.com</li>
                      <li><strong>Porta:</strong> 587</li>
                    </ul>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h5 className="font-semibold mb-2">Yahoo</h5>
                    <ul className="space-y-1">
                      <li><strong>SMTP:</strong> smtp.mail.yahoo.com</li>
                      <li><strong>Porta:</strong> 587</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-2">💡 Dicas:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Sempre use senhas de app em vez da senha principal</li>
                    <li>• Teste a conexão antes de usar em produção</li>
                    <li>• Verifique os limites de envio do seu provedor</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;