# How to use these prompts

## Order (do not skip, do not combine)

| Step | Paste into Antigravity | Done when |
|---|---|---|
| 0 | 00-CONTEXT-BLOCK + TASK-0-stabilise-keys-providers | `verify-task0.ps1` all PASS, `check_providers` table shows which keys work |
| 1 | 00-CONTEXT-BLOCK + TASK-1-ports-and-location | `verify-task1.ps1` all PASS, different ports give different results |
| 2 | 00-CONTEXT-BLOCK + TASK-2-data-pipelines-risk-engine | `verify-task2.ps1` all PASS, real data stored, risk engine 100% branch coverage |
| 3 | 00-CONTEXT-BLOCK + TASK-3-chat-assistant | `verify-task3.ps1` all PASS, chat works with no keys |
| 4 | 00-CONTEXT-BLOCK + TASK-4-train-the-models | `verify-task4.ps1` printed real metrics and gate results |
| 5 | 00-CONTEXT-BLOCK + TASK-5-full-frontend | `verify-task5.ps1` all PASS, every route exists |
| 6 | 00-CONTEXT-BLOCK + TASK-6-offline-security-final-qa | `verify-all.ps1` all PASS, FINAL-AUDIT.md written |

## Before Task 0
1. Put the 20 spec docs from `orca-docs.zip` in the `Files` folder.
2. Copy `backend.env.keys.template` into `backend\.env` and fill in the keys you have. Missing keys are fine. The app disables that provider and says so.
3. Never paste a real key into a chat or a prompt.

## Between tasks
- Paste the agent's final report back to me if anything says PARTIAL, FAIL or SKIPPED. I will write a targeted fix prompt.
- If the agent stops mid-task, send: `Resume from PROGRESS.md. Finish the unfinished items of the current task. Do not redo finished work.`
- If the agent says "done" without the verify script output, reply: `Run scripts\verify-taskN.ps1 and paste the complete output.`

## What changed from v1
- 7 smaller tasks instead of 4, each with its own verify script.
- Task 0 fixes the boot problems and checks every API key before anything else.
- Task 1 adds a real world ports table with sea-point snapping (so inland coordinates do not return empty data).
- Task 2 adds data contracts, real adapters, cited thresholds and property-based risk tests.
- Task 4 trains real small models, with a written adoption gate. If a model fails the gate it is not used.
- Every task has a "no stubs" rule and a required evidence format.
