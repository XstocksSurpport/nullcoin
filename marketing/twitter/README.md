# null / llnu — Twitter marketing bot

Posts rotating marketing tweets via the official X (Twitter) API.

## 1. X Developer setup

1. Open [developer.x.com](https://developer.x.com/en/portal/dashboard)
2. Create a Project + App (needs **Basic** tier or higher to post — free tier is read-only)
3. Enable **OAuth 1.0a** with **Read and Write**
4. Generate **Access Token and Secret** for your account
5. Copy four values into `.env`

## 2. Configure

```powershell
cd marketing/twitter
copy .env.example .env
# Edit .env — never commit this file
npm install
```

## 3. Preview & post

```powershell
npm run post:dry          # preview next tweet
npm run post:next         # post next unposted tweet
npm run list              # queue status
```

## 4. Auto schedule (Windows)

After `.env` works:

```powershell
.\schedule.ps1
```

Default: **09:00** and **21:00** daily, one tweet per run.

To repeat the queue after all tweets posted, delete or reset `posted.json`.

## 5. Customize

- Edit `tweets.json` — add/remove tweets (max 280 chars each)
- Placeholders: `{WEBSITE}`, `{TELEGRAM}`, `{NULL_MINT}`, `{ETHERSCAN}`

## Security

- Do **not** paste API keys in chat or commit `.env`
- Use a dedicated marketing account if possible
- Follow [X automation rules](https://help.x.com/en/rules-and-policies/x-automation)
