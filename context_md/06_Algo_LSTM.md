# Algorithm: Long Short-Term Memory (LSTM)

## Objective
Detect "Tool Usage Sequence Anomalies". This model observes the chronological order of tools and APIs called by the AI to ensure the sequence matches acceptable standard operating procedures.

## How It Works
LSTMs are a type of Recurrent Neural Network (RNN) specifically designed to remember long-term dependencies in sequence data. 
1. The model takes a sequence of tool IDs.
2. It maintains a hidden state that represents the "context" of what has happened so far in the execution.
3. At each step, it predicts the likelihood of the next tool call.
4. If an actual tool sequence has a drastically low probability according to the LSTM (e.g., calling an external network API immediately after querying a local credential store), it flags the sequence as an anomaly.

## Why it fits this framework
- **Temporal Context:** Static models cannot tell if `[Auth] -> [Download]` is safer than `[Download] -> [Auth]`. LSTMs inherently understand sequence order.
- **Deep Learning Capabilities:** Handles complex, non-linear relationships in tool orchestration.
