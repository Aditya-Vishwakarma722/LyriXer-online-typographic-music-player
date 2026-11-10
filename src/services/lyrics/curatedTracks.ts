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
[00:00.00]♪
[00:02.12]To take my love away
[00:05.74]When I come back around, will I know what to say?
[00:10.64]Said you won't forget my name
[00:13.91]Not today, not tomorrow
[00:18.35]Kinda strange, feelin' sorrow
[00:22.68]I got change (yup), you could borrow (borrow)
[00:27.53]When I come back around, will I know what to say?
[00:31.36]Not today, maybe tomorrow
[00:36.05]Open up the door, can you open up the door?
[00:40.19]I know you said before you can't cope with anymore
[00:44.42]You told me it was war, said you'd show me what's in store
[00:48.83]I hope it's not for sure, can you open up the door?
[00:52.97]Did you
[00:57.86]Take
[01:01.65]My love
[01:06.13]Away
[01:10.45]From me?
[01:17.55]Me
[01:22.80]Me
[01:28.66]Saw your seat at the counter when I look away
[01:33.17]Saw you turn around, but it wasn't your face
[01:36.71]Said I need to be alone now, I'm takin' a break
[01:41.08]How come, when I returned, you were gone away?
[01:45.75]I don't, I don't know why I called
[01:52.21]I don't know you at all
[01:56.53]I don't know you
[02:01.21]Not at all
[02:03.07]I don't know, I don't know why I called
[02:09.59]I don't know you at all
[02:14.09]I don't know you
[02:25.09]Did you
[02:28.92]Take my love
[02:33.43]Away
[02:37.68]From me?
[02:44.75]Me
[02:53.64]And that's when you found me
[02:57.40]I was waitin' in the garden
[03:01.59]Contemplatin', beg your pardon
[03:05.72]But there's a part of me that recognizes you
[03:10.08]Do you feel it too?
[03:12.85]When you told me it was serious
[03:17.22]Were you serious? Mm
[03:21.11]They told me they were only curious
[03:25.82]Now it's serious, hm
[03:30.69]Open up the door, can you open up the door?
[03:34.67]I know you said before you can't cope with anymore
[03:39.05]You told me it was war, said you'd show me what's in store
[03:43.44]I hope it's not for sure, can you open up the door?
[04:05.41]Wringing my hands in my lap
[04:09.45]And you tell me it's all been a trap
[04:13.80]And you don't know if you'll make it back
[04:18.18]I said, "No, don't say that"
[04:23.46](Wringing my hands in my lap)
[04:26.78](And you tell me it's all been a trap)
[04:30.94](And you don't know if you'll make it back)
[04:35.48](I said, "No, don't say that")
[04:40.32](Wringing my hands in my lap)
[04:44.75](And you tell me it's all been a trap)
[04:48.96](And you don't know if you'll make it back)
[04:52.51](No, don't say that)
[04:58.86]Hm-hm
`;

const JUICE_WRLD_LEAN_WIT_ME_LRC = `[ti:Lean Wit Me]
[ar:Juice WRLD]
[al:Goodbye & Good Riddance]
[00:11.43]Drugs got me sweatin', but the room gettin' colder
[00:14.48]Lookin' at the devil and the angel on my shoulder
[00:17.55]Will I die tonight? I don't know, is it over?
[00:20.32]Lookin' for my next high, I'm lookin' for closure
[00:23.21]Lean with me, pop with me
[00:26.02]Get high with me if you rock with me
[00:29.09]Smoke with me, drink with me
[00:31.98]Fucked up liver with some bad kidneys
[00:34.85]Lean with me, pop with me
[00:37.84]Get high with me if you rock with me
[00:40.72]Smoke with me, drink with me
[00:43.66]Fucked up liver with some bad kidneys
[00:46.61]Told her if I die, yeah, I'ma die young
[00:49.69]Every day I've been getting fucked up
[00:52.37]Finally know the difference between love and drugs
[00:55.38]Shawty tell me I should really sober up
[00:58.34]This shit ain't fiction, it's too real, too real
[01:01.39]Fuck one dose, I need two pills, two pills
[01:04.13]I'm looking for trouble so I know I'm gonna find it
[01:07.06]Ring, ring, plug hit my phone, perfect timing
[01:10.07]I know I'm not right
[01:12.11]But I'm not wrong, no, I'm not wrong
[01:15.36]Girl, you hate it when I'm too high
[01:17.85]But that's where I belong, where I belong
[01:21.84]Lean with me, pop with me
[01:24.69]Get high with me if you rock with me
[01:27.64]Smoke with me, drink with me
[01:30.69]Fucked up liver with some bad kidneys
[01:33.42]Lean with me, pop with me
[01:36.24]Get high with me if you rock with me
[01:39.28]Smoke with me, drink with me
[01:42.25]Fucked up liver with some bad kidneys
[01:45.03]Eyes red, no Visine
[01:47.73]Crashed the Mustang, no Saleen
[01:50.69]Yeah, I love beans, yeah, I love lean
[01:53.65]I laugh when they ask if my piss clean
[01:56.46]Huh, smoke with me, huh, pop with me, huh
[01:59.78]Ayy, Gucci store, come and shop with me
[02:02.42]If I overdose, bae, are you gon' drop with me?
[02:05.21]I'on even wanna think about that right now
[02:07.81]Let's get too high, reach a new height
[02:11.04]Take the shrooms and the pills at the same time
[02:14.17]Went to Hollywood thrills from the street life
[02:16.92]Took too many drugs, now I don't feel right
[02:20.33]Lean with me, pop with me
[02:23.03]Get high with me if you rock with me
[02:26.11]Smoke with me, drink with me
[02:29.08]Fucked up liver with some bad kidneys
[02:32.02]Lean with me, pop with me
[02:34.83]Get high with me if you rock with me
[02:37.83]Smoke with me, drink with me
[02:40.78]Fucked up liver with some bad kidneys (bad kidneys)
[02:46.35]Oh-oh
[02:49.60]Oh-oh-oh
[02:52.55]Oh-oh-oh
`;

export const CURATED_TRACKS: Record<string, LyricTrack> = {
  yKNxeF4KMsY: parseLrc(COLDPLAY_YELLOW_LRC, 'curated'),
  '5NV6Rdv1a3I': parseLrc(DAFT_PUNK_GET_LUCKY_LRC, 'curated'),
  U3ASj1L6_sY: parseLrc(ADELE_EASY_ON_ME_LRC, 'curated'),
  fJ9rUzIMcZQ: parseLrc(BOHEMIAN_RHAPSODY_LRC, 'curated'),
  iI34LYmJ1Fs: parseLrc(JUICE_WRLD_ROBBERY_LRC, 'curated'),
  i9AHJkHqkpw: parseLrc(JUICE_WRLD_ROBBERY_LRC, 'curated'),
  BY_XwvKogC8: parseLrc(BILLIE_EILISH_CHIHIRO_LRC, 'curated'),
  '5SejM_hBvMM': parseLrc(JUICE_WRLD_LEAN_WIT_ME_LRC, 'curated'),
  yellow: parseLrc(COLDPLAY_YELLOW_LRC, 'curated'),
  getlucky: parseLrc(DAFT_PUNK_GET_LUCKY_LRC, 'curated'),
  easyonme: parseLrc(ADELE_EASY_ON_ME_LRC, 'curated'),
  bohemianrhapsody: parseLrc(BOHEMIAN_RHAPSODY_LRC, 'curated'),
  robbery: parseLrc(JUICE_WRLD_ROBBERY_LRC, 'curated'),
  chihiro: parseLrc(BILLIE_EILISH_CHIHIRO_LRC, 'curated'),
  leanwitme: parseLrc(JUICE_WRLD_LEAN_WIT_ME_LRC, 'curated'),
  'juicewrld-lean-wit-me': parseLrc(JUICE_WRLD_LEAN_WIT_ME_LRC, 'curated'),
};

