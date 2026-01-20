"""
Generate or Download Large Text Corpus Dataset for Distributed Computing Test

This script creates a large text dataset suitable for NLP/distributed processing.
Downloads real text datasets or generates synthetic text data.
"""

import csv
import os
import sys
import ssl
import urllib.request
import zipfile
import gzip
from typing import Optional


def fix_ssl_context():
    """Fix SSL context for downloading from HTTPS."""
    # Create unverified context (for testing only)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return ssl_context


def download_with_fallback(url: str, output_path: str) -> bool:
    """
    Download file from URL with SSL fix and retry logic.
    
    Args:
        url: URL to download from
        output_path: Path to save file
        
    Returns:
        bool: True if successful
    """
    print(f"Downloading from: {url}")
    
    ssl_context = fix_ssl_context()
    
    try:
        # Try with SSL context
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
            with open(output_path, 'wb') as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f"Download failed: {e}")
        return False


def download_news_dataset(output_path: str) -> Optional[str]:
    """
    Download news articles dataset (AgNews or similar).
    Falls back to generating synthetic news data.
    """
    # Try to download a real news dataset
    # Using a public dataset URL (example)
    urls = [
        "https://raw.githubusercontent.com/sdadas/polish-nlp-resources/master/datasets/agnews/train.csv",
        "https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt",
    ]
    
    temp_path = output_path + ".tmp"
    
    for url in urls:
        print(f"Trying to download from: {url}")
        if download_with_fallback(url, temp_path):
            # Process the downloaded file
            if url.endswith('.csv'):
                # It's already CSV, just rename
                os.rename(temp_path, output_path)
                return output_path
            elif url.endswith('.txt'):
                # Convert text to CSV format
                return convert_text_to_csv(temp_path, output_path)
    
    # If all downloads fail, generate synthetic data
    print("Could not download dataset. Generating synthetic news articles...")
    return generate_synthetic_news_dataset(output_path, num_documents=50000)


def convert_text_to_csv(text_path: str, csv_path: str) -> str:
    """Convert a text file to CSV format for processing."""
    print("Converting text file to CSV format...")
    
    with open(text_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Split into documents (by paragraphs or chunks)
    # Split into ~500 character chunks
    chunk_size = 500
    documents = []
    for i in range(0, len(content), chunk_size):
        chunk = content[i:i+chunk_size].strip()
        if len(chunk) > 50:  # Only include substantial chunks
            documents.append({
                'document_id': f'doc_{i//chunk_size}',
                'text': chunk
            })
    
    # Write to CSV
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['document_id', 'text'])
        writer.writeheader()
        writer.writerows(documents)
    
    os.remove(text_path)  # Clean up temp file
    
    file_size = os.path.getsize(csv_path) / (1024 * 1024)
    print(f"✓ Converted to CSV: {csv_path}")
    print(f"  - Documents: {len(documents):,}")
    print(f"  - Size: {file_size:.2f} MB")
    
    return csv_path


def generate_synthetic_news_dataset(output_path: str, num_documents: int = 50000) -> str:
    """Generate synthetic news articles dataset."""
    import random
    import string
    
    print(f"Generating {num_documents:,} synthetic news documents...")
    
    # Templates for generating realistic-looking text
    templates = [
        "In a groundbreaking development, researchers have discovered that {subject} {action}. This finding could revolutionize {field} and has significant implications for {impact}. Experts agree that {conclusion}.",
        "A new study published in {journal} reveals that {subject} demonstrates {property}. The research team analyzed {sample_size} samples over {duration} and found that {finding}. This challenges previous assumptions about {topic}.",
        "According to recent data from {source}, {subject} has shown {trend}. The analysis indicates that {implication}. Industry leaders suggest that {recommendation}. However, some critics argue that {counterpoint}.",
        "Scientists at {institution} have developed a novel approach to {problem}. Their method involves {technique} and has shown promising results. The team reported {metric} improvement in {measure}. Future research will focus on {direction}.",
    ]
    
    subjects = ["climate change", "artificial intelligence", "quantum computing", "biotechnology", "renewable energy",
                "space exploration", "medical research", "economic trends", "social dynamics", "technological innovation"]
    actions = ["is accelerating", "has reached new heights", "shows promising results", "requires immediate attention",
               "offers new opportunities", "presents challenges", "demonstrates potential", "faces obstacles"]
    fields = ["science", "technology", "medicine", "engineering", "economics", "society", "environment"]
    impacts = ["future generations", "global markets", "public health", "scientific understanding"]
    
    documents = []
    
    for i in range(num_documents):
        # Generate multiple sentences for each document
        sentences = []
        for _ in range(random.randint(3, 8)):
            template = random.choice(templates)
            sentence = template.format(
                subject=random.choice(subjects),
                action=random.choice(actions),
                field=random.choice(fields),
                impact=random.choice(impacts),
                journal=f"Journal of {random.choice(fields).title()}",
                property=random.choice(actions),
                sample_size=random.randint(100, 10000),
                duration=f"{random.randint(1, 10)} years",
                finding="significant correlations",
                topic=random.choice(subjects),
                source=random.choice(["United Nations", "World Bank", "MIT", "Harvard"]),
                trend=random.choice(actions),
                implication="profound effects",
                recommendation="further investigation",
                counterpoint="more research needed",
                institution=random.choice(["MIT", "Stanford", "Oxford", "Cambridge"]),
                problem=random.choice(subjects),
                technique="advanced algorithms",
                metric=f"{random.randint(20, 80)}%",
                measure="efficiency",
                direction="optimization",
                conclusion="this represents a major breakthrough"
            )
            sentences.append(sentence)
        
        text = " ".join(sentences)
        
        # Add some random characters to increase length and computational load
        if random.random() < 0.3:
            text += " " + " ".join(random.choice(string.ascii_lowercase) * random.randint(10, 50) 
                                  for _ in range(random.randint(5, 15)))
        
        documents.append({
            'document_id': f'doc_{i:06d}',
            'text': text
        })
        
        if (i + 1) % 10000 == 0:
            print(f"  Generated {i+1:,}/{num_documents:,} documents...")
    
    # Write to CSV
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['document_id', 'text'])
        writer.writeheader()
        writer.writerows(documents)
    
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✓ Dataset generated: {output_path}")
    print(f"  - Documents: {len(documents):,}")
    print(f"  - Size: {file_size:.2f} MB")
    
    return output_path


def main():
    """Generate or download a large text corpus dataset."""
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "text_dataset.csv")
    
    print("=" * 70)
    print("Large-Scale Text Corpus Dataset Generator")
    print("Use Case: Distributed NLP Processing (Research Text Analysis)")
    print("=" * 70)
    print()
    
    # Check if dataset already exists
    if os.path.exists(output_path):
        response = input(f"Dataset already exists at {output_path}\nOverwrite? (y/n): ")
        if response.lower() != 'y':
            print("Keeping existing dataset.")
            return output_path
    
    print("This will create a dataset for testing distributed text processing.")
    print("Use case: Processing large text corpora (news articles, research papers, etc.)")
    print()
    print("Options:")
    print("  1. Try to download real text dataset from internet (requires internet)")
    print("  2. Generate synthetic news article dataset (faster, no internet needed)")
    print()
    
    choice = input("Choose option (1/2, default=2): ").strip() or "2"
    
    if choice == "1":
        try:
            result = download_news_dataset(output_path)
            if result:
                return result
            else:
                print("\nDownload failed. Generating synthetic dataset instead...")
                return generate_synthetic_news_dataset(output_path, num_documents=50000)
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            print("Falling back to synthetic dataset...")
            return generate_synthetic_news_dataset(output_path, num_documents=50000)
    else:
        # Get parameters
        num_docs = input("Number of documents (default=50000, recommended for visible status changes): ").strip()
        num_docs = int(num_docs) if num_docs else 50000
        
        return generate_synthetic_news_dataset(output_path, num_documents=num_docs)


if __name__ == "__main__":
    dataset_path = main()
    print(f"\n✓ Dataset ready at: {dataset_path}")
    print("\nYou can now run the distributed text processing test with:")
    print(f"  python3 backend/test/test_text_distributed.py")
