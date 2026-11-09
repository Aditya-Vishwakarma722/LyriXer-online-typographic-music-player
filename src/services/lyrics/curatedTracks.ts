import { parseLrc, type LyricTrack } from './lrcParser';

const COLDPLAY_YELLOW_LRC = `[ti:Yellow]
[ar:Coldplay]
[al:Parachutes]
[00:00.00]♪
[00:15.50]Look at the stars
[00:18.00]Look how they shine for you
[00:23.20]And everything you do
[00:27.50]Yeah, they were all yellow
[00:33.00]I came along
[00:36.50]I wrote a song for you
[00:41.20]And all the things you do
[00:45.00]And it was called "Yellow"
[00:51.00]So then I took my turn
[00:54.80]Oh, what a thing to have done
[01:00.00]And it was all yellow
[01:08.50]Your skin, oh yeah, your skin and bones
[01:14.20]Turn into something beautiful
[01:21.00]And you know, you know I love you so
[01:30.00]You know I love you so
[01:35.00]♪
[01:46.00]I swam across
[01:49.00]I jumped across for you
[01:54.00]Oh, what a thing to do
[01:58.00]'Cause you were all yellow
[02:04.00]I drew a line
[02:07.50]I drew a line for you
[02:12.50]Oh, what a thing to do
[02:16.80]And it was all yellow
[02:24.00]Your skin, oh yeah, your skin and bones
[02:29.50]Turn into something beautiful
[02:37.00]And you know, for you I'd bleed myself dry
[02:46.00]For you I'd bleed myself dry
[02:53.00]♪
[03:25.00]It's true
[03:28.00]Look how they shine for you
[03:33.50]Look how they shine for you
[03:38.00]Look how they shine for
[03:43.00]Look how they shine for you
[03:47.50]Look how they shine for you
[03:52.00]Look how they shine
[03:57.00]Look at the stars
[04:00.00]Look how they shine for you
[04:05.50]And all the things that you do
`;

const DAFT_PUNK_GET_LUCKY_LRC = `[ti:Get Lucky]
[ar:Daft Punk ft. Pharrell Williams]
[00:00.00]♪
[00:15.00]Like the legend of the phoenix
[00:19.00]All ends with beginnings
[00:23.00]What keeps the planet spinning
[00:27.00]The force from the beginning
[00:30.00]We've come too far to give up who we are
[00:37.50]So let's raise the bar and our cups to the stars
[00:45.00]She's up all night 'til the sun
[00:47.00]I'm up all night to get some
[00:49.00]She's up all night for good fun
[00:51.00]I'm up all night to get lucky
[00:53.00]We're up all night 'til the sun
[00:55.00]We're up all night to get some
[00:57.00]We're up all night for good fun
[00:59.00]We're up all night to get lucky
[01:01.00]We're up all night to get lucky
[01:05.00]We're up all night to get lucky
[01:09.00]We're up all night to get lucky
[01:13.00]We're up all night to get lucky
[01:16.00]The present has no ribbon
[01:20.00]Your gift keeps on giving
[01:24.00]What is this I'm feeling?
[01:28.00]If you wanna leave, I'm with it
[01:31.00]We've come too far to give up who we are
[01:38.00]So let's raise the bar and our cups to the stars
[01:46.00]She's up all night 'til the sun
[01:48.00]I'm up all night to get some
[01:50.00]She's up all night for good fun
[01:52.00]I'm up all night to get lucky
`;

const ADELE_EASY_ON_ME_LRC = `[ti:Easy On Me]
[ar:Adele]
[00:00.00]♪
[00:15.00]There ain't no gold in this river
[00:22.00]That I've been washin' my hands in forever
[00:29.00]I know there is hope in these waters
[00:37.00]But I can't bring myself to swim
[00:40.00]When I am drowning in this silence
[00:44.00]Baby, let me in
[00:48.00]Go easy on me, baby
[00:56.00]I was still a child
[01:00.00]Didn't get the chance to
[01:04.00]Feel the world around me
[01:08.00]I had no time to choose what I chose to do
[01:14.00]So go easy on me
`;

const BOHEMIAN_RHAPSODY_LRC = `[ti:Bohemian Rhapsody]
[ar:Queen]
[00:00.00]Is this the real life?
[00:04.00]Is this just fantasy?
[00:08.50]Caught in a landslide, no escape from reality
[00:17.00]Open your eyes, look up to the skies and see
[00:28.00]I'm just a poor boy, I need no sympathy
[00:35.00]'Cause I'm easy come, easy go, little high, little low
[00:44.00]Any way the wind blows doesn't really matter to me, to me
[00:55.00]Mama, just killed a man
[01:02.00]Put a gun against his head, pulled my trigger, now he's dead
[01:12.00]Mama, life had just begun
[01:19.00]But now I've gone and thrown it all away
[01:27.00]Mama, ooh, didn't mean to make you cry
[01:36.00]If I'm not back again this time tomorrow
[01:41.00]Carry on, carry on as if nothing really matters
`;

export const CURATED_TRACKS: Record<string, LyricTrack> = {
  yKNxeF4KMsY: parseLrc(COLDPLAY_YELLOW_LRC, 'curated'),
  '5NV6Rdv1a3I': parseLrc(DAFT_PUNK_GET_LUCKY_LRC, 'curated'),
  U3ASj1L6_sY: parseLrc(ADELE_EASY_ON_ME_LRC, 'curated'),
  fJ9rUzIMcZQ: parseLrc(BOHEMIAN_RHAPSODY_LRC, 'curated'),
  yellow: parseLrc(COLDPLAY_YELLOW_LRC, 'curated'),
  getlucky: parseLrc(DAFT_PUNK_GET_LUCKY_LRC, 'curated'),
  easyonme: parseLrc(ADELE_EASY_ON_ME_LRC, 'curated'),
  bohemianrhapsody: parseLrc(BOHEMIAN_RHAPSODY_LRC, 'curated'),
};

