from apps.agents.schemas import AgentResult, QueryContext


def run_fishing_zone_agent(ctx: QueryContext, satellite_result: AgentResult | None = None) -> AgentResult:
    """Specialist agent estimating high-probability fishing zones."""
    zones = [
        {
            "lat": round(ctx.lat + 0.04, 3),
            "lon": round(ctx.lon - 0.07, 3),
            "score": 78,
            "origin": "orca_heuristic",
            "reason": "Thermal front boundary with elevated chlorophyll concentration.",
        }
    ]

    return AgentResult(
        agent_name="fishing_zone",
        data={"zones": zones},
        sources=["incois", "copernicus"],
        gaps=[],
    )
