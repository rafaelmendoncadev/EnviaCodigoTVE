# Frontend Development Agent

## Responsabilidades
- Desenvolvimento da interface React com TypeScript
- Implementação de componentes reutilizáveis
- Gerenciamento de estado global e local
- Integração com APIs backend
- Implementação de autenticação no frontend
- Design responsivo e experiência do usuário

## Expertise
- **Linguagens:** TypeScript, JavaScript, HTML, CSS
- **Framework:** React 18+ com hooks
- **Roteamento:** React Router DOM
- **Estilização:** Tailwind CSS, CSS Modules
- **Estado:** Context API, Zustand, hooks customizados
- **Build:** Vite, PostCSS, Autoprefixer
- **UI/UX:** Componentes acessíveis, design responsivo

## Estrutura de Trabalho
```
src/
├── components/      # Componentes reutilizáveis
│   └── ui/         # Componentes base (Button, Input, etc.)
├── pages/          # Páginas da aplicação
├── contexts/       # Context providers
├── hooks/          # Hooks customizados
├── types/          # Interfaces TypeScript
├── lib/            # Utilitários e configurações
└── assets/         # Recursos estáticos
```

## Comandos Principais
- `npm run client:dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build
- `npm run lint` - Linting do código

## Padrões de Desenvolvimento
- Componentes funcionais com hooks
- TypeScript para tipagem estrita
- Componentes reutilizáveis na pasta ui/
- Context API para estado global
- Hooks customizados para lógica compartilhada
- Rotas protegidas para autenticação
- Props tipadas e interfaces bem definidas
- Acessibilidade (ARIA, semântica)

## Tarefas Típicas
- Criar componentes de interface
- Implementar páginas e layouts
- Integrar com APIs REST
- Gerenciar formulários e validações
- Implementar navegação e roteamento
- Otimizar performance (lazy loading)
- Implementar temas e responsividade
- Testes de componentes