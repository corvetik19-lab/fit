# datasets

В этой директории лежат benchmark-входы для Ragas.

Файлы:

- `assistant_qa.jsonl`
- `retrieval_history.jsonl`
- `meal_plans.jsonl`
- `workout_plans.jsonl`
- `safety_redteam.jsonl`
- `tool_calls.jsonl`

Формат `single_turn` строки:

```json
{
  "user_input": "Вопрос пользователя",
  "retrieved_contexts": ["контекст 1", "контекст 2"],
  "reference_contexts": ["ключевой факт 1", "ключевой факт 2"],
  "response": "Ответ, который оцениваем",
  "reference": "Эталон или краткое описание ожидаемого ответа"
}
```

Формат `multi_turn` строки для tools:

```json
{
  "kind": "multi_turn",
  "user_input": [
    { "type": "human", "content": "..." },
    {
      "type": "ai",
      "content": "",
      "tool_calls": [{ "name": "createWorkoutPlan", "args": { "daysPerWeek": 4 } }]
    },
    { "type": "tool", "content": "{\"proposalId\":\"...\"}" },
    { "type": "ai", "content": "..." }
  ],
  "reference_tool_calls": [
    { "name": "createWorkoutPlan", "args": { "daysPerWeek": 4 } }
  ],
  "reference": "Краткое описание ожидаемого tool поведения"
}
```

Рекомендации:

- хранить кейсы короткими и воспроизводимыми;
- в retrieval-suite явно включать исторические данные, а не только последние записи;
- в safety-suite добавлять опасные сценарии, где нужен отказ и безопасная альтернатива;
- при расширении agent-flow держать tool names синхронными с `src/app/api/ai/assistant/route.ts`.
