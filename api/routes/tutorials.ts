import { Router } from 'express';
import { TutorialController } from '../controllers/tutorialController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas para tutoriais
router.get('/', TutorialController.getAllTutorials);
router.get('/service/:serviceType', TutorialController.getTutorialsByService);
router.get('/:tutorialId', TutorialController.getTutorial);
router.get('/:tutorialId/steps/:stepId', TutorialController.getTutorialStep);

// Rotas para progresso do usuário
router.get('/progress/user', TutorialController.getUserProgress);
router.post('/:tutorialId/steps/:stepId/validate', TutorialController.validateStepCompletion);
router.post('/:tutorialId/complete', TutorialController.completeTutorial);
router.delete('/:tutorialId/progress', TutorialController.resetTutorialProgress);

export default router;