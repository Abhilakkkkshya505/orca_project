# Project ORCA: 5-Minute YouTube Demo & Project Journey Script

**Title:** ORCA: Marine Ecosystem Reasoning with Collaborative AI Agents (SDG 14)  
**Target Video Duration:** 05:00 minutes  
**Format:** Screen Recording + Webcam PiP + Terminal Demonstrations  
**Author / Presenter:** ORCA Development Team (Bennett University)  

---

### Video Flow & Cue Sheet

| Timestamp | Visual Display | Audio Narration / Voiceover Script | Action / Demonstration |
| :--- | :--- | :--- | :--- |
| **00:00 - 00:45** | **The Problem:** Opening montage of high sea waves, artisanal fishing boats on rough waters, and news headlines of coastal capsizings. | *"Over 4 million fishers along India's coastline head out into open waters every single day in small craft. But unpredictable squalls and high swells lead to hundreds of tragic fatalities each year. While satellite and weather telemetry exists, making sense of disparate wave heights and wind charts on a pitching boat under bright sun is almost impossible. And relying on regular AI chatbots is dangerous—they hallucinate. Welcome to Project ORCA: Marine Ecosystem Reasoning with Collaborative AI Agents for UN SDG 14."* | Show ORCA title screen with SDG 14 tag. |
| **00:45 - 01:30** | **The Core Innovation:** Split-screen displaying the architecture diagram and the deterministic `rules.py`. | *"At the heart of ORCA is a strict safety principle: The LLM never decides risk. We built a pure deterministic risk engine in Python that operates without database queries, without clock reads, and without an LLM. It computes whether conditions are Safe, Caution, Unsafe, or Unknown. Stale or missing data strictly defaults to Unknown—never Safe. And any official high wave or cyclone bulletin instantly forces an Unsafe rating."* | Highlight pure mathematical functions in `backend/apps/risk/rules.py`. |
| **01:30 - 02:45** | **Live Interactive Walkthrough:** Opening the frontend at `app.localtest.me` (or `localhost`). | *"Let's explore the platform. Here is our nautical dashboard built with React, TypeScript, and Tailwind. In the explore tab, we have our interactive MapLibre nautical chart. When I click on a coastal station—like Fort Kochi or Mumbai Harbour—our multi-agent system initiates. Watch the Server-Sent Events stream: First, our specialist agents gather weather, ocean state, and satellite telemetry. Then, the deterministic rules engine evaluates wave height and wind. Finally, our orchestrator explains the result."* | Demonstrate click on map, SSE token stream, and `RiskCard` rendering with four-way redundant encoding (icon + word + color + shape). |
| **02:45 - 03:30** | **Anti-Hallucination Guardrails:** Terminal showing regex validator test cases. | *"Notice how the text never hallucinates an unverified number? Before any token reaches the user, our regex validator inspects every generated number against the authorized telemetry. If an unauthorized number appears, it's rejected instantly and falls back to deterministic template text."* | Show passing test case `test_validators.py` in terminal. |
| **03:30 - 04:15** | **Offline PWA & The Fish Mini-Game:** Simulating airplane mode / offline disconnect in DevTools. | *"Now, what happens when a fisherman is 15 miles offshore with zero 4G connectivity? We disconnect the network. The Service Worker immediately serves our standalone `offline.html`. Mariners can review their last cached advisory with exact age timestamps. And while waiting for telemetry or resting, they can play our zero-network underwater sea game—dodging jellyfish, nets, and sharks while collecting plankton, running at a smooth 60 fps."* | Toggle Network to "Offline" in Chrome DevTools. Show offline screen, cached advisory banner, and play fish canvas game. Restore network and show auto-reconnect ping returning to the app! |
| **04:15 - 05:00** | **Conclusion & Quality Verification:** Terminal showing 68/68 passing tests, and Bennett University course closing slide. | *"We verified every component: 44 backend pytest cases with 100% risk engine branch coverage, 24 frontend Vitest suites, and a flawless Django deploy check. ORCA saves lives, prevents fuel burn, and decarbonizes fisheries. Built with passion at Bennett University for Sustainable Development Goal 14: Life Below Water. Thank you."* | Run `python -m pytest` and `pnpm test`. Display final summary slide. |

---

### Setup Instructions for Recording
1. Start backend: `python manage.py runserver 8000` (or `docker compose up`).
2. Start frontend: `pnpm dev`.
3. Open browser at `http://app.localtest.me:5173` (or `http://localhost:5173`).
4. Keep terminal split open on the right to demonstrate automated tests during narration.
