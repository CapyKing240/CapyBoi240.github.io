/* ==========================================================================
   MOONLIGHT STUDIOS — SITE DATA
   This is the only file you need to edit to add games and devlogs.
   Images are optional: if a file is missing, the site shows a coloured
   placeholder instead of a broken image.
   ========================================================================== */

const SITE = {
  name: "Moonlight Studios",
  // Optional public email, shown under "Find us elsewhere" on the contact page.
  // Leave empty to hide it (messages still arrive through the form).
  email: "",
  // Contact form: sends through your Formspree form.
  formEndpoint: "https://formspree.io/f/mvgegypo",
  // Sent along with every message so replies go to the studio inbox.
  replyTo: "moonlight.studio2510@gmail.com",
  socials: {
    itch: "https://moonlightstudios.itch.io", // TODO: check this is your itch.io profile
    youtube: "https://www.youtube.com/@moonlightstudios2510",
    discord: "",
    x: "https://x.com/Moonlight2510_"
  }
};

/* --------------------------------------------------------------------------
   GAMES
   status:    "released" | "progress" | "upcoming"
   hue:       0-360, tints the placeholder art for that game
   itch:      the game's itch.io page (the big button on the game page)
   videos:    YouTube video IDs, e.g. [{ id: "dQw4w9WgXcQ", title: "Launch trailer" }]
   facts:     the small info table on the game page
   -------------------------------------------------------------------------- */
const GAMES = [
  {
    slug: "wizardsbane",
    title: "Wizardsbane",
    subtitle: "Remake",
    status: "In progress",
    statusKey: "progress",
    hue: 262,
    tagline: "The action adventure, rebuilt from the ground up.",
    short: "A fast-paced action adventure being rebuilt with improved gameplay, smoother mechanics and a fresh look.",
    description: [
      "A fast-paced action adventure currently being rebuilt from the ground up with improved gameplay, smoother mechanics, and a fresh new look.",
      "Replace this paragraph with what players can expect from the remake and when you plan to release it."
    ],
    features: [
      "Rebuilt from the ground up",
      "Improved gameplay",
      "Smoother mechanics",
      "A fresh new look"
    ],
    facts: [
      ["Status", "Remake in progress"],
      ["Type", "Action adventure"]
    ],
    itch: "https://moonlight-studios-1.itch.io/wizardsbane", // TODO: check link
    cover: "Images/games/wizardsbane/cover.png",
    hero: "Images/games/wizardsbane/hero.png",
    logo: "Images/games/wizardsbane/logo.png",
    screenshots: [
      "Images/games/wizardsbane/shot1.png",
      "Images/games/wizardsbane/shot2.png",
      "Images/games/wizardsbane/shot3.png",
      "Images/games/wizardsbane/shot4.png",
      "Images/games/wizardsbane/shot5.png"
    ],
    videos: []
  },
  {
    slug: "clonescape",
    title: "Clonescape",
    subtitle: "",
    status: "Released",
    statusKey: "released",
    hue: 190,
    tagline: "You woke up as a clone. Now find the way out.",
    short: "Escape a high-tech underground facility through deadly traps, intricate switches and precision platforming.",
    description: [
      "You're awaken as a clone in a high-tech underground facility and test your wits against deadly traps, intricate switches, and precision platforming challenges to escape.",
      "Replace this paragraph with more about the game: the setting, how the puzzles work, how long it takes to finish."
    ],
    features: [
      "Deadly traps that reward patience",
      "Intricate switches and puzzle rooms",
      "Precision platforming",
      "Escape the facility"
    ],
    facts: [
      ["Status", "Released"],
      ["Type", "Puzzle platformer"]
    ],
    itch: "https://moonlight-studios-1.itch.io/clonescape", // TODO: check link
    cover: "Images/games/clonescape/cover.png",
    hero: "Images/games/clonescape/hero.png",
    logo: "Images/games/clonescape/logo.png",
    screenshots: [
      "Images/games/clonescape/shot1.png",
      "Images/games/clonescape/shot2.png",
      "Images/games/clonescape/shot3.png",
      "Images/games/clonescape/shot4.png"
    ],
    videos: []
  },
  {
    slug: "super-pet-fighter",
    title: "Super Pet Fighter",
    subtitle: "Re-hamstered Edition",
    status: "Released",
    statusKey: "released",
    hue: 28,
    tagline: "Pick a companion, train hard and duel your way to champion.",
    short: "Explore, train and duel. Battle over 15 rival pets to become the ultimate champion.",
    description: [
      "Super Pet Fighter was originally developed for GDevelop's second big game jam. After the jam, we improved the gameplay and mechanics and made the game a lot more fun to play.",
      "Choose from a range of characters and pets, then battle by playing rock paper scissors. There are over 15 rivals to face, and your goal is to collect the badges you earn by beating them. Explore the buildings around town, buy potions and upgrades at the shop, and much more.",
      "Pick your companion, train them, and become the champion!"
    ],
    features: [
      "Choose your companion",
      "Battle over 15 rival pets",
      "Explore and train between duels",
      "Re-hamstered Edition, available now"
    ],
    facts: [
      ["Status", "Released"],
      ["Rivals", "15+ rival pets"]
    ],
    itch: "https://moonlight-studios-1.itch.io/super-pet-fighter-re-hamstered-edition", // TODO: check link
    cover: "images/games/super-pet-fighter/cover.png",
    hero: "images/games/super-pet-fighter/hero.png",
    logo: "",
    screenshots: [
      "images/games/super-pet-fighter/shot1.png",
      "images/games/super-pet-fighter/shot2.png",
      "images/games/super-pet-fighter/shot3.png",
      "images/games/super-pet-fighter/shot4.png"
    ],
    videos: [] // e.g. [{ id: "YOUTUBE_ID", title: "Trailer" }]
  }
];

/* --------------------------------------------------------------------------
   DEVLOGS
   game:  "general" for studio news, or a game's slug (e.g. "clonescape")
   date:  YYYY-MM-DD
   cover: optional image shown on the list and at the top of the post
   body:  an array of blocks, in order:
     { type: "p",     text: "Paragraph. Supports **bold**, *italic*, `code` and [links](https://...)" }
     { type: "h",     text: "Section heading" }
     { type: "img",   src: "Images/devlogs/pic.jpg", caption: "Optional caption" }
     { type: "gallery", images: ["a.jpg", "b.jpg"] }
     { type: "list",  items: ["one", "two"] }
     { type: "quote", text: "A pull quote" }
     { type: "video", id: "YOUTUBE_ID", title: "Optional title" }

   ⚠ The posts below are SAMPLE content so you can see how everything looks.
     Replace them with your real devlogs.
   -------------------------------------------------------------------------- */
const DEVLOGS = [
  {
    slug: "welcome-to-the-new-site",
    game: "general",
    date: "2026-10-18",
    title: "Welcome to the new Moonlight Studios site",
    excerpt: "A new home for our games, and a place to follow along while we build them.",
    cover: "Images/devlogs/new_website_look.png",
    body: [
      { type: "p", text: "Welcome! This is the new home of Moonlight Studios. Every game we make now has its own page, and every devlog lives here too." },
      { type: "h", text: "What you'll find here" },
      { type: "list", items: [
        "A page for every game, with screenshots, videos and a link to its itch.io page",
        "Devlogs you can filter by game, or by studio news",
        "The devlogs for each game, collected at the bottom of its page"
      ]},
      { type: "p", text: "Sample text: replace this with your own announcement." }
    ]
  },
  {
    slug: "where-have-we-been",
    game: "general",
    date: "2026-10-18",
    title: "Where have we been?",
    excerpt: "A quick look at what's been going on behind the scenes.",
    cover: "images/devlogs/where-have-we-been.png",
    body: [
      { type: "p", text: "Hello everyone! You've probably noticed the silence on our devlogs and socials over the past few months. As an independent team, it's easy to fall into a cycle of pushing updates just to stay visible. Behind the scenes, though, we realized our workflow, project structure and brand identity were no longer keeping up with where we want to take Moonlight Studios." },
      { type: "h", text: "Improving our workflow" },
      { type: "p", text: "Instead of rushing out half-finished updates across several projects, we chose to pause our public releases. We used the time to improve our design systems and sharpen our skills as game makers. We also decided to stop working on projects that are too big for us to handle, and to go back to our roots: polished, fun games." },
      { type: "p", text: "Wizardsbane will get its own devlog soon, with the full story." },
      { type: "h", text: "What's ahead?" },
      { type: "p", text: "During this time we've also been prototyping new mechanics and exploring fresh game concepts. These projects are still in their early stages and far from ready to reveal, but experimenting without the pressure of a deadline has given us some fun ideas we're definitely going to explore." },
      { type: "p", text: "Now that our core infrastructure and rebranding are done, we're shifting our focus back to active development and regular community updates. This new site is part of that, so stick around." },
      { type: "p", text: "— The Moonlight Studios Team 🌙" }
    ]
  }
];
