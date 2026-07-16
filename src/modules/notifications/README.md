# Module Notifications

## Installation

```bash
npm install
```

## Routes

- Page UI: `/notifications`
- API Edge: `/functions/v1/notifications-server/api/notifications`

## Permissions

- Lecture notifications: `owner`, `super_admin`, `admin_finance`, `support`, `director`
- Écriture/dispatch: `owner`, `super_admin`, `admin_finance`, `director`

## Tests

```bash
npm run test
```

Inclut:
- unit: service notifications
- integration: client API notifications
