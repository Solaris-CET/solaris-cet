# Netdata (Holtzer) — monitorizare în timp real

## Instalare (Ubuntu)

```bash
sudo apt update
sudo apt install -y curl
sudo bash -c "curl -Ss https://my-netdata.io/kickstart.sh | bash -s -- --stable-channel --disable-telemetry"
sudo systemctl enable --now netdata
```

Verificare local:

```bash
curl -fsS http://127.0.0.1:19999/api/v1/info | head -c 300
echo
```

## Expunere sigură

- Recomandat: acces doar prin VPN / Tailscale / reverse proxy cu auth.
- Alternativ: bind doar pe localhost + proxy în față.

## Alertă Telegram pentru disk <10% (independent de Netdata)

Script: `scripts/disk-space-telegram-alert.sh`.

Exemplu cron (verifică la 5 minute):

```cron
*/5 * * * * TELEGRAM_BOT_TOKEN='***' TELEGRAM_CHAT_ID='***' CHECK_PATH='/' DISK_FREE_PCT_THRESHOLD=10 /root/solaris-cet/scripts/disk-space-telegram-alert.sh >/var/log/solaris-disk-alert.log 2>&1
```

Note:

- Scriptul trimite un singur alert (și apoi un mesaj de recover) ca să evite spam.
- Pentru multiple mountpoints, rulează cron separat cu `CHECK_PATH` diferit.

