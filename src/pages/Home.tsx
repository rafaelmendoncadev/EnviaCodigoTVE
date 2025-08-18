import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Upload, Settings, Archive, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Upload de Planilha',
      description: 'Faça upload de uma planilha Excel para extrair códigos',
      icon: Upload,
      href: '/upload',
      color: 'bg-blue-500',
    },
    {
      title: 'Configurações',
      description: 'Configure APIs do WhatsApp e Email',
      icon: Settings,
      href: '/settings',
      color: 'bg-green-500',
    },
    {
      title: 'Arquivo',
      description: 'Visualize códigos arquivados e histórico',
      icon: Archive,
      href: '/archive',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo ao EnviaCódigo, {user?.name?.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="text-blue-100">
          Sistema de extração e envio de códigos de recarga via WhatsApp e Email
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  {action.description}
                </p>
                <Link to={action.href}>
                  <Button variant="outline" size="sm" className="w-full">
                    Acessar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Como começar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Configure suas APIs</h4>
                <p className="text-sm text-gray-600">
                  Acesse as configurações e configure suas credenciais do WhatsApp Business API e servidor SMTP para email.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Faça upload da planilha</h4>
                <p className="text-sm text-gray-600">
                  Envie sua planilha Excel com códigos nas colunas A e D (a partir da linha 3).
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Selecione e envie</h4>
                <p className="text-sm text-gray-600">
                  Use o grid de seleção para escolher os códigos e envie via WhatsApp ou Email.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}