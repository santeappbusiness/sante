# Working with gpt-5.6-luna

Findings from the smoke test, kept here so the adapt route does not rediscover them.

## Luna is a reasoning model, and the tool loop has to respect that

When Luna calls a tool, its output array contains **paired items**: a `reasoning` item and the
`function_call` item that belongs to it. Sending only the `function_call` back on the next turn
fails with:

```
400 Item 'fc_...' of type 'function_call' was provided without its
required 'reasoning' item: 'rs_...'
```

So the loop must echo the model's entire `output` array, in order, before appending results:

```js
const followUp = [
  ...input,
  ...response.output,        // reasoning items AND function_call items, in order
  ...calls.map((c) => ({
    type: "function_call_output",
    call_id: c.call_id,
    output: JSON.stringify(result),
  })),
];
```

Do not filter that array. Do not reorder it. The alternative is chaining with
`previous_response_id`, which we are not using because we want the full transcript in hand for
the agent-event stream.

## What this does not change

Nothing about the safety model. The reasoning items are opaque to us and we never show them:
the agent event list displays what the loop *did* (called a tool, got options, produced a
plan), never the model's internal reasoning. That was the rule before and it stays the rule.

Everything Luna returns is still parsed with Zod and checked against the server-computed
constraints before it is trusted, and the deterministic fallback still owns the failure path.
