const mixtape = [
  {
    id: 'ES01',
    duration: 3487 + 3773,
    sides: {
      A: {
        duration: 3487,
      },
      B: {
        duration: 3773,
      }
    }
  },
  {
    id: 'ES00',
    duration: 2794 + 2470,
    sides: {
      A: {
        duration: 2794,
      },
      B: {
        duration: 2470,
      }
    }
  }
]

const artists = [
  { id: 0, name: "L'efondras", url: 'https://leffondras.bandcamp.com/music', coverId: '0024705317' },
  {
    id: 1,
    name: 'The kundalini genie',
    url: 'https://the-kundalini-genie.bandcamp.com',
    coverId: '0012045550'
  },
  { id: 2, name: 'Fontaines D.C.', url: 'https://fontainesdc.bandcamp.com', coverId: '0027327090' },
  { id: 3, name: 'Fontanarosa', url: 'https://fontanarosa.bandcamp.com', coverId: '0035380235' },
  { id: 4, name: 'Johnny mafia', url: 'https://johnnymafia.bandcamp.com', coverId: '0035009392' },
  { id: 5, name: 'New candys', url: 'https://newcandys.bandcamp.com', coverId: '0039963261' },
  { id: 6, name: 'Magic shoppe', url: 'https://magicshoppe.bandcamp.com', coverId: '0030748374' },
  {
    id: 7,
    name: 'Les jaguars',
    url: 'https://radiomartiko.bandcamp.com/album/surf-qu-b-cois',
    coverId: '0016551336'
  },
  { id: 8, name: 'TRAAMS', url: 'https://traams.bandcamp.com', coverId: '0028348410' },
  { id: 9, name: 'Blue orchid', url: 'https://blue-orchid.bandcamp.com', coverId: '0034796193' },
  { id: 10, name: 'I love UFO', url: 'https://bruitblanc.bandcamp.com', coverId: 'a2203158939' },
  {
    id: 11,
    name: 'Kid Congo & The Pink Monkey Birds',
    url: 'https://kidcongothepinkmonkeybirds.bandcamp.com/',
    coverId: '0017196290'
  },
  { id: 12, name: 'Firefriend', url: 'https://firefriend.bandcamp.com/', coverId: '0031072203' },
  { id: 13, name: 'Squid', url: 'https://squiduk.bandcamp.com/', coverId: '0037649385' },
  { id: 14, name: 'Lysistrata', url: 'https://lysistrata.bandcamp.com/', coverId: '0033900158' },
  {
    id: 15,
    name: 'Pablo X Broadcasting Services',
    url: 'https://pabloxbroadcastingservices.bandcamp.com/',
    coverId: '0036956486'
  },
  { id: 16, name: 'Night Beats', url: 'https://nightbeats.bandcamp.com/', coverId: '0036987720' },
  { id: 17, name: 'Deltron 3030', url: 'https://delthefunkyhomosapien.bandcamp.com/', coverId: '0005254781' },
  {
    id: 18,
    name: 'The Amorphous Androgynous',
    url: 'https://theaa.bandcamp.com/',
    coverId: '0022226700'
  },
  { id: 19, name: 'Wooden Shjips', url: 'https://woodenshjips.bandcamp.com/', coverId: '0012406678' },
  { id: 20, name: 'Silas J. Dirge', url: 'https://silasjdirge.bandcamp.com/', coverId: '0035751570' },
  { id: 21, name: 'Secret Colours', url: 'https://secretcolours.bandcamp.com/', coverId: '0010661379' },
  {
    id: 22,
    name: 'Larry McNeil And The Blue Knights',
    url: 'https://www.discogs.com/artist/6528940-Larry-McNeil-And-The-Blue-Knights',
    coverId:
      'https://i.discogs.com/Yr05_neEXwzPwKlDeV7dimmTG34atkAMgpxbMBhHBkI/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTEyMTEw/ODE1LTE1Mjg1NjU1/NzQtMjcyOC5qcGVn.jpeg'
  },
  {
    id: 23,
    name: 'Hugo Blanco',
    url: 'https://elpalmasmusic.bandcamp.com/album/color-de-tr-pico-compiled-by-el-dr-gon-criollo-el-palmas',
    coverId: '0016886708'
  }
]

const cards = [
  {
    order: 1,
    tapeId: 'ES00',
    side: 'A',
    title: 'The grinding wheel',
    artist: 0,
    start: 0,
    link: 'https://arakirecords.bandcamp.com/track/the-grinding-wheel',
    coverId: 'a3236746052'
  },
  {
    order: 2,
    tapeId: 'ES00',
    side: 'A',
    title: 'Bleach',
    artist: 1,
    start: 392,
    link: 'https://the-kundalini-genie.bandcamp.com/track/bleach-2',
    coverId: 'a1714786533'
  },
  {
    order: 3,
    tapeId: 'ES00',
    side: 'A',
    title: 'Televised mind',
    artist: 2,
    start: 896,
    link: 'https://fontainesdc.bandcamp.com/track/televised-mind',
    coverId: 'a3772806156'
  },
  {
    order: 4,
    tapeId: 'ES00',
    side: 'A',
    title: 'In it',
    artist: 3,
    start: 1139,
    link: 'https://howlinbananarecords.bandcamp.com/track/in-it',
    coverId: 'a1720372066'
  },
  {
    order: 5,
    tapeId: 'ES00',
    side: 'A',
    title: 'Bad michel',
    artist: 4,
    start: 1245,
    link: 'https://johnnymafia.bandcamp.com/track/bad-michel-3',
    coverId: 'a0984622869'
  },
  {
    order: 6,
    tapeId: 'ES00',
    side: 'A',
    title: 'Overall',
    artist: 5,
    start: 1394,
    link: 'https://newcandys.bandcamp.com/track/overall',
    coverId: 'a0559661270'
  },
  {
    order: 7,
    tapeId: 'ES00',
    side: 'A',
    title: 'Blowup',
    artist: 6,
    start: 1674,
    link: 'https://magicshoppe.bandcamp.com/track/blowup',
    coverId: 'a1444895293'
  },
  {
    order: 8,
    tapeId: 'ES00',
    side: 'A',
    title: 'Guitar jet',
    artist: 7,
    start: 1880,
    link: 'https://radiomartiko.bandcamp.com/track/guitare-jet',
    coverId: 'a1494681687'
  },
  {
    order: 9,
    tapeId: 'ES00',
    side: 'A',
    title: 'Intercontinental radio waves',
    artist: 8,
    start: 2024,
    link: 'https://traams.bandcamp.com/track/intercontinental-radio-waves',
    coverId: 'a0046738552'
  },
  {
    order: 10,
    tapeId: 'ES00',
    side: 'A',
    title: 'Here comes the sun',
    artist: 9,
    start: 2211,
    link: 'https://blue-orchid.bandcamp.com/track/here-come-the-sun',
    coverId: 'a4102567047'
  },
  {
    order: 11,
    tapeId: 'ES00',
    side: 'A',
    title: 'Like in the movies',
    artist: 10,
    start: 2560,
    link: 'https://bruitblanc.bandcamp.com/track/like-in-the-movies-2',
    coverId: 'a2203158939'
  },
  {
    order: 1,
    tapeId: 'ES00',
    side: 'B',
    title: "Ce que révèle l'éclipse",
    artist: 0,
    start: 0,
    link: 'https://arakirecords.bandcamp.com/track/ce-que-r-v-le-l-clipse',
    coverId: 'a3236746052'
  },
  {
    order: 2,
    tapeId: 'ES00',
    side: 'B',
    title: "Bleedin' Gums Mushrool",
    artist: 1,
    start: 263,
    link: 'https://the-kundalini-genie.bandcamp.com/track/bleedin-gums-mushroom',
    coverId: 'a1714786533'
  },
  {
    order: 3,
    tapeId: 'ES00',
    side: 'B',
    title: 'A lucid dream',
    artist: 2,
    start: 554,
    link: 'https://fontainesdc.bandcamp.com/track/a-lucid-dream',
    coverId: 'a3772806156'
  },
  {
    order: 4,
    tapeId: 'ES00',
    side: 'B',
    title: 'Lights off',
    artist: 3,
    start: 781,
    link: 'https://howlinbananarecords.bandcamp.com/track/lights-off',
    coverId: 'a1720372066'
  },
  {
    order: 5,
    tapeId: 'ES00',
    side: 'B',
    title: "I'm sentimental",
    artist: 4,
    start: 969,
    link: 'https://johnnymafia.bandcamp.com/track/im-sentimental-2',
    coverId: 'a2333676849'
  },
  {
    order: 6,
    tapeId: 'ES00',
    side: 'B',
    title: 'Thrill or trip',
    artist: 5,
    start: 1128,
    link: 'https://newcandys.bandcamp.com/track/thrill-or-trip',
    coverId: 'a0559661270'
  },
  {
    order: 7,
    tapeId: 'ES00',
    side: 'B',
    title: 'Redhead',
    artist: 6,
    start: 1303,
    link: 'https://magicshoppe.bandcamp.com/track/redhead',
    coverId: 'a0594426943'
  },
  {
    order: 8,
    tapeId: 'ES00',
    side: 'B',
    title: 'Supersonic twist',
    artist: 7,
    start: 1584,
    link: 'https://open.spotify.com/track/66voQIZAJ3zD3Eju2qtNjF',
    coverId: 'a1494681687'
  },
  {
    order: 9,
    tapeId: 'ES00',
    side: 'B',
    title: 'Flowers',
    artist: 8,
    start: 1749,
    link: 'https://traams.bandcamp.com/track/flowers',
    coverId: 'a3644668199'
  },
  {
    order: 10,
    tapeId: 'ES00',
    side: 'B',
    title: 'The shade',
    artist: 9,
    start: 1924,
    link: 'https://blue-orchid.bandcamp.com/track/the-shade',
    coverId: 'a0804204790'
  },
  {
    order: 11,
    tapeId: 'ES00',
    side: 'B',
    title: 'Like in the movies',
    artist: 10,
    start: 2186,
    link: 'https://bruitblanc.bandcamp.com/track/like-in-the-movies',
    coverId: 'a3647322740'
  },
  {
    order: 1,
    tapeId: 'ES01',
    side: 'A',
    title: 'He Walked In',
    artist: 11,
    start: 0,
    link: 'https://kidcongothepinkmonkeybirds.bandcamp.com/track/he-walked-in',
    coverId: 'a0336300523'
  },
  {
    order: 2,
    tapeId: 'ES01',
    side: 'A',
    title: 'The Third Wave',
    artist: 12,
    start: 841,
    link: 'https://firefriend.bandcamp.com/track/the-third-wave',
    coverId: 'a2803689859'
  },
  {
    order: 3,
    tapeId: 'ES01',
    side: 'A',
    title: 'Broadcaster',
    artist: 13,
    start: 1104.5,
    link: 'https://squiduk.bandcamp.com/track/broadcaster',
    coverId: 'a3391719769'
  },
  {
    order: 4,
    tapeId: 'ES01',
    side: 'A',
    title: 'Mourn',
    artist: 14,
    start: 1441,
    link: 'https://lysistrata.bandcamp.com/track/mourn-2',
    coverId: 'a0872900041'
  },
  {
    order: 5,
    tapeId: 'ES01',
    side: 'A',
    title: 'Let it Blow',
    artist: 15,
    start: 1844.8,
    link: 'https://pabloxbroadcastingservices.bandcamp.com/track/let-it-blow',
    coverId: 'a4000148031'
  },
  {
    order: 6,
    tapeId: 'ES01',
    side: 'A',
    title: 'Sunday Mourning',
    artist: 16,
    start: 2091.7,
    link: 'https://nightbeats.bandcamp.com/track/sunday-mourning',
    coverId: 'a0031987121'
  },
  {
    order: 7,
    tapeId: 'ES01',
    side: 'A',
    title: '3030 Instrumental',
    artist: 17,
    start: 2339.3,
    link: 'https://delthefunkyhomosapien.bandcamp.com/track/3030',
    coverId: 'a1948146136'
  },
  {
    order: 8,
    tapeId: 'ES01',
    side: 'A',
    title: 'Immortality Break',
    artist: 18,
    start: 2530.5,
    link: 'https://theaa.bandcamp.com/track/immortality-break',
    coverId: 'a2749250329'
  },
  {
    order: 9,
    tapeId: 'ES01',
    side: 'A',
    title: 'Lazy Bones',
    artist: 19,
    start: 2718,
    link: 'https://woodenshjips.bandcamp.com/track/lazy-bones',
    coverId: 'a1884221104'
  },
  {
    order: 10,
    tapeId: 'ES01',
    side: 'A',
    title: 'On the Train of Aches',
    artist: 20,
    start: 2948,
    link: 'https://silasjdirge.bandcamp.com/track/on-the-train-of-aches',
    coverId: 'a1124177379'
  },
  {
    order: 11,
    tapeId: 'ES01',
    side: 'A',
    title: 'Me',
    artist: 21,
    start: 3265,
    link: 'https://secretcolours.bandcamp.com/track/me',
    coverId: 'a1497022499'
  },
  {
    order: 1,
    tapeId: 'ES01',
    side: 'B',
    title: 'Lady Hawke Blues',
    artist: 11,
    start: 0,
    link: 'https://kidcongothepinkmonkeybirds.bandcamp.com/track/lady-hawke-blues',
    coverId: 'a2532623230'
  },
  {
    order: 2,
    tapeId: 'ES01',
    side: 'B',
    title: 'Dreamscapes',
    artist: 12,
    start: 235,
    link: 'https://littlecloudrecords.bandcamp.com/track/dreamscapes',
    coverId: 'a3498981203'
  },
  {
    order: 3,
    tapeId: 'ES01',
    side: 'B',
    title: 'Crispy Skin',
    artist: 13,
    start: 644.2,
    link: 'https://squiduk.bandcamp.com/track/crispy-skin-2',
    coverId: 'a2516727021'
  },
  {
    order: 4,
    tapeId: 'ES01',
    side: 'B',
    title: 'The Boy Who Stood Above The Earth',
    artist: 14,
    start: 1018,
    link: 'https://lysistrata.bandcamp.com/track/the-boy-who-stood-above-the-earth-2',
    coverId: 'a0350933426'
  },
  {
    order: 5,
    tapeId: 'ES01',
    side: 'B',
    title: 'Better Off Alone',
    artist: 15,
    start: 1698,
    link: 'https://pabloxbroadcastingservices.bandcamp.com/track/better-off-alone',
    coverId: 'a4000148031'
  },
  {
    order: 6,
    tapeId: 'ES01',
    side: 'B',
    title: 'Celebration #1',
    artist: 16,
    start: 2235,
    link: 'https://nightbeats.bandcamp.com/track/celebration-1',
    coverId: 'a0031987121'
  },
  {
    order: 7,
    tapeId: 'ES01',
    side: 'B',
    title: '3030 Instrumental',
    artist: 17,
    start: 2458.3,
    link: 'https://delthefunkyhomosapien.bandcamp.com/track/3030',
    coverId: 'a1948146136'
  },
  {
    order: 8,
    tapeId: 'ES01',
    side: 'B',
    title: 'The Emptiness Of Nothingness',
    artist: 18,
    start: 2864.5,
    link: 'https://theaa.bandcamp.com/track/the-emptiness-of-nothingness',
    coverId: 'a1053923875'
  },
  {
    order: 9,
    tapeId: 'ES01',
    side: 'B',
    title: 'Rising',
    artist: 19,
    start: 3145,
    link: 'https://woodenshjips.bandcamp.com/track/rising',
    coverId: 'a1884221104'
  },
  {
    order: 10,
    tapeId: 'ES01',
    side: 'B',
    title: 'The Last Time',
    artist: 22,
    start: 3447,
    link: 'https://www.discogs.com/release/12110815-Larry-McNeil-And-The-Blue-Knights-Jealous-Woman',
    coverId:
      'https://i.discogs.com/Yr05_neEXwzPwKlDeV7dimmTG34atkAMgpxbMBhHBkI/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTEyMTEw/ODE1LTE1Mjg1NjU1/NzQtMjcyOC5qcGVn.jpeg'
  },
  {
    order: 11,
    tapeId: 'ES01',
    side: 'B',
    title: 'Guajira Con Arpa',
    artist: 23,
    start: 3586,
    link: 'https://elpalmasmusic.bandcamp.com/track/guajira-con-arpa',
    coverId: 'a3463036407'
  }
]
