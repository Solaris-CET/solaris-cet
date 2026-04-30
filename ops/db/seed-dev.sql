insert into users (wallet_address, referral_code, points, role)
values
  ('EQDEV_WALLET_0000000000000000000000000000000000000000000', 'DEV0001', 100, 'admin'),
  ('EQDEV_WALLET_1111111111111111111111111111111111111111111', 'DEV0002', 25, 'visitor')
on conflict (wallet_address) do nothing;

insert into audit_logs (wallet_address, action, details)
values
  ('EQDEV_WALLET_0000000000000000000000000000000000000000000', 'seed', 'dev seed applied'),
  ('EQDEV_WALLET_1111111111111111111111111111111111111111111', 'seed', 'dev seed applied');

