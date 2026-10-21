"""Audit script for Task 3: Diagnosing chat layers."""

import json
import os
import sys
import time
from datetime import UTC, datetime, timedelta

import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
django.setup()

from apps.agents.orchestrator import Orchestrator
from apps.chat.models import Thread
from apps.ports.models import Port
from apps.risk.services import evaluate_and_record_risk
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

def diagnose_layer_1_risk_service():
    print("\n--- Layer 1: Risk Service for Port Slug ---")
    start = time.perf_counter()
    port = Port.objects.filter(slug__icontains="mumbai").first()
    if not port:
        print("FAIL: Port with slug containing 'mumbai' not found in database")
        return False
    
    print(f"Found port: '{port.name}' (slug: {port.slug}, lat: {port.lat}, lon: {port.lon})")
    now = datetime.now(UTC)
    assessment = evaluate_and_record_risk(
        lat=port.lat,
        lon=port.lon,
        valid_from=now,
        valid_to=now + timedelta(hours=12),
        vessel_class="small_craft"
    )
    elapsed = (time.perf_counter() - start) * 1000
    print(f"PASS: Mumbai risk evaluated in {elapsed:.1f}ms: level={assessment.level}, marine_offset={assessment.marine_offset_km}km")
    return True

def diagnose_layer_2_orchestrator():
    print("\n--- Layer 2: Orchestrator with Query ---")
    start = time.perf_counter()
    orch = Orchestrator()
    events = []
    t0 = time.perf_counter()
    for evt in orch.process_query("Is it safe in Kochi tomorrow morning?"):
        t_evt = (time.perf_counter() - t0) * 1000
        events.append((evt["event"], t_evt, evt.get("data", {})))
    
    elapsed = (time.perf_counter() - start) * 1000
    print(f"Total orchestrator events: {len(events)} in {elapsed:.1f}ms")
    for name, t, data in events:
        summary = str(data)[:60]
        print(f"  +{t:6.1f}ms: [{name}] {summary}")
    return True

def diagnose_layer_3_sse_view():
    print("\n--- Layer 3: SSE View Stream Timing ---")
    user, _ = User.objects.get_or_create(email="diag_user@orca.local", defaults={"display_name": "Diag User"})
    client = APIClient()
    client.force_authenticate(user=user)
    
    # 1. Create thread
    t_resp = client.post("/api/v1/chat/threads/", {"title": "Diag Stream Test"}, format="json")
    assert t_resp.status_code == 201, f"Thread creation failed: {t_resp.status_code} {t_resp.data}"
    thread_id = t_resp.data["id"]
    
    # 2. Stream message
    t_start = time.perf_counter()
    resp = client.post(
        f"/api/v1/chat/threads/{thread_id}/messages/",
        {"content": "Is it safe off Mumbai today?", "vessel_class": "small_craft"},
        format="json",
    )
    
    print(f"Response status: {resp.status_code}, Content-Type: {resp.get('Content-Type')}")
    assert resp.status_code == 200, f"Streaming endpoint failed: {resp.status_code}"
    
    first_event_ms = None
    event_timeline = []
    
    for chunk in resp.streaming_content:
        now_ms = (time.perf_counter() - t_start) * 1000
        if first_event_ms is None:
            first_event_ms = now_ms
        chunk_str = chunk.decode("utf-8") if isinstance(chunk, bytes) else chunk
        lines = chunk_str.strip().split("\n")
        evt_type = "unknown"
        for l in lines:
            if l.startswith("event: "):
                evt_type = l[7:].strip()
        event_timeline.append((evt_type, now_ms))
        print(f"  +{now_ms:6.1f}ms: event={evt_type}")
    
    print(f"First event elapsed: {first_event_ms:.1f}ms (target: < 500ms)")
    passed = first_event_ms is not None and first_event_ms < 500
    print(f"First event < 500ms check: {'PASS' if passed else 'FAIL'}")
    return passed

if __name__ == "__main__":
    l1 = diagnose_layer_1_risk_service()
    l2 = diagnose_layer_2_orchestrator()
    l3 = diagnose_layer_3_sse_view()
    print(f"\nDiagnostic summary: L1={l1}, L2={l2}, L3={l3}")
