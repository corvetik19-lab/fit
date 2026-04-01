# Android / TWA для `fit`

Этот документ фиксирует текущее состояние Android-оболочки `fit` как Trusted Web Activity поверх production PWA.

## Текущий статус

- production web origin: `https://fit-platform-eta.vercel.app`
- package name: `app.fitplatform.mobile`
- wrapper project: [android/twa-shell](/C:/fit/android/twa-shell)
- release config: [android/twa-release.json](/C:/fit/android/twa-release.json)
- asset links served from `/.well-known/assetlinks.json` через rewrite в [next.config.ts](/C:/fit/next.config.ts)

## Что уже готово

- Подтверждена installability production PWA.
- Сгенерирован полноценный Bubblewrap-проект в [android/twa-shell](/C:/fit/android/twa-shell), а не только JSON-scaffold.
- Локально собраны Android-артефакты через `bubblewrap build`: signed APK и AAB подтверждены в smoke-проверке.
- Эмулятор `Medium_Phone_API_36.1` успешно поднят, APK установлен, wrapper запущен.
- Logcat подтвердил запуск production URL из `TWALauncherActivity`:
  - `Using url from Manifest: https://fit-platform-eta.vercel.app/dashboard`
  - `capturedLink=https://fit-platform-eta.vercel.app/dashboard`
- Отдельно подтверждён billing deep-link smoke внутри TWA:
  - `adb shell am start -W -a android.intent.action.VIEW -d "https://fit-platform-eta.vercel.app/billing/cloudpayments?reference=android-billing-smoke" app.fitplatform.mobile`
  - `TWALauncherActivity` получил и открыл `capturedLink=https://fit-platform-eta.vercel.app/billing/cloudpayments?reference=android-billing-smoke`

## Что использовалось для локального smoke

- JDK 17: `C:\jdk17-fit` -> junction на установленный Temurin JDK без пробелов в пути, чтобы Bubblewrap корректно вызывал `java.exe` при подписи APK.
- Android SDK: `C:\Users\User\AppData\Local\Android\Sdk`
- Android command-line tools дополнительно разложены так, чтобы `bubblewrap doctor` видел валидный SDK layout.
- Локальный test keystore лежит вне репозитория:
  - `C:\Users\User\.bubblewrap\keys\fit-local-upload.jks`

## Репозиторный контракт

- В репозиторий коммитится только wrapper source project, без локальных build-артефактов.
- Для этого в [android/twa-shell/.gitignore](/C:/fit/android/twa-shell/.gitignore) игнорируются `.gradle/`, `build/`, `app/build/`, `*.apk`, `*.aab`, `*.idsig`.
- Путь в [android/twa-shell/twa-manifest.json](/C:/fit/android/twa-shell/twa-manifest.json) указывает на repo-ориентированный release keystore placeholder:
  - `../keys/fit-platform-upload.jks`
- Сама папка `android/keys/` игнорируется в [\.gitignore](/C:/fit/.gitignore).

## Что ещё остаётся как release-step

- Выпустить реальный upload/release keystore для production Android релиза.
- Получить его SHA-256 fingerprint.
- Прописать fingerprint в `ANDROID_TWA_SHA256_FINGERPRINTS` для проекта `fit-platform`.
- Пересобрать `public/android-assetlinks.json` с release fingerprint и выкатить обновлённый deployment.
- После этого повторить smoke уже не на local test keystore, а на release-signing контуре.

## Полезные команды

Проверка scaffold и asset links:

```powershell
npm run verify:android-twa
```

Проверка Bubblewrap окружения:

```powershell
npx @bubblewrap/cli doctor
```

Пересборка wrapper:

```powershell
npx @bubblewrap/cli update --manifest="C:\fit\android\twa-shell\twa-manifest.json" --directory="C:\fit\android\twa-shell" --skipVersionUpgrade
```

Локальная сборка APK/AAB:

```powershell
$env:BUBBLEWRAP_KEYSTORE_PASSWORD='***'
$env:BUBBLEWRAP_KEY_PASSWORD='***'
npx @bubblewrap/cli build --manifest="C:\fit\android\twa-shell\twa-manifest.json" --skipPwaValidation
```

Минимальный smoke на эмуляторе:

```powershell
adb install -r "C:\fit\android\twa-shell\app-release-signed.apk"
adb shell am start -W -n app.fitplatform.mobile/.LauncherActivity
adb logcat -d | Select-String -Pattern "fit-platform-eta|TWALauncherActivity|capturedLink"
```

Billing deep-link smoke:

```powershell
adb logcat -c
adb shell am start -W -a android.intent.action.VIEW -d "https://fit-platform-eta.vercel.app/billing/cloudpayments?reference=android-billing-smoke" app.fitplatform.mobile
adb logcat -d | Select-String -Pattern "billing/cloudpayments|fit-platform-eta|capturedLink|TWALauncherActivity"
```
