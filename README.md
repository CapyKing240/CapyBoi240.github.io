# Moonlight Studios website

A static site (plain HTML, CSS and JavaScript). No build step and nothing to install.
Upload the whole folder to your host, or open `index.html` to preview it.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home: hero, game showcase, games, latest devlogs, about, contact |
| `games.html` | All games |
| `game.html?g=<slug>` | One game: description, videos, screenshots, itch.io button, and that game's devlogs at the bottom |
| `devlogs.html` | All devlogs with filters (General, plus one per game) and search |
| `devlog.html?p=<slug>` | One devlog post |
| `about.html` | About the studio |
| `contact.html` | Contact form |

`game.html` and `devlog.html` are single templates that read their content from `js/data.js`,
so you never copy a page when you add a game or a post.

## Things to change first

Open `js/data.js` and search for `TODO`:

1. `SITE.email`: optional public email shown on the contact page. Leave it empty to hide it.
2. `SITE.socials`: your itch.io profile, and any YouTube, Discord or X links (empty ones are hidden).
3. `itch` on each game: check each itch.io link points at the right page.
4. The contact form sends through your existing Formspree form (`SITE.formEndpoint`),
   and every message carries `SITE.replyTo`, like your old contact page.
5. Replace the placeholder paragraphs in the games, the about page and the sample devlogs.

The footer links to `privacy_policy.html` and `terms_of_service.html`. Keep those two pages
from your current site in the same folder.

## Add a game

Copy one block in the `GAMES` array in `js/data.js`, change the values, and save.
It appears on the home page, games page and footer automatically. Its page is
`game.html?g=<its slug>`.

- `videos`: add YouTube IDs, e.g. `[{ id: "dQw4w9WgXcQ", title: "Trailer" }]`
- `screenshots`: list of image paths. Clicking one opens a viewer.

## Add a devlog

Copy one block in the `DEVLOGS` array.

- `game: "general"` for studio news, or a game's slug for a game devlog.
- A devlog with a game's slug is shown on that game's page automatically (all of them, newest first).
- `body` is a list of blocks: paragraphs, headings, images, galleries, lists, quotes and videos.
  See the comment above `DEVLOGS` for the exact format.

## Images

Every image is optional. Anything missing shows a coloured placeholder, so nothing looks broken.
The default paths are:

```
Images/
  logo.png                      browser tab icon
  <game-slug>/cover.jpg         game card image (landscape, about 16:10)
  <game-slug>/hero.jpg          wide banner (about 16:9)
  <game-slug>/logo.png          optional logo shown in place of the title
  <game-slug>/shot1.jpg ...     screenshots
  devlogs/*.jpg                 devlog covers and pictures
```

If your current site uses different folders, change the paths in `js/data.js`.

## The moon

The moon behind the page is drawn in code (`moon()` in `js/main.js`) and fills out as you scroll.
Phase icons next to each game show its status: full for released, half for in progress.

## 404 page

`404.html` is the page visitors see when a link doesn't exist. Most static hosts use it automatically
when it sits in the site's root folder (next to `index.html`): Netlify, Cloudflare Pages, GitHub Pages,
Vercel and Firebase Hosting all do. On Apache (many shared hosts), add this line to the `.htaccess` file in the root folder:

```
ErrorDocument 404 /404.html
```

On nginx, add `error_page 404 /404.html;` to the server block.
The page assumes the site lives at the domain root (like moonlightstudios.net), which is why it sets `<base href="/">`.

## Style details

- Each game's `hue` in `js/data.js` also tints its game page and its devlogs (the colour wash, the info panel and the glow on cards).
- Cards glow under the cursor on desktop. The footer skyline is drawn in code (`skyline()` in `js/main.js`).
