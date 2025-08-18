import { Router } from 'express';
import { ConnectivityController } from '../controllers/connectivityController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Testes de conectividade individuais
router.post('/test/whatsapp', ConnectivityController.testWhatsAppConnection);
router.post('/test/email', ConnectivityController.testEmailConnection);

// Teste completo de conectividade
router.post('/test/full', ConnectivityController.runFullConnectivityTest);

// Histórico e diagnósticos
router.get('/history', ConnectivityController.getConnectivityHistory);
router.get('/diagnostics', ConnectivityController.getDiagnosticInfo);

export default router;