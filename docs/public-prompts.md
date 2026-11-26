# What public payment agents are told

Checked on 26 November 2026, to test an assumption behind `PLAN.md`: do teams that build agents which move money tell them to check a payment's real status before retrying, and not to pay twice?

Every file was read from its repository, not quoted from memory. These are demos, toolkits and benchmarks, not live company setups, which are private. They show what teams start from, not what every team ships.

## Tally, 12 sources

| What the instructions tell the agent | Sources |
|---|---|
| Check a payment's real status before retrying | 0 clear. 2 partial (τ-bench's status check before acting, Stripe's `stripe-pay` skill). 2 push the other way (Coinbase, LangGraph). |
| Don't pay twice, or use a repeat-safe key | 0 in the instructions. 3 near misses. 2 more have it in code only (PayPal, the OpenAI demo). |
| Get the user's yes before moving money | 8 |

The common rule, "get the user's yes", doesn't cover the stale payout: the person saying yes is the supplier, who is asking for the money to be resent.

## Sources

1. **τ-bench** (github.com/sierra-research/tau-bench, `tau_bench/envs/retail/wiki.md` and `airline/wiki.md`). The policies given to the agent.
   - Closest to a status check, but it's about whether an order can be cancelled, not about retrying: "An order can only be cancelled if its status is 'pending', and you should check its status before taking the action."
   - Closest to "don't repeat", but the reason is a tool limit: "Exchange or modify order tools can only be called once. Be sure that all items to be changed are collected into a list before making the tool call!!!"
   - "Before taking consequential actions that update the database (cancel, modify, return, exchange), you have to list the action detail and obtain explicit user confirmation (yes) to proceed."
2. **τ²-bench** (github.com/sierra-research/tau2-bench, `data/tau2/domains/retail/policy.md`, `airline/policy.md`, `src/tau2/domains/retail/tools.py`). The same status-check and "called once" lines. Airline: "Always confirms the facts before offering compensation." Tool text: "The agent needs to explain the cancellation detail and ask for explicit user confirmation (yes/no) to proceed." Nothing on retries or repeats.
3. **OpenAI Agents SDK customer service example** (openai-agents-python, `examples/customer_service/main.py`). Airline seats and FAQ, no money tools. None of the three.
4. **OpenAI customer service demo** (github.com/openai/openai-cs-agents-demo, `python-backend/airline/agents.py` and `tools.py`). Has a refunds and compensation agent.
   - "For cancellations, confirm details and use cancel_flight."
   - Pushes the other way on confirming: "let the specialist complete multi-step work without asking the user to confirm after each tool call."
   - Nothing on retries in the prompt. In code, `issue_compensation` reuses an existing case id, so a repeat call doesn't open a second case.
5. **Stripe agent toolkit, `create_refund`** (github.com/stripe/ai, last version from git history; now retired in favour of Stripe's hosted MCP). "This tool will refund a payment intent in Stripe." No repeat-safe key is sent. None of the three.
6. **Stripe `stripe-pay` skill** (github.com/stripe/agent-toolkit, `skills/stripe-pay/SKILL.md`). For an agent that sends money.
   - "Before running a command that can send money, show the exact `stripe pay ...` command you plan to run and get confirmation."
   - Partly about status: "Don't report payment success from returning or opening the URL" and "Don't retry the transfer until the recipient's setup is corrected."
   - Partly about repeats: "Don't ... rerun with `--yes` to pay the link."
   - The same repo's `metronome` skill, which is coding guidance rather than an agent moving money, says to send the same `transaction_id` "re-sent unchanged on every retry ... This is the idempotency key that prevents double-counting on retries".
7. **PayPal agent toolkit** (`typescript/src/shared/prompts.ts`). "If multiple captures exist for an order, request clarification on which specific capture to refund." Nothing on retries or repeats in the prompts. In code, `client.ts` adds PayPal's repeat-safe `PayPal-Request-Id` header, but only if the developer sets `request_id`.
8. **Coinbase AgentKit** (transfer actions, x402 actions, example chatbots).
   - "WARNING: This action automatically handles payments without asking for confirmation! Only use this when explicitly told to skip the confirmation flow." A guardrails example also holds transfers for approval in code.
   - Pushes the other way on retries: "If there is a 5XX (internal) HTTP error code, ask the user to try again later." Nothing about checking whether the transfer already went through.
   - A repeat-safe key is used only when creating a wallet.
9. **Anthropic cookbook customer service agent** (claude-cookbooks, `tool_use/customer_service_agent.ipynb`). No system prompt. `cancel_order`: "Cancels an order based on the provided order ID." None of the three.
10. **Google ADK customer service sample** (`python/agents/customer-service/customer_service/prompts.py`, from git history; deleted on 9 September 2026). Discounts, no refunds. "Always confirm actions with the user before executing them" and "Request manager approval for discounts when necessary". For carts: "before modifying a cart first access_cart_information to see what is already in the cart".
11. **LangGraph customer support tutorial** (`docs/docs/tutorials/customer-support/customer-support.ipynb` at tag 0.2.74). "Confirm the updated flight details with the customer and inform them of any additional fees." Sensitive tools pause for approval. Pushes the other way on retries: any tool error is answered with "Error: ... please fix your mistakes."
12. **Leaked prompt collections** (github.com/x1xhlol/system-prompts-and-models-of-ai-tools, github.com/asgeirtj/system_prompts_leaks). Searched for refund, idempotency, double charge and duplicate payment. No payments or refunds agent in either.

Not checked: the OpenAI cookbook, and the tool descriptions on Stripe's hosted MCP server, which isn't in a repository.
