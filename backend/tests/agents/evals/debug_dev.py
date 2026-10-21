import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
import django
django.setup()

from apps.agents.parser import parse_intent

eval_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chat_eval.jsonl")
with open(eval_path, "r", encoding="utf-8") as f:
    for line in f:
        item = json.loads(line)
        if item.get("split") == "dev":
            q = item["query"]
            intent = parse_intent(q)
            mismatches = []
            if intent.task != item["expected_task"]:
                mismatches.append(f"Task: expected {item['expected_task']} got {intent.task}")
            exp_p = item["expected_place"]
            if exp_p:
                if not any(exp_p.lower() in p.text.lower() or (p.port_slug and exp_p.lower() in p.port_slug.lower()) for p in intent.places):
                    mismatches.append(f"Place: expected {exp_p} got {[p.text for p in intent.places]}")
            elif intent.places:
                mismatches.append(f"Place: expected None got {[p.text for p in intent.places]}")
            if mismatches:
                print(f"QUERY: '{q}'")
                for m in mismatches:
                    print(f"  -> {m}")
