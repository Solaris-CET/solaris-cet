# Host hardening (Ubuntu) — Holtzer / producție

Acest ghid este orientat pe un VPS care rulează Docker/Coolify.

## 1) User SSH dedicat pentru deploy (fără root)

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
```

Dacă vrei să eviți complet sudo pentru userul de deploy, nu-l adăuga în `sudo`.

## 2) Cheie publică SSH + dezactivare parolă

Pe server (ca `deploy`):

```bash
sudo install -d -m 0700 -o deploy -g deploy /home/deploy/.ssh
sudo tee -a /home/deploy/.ssh/authorized_keys >/dev/null <<'EOF'
ssh-ed25519 AAAA... user@laptop
EOF
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 0600 /home/deploy/.ssh/authorized_keys
```

În `/etc/ssh/sshd_config`:

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
```

Aplică:

```bash
sudo systemctl reload ssh
```

## 3) fail2ban (SSH + nginx)

```bash
sudo apt update
sudo apt install -y fail2ban
sudo install -d -m 0755 /etc/fail2ban/jail.d
sudo install -m 0644 /root/solaris-cet/ops/fail2ban/jail.d/solaris-nginx.conf /etc/fail2ban/jail.d/solaris-nginx.conf
sudo systemctl enable --now fail2ban
sudo fail2ban-client status
```

## 4) logrotate (curățare loguri vechi)

```bash
sudo apt install -y logrotate
sudo install -m 0644 /root/solaris-cet/ops/logrotate/nginx /etc/logrotate.d/nginx
sudo install -d -m 0755 /var/log/solaris
sudo install -m 0644 /root/solaris-cet/ops/logrotate/solaris-node /etc/logrotate.d/solaris-node
sudo logrotate -d /etc/logrotate.conf | head -n 60
```

## 5) unattended-upgrades (patch-uri de securitate)

```bash
sudo apt update
sudo apt install -y unattended-upgrades apt-listchanges
sudo install -d -m 0755 /etc/apt/apt.conf.d
sudo install -m 0644 /root/solaris-cet/ops/unattended-upgrades/20auto-upgrades /etc/apt/apt.conf.d/20auto-upgrades
sudo install -m 0644 /root/solaris-cet/ops/unattended-upgrades/50unattended-upgrades /etc/apt/apt.conf.d/50unattended-upgrades
sudo systemctl restart unattended-upgrades
```

Verificare:

```bash
sudo unattended-upgrade --dry-run --debug | head -n 80
```

