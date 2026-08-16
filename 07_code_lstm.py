import json
import torch
import torch.nn as nn
import pandas as pd
from pathlib import Path

class SequenceModel(nn.Module):
    def __init__(self, vocab_size, embedding_dim=16, hidden_dim=32):
        super(SequenceModel, self).__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x):
        embedded = self.embedding(x)
        output, (hidden, cell) = self.lstm(embedded)
        logits = self.fc(output)
        return logits

def build_vocab(sequences):
    vocab = {"<PAD>": 0, "<UNK>": 1, "<END>": 2}
    for seq in sequences:
        for tool in seq:
            if tool not in vocab:
                vocab[tool] = len(vocab)
    return vocab

def encode_sequence(seq, vocab):
    return [vocab.get(tool, vocab["<UNK>"]) for tool in seq]

def train_lstm(csv_path='feature_table.csv', model_path='lstm_model.pt', vocab_path='lstm_vocab.json'):
    print("Loading data for LSTM...")
    df = pd.read_csv(csv_path)
    benign_df = df[df['label'] == 0]
    
    sequences = [str(x).split(',') for x in benign_df['tool_sequence'].dropna() if str(x) != ""]
    
    vocab = build_vocab(sequences)
    with open(vocab_path, 'w') as f:
        json.dump(vocab, f)
    
    model = SequenceModel(len(vocab))
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    criterion = nn.CrossEntropyLoss()
    
    print(f"Training on {len(sequences)} benign sequences...")
    model.train()
    for epoch in range(10): # Quick training for demo
        total_loss = 0
        for seq in sequences:
            if not seq: continue
            
            encoded = encode_sequence(seq, vocab)
            # Input: sequence, Target: next tool in sequence + END
            input_seq = torch.tensor([encoded], dtype=torch.long)
            target_seq = torch.tensor([encoded[1:] + [vocab["<END>"]]], dtype=torch.long)
            
            optimizer.zero_grad()
            logits = model(input_seq)
            
            loss = criterion(logits.view(-1, len(vocab)), target_seq.view(-1))
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
    torch.save(model.state_dict(), model_path)
    print(f"LSTM model saved to {model_path} with vocab size {len(vocab)}")

def predict_lstm(tool_sequence, model_path='lstm_model.pt', vocab_path='lstm_vocab.json'):
    with open(vocab_path, 'r') as f:
        vocab = json.load(f)
    
    model = SequenceModel(len(vocab))
    model.load_state_dict(torch.load(model_path, weights_only=True))
    model.eval()
    
    if not tool_sequence:
        return {"is_anomaly": False, "anomaly_score": 0.0, "tool_sequence_analyzed": tool_sequence}
        
    encoded = encode_sequence(tool_sequence, vocab)
    input_seq = torch.tensor([encoded], dtype=torch.long)
    target_seq = encoded[1:] + [vocab["<END>"]]
    
    with torch.no_grad():
        logits = model(input_seq)
        probs = torch.softmax(logits, dim=-1)[0]
        
    # Calculate avg probability of the true sequence
    seq_prob = 1.0
    for i, target_idx in enumerate(target_seq):
        seq_prob *= probs[i, target_idx].item()
        
    anomaly_score = 1.0 - seq_prob
    
    return {
        "is_anomaly": bool(anomaly_score > 0.8),
        "anomaly_score": float(anomaly_score),
        "tool_sequence_analyzed": tool_sequence
    }

if __name__ == "__main__":
    train_lstm()
