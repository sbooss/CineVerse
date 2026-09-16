# CINE BOSS - Streaming Platform

Plataforma de streaming completa com filmes, series, anime e TV ao vivo.

## Como Usar

### Opcao 1: Servidor Python (Recomendado)
```bash
cd C:\Users\Boss William\Desktop\CineVerse
python server.py
```
Acesse: http://localhost:8080

### Opcao 2: Abrir direto
Abra o arquivo `index.html` no navegador.

## Funcionalidades

### Streaming
- **Filmes** com player embutido (VidSrc, 2Embed, SuperEmbed)
- **Series** com selecao de temporada/episodio
- **Anime** com categorias e buscas
- **TV Ao Vivo** com canais brasileiros e internacionais

### APIs Utilizadas
- **TMDB** - Metadados, posters, avaliacoes (API key incluida)
- **VidSrc** - Embed de filmes e series
- **2Embed** - Player alternativo
- **SuperEmbed** - Multi-servidor
- **VidLink** - Player com legendas
- **VidFast** - Player rapido

### Funcionalidades
- Busca em tempo real
- Favoritos salvos localmente
- Tema futurista azul neon
- Responsivo para mobile
- Players multiplos com fallback

## Estrutura

```
CineVerse/
├── index.html      # Pagina principal
├── style.css       # Estilos (tema azul neon)
├── config.js       # Configuracoes e canais TV
├── tmdb.js         # Integracao com TMDB API
├── player.js       # Gerenciamento de players
├── app.js          # Logica da aplicacao
├── server.py       # Servidor Python (opcional)
└── README.md       # Este arquivo
```

## Personalizacao

### Mudar API Key do TMDB
Edite `config.js`:
```javascript
TMDB: {
    API_KEY: 'sua_chave_aqui',
    ...
}
```

### Adicionar Canais TV
Edite o array `TV_CHANNELS` em `config.js`:
```javascript
TV_CHANNELS: [
    {
        name: 'Nome do Canal',
        logo: 'URL_DO_LOGO',
        stream: 'URL_DA_STREAM'
    },
    ...
]
```

### Mudar Provider Padrao
Em `config.js`, altere `EMBED.DEFAULT`:
```javascript
EMBED: {
    DEFAULT: 0, // 0=VidSrc, 1=2Embed, 2=SuperEmbed, 3=VidLink, 4=VidFast
    ...
}
```

## Requisitos
- Python 3.x (para servidor)
- Navegador moderno (Chrome, Firefox, Edge)
- Conexao com internet

## Notas
- Os players usam iframes de provedores gratuitos
- Algumas streams podem nao funcionar dependendo da regiao
- TMDB fornece metadados em portugues
- Favoritos sao salvos no navegador (localStorage)
