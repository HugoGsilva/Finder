# Guild Monitoring System

Sistema web para monitoramento de guildas em servidores do Rubinot (Tibia).

## Estrutura do Projeto

```
├── backend/          # API REST + WebSocket Server
├── frontend/         # React + TypeScript + TailwindCSS
├── scraper/          # Web Scraping Services
├── discord-bot/      # Discord Bot para notificações
├── database/         # Scripts SQL de inicialização
├── nginx/            # Configuração do reverse proxy
└── docker-compose.yml
```

## Requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)

## Início Rápido

1. Clone o repositório e copie o arquivo de ambiente:
```bash
cp .env.example .env
```

2. Edite o `.env` com suas configurações:
```bash
# Configure as credenciais do banco, JWT secret e token do Discord
```

3. Inicie os containers:
```bash
docker-compose up --build
```

4. Acesse o sistema:
- Frontend: http://localhost
- API: http://localhost/api

## Usuário Padrão

- **Username:** pifot16
- **Password:** Kx3nvqt1
- **Role:** Administrador

## Desenvolvimento

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Scraper
```bash
cd scraper
npm install
npm run dev
```

### Discord Bot
```bash
cd discord-bot
npm install
npm run dev
```

## Servidores Suportados

- Auroria (OpenPVP)
- Belaria (OpenPVP)
- Vesperia (OpenPVP)
- Bellum (RetroPVP)
- Spectrum (RetroPVP)
- Tenebrium (RetroPVP)

## Tecnologias

- **Frontend:** React, TypeScript, TailwindCSS, Socket.io-client
- **Backend:** Node.js, Express, TypeScript, Socket.io
- **Database:** PostgreSQL, Redis
- **Scraping:** Cheerio, Axios
- **Discord:** Discord.js
- **Deploy:** Docker, Nginx
