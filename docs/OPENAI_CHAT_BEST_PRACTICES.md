# OpenAI Chat Completion Best Practices

- **Set `max_tokens` just high enough**: Choose a limit that matches your tone. Ivy caps replies around 150 tokens and asks the model to stay within two sentences. If you receive a `finish_reason` of `"length"`, you can ask the model to continue.
- **Check `finish_reason`**: Inspect the `finish_reason` on every response. A `"length"` value indicates truncation; applications can append "Please continue" and retry to complete the reply.
- **Use clear system prompts**: Directives like "respond in two sentences" guide the model better than relying solely on token caps.
- **Trim conversation context**: Summarize or discard older turns to stay within context limits and reduce token usage.
- **Stream when possible**: Streaming responses lowers latency and reveals truncation early if the connection drops.
- **Monitor token usage**: Track `usage.total_tokens` to detect unexpectedly long conversations and manage costs.

These practices minimize cutoff responses and keep chat interactions efficient.
