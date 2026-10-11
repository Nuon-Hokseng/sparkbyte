# SparkByte

The landing site for SparkByte, which builds point-of-sale systems and mobile
apps.

Built with Next.js 16 (App Router), React 19 and Tailwind CSS 4. The animated
parts are plain WebGL shaders with no 3D library.

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Scripts

| Command             | What it does                                               |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | Starts the development server.                             |
| `npm run build`     | Builds the site for production.                            |
| `npm run start`     | Serves the production build.                               |
| `npm run lint`      | Runs ESLint.                                               |
| `npm run typecheck` | Runs the TypeScript compiler without emitting files.       |
| `npm run icons`     | Regenerates every icon and share image from the logo.      |
| `npm run hand`      | Retraces the hand in the app tour from its source photo.   |

## Environment

| Variable               | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | The public address, e.g. `https://example.com`. It is used for the canonical URL, the sitemap and link-preview images, and defaults to `http://localhost:3000`. |

## Project structure

```text
app/                      Routes, global styles and metadata
  layout.tsx              Fonts, page metadata, <html> shell
  page.tsx                The landing page
  globals.css             Design tokens and the few hand-written rules
  favicon.ico, icon.png, apple-icon.png,
  opengraph-image.png, twitter-image.png
                          Icons and share images. Next.js finds these by name
                          and location, so they must stay directly in app/.
  manifest.ts, robots.ts, sitemap.ts

components/
  layout/
    site-header.tsx       Navigation bar and mobile menu
    site-footer.tsx       Footer: what we build, where to reach us
    step-fill.tsx         The line of a step in a carousel's progress row
  hero/
    hero.tsx              The hero section
    hero-headline.tsx     Headline whose letters can be fed to the black hole
    hole.ts               State the hero's pieces share, and its quality control
    black-hole/           The logo as an animated black hole
      black-hole.tsx
      shader.ts
    space-backdrop/       Stars, nebula and galaxies behind the hero
      space-backdrop.tsx
      shader.ts
  showcase/
    showcase.tsx          Carousel of what a shop can set up itself
    slides.ts             Each slide's headline, text, points and icon
    paper.tsx             The paper backdrop that slides as the slides go by
    demos/                One live, usable piece of the POS per slide
      kit.tsx             What the demos share: props, scripted opening moves
      business-type.tsx   Switching between optician, retail and restaurant
      fields.tsx          Renaming a product form's fields
      tabs.tsx            Adding product tabs to the sidebar
      table-order.tsx     A table's running bill, and the QR menu
      table-sizes.tsx     Floors, batches of tables and seats per table
      floor-plan.tsx      Dragging tables and drawing walls
      analytics.tsx       The Data screen: the month's sales as charts
      assistant.tsx       The AI assistant answering from those sales
      charts.tsx          The line and bar charts both of them draw
      sales.ts            The made-up month of sales they chart
  apps/
    app-tour.tsx          Carousel tour of the TilomNov app on a phone
    tour.ts               Each slide's headline, text and hint
    phone.tsx             The phone, and the hand holding it
    hand-art.ts           The hand's traced outlines (written by `npm run hand`)
    rings.tsx             The rings backdrop that widens as the slides go by
    parts.tsx             What the screens share: icons, cards, tab bar
    listings.ts           The sample properties the screens show
    screens/              One screen of the app per slide
      welcome.tsx, map.tsx, chat.tsx, explore.tsx, detail.tsx

  process/
    process.tsx           "How we work": the four steps, and the stone picked
    orbit.tsx             The Earth, its ring and the stones going round it
    earth-shader.ts       GLSL for the Earth
    stones.ts             The steps, and the stones: what is made, what is not
  contact/
    contact.tsx           Contact: a form that writes the visitor's email for them

hooks/
  use-reduced-motion.ts
  use-scroll-stage.ts     What drives both carousels: scrolling with a mouse; on a
                          touch screen a swipe per slide, and a timer
  use-script.ts           Timed opening moves for a demo or a screen

lib/
  site.ts                 Site name, description, URL and theme colour

scripts/
  generate-icons.mjs      Builds the icons and share images
  trace-hand.mjs          Traces design/hand-source.jpg into hand-art.ts

design/
  logo-source.png         The logo artwork every icon is cut from
  hand-source.jpg         The photo the app tour's hand is traced from
  earth-source.jpg        The map of the Earth, as NASA publishes it (2048 x 1024)
  landing-mock.*          The original static mock of the landing page

public/                   Files served as they are
  pos/                    Photos on the POS demos' item cards
  apps/                   The app's map and property photos, cut from its design
```

Imports use the `@/` alias for the project root, for example
`@/components/hero/hero`.

## How the hero fits together

- **The mark** (`components/hero/black-hole`) draws the logo in a fragment
  shader. Its geometry is measured from `design/logo-source.png`. The long
  straight stroke is the black hole's pole and never moves. The two arms of the
  S are the disc around it, which keeps turning and passes through the logo's
  exact pose once per turn.
- **Scrolling** flies the mark up into the header icon. The canvas is fixed
  above the page, and the header's icon takes over once it lands.
- **The headline's letters** can be clicked, tapped or dragged into the hole.
  The headline, the mark and the backdrop coordinate through the plain object
  in `components/hero/hole.ts`.
- **Quality** adapts to the device. The mark measures its own frame rate and
  lowers the canvases' resolution if the device cannot keep up, then raises it
  again if there turns out to be room.
- **Fallbacks**: visitors who ask for reduced motion get a still frame, and
  browsers without WebGL get the logo image.

## The mock screens

The POS demos and the app's screens are rebuilt in code so they can be used,
but they follow the real products: their colours are measured from
screenshots and set once each, on `.demo-canvas` and `.phone-rig` in
`app/globals.css`, and the app's screens keep its design's positions (1em is
10pt of a 440pt-wide screen). The POS is set in Poppins and the app in Inter.

## Image credits

The hand is traced from "Female Hand Holding Smartphone With Blank Screen" by
personalgraphic.official, released under CC0:
<https://www.flickr.com/photos/198895458@N04/53097224746>.

The Earth in "How we work" is wrapped in NASA's Blue Marble map ("Land
Surface, Shallow Water, and Shaded Topography", NASA Goddard Space Flight
Center, image by Reto Stöckli), which is in the public domain:
<https://visibleearth.nasa.gov/images/57752>.

The photos on the POS item cards are public-domain or CC0 images found
through Openverse:

| File | Image | Licence | Source |
| ---- | ----- | ------- | ------ |
| `public/pos/grilled-fish.webp` | "Yuuanyaki" by Hanabishi | CC0 | <https://commons.wikimedia.org/w/index.php?curid=146215220> |
| `public/pos/spring-rolls.webp` | "Excellent Bowl with spring rolls, pork, noodles and nuoc cham at Cafe " by roland | CC0 | <https://www.flickr.com/photos/35034347371@N01/1893350> |
| `public/pos/noodle-soup.webp` | "Croissant, soup and banana bread at Libby's - 12" by roland | CC0 | <https://www.flickr.com/photos/35034347371@N01/3165745> |
| `public/pos/curry-rice.webp` | "Chinese Chicken Curry & Egg Fried Rice" by Graham Steel | Public domain mark | <https://www.flickr.com/photos/7914713@N05/32768509204> |
| `public/pos/iced-coffee.webp` | "Still Items" by frank mckenna | CC0 | <https://stocksnap.io/photo/still-items-8TRDBDNVUQ> |
| `public/pos/iced-latte.webp` | "Drinks Beverage" by Linda Xu | CC0 | <https://stocksnap.io/photo/drinks-beverage-NHUX06WSB3> |
| `public/pos/coconut.webp` | "Free coconut drink image" by unknown | CC0 | <https://www.rawpixel.com/image/5914368/image-background-public-domain-fruit> |
| `public/pos/tea.webp` | "Open book and a cup of tea" by freestocks.org | CC0 | <https://www.flickr.com/photos/135396164@N05/29364151550> |
| `public/pos/fruit-plate.webp` | "Fruit Plate" by Dan Gold | CC0 | <https://stocksnap.io/photo/fruit-plate-PDPYKSLPE6> |
| `public/pos/mango-rice.webp` | "Mango sticky rice" by unknown | CC0 | <https://www.rawpixel.com/image/6030903/photo-image-public-domain-plant-fruit> |
| `public/pos/ice-cream.webp` | "A stack of ice cream scoops drizzled with chocolate and cream on a whi" by Vishnu Chandra | CC0 | <https://wordpress.org/photos/photo/49269f6ff3/> |
| `public/pos/banana-bread.webp` | "When The World Goes to Crap, Make Banana Bread" by cogdogblog | CC0 | <https://www.flickr.com/photos/37996646802@N01/32280446210> |
| `public/pos/croissant.webp` | "Croissant" by Blarvar | Public domain mark | <https://www.flickr.com/photos/46583370@N04/4599562280> |
| `public/pos/latte.webp` | "Free latte art coffee top" by unknown | CC0 | <https://www.rawpixel.com/image/5926452/photo-image-public-domain-art-hand> |

The map and the three property photos in `public/apps/` are cut from the
TilomNov app's own design screens.

## Before launch

- Set `NEXT_PUBLIC_SITE_URL`.
- Check the map in `public/apps/map.webp` may be shown publicly: it is a
  screenshot of the app's map provider, labels and all.
- Write a real description in `lib/site.ts`, and put the real contact details
  there: the email address is a placeholder that cannot receive mail, and the
  phone number and Telegram name are empty, so the site leaves them out.
- Replace the placeholder copy in `components/hero/hero.tsx`,
  `components/showcase/slides.ts`, `components/apps/tour.ts`,
  `components/process/` and `components/contact/contact.tsx`.
- The contact form has no server behind it: it opens the visitor's email app.
  To have it send by itself it needs an email service and a server action.
- There is no privacy policy, and the footer does not link to one.
