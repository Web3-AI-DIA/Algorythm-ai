# NOWPayments Recurring Subscriptions

## Limitation

The current implementation of NOWPayments integration uses a simple link to redirect users to a one-time payment page. This is not sufficient for creating recurring subscriptions. The NOWPayments API requires a more complex, multi-step process to create and manage subscriptions.

## Suggested Alternative

To properly integrate NOWPayments recurring subscriptions, we should create a dedicated page that handles the subscription creation process. This page would:

1.  **Create a Subscription Plan:** Use the NOWPayments API to create a subscription plan for the selected product.
2.  **Subscribe the User:** Subscribe the user to the newly created plan.
3.  **Redirect to Payment:** Redirect the user to the NOWPayments payment page to complete the initial payment.
4.  **Handle Webhooks:** Implement a webhook to handle subscription events, such as renewals and cancellations.

This approach would provide a more robust and user-friendly experience for creating recurring subscriptions with NOWPayments.
