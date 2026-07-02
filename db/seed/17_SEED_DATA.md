# Seed Data

Use this mock data so the app works immediately without external APIs.

## Default brand profile

```json
{
  "display_name": "Sejal Kishor Daterao",
  "positioning": [
    "product thinker",
    "tech-business analyst",
    "AI builder",
    "founder-minded builder",
    "technology and business commentator",
    "personal finance learner",
    "brain growth enthusiast",
    "reader",
    "writer",
    "singer"
  ],
  "audiences": [
    "recruiters",
    "founders",
    "tech professionals",
    "students",
    "investors",
    "startup people",
    "general business audience"
  ],
  "topics": [
    "technology",
    "business",
    "AI",
    "startups",
    "product thinking",
    "personal finance",
    "brain growth",
    "reading",
    "writing",
    "music"
  ],
  "tone_descriptors": [
    "concise",
    "sharp",
    "witty",
    "punchy",
    "authentic",
    "non-cliched",
    "practical"
  ],
  "daily_linkedin_target": 2,
  "daily_x_target": 2,
  "include_hashtags": true,
  "include_emojis": true,
  "require_hook": true,
  "require_topic_rationale": true
}
```

## Mock opportunities

```json
[
  {
    "title": "AI tools are shifting from features to workflows",
    "summary": "Many AI products are moving beyond chat interfaces into integrated workflows that complete specific business tasks.",
    "why_it_matters": "The next advantage may not be model quality alone. It may be workflow ownership.",
    "audience_fit": "Useful for founders, product thinkers, recruiters, and tech professionals.",
    "differentiated_angle": "The best AI product may be the one users notice least because it removes work instead of adding another place to chat.",
    "angle_type": "product_lesson",
    "recommended_formats": ["linkedin_post", "x_post", "carousel_outline"],
    "scores": { "originality": 88, "virality": 82, "brand_fit": 96, "clarity": 92, "cliche_risk": 5, "overall": 91 }
  },
  {
    "title": "The business model behind developer tools is changing",
    "summary": "AI coding tools are making developers faster, but pricing and differentiation are becoming harder.",
    "why_it_matters": "When productivity rises, customers may question seat-based pricing and demand outcome-based value.",
    "audience_fit": "Strong for startup, investor, and tech professional audience.",
    "differentiated_angle": "AI may not kill software jobs first. It may kill lazy software pricing first.",
    "angle_type": "business_implication",
    "recommended_formats": ["linkedin_post", "x_thread"],
    "scores": { "originality": 91, "virality": 87, "brand_fit": 94, "clarity": 89, "cliche_risk": 7, "overall": 92 }
  },
  {
    "title": "Students who build in public get an unfair career advantage",
    "summary": "Recruiters and founders increasingly value visible proof of thinking and execution.",
    "why_it_matters": "A personal brand can become a living portfolio, not just a social presence.",
    "audience_fit": "Strong for students, recruiters, founders, and general career audience.",
    "differentiated_angle": "Your LinkedIn is not a diary. It can be your proof-of-work engine.",
    "angle_type": "career_lesson",
    "recommended_formats": ["linkedin_post", "x_post"],
    "scores": { "originality": 80, "virality": 85, "brand_fit": 93, "clarity": 95, "cliche_risk": 10, "overall": 88 }
  }
]
```

## Mock drafts

```json
[
  {
    "platform": "linkedin",
    "post_type": "product_lesson",
    "hook": "The best AI products are starting to feel quieter.",
    "body": "The best AI products are starting to feel quieter.\n\nNot because the technology is less powerful.\nBecause the product is doing more work behind the scenes.\n\nA chat box asks the user to bring the workflow.\nA great product absorbs the workflow.\n\nThat is the business shift I find interesting.\n\nThe moat may not be who has the loudest model demo.\nIt may be who understands the user's boring, repetitive, expensive work deeply enough to make it disappear.\n\nAI that feels magical is nice.\nAI that saves a team 6 hours every week is a business.",
    "hashtags": ["AI", "ProductManagement", "Business"],
    "rationale": "This connects AI product design to business value and avoids generic model hype."
  },
  {
    "platform": "x",
    "post_type": "short_sharp_take",
    "hook": "A feature is not a moat.",
    "body": "A feature is not a moat.\n\nA habit might be.\n\nMost AI tools are fighting on capability. The better question is: which one becomes part of the user's daily workflow?",
    "hashtags": ["AI", "Startups"],
    "rationale": "Short, punchy, and focused on product/business implication."
  }
]
```
