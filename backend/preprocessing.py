"""Text preprocessing for the customer support model.

IMPORTANT: This must match the exact preprocessing used before fitting TF-IDF.
"""

import html
import re

from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

NEGATION_WORDS = {"not", "no", "nor", "never", "cannot", "without"}
STOP_WORDS = set(ENGLISH_STOP_WORDS) - NEGATION_WORDS

CONTRACTIONS = {
    "i'm": "i am", "i've": "i have", "i'll": "i will", "i'd": "i would",
    "you're": "you are", "you've": "you have", "you'll": "you will", "you'd": "you would",
    "we're": "we are", "we've": "we have", "we'll": "we will",
    "they're": "they are", "they've": "they have", "they'll": "they will",
    "he's": "he is", "she's": "she is", "it's": "it is",
    "that's": "that is", "there's": "there is",
    "what's": "what is", "who's": "who is",
    "can't": "cannot", "won't": "will not", "isn't": "is not",
    "aren't": "are not", "wasn't": "was not", "weren't": "were not",
    "don't": "do not", "doesn't": "does not", "didn't": "did not",
    "hasn't": "has not", "haven't": "have not", "hadn't": "had not",
    "couldn't": "could not", "wouldn't": "would not", "shouldn't": "should not",
}


def clean_text(text: str) -> str:
    text = html.unescape(str(text))
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"@\w+", " ", text)
    text = re.sub(r"#(\w+)", r"\1", text)
    text = text.lower()

    for contraction, replacement in CONTRACTIONS.items():
        text = re.sub(rf"\b{re.escape(contraction)}\b", replacement, text)

    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def preprocess_text(text: str) -> str:
    words = clean_text(text).split()
    return " ".join(word for word in words if word not in STOP_WORDS)
