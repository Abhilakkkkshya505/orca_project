from apps.agents.schemas import AgentResult, QueryContext
from apps.geodata.services import get_snapshots_for_point_window


def run_weather_agent(ctx: QueryContext) -> AgentResult:
    """Specialist agent analyzing meteorological conditions (winds, gusts, precipitation)."""
    snapshots = get_snapshots_for_point_window(ctx.lat, ctx.lon, ctx.valid_from, ctx.valid_to)

    max_wind = None
    max_gust = None
    total_rain = 0.0
    sources = set()
    latest_issued = None

    for s in snapshots:
        sources.add(s.source.slug)
        if latest_issued is None or s.issued_at > latest_issued:
            latest_issued = s.issued_at
        vals = s.values
        w = vals.get("wind_speed_kmh")
        if w is not None:
            max_wind = max(max_wind, float(w)) if max_wind is not None else float(w)
        g = vals.get("wind_gust_kmh")
        if g is not None:
            max_gust = max(max_gust, float(g)) if max_gust is not None else float(g)
        r = vals.get("rain_mm")
        if r is not None:
            total_rain += float(r)

    gaps = []
    if max_wind is None:
        gaps.append("wind_speed_unavailable")

    data = {
        "max_wind_speed_kmh": max_wind,
        "max_wind_gust_kmh": max_gust,
        "total_rain_mm": round(total_rain, 1),
    }

    return AgentResult(
        agent_name="weather",
        data=data,
        sources=list(sources),
        gaps=gaps,
    )
