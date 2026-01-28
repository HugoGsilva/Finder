# Deployment Guide - Guild Monitoring System

## 🚀 Production Deployment

### 1. Configuração Inicial

#### 1.1 Clonar Repositório
```bash
git clone <repository-url>
cd Finder
```

#### 1.2 Configurar Variáveis de Ambiente

**Root .env:**
```bash
cp .env.example .env
```

Edite `.env`:
```env
# PostgreSQL
POSTGRES_USER=guild_monitor_user
POSTGRES_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
POSTGRES_DB=guild_monitor

# Container Environment
NODE_ENV=production
```

**Backend .env:**
```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env`:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=CHANGE_THIS_STRONG_JWT_SECRET_32_CHARS_MIN
DATABASE_URL=postgresql://guild_monitor_user:CHANGE_THIS_STRONG_PASSWORD@postgres:5432/guild_monitor
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
```

**Frontend .env:**
```bash
cp frontend/.env.example frontend/.env
```

Edite `frontend/.env`:
```env
VITE_API_URL=http://your-domain.com
VITE_WS_URL=http://your-domain.com
```

**Scraper .env:**
```bash
cp scraper/.env.example scraper/.env
```

Edite `scraper/.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://guild_monitor_user:CHANGE_THIS_STRONG_PASSWORD@postgres:5432/guild_monitor
LOG_LEVEL=info
```

**Discord Bot .env:**
```bash
cp discord-bot/.env.example discord-bot/.env
```

Edite `discord-bot/.env`:
```env
NODE_ENV=production
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
DATABASE_URL=postgresql://guild_monitor_user:CHANGE_THIS_STRONG_PASSWORD@postgres:5432/guild_monitor
LOG_LEVEL=info
```

### 2. Discord Bot Setup

#### 2.1 Criar Bot Application
1. Acesse https://discord.com/developers/applications
2. Clique em "New Application"
3. Dê um nome (ex: "Guild Monitor Bot")
4. Vá para "Bot" no menu lateral
5. Clique em "Add Bot"
6. Copie o token e cole no `discord-bot/.env`

#### 2.2 Configurar Intents
No painel do bot, habilite:
- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

#### 2.3 Convidar Bot para Servidor
1. Vá para "OAuth2" > "URL Generator"
2. Selecione scopes:
   - ✅ bot
3. Selecione permissões:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
4. Copie a URL gerada e abra no navegador
5. Selecione seu servidor Discord

### 3. Build e Deploy

#### 3.1 Build das Imagens Docker
```bash
docker-compose build
```

#### 3.2 Iniciar Serviços
```bash
docker-compose up -d
```

#### 3.3 Verificar Status
```bash
docker-compose ps
```

Todos os containers devem estar com status "Up":
- `guild-monitor-nginx`
- `guild-monitor-frontend`
- `guild-monitor-backend`
- `guild-monitor-scraper`
- `guild-monitor-discord-bot`
- `guild-monitor-postgres`
- `guild-monitor-redis`

### 4. Verificação de Logs

#### 4.1 Backend
```bash
docker-compose logs -f backend
```

Deve mostrar:
```
Server running on port 3000
Database connected successfully
Redis connected successfully
```

#### 4.2 Scraper
```bash
docker-compose logs -f scraper
```

Deve mostrar:
```
Scraper service started
Scheduler initialized with 5 tasks
```

#### 4.3 Discord Bot
```bash
docker-compose logs -f discord-bot
```

Deve mostrar:
```
Discord bot logged in as <bot-name>
Discord bot is ready
```

#### 4.4 Frontend
```bash
docker-compose logs -f frontend
```

### 5. Primeiro Acesso

1. Acesse `http://localhost` (ou seu domínio)
2. Faça login com credenciais padrão:
   - Username: `pifot16`
   - Password: `Kx3nvqt1`
3. Vá para Admin Panel
4. Configure as guildas

### 6. Configuração de Notificações Discord

#### 6.1 Obter Channel ID
1. No Discord, ative "Developer Mode" (Settings > Advanced > Developer Mode)
2. Clique com botão direito no canal desejado
3. Clique em "Copy ID"

#### 6.2 Cadastrar no Banco
```sql
-- Conectar ao PostgreSQL
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor

-- Inserir configuração do Discord
INSERT INTO discord_config (
  server_id,
  guild_id,
  channel_id,
  notify_deaths,
  notify_hunting,
  notify_status,
  notify_members,
  is_active
) VALUES (
  '<server_uuid>',      -- UUID do servidor (consulte tabela servers)
  '<guild_uuid>',       -- UUID da guilda (consulte tabela guilds) ou NULL para todas
  '<discord_channel_id>', -- ID do canal do Discord
  true,                 -- Notificar mortes
  true,                 -- Notificar hunting
  true,                 -- Notificar status (online/offline)
  true,                 -- Notificar mudanças em membros
  true                  -- Configuração ativa
);
```

### 7. Backup e Manutenção

#### 7.1 Backup do Banco de Dados
```bash
# Criar backup
docker exec guild-monitor-postgres pg_dump -U guild_monitor_user guild_monitor > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
cat backup_20240101_120000.sql | docker exec -i guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor
```

#### 7.2 Limpar Dados Antigos
```sql
-- Deletar mortes com mais de 30 dias
DELETE FROM deaths WHERE created_at < NOW() - INTERVAL '30 days';

-- Deletar snapshots de XP com mais de 60 dias
DELETE FROM xp_snapshots WHERE snapshot_time < NOW() - INTERVAL '60 days';

-- Deletar logs de scraping com mais de 7 dias
DELETE FROM scraper_logs WHERE created_at < NOW() - INTERVAL '7 days';
```

#### 7.3 Monitoramento de Recursos
```bash
# Ver uso de CPU e memória
docker stats

# Ver espaço em disco dos volumes
docker system df -v
```

### 8. Troubleshooting

#### 8.1 Backend não conecta ao PostgreSQL
```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps postgres

# Verificar logs do PostgreSQL
docker-compose logs postgres

# Testar conexão manual
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor
```

#### 8.2 Scraper não está coletando dados
```bash
# Ver logs detalhados
docker-compose logs -f scraper

# Verificar tabela de logs
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor
SELECT * FROM scraper_logs ORDER BY created_at DESC LIMIT 10;
```

#### 8.3 Discord Bot não envia mensagens
```bash
# Verificar logs
docker-compose logs -f discord-bot

# Verificar token
docker-compose exec discord-bot env | grep DISCORD_BOT_TOKEN

# Verificar configurações
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor
SELECT * FROM discord_config WHERE is_active = true;
```

#### 8.4 WebSocket não conecta
```bash
# Verificar se o backend está rodando
curl http://localhost:3000/health

# Ver logs do backend
docker-compose logs -f backend

# Verificar CORS
# Certifique-se que VITE_WS_URL está correto no frontend/.env
```

#### 8.5 Frontend mostra erro 404
```bash
# Verificar nginx
docker-compose logs nginx

# Rebuild do frontend
docker-compose up -d --build frontend
```

### 9. Atualizações

#### 9.1 Atualizar Código
```bash
# Pull das mudanças
git pull origin main

# Rebuild dos containers alterados
docker-compose up -d --build

# Ver logs para confirmar
docker-compose logs -f
```

#### 9.2 Atualizar Dependências
```bash
# Backend
cd backend && npm update && cd ..

# Frontend
cd frontend && npm update && cd ..

# Scraper
cd scraper && npm update && cd ..

# Discord Bot
cd discord-bot && npm update && cd ..

# Rebuild
docker-compose build
docker-compose up -d
```

### 10. Segurança

#### 10.1 Checklist de Segurança
- [ ] JWT_SECRET alterado (min 32 caracteres)
- [ ] Senha do PostgreSQL alterada
- [ ] Discord Bot Token protegido
- [ ] Firewall configurado (portas 80, 443)
- [ ] SSL/TLS configurado (recomendado)
- [ ] Backups automáticos configurados
- [ ] Rate limiting ativado no backend
- [ ] CORS configurado corretamente

#### 10.2 SSL/TLS com Let's Encrypt (Recomendado)

Edite `nginx/nginx.conf` para adicionar:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... resto da configuração
}
```

### 11. Performance

#### 11.1 Otimizações Recomendadas

**PostgreSQL:**
```sql
-- Criar índices adicionais se necessário
CREATE INDEX idx_player_status_timestamp ON player_status(timestamp);
CREATE INDEX idx_deaths_death_time ON deaths(death_time);
CREATE INDEX idx_hunting_sessions_start_time ON hunting_sessions(start_time);
```

**Redis:**
- Configure Redis persistence (AOF ou RDB)
- Monitore uso de memória

**Nginx:**
- Habilite gzip compression
- Configure cache de assets estáticos
- Use HTTP/2

### 12. Monitoramento Contínuo

#### 12.1 Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# Verificar todos os serviços
docker-compose ps
```

#### 12.2 Métricas
- Monitor CPU/RAM usage: `docker stats`
- Monitor disk usage: `df -h`
- Monitor database size:
```sql
SELECT pg_size_pretty(pg_database_size('guild_monitor'));
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose logs -f`
2. Consulte a seção de Troubleshooting acima
3. Abra uma issue no GitHub

## ✅ Deployment Checklist

- [ ] Variáveis de ambiente configuradas
- [ ] Discord bot criado e configurado
- [ ] Docker containers rodando (7/7)
- [ ] PostgreSQL inicializado com schema
- [ ] Login no sistema funcionando
- [ ] Servidores carregados no dashboard
- [ ] Scrapers coletando dados
- [ ] WebSocket conectando
- [ ] Notificações Discord funcionando
- [ ] Backups configurados
- [ ] Monitoramento ativo
