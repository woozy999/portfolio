/* Project data — the only content you normally need to edit. */
'use strict';

/* ================================================================
   2. YOUR PROJECTS
   ================================================================ */
const projects = [
  { code:'A1', active:true, accent:'#C99A3F',
    track:'Churn in a Minor Key',
    real:'Customer Retention Analysis',
    short:'Found the behavioral signals that predicted churn 30 days out.',
    problem:'Replace this with the actual business problem — who was hurting, what decision was blocked, and why nobody could answer it before you.',
    approach:['The data you pulled and joined','The analysis method you used and why','How you validated it','How you delivered it'],
    result:'Replace with the outcome. Use a real number if you have one.',
    tags:['SQL','Python','Tableau'], link:'#' },
  { code:'A2', active:true, accent:'#2C6570',
    track:'Live from the Dashboard',
    real:'Executive KPI Dashboard',
    short:'Replaced a manual weekly deck with a self-serve dashboard.',
    problem:'Replace with the real problem this project solved.',
    approach:['What you built and what data it sits on','A decision you made about scope or metric definitions','How you got people to actually adopt it'],
    result:'Replace with the measurable outcome.',
    tags:['Power BI','SQL','Excel'], link:'#' },
  { code:'A3', active:true, accent:'#7C2B31',
    track:'Automate the Refrain',
    real:'Reporting Pipeline Automation',
    short:'Turned a recurring manual report into a scheduled script.',
    problem:'Replace with the real problem.',
    approach:['What the manual process looked like before','What you automated and how','What checks you built in so it fails loudly'],
    result:'Replace with hours saved per month or errors eliminated.',
    tags:['Python','pandas','SQL'], link:'#' },
  { code:'A4', active:true, accent:'#C99A3F',
    track:'B-Side Experiment',
    real:'A/B Test Analysis',
    short:'Designed and read out a test that settled a long-running debate.',
    problem:'Replace with the real problem.',
    approach:['How the test was set up and what you measured','How you handled sample size and significance','What you recommended and why'],
    result:'Replace with what the business did as a result.',
    tags:['Python','Statistics','SQL'], link:'#' },
  { code:'B1', active:false, accent:'#2C6570' },
  { code:'B2', active:false, accent:'#7C2B31' },
  { code:'B3', active:false, accent:'#C99A3F' },
  { code:'B4', active:false, accent:'#2C6570' },
  { code:'C1', active:false, accent:'#7C2B31' },
  { code:'C2', active:false, accent:'#C99A3F' },
  { code:'C3', active:false, accent:'#2C6570' },
  { code:'C4', active:false, accent:'#7C2B31' },
  { code:'D1', active:false, accent:'#C99A3F' },
  { code:'D2', active:false, accent:'#2C6570' },
  { code:'D3', active:false, accent:'#7C2B31' },
  { code:'D4', active:false, accent:'#C99A3F' },
];

/* ================================================================
   3. YOUR CRATE — what's on rotation.

   The genre buttons above the crate are built from CRATE_GENRES.
   Only five tracks show at a time; the shuffle button pulls a
   different five from whichever genre is selected, and the page
   also picks a fresh set on every load. So the more tracks you add
   here, the more of your taste a visitor sees.

   id     : Spotify track ID. In Spotify: right-click a song →
            Share → Copy Song Link, then take the chunk between
            /track/ and the ?  For example:
            https://open.spotify.com/track/4HOkHyl6W2Hp3IQFWCT17Q?si=...
                                           ^^^^^^^^^^^^^^^^^^^^^^
   title  : song name
   artist : artist name
   genre  : must match a key in CRATE_GENRES below
            ('electronic', 'rnb', 'rap', 'jazz')
   note   : OPTIONAL small label on the right. Leave it off and the
            genre name shows instead — handy once you have a lot of
            tracks and don't want to label every one.
   art    : OPTIONAL cover image URL. Leave it off and the page tries
            to fetch it from Spotify; if that fails you get a vinyl
            placeholder. Rows with a blank id still display, they
            just aren't clickable.
   ================================================================ */

/* How many tracks show at once. Raise it if you want a longer crate. */
const CRATE_DISPLAY_COUNT = 5;

/* The filter buttons, in the order they appear. 'all' must stay first. */
const CRATE_GENRES = [
  { key:'all',        label:'All' },
  { key:'electronic', label:'Electronic' },
  { key:'rnb',        label:'R&B' },
  { key:'rap',        label:'Rap' },
  { key:'jazz',       label:'Jazz' },
];

const crate = [
  /* ---- rap ---- */
  { id:'67UpJLYBsYEAbe0Mm1xRf8', title:'Like It Like That', artist:'A Tribe Called Quest', genre:'rap', note:'On repeat', featured: true },
  { id:'1LmSsL6GfYy8sANI82h5Li', title:'Gorilla Pimp', artist:'Project Pat, Namond Lumpkin', genre:'rap', note:'Best live show'},
  { id:'6CYy6bt2Iq1kiDIgEBgqTn', title:'Number One', artist:'Pharrell Williams, Kanye West', genre:'rap', note:'Classic' },
  { id:'2hyyA7U1m1pFlZcEyl91jH', title:'Pitch In OnA Party', artist:'DJ Quik', genre:'rap', note:'All-time favorite' },
  { id:'0evVIHGlp94jOUMvoQZRVD', title:'Twist My Fingaz', artist:'YG', genre:'rap', note:'On repeat' },
  { id:'21GzqgubvWR6Iks9IbDmJE', title:'Just Another Day', artist:'Too $hort', genre:'rap', note:'Throwback' },
  { id:'2DhL7DtMmxmqrCUB2NAlLm', title:'Tha Shiznit', artist:'Snoop Dogg', genre:'rap', note:'Favorite' },
  { id:'2uqqFpPwOF5uYYoa4k8c6I', title:'Planned Attack', artist:'Quasimoto, Madlib', genre:'rap', note:'Acquired Taste' },
  { id:'6r98gO9UiGvhFy5xhM4pC3', title:'C12H16N2', artist:'Action Bronson', genre:'rap', note:'Acquired Taste' },
  { id:'6bj42Hzr3RErxhfgSTdSx6', title:'Terry', artist:'Action Bronson', genre:'rap', note:'Classic' },
  { id:'1CEVg3GpmapQ5rK5feHbFc', title:'Dmitri', artist:'Action Bronson', genre:'rap', note:'All-time favorite' },
  { id:'4z6S07pYjpakUlmlCjsVnM', title:'CONDOR', artist:'Action Bronson', genre:'rap', note:'Personal Favorite' },
  { id:'4zvxkRgrhGdkTVnA5vFOhP', title:'Live from the Moon', artist:'Action Bronson, Yung Mehico', genre:'rap', note:'Personal Favorite' },
  { id:'795N8hLFGjCcFSHqcJrNzD', title:'WORTHLESS', artist:'Maxo Kream', genre:'rap', note:'Hidden Gem' },
  { id:'5mexbTuWx9d8DPZk4sDGF4', title:'BLACK BALLOONS', artist:'Denzel Curry', genre:'rap', note:'Personal Favorite' },
  { id:'4hgS8ANdhHy2G7XtyVqLDw', title:'Pyro (leak 2019)', artist:'Denzel Curry', genre:'rap', note:'Hidden Gem' },
  { id:'2WyLyygONxNBVtXCRLMjFY', title:'Breakadawn', artist:'De La Soul', genre:'rap', note:'Classic' },
  { id:'3lGBvPUgO7MJltUnBlOpe9', title:'Mass Appeal', artist:'Gang Starr', genre:'rap', note:'Classic' },
  { id:'15NQ3x1f2GUhqs8oBXhTqp', title:'Scottie Beam', artist:'Freddie Gibbs, The Alchemist, Rick Ross', genre:'rap', note:'New classic' },
  { id:'2sLTyF6TEFsURJvMudHAlL', title:'ON THE RADAR CONCRETE CYPHER', artist:'Concrete Boys', genre:'rap', note:'Hidden gem' },
  { id:'0xta6Gah3inmeHbj0e3F9a', title:'Headshots', artist:'Isaiah Rashad', genre:'rap', note:'Comfort song' },

  /* ---- r&b ---- */
  { id:'71EHOyEOhNx1SzTebRRyng', title:'Weak', artist:'SWV', genre:'rnb', note:'All-time favorite', featured: true },
  { id:'5HGz5SwHOkfzZhG5ZGvPGS', title:'Slow and Easy', artist:'Zapp', genre:'rnb', note:'Comfort listen' },
  { id:'3NJSOmvPLC2s32iyhVr9JW', title:'Time & Place', artist:'Jodeci', genre:'rnb', note:'Classic' },
  { id:'3ApIYu95WxjzpQCnsLBbrv', title:'Between the Sheets', artist:'The Isley Brothers', genre:'rnb', note:'All-time favorite' },
  { id:'2uppNqP2hwQExNMXZTn27b', title:'Heartbeat', artist:'Dazz Band', genre:'rnb', note:'Comfort listen', featured: true },
  { id:'0NdxbFFknA7kQ4E2zvJfey', title:'Let\'s Get Blown', artist:'Snoop Dogg, Pharrell Williams', genre:'rnb', note:'Comfort Song', featured: true },
  { id:'4pkEET0wXNNY5o61lVK5FF', title:'Erotic City', artist:'Prince', genre:'rnb', note:'Personal Favorite' },
  { id:'7EejjSh1WDrm81z0u3Fhmk', title:'I Didn\'t Mean To Turn You On', artist:'Cherrelle', genre:'rnb', note:'Classic' },
  { id:'1HibhNhwk2tljwC4BGGLXV', title:'I Can\'t Help It', artist:'Michael Jackson', genre:'rnb', note:'All-time favorite' },
  { id:'0WBlDFAH6GPWIFzcObQD7c', title:'Baby Come Close', artist:'MoKenStef', genre:'rnb', note:'Personal Favorite' },

  /* ---- electronic ---- */
  { id:'0lhVb3ubfHEWTCGZGceVrX', title:'Its So Nice', artist:'ANOTR, 3DDY', genre:'electronic', note:'Recent find', featured: true},
  { id:'7xn9uXfYkFXfMJgaQxgbCN', title:'Midsection', artist:'KAYTRANDA, Pharrell Williams', genre:'electronic', note:'On repeat' },
  { id:'4F1J5Y890NaaTUOumYzYUX', title:'Dreams', artist:'Prospa', genre:'electronic', note:'New classic' },
  { id:'3OxdXYsQec4nlrluOXFb09', title:'DON\'T WORRY BABE / I GOT U BABE', artist:'KAYTRANADA', genre:'electronic', note:'Chill vibes' },
  { id:'4XOYBygEQHqY0Dg21boDGk', title:'Who He Iz', artist:'KAYTRANADA, Amine', genre:'electronic', note:'On repeat' },
  { id:'7DAqYWASez8BkiSiwW5jvb', title:'Everything She Wants', artist:'The Egyptian Lover', genre:'electronic', note:'Acquired taste' },
  { id:'2IH0H4yalA3adrcOiniBJF', title:'Get My Luv', artist:'Luuk Van Dijk', genre:'electronic', note:'Mood setter' },
  { id:'6F7luXDYpTRlTpzrzsh15r', title:'We Are on the Move - Joey Negro Revival Mix', artist:'Zo!, Phonte, Erro, Dave \'Love\' Lee', genre:'electronic', note:'Classic' },
  { id:'4e6WG71BDyydX2fBwPjDv4', title:'A Fresh Energy', artist:'Gaskin', genre:'electronic', note:'Modern classic' },
  { id:'4BaPGeLFo9oV5vw6XdDlb4', title:'So Many Times - Extended Mix', artist:'Gadjo, Alexandra Prince', genre:'rap', note:'Throwback' },
  { id:'7eHjjHvs8kbYKtVAVySLzw', title:'Botega Vendeta', artist:'ChaseWest, Mandragora', genre:'electronic', note:'On repeat' },
  { id:'181XnwgJTJpeKkpS2zQOAF', title:'Moon', artist:'Locklead', genre:'electronic', note:'Modern classic' },
  { id: '7c5LEXTP5c1VVELPaNrQii', title:'Be Without You', artist:'SOSA', genre:'electronic', note:'Club favorite' },
  { id: '7ww9dHtVXHoJEbGGLSH7m2', title:'Wanna Party', artist:'Silva Bumpa, Wideboys, Dennis G', genre:'electronic', note:'New age' },
  { id: '2BUL7sF7y5oBYUQarVCukR', title:'Pasilda - Knee Deep Mix', artist:'Afro Medusa, Knee Deep', genre:'electronic', note:'All-time favorite' },
  { id: '1aBVDx9VjyLEk8rz8pezru', title:'Gets Like That', artist:'Max Dean, Luke Dean', genre:'electronic', note:'Modern classic' },
  { id: '0Z247FBrNUHElnN5IVezT8', title:'Aquamarine', artist:'Trent Voyage, Elena Moroder', genre:'electronic', note:'Chill vibes' },
  { id: '7qXHc4Fo85ZqeXQ2ZLNhoJ', title:'Funky Bassline - Beltran Remix', artist:'Marc Houle, Beltran', genre:'electronic', note:'New age' },
  { id: '6vuQcT7zYyFr5PqdNYphyK', title:'Don\'t Stop Make That Body Rock', artist:'Odd Mob', genre:'electronic', note:'Workout anthem' },
  { id: '6XqRL8W59LbyLuIQ7wyjON', title:'Passion (R U Satisfied)', artist:'Beltran, The Flirts', genre:'electronic', note:'Club banger' },
  { id: '0hI0tjl8fLB6UqpTq8SFCs', title:'Another Night', artist:'RUZE, Chesster', genre:'electronic', note:'Modern classic' },
  { id: '6Kx8BnlhpywATbzjFNKgW1', title:'Underwater Original Version 1979', artist:'Harry Thumann', genre:'electronic', note:'Hidden gem' },
  { id: '1m8qbseW8yMcRDNiIjyijT', title:'Out of My Mind - Rello Remix', artist:'Joshwa, Rello', genre:'electronic', note:'On repeat' },
  { id: '2qpkcHxt9Kc5RLf4f7HokU', title:'Silver Lines', artist:'ANOTR, Emily Warren', genre:'electronic', note:'Chill' },
  { id: '6Ss1QOGzn0iG8hrRRSGrr9', title:'It Just Won\'t Do - Radio Edit', artist:'Tim Deluxe, Sam Obernik', genre:'electronic', note:'Throwback' },
  { id: '3l6bosIJCS1HsXunBLAkz2', title:'Closer Than Close - Mentor Remake', artist:'Rosie Gaines', genre:'electronic', note:'Hidden gem' },

  /* ---- reggae ---- */
  { id:'2Vwx10t3ywlvUp2arq8AYF', title:'Substitute Lover', artist:'Half Pint', genre:'reggae', note:'Classic' },
  { id:'0OEaxQn3hwgbSrPXKzIofy', title:'At The Club', artist:'Victor Romero Evans', genre:'reggae', note:'On repeat'},
  { id:'6HpjJaxJki9ubKp4aXow8b', title:'Big Ship', artist:'Freddie McGregor', genre:'reggae', note:'All-time favorite' },
  { id:'2tJXXBi7lPdko8h5raKOht', title:'Mr. Landlord', artist:'Half Pint', genre:'reggae', note:'Personal Favorite'},
  { id:'24Si0Kw3pu2RxX1jrbBg5A', title:'Sweat', artist:'Inner Cirlce', genre:'reggae', note:'Crowd Favorite' },
  { id:'5gWVTal2UptaVdnwopG7Sy', title:'Honey', artist:'SHY FX, Kiko Bun', genre:'reggae', note:'On repeat' },
  { id:'7a2FaJBUsniyDAOFoopHuM', title:'Black Roses', artist:'Barrington Levy', genre:'reggae', note:'Classic' },
  { id:'6cLeIanzsJy9LmohPWsg21', title:'Trench Town', artist:'Bob Marley & The Wailers', genre:'reggae', note:'All-time favorite' },
  { id:'1BkY0N8ChFk2mdLbAUu8ZK', title:'Pass The Dutchie', artist:'Musical Youth', genre:'reggae', note:'Crowd Favorite' },
  { id:'1jE9db1pT5WrdCw1RLKuW3', title:'Full Up', artist:'Manu Dibango', genre:'reggae', note:'Personal Favorite' },
  { id:'4llIZen1Cn4mi3DJm2Lqlz', title:'Cool Down The Pace', artist:'Gregory Isaacs', genre:'reggae', note:'On repeat' },
  { id:'1uwi5N3r1dUkyZ4VSnhw2L', title:'Call a Taxi', artist:'iNi Kamoze', genre:'reggae', note:'Comfort Song' },
  { id:'2KixjItWbkFJtKathsqIOp', title:'Positive Reality', artist:'Mikey Dread', genre:'reggae', note:'Summertime jam' },
  { id:'3QbMBn1cm37oUtWYwmccqc', title:'In Your Eyes', artist:'Johnny Osbourne', genre:'reggae', note:'All-time favorite' },
  { id:'7kOUBx2Q7N7jOfqqTZsDMW', title:'Call Me', artist:'Mike Anthony', genre:'reggae', note:'Comfort Song' },

  /* ---- jazz ---- */
     { id:'1cpANF6zMBoFoxkoIjZHjv', title:'Skating In Central Park', artist:'Bill Evans, Jim Hall', genre:'jazz', note:'All-time favorite' },
];
/* ================================================================
   4. THE LINER NOTES — your experience, skills, education and bio.

   This is the gatefold section that unfolds above the tracklist.
   Everything in it is generated from the four blocks below, so the
   markup in index.html never needs touching — add or remove entries
   here and the layout follows.

   LEFT PAGE  = `experience`
   RIGHT PAGE = `skills`, then `education`, then `about`

   All of it is placeholder text. Replace it with the real thing.
   ================================================================ */

/* --- LEFT PAGE: work history, newest first ---
   `side`    a short catalogue-style tag shown in the margin (A1, A2, …)
   `period`  keep it short; it's set in monospace and shouldn't wrap
   `current` true puts a lit lamp next to the role
   `bullets` 2–4 lines. Lead with the outcome, not the tooling.
   `stack`   chips under the entry. 3–5 works best visually. */
const experience = [
  {
    side:'A1', current:true,
    role:'Data Analyst',
    company:'Your Current Employer',
    period:'2024 — Present',
    location:'City, ST',
    bullets:[
      'Replace this with what you own — the reporting, the domain, the people who depend on it.',
      'Replace this with a result. A number beats an adjective every time.',
      'Replace this with something only you did — a process you rebuilt, a bad metric you killed.'
    ],
    stack:['SQL','Python','Tableau','Excel']
  },
  {
    side:'A2',
    role:'Previous Title',
    company:'Previous Employer',
    period:'2022 — 2024',
    location:'City, ST',
    bullets:[
      'Replace with the scope of the role in one line.',
      'Replace with the thing you shipped that outlived you.'
    ],
    stack:['SQL','Power BI','Excel']
  },
  {
    side:'A3',
    role:'Earliest Title',
    company:'Earliest Employer',
    period:'2021 — 2022',
    location:'City, ST',
    bullets:[
      'Replace with where you started and what you picked up there.'
    ],
    stack:['Excel','SQL']
  }
];

/* --- RIGHT PAGE, block 1: skills, grouped like a personnel credit ---
   Keep to 3–4 groups. Long lists read as filler on a portfolio. */
const skills = [
  { group:'Query & Modeling', items:['SQL (Postgres, T-SQL)','dbt','Data modeling','Window functions'] },
  { group:'Analysis',         items:['Python','pandas','NumPy','A/B testing','Regression'] },
  { group:'Reporting',        items:['Tableau','Power BI','Excel','Looker Studio'] },
  { group:'Working practice', items:['Git','Stakeholder interviews','Metric definition','Documentation'] }
];

/* --- RIGHT PAGE, block 2: education & certifications --- */
const education = [
  {
    school:'Your University',
    credential:'B.S. in Your Major',
    period:'2017 — 2021',
    detail:'Replace with a concentration, honour, or relevant coursework — or delete this line.'
  },
  {
    school:'Certification Body',
    credential:'Certification Name',
    period:'2023',
    detail:'Replace or delete.'
  }
];

/* --- RIGHT PAGE, block 3: the bio ---
   `paras` are the sleeve notes. Two short paragraphs beats one long one.
   `facts` is the little credits table underneath. */
const about = {
  paras:[
    'Replace this with who you are in your own voice — not a resume summary. What kind of problems pull you in, and what you are like to work with.',
    'Replace this with the second half: what you are looking for next, and why someone should press play on the tracklist below.'
  ],
  facts:[
    { k:'Based in',   v:'City, ST' },
    { k:'Status',     v:'Open to analyst roles' },
    { k:'Best at',    v:'Turning a vague ask into a clear number' },
    { k:'Off the clock', v:'Digging through crates' }
  ]
};