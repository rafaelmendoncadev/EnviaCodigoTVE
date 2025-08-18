import { Request, Response } from 'express';
import { TutorialService } from '../services/tutorialService.js';
import { AuthRequest } from '../middleware/auth.js';

export class TutorialController {
  /**
   * Get all available tutorials
   */
  static async getAllTutorials(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tutorials = TutorialService.getAllTutorials();
      
      res.json({
        success: true,
        tutorials: tutorials.map(tutorial => ({
          id: tutorial.id,
          name: tutorial.name,
          description: tutorial.description,
          service_type: tutorial.service_type,
          estimated_time: tutorial.estimated_time,
          steps_count: tutorial.steps.length
        }))
      });
    } catch (error) {
      console.error('Error getting tutorials:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Get tutorials by service type
   */
  static async getTutorialsByService(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { serviceType } = req.params;
      
      if (serviceType !== 'whatsapp' && serviceType !== 'email') {
        res.status(400).json({
          success: false,
          error: 'Tipo de serviço inválido. Use "whatsapp" ou "email"'
        });
        return;
      }

      const tutorials = TutorialService.getTutorialsByService(serviceType);
      
      res.json({
        success: true,
        service_type: serviceType,
        tutorials: tutorials.map(tutorial => ({
          id: tutorial.id,
          name: tutorial.name,
          description: tutorial.description,
          estimated_time: tutorial.estimated_time,
          steps_count: tutorial.steps.length
        }))
      });
    } catch (error) {
      console.error('Error getting tutorials by service:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Get specific tutorial with all steps
   */
  static async getTutorial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tutorialId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const tutorial = TutorialService.getTutorialById(tutorialId);
      
      if (!tutorial) {
        res.status(404).json({
          success: false,
          error: 'Tutorial não encontrado'
        });
        return;
      }

      // Get user progress for this tutorial
      const progress = TutorialService.getTutorialProgress(userId, tutorialId);

      res.json({
        success: true,
        tutorial: {
          ...tutorial,
          progress: progress ? {
            current_step: progress.current_step,
            completed_steps: progress.completed_steps,
            completed: progress.completed,
            started_at: progress.started_at,
            completed_at: progress.completed_at
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting tutorial:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Get specific tutorial step
   */
  static async getTutorialStep(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tutorialId, stepId } = req.params;
      
      const tutorial = TutorialService.getTutorialById(tutorialId);
      
      if (!tutorial) {
        res.status(404).json({
          success: false,
          error: 'Tutorial não encontrado'
        });
        return;
      }

      const step = tutorial.steps.find(s => s.id === stepId);
      
      if (!step) {
        res.status(404).json({
          success: false,
          error: 'Passo do tutorial não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        tutorial_info: {
          id: tutorial.id,
          name: tutorial.name,
          service_type: tutorial.service_type
        },
        step: step,
        navigation: {
          current_order: step.order,
          total_steps: tutorial.steps.length,
          previous_step: tutorial.steps.find(s => s.order === step.order - 1)?.id || null,
          next_step: tutorial.steps.find(s => s.order === step.order + 1)?.id || null
        }
      });
    } catch (error) {
      console.error('Error getting tutorial step:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Validate step completion
   */
  static async validateStepCompletion(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tutorialId, stepId } = req.params;
      const { data } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const validation = TutorialService.validateStepCompletion(tutorialId, stepId, data || {});
      
      if (validation.valid) {
        // Update user progress
        const progress = TutorialService.updateTutorialProgress(userId, tutorialId, stepId);
        
        res.json({
          success: true,
          valid: true,
          message: 'Passo concluído com sucesso',
          progress: {
            current_step: progress.current_step,
            completed_steps: progress.completed_steps,
            completed: progress.completed
          }
        });
      } else {
        res.status(400).json({
          success: false,
          valid: false,
          errors: validation.errors
        });
      }
    } catch (error) {
      console.error('Error validating step completion:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Mark tutorial as completed
   */
  static async completeTutorial(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tutorialId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const tutorial = TutorialService.getTutorialById(tutorialId);
      
      if (!tutorial) {
        res.status(404).json({
          success: false,
          error: 'Tutorial não encontrado'
        });
        return;
      }

      // Mark all steps as completed
      for (const step of tutorial.steps) {
        TutorialService.updateTutorialProgress(userId, tutorialId, step.id);
      }

      // Mark tutorial as completed
      const progress = TutorialService.updateTutorialProgress(userId, tutorialId, '', true);

      res.json({
        success: true,
        message: 'Tutorial concluído com sucesso',
        progress: {
          completed: progress.completed,
          completed_at: progress.completed_at,
          completed_steps: progress.completed_steps
        }
      });
    } catch (error) {
      console.error('Error completing tutorial:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Get user tutorial progress
   */
  static async getUserProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const tutorials = TutorialService.getAllTutorials();
      const progressList = tutorials.map(tutorial => {
        const progress = TutorialService.getTutorialProgress(userId, tutorial.id);
        return {
          tutorial_id: tutorial.id,
          tutorial_name: tutorial.name,
          service_type: tutorial.service_type,
          progress: progress ? {
            current_step: progress.current_step,
            completed_steps: progress.completed_steps,
            completed: progress.completed,
            completion_percentage: Math.round((progress.completed_steps.length / tutorial.steps.length) * 100),
            started_at: progress.started_at,
            completed_at: progress.completed_at
          } : null
        };
      });

      res.json({
        success: true,
        user_id: userId,
        tutorials: progressList
      });
    } catch (error) {
      console.error('Error getting user progress:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Reset tutorial progress
   */
  static async resetTutorialProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { tutorialId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Usuário não autenticado' });
        return;
      }

      const tutorial = TutorialService.getTutorialById(tutorialId);
      
      if (!tutorial) {
        res.status(404).json({
          success: false,
          error: 'Tutorial não encontrado'
        });
        return;
      }

      // In a real implementation, this would reset the progress in the database
      // For now, we'll just return a success message
      
      res.json({
        success: true,
        message: 'Progresso do tutorial resetado com sucesso',
        tutorial_id: tutorialId
      });
    } catch (error) {
      console.error('Error resetting tutorial progress:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}