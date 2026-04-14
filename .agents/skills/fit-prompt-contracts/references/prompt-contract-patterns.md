# Prompt Contract Patterns for `fit`

## Output contract

- Для implementation-задач: что изменено, какие проверки выполнены, какие внешние блокеры остались.
- Для review-задач: findings first, file references, impact, residual risk.
- Для onboarding-задач: module map, request/data flow, risky spots, next files, minimum verification plan.

## Verification loop

- Используй `goal -> baseline -> evaluator -> artifacts -> stop condition -> escalation rule`.
- Не подменяй evaluator субъективной формулировкой вроде "выглядит лучше".

## Tool persistence rules

- Если задача требует внешней документации, сначала официальные docs, потом вывод.
- Если задача требует проверки, агент должен сам прогнать минимальный достаточный пакет, а не только предложить его.

## Dependency checks

- Проверять ближайшие доменные контракты: `AGENTS.md`, профильные docs, skills, runtime/env dependencies.
- Если изменение ломает docs/process sync, это отдельная проблема, а не мелкая косметика.

## Missing context gating

- При нехватке контекста сначала исследовать репозиторий.
- Останавливать выполнение только при реальном внешнем blocker: доступы, secrets, платные провайдеры, outage.

## Action safety

- Не делать silent privileged mutations.
- Не маскировать provider degradation под зелёный success.
- Не переносить secrets в код, docs, клиентский runtime или логи.
