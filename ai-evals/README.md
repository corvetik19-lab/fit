# ai-evals

Этот workspace отделен от runtime-приложения и нужен только для внутренних AI-оценок.

Что лежит здесь:

- `fit_eval/` — Python-каркас для Ragas, провайдеров и записи результатов.
- `datasets/` — benchmark-наборы для assistant, retrieval, meal/workout plans, safety и tool-calls.
- `output/` — локальные артефакты прогонов.
- `run_ragas_eval.py` — CLI для прямого запуска suite или обработки очереди `ai_eval_runs`.

Основные сценарии:

```powershell
ai-evals\.venv\Scripts\python ai-evals\run_ragas_eval.py --suite tool_calls --no-supabase
ai-evals\.venv\Scripts\python ai-evals\run_ragas_eval.py --suite assistant --run-id local-assistant-bench
ai-evals\.venv\Scripts\python ai-evals\run_ragas_eval.py --queue --limit 3
```

Переменные окружения:

- `OPENROUTER_API_KEY`
- `OPENROUTER_CHAT_MODEL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_APP_NAME`
- `OPENROUTER_SITE_URL`
- `VOYAGE_API_KEY`
- `VOYAGE_EMBEDDING_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Текущие suite:

- `assistant` — персональный фитнес/нутрицио AI assistant
- `retrieval` — полнота и релевантность исторического контекста
- `meal_plan` — качество и безопасность планов питания
- `workout_plan` — качество и безопасность тренировочных планов
- `safety` — red-team и privacy границы
- `tool_calls` — корректность вызова tools и agent flow

Важно:

- `tool_calls` можно гонять без LLM/embeddings spend.
- Остальные suite используют OpenRouter как judge/runtime и Voyage для embeddings.
- Результаты для очереди пишутся в `ai_eval_runs.summary` и `ai_eval_results`, а подробные sample-артефакты сохраняются в `ai-evals/output/`.
