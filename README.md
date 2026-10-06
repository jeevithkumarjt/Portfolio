# Portfolio

My portfolio and resume site. Hand-written HTML, CSS and JavaScript — no framework, no build
step.

**Live:** [jeevithkumarjt.github.io/Portfolio](https://jeevithkumarjt.github.io/Portfolio/)

## The problem

A portfolio has to load fast, read well on a phone, and be easy for recruiters to skim. Most of
the ones I've seen are framework-heavy for what is essentially five pages of content, and the
widget-based ones break whenever a third-party service changes.

This one is plain files. It loads quickly, works without JavaScript, and I can change any of it
without waiting on a toolchain.

## Architecture

```
Portfolio/
├── index.html        # main site: hero, about, experience, projects, skills, contact
├── resume.html       # standalone printable resume
├── css/
│   ├── tokens.css    # colour, spacing, type scale — the design tokens
│   ├── main.css      # layout and components
│   └── resume.css    # print styles for the resume page
├── js/
│   └── main.js       # nav, scroll reveal, form validation
├── images/           # portrait, project thumbnails, og banner
├── robots.txt
└── sitemap.xml
```

Everything is static. `main.js` adds progressive enhancements only — the content is readable if
it never runs.

## Tech stack

- **HTML5**, **CSS3** with custom properties for theming
- **JavaScript** (ES6+), no dependencies
- Responsive layout, mobile-first, no CSS framework
- Semantic markup, keyboard navigation, reduced-motion support
- `robots.txt`, `sitemap.xml` and Open Graph tags for sharing

## Running it

Open `index.html` in a browser. That's the whole run command.

To serve it locally instead:

```bash
# Python
python -m http.server 8000

# or Node
npx serve .
```

Then open http://localhost:8000.

There is no install step and no `package.json`.

### Deploying

Hosted on GitHub Pages from the `main` branch. To publish changes:

```bash
git add .
git commit -m "Update portfolio"
git push
```

## Screenshots

Not captured yet — see the [live site](https://jeevithkumarjt.github.io/Portfolio/).

## Current status

Live and maintained. Sections kept in sync with my GitHub profile README and resume:

- 4+ years of experience
- five-person team lead
- 50+ websites shipped
- six production platforms

Open to full-time roles.

## License

MIT — see [LICENSE](LICENSE).