# 🎵 VexyBot - O Bot Musical Brasileiro 
*"Bot open-source feito com Node.js e amor (às vezes ódio) por JavaScript"*  

![Node.js](https://img.shields.io/badge/Node.js-v22-brightgreen)  
![Discord.js](https://img.shields.io/badge/Discord.js-v14-blueviolet)  
[![Convidar](https://img.shields.io/badge/Convite-para_seu_servidor-5865F2?style=for-the-badge&logo=discord)](https://discord.com/oauth2/authorize?client_id=SEU_BOT_ID&scope=bot%20applications.commands)

---

## 🎛️ **Tecnologias**  
- **Runtime**: Node.js v22  
- **Bibliotecas Principais**:  
  - `discord.js@14` - Interação com a API do Discord  
  - `@discordjs/voice` - Sistema de música  
  - `play-dl` - Streaming do YouTube (links/nomes/playlists)  
- **Database**: SQLite3 (para configurações de servidor)  

---

## 🎯 **Comandos (Slash Commands)**  

### 🔧 **Administração**  
- `/ban @usuário [motivo]` - Banimento com registro  
- `/kick @usuário` - Expulsão temporária  
- `/clear quantidade` - Limpeza em massa de mensagens  

### 🎶 **Música (YouTube)**  
- `/play query` - Busca por link/nome/playlist  
- `/skip` - Pula para próxima música  
- `/queue` - Mostra a fila atual  
- `/lyrics` - Busca letras da música atual  

### 😊 **Diversão**  
- `/vexy` - Fatos aleatórios sobre o criador  
- `/react` - Bot reage à mensagem atual  

---

## 🚀 **Instalação**  
1. **Pré-requisitos**:  
   - Node.js v22+  
   - FFmpeg (`sudo apt install ffmpeg` no Linux)  

2. **Configuração**:  
   ```bash
   git clone https://github.com/Velquis/VexyBot.git
   cd VexyBot
   npm install
   cp .env.example .env
   # Edite o .env com seu token
   node .
