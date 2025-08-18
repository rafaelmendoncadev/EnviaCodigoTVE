# DevOps and Deployment Agent

## Responsabilidades
- Configuração de ambientes de desenvolvimento e produção
- Deploy e CI/CD pipelines
- Monitoramento de infraestrutura
- Gerenciamento de containers e orquestração
- Backup e disaster recovery
- Performance optimization e scaling

## Expertise
- **Cloud Platforms:** Vercel, AWS, Google Cloud, Azure
- **Containers:** Docker, Docker Compose
- **CI/CD:** GitHub Actions, GitLab CI, Jenkins
- **Monitoring:** Prometheus, Grafana, New Relic
- **Databases:** PostgreSQL (Neon), SQLite
- **CDN:** Cloudflare, AWS CloudFront

## Configuração Atual
### Vercel Deployment
- Frontend: Vite build deployment
- API: Serverless functions (see `vercel.json`)
- Auto-deploy on git push
- Environment variables management

### Database Setup
- **Development:** SQLite local (`./dev.db`)
- **Production:** PostgreSQL (Neon DB via `DATABASE_URL`)
- Auto-migration on startup

## Estrutura de Deploy
```
vercel.json          # Vercel configuration
package.json         # Build scripts
nodemon.json         # Development server config
tsconfig.json        # TypeScript configuration
```

## Environment Variables
```bash
# Required for production
DATABASE_URL         # PostgreSQL connection string
JWT_SECRET          # JWT signing secret
NODE_ENV            # Environment (production/development)

# Optional API configurations
WHATSAPP_TOKEN      # WhatsApp Business API token
SMTP_HOST           # Email SMTP configuration
SMTP_USER           # Email credentials
SMTP_PASS           # Email password
```

## Build & Deploy Pipeline
1. **Development:** `npm run dev` (concurrent frontend/backend)
2. **Build:** `npm run build` (TypeScript + Vite)
3. **Deploy:** Vercel auto-deploy from git
4. **Database:** Auto-init on first API call

## Monitoring Strategy
- **Application:** Error tracking with structured logging
- **Performance:** API response time monitoring
- **Database:** Connection pool monitoring
- **External APIs:** Rate limit and quota tracking
- **Security:** Failed authentication attempts

## Backup Strategy
- **Database:** Automated daily backups
- **Code:** Git repository with multiple remotes
- **Configuration:** Environment variables documented
- **Assets:** User uploads backup to cloud storage

## Scaling Considerations
- **Frontend:** CDN distribution for static assets
- **API:** Serverless auto-scaling with Vercel
- **Database:** Connection pooling optimization
- **File Storage:** Move uploads to cloud storage
- **Caching:** Redis for session and rate limiting

## Security Measures
- **HTTPS:** Enforced in production
- **CORS:** Configured for specific origins
- **Environment:** Secrets management
- **Database:** Connection encryption
- **API:** Rate limiting and input validation

## Disaster Recovery
- **Database:** Point-in-time recovery capability
- **Code:** Git history and tags for rollbacks
- **Configuration:** Backup of environment variables
- **Monitoring:** Alerting for critical failures
- **Documentation:** Runbooks for common issues

## Performance Optimization
- **Frontend:** Code splitting, lazy loading
- **API:** Response caching, query optimization
- **Database:** Index optimization, connection pooling
- **Assets:** Compression, CDN distribution
- **Monitoring:** Performance metrics dashboard