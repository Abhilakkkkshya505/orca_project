"""Evaluation reporting and model card generation for ORCA ML models."""

from typing import Dict, Any, List, Optional
import json
import yaml


def evaluate_adoption_gate(
    model_id: str,
    gate_config: Dict[str, Any],
    model_metrics: Dict[str, Any],
    baseline_metrics: Dict[str, Dict[str, float]],
) -> Dict[str, Any]:
    """Check if model satisfies frozen gate conditions against baselines.
    
    Returns gate decision dictionary with status and individual check results.
    """
    model_gate = gate_config.get("models", {}).get(model_id, {})
    rules = model_gate.get("metric_rules", model_gate.get("frozen_criteria", {}))
    
    checks = []
    all_passed = True
    
    # 1. Delta PR-AUC check
    if "pr_auc_relative_improvement_min" in rules or "pr_auc_delta_vs_best_baseline" in rules:
        required_delta = rules.get("pr_auc_relative_improvement_min", rules.get("pr_auc_delta_vs_best_baseline", 0.10))
        model_pr = model_metrics.get("pr_auc", 0.0)
        best_baseline_pr = max(
            b.get("pr_auc", 0.0) for b in baseline_metrics.values()
        ) if baseline_metrics else 0.0
        actual_delta = model_pr - best_baseline_pr
        passed = actual_delta >= required_delta
        checks.append({
            "criterion": "pr_auc_improvement",
            "required": f">= +{required_delta:.2f}",
            "actual": f"+{actual_delta:.4f} (Model: {model_pr:.4f}, Best Baseline: {best_baseline_pr:.4f})",
            "passed": bool(passed)
        })
        if not passed:
            all_passed = False

    # 2. Delta Top-20% Hit Rate check
    if "top20_hit_rate_improvement_pp_min" in rules or "top_20_hit_rate_delta_vs_b2" in rules:
        required_delta = rules.get("top20_hit_rate_improvement_pp_min", rules.get("top_20_hit_rate_delta_vs_b2", 0.05))
        model_hit = model_metrics.get("top_20_hit_rate", 0.0)
        b2_hit = baseline_metrics.get("b2_heuristic", {}).get("top_20_hit_rate", 0.0)
        actual_delta = model_hit - b2_hit
        passed = actual_delta >= required_delta
        checks.append({
            "criterion": "top_20_hit_rate_improvement",
            "required": f">= +{required_delta:.2f}",
            "actual": f"+{actual_delta:.4f} (Model: {model_hit:.4f}, B2: {b2_hit:.4f})",
            "passed": bool(passed)
        })
        if not passed:
            all_passed = False

    # 3. Maximum ECE check
    if "ece_max" in rules or "max_ece" in rules:
        max_ece = rules.get("ece_max", rules.get("max_ece", 0.08))
        actual_ece = model_metrics.get("ece", 1.0)
        passed = actual_ece <= max_ece
        checks.append({
            "criterion": "max_ece",
            "required": f"<= {max_ece:.2f}",
            "actual": f"{actual_ece:.4f}",
            "passed": bool(passed)
        })
        if not passed:
            all_passed = False

    # 4. Latency check
    if "max_inference_ms" in rules or "p95_inference_ms" in rules:
        max_latency = rules.get("max_inference_ms", rules.get("p95_inference_ms", 5.0))
        actual_lat = model_metrics.get("p95_inference_ms", 0.0)
        passed = actual_lat <= max_latency
        checks.append({
            "criterion": "max_inference_ms",
            "required": f"<= {max_latency}ms",
            "actual": f"{actual_lat:.2f}ms",
            "passed": bool(passed)
        })
        if not passed:
            all_passed = False

    # 5. Macro F1 delta for intent
    if "macro_f1_improvement_points_min" in rules or "macro_f1_delta_vs_rules" in rules:
        req_delta = rules.get("macro_f1_improvement_points_min", rules.get("macro_f1_delta_vs_rules", 0.03))
        model_f1 = model_metrics.get("macro_f1", 0.0)
        rule_f1 = baseline_metrics.get("rules", {}).get("macro_f1", 0.0)
        actual_delta = model_f1 - rule_f1
        passed = actual_delta >= req_delta
        checks.append({
            "criterion": "macro_f1_improvement",
            "required": f">= +{req_delta:.2f}",
            "actual": f"+{actual_delta:.4f} (Model: {model_f1:.4f}, Rules: {rule_f1:.4f})",
            "passed": bool(passed)
        })
        if not passed:
            all_passed = False

    # 6. Min class recall
    if "min_class_recall" in rules:
        min_recall_req = rules["min_class_recall"]
        actual_min_recall = model_metrics.get("min_class_recall", 0.0)
        passed = actual_min_recall >= min_recall_req
        checks.append({
            "criterion": "min_class_recall",
            "required": f">= {min_recall_req:.2f}",
            "actual": f"{actual_min_recall:.4f}",
            "passed": bool(passed)
        })
        if not passed:
            all_passed = False

    # 7. Model artifact size
    if "max_artifact_size_mb" in rules or "max_artifact_mb" in rules:
        max_mb = rules.get("max_artifact_size_mb", rules.get("max_artifact_mb", 20.0))
        actual_mb = model_metrics.get("artifact_size_mb", 0.0)
        passed = actual_mb <= max_mb
        checks.append({
            "criterion": "max_artifact_size_mb",
            "required": f"<= {max_mb} MB",
            "actual": f"{actual_mb:.2f} MB",
            "passed": bool(passed)
        })
        if not passed:
            all_passed = False

    status = "active" if all_passed else "not_adopted"
    
    return {
        "model_id": model_id,
        "all_passed": all_passed,
        "status": status,
        "checks": checks,
        "model_metrics": model_metrics,
        "baseline_metrics": baseline_metrics,
    }


def generate_model_card_markdown(card_data: Dict[str, Any]) -> str:
    """Generate a clean GitHub-style Markdown model card."""
    lines = [
        f"# Model Card: {card_data.get('name', card_data.get('model_id'))}",
        f"**Model ID:** `{card_data.get('model_id')}`  ",
        f"**Status:** `{card_data.get('status')}`  ",
        f"**Version:** `{card_data.get('version', '1.0.0')}`  ",
        f"**Last Updated:** `{card_data.get('last_updated', '2026-10-21')}`  \n",
        "## 1. Intended Use and Scope",
        f"{card_data.get('intended_use', 'Ecosystem reasoning and advisory within ORCA platform.')}\n",
        "## 2. Training Data and Provenance",
        f"{card_data.get('training_data_summary', 'Detailed in DataManifest.')}\n",
        "## 3. Evaluation & Adoption Gate",
        "| Criterion | Required | Actual | Passed |",
        "|---|---|---|:---:|"
    ]
    
    for check in card_data.get("checks", []):
        icon = "✅" if check["passed"] else "❌"
        lines.append(f"| {check['criterion']} | {check['required']} | {check['actual']} | {icon} |")
        
    lines.append("\n## 4. Baselines Comparison")
    lines.append("| Model / Baseline | PR-AUC | ROC-AUC | Top-20% Hit Rate | ECE |")
    lines.append("|---|---|---|---|---|")
    
    m_met = card_data.get("model_metrics", {})
    lines.append(
        f"| **Candidate Model** | **{m_met.get('pr_auc', 0):.4f}** | **{m_met.get('roc_auc', 0):.4f}** | **{m_met.get('top_20_hit_rate', 0):.4f}** | **{m_met.get('ece', 0):.4f}** |"
    )
    for b_name, b_met in card_data.get("baseline_metrics", {}).items():
        lines.append(
            f"| {b_name} | {b_met.get('pr_auc', 0):.4f} | {b_met.get('roc_auc', 0):.4f} | {b_met.get('top_20_hit_rate', 0):.4f} | {b_met.get('ece', 0):.4f} |"
        )
        
    lines.append("\n## 5. Limitations & Ethical Considerations")
    lines.append(card_data.get("limitations", "- Not for sole navigation or maritime legal enforcement.\n- Subject to satellite cloud cover gaps."))
    
    return "\n".join(lines)
