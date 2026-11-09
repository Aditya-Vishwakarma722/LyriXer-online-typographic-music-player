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

const JUICE_WRLD_ROBBERY_LRC = `[ti:Robbery]
[ar:Juice WRLD]
[al:Death Race for Love]
[00:00.00]♪
[00:04.80]Man, what?
[00:07.40]This shit funny
[00:10.50]I was like, ooh, this Hennessy strong as fuck, boy
[00:15.00]She told me put my heart in the bag
[00:18.80]And nobody gets hurt
[00:21.20]Now I'm running from her love, I'm not fast
[00:24.80]So I'm making it worse
[00:27.00]Now I'm digging up a grave from my past
[00:30.80]I'm a whole different person
[00:33.80]It's a gift and a curse
[00:36.20]But I cannot reverse it
[00:40.40]I can't reverse it
[00:44.20]It was a gift and a curse
[00:45.80]And now I'm drinking too much
[00:47.40]So I'ma talk with a slur
[00:49.00]Last time I saw you it ended in a blur
[00:53.60]I woke up in a hearse
[00:56.80]You said you love me first
[00:59.00]One thing my dad told me was
[01:01.60]"Never let your woman know when you're insecure"
[01:05.40]So I put Gucci on the fur
[01:08.20]And I put my wrist on iceberg
[01:10.40]One thing my heart tells me is
[01:13.60]"Flex on a hoe every time you're insecure"
[01:16.40]I guess you came through
[01:18.40]I'm running from you
[01:21.60]Is your love for real?
[01:24.20]Is your love really true?
[01:35.00]She told me put my heart in the bag
[01:38.80]And nobody gets hurt
[01:41.20]Now I'm running from her love, I'm not fast
[01:44.80]So I'm making it worse
[01:47.00]Now I'm digging up a grave from my past
[01:50.80]I'm a whole different person
[01:53.80]It's a gift and a curse
[01:56.20]But I cannot reverse it
[02:04.80]You gave me the run around
[02:06.40]I really hate the run around
[02:07.80]You really got me paranoid
[02:09.20]I always keep a gun around
[02:10.80]You always give me butterflies
[02:12.80]When you come around
[02:14.40]When you come around
[02:15.80]When you come around
[02:17.80]You let me know love is not the answer
[02:20.60]Not the answer, not the answer
[02:23.80]I love to do drugs so mind my manners
[02:26.60]I get high when you don't decide to answer
[02:29.80]Phone home, I need to phone home
[02:35.00]I'm throwing rocks at your window
[02:38.20]I need to go home
[02:41.00]I don't wanna leave
[02:44.00]This is heartbreak, oh
[02:47.00]I breakup with you, then you breakup with me
[02:50.00]And it's an ongoing cycle, can't nobody stop it, you see?
[02:54.00]She told me put my heart in the bag
[02:57.80]And nobody gets hurt
[03:00.20]Now I'm running from her love, I'm not fast
[03:03.80]So I'm making it worse
[03:06.00]Now I'm digging up a grave from my past
[03:09.80]I'm a whole different person
[03:12.80]It's a gift and a curse
[03:15.20]But I cannot reverse it
[03:19.40]I can't reverse it
[03:22.00]It was a gift and a curse
[03:26.00]I can't reverse it
`;

const BILLIE_EILISH_CHIHIRO_LRC = `[ti:CHIHIRO]
[ar:Billie Eilish]
[al:HIT ME HARD AND SOFT]
[00:00.00]♪ (Hallway Intro)
[00:21.00]♪ (Music Begins)
[00:23.12]To take my love away
[00:26.73]When I come back around, will I know what to say?
[00:31.68]Said you won't forget my name
[00:34.93]Not today, not tomorrow
[00:39.10]Kind of strange, feelin' sorrow
[00:43.72]I got change (yup), you could borrow (borrow)
[00:48.53]When I come back around, will I know what to say?
[00:52.48]Not today, maybe tomorrow
[00:57.17]Open up the door, can you open up the door?
[01:01.05]I know you said before you can't cope with anymore
[01:05.49]You told me it was war, said you'd show me what's in store
[01:09.83]I hope it's not for sure, can you open up the door?
[01:13.97]Did you
[01:18.86]Take
[01:22.65]My love
[01:27.13]Away
[01:31.45]From me?
[01:38.55]Me
[01:43.80]Me
[01:49.66]Saw your seat at the counter when I look away
[01:54.17]Saw you turn around, but it wasn't your face
[01:57.71]Said I need to be alone now, I'm takin' a break
[02:02.08]How come, when I returned, you were gone away?
[02:06.75]I don't, I don't know why I called
[02:13.21]I don't know you at all
[02:17.53]I don't know you
[02:22.21]Not at all
[02:24.07]I don't know, I don't know why I called
[02:30.59]I don't know you at all
[02:35.09]I don't know you
[02:46.09]Did you
[02:49.92]Take my love
[02:54.43]Away
[02:58.68]From me?
[03:05.75]Me
[03:14.64]And that's when you found me
[03:18.40]I was waitin' in the garden
[03:22.59]Contemplatin', beg your pardon
[03:26.72]But there's a part of me that recognizes you
[03:31.08]Do you feel it too?
[03:33.85]When you told me it was serious
[03:38.22]Were you serious? Mm
[03:42.11]They told me they were only curious
[03:46.82]Now it's serious, hm
[03:51.69]Open up the door, can you open up the door?
[03:55.67]I know you said before you can't cope with anymore
[04:00.05]You told me it was war, said you'd show me what's in store
[04:04.44]I hope it's not for sure, can you open up the door?
[04:26.41]Wringing my hands in my lap
[04:30.45]And you tell me it's all been a trap
[04:34.80]And you don't know if you'll make it back
[04:39.18]I said, "No, don't say that"
[04:44.46](Wringing my hands in my lap)
[04:47.78](And you tell me it's all been a trap)
[04:51.94](And you don't know if you'll make it back)
[04:56.48](I said, "No, don't say that")
[05:01.32](Wringing my hands in my lap)
[05:05.75](And you tell me it's all been a trap)
[05:09.96](And you don't know if you'll make it back)
[05:13.51](No, don't say that)
[05:19.86]Hm-hm
`;

export const CURATED_TRACKS: Record<string, LyricTrack> = {
  yKNxeF4KMsY: parseLrc(COLDPLAY_YELLOW_LRC, 'curated'),
  '5NV6Rdv1a3I': parseLrc(DAFT_PUNK_GET_LUCKY_LRC, 'curated'),
  U3ASj1L6_sY: parseLrc(ADELE_EASY_ON_ME_LRC, 'curated'),
  fJ9rUzIMcZQ: parseLrc(BOHEMIAN_RHAPSODY_LRC, 'curated'),
  iI34LYmJ1Fs: parseLrc(JUICE_WRLD_ROBBERY_LRC, 'curated'),
  i9AHJkHqkpw: parseLrc(JUICE_WRLD_ROBBERY_LRC, 'curated'),
  BY_XwvKogC8: parseLrc(BILLIE_EILISH_CHIHIRO_LRC, 'curated'),
  yellow: parseLrc(COLDPLAY_YELLOW_LRC, 'curated'),
  getlucky: parseLrc(DAFT_PUNK_GET_LUCKY_LRC, 'curated'),
  easyonme: parseLrc(ADELE_EASY_ON_ME_LRC, 'curated'),
  bohemianrhapsody: parseLrc(BOHEMIAN_RHAPSODY_LRC, 'curated'),
  robbery: parseLrc(JUICE_WRLD_ROBBERY_LRC, 'curated'),
  chihiro: parseLrc(BILLIE_EILISH_CHIHIRO_LRC, 'curated'),
};

