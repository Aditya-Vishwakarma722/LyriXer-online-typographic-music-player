import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

function parseDurationToSeconds(dur: string): number {
  if (!dur) return 210;
  const parts = dur.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 210;
}

function cleanTrackTitleForCatalogue(rawTitle: string, artistName: string): string {
  if (!rawTitle) return '';
  const escaped = artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clean = rawTitle
    .replace(new RegExp(`^${escaped}\\s*[-–—:|]\\s*`, 'i'), '')
    .replace(/\s*[[({][^\])}]*[\])}]/g, ' ')
    .replace(/["“”'‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || rawTitle;
}

function lyrixerApiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (!req.url) return next();
    const parsedUrl = new URL(req.url, 'http://localhost');

    // Endpoint 1: Fetch live official music videos from YouTube
    if (parsedUrl.pathname === '/api/artist-videos') {
      const artist = parsedUrl.searchParams.get('artist') || '';
      if (!artist) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ tracks: [] }));
        return;
      }

      try {
        const query = `${artist} official music video`;
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const ytRes = await fetch(ytUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        const html = await ytRes.text();
        const match =
          html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
          html.match(/ytInitialData\s*=\s*({.+?});/);

        let tracks: any[] = [];
        if (match) {
          const data = JSON.parse(match[1]);
          const contents =
            data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
          const itemSection = contents?.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer;
          const items =
            itemSection?.contents?.filter((c: any) => c.videoRenderer)?.map((c: any) => {
              const v = c.videoRenderer;
              const rawTitle = v.title?.runs?.map((r: any) => r.text).join('') || '';
              const durationFormatted = v.lengthText?.simpleText || '3:30';
              const views = v.viewCountText?.simpleText || '';
              const title = cleanTrackTitleForCatalogue(rawTitle, artist);

              return {
                id: `${artist.toLowerCase().replace(/[^a-z0-9]/g, '')}-${v.videoId}`,
                title: title || rawTitle,
                artist,
                duration: parseDurationToSeconds(durationFormatted),
                durationFormatted,
                videoId: v.videoId,
                isOfficial: true,
                views,
                thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
              };
            }) || [];
          tracks = items;
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ tracks }));
        return;
      } catch (err: any) {
        console.warn('API /api/artist-videos error:', err.message);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ tracks: [], error: err.message }));
        return;
      }
    }

    // Endpoint 2: Fetch high-resolution photo and biography
    if (parsedUrl.pathname === '/api/artist-info') {
      const artist = parsedUrl.searchParams.get('artist') || '';
      if (!artist) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({}));
        return;
      }

      let heroImageUrl = '';
      let bio = '';
      let genre = '';
      let monthlyListeners = '';
      let imageAttribution = 'High-resolution web editorial photograph';

      // 1. Try Deezer API for high-resolution studio photography (1000x1000)
      try {
        const dzRes = await fetch(
          `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}`
        );
        if (dzRes.ok) {
          const dzData: any = await dzRes.json();
          const first = dzData.data?.[0];
          if (first) {
            if (first.picture_xl) {
              heroImageUrl = first.picture_xl;
              imageAttribution = 'Official artist photography via Deezer';
            }
            if (first.nb_fan) {
              monthlyListeners = `${first.nb_fan.toLocaleString()} fans on Deezer`;
            }
          }
        }
      } catch {
        // ignore
      }

      // 2. Query Wikipedia API for biographical extract, high-res originalimage and description
      const queries = [
        artist,
        `${artist} (musician)`,
        `${artist} (singer)`,
        `${artist} (rapper)`,
        `${artist} (band)`,
      ];
      for (const q of queries) {
        try {
          const wRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,
            {
              headers: { 'User-Agent': 'LyriXer/1.0.0 (https://github.com/LyriXer)' },
            }
          );
          if (wRes.ok) {
            const wData: any = await wRes.json();
            if (wData.type !== 'disambiguation') {
              if (!heroImageUrl && wData.originalimage?.source) {
                heroImageUrl = wData.originalimage.source;
                imageAttribution = 'High-resolution photography via Wikimedia Commons';
              }
              if (wData.extract) bio = wData.extract;
              if (wData.description) genre = wData.description;
              break;
            }
          }
        } catch {
          // ignore
        }
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(
        JSON.stringify({
          name: artist,
          heroImageUrl,
          bio,
          genre,
          monthlyListeners,
          imageAttribution,
          youtubeChannelUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(artist + ' official channel')}`,
        })
      );
      return;
    }

    next();
  };

  return {
    name: 'lyrixer-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), lyrixerApiPlugin()],
});
