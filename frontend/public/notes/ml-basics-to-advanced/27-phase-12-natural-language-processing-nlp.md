> **You asked:**
>
> Phase 12: Natural Language Processing (NLP)
> Text Cleaning
> Tokenization
> Stop Words
> Stemming
> Lemmatization
> TF-IDF
> Bag of Words
> Word2Vec
> FastText
> BERT Basics
> Sentiment Analysis
> Text Classification

# Phase 12: Natural Language Processing — NLP

NLP means **Natural Language Processing**.

Simple meaning:

```text
NLP = Teaching computers to understand human language
```

Examples:

```text
Chatbot
Google Translate
Sentiment Analysis
Spam Detection
Text Classification
Resume Screening
Voice Assistant
Search Engine
```

---

# 1. What is NLP?

## Easy Definition

NLP is a field of AI that helps computers understand, process, and generate human language.

Example:

```text
Input text: "This movie is very good"

NLP model understands:
Sentiment = Positive
```

## Interview Answer

NLP stands for Natural Language Processing. It is a branch of AI that deals with understanding and processing human language such as text and speech.

---

# 2. NLP Pipeline

In real projects, NLP usually follows these steps:

```text
1. Collect text data
2. Clean text
3. Tokenization
4. Remove stop words
5. Stemming or Lemmatization
6. Convert text into numbers
7. Train ML/DL model
8. Evaluate model
9. Predict new text
```

Why convert text into numbers?

```text
Machine learning models do not understand raw text.
They understand numbers.
```

Example:

```text
Text: "I love data science"

Converted into numbers:
[0.23, 0.87, 0.44, 0.12]
```

---

# 3. Text Cleaning

## Easy Definition

Text cleaning means removing unnecessary things from text.

Raw text is usually messy.

Example:

```text
"Wow!!! This Movie is AMAZING 😂 https://abc.com"
```

After cleaning:

```text
"wow movie amazing"
```

---

## Common Text Cleaning Steps

| Step | Example |
|---|---|
| Lowercase conversion | `"HELLO"` → `"hello"` |
| Remove punctuation | `"hello!!!"` → `"hello"` |
| Remove numbers | `"movie123"` → `"movie"` |
| Remove URLs | `"https://abc.com"` → removed |
| Remove emojis | `"good 😊"` → `"good"` |
| Remove extra spaces | `"hello    world"` → `"hello world"` |

---

## Text Cleaning Code

```python
import re

text = "Wow!!! This Movie is AMAZING 😂 https://abc.com 123"

# Lowercase
text = text.lower()

# Remove URLs
text = re.sub(r"http\S+|www\S+", "", text)

# Remove non-alphabet characters
text = re.sub(r"[^a-zA-Z\s]", "", text)

# Remove extra spaces
text = re.sub(r"\s+", " ", text).strip()

print(text)
```

Output:

```text
wow this movie is amazing
```

---

## Interview Answer

Text cleaning is the process of removing unnecessary characters, punctuation, URLs, numbers, emojis, and extra spaces from text before applying NLP techniques.

---

# 4. Tokenization

## Easy Definition

Tokenization means breaking text into smaller parts.

These smaller parts are called **tokens**.

Example:

```text
Sentence: "I love machine learning"

Tokens:
["I", "love", "machine", "learning"]
```

---

## Types of Tokenization

| Type | Meaning | Example |
|---|---|---|
| Word Tokenization | Split text into words | `"I love ML"` → `["I", "love", "ML"]` |
| Sentence Tokenization | Split paragraph into sentences | `"Hi. How are you?"` → `["Hi.", "How are you?"]` |
| Subword Tokenization | Split words into small parts | `"unhappy"` → `["un", "happy"]` |

---

## Tokenization Code

```python
text = "I love machine learning"

tokens = text.split()

print(tokens)
```

Output:

```text
['I', 'love', 'machine', 'learning']
```

---

## Tokenization Using NLTK

Install:

```bash
pip install nltk
```

Code:

```python
import nltk
from nltk.tokenize import word_tokenize

nltk.download("punkt")

text = "I love machine learning."

tokens = word_tokenize(text)

print(tokens)
```

---

## Interview Answer

Tokenization is the process of breaking text into smaller units such as words, sentences, or subwords. These units are called tokens.

---

# 5. Stop Words

## Easy Definition

Stop words are common words that usually do not add much meaning.

Examples:

```text
is
am
are
the
a
an
in
on
of
and
to
```

Sentence:

```text
"This is a very good movie"
```

After removing stop words:

```text
"very good movie"
```

---

## Why Remove Stop Words?

Because they appear frequently and may not help in many NLP tasks.

But important point:

```text
Do not always remove stop words.
```

For sentiment analysis, some stop words can be important.

Example:

```text
"This movie is not good"
```

If we remove `"not"`:

```text
"movie good"
```

Meaning changes completely.

---

## Stop Words Code

```python
import nltk
from nltk.corpus import stopwords

nltk.download("stopwords")

text = "this is a very good movie"

words = text.split()

stop_words = set(stopwords.words("english"))

filtered_words = []

for word in words:
    if word not in stop_words:
        filtered_words.append(word)

print(filtered_words)
```

Output:

```text
['good', 'movie']
```

---

## Interview Answer

Stop words are common words like “is”, “the”, “a”, and “and” that are often removed during text preprocessing because they may not add much meaning. But in sentiment analysis, words like “not” should be handled carefully.

---

# 6. Stemming

## Easy Definition

Stemming means reducing a word to its root form by cutting the ending.

Example:

```text
playing  → play
played   → play
player   → play
studies  → studi
```

Important point:

```text
Stemming may produce words that are not real dictionary words.
```

Example:

```text
studies → studi
```

---

## Stemming Code

```python
from nltk.stem import PorterStemmer

stemmer = PorterStemmer()

words = ["playing", "played", "player", "studies", "studying"]

for word in words:
    print(word, "→", stemmer.stem(word))
```

Output:

```text
playing → play
played → play
player → player
studies → studi
studying → studi
```

---

## When to Use Stemming?

Use stemming when:

```text
Speed is important
Exact dictionary meaning is not required
Simple search engine or text matching task
```

## Interview Answer

Stemming reduces words to their root form by removing suffixes. It is fast but may produce non-dictionary words.

---

# 7. Lemmatization

## Easy Definition

Lemmatization also reduces words to base form, but it gives a proper dictionary word.

Example:

```text
running → run
better  → good
studies → study
```

---

## Stemming vs Lemmatization

| Stemming | Lemmatization |
|---|---|
| Cuts word ending | Converts to dictionary base form |
| Faster | Slower |
| May give wrong word | Gives meaningful word |
| `studies → studi` | `studies → study` |
| Rule-based | Uses vocabulary/grammar |

---

## Lemmatization Code

```python
import nltk
from nltk.stem import WordNetLemmatizer

nltk.download("wordnet")
nltk.download("omw-1.4")

lemmatizer = WordNetLemmatizer()

words = ["running", "studies", "better", "cars"]

for word in words:
    print(word, "→", lemmatizer.lemmatize(word))
```

Output:

```text
running → running
studies → study
better → better
cars → car
```

For verbs, specify POS:

```python
print(lemmatizer.lemmatize("running", pos="v"))
```

Output:

```text
run
```

---

## Interview Answer

Lemmatization reduces words to their meaningful dictionary base form. It is more accurate than stemming but slower.

---

# 8. Bag of Words — BoW

## Easy Definition

Bag of Words converts text into numbers by counting word frequency.

Simple meaning:

```text
BoW = Count how many times each word appears
```

Example sentences:

```text
S1: I love data
S2: I love machine learning
```

Vocabulary:

```text
["I", "love", "data", "machine", "learning"]
```

Vector form:

| Sentence | I | love | data | machine | learning |
|---|---:|---:|---:|---:|---:|
| S1 | 1 | 1 | 1 | 0 | 0 |
| S2 | 1 | 1 | 0 | 1 | 1 |

---

## Bag of Words Code

```python
from sklearn.feature_extraction.text import CountVectorizer

texts = [
    "I love data",
    "I love machine learning",
    "Data science is amazing"
]

vectorizer = CountVectorizer()

X = vectorizer.fit_transform(texts)

print("Vocabulary:", vectorizer.get_feature_names_out())
print(X.toarray())
```

---

## Advantages of BoW

```text
Simple
Easy to understand
Works well for basic text classification
```

## Limitations of BoW

```text
Ignores word order
Creates large sparse matrix
Does not understand meaning
```

Example problem:

```text
"good movie"
"not good movie"
```

BoW may struggle if context is not handled properly.

---

## Interview Answer

Bag of Words converts text into numerical vectors by counting word frequency. It is simple but ignores grammar, order, and meaning.

---

# 9. TF-IDF

## Easy Definition

TF-IDF gives importance score to words.

Full form:

```text
TF-IDF = Term Frequency - Inverse Document Frequency
```

Simple meaning:

```text
Important word gets high score.
Common word gets low score.
```

---

## TF Meaning

TF means how often a word appears in a document.

```text
TF = Number of times word appears / Total words in document
```

---

## IDF Meaning

IDF reduces the importance of common words.

Example:

```text
"the", "is", "and"
```

These words appear in many documents, so they get low importance.

---

## TF-IDF Example

Suppose word `"data"` appears frequently in one document but not in many other documents.

Then:

```text
"data" gets high TF-IDF score
```

If word `"the"` appears everywhere:

```text
"the" gets low TF-IDF score
```

---

## TF-IDF Code

```python
from sklearn.feature_extraction.text import TfidfVectorizer

texts = [
    "I love data science",
    "Machine learning is part of data science",
    "I love machine learning"
]

vectorizer = TfidfVectorizer()

X = vectorizer.fit_transform(texts)

print("Vocabulary:", vectorizer.get_feature_names_out())
print(X.toarray())
```

---

## BoW vs TF-IDF

| Bag of Words | TF-IDF |
|---|---|
| Counts word frequency | Gives word importance |
| Common words may dominate | Common words get lower score |
| Simple | More powerful |
| Good baseline | Better for text classification |
| Ignores meaning | Still ignores deep meaning |

---

## Interview Answer

TF-IDF converts text into numerical vectors by giving higher weight to important words and lower weight to common words. It is widely used in text classification and search systems.

---

# 10. Word Embeddings

Before Word2Vec, FastText, and BERT, understand word embeddings.

## Easy Definition

Word embeddings represent words as dense numerical vectors.

Simple meaning:

```text
Word → Vector of numbers
```

Example:

```text
king  → [0.25, 0.71, 0.13]
queen → [0.27, 0.69, 0.15]
apple → [0.90, 0.12, 0.44]
```

Words with similar meaning have similar vectors.

Example:

```text
king and queen are close
car and vehicle are close
good and excellent are close
```

---

# 11. Word2Vec

## Easy Definition

Word2Vec converts words into vectors based on context.

Simple meaning:

```text
Words used in similar context get similar vectors.
```

Example:

```text
king, queen, prince, princess
```

These words may appear in similar contexts, so their vectors become close.

---

## Word2Vec Types

| Type | Meaning |
|---|---|
| CBOW | Predict target word from surrounding words |
| Skip-Gram | Predict surrounding words from target word |

---

## CBOW Example

Sentence:

```text
I love machine learning
```

Context words:

```text
I, love, learning
```

Target word:

```text
machine
```

CBOW learns:

```text
Context → Target
```

---

## Skip-Gram Example

Target word:

```text
machine
```

Surrounding words:

```text
I, love, learning
```

Skip-Gram learns:

```text
Target → Context
```

---

## Word2Vec Code

Install:

```bash
pip install gensim
```

Code:

```python
from gensim.models import Word2Vec

sentences = [
    ["i", "love", "machine", "learning"],
    ["machine", "learning", "is", "amazing"],
    ["i", "love", "data", "science"],
    ["data", "science", "uses", "machine", "learning"]
]

model = Word2Vec(
    sentences=sentences,
    vector_size=50,
    window=2,
    min_count=1,
    workers=4,
    sg=1
)

print(model.wv["machine"])

similar_words = model.wv.most_similar("machine")

print(similar_words)
```

---

## Important Parameters

| Parameter | Meaning |
|---|---|
| `vector_size` | Size of word vector |
| `window` | Number of nearby words |
| `min_count` | Minimum word frequency |
| `sg=0` | CBOW |
| `sg=1` | Skip-Gram |

---

## Advantages of Word2Vec

```text
Captures semantic meaning
Dense vectors
Better than BoW and TF-IDF for meaning
```

## Limitations

```text
Cannot handle unknown words well
One word has one vector
Does not understand context like BERT
```

Example problem:

```text
"bank" in river bank
"bank" in money bank
```

Word2Vec gives same vector for both.

---

## Interview Answer

Word2Vec is a word embedding technique that converts words into dense vectors based on their context. It has two architectures: CBOW and Skip-Gram.

---

# 12. FastText

## Easy Definition

FastText is an advanced word embedding technique developed to handle subwords.

Simple meaning:

```text
FastText learns word meaning using smaller parts of words.
```

Example:

```text
playing = play + ing
unhappy = un + happy
```

---

## Why FastText is Better Than Word2Vec?

Word2Vec learns full words.

FastText learns subword information.

So FastText can handle rare or unknown words better.

Example:

```text
Known word: play
Unknown word: playinggg
```

FastText can still understand using subword parts.

---

## FastText Code

```python
from gensim.models import FastText

sentences = [
    ["i", "love", "machine", "learning"],
    ["machine", "learning", "is", "amazing"],
    ["i", "love", "data", "science"],
    ["data", "science", "uses", "machine", "learning"]
]

model = FastText(
    sentences=sentences,
    vector_size=50,
    window=2,
    min_count=1,
    workers=4
)

print(model.wv["machine"])
print(model.wv.most_similar("machine"))
```

---

## Word2Vec vs FastText

| Word2Vec | FastText |
|---|---|
| Learns word-level vectors | Learns subword-level vectors |
| Poor for unknown words | Better for unknown words |
| Good for common words | Good for rare/morphological words |
| Does not use character n-grams | Uses character n-grams |

---

## Interview Answer

FastText is a word embedding technique that represents words using subword information. It handles rare and unknown words better than Word2Vec.

---

# 13. BERT Basics

## Easy Definition

BERT is a transformer-based language model that understands context from both left and right sides of a word.

Full form:

```text
BERT = Bidirectional Encoder Representations from Transformers
```

Simple meaning:

```text
BERT understands the meaning of a word based on full sentence context.
```

---

## Why BERT is Powerful?

Traditional models like Word2Vec give the same vector for a word every time.

Example word:

```text
bank
```

Sentence 1:

```text
I deposited money in the bank.
```

Sentence 2:

```text
I sat near the river bank.
```

Word2Vec may give same vector for `"bank"`.

BERT gives different meaning based on sentence context.

---

## BERT Main Ideas

| Concept | Easy Meaning |
|---|---|
| Transformer | Deep learning architecture for language |
| Attention | Focuses on important words |
| Bidirectional | Reads left and right context |
| Pre-trained Model | Already trained on huge text |
| Fine-tuning | Train BERT on your specific task |

---

## BERT Use Cases

```text
Sentiment analysis
Text classification
Question answering
Named entity recognition
Chatbots
Search ranking
Text similarity
```

---

## BERT Simple Code Using Transformers

Install:

```bash
pip install transformers torch
```

Code:

```python
from transformers import pipeline

classifier = pipeline("sentiment-analysis")

text = "I love this product. It is amazing!"

result = classifier(text)

print(result)
```

Output example:

```text
[{'label': 'POSITIVE', 'score': 0.999}]
```

---

## BERT Text Classification Idea

```python
from transformers import pipeline

classifier = pipeline("text-classification")

text = "This movie is boring and too long."

result = classifier(text)

print(result)
```

---

## Interview Answer

BERT is a transformer-based pre-trained language model that understands word meaning using both left and right context. It is widely used for NLP tasks like sentiment analysis, text classification, question answering, and named entity recognition.

---

# 14. Sentiment Analysis

## Easy Definition

Sentiment Analysis means finding emotion/opinion from text.

Output can be:

```text
Positive
Negative
Neutral
```

Example:

```text
"I love this phone" → Positive
"This product is bad" → Negative
"It is okay" → Neutral
```

---

## Sentiment Analysis Applications

```text
Movie review analysis
Product review analysis
Twitter sentiment
Customer feedback
Brand monitoring
Political opinion analysis
App review analysis
```

---

## Sentiment Analysis Using TF-IDF + Logistic Regression

```python
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

# Sample dataset
df = pd.DataFrame({
    "review": [
        "I love this product",
        "This is amazing",
        "Very good experience",
        "I hate this product",
        "This is bad",
        "Very poor quality"
    ],
    "sentiment": [1, 1, 1, 0, 0, 0]
})

X = df["review"]
y = df["sentiment"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.33,
    random_state=42
)

# Convert text into TF-IDF vectors
vectorizer = TfidfVectorizer()

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# Train model
model = LogisticRegression()
model.fit(X_train_tfidf, y_train)

# Prediction
y_pred = model.predict(X_test_tfidf)

print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred, zero_division=0))

# Predict new review
new_review = ["This product is very good"]

new_review_tfidf = vectorizer.transform(new_review)

prediction = model.predict(new_review_tfidf)

if prediction[0] == 1:
    print("Sentiment: Positive")
else:
    print("Sentiment: Negative")
```

---

## Interview Answer

Sentiment Analysis is an NLP task used to identify whether a text expresses positive, negative, or neutral sentiment. It is commonly used for reviews, social media, and customer feedback.

---

# 15. Text Classification

## Easy Definition

Text Classification means assigning a category/class to text.

Examples:

| Text | Category |
|---|---|
| `"Win free money now"` | Spam |
| `"Your order has shipped"` | Not Spam |
| `"I love this movie"` | Positive |
| `"Stock market falls"` | Business News |
| `"India wins match"` | Sports News |

---

## Text Classification Pipeline

```text
1. Collect labeled text data
2. Clean text
3. Tokenize text
4. Remove stop words if needed
5. Convert text into numbers using BoW/TF-IDF/Embeddings
6. Train model
7. Evaluate model
8. Predict class for new text
```

---

## Text Classification Code: TF-IDF + Naive Bayes

```python
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report

# Sample data
df = pd.DataFrame({
    "message": [
        "Win free money now",
        "Limited offer claim prize",
        "Hello, how are you",
        "Meeting is scheduled tomorrow",
        "Get free discount now",
        "Please send project report"
    ],
    "label": [1, 1, 0, 0, 1, 0]  # 1 = spam, 0 = not spam
})

X = df["message"]
y = df["label"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.33,
    random_state=42
)

# TF-IDF
vectorizer = TfidfVectorizer(stop_words="english")

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Model
model = MultinomialNB()
model.fit(X_train_vec, y_train)

# Prediction
y_pred = model.predict(X_test_vec)

print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred, zero_division=0))

# New text prediction
new_text = ["win free prize now"]

new_text_vec = vectorizer.transform(new_text)

prediction = model.predict(new_text_vec)

if prediction[0] == 1:
    print("Spam")
else:
    print("Not Spam")
```

---

## Common Models for Text Classification

| Model | Use |
|---|---|
| Naive Bayes | Spam detection, fast baseline |
| Logistic Regression | Sentiment/text classification |
| SVM | High-dimensional text data |
| Random Forest | Basic text classification |
| LSTM/GRU | Sequence-based text |
| BERT | Advanced contextual text classification |

---

# 16. Full NLP Preprocessing Function

```python
import re
import nltk

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download("stopwords")
nltk.download("wordnet")
nltk.download("omw-1.4")

stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    # Lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r"http\S+|www\S+", "", text)

    # Remove non-alphabet characters
    text = re.sub(r"[^a-zA-Z\s]", "", text)

    # Tokenize
    words = text.split()

    # Remove stop words and lemmatize
    cleaned_words = []

    for word in words:
        if word not in stop_words:
            lemma = lemmatizer.lemmatize(word)
            cleaned_words.append(lemma)

    # Join back
    return " ".join(cleaned_words)

text = "Wow!!! This product is AMAZING and I loved it."

print(clean_text(text))
```

Output:

```text
wow product amazing loved
```

---

# 17. BoW vs TF-IDF vs Word2Vec vs FastText vs BERT

| Technique | Type | Meaning | Best For |
|---|---|---|---|
| Bag of Words | Count-based | Counts word frequency | Simple baseline |
| TF-IDF | Count + importance | Gives importance to words | Text classification |
| Word2Vec | Embedding | Learns word meaning from context | Semantic similarity |
| FastText | Subword embedding | Uses character n-grams | Rare/unknown words |
| BERT | Contextual embedding | Understands full sentence context | Advanced NLP tasks |

---

# 18. Which Technique Should You Use?

| Situation | Best Choice |
|---|---|
| Beginner text classification | TF-IDF + Logistic Regression |
| Spam detection | TF-IDF + Naive Bayes |
| Sentiment analysis baseline | TF-IDF + Logistic Regression |
| Need word similarity | Word2Vec |
| Many spelling variations/rare words | FastText |
| Need advanced accuracy | BERT |
| Small dataset | TF-IDF models |
| Large NLP project | BERT / transformer models |

---

# 19. NLP Project Ideas for Interview

## Project 1: Sentiment Analysis

```text
Input: Product review
Output: Positive or Negative
```

Techniques:

```text
Text cleaning
TF-IDF
Logistic Regression
Classification metrics
```

---

## Project 2: Spam Detection

```text
Input: SMS or email
Output: Spam or Not Spam
```

Techniques:

```text
Text cleaning
Stop words removal
TF-IDF
Naive Bayes
```

---

## Project 3: News Category Classification

```text
Input: News headline
Output: Sports, Business, Politics, Technology
```

Techniques:

```text
TF-IDF
Logistic Regression
SVM
BERT
```

---

## Project 4: Resume Screening

```text
Input: Resume text
Output: Suitable or Not Suitable
```

Techniques:

```text
Text extraction
TF-IDF
Cosine similarity
Text classification
```

---

# 20. How to Explain NLP Project in Interview

```text
I built a sentiment analysis project using NLP.

First, I collected review text data and cleaned it by converting text to lowercase, removing punctuation, URLs, and extra spaces.

Then I tokenized the text and removed unnecessary stop words. After preprocessing, I converted text into numerical features using TF-IDF.

I trained a Logistic Regression model to classify reviews as positive or negative. I evaluated the model using accuracy, precision, recall, and F1 score.

This project helped me understand how raw text can be converted into numerical features and used for machine learning classification.
```

---

# 21. Most Asked NLP Interview Questions

## Q1. What is NLP?

NLP is a branch of AI that helps computers understand and process human language.

---

## Q2. What is text cleaning?

Text cleaning is the process of removing unnecessary things like punctuation, URLs, emojis, numbers, and extra spaces from text.

---

## Q3. What is tokenization?

Tokenization is the process of splitting text into smaller units like words, sentences, or subwords.

---

## Q4. What are stop words?

Stop words are common words like “is”, “the”, “a”, and “and” that may not add much meaning.

---

## Q5. Stemming vs Lemmatization?

```text
Stemming cuts words to root form and may produce incorrect words.
Lemmatization converts words to meaningful dictionary base form.
```

Example:

```text
Stemming: studies → studi
Lemmatization: studies → study
```

---

## Q6. What is Bag of Words?

Bag of Words converts text into numerical vectors by counting word frequency.

---

## Q7. What is TF-IDF?

TF-IDF gives importance score to words. Important words get high score and very common words get lower score.

---

## Q8. BoW vs TF-IDF?

```text
BoW counts word frequency.
TF-IDF gives importance score based on word frequency and rarity.
```

---

## Q9. What is Word2Vec?

Word2Vec is a word embedding technique that converts words into dense vectors based on context.

---

## Q10. What is FastText?

FastText is a word embedding method that uses subword information, so it handles rare and unknown words better than Word2Vec.

---

## Q11. What is BERT?

BERT is a transformer-based model that understands the meaning of words using both left and right sentence context.

---

## Q12. What is Sentiment Analysis?

Sentiment Analysis is an NLP task used to detect whether text is positive, negative, or neutral.

---

## Q13. What is Text Classification?

Text Classification means assigning a predefined category to text, such as spam/not spam or positive/negative.

---

# 22. Final Summary Table

| Concept | Easy Meaning | Example |
|---|---|---|
| NLP | Computer understands human language | Chatbot |
| Text Cleaning | Remove noise from text | Remove URLs |
| Tokenization | Split text into tokens | Words |
| Stop Words | Common low-meaning words | is, the, a |
| Stemming | Cut word to root | playing → play |
| Lemmatization | Dictionary base form | studies → study |
| Bag of Words | Count words | Word frequency |
| TF-IDF | Word importance score | Search/classification |
| Word2Vec | Dense word vectors | Similar words close |
| FastText | Subword embeddings | Handles rare words |
| BERT | Contextual language model | Advanced NLP |
| Sentiment Analysis | Detect emotion/opinion | Positive/Negative |
| Text Classification | Assign category to text | Spam/Not Spam |

---

# Final Interview Summary

```text
NLP is a branch of AI that helps computers understand and process human language.

In NLP, we first clean text by removing unnecessary characters, URLs, punctuation, and extra spaces. Then we tokenize text into words or subwords. Stop words can be removed if they do not add meaning.

Stemming and lemmatization reduce words to base form. Stemming is faster but less accurate, while lemmatization gives meaningful dictionary words.

Since ML models understand numbers, we convert text into numerical features using Bag of Words, TF-IDF, Word2Vec, FastText, or BERT.

Bag of Words counts word frequency. TF-IDF gives importance to words. Word2Vec and FastText create word embeddings. BERT gives contextual embeddings and understands sentence meaning better.

Sentiment Analysis detects positive, negative, or neutral emotion from text. Text Classification assigns categories such as spam/not spam, news category, or product review sentiment.

For beginner projects, I use TF-IDF with Logistic Regression or Naive Bayes. For advanced NLP tasks, I use BERT or transformer-based models.
```
