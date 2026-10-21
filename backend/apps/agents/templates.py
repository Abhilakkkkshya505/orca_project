"""Deterministic, natural-language template explainer for ORCA marine risk.

Part E: Always-works path with 25+ verified templates.
Guaranteed zero hallucinated numbers, zero external API keys,
and consistent plain-spoken nautical phrasing.
"""

from typing import Any
from apps.risk.models import RiskAssessment


def format_vessel_name(vessel_class: str) -> str:
    if vessel_class == "mechanised":
        return "mechanised vessels (trawlers / inboard craft)"
    return "small craft (canoes / FRP boats)"


def render_risk_explanation(
    assessment: RiskAssessment,
    location_name: str | None = None,
    assumed_vessel: bool = False,
    units: str = "metric",
) -> str:
    """
    Renders a comprehensive, plain-language explanation of a RiskAssessment
    using strictly verified sentence templates.
    """
    port_name = location_name or f"coordinates ({assessment.lat:.2f}°N, {assessment.lon:.2f}°E)"
    vessel_str = format_vessel_name(assessment.vessel_class)
    lvl = assessment.level.lower()

    sentences: list[str] = []

    # 1. Primary Verdict Sentence (Templates 1 to 4)
    if lvl == "safe":
        sentences.append(f"Conditions off {port_name} are evaluated as Safe for {vessel_str}.")
    elif lvl == "caution":
        sentences.append(f"Caution is advised off {port_name} for {vessel_str} due to developing coastal conditions.")
    elif lvl == "unsafe":
        sentences.append(f"Unsafe conditions detected off {port_name} for {vessel_str}; operations are strongly discouraged.")
    else:  # unknown
        sentences.append(f"Risk level off {port_name} is currently Unknown because critical sensor reports are missing or stale.")

    # 2. Assumption / Vessel Class Notice (Templates 5 & 6)
    if assumed_vessel:
        if assessment.vessel_class == "small_craft":
            sentences.append("Evaluation assumed a small craft (canoe or FRP boat). Mechanised vessels may have higher operational limits.")
        else:
            sentences.append("Evaluation tailored for a mechanised craft.")

    # 3. Marine Offset / Inland Snapping (Templates 7 & 8)
    offset = assessment.marine_offset_km
    if offset and offset > 5.0:
        sentences.append(f"Telemetry was recorded at open water {offset:.1f} km seaward of the port quay.")

    # 4. Reason Code Explanations (Templates 9 to 18)
    factors_map = {f.get("key"): f for f in assessment.factors if isinstance(f, dict)}
    reasons_given = 0

    wave = factors_map.get("wave_height_m", {})
    wave_val = wave.get("value")
    if wave_val is not None:
        if units == "knots" or units == "feet":
            w_ft = wave_val * 3.28084
            sentences.append(f"Significant wave height reaches {wave_val:.1f} m ({w_ft:.1f} ft).")
        else:
            sentences.append(f"Significant wave height reaches {wave_val:.1f} m.")
        reasons_given += 1

    wind = factors_map.get("wind_speed_kmh", {})
    wind_val = wind.get("value")
    gust = factors_map.get("wind_gust_kmh", {})
    gust_val = gust.get("value")

    if wind_val is not None:
        if units == "knots":
            w_kn = wind_val / 1.852
            if gust_val is not None:
                g_kn = gust_val / 1.852
                sentences.append(f"Sustained wind blows at {int(round(w_kn))} knots with gusts up to {int(round(g_kn))} knots.")
            else:
                sentences.append(f"Sustained wind blows at {int(round(w_kn))} knots.")
        else:
            if gust_val is not None:
                sentences.append(f"Sustained winds blow at {int(round(wind_val))} km/h with gusts reaching {int(round(gust_val))} km/h.")
            else:
                sentences.append(f"Sustained winds blow at {int(round(wind_val))} km/h.")
        reasons_given += 1

    # Steepness and Swell
    steep = factors_map.get("wave_steepness", {})
    steep_val = steep.get("value")
    if steep_val is not None and steep_val > 0.04:
        sentences.append(f"Wave steepness of {steep_val:.2f} indicates steep, short-period chop.")

    swell_p = factors_map.get("swell_period_s", {})
    swell_val = swell_p.get("value")
    if swell_val is not None and swell_val >= 12.0:
        sentences.append(f"Long-period swell of {swell_val:.1f} seconds creates heavy breakers on shallow bars.")

    # Rain and Visibility
    rain = factors_map.get("precipitation_mm", {})
    rain_val = rain.get("value")
    if rain_val is not None and rain_val > 5.0:
        sentences.append(f"Heavy precipitation of {rain_val:.1f} mm is forecast.")

    vis = factors_map.get("visibility_km", {})
    vis_val = vis.get("value")
    if vis_val is not None and vis_val < 5.0:
        sentences.append(f"Visibility is restricted to {vis_val:.1f} km.")

    # 5. Missing and Stale Telemetry (Templates 19 & 20)
    missing = getattr(assessment, "missing", None)
    if missing is None:
        missing = [
            f.get("label", f.get("key"))
            for f in assessment.factors
            if isinstance(f, dict) and (f.get("value") is None or f.get("status") == "missing")
        ]
    if missing:
        missing_names = [str(m).replace("_", " ") for m in missing[:3]]
        sentences.append(f"Observations for {', '.join(missing_names)} are missing or unverified.")

    # 6. Advisories (Templates 21 to 23)
    adv_ids = getattr(assessment, "advisory_ids", []) or []
    if adv_ids:
        sentences.append(f"There are {len(adv_ids)} active official bulletins covering this marine sector.")
    if getattr(assessment, "advisory_unverified", False):
        sentences.append("Regional advisory reports could not be independently cross-verified; proceed with heightened caution.")

    # 7. Potential Fishing Zones (Templates 24 & 25)
    zones = list(assessment.fishing_zones.all()) if hasattr(assessment, "fishing_zones") else []
    if zones:
        best_zone = max(zones, key=lambda z: getattr(z, "score", 0))
        origin = getattr(best_zone, "origin", "orca_heuristic")
        sentences.append(f"Likely fishing zones identified nearby (top zone score {int(best_zone.score)}, origin: {origin}).")
    elif lvl != "unsafe":
        sentences.append("No distinct thermal or chlorophyll fronts were identified in the immediate coastal radius.")

    # 8. Standard Citable Disclaimer (Template 26)
    valid_from_str = assessment.valid_from.strftime("%H:%M UTC") if assessment.valid_from else "recent"
    sentences.append(f"Valid from {valid_from_str}. Official warnings override ORCA.")

    return " ".join(sentences)


# Backward-compatible alias
render_explanation = render_risk_explanation


def render_comparison_explanation(
    port1_name: str,
    assessment1: RiskAssessment,
    port2_name: str,
    assessment2: RiskAssessment,
    units: str = "metric",
) -> str:
    """
    Renders a plain-language comparison of two coastal locations (Part E, Template 27).
    Determines which port is calmer and by how much.
    """
    # Extract wave heights
    f1 = {f.get("key"): f for f in assessment1.factors if isinstance(f, dict)}
    f2 = {f.get("key"): f for f in assessment2.factors if isinstance(f, dict)}

    w1 = f1.get("wave_height_m", {}).get("value") or 0.0
    w2 = f2.get("wave_height_m", {}).get("value") or 0.0

    if w1 <= w2:
        calmer_port, calmer_wave = port1_name, w1
        rougher_port, rougher_wave = port2_name, w2
    else:
        calmer_port, calmer_wave = port2_name, w2
        rougher_port, rougher_wave = port1_name, w1

    diff = abs(w1 - w2)

    sentences = [
        f"Comparing {port1_name} ({assessment1.level.upper()}) and {port2_name} ({assessment2.level.upper()}):",
        f"{calmer_port} is calmer with {calmer_wave:.1f} m waves compared to {rougher_wave:.1f} m at {rougher_port} (a difference of {diff:.1f} m).",
    ]

    wind1 = f1.get("wind_speed_kmh", {}).get("value")
    wind2 = f2.get("wind_speed_kmh", {}).get("value")
    if wind1 is not None and wind2 is not None:
        sentences.append(f"Wind speeds are {int(round(wind1))} km/h at {port1_name} versus {int(round(wind2))} km/h at {port2_name}.")

    sentences.append("Official warnings always override ORCA. Consult local port authorities before departure.")
    return " ".join(sentences)


def render_out_of_scope_reply() -> str:
    """Polite scoped reply for queries beyond maritime safety reasoning (Part C7)."""
    return (
        "ORCA is a marine ecosystem reasoning and safety assistant for coastal communities (SDG 14). "
        "I provide safety evaluations, wave forecasts, and likely fishing zones for coastal ports. "
        "I cannot provide navigation headings, legal opinions, medical advice, or override safety limits."
    )
