# Requirements Document

## Introduction

O Guild Monitoring System é um sistema web que monitora e rastreia atividades de guildas em servidores do Rubinot (Tibia). O sistema coleta dados de múltiplas fontes (listagem de membros, killboard, jogadores online, highscores e tempo ativo), processa essas informações e apresenta em um painel web com temática medieval escura. Inclui integração com Discord para notificações em tempo real e um painel administrativo para gerenciamento de guildas e usuários.

## Glossary

- **Guild**: Grupo organizado de jogadores no jogo
- **Killboard**: Registro de mortes de jogadores no jogo
- **Vocation**: Classe/profissão do personagem no jogo (Knight, Sorcerer, Druid, Paladin)
- **Highscore**: Ranking de jogadores por experiência (XP)
- **XP**: Pontos de experiência do jogador
- **Sistema**: O Guild Monitoring System
- **Administrador**: Usuário com privilégios de gerenciamento completo
- **Usuário Registrado**: Usuário que criou conta mas aguarda aprovação
- **Servidor**: Mundo do jogo (Auroria, Belaria, Vesperia, Bellum, Spectrum, Tenebrium)
- **Scraper**: Componente que extrai dados das páginas web do Rubinot
- **Discord Bot**: Aplicação que envia notificações para canais do Discord

## Requirements

### Requirement 1

**User Story:** Como administrador, eu quero coletar dados de membros das guildas a cada 12 horas, para manter uma lista atualizada de todos os membros aliados e inimigos.

#### Acceptance Criteria

1. WHEN o Sistema acessa a página de guildas THEN o Sistema SHALL enviar requisição POST com payload contendo o servidor selecionado para o endpoint correspondente
2. WHEN o Sistema localiza uma guilda configurada THEN o Sistema SHALL extrair o nome do jogador (excluindo títulos entre parênteses) e a vocation de cada membro
3. WHEN o Sistema completa a coleta de uma guilda THEN o Sistema SHALL armazenar os dados com timestamp da coleta
4. WHEN passam 12 horas desde a última coleta THEN o Sistema SHALL iniciar automaticamente uma nova coleta de dados de guildas
5. WHEN o Sistema realiza requisições HTTP THEN o Sistema SHALL utilizar compressão Gzip/Brotli para minimizar o tráfego de rede

### Requirement 2

**User Story:** Como administrador, eu quero monitorar o killboard a cada 30 segundos, para rastrear mortes de jogadores aliados e inimigos em tempo real.

#### Acceptance Criteria

1. WHEN o Sistema acessa a página de killboard THEN o Sistema SHALL enviar requisição POST com payload contendo o servidor selecionado
2. WHEN o Sistema filtra por guilda THEN o Sistema SHALL distinguir entre guildas aliadas e inimigas conforme configuração
3. WHEN o Sistema detecta uma nova morte THEN o Sistema SHALL registrar o evento com informações completas (vítima, assassino, timestamp)
4. WHEN passam 30 segundos desde a última verificação THEN o Sistema SHALL verificar novamente o killboard
5. WHEN o Sistema identifica uma morte de aliado ou inimigo THEN o Sistema SHALL categorizar corretamente baseado na configuração de guildas

### Requirement 3

**User Story:** Como administrador, eu quero verificar quais jogadores estão online a cada 30 segundos, para monitorar a presença de aliados e inimigos no servidor.

#### Acceptance Criteria

1. WHEN o Sistema acessa a URL de worlds com parâmetro de servidor THEN o Sistema SHALL obter a lista completa de jogadores online
2. WHEN o Sistema compara a lista online com membros cadastrados THEN o Sistema SHALL marcar jogadores como online ou offline
3. WHEN o Sistema detecta mudança de status THEN o Sistema SHALL atualizar o status do jogador imediatamente
4. WHEN passam 30 segundos desde a última verificação THEN o Sistema SHALL verificar novamente a lista de jogadores online
5. WHEN o Sistema extrai dados da página THEN o Sistema SHALL obter Name, Level e Vocation de cada jogador online

### Requirement 4

**User Story:** Como administrador, eu quero monitorar se jogadores estão caçando verificando highscores a cada 1 minuto, para identificar atividades de farming e calcular ganho de XP.

#### Acceptance Criteria

1. WHEN o Sistema acessa a página de highscores THEN o Sistema SHALL enviar requisição POST com payload contendo o servidor selecionado
2. WHEN o Sistema coleta dados de highscores THEN o Sistema SHALL processar no mínimo as 15 primeiras páginas do ranking
3. WHEN o Sistema compara XP atual com XP anterior THEN o Sistema SHALL calcular o ganho de experiência e tempo decorrido
4. WHEN o Sistema detecta ganho de XP THEN o Sistema SHALL marcar o jogador como "caçando" e registrar a taxa de XP por minuto
5. WHEN o Sistema processa valores de XP THEN o Sistema SHALL suportar números com mais de 12 dígitos
6. WHEN passam 60 segundos desde a última verificação THEN o Sistema SHALL verificar novamente os highscores
7. WHEN o Sistema identifica jogador caçando THEN o Sistema SHALL exibir tempo total caçando e XP total ganho

### Requirement 5

**User Story:** Como administrador, eu quero coletar histórico de tempo online dos jogadores a cada 12 horas, para identificar padrões de horários de atividade.

#### Acceptance Criteria

1. WHEN o Sistema acessa a URL do rubinothings com nome do jogador THEN o Sistema SHALL extrair os dados de "Histórico de tempo online"
2. WHEN o Sistema processa histórico de tempo THEN o Sistema SHALL identificar os horários principais de atividade do jogador
3. WHEN o Sistema completa análise de tempo THEN o Sistema SHALL armazenar padrões de horário para cada jogador
4. WHEN passam 12 horas desde a última coleta THEN o Sistema SHALL atualizar automaticamente os dados de tempo ativo
5. WHEN o Sistema exibe dados de tempo ativo THEN o Sistema SHALL apresentar horário principal e estatísticas de presença

### Requirement 6

**User Story:** Como administrador, eu quero gerenciar guildas aliadas e inimigas através de um painel administrativo, para configurar quais guildas o sistema deve monitorar.

#### Acceptance Criteria

1. WHEN o Administrador acessa o painel administrativo THEN o Sistema SHALL exibir interface para adicionar, editar e remover guildas
2. WHEN o Administrador adiciona uma guilda THEN o Sistema SHALL permitir classificá-la como aliada ou inimiga
3. WHEN o Administrador configura uma guilda THEN o Sistema SHALL permitir especificar o servidor associado
4. WHEN o Administrador salva configuração de guilda THEN o Sistema SHALL validar e armazenar sem hardcoding
5. WHEN o Sistema inicia coleta de dados THEN o Sistema SHALL processar apenas guildas configuradas no painel

### Requirement 7

**User Story:** Como usuário, eu quero me registrar no sistema e aguardar aprovação de um administrador, para ter acesso controlado às informações de monitoramento.

#### Acceptance Criteria

1. WHEN um usuário acessa a página de registro THEN o Sistema SHALL exibir formulário de criação de conta
2. WHEN um usuário submete registro THEN o Sistema SHALL criar conta com status "pendente de aprovação"
3. WHEN um Administrador acessa painel de usuários THEN o Sistema SHALL listar usuários pendentes de aprovação
4. WHEN um Administrador aprova um usuário THEN o Sistema SHALL ativar a conta e permitir acesso ao sistema
5. WHEN um usuário não aprovado tenta acessar THEN o Sistema SHALL bloquear acesso e exibir mensagem de aguardo
6. WHEN o primeiro usuário é criado THEN o Sistema SHALL criar conta "pifot16" com senha "Kx3nvqt1" e privilégios de administrador

### Requirement 8

**User Story:** Como administrador, eu quero integrar um bot do Discord para receber notificações em tempo real, para acompanhar eventos importantes sem acessar o site.

#### Acceptance Criteria

1. WHEN o Administrador acessa configuração do Discord THEN o Sistema SHALL exibir instruções para adicionar o bot ao servidor Discord
2. WHEN o Administrador configura canais THEN o Sistema SHALL permitir selecionar quais tipos de notificações cada canal receberá
3. WHEN o Sistema detecta evento configurado THEN o Discord Bot SHALL enviar notificação para o canal apropriado
4. WHEN o Administrador ativa notificações THEN o Sistema SHALL permitir escolher entre: killboard, status online, jogadores caçando, e atualizações de membros
5. WHEN o Discord Bot envia notificação THEN o Sistema SHALL formatar mensagem com informações relevantes e timestamp

### Requirement 9

**User Story:** Como usuário, eu quero visualizar informações em um painel web com temática medieval escura, para ter uma experiência visual agradável e imersiva.

#### Acceptance Criteria

1. WHEN o usuário acessa o site THEN o Sistema SHALL exibir interface com paleta de cores escuras e elementos medievais
2. WHEN o Sistema exibe informações de jogadores THEN o Sistema SHALL usar cards organizados e didáticos
3. WHEN o Sistema apresenta dados THEN o Sistema SHALL manter layout simples e fácil de navegar
4. WHEN o usuário visualiza diferentes seções THEN o Sistema SHALL manter consistência visual temática em todas as páginas
5. WHEN o Sistema carrega a interface THEN o Sistema SHALL aplicar estilo inspirado no visual do Tibia

### Requirement 10

**User Story:** Como usuário, eu quero que o site atualize automaticamente as informações a cada 5 segundos, para sempre visualizar os dados mais recentes sem recarregar a página.

#### Acceptance Criteria

1. WHEN o usuário está visualizando o painel THEN o Sistema SHALL atualizar automaticamente os dados exibidos a cada 5 segundos
2. WHEN o Sistema atualiza dados THEN o Sistema SHALL fazer requisições assíncronas sem recarregar a página completa
3. WHEN novos dados são recebidos THEN o Sistema SHALL atualizar a interface de forma suave e não intrusiva
4. WHEN o Sistema detecta mudanças THEN o Sistema SHALL destacar visualmente informações que foram atualizadas
5. WHEN o usuário interage com a interface THEN o Sistema SHALL manter atualizações automáticas sem interromper a interação

### Requirement 11

**User Story:** Como sistema, eu quero suportar múltiplos servidores do Rubinot, para permitir monitoramento de guildas em diferentes mundos do jogo.

#### Acceptance Criteria

1. WHEN o Sistema é configurado THEN o Sistema SHALL suportar os servidores: Auroria, Belaria, Vesperia, Bellum, Spectrum e Tenebrium
2. WHEN o Administrador adiciona guilda THEN o Sistema SHALL permitir associar a guilda a um servidor específico
3. WHEN o Sistema coleta dados THEN o Sistema SHALL processar cada servidor de forma independente
4. WHEN o usuário visualiza dados THEN o Sistema SHALL permitir filtrar informações por servidor
5. WHEN o Sistema executa scrapers THEN o Sistema SHALL adaptar navegação conforme tipo de servidor (OpenPVP ou RetroPVP)

### Requirement 12

**User Story:** Como desenvolvedor, eu quero que o sistema processe dados de forma resiliente, para lidar com falhas de rede e mudanças na estrutura das páginas fonte.

#### Acceptance Criteria

1. WHEN o Sistema falha ao acessar uma página THEN o Sistema SHALL registrar o erro e tentar novamente após intervalo configurado
2. WHEN o Sistema detecta mudança na estrutura HTML THEN o Sistema SHALL registrar alerta para revisão manual
3. WHEN o Sistema processa dados inválidos THEN o Sistema SHALL ignorar o registro e continuar processamento
4. WHEN o Sistema enfrenta timeout de conexão THEN o Sistema SHALL abortar requisição e agendar nova tentativa
5. WHEN o Sistema registra erros THEN o Sistema SHALL manter log detalhado para diagnóstico e debugging
