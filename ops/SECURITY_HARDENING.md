## Securitate (ops)

Aceste fișiere sunt șabloane de configurare pentru hardening la nivel de host / reverse-proxy. Nu sunt aplicate automat din repo.

### Nginx: rate limiting

- Pentru hosting static, rate limiting este în [nginx.conf](file:///root/solaris-cet/docker/nginx.conf).
- Pentru reverse-proxy (când nginx stă în fața aplicației Node), mută directivele `limit_req_zone` în contextul `http {}` și aplică `limit_req` pe locațiile `/api/` și/sau `/`.

### Fail2ban (brute-force)

- Configuri exemplu în `ops/fail2ban/`.
- Ținte tipice: `sshd` și (opțional) endpoint-uri sensibile de tip `/api/auth`.

### AIDE (integritate fișiere)

- Config exemplu în `ops/aide/aide.conf`.
- Rulează inițializarea bazei (`aideinit`) după instalare, apoi programează verificări periodice.

### Rotație/retentie loguri

- Configuri logrotate exemplu în `ops/logrotate/`.

### Host hardening (Ubuntu)

- Checklist complet: `ops/HOST_HARDENING_UBUNTU.md`.
