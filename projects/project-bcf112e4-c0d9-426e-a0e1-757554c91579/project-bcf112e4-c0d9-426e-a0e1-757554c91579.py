"""
Large-Scale Text Processing Task for Distributed Computing

This task processes text documents with computationally expensive NLP operations.
Each document undergoes: tokenization, feature extraction, similarity calculations,
and statistical analysis. This is a real research use case for distributed computing.

Use case: Researchers processing large text corpora (news articles, research papers,
social media posts, etc.) need to analyze thousands of documents quickly.
"""

import re
import time
import math
from collections import Counter
from typing import Dict, List, Any


def simple_tokenize(text: str) -> List[str]:
    """Tokenize text into words (simple but computationally expensive for long texts)."""
    if not text or not isinstance(text, str):
        return []
    
    # Convert to lowercase and split on whitespace/punctuation
    text = text.lower()
    # Remove punctuation but keep words
    words = re.findall(r'\b[a-z]+\b', text)
    return words


def compute_tf_idf_vector(document: List[str], all_terms: List[str]) -> List[float]:
    """Compute TF-IDF vector for a document (expensive computation)."""
    term_freq = Counter(document)
    doc_length = len(document) if document else 1
    
    # Compute TF
    tf_vector = [term_freq.get(term, 0) / doc_length for term in all_terms]
    
    # Simple IDF approximation (expensive when repeated)
    # In real scenario, would pre-compute IDF from corpus
    # But we'll compute it here to add computational load
    idf_vector = []
    for term in all_terms:
        # Simulate IDF calculation (expensive)
        # Count documents containing term (simplified)
        term_count = sum(1 for word in document if word == term)
        if term_count > 0:
            idf = math.log(1 + doc_length / (1 + term_count))
        else:
            idf = 0.0
        idf_vector.append(idf)
    
    # TF-IDF = TF * IDF
    tfidf = [tf * idf for tf, idf in zip(tf_vector, idf_vector)]
    return tfidf


def compute_text_statistics(text: str, tokens: List[str]) -> Dict[str, Any]:
    """Compute various text statistics (computationally expensive)."""
    if not text:
        return {}
    
    stats = {
        "char_count": len(text),
        "word_count": len(tokens),
        "sentence_count": len(re.split(r'[.!?]+', text)) - 1,
        "avg_word_length": sum(len(word) for word in tokens) / len(tokens) if tokens else 0,
        "unique_words": len(set(tokens)),
        "vocabulary_diversity": len(set(tokens)) / len(tokens) if tokens else 0,
    }
    
    # Compute word frequency distribution (expensive for large texts)
    word_freq = Counter(tokens)
    stats["most_common_words"] = dict(word_freq.most_common(10))
    
    # Compute complexity metrics
    # Average syllables per word (simplified heuristic)
    syllable_count = 0
    for word in tokens[:100]:  # Sample first 100 words to save time
        syllable_count += max(1, (len(word) - len(re.findall(r'[aeiouy]', word))) // 2 + 1)
    stats["avg_syllables_per_word"] = syllable_count / min(100, len(tokens)) if tokens else 0
    
    # Reading level approximation (Flesch-like)
    # Complex calculation that requires iteration
    long_words = sum(1 for word in tokens if len(word) > 6)
    stats["long_word_ratio"] = long_words / len(tokens) if tokens else 0
    
    return stats


def compute_similarity_metrics(tokens: List[str]) -> Dict[str, float]:
    """Compute text similarity metrics (computationally expensive)."""
    if len(tokens) < 2:
        return {"similarity_score": 0.0}
    
    # Compute pairwise word similarities (expensive)
    # Use character overlap as a proxy for semantic similarity
    similarity_matrix = []
    sample_tokens = tokens[:50]  # Sample to keep it tractable
    
    for i, word1 in enumerate(sample_tokens):
        row = []
        for word2 in sample_tokens:
            # Character n-gram overlap
            chars1 = set(word1)
            chars2 = set(word2)
            if chars1 or chars2:
                overlap = len(chars1 & chars2) / len(chars1 | chars2) if (chars1 | chars2) else 0
            else:
                overlap = 0.0
            row.append(overlap)
        similarity_matrix.append(row)
    
    # Compute average similarity (expensive matrix operation)
    total_similarity = sum(sum(row) for row in similarity_matrix)
    num_pairs = len(similarity_matrix) * len(similarity_matrix[0]) if similarity_matrix else 1
    avg_similarity = total_similarity / num_pairs
    
    # Compute similarity distribution statistics
    all_similarities = [val for row in similarity_matrix for val in row]
    if all_similarities:
        stats = {
            "avg_similarity": avg_similarity,
            "max_similarity": max(all_similarities),
            "min_similarity": min(all_similarities),
            "similarity_variance": sum((x - avg_similarity) ** 2 for x in all_similarities) / len(all_similarities),
        }
    else:
        stats = {"avg_similarity": 0.0}
    
    return stats


def main(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single text document with expensive NLP operations.
    
    This function performs computationally expensive operations that benefit
    from distributed computing:
    - Tokenization and text preprocessing
    - TF-IDF vector computation
    - Statistical analysis
    - Similarity calculations
    - Feature extraction
    
    Args:
        row: Dictionary containing document data from CSV
            Expected: {"document_id": "...", "text": "...", ...}
        
    Returns:
        dict: Processed document with extracted features and statistics
    """
    # Extract document text
    text = None
    document_id = None
    
    # Try different possible column names
    for key in row.keys():
        key_lower = key.lower().strip()
        if key_lower in ['text', 'content', 'document', 'body', 'message']:
            text = str(row[key]) if row[key] else ""
        elif key_lower in ['id', 'document_id', 'doc_id', 'index']:
            document_id = str(row[key])
    
    # Fallback: use first text-like column
    if not text:
        for key, value in row.items():
            if isinstance(value, str) and len(value) > 10:
                text = value
                break
    
    if not text:
        return {
            "error": "No text content found",
            "row_keys": list(row.keys()),
            "computation_intensive": False
        }
    
    if not document_id:
        document_id = str(hash(text))[:10]  # Use hash as ID
    
    # Add computational load: process the text multiple times
    # This simulates real-world NLP pipelines that iterate over documents
    
    # Step 1: Tokenization (expensive for long documents)
    start_time = time.time()
    tokens = simple_tokenize(text)
    tokenization_time = time.time() - start_time
    
    # Step 2: Extract all unique terms (expensive)
    all_terms = list(set(tokens))[:100]  # Limit to top 100 terms for performance
    
    # Step 3: Compute TF-IDF vector (expensive)
    start_time = time.time()
    tfidf_vector = compute_tf_idf_vector(tokens, all_terms)
    tfidf_time = time.time() - start_time
    
    # Step 4: Compute text statistics (expensive)
    start_time = time.time()
    stats = compute_text_statistics(text, tokens)
    stats_time = time.time() - start_time
    
    # Step 5: Compute similarity metrics (expensive)
    start_time = time.time()
    similarity_metrics = compute_similarity_metrics(tokens)
    similarity_time = time.time() - start_time
    
    # Step 6: Additional expensive operations
    # Compute n-gram frequencies (bigrams)
    bigrams = []
    if len(tokens) > 1:
        for i in range(len(tokens) - 1):
            bigrams.append(f"{tokens[i]}_{tokens[i+1]}")
    bigram_freq = Counter(bigrams)
    
    # Compute document complexity score
    complexity_score = (
        stats.get("vocabulary_diversity", 0) * 0.3 +
        stats.get("long_word_ratio", 0) * 0.3 +
        similarity_metrics.get("avg_similarity", 0) * 0.2 +
        len(all_terms) / 100.0 * 0.2  # Vocabulary size
    )
    
    total_processing_time = tokenization_time + tfidf_time + stats_time + similarity_time
    
    # Add small artificial delay to ensure status changes are visible
    # This makes it clear that tasks are processing
    time.sleep(0.2)  # 200ms per document
    
    return {
        "document_id": document_id,
        "text_length": len(text),
        "token_count": len(tokens),
        "unique_terms": len(all_terms),
        "tfidf_vector_length": len(tfidf_vector),
        "tfidf_sum": sum(tfidf_vector),
        "statistics": stats,
        "similarity_metrics": similarity_metrics,
        "bigram_count": len(bigrams),
        "top_bigrams": dict(bigram_freq.most_common(5)),
        "complexity_score": complexity_score,
        "processing_time": total_processing_time,
        "computation_intensive": True
    }
