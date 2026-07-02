import type { ContentOpportunity, ContentDraft, TrendCluster } from './database.types';

export const MOCK_OPPORTUNITIES: Omit<ContentOpportunity, 'id' | 'user_id' | 'cluster_id' | 'created_at' | 'updated_at'>[] = [
  {
    title: 'AI tools are shifting from features to workflows',
    summary: 'Many AI products are moving beyond chat interfaces into integrated workflows that complete specific business tasks end to end.',
    why_it_matters: 'The next competitive advantage may not be model quality alone. It may be workflow ownership — who understands the user\'s actual work deeply enough to absorb it.',
    audience_fit: 'Strong for founders, product thinkers, recruiters, and tech professionals.',
    differentiated_angle: 'The best AI product may be the one users notice least because it removes work instead of adding another place to chat.',
    angle_type: 'product_lesson',
    recommended_formats: ['linkedin_post', 'x_post', 'carousel_outline'],
    originality_score: 88,
    virality_score: 82,
    brand_fit_score: 96,
    clarity_score: 92,
    cliche_risk_score: 5,
    overall_score: 91,
    status: 'new',
  },
  {
    title: 'The business model behind developer tools is changing',
    summary: 'AI coding assistants are making developers faster, but per-seat pricing is becoming harder to justify when the value compounds on the company, not the individual.',
    why_it_matters: 'When productivity rises dramatically, customers may question seat-based pricing and demand outcome-based value. This is a quiet pricing crisis in developer tooling.',
    audience_fit: 'Strong for startup, investor, and tech professional audience.',
    differentiated_angle: 'AI may not kill software jobs first. It may kill lazy software pricing first.',
    angle_type: 'business_implication',
    recommended_formats: ['linkedin_post', 'x_thread'],
    originality_score: 91,
    virality_score: 87,
    brand_fit_score: 94,
    clarity_score: 89,
    cliche_risk_score: 7,
    overall_score: 92,
    status: 'new',
  },
  {
    title: 'Students who build in public get an unfair career advantage',
    summary: 'Recruiters and founders are increasingly valuing visible proof of thinking and execution over polished resumes from recognizable institutions.',
    why_it_matters: 'A personal brand can become a living portfolio — not just a social presence. The cost of entry is essentially zero.',
    audience_fit: 'Strong for students, recruiters, founders, and general career audience.',
    differentiated_angle: 'Your LinkedIn is not a diary. It can be your proof-of-work engine.',
    angle_type: 'career_lesson',
    recommended_formats: ['linkedin_post', 'x_post'],
    originality_score: 80,
    virality_score: 85,
    brand_fit_score: 93,
    clarity_score: 95,
    cliche_risk_score: 10,
    overall_score: 88,
    status: 'new',
  },
  {
    title: 'Open source AI models are forcing a strategy rethink at every cloud provider',
    summary: 'The rapid release of capable open-weight models is putting pressure on cloud AI offerings that are priced as premium black-box APIs.',
    why_it_matters: 'The race to the bottom on API pricing is already happening. The next battleground is deployment, fine-tuning, and integration — not raw model capability.',
    audience_fit: 'Relevant to investors, founders, engineers, and tech professionals.',
    differentiated_angle: 'Commoditization is not the end of AI business models. It\'s the beginning of the real competition.',
    angle_type: 'contrarian',
    recommended_formats: ['linkedin_post', 'x_thread', 'carousel_outline'],
    originality_score: 85,
    virality_score: 79,
    brand_fit_score: 91,
    clarity_score: 88,
    cliche_risk_score: 12,
    overall_score: 87,
    status: 'new',
  },
  {
    title: 'Vertical SaaS is the quiet winner of the AI wave',
    summary: 'While horizontal AI tools fight for mindshare, vertical software companies with deep domain data are building defensible AI products that generalists cannot replicate.',
    why_it_matters: 'The companies with proprietary workflow data and domain expertise are better positioned than the ones with access to the biggest models.',
    audience_fit: 'Excellent for investors, startup founders, and product strategists.',
    differentiated_angle: 'The most boring SaaS companies may become the most defensible AI companies.',
    angle_type: 'business_implication',
    recommended_formats: ['linkedin_post', 'x_post'],
    originality_score: 87,
    virality_score: 76,
    brand_fit_score: 95,
    clarity_score: 90,
    cliche_risk_score: 8,
    overall_score: 89,
    status: 'new',
  },
  {
    title: 'Reading habits and information diet are becoming a professional moat',
    summary: 'The gap between people who read widely and deeply versus those who consume only algorithmic feeds is widening — and it shows up in the quality of thinking and decisions.',
    why_it_matters: 'In a world flooded with generated content, the ability to synthesize and apply ideas from diverse sources is a rare and increasingly valuable skill.',
    audience_fit: 'Resonates with students, career builders, founders, and general intellectual audience.',
    differentiated_angle: 'Reading is not self-improvement theater. It is a compound interest machine for judgment.',
    angle_type: 'reading_reflection',
    recommended_formats: ['linkedin_post', 'x_post'],
    originality_score: 82,
    virality_score: 78,
    brand_fit_score: 92,
    clarity_score: 93,
    cliche_risk_score: 14,
    overall_score: 85,
    status: 'new',
  },
];

export const MOCK_DRAFTS: Omit<ContentDraft, 'id' | 'user_id' | 'opportunity_id' | 'idea_id' | 'published_at' | 'external_post_id' | 'external_post_url' | 'scheduled_at' | 'created_at' | 'updated_at' | 'generation_params'>[] = [
  {
    platform: 'linkedin',
    post_type: 'product_lesson',
    title: 'AI products are getting quieter',
    hook: 'The best AI products are starting to feel quieter.',
    body: `The best AI products are starting to feel quieter.

Not because the technology is less powerful.
Because the product is doing more work behind the scenes.

A chat box asks the user to bring the workflow.
A great product absorbs the workflow.

That is the business shift worth watching.

The moat may not be who has the loudest model demo.
It may be who understands the user's boring, repetitive, expensive work deeply enough to make it disappear.

AI that feels magical is nice.
AI that saves a team 6 hours every week is a business.

#AI #ProductManagement #Business`,
    hashtags: ['AI', 'ProductManagement', 'Business'],
    emojis: [],
    rationale: 'This connects AI product design to business value without generic hype. The contrast between "magical" and "a business" creates a memorable landing point.',
    status: 'draft',
    brand_fit_score: 94,
    originality_score: 89,
    virality_score: 82,
    clarity_score: 96,
    cliche_risk_score: 4,
    overall_score: 91,
  },
  {
    platform: 'x',
    post_type: 'short_sharp_take',
    title: 'Feature vs moat',
    hook: 'A feature is not a moat.',
    body: `A feature is not a moat.

A habit might be.

Most AI tools are competing on capability. The better question: which one becomes part of the user's daily workflow?

That's the one that wins.`,
    hashtags: ['AI', 'Startups'],
    emojis: [],
    rationale: 'Short, punchy, and focused on product/business implication. Designed for high share rate among founders and PMs.',
    status: 'draft',
    brand_fit_score: 96,
    originality_score: 88,
    virality_score: 84,
    clarity_score: 97,
    cliche_risk_score: 3,
    overall_score: 92,
  },
  {
    platform: 'linkedin',
    post_type: 'business_implication',
    title: 'AI pricing crisis in developer tools',
    hook: 'AI may not kill software jobs first.',
    body: `AI may not kill software jobs first.

It may kill lazy software pricing first.

Here's the logic:
→ AI coding tools make developers 2-3x faster
→ Companies start questioning per-seat pricing
→ "Why am I paying for 10 seats when 3 developers now do the work of 10?"

The per-seat SaaS model assumed human throughput as the constraint.
AI removes that constraint.

The smarter developer tool companies are already shifting to outcome-based models, usage tiers, or team-level bundles.

The ones still selling per-seat will face a quiet churn wave. Not because the product got worse — because the pricing assumption got exposed.

Business model risk is the under-discussed AI risk.

#Startups #SaaS #Business #AI`,
    hashtags: ['Startups', 'SaaS', 'Business', 'AI'],
    emojis: [],
    rationale: 'Takes a specific trend (AI productivity gains) and extracts a non-obvious business implication (pricing model disruption). High value for founders and investors.',
    status: 'needs_review',
    brand_fit_score: 93,
    originality_score: 91,
    virality_score: 85,
    clarity_score: 91,
    cliche_risk_score: 6,
    overall_score: 92,
  },
  {
    platform: 'x',
    post_type: 'contrarian',
    title: 'Open source forces strategy rethink',
    hook: 'Commoditization is not the end of AI business models.',
    body: `Commoditization is not the end of AI business models.

It's the beginning of the real competition.

When the model becomes cheap, the battle shifts to:
— Distribution
— Integration depth
— Domain expertise
— Data flywheel

The "open source kills AI moats" take misses what actually matters.`,
    hashtags: ['AI', 'Technology'],
    emojis: [],
    rationale: 'Punchy contrarian framing that will get engagement from people debating AI business models. Sets up a productive argument.',
    status: 'approved',
    brand_fit_score: 92,
    originality_score: 85,
    virality_score: 81,
    clarity_score: 94,
    cliche_risk_score: 9,
    overall_score: 89,
  },
];

export const MOCK_TREND_CLUSTERS: Omit<TrendCluster, 'id' | 'user_id' | 'created_at'>[] = [
  {
    title: 'AI Workflow Integration',
    summary: 'Shift from AI features to AI-native workflows. Products are embedding AI at the task level, not just the interface level.',
    category: 'ai',
    cluster_date: new Date().toISOString().split('T')[0],
    source_count: 8,
    momentum_score: 92,
    business_impact_score: 88,
    audience_fit_score: 95,
    novelty_score: 84,
    risk_score: 12,
    metadata: {},
  },
  {
    title: 'Developer Tool Pricing Disruption',
    summary: 'AI productivity gains are challenging the per-seat SaaS pricing model. Companies are rethinking value delivery.',
    category: 'business',
    cluster_date: new Date().toISOString().split('T')[0],
    source_count: 5,
    momentum_score: 85,
    business_impact_score: 91,
    audience_fit_score: 87,
    novelty_score: 88,
    risk_score: 8,
    metadata: {},
  },
  {
    title: 'Open Source AI Models',
    summary: 'Rapid capability improvements in open-weight models are reshaping cloud AI economics and deployment strategies.',
    category: 'technology',
    cluster_date: new Date().toISOString().split('T')[0],
    source_count: 12,
    momentum_score: 94,
    business_impact_score: 86,
    audience_fit_score: 82,
    novelty_score: 79,
    risk_score: 15,
    metadata: {},
  },
  {
    title: 'Vertical AI Defensibility',
    summary: 'Domain-specific AI products with proprietary data are building moats that horizontal tools cannot easily replicate.',
    category: 'startups',
    cluster_date: new Date().toISOString().split('T')[0],
    source_count: 7,
    momentum_score: 80,
    business_impact_score: 90,
    audience_fit_score: 93,
    novelty_score: 85,
    risk_score: 10,
    metadata: {},
  },
];

export const DEFAULT_BRAND_PROFILE = {
  positioning: [
    'product thinker',
    'tech-business analyst',
    'AI builder',
    'founder-minded builder',
    'technology and business commentator',
    'personal finance learner',
    'brain growth enthusiast',
    'reader',
    'writer',
    'singer',
  ],
  audiences: [
    'recruiters',
    'founders',
    'tech professionals',
    'students',
    'investors',
    'startup people',
    'general business audience',
  ],
  topics: [
    'technology',
    'business',
    'AI',
    'startups',
    'product thinking',
    'personal finance',
    'brain growth',
    'reading',
    'writing',
    'music',
  ],
  tone_descriptors: ['concise', 'sharp', 'witty', 'punchy', 'authentic', 'non-cliched', 'practical'],
  banned_phrases: [
    "in today's fast-paced world",
    'game changer',
    'revolutionary',
    'unlock your potential',
    'let that sink in',
    "here's why",
    'i am thrilled to announce',
    'super excited',
    'this changes everything',
    'in the age of ai',
    'gone are the days',
    'disruptive innovation',
    'leverage ai',
  ],
  preferred_formats: [
    'short_sharp_take',
    'trend_breakdown',
    'business_implication',
    'contrarian_take',
    'personal_story',
    'founder_lesson',
  ],
  daily_linkedin_target: 2,
  daily_x_target: 2,
  include_hashtags: true,
  include_emojis: true,
  require_hook: true,
  require_topic_rationale: true,
};

export const WEEKLY_LEARNING_REPORT = {
  summary: 'Strong week for business-angle posts. Contrarian takes are outperforming observation posts by 2.1x on engagement rate. Short X posts (under 200 chars) getting highest save rates.',
  what_worked: [
    'Contrarian takes on AI business models — consistently higher comment counts',
    'Posts with a concrete business implication in the hook',
    'Short X posts that end with a question or open loop',
    '2-3 hashtags consistently outperforming 5+ hashtag posts',
  ],
  what_failed: [
    'General AI observation posts without a specific angle',
    'Posts starting with "I" performing below average',
    'Long-form LinkedIn posts over 250 words on weekends',
  ],
  recommendations: [
    'Double down on contrarian business takes this week',
    'Try a personal story format — underused vs brand pillars',
    'Test posting LinkedIn at 8am vs 11am to isolate timing effect',
    'Write 1 founder observation post — that pillar has been quiet',
  ],
};
