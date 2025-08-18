import { Tutorial, TutorialStep, TutorialProgress } from '../models/types.js';

export class TutorialService {
  /**
   * Get all available tutorials
   */
  static getAllTutorials(): Tutorial[] {
    return [
      this.getWhatsAppTutorial(),
      this.getEmailTutorial()
    ];
  }

  /**
   * Get tutorial by ID
   */
  static getTutorialById(id: string): Tutorial | null {
    const tutorials = this.getAllTutorials();
    return tutorials.find(t => t.id === id) || null;
  }

  /**
   * Get tutorials by service type
   */
  static getTutorialsByService(serviceType: 'whatsapp' | 'email'): Tutorial[] {
    return this.getAllTutorials().filter(t => t.service_type === serviceType);
  }

  /**
   * WhatsApp Business API Tutorial
   */
  private static getWhatsAppTutorial(): Tutorial {
    return {
      id: 'whatsapp-setup',
      name: 'Configuração do WhatsApp Business API',
      description: 'Tutorial completo para configurar o WhatsApp Business API no EnviaCódigo',
      service_type: 'whatsapp',
      estimated_time: 15,
      steps: [
        {
          id: 'whatsapp-step-1',
          title: 'Criação da Conta Meta for Developers',
          description: 'Primeiro passo para acessar a API do WhatsApp',
          content: `
            <div class="tutorial-content">
              <h3>🚀 Criando sua conta Meta for Developers</h3>
              <p>Para usar o WhatsApp Business API, você precisa de uma conta Meta for Developers.</p>
              
              <div class="step-instructions">
                <h4>Passos:</h4>
                <ol>
                  <li>Acesse <a href="https://developers.facebook.com" target="_blank">developers.facebook.com</a></li>
                  <li>Clique em "Get Started" ou "Começar"</li>
                  <li>Faça login com sua conta Facebook ou crie uma nova</li>
                  <li>Complete o processo de verificação se solicitado</li>
                </ol>
              </div>

              <div class="important-note">
                <strong>📝 Importante:</strong> Use uma conta Facebook pessoal ou empresarial válida. 
                Contas fake podem ser bloqueadas pela Meta.
              </div>
            </div>
          `,
          order: 1
        },
        {
          id: 'whatsapp-step-2',
          title: 'Criação do App Meta',
          description: 'Configurar um novo aplicativo para WhatsApp',
          content: `
            <div class="tutorial-content">
              <h3>📱 Criando seu App Meta</h3>
              
              <div class="step-instructions">
                <h4>Passos:</h4>
                <ol>
                  <li>No painel Meta for Developers, clique em "Create App"</li>
                  <li>Selecione "Business" como tipo de app</li>
                  <li>Preencha os dados:
                    <ul>
                      <li><strong>App name:</strong> Nome do seu app (ex: "EnviaCodigo Bot")</li>
                      <li><strong>Contact email:</strong> Seu email válido</li>
                    </ul>
                  </li>
                  <li>Clique em "Create App"</li>
                </ol>
              </div>

              <div class="tip">
                <strong>💡 Dica:</strong> Escolha um nome descritivo para seu app. 
                Este nome aparecerá nas configurações do WhatsApp.
              </div>
            </div>
          `,
          order: 2
        },
        {
          id: 'whatsapp-step-3',
          title: 'Adicionando o WhatsApp ao App',
          description: 'Configurar o produto WhatsApp no seu app',
          content: `
            <div class="tutorial-content">
              <h3>💬 Configurando o WhatsApp Business API</h3>
              
              <div class="step-instructions">
                <h4>Passos:</h4>
                <ol>
                  <li>No dashboard do seu app, procure por "WhatsApp"</li>
                  <li>Clique em "Set up" no card do WhatsApp</li>
                  <li>Selecione o Business Account ou crie um novo</li>
                  <li>Configure um número de telefone de teste (opcional para começar)</li>
                </ol>
              </div>

              <div class="warning">
                <strong>⚠️ Atenção:</strong> Para uso em produção, você precisará verificar 
                seu número de telefone comercial com a Meta.
              </div>
            </div>
          `,
          order: 3
        },
        {
          id: 'whatsapp-step-4',
          title: 'Obtendo as Credenciais',
          description: 'Coletando Access Token e Phone Number ID',
          content: `
            <div class="tutorial-content">
              <h3>🔑 Obtendo suas Credenciais</h3>
              
              <div class="step-instructions">
                <h4>Access Token:</h4>
                <ol>
                  <li>Na seção WhatsApp do seu app, vá para "API Setup"</li>
                  <li>Encontre "Temporary access token"</li>
                  <li>Copie o token (começa com "EAAG...")</li>
                </ol>

                <h4>Phone Number ID:</h4>
                <ol>
                  <li>Na mesma seção "API Setup"</li>
                  <li>Encontre "From" phone number ID</li>
                  <li>Copie o ID numérico</li>
                </ol>
              </div>

              <div class="security-note">
                <strong>🔒 Segurança:</strong> Mantenha suas credenciais seguras. 
                Não compartilhe o Access Token publicamente.
              </div>
            </div>
          `,
          validation: {
            required_fields: ['access_token', 'phone_number_id'],
            test_function: 'testWhatsAppConnection'
          },
          order: 4
        },
        {
          id: 'whatsapp-step-5',
          title: 'Configuração no EnviaCódigo',
          description: 'Inserindo as credenciais no sistema',
          content: `
            <div class="tutorial-content">
              <h3>⚙️ Configurando no EnviaCódigo</h3>
              
              <div class="step-instructions">
                <h4>Como configurar:</h4>
                <ol>
                  <li>Cole o <strong>Access Token</strong> no campo correspondente</li>
                  <li>Cole o <strong>Phone Number ID</strong> no campo correspondente</li>
                  <li>Clique em "Testar Conexão" para verificar</li>
                  <li>Se o teste passar, clique em "Salvar Configurações"</li>
                </ol>
              </div>

              <div class="success-note">
                <strong>✅ Pronto!</strong> Sua integração com WhatsApp está configurada. 
                Agora você pode enviar códigos via WhatsApp.
              </div>
            </div>
          `,
          validation: {
            required_fields: ['access_token', 'phone_number_id'],
            test_function: 'testWhatsAppConnection'
          },
          order: 5
        }
      ]
    };
  }

  /**
   * Email SMTP Tutorial
   */
  private static getEmailTutorial(): Tutorial {
    return {
      id: 'email-setup',
      name: 'Configuração do Email SMTP',
      description: 'Tutorial para configurar email SMTP no EnviaCódigo',
      service_type: 'email',
      estimated_time: 10,
      steps: [
        {
          id: 'email-step-1',
          title: 'Escolhendo o Provedor SMTP',
          description: 'Seleção do serviço de email para envio',
          content: `
            <div class="tutorial-content">
              <h3>📧 Escolhendo seu Provedor SMTP</h3>
              
              <div class="provider-options">
                <h4>Provedores Recomendados:</h4>
                
                <div class="provider">
                  <h5>📧 Gmail (Gratuito)</h5>
                  <ul>
                    <li><strong>SMTP:</strong> smtp.gmail.com</li>
                    <li><strong>Porta:</strong> 587 (TLS) ou 465 (SSL)</li>
                    <li><strong>Limite:</strong> 500 emails/dia</li>
                  </ul>
                </div>

                <div class="provider">
                  <h5>📧 Outlook/Hotmail (Gratuito)</h5>
                  <ul>
                    <li><strong>SMTP:</strong> smtp-mail.outlook.com</li>
                    <li><strong>Porta:</strong> 587</li>
                    <li><strong>Limite:</strong> 300 emails/dia</li>
                  </ul>
                </div>

                <div class="provider">
                  <h5>📧 SendGrid (Profissional)</h5>
                  <ul>
                    <li><strong>SMTP:</strong> smtp.sendgrid.net</li>
                    <li><strong>Porta:</strong> 587</li>
                    <li><strong>Limite:</strong> 100 emails/dia (gratuito)</li>
                  </ul>
                </div>
              </div>
            </div>
          `,
          order: 1
        },
        {
          id: 'email-step-2',
          title: 'Configuração do Gmail',
          description: 'Configurando Gmail para uso via SMTP',
          content: `
            <div class="tutorial-content">
              <h3>📧 Configurando Gmail</h3>
              
              <div class="step-instructions">
                <h4>Habilitando App Passwords:</h4>
                <ol>
                  <li>Acesse <a href="https://myaccount.google.com" target="_blank">myaccount.google.com</a></li>
                  <li>Vá para "Security" > "2-Step Verification"</li>
                  <li>Ative a verificação em 2 etapas se não estiver ativa</li>
                  <li>Procure por "App passwords" e clique</li>
                  <li>Gere uma senha para "Mail"</li>
                  <li>Use esta senha no campo "Senha SMTP"</li>
                </ol>
              </div>

              <div class="config-example">
                <h4>Configurações para Gmail:</h4>
                <ul>
                  <li><strong>Servidor SMTP:</strong> smtp.gmail.com</li>
                  <li><strong>Porta:</strong> 587</li>
                  <li><strong>Usuário:</strong> seu-email@gmail.com</li>
                  <li><strong>Senha:</strong> senha de app gerada</li>
                </ul>
              </div>
            </div>
          `,
          order: 2
        },
        {
          id: 'email-step-3',
          title: 'Configuração do Outlook',
          description: 'Configurando Outlook/Hotmail para SMTP',
          content: `
            <div class="tutorial-content">
              <h3>📧 Configurando Outlook/Hotmail</h3>
              
              <div class="step-instructions">
                <h4>Configuração direta:</h4>
                <p>O Outlook permite uso direto da senha da conta para SMTP.</p>
              </div>

              <div class="config-example">
                <h4>Configurações para Outlook:</h4>
                <ul>
                  <li><strong>Servidor SMTP:</strong> smtp-mail.outlook.com</li>
                  <li><strong>Porta:</strong> 587</li>
                  <li><strong>Usuário:</strong> seu-email@outlook.com</li>
                  <li><strong>Senha:</strong> senha da sua conta</li>
                </ul>
              </div>

              <div class="security-note">
                <strong>🔒 Segurança:</strong> Para maior segurança, considere criar 
                uma conta específica para envio de emails do sistema.
              </div>
            </div>
          `,
          order: 3
        },
        {
          id: 'email-step-4',
          title: 'Testando a Configuração',
          description: 'Verificando se o SMTP está funcionando',
          content: `
            <div class="tutorial-content">
              <h3>🧪 Testando sua Configuração</h3>
              
              <div class="step-instructions">
                <h4>Como testar:</h4>
                <ol>
                  <li>Preencha todos os campos SMTP</li>
                  <li>Clique em "Testar Conexão"</li>
                  <li>Se o teste passar, insira um email para teste</li>
                  <li>Clique em "Enviar Email de Teste"</li>
                  <li>Verifique se o email chegou (incluindo spam)</li>
                </ol>
              </div>

              <div class="troubleshooting">
                <h4>🔧 Problemas Comuns:</h4>
                <ul>
                  <li><strong>Autenticação falhou:</strong> Verifique usuário e senha</li>
                  <li><strong>Conexão recusada:</strong> Verifique servidor e porta</li>
                  <li><strong>Email não chega:</strong> Verifique pasta de spam</li>
                </ul>
              </div>
            </div>
          `,
          validation: {
            required_fields: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'from_email'],
            test_function: 'testEmailConnection'
          },
          order: 4
        }
      ]
    };
  }

  /**
   * Validate tutorial step completion
   */
  static validateStepCompletion(
    tutorialId: string, 
    stepId: string, 
    data: any
  ): { valid: boolean; errors: string[] } {
    const tutorial = this.getTutorialById(tutorialId);
    if (!tutorial) {
      return { valid: false, errors: ['Tutorial não encontrado'] };
    }

    const step = tutorial.steps.find(s => s.id === stepId);
    if (!step) {
      return { valid: false, errors: ['Passo do tutorial não encontrado'] };
    }

    if (!step.validation) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    
    // Check required fields
    for (const field of step.validation.required_fields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`Campo obrigatório: ${field}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get tutorial progress for user
   */
  static getTutorialProgress(userId: string, tutorialId: string): TutorialProgress | null {
    // In a real implementation, this would fetch from database
    // For now, return a default progress
    return {
      user_id: userId,
      tutorial_id: tutorialId,
      current_step: 1,
      completed_steps: [],
      completed: false,
      started_at: new Date()
    };
  }

  /**
   * Update tutorial progress
   */
  static updateTutorialProgress(
    userId: string, 
    tutorialId: string, 
    stepId: string, 
    completed: boolean = false
  ): TutorialProgress {
    // In a real implementation, this would update the database
    // For now, return updated progress
    const progress = this.getTutorialProgress(userId, tutorialId) || {
      user_id: userId,
      tutorial_id: tutorialId,
      current_step: 1,
      completed_steps: [],
      completed: false,
      started_at: new Date()
    };

    if (!progress.completed_steps.includes(stepId)) {
      progress.completed_steps.push(stepId);
    }

    if (completed) {
      progress.completed = true;
      progress.completed_at = new Date();
    }

    return progress;
  }
}