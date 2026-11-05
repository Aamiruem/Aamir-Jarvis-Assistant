# Lecture 07: NLP and Transformers

## NLP basics
NLP focuses on understanding and generating human language.

Typical tasks include:
- sentiment analysis
- text classification
- translation
- summarization
- chatbots

## Tokenization
Tokenization splits text into smaller units such as words or subwords.

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
encoded = tokenizer('Machine learning is powerful', return_tensors='pt')
print(encoded)
```

## Embeddings
Embeddings transform text into numeric vectors that capture semantic meaning.

## Sequence models
Sequence models like RNNs and LSTMs used to handle text order, but transformer-based models are now dominant.

## Transformers
Transformers use attention mechanisms to focus on relevant tokens in a sentence.

```python
from transformers import pipeline

sentiment = pipeline('sentiment-analysis')
print(sentiment('This course is very helpful!'))
```

## LLM basics
Large language models are trained on huge text corpora and can perform general reasoning, summarization, and question answering tasks.

## Summary
NLP moved from rule-based methods to deep learning and then to transformer models. Modern systems are more flexible and capable across a large range of language tasks.

## Interview note
An interview answer could be: “Transformers use self-attention to model relationships between all words in a sequence, which offers better context handling than earlier recurrent architectures.”
