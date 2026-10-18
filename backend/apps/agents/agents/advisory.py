from apps.agents.schemas import AgentResult, QueryContext
from apps.geodata.services import get_active_advisories_for_point


def run_advisory_agent(ctx: QueryContext) -> AgentResult:
    """Specialist agent retrieving official IMD/INCOIS marine advisories covering query coordinates."""
    advs = get_active_advisories_for_point(ctx.lat, ctx.lon)
    data_list = [
        {
            "id": str(a.public_id),
            "headline": a.headline,
            "severity": a.severity,
            "source": a.source.slug,
            "expires_at": a.expires_at.isoformat(),
        }
        for a in advs
    ]

    return AgentResult(
        agent_name="advisory",
        data={"advisories": data_list, "count": len(data_list)},
        sources=["incois"],
        gaps=[],
    )
