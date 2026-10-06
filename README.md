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

## What I do

I build and run complete web products, from the client call to the live server —
requirements, database design, backend APIs, the frontend, deployment, and the
production debugging afterwards. I also build AI agents and dashboards.

I lead a five-person team, run six production platforms and have shipped 50+ websites.

## Skills

| Area | Skills |
| --- | --- |
| **Frontend** | HTML5, CSS3, JavaScript, TypeScript, React, Next.js, Tailwind, Bootstrap |
| **Backend & APIs** | Python, FastAPI, Core PHP, Node.js, Laravel, REST APIs, async programming, JWT/OAuth, SSE/WebSockets |
| **AI & Agents** | LLM fundamentals, prompt engineering, RAG, embeddings, vector databases, LLM APIs, function/tool calling, LangChain, LangGraph, agent memory, multi-agent systems, MCP |
| **Databases** | MySQL, PostgreSQL, SQL, Redis, pgvector |
| **Cloud & DevOps** | Docker, Git/GitHub, Linux, Nginx, Apache, GCP, CI/CD |
| **Integrations** | Dynamics 365, Power Apps, Power Automate, Power BI, GA4/GTM |

## Live production properties

Six production websites I develop, maintain and operate: Tryvium AI, Eprotech AI,
Sensiple, Phifix, CloudSens AI and Quinovate AI. What I own on each — features, CRM
integration, technical SEO, performance, deployments and server operations.

## Selected projects

| Repository | What it is |
| --- | --- |
| [ai-agent](https://github.com/jeevithkumarjt/ai-agent) | Self-hosted AI assistant that answers from your own documents and cites its sources — FastAPI, LangGraph, pgvector, JWT, SSE/WebSockets, Docker Compose. |
| [seo-dashboard](https://github.com/jeevithkumarjt/seo-dashboard) | Internal SEO audit and monitoring dashboard — FastAPI, Playwright, Next.js, TimescaleDB. **In progress.** |
| **This site** | Hand-written HTML, CSS and JavaScript. No framework, no build step. |

Two more dashboards are in progress — lead and form attribution, and product
analytics. Both are unfinished, so I am not claiming them yet.

## Contact

- **Portfolio:** [jeevithkumarjt.github.io/Portfolio](https://jeevithkumarjt.github.io/Portfolio/)
- **LinkedIn:** [linkedin.com/in/jeevithkumar-r-24a78017b](https://www.linkedin.com/in/jeevithkumar-r-24a78017b)
- **Email:** [jeeviaero123@gmail.com](mailto:jeeviaero123@gmail.com)

Full work history is in [resume.html](resume.html).

## Current status

Live and maintained. Sections kept in sync with my GitHub profile README and resume:

- 4+ years of experience
- five-person team lead
- 50+ websites shipped
- six production platforms

Open to full-time roles.

## License

MIT — see [LICENSE](LICENSE).