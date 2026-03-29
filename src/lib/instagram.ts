export const socialCampaignConfig = {
  instagramProfileURL:
    process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/shopfwatches/',
  instagramCampaignURL:
    process.env.NEXT_PUBLIC_INSTAGRAM_CAMPAIGN_URL || 'https://www.instagram.com/shopfwatches/',
  instagramUsername: process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'Fwatches',
} as const
