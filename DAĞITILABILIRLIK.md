# Subs — Dağıtılabilirlik ve Lisans Analizi

## Mevcut Durum
- ✅ Kod tamamen senin (GitHub repo: albinobrokoli/subs → fork/editle)
- ❌ **Kod imzalama YOK** → macOS Gatekeeper engeller
- ✅ Açık kaynak Electron + React stack
- ✅ İkonlar: Simple Icons (CC0) + Google favicon (marka logoları)

## Başkalarına Satmak İçin Gerekli Adımlar

### 1. Kod İmzalama (Apple Developer ID)
```
Maliyet: $99/year (Apple Developer Program)
Gerekli: Apple ID + Developer hesabı
İşlem:
  - Xcode → Accounts → Developer ID Application sertifikası
  - electron-builder ile otomatik imzalama:
    env:
      CSC_LINK=<cert.p12>
      CSC_KEY_PASSWORD=<pw>
  - electron-builder.yml:
      mac:
        identity: "Developer ID Application: Baran (TEAMID)"
        gatekeeperAssess: true
```

### 2. Notarization (Apple'ın taraması)
```
Maliyet: Ücretsiz (Developer Program dahil)
İşlem:
  - notarizeApp() ile Apple'a gönder
  - "Ticket" alınınca staple edilir
  - Kullanıcı çift tıklar → "Hasar görmedi" uyarısı yok
```

### 3. Lisans Modeli
- **Kendi kodun**: İstediğin lisans (MIT/Proprietary)
- **Simple Icons**: CC0 (ticari kullanım serbest)
- **Google favicon**: Marka logoları → ticari üründe risk
  - Çözüm: Kullanıcı kendi ikonunu yüklesin, varsayılan genel ikonlar

### 4. DMG Dağıtımı
```
- Kendi siten: GitHub Releases (ücretsiz)
- Mac App Store: İnceleme süreci + %15-30 kesinti
- Doğrudan DMG: İmzalı + notarize edilmiş dosya
```

## Şu Anki Durumda
- ❌ Başkalarına dağıtamazsın (Gatekeeper engeller)
- ✅ Sadece kendi PC'nde çalışır (xattr -cr ile)

## Öneri
1. **Kendin kullan**: Olduğu gibi devam et
2. **Satmak istersen**: $99 Apple Developer + 2 saat setup
3. **Open source**: MIT lisansı + GitHub → ücretsiz dağıtım

## Teknik Not
- `electron-builder.yml` hazır (sadece `identity: null` → Developer ID ile değişecek)
- İmzalama scripti: `scripts/sign-and-notarize.sh` eklenebilir
- Store yapısı: `~/Library/Application Support/sublist-clone/` (kullanıcı bazlı)
