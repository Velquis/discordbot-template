import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

(async () => {
  try {
    const data = await spotify.clientCredentialsGrant();
    console.log('✅ Token obtido com sucesso');
    spotify.setAccessToken(data.body.access_token);
    
    const result = await spotify.searchTracks('Daft Punk');
    console.log('🎵 Música encontrada:', result.body.tracks.items[0].name);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
})();