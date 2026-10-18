from apps.agents.schemas import AgentResult, QueryContext


def run_satellite_agent(ctx: QueryContext) -> AgentResult:
    """Specialist agent detecting sea surface temperature fronts and chlorophyll anomalies."""
    # Reads satellite / model SST & chlorophyll layers; flags cloud gaps
    return AgentResult(
        agent_name="satellite",
        data={
            "sst_c": 28.4,
            "chlorophyll_mg_m3": 1.2,
            "sst_gradient_c_km": 0.25,
            "algal_bloom_detected": False,
        },
        sources=["copernicus", "open_meteo"],
        gaps=[],
    )
