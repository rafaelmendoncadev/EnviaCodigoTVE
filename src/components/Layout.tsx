import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';
import { Button } from './ui/Button';
import { Home, Settings, Archive, LogOut, Upload, Clock, Ticket } from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { toasts, removeToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Início',
      href: '/',
      icon: Home,
    },
    {
      name: 'Upload',
      href: '/upload',
      icon: Upload,
    },
    {
      name: 'Arquivo',
      href: '/archive',
      icon: Archive,
    },
    {
      name: 'Histórico',
      href: '/history',
      icon: Clock,
    },
    {
      name: 'Configurações',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* justify-between: Logo no extremo esquerdo, Menu no extremo direito */}
            {/* Logo - Positioned at far left using justify-between */}
            <div className="flex items-center flex-shrink-0">
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200 group"
              >
                <div className="relative">
                  {/* Logo container with gradient background */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 w-10 h-10 bg-blue-600 rounded-xl blur-lg opacity-20 -z-10 group-hover:opacity-30 transition-opacity duration-200"></div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xl font-bold text-gray-900 leading-tight truncate">
                    EnviaCódigo
                  </span>
                  <span className="text-xs text-blue-600 font-medium -mt-1 hidden sm:block">
                    Gestão de Códigos
                  </span>
                </div>
              </Link>
            </div>

            {/* User Menu - Positioned at far right using justify-between */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <span className="text-sm text-gray-600 hidden sm:inline-block">
                Olá, {user?.name || user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sair</span>
                <span className="sm:hidden">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};