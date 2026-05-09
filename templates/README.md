# Workflow templates

Ebben a mappában kész workflow JSON-ok találhatók, amelyek a node tipikus használati eseteit demonstrálják. **Importálás:** n8n UI → Settings → Import from File.

| Template | Mit csinál |
|---|---|
| [`01-monthly-expense-export.json`](01-monthly-expense-export.json) | Havi cron, jóváhagy + exportál minden múlt havi kiadást. Demonstrálja az auto-batch működést. |
| [`02-nav-invoice-handler.json`](02-nav-invoice-handler.json) | QUiCK Trigger figyel új NAV-os számlákra → auto-check → Slack értesítés. |
| [`03-overdue-reminder.json`](03-overdue-reminder.json) | Napi 7:00 cron → lejárt fizetetlen kiadások → email a könyvelőnek összesítéssel. |

A `Slack` és `Email` node-ok configolása a saját env-edhez igazítandó. A `n8n-nodes-quick` csomagnak telepítve kell lennie a workflow szerveren.
