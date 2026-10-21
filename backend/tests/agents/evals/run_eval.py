"""Evaluation runner for Task 3 Natural Language Understanding.

Part H1: Evaluates intent extraction accuracy on 80 hand-written queries
across 25 ports and 8 tasks. Reports task, place, and window accuracy
separately for the development set and held-out test set.
"""

import json
import os
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
import django
django.setup()

from apps.agents.parser import parse_intent


def run_evaluation(eval_filepath: str | None = None) -> dict:
    if eval_filepath is None:
        eval_filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chat_eval.jsonl")

    dev_samples = []
    held_out_samples = []

    with open(eval_filepath, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            item = json.loads(line)
            if item.get("split") == "held_out":
                held_out_samples.append(item)
            else:
                dev_samples.append(item)

    def evaluate_subset(samples, name: str):
        task_correct = 0
        place_correct = 0
        window_correct = 0
        total = len(samples)

        for item in samples:
            q = item["query"]
            exp_task = item["expected_task"]
            exp_place = item["expected_place"]
            exp_win = item["expected_window"]

            intent = parse_intent(q)

            # 1. Task check
            if intent.task == exp_task:
                task_correct += 1

            # 2. Place check
            if exp_place is None:
                if not intent.places:
                    place_correct += 1
            else:
                # check if any resolved place matches expected stem
                matched = False
                for p in intent.places:
                    if exp_place.lower() in p.text.lower() or (p.port_slug and exp_place.lower() in p.port_slug.lower()):
                        matched = True
                        break
                if matched:
                    place_correct += 1

            # 3. Window check
            if exp_win is None:
                window_correct += 1
            elif exp_win == "unsupported":
                if intent.needs_clarification and intent.needs_clarification.reason == "unsupported_window":
                    window_correct += 1
            else:
                win_label = intent.window.label if intent.window else ""
                if win_label and (exp_win.lower() in win_label.lower() or win_label.lower() in exp_win.lower()):
                    window_correct += 1

        task_acc = (task_correct / total) * 100 if total > 0 else 0
        place_acc = (place_correct / total) * 100 if total > 0 else 0
        window_acc = (window_correct / total) * 100 if total > 0 else 0

        print(f"\n--- {name} Set Evaluation ({total} samples) ---")
        print(f"  Task Accuracy   : {task_correct}/{total} ({task_acc:.1f}%)")
        print(f"  Place Accuracy  : {place_correct}/{total} ({place_acc:.1f}%)")
        print(f"  Window Accuracy : {window_correct}/{total} ({window_acc:.1f}%)")

        return {
            "total": total,
            "task_accuracy": task_acc,
            "place_accuracy": place_acc,
            "window_accuracy": window_acc,
        }

    dev_res = evaluate_subset(dev_samples, "Development (50%)")
    held_res = evaluate_subset(held_out_samples, "Held-Out Test (50%)")

    return {"dev": dev_res, "held_out": held_res}


if __name__ == "__main__":
    run_evaluation()
