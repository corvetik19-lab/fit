# Android / TWA для `fit`

Этот документ фиксирует Android-подготовку для `fit` как Trusted Web Activity поверх production PWA.

## Что уже подготовлено

- source of truth по Android-релизу лежит в `android/twa-release.json`;
- `public/android-assetlinks.json` синхронизируется из release-конфига, а `/.well-known/assetlinks.json` обслуживается через rewrite в `next.config.ts`;
- package name зафиксирован как `app.fitplatform.mobile`;
- цветовая схема, стартовый URL и иконки синхронизированы с текущим PWA manifest;
- готов статический verify-gate `npm run verify:android-twa`.

## Базовая Android-конфигурация

- package name: `app.fitplatform.mobile`
- launcher name: `fit`
- production host: `fit-platform-eta.vercel.app`
- start URL: `/dashboard`
- theme color: `#14614b`
- background color: `#f5f4ee`
- splash icon: `public/icon-512.png`

## Digital Asset Links

Chrome для TWA проверяет association через `/.well-known/assetlinks.json`.

В проекте asset links собираются командой `npm run verify:android-twa` из:

- `ANDROID_TWA_PACKAGE_NAME`
- `ANDROID_TWA_SHA256_FINGERPRINTS`

Если `ANDROID_TWA_SHA256_FINGERPRINTS` не задан, `public/android-assetlinks.json` всё равно остаётся доступным через `/.well-known/assetlinks.json`, но в нём будет пустой массив fingerprints. Это безопасно для web/PWA окружения, но не позволяет пройти TWA verification до тех пор, пока не появится реальный release fingerprint.

Формат fingerprints:

- несколько значений через запятую или перевод строки;
- ожидается SHA-256 fingerprint в стандартном виде `AA:BB:CC:...`.

## Signing и release keystore

Для финального Android релиза остаются внешние шаги:

- выпустить upload keystore;
- сохранить его вне репозитория;
- получить SHA-256 fingerprint release / app signing key;
- добавить fingerprint в `ANDROID_TWA_SHA256_FINGERPRINTS`.

`android/twa-release.json` уже резервирует путь `android/keys/fit-platform-upload.jks` и alias `fit-upload`, но сами ключи в репозиторий не кладутся.

## Play metadata

В `android/twa-release.json` уже зафиксированы базовые Play Store поля:

- `title`
- `shortDescription`
- `fullDescription`
- `defaultLanguage`

Если бренд или позиционирование продукта меняются, сначала обновляется этот файл, а потом Play Console listing.

## Как собирать TWA wrapper

Официальный поток подготовки описан в документации Chrome:

- [Quick Start Guide](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
- [Android Concepts for Web Developers](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs)

Практический локальный порядок:

1. Прогнать `npm run verify:android-twa`.
2. Убедиться, что production PWA и `assetlinks.json` доступны.
3. Инициализировать wrapper через Bubblewrap на основе production manifest.
4. Собрать APK/AAB и проверить verification на устройстве или эмуляторе.

## Что ещё остаётся blocker-ом

- реальный signing fingerprint;
- собранный Bubblewrap/TWA wrapper;
- Android smoke на production URL;
- фактический Play Console релиз.
