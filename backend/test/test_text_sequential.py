"""
================================================================================
SEQUENTIAL TEXT PROCESSING TEST - WITHOUT RAY (ONE AT A TIME)
================================================================================

This is the SAME test as test_text_distributed.py, but runs WITHOUT Ray.
Documents are processed ONE AT A TIME (sequentially) to demonstrate the
speed difference.

This shows why distributed computing is important:
- Sequential: 50,000 docs × 300ms = 15,000 seconds = 4.2 HOURS
- Parallel (8 cores): ~30 MINUTES
- Parallel (40 cores): ~6 MINUTES

The test will timeout after 1 minute to match the distributed test runtime for comparison.
"""

import time
import sys
import os
import csv
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))


def format_duration(seconds):
    """Format duration in human-readable format."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours}h {minutes}m {secs}s"


def main():
    """
    Run the text processing test SEQUENTIALLY (without Ray).
    
    This processes documents ONE AT A TIME to show how slow it is compared
    to distributed computing.
    """
    
    print("=" * 70)
    print("Sequential Text Processing Test")
    print("Use Case: Large-Scale NLP Processing (WITHOUT Ray - SEQUENTIAL)")
    print("=" * 70)
    print()
    print("⚠️  WARNING: This processes documents ONE AT A TIME (very slow!)")
    print("    This will timeout after 1 minute to match distributed test runtime for comparison.")
    print()
    
    # Load the processing function
    code_path = os.path.join(os.path.dirname(__file__), "text_processing_project.py")
    dataset_path = os.path.join(os.path.dirname(__file__), "text_dataset.csv")
    
    if not os.path.exists(code_path):
        print(f"❌ Project file not found: {code_path}")
        return 1
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        print("\nPlease generate the dataset first:")
        print("  python3 backend/test/generate_text_dataset.py")
        return 1
    
    # Import the processing function
    print("📦 Loading processing function...")
    import importlib.util
    spec = importlib.util.spec_from_file_location("text_processing_project", code_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    process_function = module.main
    print("✓ Function loaded\n")
    
    # Load dataset
    print("📁 Loading dataset...")
    documents = []
    with open(dataset_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        documents = list(reader)
        row_count = len(documents)
    
    print(f"  - Dataset size: {row_count:,} documents")
    print(f"  - Execution mode: SEQUENTIAL (one document at a time)")
    print()
    
    # Process documents sequentially
    print("🔄 Processing documents sequentially (this will be SLOW)...")
    print("   (Processing ONE document at a time - no parallelization)")
    print("   (Timeout after 1 minute to match distributed test runtime for comparison)")
    print()
    
    start_time = time.time()
    timeout_seconds = 60  # 1 minute timeout (matches distributed test runtime)
    processed_count = 0
    total_tokens = 0
    total_processing_time = 0.0
    total_complexity_score = 0.0
    failed_count = 0
    
    # Process each document one by one
    for idx, document in enumerate(documents):
        # Check timeout
        elapsed = time.time() - start_time
        if elapsed > timeout_seconds:
            print()
            print(f"⏱️  TIMEOUT: Stopped after {format_duration(timeout_seconds)}")
            print(f"   Processed {processed_count:,}/{row_count:,} documents")
            if processed_count > 0:
                rate = processed_count / elapsed
                full_estimate = row_count / rate if rate > 0 else 0
                print(f"   At this rate, full dataset would take: ~{format_duration(full_estimate)}")
            break
        
        # Show progress every 10 documents
        if (idx + 1) % 10 == 0:
            elapsed = time.time() - start_time
            rate = processed_count / elapsed if elapsed > 0 else 0
            remaining = (row_count - processed_count) / rate if rate > 0 else 0
            print(f"   Progress: {processed_count:,}/{row_count:,} docs | "
                  f"Elapsed: {format_duration(elapsed)} | "
                  f"Rate: {rate:.1f} docs/sec | "
                  f"ETA: {format_duration(remaining)}", end='\r')
        
        # Process document
        try:
            result = process_function(document)
            
            if isinstance(result, dict) and "computation_intensive" in result:
                processed_count += 1
                if "token_count" in result:
                    total_tokens += result["token_count"]
                if "processing_time" in result:
                    total_processing_time += result["processing_time"]
                if "complexity_score" in result:
                    total_complexity_score += result["complexity_score"]
        except Exception as e:
            failed_count += 1
            print(f"\n   Error processing document {idx}: {e}")
    
    elapsed_time = time.time() - start_time
    print()  # New line after progress indicator
    
    # Display results
    print()
    print("=" * 70)
    if elapsed_time >= timeout_seconds:
        print("⏱️  SEQUENTIAL TEST TIMED OUT (1 minute)")
    else:
        print("✅ SEQUENTIAL TEST COMPLETED")
    print("=" * 70)
    print()
    
    print("📊 RESULTS SUMMARY:")
    print("-" * 70)
    print(f"  ⏱  Total time: {format_duration(elapsed_time)}")
    print(f"  📄 Documents processed: {processed_count:,}/{row_count:,}")
    if processed_count > 0:
        rate = processed_count / elapsed_time
        full_time_estimate = row_count / rate if rate > 0 else 0
        print(f"  📈 Processing rate: {rate:.2f} documents/second")
        print(f"  🔮 Estimated time for FULL dataset: {format_duration(full_time_estimate)}")
        print(f"  📝 Total tokens extracted: {total_tokens:,}")
        avg_tokens = total_tokens / processed_count
        avg_processing = total_processing_time / processed_count
        avg_complexity = total_complexity_score / processed_count
        print(f"  📊 Average tokens per document: {avg_tokens:.1f}")
        print(f"  ⏱  Average processing time per document: {avg_processing*1000:.1f}ms")
        print(f"  🎯 Average complexity score: {avg_complexity:.3f}")
    if failed_count > 0:
        print(f"  ✗ Failed documents: {failed_count}")
    
    print()
    print("=" * 70)
    print("⚠️  SEQUENTIAL PROCESSING COMPARISON:")
    print("=" * 70)
    print()
    print(f"Time taken: {format_duration(elapsed_time)}")
    print(f"Documents processed: {processed_count:,}")
    print(f"Execution mode: SEQUENTIAL (one at a time)")
    print()
    if processed_count > 0:
        rate = processed_count / elapsed_time
        full_estimate = row_count / rate
        print(f"At this rate, processing ALL {row_count:,} documents would take:")
        print(f"  → {format_duration(full_estimate)}")
        print()
        print("Compare this to the DISTRIBUTED version which processes")
        print("documents in PARALLEL across multiple CPU cores!")
        print()
        print("Run: python3 backend/test/test_text_distributed.py")
        print("     to see the speed improvement with distributed computing.")
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
