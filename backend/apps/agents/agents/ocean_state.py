from apps.agents.schemas import AgentResult, QueryContext
from apps.geodata.services import get_snapshots_for_point_window


def run_ocean_state_agent(ctx: QueryContext) -> AgentResult:
    """Specialist agent analyzing hydrodynamic ocean state (waves, swells, period)."""
    snapshots = get_snapshots_for_point_window(ctx.lat, ctx.lon, ctx.valid_from, ctx.valid_to)

    max_wave = None
    min_period = None
    sources = set()

    for s in snapshots:
        sources.add(s.source.slug)
        vals = s.values
        w = vals.get("wave_height_m")
        if w is not None:
            max_wave = max(max_wave, float(w)) if max_wave is not None else float(w)
        p = vals.get("wave_period_s")
        if p is not None:
            min_period = min(min_period, float(p)) if min_period is not None else float(p)

    gaps = []
    if max_wave is None:
        gaps.append("wave_height_unavailable")

    data = {
        "max_wave_height_m": max_wave,
        "min_wave_period_s": min_period,
    }

    return AgentResult(
        agent_name="ocean_state",
        data=data,
        sources=list(sources),
        gaps=gaps,
    )
