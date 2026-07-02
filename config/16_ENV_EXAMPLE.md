# Environment Variables Example

Create `.env.local` with these variables.

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=SignalScript
APP_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_GENERATION_MODEL=gpt-5.5
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Email
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=SignalScript <drafts@yourdomain.com>

# Token encryption
TOKEN_ENCRYPTION_KEY=replace_with_32_byte_secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/social/linkedin/oauth/callback
LINKEDIN_SCOPES=openid,profile,email,w_member_social

# X OAuth
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=http://localhost:3000/api/social/x/oauth/callback
X_SCOPES=tweet.read,tweet.write,users.read,offline.access

# Product Hunt optional
PRODUCT_HUNT_TOKEN=your_product_hunt_token

# Reddit optional
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=signalscript/1.0

# Cron secret
CRON_SECRET=replace_with_random_secret

# Optional observability
SENTRY_DSN=
POSTHOG_KEY=
```

## Notes

- Never expose service role key to the browser.
- Never commit `.env.local` to GitHub.
- Automatic publishing should remain disabled until social credentials and OAuth permissions are working.
- Use manual mode in development.
