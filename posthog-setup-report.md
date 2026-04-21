<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Fwatches e-commerce project. Here is a summary of all changes made:

- **Environment variables** — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` written to `.env.local`.
- **Client initialisation** — `instrumentation-client.ts` was already correctly set up for Next.js 15.3+ with the reverse proxy (`/ingest`), exception capture, and debug mode. No changes needed.
- **Reverse proxy** — `next.config.js` already contained the required `/ingest` rewrites. No changes needed.
- **Event tracking** — `posthog.capture()` calls added to 8 files covering authentication, cart, checkout, and raffle flows.
- **User identification** — `posthog.identify()` called on login with the user's ID and email; `posthog.reset()` called on logout.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `user_signed_up` | Fired when a user successfully creates a new account | `src/components/forms/CreateAccountForm/index.tsx` |
| `user_logged_in` | Fired when a user logs in; also calls `posthog.identify()` | `src/components/forms/LoginForm/index.tsx` |
| `user_logged_out` | Fired when a user logs out; also calls `posthog.reset()` | `src/app/(app)/logout/LogoutPage/index.tsx` |
| `password_reset_requested` | Fired when a password reset email is sent successfully | `src/components/forms/ForgotPasswordForm/index.tsx` |
| `product_added_to_cart` | Fired when a product (with optional variant) is added to cart | `src/components/Cart/AddToCart.tsx` |
| `checkout_payment_initiated` | Fired when a user clicks "Pay with Paystack" at checkout | `src/components/checkout/CheckoutPage.tsx` |
| `order_completed` | Fired when a Paystack payment succeeds and the order is confirmed | `src/components/checkout/CheckoutPage.tsx` |
| `checkout_payment_cancelled` | Fired when a user cancels the Paystack payment popup | `src/components/checkout/CheckoutPage.tsx` |
| `discount_code_applied` | Fired when a discount code is successfully applied to the cart | `src/components/checkout/CheckoutPage.tsx` |
| `raffle_ticket_purchase_started` | Fired when a user initiates a raffle ticket purchase | `src/components/raffles/BuyRaffleTicket.tsx` |
| `raffle_ticket_purchased` | Fired when a raffle ticket payment is confirmed | `src/components/raffles/BuyRaffleTicket.tsx` |
| `raffle_ticket_purchase_cancelled` | Fired when a user cancels the raffle ticket payment popup | `src/components/raffles/BuyRaffleTicket.tsx` |
| `raffle_bonus_action_submitted` | Fired when a user submits bonus social actions after buying a ticket | `src/components/raffles/BonusActionForm.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/388816/dashboard/1492742
- **Shopping conversion funnel** (add to cart → checkout → order): https://us.posthog.com/project/388816/insights/C5E9g2Pb
- **Orders completed over time:** https://us.posthog.com/project/388816/insights/ag7WSpsW
- **Checkout payment cancellation rate:** https://us.posthog.com/project/388816/insights/N8qASXhU
- **Raffle ticket purchase funnel:** https://us.posthog.com/project/388816/insights/XxDOaQ5u
- **User signups and logins over time:** https://us.posthog.com/project/388816/insights/c3pOfzHO

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
