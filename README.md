# DISCORD BOT TEMPLATE
*"Bot open-source feito com Node.js e amor (às vezes ódio) por JavaScript, btw i'm brazilian so the archives on the bot are some comments from me saying in portuguese"*  

<div align="center">

![Node Version](https://img.shields.io/badge/Node.js-v22.14.0-68A063?style=flat-square&logo=node.js)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat-square&logo=discord)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql)
![Status](https://img.shields.io/badge/Status-Online-00CC00?style=flat-square)

</div>

---

## 🎛️ **Technologies**

| Library | Description |
|---------|-------------|
| ![Discord.js](https://img.shields.io/badge/-discord.js@14-FFE4E1?logo=discord) | Interaction with Discord API |
| ![Voice](https://img.shields.io/badge/-@discordjs/voice-FFE4E1?logo=spotify) | Music system |
| ![Play-dl](https://img.shields.io/badge/-play--dl-FFE4E1?logo=youtube&logoColor=black) | YouTube streaming (links/names/playlists) |
| ![MySQL](https://img.shields.io/badge/-MySQL-FFE4E1?logo=mysql&logoColor=black) | Server configurations |

---

## 🎯 **Commands (Slash Commands)**

### 🔧 **Admin**

| Command | Description |
|---------|-------------|
| ![Ban](https://img.shields.io/badge/-ban_@user_[reason]-FFE4E1) | Ban someone with a reason (or not) |
| ![Kick](https://img.shields.io/badge/-kick_@user-FFE4E1) | Kick someone |
| ![Clear](https://img.shields.io/badge/-clear_quantity-FFE4E1) | Delete messages from the selected chat |

### 🎶 **Music (YouTube)**

| Command | Description |
|---------|-------------|
| ![Resume](https://img.shields.io/badge/-resume-FFE4E1) | Resume the music |
| ![Play](https://img.shields.io/badge/-play-FFE4E1) | Search music using links/names/playlists |
| ![Pause](https://img.shields.io/badge/-pause-FFE4E1) | Pause the music |
| ![Queue](https://img.shields.io/badge/-queue-FFE4E1) | Show all music in the queue |
| ![Skip](https://img.shields.io/badge/-skip-FFE4E1) | Skip the current music |

### 📻 **General**

| Command | Description |
|---------|-------------|
| ![Vexy](https://img.shields.io/badge/-vexy-FFE4E1) | Command about the creator |
| ![Help](https://img.shields.io/badge/-help-FFE4E1) | Show all available commands |

### 💻 **Secrets**

| Command | Description |
|---------|-------------|
| ![Reactions](https://img.shields.io/badge/-random_reactions-FFE4E1) | Randomly reacts to your messages at any time (customizable emojis and timing) |

## 📳 **Install**  
1. **Requirements**:

   ![Node](https://img.shields.io/badge/-Node.js_v22+-68A063?logo=node.js&logoColor=white)  
   ![FFmpeg](https://img.shields.io/badge/-FFmpeg-007808?logo=ffmpeg) (`sudo apt install ffmpeg` on Linux)  

2. **Setup**:  
```bash
 git clone https://github.com/Velquis/discordbot-template.git
 cd discordbot-template
 npm install
 cp .env.example .env
 Edit the .env file with your bot's credentials
 node .
```
   
3. **.env Configuration**:  
   After copying `.env.example` to `.env`, you need to fill in the environment variables:
   
```bash
 DISCORD_TOKEN= (your bot token here)
 CLIENT_ID= (your client ID if needed — recommended to leave empty or use your own)
 SPOTIFY_CLIENT_ID= (leave empty!)
 SPOTIFY_CLIENT_SECRET= (leave empty!)
 SPOTIFY_REDIRECT_URI= (leave empty!)
 YTDLP_EXEC_PATH= (path to your `yt-dlp.exe` — for now, this feature requires manual installation of yt-dlp and setting its system path on your machine)
```

   ⚠️ Make sure to keep sensitive data like your token private and never share your `.env` file publicly.

