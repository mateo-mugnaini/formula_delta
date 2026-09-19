# Formula Delta F1 Probe

The probe is a Phase 0 discovery tool. It is intentionally independent from
the future Formula Delta backend and does not parse or normalize Formula 1
payloads.

## Requirements

- Node.js 20.19+ with the experimental WebSocket API enabled, or Node.js 22+
  providing the standard `fetch` and `WebSocket` APIs;
- network access to the configured Formula 1 endpoint.

## Run

From this directory:

```bash
node --experimental-websocket probe.mjs
```

The default run connects to the currently expected endpoint, attempts the
conceptual SignalR subscription, prints lifecycle and topic observations, and
stops after five minutes. Override settings with environment variables:

```text
F1_SIGNALR_URL
F1_PROBE_DURATION_MS
F1_PROBE_OUTPUT_DIR
F1_PROBE_TOPICS_JSON
F1_PROBE_HUB_METHOD
F1_PROBE_SUBSCRIPTION_ARGS_JSON
F1_PROBE_MAX_RECONNECTS
```

The default output directory is `./output`. Set `F1_PROBE_DURATION_MS=0` to
run until interrupted. The probe retries unexpected WebSocket closures with
exponential backoff, up to three times by default.

## Output

Each run writes:

- `metadata.json` with configuration and observed summary;
- `events.jsonl` with one raw extracted message per line;
- `transport.jsonl` with received SignalR messages before topic extraction.

`events.jsonl` is intentionally not a normalized recording format yet. The
probe preserves the received value and records how the topic was identified.
Transport capture is diagnostic and may be removed or separated before the
normal Formula Delta recording implementation.

## Important Limitations

The exact Formula 1 hub method and subscription argument shape are not yet
verified. The defaults are a documented experiment, not a production protocol
contract. Use `F1_PROBE_SUBSCRIPTION_ARGS_JSON` to try a different invocation
shape without changing the tool.
