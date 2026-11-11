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

const artistVideosCache = new Map<string, any[]>();

function extractFeaturedArtist(rawTitle: string): string | undefined {
  const match = rawTitle.match(/(?:feat\.?|ft\.?|featuring|with)\s+([^()[\]]+?)(?=[)\]]|$)/i);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

function determineTrackType(rawTitle: string, featuredArtist?: string): 'video' | 'collab' | 'audio' {
  if (featuredArtist || /(?:\bfeat\b|\bft\b|\bwith\b|&)/i.test(rawTitle)) {
    return 'collab';
  }
  if (/(?:official\s*(?:music\s*)?video|\bmusic\s*video\b|\bmv\b)/i.test(rawTitle)) {
    return 'video';
  }
  return 'audio';
}

function cleanTrackTitleForCatalogue(rawTitle: string, artistName: string): string {
  if (!rawTitle) return '';
  const escaped = artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clean = rawTitle
    .replace(new RegExp(`^${escaped}\\s*[-–—:|]\\s*`, 'i'), '')
    .replace(/\((?:Official\s*(?:Music\s*)?(?:Video|Audio|Visualizer|Lyric Video)|Visualizer|Audio|Lyric Video|Lyrics?)\)/gi, '')
    .replace(/\[(?:Official\s*(?:Music\s*)?(?:Video|Audio|Visualizer|Lyric Video)|Visualizer|Audio|Lyric Video|Lyrics?)\]/gi, '')
    .replace(/["“”'‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || rawTitle;
}

function lyrixerApiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (!req.url) return next();
    const parsedUrl = new URL(req.url, 'http://localhost');

    // Endpoint 1: Fetch live official music videos, collabs, and album audios from YouTube
    if (parsedUrl.pathname === '/api/artist-videos') {
      const artist = parsedUrl.searchParams.get('artist') || '';
      if (!artist) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ tracks: [] }));
        return;
      }

      const cacheKey = artist.toLowerCase().trim();
      if (artistVideosCache.has(cacheKey)) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ tracks: artistVideosCache.get(cacheKey) }));
        return;
      }

      try {
        const queries = [
          `${artist} official music video`,
          `${artist} official audio album`,
          `${artist} ft feat`,
          `${artist} songs`,
        ];

        const searchPromises = queries.map(async (query) => {
          try {
            const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            const ytRes = await fetch(ytUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
              },
            });
            if (!ytRes.ok) return [];
            const html = await ytRes.text();
            const match =
              html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
              html.match(/ytInitialData\s*=\s*({.+?});/);
            if (!match) return [];
            const data = JSON.parse(match[1]);
            const contents =
              data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
            const itemSection = contents?.find((c: any) => c.itemSectionRenderer)?.itemSectionRenderer;
            return itemSection?.contents?.filter((c: any) => c.videoRenderer)?.map((c: any) => c.videoRenderer) || [];
          } catch {
            return [];
          }
        });

        const results = await Promise.allSettled(searchPromises);
        const seenIds = new Set<string>();
        const seenTitles = new Set<string>();
        const allTracks: any[] = [];

        for (const resItem of results) {
          if (resItem.status !== 'fulfilled' || !Array.isArray(resItem.value)) continue;
          for (const v of resItem.value) {
            if (!v.videoId || seenIds.has(v.videoId)) continue;
            const rawTitle = v.title?.runs?.map((r: any) => r.text).join('') || '';
            const durationFormatted = v.lengthText?.simpleText || '3:30';
            const sec = parseDurationToSeconds(durationFormatted);

            // Filter out compilation DJ mixes / playlists or short clips
            if (sec < 45 || sec > 660) continue;
            if (/compilation|full album|mix 20|dj mix|top songs 20|playlist|discography/i.test(rawTitle)) continue;

            const featured = extractFeaturedArtist(rawTitle);
            const title = cleanTrackTitleForCatalogue(rawTitle, artist);
            const titleKey = title.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (titleKey.length > 2 && seenTitles.has(titleKey)) continue;

            seenIds.add(v.videoId);
            if (titleKey.length > 2) seenTitles.add(titleKey);

            const trackType = determineTrackType(rawTitle, featured);
            const views = v.viewCountText?.simpleText || '';

            allTracks.push({
              id: `${artist.toLowerCase().replace(/[^a-z0-9]/g, '')}-${v.videoId}`,
              title: title || rawTitle,
              artist,
              featuredArtist: featured,
              duration: sec,
              durationFormatted,
              videoId: v.videoId,
              isOfficial: true,
              trackType,
              views,
              thumbnailUrl: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            });
          }
        }

        // Cache results for fast subsequent response
        artistVideosCache.set(cacheKey, allTracks);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ tracks: allTracks }));
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

      // 1. Check curated high-fidelity verified master images
      const cleanArtistKey = artist.toLowerCase().replace(/[^a-z0-9]/g, '');
      const CURATED_IMAGES: Record<string, { image: string; attr: string }> = {
        juicewrld: { image: '/artists/juicewrld.jpg', attr: 'Official studio master portrait' },
        theweeknd: { image: '/artists/theweeknd.jpg', attr: 'Official studio master portrait' },
        coldplay: { image: '/artists/coldplay.jpg', attr: 'Official studio master band portrait' },
        daftpunk: { image: '/artists/daftpunk.jpg', attr: 'Official studio portrait' },
        queen: { image: '/artists/queen.jpg', attr: 'Elektra Records 1975 publicity master portrait' },
        adele: { image: '/artists/adele.jpg', attr: 'Live vocal performance portrait (2016)' },
        billieeilish: { image: '/artists/billieeilish.jpg', attr: 'Hit Me Hard and Soft studio master (2024)' },
        eminem: { image: '/artists/eminem.jpg', attr: 'Studio master portrait' },
        drake: { image: '/artists/drake.jpg', attr: 'Official press portrait' },
      };

      if (CURATED_IMAGES[cleanArtistKey]) {
        heroImageUrl = CURATED_IMAGES[cleanArtistKey].image;
        imageAttribution = CURATED_IMAGES[cleanArtistKey].attr;
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

      // 3. Try Deezer API for listeners and verified matching photography if not yet resolved
      try {
        const dzRes = await fetch(
          `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist)}`
        );
        if (dzRes.ok) {
          const dzData: any = await dzRes.json();
          // Find close matching artist (avoid wrong artist names e.g. "OLOLO QUEEN" for Queen)
          const exactMatch = dzData.data?.find((d: any) =>
            d.name.toLowerCase() === artist.toLowerCase().trim() ||
            d.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanArtistKey
          );
          const selected = exactMatch || dzData.data?.[0];
          if (selected) {
            if (!heroImageUrl) {
              const rawPic = selected.picture_xl || selected.picture_big;
              if (rawPic) {
                heroImageUrl = rawPic.replace(/\/\d+x\d+-[^/]+\.jpg$/, '/1920x1920-000000-100-0-0.jpg');
                imageAttribution = 'Official studio photography via Deezer Master';
              }
            }
            if (selected.nb_fan) {
              monthlyListeners = `${selected.nb_fan.toLocaleString()} fans on Deezer`;
            }
          }
        }
      } catch {
        // ignore
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
