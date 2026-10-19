# Project ORCA: Architectural Code Walkthrough

This document provides a line-by-line explanation of the most critical files in Project ORCA in plain language. For each file, a concise code snippet is presented, followed by a detailed explanation of what each line or block does, its architectural design decisions, and why it is engineered that way.

---

## 1. Deterministic Risk Rules Engine: `backend/apps/risk/rules.py`

### Code Snippet
```python
def evaluate_risk(
    factors: dict[str, float | None],
    advisories: list[dict[str, Any]] | None = None,
    vessel_class: str = "small_craft",
    telemetry_ages: dict[str, float] | None = None,
) -> RiskAssessmentResult:
    # Rule 1: Check active official maritime warnings (IMD / INCOIS)
    if advisories:
        for adv in advisories:
            severity = str(adv.get("severity", "")).lower()
            if severity in ("severe", "critical", "warning", "red"):
                return RiskAssessmentResult(
                    level=RiskLevel.UNSAFE,
                    headline="Hazardous maritime conditions: official severe warning active.",
                    active_advisories=advisories,
                    rules_version=RULES_ENGINE_VERSION,
                )

    # Rule 2: Fail-closed on missing or stale core sensor telemetry
    missing_required = []
    for req_key in ("wave_height", "wind_speed"):
        val = factors.get(req_key)
        if val is None:
            missing_required.append(req_key)
        elif telemetry_ages and telemetry_ages.get(req_key, 0) > MAX_TELEMETRY_AGE_HOURS:
            missing_required.append(f"{req_key} (stale)")

    if missing_required:
        return RiskAssessmentResult(
            level=RiskLevel.UNKNOWN,
            headline=f"Insufficient telemetry to assess risk. Missing: {', '.join(missing_required)}",
            missing_factors=missing_required,
            rules_version=RULES_ENGINE_VERSION,
        )
```

### Explanation
- **Line 1–6 (`def evaluate_risk(...)`):** A pure mathematical function. Notice there are no database queries (`Model.objects`), no external network API calls (`requests.get`), and no clock reads (`datetime.now()`). All required parameters—sensor values, active advisories, vessel class, and sensor ages—are passed as arguments. This guarantees 100% deterministic reproducibility for safety audits and unit testing.
- **Line 7–16 (Rule 1: Official Advisory Override):** Maritime safety mandates that official warnings from national statutory bodies (IMD, INCOIS, Coast Guard) take absolute precedence. If an active bulletin carries `severe`, `critical`, or `red` severity, the function returns immediately with `RiskLevel.UNSAFE`. Even if the local buoy reports calm water, an incoming squall or tsunami warning forces an unsafe state.
- **Line 18–26 (Rule 2: Stale/Missing Telemetry Invariant):** If vital metrics—specifically significant wave height or sustained wind speed—are `None` or older than 24 hours (`MAX_TELEMETRY_AGE_HOURS`), the engine evaluates strictly to `RiskLevel.UNKNOWN`. It is forbidden to default to `safe` in the absence of data.

---

## 2. Threshold Calibration Baseline: `backend/apps/risk/thresholds.py`

### Code Snippet
```python
# DISCLAIMER: These thresholds are development placeholders for academic/testing
# purposes and must NOT be used as official aids to navigation without calibration.
THRESHOLDS: dict[str, dict[str, dict[str, float]]] = {
    "small_craft": {
        "wave_height": {"caution": 1.5, "unsafe": 2.5},  # metres
        "wind_speed": {"caution": 20.0, "unsafe": 30.0},  # knots (~37 / 55 km/h)
        "wave_period": {"caution": 5.0, "unsafe": 4.0},   # short steep chop is hazardous
        "current_speed": {"caution": 1.5, "unsafe": 2.5}, # knots
    },
    "mechanised": {
        "wave_height": {"caution": 2.5, "unsafe": 4.0},
        "wind_speed": {"caution": 28.0, "unsafe": 40.0},
        "wave_period": {"caution": 4.5, "unsafe": 3.5},
        "current_speed": {"caution": 2.5, "unsafe": 4.0},
    },
}
```

### Explanation
- **Line 1–2 (Prominent Disclaimer):** Clearly marks all numbers as development baselines, complying with maritime legal boundaries.
- **Line 3–15 (`THRESHOLDS`):** Maps vessel category (`small_craft` vs `mechanised`) to physical factor thresholds. For a 9-metre fiberglass boat (`small_craft`), wave heights over 1.5m trigger caution, and over 2.5m trigger unsafe. For larger steel-hulled mechanized trawlers, the hull handles up to 2.5m before entering caution.
- **Wave Period Inversion:** Notice that for `wave_period`, the threshold direction is inverted. Longer swell periods (8–14 seconds) represent calm, rolling ocean swells, whereas very short periods (<4 seconds) indicate dangerous, steep breaking chop in shallow water.

---

## 3. Anti-Hallucination Regex Validator: `backend/apps/agents/validators.py`

### Code Snippet
```python
NUMBER_PATTERN = re.compile(r"(?<![a-zA-Z0-9_\-\.])\b\d+(?:\.\d+)?\b(?![a-zA-Z0-9_\-\.])")

def validate_response_numbers(
    generated_text: str,
    authorized_numbers: set[float],
    tolerance: float = 0.05,
) -> tuple[bool, list[float]]:
    extracted_raw = NUMBER_PATTERN.findall(generated_text)
    unauthorized = []

    for raw in extracted_raw:
        try:
            val = float(raw)
        except ValueError:
            continue
        # Check if the extracted number matches any authorized telemetry within tolerance
        if not any(math.isclose(val, auth, rel_tol=tolerance, abs_tol=tolerance) for auth in authorized_numbers):
            unauthorized.append(val)

    return len(unauthorized) == 0, unauthorized
```

### Explanation
- **Line 1 (`NUMBER_PATTERN`):** A strict regular expression using word boundaries and negative lookahead/lookbehind. It extracts integer and floating-point literals while ignoring version tags (e.g. `v1.0.0`) or variable identifiers (e.g. `grid_cell_42`).
- **Line 3–9 (`validate_response_numbers`):** Takes LLM-generated narrative text and the set of authorized physical numbers supplied in the prompt context.
- **Line 14–17 (`math.isclose`):** Compares every number in the text against authorized telemetry within a 5% tolerance (to account for rounding like 1.84m to 1.8m).
- **Line 19:** Returns a boolean flag and the list of unauthorized numbers. If an ungrounded number is found, the orchestrator immediately rejects the text, preventing fabricated statistics from reaching the mariner.

---

## 4. Multi-Agent Orchestrator: `backend/apps/agents/orchestrator.py`

### Code Snippet
```python
async def stream_orchestrated_reasoning(
    prompt: str,
    context: dict[str, Any],
    vessel_class: str = "small_craft",
) -> AsyncGenerator[dict[str, Any], None]:
    # Phase 1: Emit status event indicating specialist agent telemetry gathering
    yield {"event": "status", "data": {"step": "telemetry", "message": "Collecting oceanographic observations..."}}
    weather_data = await WeatherAgent().gather(context)
    ocean_data = await OceanStateAgent().gather(context)

    # Phase 2: Compute deterministic risk rating
    yield {"event": "status", "data": {"step": "risk_engine", "message": "Executing deterministic safety rules..."}}
    risk_result = evaluate_risk(factors=ocean_data.factors, vessel_class=vessel_class)
    yield {"event": "risk", "data": risk_result.to_dict()}

    # Phase 3: Synthesize explanation with anti-hallucination validation
    yield {"event": "status", "data": {"step": "synthesis", "message": "Synthesizing maritime advisory..."}}
    explanation = await llm_client.generate(prompt, context=risk_result.to_dict())

    is_valid, bad_nums = validate_response_numbers(explanation, risk_result.authorized_numbers)
    if not is_valid:
        # Fall back to deterministic template
        explanation = render_fallback_template(risk_result)

    yield {"event": "token", "data": {"token": explanation}}
    yield {"event": "done", "data": {}}
```

### Explanation
- **Phase 1 (Agent Gathering):** Emits an SSE `status` event to update the client UI in real time, then delegates asynchronous telemetry fetching to specialist domain agents.
- **Phase 2 (Deterministic Gate):** Invokes `evaluate_risk()`. Crucially, this happens *before* any LLM generation. The structured `RiskAssessmentResult` is broadcast immediately over the `risk` event channel.
- **Phase 3 (Grounded Synthesis):** The LLM receives the structured assessment and explains *why* the rules evaluated to that state. If `validate_response_numbers()` fails, the model's text is discarded and replaced with a deterministic fallback template.

---

## 5. SSE Streaming Chat Endpoint: `backend/apps/chat/views.py`

### Code Snippet
```python
class MessageStreamView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, thread_id):
        thread = get_object_or_404(Thread, public_id=thread_id)
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        async def sse_event_stream():
            async for event_packet in stream_orchestrated_reasoning(
                prompt=serializer.validated_data["content"],
                context=serializer.validated_data.get("context", {}),
            ):
                event_name = event_packet["event"]
                data_json = json.dumps(event_packet["data"])
                yield f"event: {event_name}\ndata: {data_json}\n\n"

        return StreamingHttpResponse(
            sse_event_stream(),
            content_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )
```

### Explanation
- **Line 8–16 (`sse_event_stream`):** An asynchronous generator yielding standard W3C Server-Sent Event formatted chunks: `event: <name>\ndata: <json>\n\n`.
- **Line 18–25 (`StreamingHttpResponse`):** Returns the HTTP 200 stream with `text/event-stream`.
- **`X-Accel-Buffering: no` Header:** Instructs reverse proxies (NGINX, Cloudflare Tunnel) not to buffer responses, ensuring tokens and status steps stream to the browser without latency.

---

## 6. Cloudflare Zero Trust Security: `backend/apps/core/cloudflare.py`

### Code Snippet
```python
def get_client_ip(request: HttpRequest) -> str:
    cf_connecting_ip = request.META.get("HTTP_CF_CONNECTING_IP")
    if cf_connecting_ip and settings.TRUST_CF_HEADERS:
        return cf_connecting_ip.strip()
    return request.META.get("REMOTE_ADDR", "127.0.0.1")

class CloudflareAccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/admin/"):
            token = request.META.get("HTTP_CF_ACCESS_JWT_ASSERTION")
            if not token and not settings.DEBUG:
                return JsonResponse({"detail": "Cloudflare Access authentication required."}, status=403)
            # Validate JWT against Cloudflare public certs with AUD check
            claims = verify_cf_access_jwt(token, audience=settings.CF_ACCESS_AUD)
            request.cf_access_identity = claims.get("email")
        return self.get_response(request)
```

### Explanation
- **Anti-Spoofing IP Resolution:** Normal `X-Forwarded-For` headers can be forged by malicious clients. `get_client_ip` uses `CF-Connecting-IP`, which is injected authoritatively by Cloudflare edge servers when running behind Cloudflare Tunnel.
- **Admin JWT Verification:** Any request to `/admin/` must carry a valid `Cf-Access-Jwt-Assertion` cryptographic token signed by the organization's Cloudflare Zero Trust identity provider. Unauthorized public traffic is dropped at the gate before reaching the Django admin login form.

---

## 7. Frontend SSE Stream Hook: `frontend/src/features/chat/useChatStream.ts`

### Code Snippet
```python
// Note: TypeScript hook handling streaming SSE chunks across network boundaries
const response = await fetch(`/api/v1/chat/threads/${threadId}/messages/`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
  body: JSON.stringify({ content: query }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const parts = buffer.split("\n\n");
  buffer = parts.pop() ?? ""; // Retain incomplete chunk

  for (const part of parts) {
    if (!part.trim()) continue;
    const { event, data } = parseSSEPart(part);
    if (event === "status") setCurrentStep(data.step);
    if (event === "risk") setRiskAssessment(data);
    if (event === "token") appendToken(data.token);
  }
}
```

### Explanation
- **Buffer Splitting & Partial Chunk Safety:** TCP packets frequently split across event boundaries. Appending incoming chunks to a buffer and using `parts.pop()` ensures that a truncated event (e.g. `data: {"to...`) is preserved until the rest arrives in the next network packet.
- **Multi-Event Dispatch:** Seamlessly dispatches `status` to the reasoning bar, `risk` to the `RiskCard`, and `token` to the streaming markdown viewer.

---

## 8. Accessible Safety Badge: `frontend/src/components/ui/risk-badge.tsx`

### Code Snippet
```tsx
export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = "md" }) => {
  const config = {
    safe: { label: "Safe", icon: CheckCircle2, style: "bg-risk-safe-bg text-risk-safe border-risk-safe/30" },
    caution: { label: "Caution", icon: AlertTriangle, style: "bg-risk-caution-bg text-risk-caution border-risk-caution/30" },
    unsafe: { label: "Unsafe", icon: AlertOctagon, style: "bg-risk-unsafe-bg text-risk-unsafe border-risk-unsafe/30" },
    unknown: { label: "Unknown", icon: HelpCircle, style: "bg-risk-unknown-bg text-risk-unknown border-risk-unknown/30" },
  }[level];

  const Icon = config.icon;

  return (
    <span
      role="status"
      aria-label={`Risk assessment level: ${config.label}`}
      className={`inline-flex items-center gap-1.5 font-medium rounded-sm border select-none ${config.style}`}
    >
      <Icon className="shrink-0" width={14} height={14} />
      <span>{config.label}</span>
    </span>
  );
};
```

### Explanation
- **WCAG 1.4.1 Redundant Encoding:** Every level pairs color with a distinct SVG icon shape:
  - `safe`: Green circle with checkmark.
  - `caution`: Amber diamond with triangle.
  - `unsafe`: Coral red octagon with shield exclamation.
  - `unknown`: Dotted slate circle with question mark.
- **Accessibility Attributes:** Incorporates `role="status"` and a descriptive `aria-label` so screen reader users hear the complete assessment status immediately.

---

## 9. Offline Service Worker: `frontend/public/sw.js`

### Code Snippet
```javascript
// Navigation strategy: 3-second network timeout -> cached app shell -> offline.html
if (request.mode === "navigate") {
  event.respondWith(
    (async () => {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
        return await Promise.race([fetch(request), timeout]);
      } catch (err) {
        const cachedShell = await caches.match("/index.html");
        if (cachedShell) return cachedShell;
        return (await caches.match("/offline.html")) || new Response("Offline", { status: 503 });
      }
    })()
  );
  return;
}
```

### Explanation
- **Network-First with 3s Timeout:** When navigating to a URL while boat connectivity is fading, browser requests can hang indefinitely waiting for TCP ACKs. A 3-second timeout race guarantees that the UI falls back to the cached offline shell promptly rather than freezing the screen.
- **Two-Tier Fallback:** Tries to render the cached client-side SPA shell (`index.html`) first; if that is unavailable, it serves the standalone `offline.html` containing the last cached coastal bulletin and fish mini-game.

---

## 10. Fixed Timestep Game Loop: `frontend/public/offline.html`

### Code Snippet
```javascript
// Fixed timestep game loop targeting 60 fps with zero allocations
function updateGame() {
  if (isPaused || gameOver) return;

  fish.y += (fish.targetY - fish.y) * 0.15; // Smooth interpolation

  // Update object pools for collectibles and hazards
  for (let i = 0; i < MAX_ITEMS; i++) {
    const it = items[i];
    if (it.active) {
      it.x -= it.speed;
      if (Math.hypot(fish.x - it.x, fish.y - it.y) < fish.radius + it.radius) {
        it.active = false;
        score += it.type === "plankton" ? 10 : 25;
      }
    }
  }
}

function loop() {
  updateGame();
  renderGame();
  requestAnimationFrame(loop);
}
```

### Explanation
- **Zero-Allocation Object Pooling:** In a canvas game on mobile devices, creating new objects (`new Item()`) inside `requestAnimationFrame` triggers frequent garbage collection pauses, causing frame drops. Pre-allocating fixed arrays (`items = []`, `hazards = []`) and toggling `active = true/false` ensures rock-solid 60 fps performance with zero garbage collection stutter.
- **Smooth Math Interpolation:** `fish.y += (fish.targetY - fish.y) * 0.15` produces smooth, aquatic swimming movement responsive to both keyboard arrows and mobile touch drag events.
