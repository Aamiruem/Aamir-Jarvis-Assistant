"""Deep-learning version of the intent classifier, written in PyTorch.

    pip install -r requirements-dl.txt
    cd backend/fastapi-ai
    python -m ml.train_intent_dl

What you'll learn: tensors, a vocabulary / bag-of-words encoding, an nn.Module,
the training loop (forward -> loss -> backward -> optimizer step), and train/val
splits. Then compare its accuracy with the scikit-learn model (ml/train_intent.py).
Next steps: replace bag-of-words with nn.Embedding + nn.LSTM, or fine-tune a
small transformer (DistilBERT) with Hugging Face.
"""
import random
import re

import torch
from torch import nn

from app.config import settings
from app.nlp.intent import load_dataset

torch.manual_seed(0)
random.seed(0)


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


class BowMLP(nn.Module):
    def __init__(self, vocab_size: int, num_classes: int, hidden: int = 64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(vocab_size, hidden),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden, num_classes),
        )

    def forward(self, x):
        return self.net(x)


def main() -> None:
    texts, labels = load_dataset()
    data = list(zip(texts, labels))
    random.shuffle(data)
    split = int(len(data) * 0.8)
    train_set, val_set = data[:split], data[split:]

    vocab = {w: i for i, w in enumerate(sorted({w for t, _ in train_set for w in tokenize(t)}))}
    classes = sorted(set(labels))
    cls_idx = {c: i for i, c in enumerate(classes)}

    def encode(batch):
        x = torch.zeros(len(batch), len(vocab))
        for row, (text, _) in enumerate(batch):
            for w in tokenize(text):
                if w in vocab:
                    x[row, vocab[w]] = 1.0
        y = torch.tensor([cls_idx[label] for _, label in batch])
        return x, y

    x_train, y_train = encode(train_set)
    x_val, y_val = encode(val_set)

    model = BowMLP(len(vocab), len(classes))
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
    loss_fn = nn.CrossEntropyLoss()

    for epoch in range(1, 151):
        model.train()
        optimizer.zero_grad()
        loss = loss_fn(model(x_train), y_train)
        loss.backward()
        optimizer.step()
        if epoch % 25 == 0:
            model.eval()
            with torch.no_grad():
                acc = (model(x_val).argmax(1) == y_val).float().mean().item()
            print(f"epoch {epoch:3d}  loss {loss.item():.3f}  val_acc {acc:.2%}")

    out = settings.data_dir / "intent_mlp.pt"
    torch.save({"state_dict": model.state_dict(), "vocab": vocab, "classes": classes}, out)
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
