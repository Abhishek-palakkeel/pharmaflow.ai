"""
Visit Notes NLP Analysis
--------------------------
A lightweight, local, keyword/lexicon-based sentiment and keyword
extraction engine for visit notes. No external API calls are made.

The interface (`analyze_note`) is intentionally provider-agnostic so a
call to Gemini / OpenAI / a local Ollama model can be dropped in later
by replacing the body of `analyze_note` while keeping the same return
shape: {sentiment, requires_follow_up, keywords}.
"""
import re
from typing import Dict, List

POSITIVE_WORDS = {
    "great", "excellent", "positive", "happy", "satisfied", "interested",
    "good", "impressed", "convinced", "supportive", "receptive", "pleased",
    "enthusiastic", "successful", "agreed", "prescribing", "loyal", "trust",
    "helpful", "productive", "confident",
}

NEGATIVE_WORDS = {
    "unhappy", "dissatisfied", "complaint", "complained", "issue", "problem",
    "concern", "concerned", "angry", "frustrated", "delay", "delayed",
    "rejected", "refused", "negative", "poor", "disappointed", "shortage",
    "stockout", "side effect", "side-effects", "adverse", "unavailable",
    "cancelled", "unresponsive", "difficult",
}

FOLLOW_UP_TRIGGERS = {
    "follow up", "follow-up", "followup", "call back", "call again",
    "next visit", "revisit", "pending", "awaiting", "will check",
    "need to", "requires", "schedule", "reminder", "send sample",
    "share brochure", "provide", "callback",
}

STOPWORDS = {
    "the", "a", "an", "and", "or", "is", "are", "was", "were", "to", "of",
    "in", "on", "for", "with", "at", "by", "this", "that", "he", "she",
    "they", "it", "will", "be", "has", "have", "had", "as", "from", "we",
    "i", "his", "her", "their", "about", "very", "not", "no",
}


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z\-]+", text.lower())


def analyze_note(text: str) -> Dict:
    if not text or not text.strip():
        return {
            "sentiment": "neutral",
            "requires_follow_up": False,
            "keywords": [],
        }

    lowered = text.lower()
    tokens = _tokenize(text)

    pos_hits = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg_hits = sum(1 for t in tokens if t in NEGATIVE_WORDS)

    if pos_hits > neg_hits:
        sentiment = "positive"
    elif neg_hits > pos_hits:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    requires_follow_up = any(trigger in lowered for trigger in FOLLOW_UP_TRIGGERS) or neg_hits > 0

    # Simple keyword extraction: frequency-based, stopwords removed, min length 4
    freq = {}
    for t in tokens:
        if t in STOPWORDS or len(t) < 4:
            continue
        freq[t] = freq.get(t, 0) + 1
    keywords = sorted(freq.keys(), key=lambda k: (-freq[k], k))[:6]

    return {
        "sentiment": sentiment,
        "requires_follow_up": requires_follow_up,
        "keywords": keywords,
    }
