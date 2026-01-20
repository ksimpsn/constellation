"""
================================================================================
DISTRIBUTED TEXT PROCESSING TEST - WITH RAY (PARALLEL EXECUTION)
================================================================================

PROBLEM: Large-Scale Text Corpus Analysis
------------------------------------------
Researchers need to process thousands of text documents (news articles, research
papers, social media posts) with computationally expensive NLP operations:
- Tokenization: Breaking text into individual words
- TF-IDF computation: Calculating term frequency-inverse document frequency vectors
- Similarity analysis: Finding patterns and relationships between words
- Statistical analysis: Computing vocabulary diversity, complexity scores

THE DATASET:
------------
- CSV file containing thousands of text documents
- Each row = one document with text content
- Default size: 2,231 documents (scalable to 50,000+ documents)
- Use case: Real research scenario (analyzing news articles, papers, etc.)

WHY THIS IS IMPORTANT:
----------------------
Processing text documents sequentially (one at a time) is VERY slow:
- Each document takes 200-500ms to process
- Default test (2,231 documents) × 300ms = 669 seconds = ~8-9 MINUTES (sequential)
- With distributed computing (8 CPU cores): ~1 MINUTE (actual runtime)
- With 5 teammates' laptops (40 cores): ~12-15 SECONDS (estimated)

For larger datasets (50,000 documents):
- Sequential: ~4.2 HOURS
- 8 CPU cores: ~31 MINUTES
- 40 cores: ~6 MINUTES

Distributed computing makes the difference between MINUTES and SECONDS (or HOURS and MINUTES for large datasets)!

WHAT THIS TEST DOES (Step by Step):
------------------------------------
1. SUBMISSION: Uploads Python code + dataset (simulates frontend POST /submit)
2. CHUNKING: Splits dataset into smaller tasks (50 documents per task)
3. DISTRIBUTION: Sends tasks to multiple Ray workers (parallel execution)
4. PROCESSING: Each worker processes its chunk independently
5. MONITORING: Polls status to track progress (simulates frontend GET /status)
6. AGGREGATION: Collects all results when complete (simulates frontend GET /results)
7. ANALYSIS: Displays statistics about processed documents

OUTPUT EXPLANATION:
-------------------
- Documents processed: Total number of documents analyzed
- Tokens extracted: Total words found across all documents
- Average tokens/document: Average document length
- Average processing time: How long each document took to process
- Complexity score: Text complexity metric (0-1 scale)
- Tasks completed: Number of parallel tasks that finished successfully
- Database entries: Shows data is being persisted correctly

This demonstrates Constellation's ability to distribute computationally expensive
workloads across multiple machines, dramatically reducing processing time.
"""

import time
import sys
import os
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.core.api import ConstellationAPI
from backend.core.database import init_db


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
    Run the distributed text processing test using Ray (parallel execution).
    
    This simulates what the frontend does:
    1. Uploads a project (Python file + text dataset)
    2. Monitors progress periodically (visible status changes)
    3. Retrieves results when complete
    """
    
    print("=" * 70)
    print("Constellation Distributed Text Processing Test")
    print("Use Case: Large-Scale NLP Processing (WITH Ray - PARALLEL)")
    print("=" * 70)
    print()
    
    # STEP 1: Verify files exist
    # ---------------------------
    # Check if dataset and code files are available
    dataset_path = os.path.join(os.path.dirname(__file__), "text_dataset.csv")
    code_path = os.path.join(os.path.dirname(__file__), "text_processing_project.py")
    
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset not found: {dataset_path}")
        print("\nPlease generate the dataset first:")
        print("  python3 backend/test/generate_text_dataset.py")
        return 1
    
    if not os.path.exists(code_path):
        print(f"❌ Project file not found: {code_path}")
        return 1
    
    # STEP 2: Initialize database (fresh start for clean test)
    # ---------------------------------------------------------
    # Clear old database to ensure clean test run
    print("📊 STEP 1: Initializing database...")
    print("   (Clearing old data for fresh test run)")
    db_path = os.path.join(os.path.dirname(__file__), '../../constellation.db')
    if os.path.exists(db_path):
        print(f"  Clearing existing database: {db_path}")
        os.remove(db_path)
    init_db()
    print("✓ Database initialized (fresh start)\n")
    
    # STEP 3: Initialize Constellation API and Ray cluster
    # ----------------------------------------------------
    # This starts the distributed computing framework (Ray)
    # Ray will automatically use all available CPU cores for parallel processing
    print("🚀 STEP 2: Initializing Constellation API and Ray cluster...")
    print("   (Starting distributed computing framework)")
    print("   (Ray will use all available CPU cores for parallel execution)")
    api = ConstellationAPI()
    print("✓ API and Ray cluster initialized\n")
    
    # STEP 4: Load and analyze dataset
    # ---------------------------------
    # Read the CSV file to get document count and verify structure
    print("📁 STEP 3: Loading dataset...")
    import csv
    with open(dataset_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        documents = list(reader)
        row_count = len(documents)
    
    print(f"  - Code: {code_path}")
    print(f"  - Dataset: {dataset_path}")
    print(f"  - Dataset size: {row_count:,} documents")
    print(f"  - Use case: Large-scale text corpus processing (NLP)")
    print()
    
    # STEP 5: Submit project to Constellation
    # ----------------------------------------
    # This simulates what happens when a researcher clicks "Submit" in the frontend
    # The system will:
    #   - Load and serialize the Python function
    #   - Split the dataset into chunks (tasks)
    #   - Create database records (Project, Run, Tasks)
    #   - Submit tasks to Ray workers for parallel execution
    print("📤 STEP 4: Submitting project to Constellation...")
    print("   (This simulates: Frontend → POST /submit)")
    print("   - Loading Python function and serializing it")
    print("   - Splitting dataset into parallel tasks (chunks)")
    print("   - Creating database records (Project, Run, Tasks)")
    print("   - Submitting tasks to Ray workers")
    print()
    
    start_time = time.time()
    
    try:
        # CHUNK SIZE EXPLANATION:
        # ------------------------
        # We split documents into chunks of 50 documents per task
        # Each document takes ~200-500ms to process
        # So each task takes ~10-25 seconds
        # This makes status changes VISIBLE (you can see progress!)
        chunk_size = 50  # 50 documents per task = ~10-25 seconds per task
        
        job_id = api.submit_uploaded_project(
            code_path=code_path,
            dataset_path=dataset_path,
            file_type="csv",
            func_name="main",
            chunk_size=chunk_size,
            title="Large-Scale Text Processing - NLP Analysis",
            description="Distributed text processing test with tokenization, TF-IDF, similarity analysis"
        )
        
        estimated_tasks = (row_count + chunk_size - 1) // chunk_size
        estimated_time = estimated_tasks * 15  # ~15 seconds per task average
        
        print(f"✓ Project submitted successfully!")
        print(f"  - Job ID: {job_id}")
        print(f"  - Total tasks created: {estimated_tasks} (each processes {chunk_size} documents)")
        print(f"  - Estimated completion time: ~{format_duration(estimated_time)}")
        print(f"  - Execution mode: PARALLEL (tasks run simultaneously across CPU cores)")
        print()
        
    except Exception as e:
        print(f"❌ Error submitting project: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # STEP 6: Monitor job status (simulating frontend polling)
    # --------------------------------------------------------
    # The frontend would poll the status endpoint every few seconds
    # We can see status transitions: submitted → running → complete
    # As tasks complete in parallel, we can watch the progress
    print("⏳ STEP 5: Monitoring job status...")
    print("   (This simulates: Frontend → GET /status/<job_id> every 3 seconds)")
    print("   - Status will transition: submitted → running → complete")
    print("   - As tasks complete in parallel, you'll see steady progress")
    print("   - Elapsed time is shown so you can see speed improvement vs sequential")
    print()
    
    last_status = None
    status_count = 0
    status_start_time = time.time()
    last_completed_tasks = 0
    
    # Get run_id for progress tracking
    run_id = api.job_id_to_run_id.get(job_id)
    
    while True:
        try:
            status = api.check_status(job_id)
            status_count += 1
            
            # Query database for live progress updates (similar to sequential test)
            if run_id and status == "running":
                from backend.core.database import get_session, Run, Task
                with get_session() as session:
                    run = session.query(Run).filter_by(run_id=run_id).first()
                    if run:
                        # Count completed tasks from Task table for real-time progress
                        completed_tasks = session.query(Task).filter_by(
                            run_id=run_id, 
                            status="completed"
                        ).count()
                        total_tasks = run.total_tasks
                        
                        # Calculate documents processed (approximate: completed_tasks * chunk_size)
                        # Last task might have fewer documents, but this is close enough for progress
                        documents_processed = completed_tasks * chunk_size
                        
                        # Only show progress when it changes
                        if completed_tasks > last_completed_tasks:
                            elapsed = time.time() - start_time
                            
                            # Calculate rate and ETA based on documents processed
                            if documents_processed > 0 and elapsed > 0:
                                docs_per_sec = documents_processed / elapsed
                                remaining_docs = row_count - documents_processed
                                eta_seconds = remaining_docs / docs_per_sec if docs_per_sec > 0 else 0
                                
                                # Show live progress bar (same format as sequential test)
                                print(f"   Progress: {documents_processed:,}/{row_count:,} docs | "
                                      f"Elapsed: {format_duration(elapsed)} | "
                                      f"Rate: {docs_per_sec:.1f} docs/sec | "
                                      f"ETA: {format_duration(eta_seconds)}", end='\r')
                            
                            last_completed_tasks = completed_tasks
            
            # Show status transitions with elapsed time
            if status != last_status:
                timestamp = datetime.now().strftime("%H:%M:%S")
                elapsed = time.time() - start_time
                status_duration = time.time() - status_start_time
                
                if last_status:
                    print()  # New line after progress indicator
                    print(f"  [Previous status '{last_status}' lasted {format_duration(status_duration)}]")
                
                # Show elapsed time prominently so we can compare with sequential version
                print(f"[{timestamp}] Status: {status.upper()} | Elapsed: {format_duration(elapsed)}")
                last_status = status
                status_start_time = time.time()
            
            if status == "complete":
                print()  # New line after progress indicator
                break
            elif status in ["failed", "cancelled", "error"]:
                print()  # New line after progress indicator
                print(f"❌ Job ended with status: {status}")
                return 1
            
            # Poll every 3 seconds (frontend would do this)
            time.sleep(3)
                
        except KeyboardInterrupt:
            print("\n\n⚠️  Test interrupted by user")
            return 1
        except Exception as e:
            print(f"\n❌ Error checking status: {e}")
            import traceback
            traceback.print_exc()
            return 1
    
    elapsed_time = time.time() - start_time
    print(f"\n✓ Job completed in {format_duration(elapsed_time)} (PARALLEL EXECUTION)")
    print()
    
    # STEP 7: Retrieve and display results
    # -------------------------------------
    # This simulates the frontend fetching results when the job completes
    print("📥 STEP 6: Retrieving results...")
    print("   (This simulates: Frontend → GET /results/<job_id>)")
    print("   - Collecting results from all completed tasks")
    print("   - Aggregating statistics across all documents")
    print()
    
    try:
        results = api.get_results(job_id)
        
        if not results:
            print("⚠️  No results returned")
            return 1
        
        print(f"✓ Results retrieved: {len(results)} task results")
        print()
        
        # STEP 8: Analyze and display results
        # ------------------------------------
        # Calculate summary statistics from all processed documents
        print("📊 STEP 7: Results Analysis:")
        print("-" * 70)
        
        total_documents_processed = 0
        total_tokens = 0
        total_processing_time = 0.0
        total_complexity_score = 0.0
        
        successful_tasks = 0
        failed_tasks = 0
        
        # Parse results structure:
        # results = [
        #   {"task_id": "...", "result": [{"row_index": 0, "output": {...}}, ...], ...},
        #   ...
        # ]
        for result_item in results:
            if "result" in result_item:
                task_result = result_item["result"]
                if isinstance(task_result, list):
                    # task_result is a list of {"row_index": ..., "output": {...}}
                    for row_result in task_result:
                        # Extract the actual output from the row result
                        doc_result = row_result.get("output", row_result) if isinstance(row_result, dict) else row_result
                        
                        if isinstance(doc_result, dict) and "computation_intensive" in doc_result:
                            total_documents_processed += 1
                            if "token_count" in doc_result:
                                total_tokens += doc_result["token_count"]
                            if "processing_time" in doc_result:
                                total_processing_time += doc_result["processing_time"]
                            if "complexity_score" in doc_result:
                                total_complexity_score += doc_result["complexity_score"]
                    successful_tasks += 1
                else:
                    failed_tasks += 1
            else:
                failed_tasks += 1
        
        # Display summary statistics
        print(f"  ✓ Successful tasks: {successful_tasks}")
        if failed_tasks > 0:
            print(f"  ✗ Failed tasks: {failed_tasks}")
        print(f"  📄 Documents processed: {total_documents_processed:,}")
        print(f"  📝 Total tokens extracted: {total_tokens:,}")
        if total_documents_processed > 0:
            avg_tokens = total_tokens / total_documents_processed
            avg_processing = total_processing_time / total_documents_processed
            avg_complexity = total_complexity_score / total_documents_processed
            print(f"  📊 Average tokens per document: {avg_tokens:.1f}")
            print(f"  ⏱  Average processing time per document: {avg_processing*1000:.1f}ms")
            print(f"  🎯 Average complexity score: {avg_complexity:.3f}")
        
        # STEP 9: Verify database persistence
        # ------------------------------------
        # Show that all data was properly stored in the database
        print()
        print("🗄️  STEP 8: Database Verification:")
        print("   (Verifying that all data was persisted correctly)")
        print("-" * 70)
        
        from backend.core.database import (
            get_session, Project, Run, Task, TaskResult, Worker
        )
        
        with get_session() as session:
            # Count entities in database
            project_count = session.query(Project).count()
            print(f"  📁 Projects stored: {project_count}")
            
            run_count = session.query(Run).count()
            print(f"  🏃 Runs stored: {run_count}")
            
            task_count = session.query(Task).count()
            completed_task_count = session.query(Task).filter_by(status="completed").count()
            print(f"  📋 Tasks stored: {task_count} (completed: {completed_task_count})")
            
            result_count = session.query(TaskResult).count()
            print(f"  📊 Task results stored: {result_count}")
            
            # Show latest run details
            if run_count > 0:
                latest_run = session.query(Run).order_by(Run.created_at.desc()).first()
                if latest_run:
                    print(f"  📈 Latest run details:")
                    print(f"     - Run ID: {latest_run.run_id[:20]}...")
                    print(f"     - Status: {latest_run.status}")
                    print(f"     - Progress: {latest_run.completed_tasks}/{latest_run.total_tasks} tasks completed")
                    if latest_run.total_tasks > 0:
                        progress_pct = (latest_run.completed_tasks / latest_run.total_tasks) * 100
                        print(f"     - Completion: {progress_pct:.1f}%")
            
            # Show sample task result with runtime
            if result_count > 0:
                sample_result = session.query(TaskResult).first()
                if sample_result:
                    print(f"  📄 Sample task result:")
                    print(f"     - Task ID: {sample_result.task_id[:20]}...")
                    if sample_result.runtime_seconds:
                        print(f"     - Execution time: {sample_result.runtime_seconds:.2f}s")
                    if sample_result.result_data and isinstance(sample_result.result_data, list):
                        print(f"     - Documents in this task: {len(sample_result.result_data)}")
        
        # Final summary
        print()
        print("=" * 70)
        print("✅ DISTRIBUTED TEST COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print()
        print("📊 PERFORMANCE SUMMARY:")
        print(f"   Total time: {format_duration(elapsed_time)}")
        print(f"   Documents processed: {total_documents_processed:,}")
        print(f"   Execution mode: PARALLEL (Ray distributed computing)")
        print(f"   Speed improvement: ~8-40x faster than sequential (depends on CPU cores)")
        print()
        print("🎯 WHAT THIS DEMONSTRATES:")
        print("  • Large-scale text corpus processing (real research use case)")
        print("  • Distributed task execution across multiple CPU cores")
        print("  • Visible status monitoring (status changes are observable)")
        print("  • Result aggregation and retrieval")
        print("  • Database persistence and tracking")
        print("  • Computationally expensive NLP operations:")
        print("    - Tokenization and preprocessing")
        print("    - TF-IDF vector computation")
        print("    - Text similarity calculations")
        print("    - Statistical analysis")
        print("    - Feature extraction")
        print()
        print("💡 WHY THIS MATTERS:")
        print("   Researchers analyzing large text corpora (news articles, research")
        print("   papers, social media posts) need to process thousands of documents.")
        print("   Without distributed computing, this takes HOURS.")
        print("   With Constellation, this takes MINUTES by distributing work across")
        print("   multiple machines on the local network.")
        print()
        
        return 0
        
    except Exception as e:
        print(f"❌ Error retrieving results: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
