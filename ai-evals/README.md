# ai-evals

Эта директория предназначена только для внутренних AI-оценок.

Она специально отделена от runtime-приложения:

- production app code живёт в `src/`
- benchmark datasets живут в `ai-evals/datasets/`
- Ragas-конфиги и runners должны жить здесь

Планируемые benchmark-наборы:

- chat QA для workout и nutrition
- генерация workout plan
- генерация meal plan
- retrieval relevance
- safety и red-team regressions

Этот workspace нужно запускать только в CI или в контролируемых локальных eval-сценариях, но не внутри runtime app.
