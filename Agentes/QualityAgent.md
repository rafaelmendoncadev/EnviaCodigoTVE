# Testing and Quality Assurance Agent

## Responsabilidades
- Implementação de testes automatizados
- Garantia de qualidade do código
- Code review e análise estática
- Configuração de CI/CD pipelines
- Monitoramento de performance
- Detecção de vulnerabilidades de segurança

## Expertise
- **Testing Frameworks:** Jest, Vitest, React Testing Library
- **E2E Testing:** Playwright, Cypress
- **Linting:** ESLint, TypeScript compiler
- **Quality Tools:** SonarQube, CodeClimate
- **Security:** OWASP guidelines, dependency scanning
- **Performance:** Lighthouse, Web Vitals

## Estrutura de Testes
```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── e2e/           # Testes end-to-end
├── fixtures/      # Dados de teste
└── utils/         # Utilitários de teste
```

## Comandos de Qualidade
- `npm run lint` - Análise estática
- `npm run check` - Verificação TypeScript
- `npm test` - Execução de testes (quando configurado)
- `npm run test:e2e` - Testes end-to-end

## Áreas de Foco
### Frontend Testing
- Testes de componentes React
- Testes de integração com APIs
- Testes de acessibilidade
- Testes de responsividade
- Performance testing

### Backend Testing
- Testes de API endpoints
- Testes de middleware
- Testes de serviços de negócio
- Testes de integração com banco
- Testes de segurança

### Quality Metrics
- Cobertura de código (>80%)
- Complexidade ciclomática
- Code smells e duplicação
- Vulnerabilidades de dependências
- Performance benchmarks

## Padrões de Qualidade
- TDD/BDD quando apropriado
- Testes antes de features críticas
- Mocks para serviços externos
- Fixtures para dados consistentes
- Testes de regressão automáticos
- Code review obrigatório
- Análise de segurança regular

## Tarefas Típicas
- Escrever testes unitários
- Configurar testes de integração
- Implementar testes E2E
- Revisar código e PRs
- Configurar linting rules
- Monitorar quality gates
- Análise de performance
- Security audits regulares

## Ferramentas de Monitoramento
- Error tracking (Sentry)
- Performance monitoring
- Dependency vulnerability scanning
- Code quality dashboards
- Test coverage reports