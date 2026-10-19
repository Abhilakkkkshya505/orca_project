# LinkedIn Project Showcase Post

**Copy & Paste for LinkedIn:**

🌊 **Can Generative AI be trusted on open waters where a hallucinated number can cost a life?**

Over 4 million artisanal fishers along India’s 7,500 km coastline head to sea in small craft (<12m canoes and FRP boats). Every monsoon, unpredictable squalls and high swell surges lead to hundreds of avoidable maritime fatalities.

While national agencies like INCOIS and IMD generate world-class oceanographic predictions, translating raw wave heights and wind speed charts into a definitive "go / no-go" departure decision on a pitching boat under bright sun glare is daunting. But asking a standard AI chatbot is even more dangerous—they hallucinate.

To solve this, our team at Bennett University developed **Project ORCA (Oceanic Reasoning & Coastal Assistant)** for UN **Sustainable Development Goal 14 (Life Below Water)**. 🐋

🚀 **How ORCA Works (The Hybrid Deterministic-Agentic Architecture):**

1️⃣ **The LLM Never Decides Risk:** Safety ratings are calculated exclusively by a pure, deterministic rules engine in Python (`rules.py`). It contains zero DB reads, zero clock reads, and zero LLM calls. Missing or stale data evaluates strictly to `UNKNOWN`, never defaulting to `SAFE`. Active cyclone or high-wave bulletins instantly force an `UNSAFE` rating.

2️⃣ **Adversarial Number Validation:** Specialist AI agents (Weather, Ocean State, Satellite, Advisory) feed an orchestrator that explains the risk over Server-Sent Events (SSE). Before any token reaches the user, an anti-hallucination regex validator checks that every generated number matches authorized telemetry. If an unsupported number appears, it is rejected on the spot.

3️⃣ **Zero-Network User Requests:** Ingestion tasks run asynchronously in the background via Celery, fetching telemetry from Open-Meteo, Copernicus, and INCOIS. User queries never block on third-party APIs.

4️⃣ **Extreme Outdoor Usability & Offline Resilience:** A high-contrast nautical UI (>7:1 contrast ratio, WCAG 2.1 AA) pairs color with custom geometric shapes (circle, diamond, octagon) so colorblind users are never dependent on color alone.

5️⃣ **Offline Sea Game:** When miles offshore beyond 4G cellular range, our Service Worker serves a standalone `offline.html` showing the last cached coastal advisory and an interactive HTML5 canvas underwater mini-game that runs at 60 fps with zero garbage collection allocations.

📊 **Engineering & Validation Highlights:**
✅ 44 / 44 Backend Pytest tests passing (100% branch coverage on the risk engine)
✅ 24 / 24 Frontend Vitest unit & component suites passing
✅ Flawless Django production deployment audit (`check --deploy`)
✅ Decoupled full-stack: React 19 + TypeScript + Tailwind + MapLibre GL + Django 5 + PostGIS + Redis + Celery + Cloudflare Zero Trust.

A huge thank you to our professors and mentors at Bennett University for guiding us through this journey in Technology and Sustainability (2026CSAE102)!

Check out our repository and code walkthrough:
🔗 GitHub: https://github.com/Abhilakkkkshya505/orca_project.git

#ArtificialIntelligence #MarineSafety #SDG14 #OceanConservation #Sustainability #FullStack #Python #Django #React #TypeScript #PostGIS #BennettUniversity #Cloudflare #TechForGood #CleanCode
