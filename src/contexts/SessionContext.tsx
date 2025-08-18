import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Code, UploadSession } from '../types';
import { useApi } from '../hooks/useApi';
import { useAuth } from './AuthContext';

interface SessionContextType {
  currentSession: UploadSession | null;
  availableCodes: Code[];
  loading: boolean;
  refreshAvailableCodes: () => Promise<void>;
  updateCodesAfterAction: (codeIds: string[], action: 'sent' | 'archived') => void;
  setSessionData: (session: UploadSession | null, codes: Code[]) => void;
  addNewSessionCodes: (session: UploadSession, newCodes: Code[]) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<UploadSession | null>(null);
  const [availableCodes, setAvailableCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const { apiClient } = useApi();
  const { user } = useAuth();

  // Carregar códigos disponíveis quando o usuário estiver logado (apenas uma vez)
  useEffect(() => {
    if (user && !hasInitialLoad) {
      refreshAvailableCodes();
      setHasInitialLoad(true);
    } else if (!user) {
      // Limpar dados quando o usuário fizer logout
      setCurrentSession(null);
      setAvailableCodes([]);
      setHasInitialLoad(false);
    }
  }, [user, hasInitialLoad]);

  const refreshAvailableCodes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await apiClient.getAvailableCodes();
      setAvailableCodes(result.codes || []);
      setCurrentSession(result.session);
    } catch (error) {
      console.error('Erro ao carregar códigos disponíveis:', error);
      setAvailableCodes([]);
      setCurrentSession(null);
    } finally {
      setLoading(false);
    }
  };

  const updateCodesAfterAction = (codeIds: string[], action: 'sent' | 'archived') => {
    // Remover códigos da lista de disponíveis quando forem enviados ou arquivados
    setAvailableCodes(prevCodes => 
      prevCodes.filter(code => !codeIds.includes(code.id))
    );
  };

  const setSessionData = (session: UploadSession | null, codes: Code[]) => {
    setCurrentSession(session);
    setAvailableCodes(codes);
  };

  const addNewSessionCodes = (session: UploadSession, newCodes: Code[]) => {
    // Atualizar a sessão atual para a mais recente
    setCurrentSession(session);
    
    // Adicionar novos códigos aos existentes, evitando duplicatas
    setAvailableCodes(prevCodes => {
      const existingIds = new Set(prevCodes.map(code => code.id));
      const uniqueNewCodes = newCodes.filter(code => !existingIds.has(code.id));
      return [...prevCodes, ...uniqueNewCodes];
    });
  };

  const value: SessionContextType = {
    currentSession,
    availableCodes,
    loading,
    refreshAvailableCodes,
    updateCodesAfterAction,
    setSessionData,
    addNewSessionCodes
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};