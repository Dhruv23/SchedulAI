# progress_utils.py - Student progress evaluation utilities
import sqlite3
from functions.student_progress_tracker import StudentProgressTracker

def evaluate_student_progress(student_id: int):
    """
    Evaluate comprehensive student progress including multiple metrics
    """
    try:
        tracker = StudentProgressTracker()
        
        # Get basic progress data
        progress_data = tracker.get_student_progress(student_id)
        
        if not progress_data:
            return {
                "error": "Unable to retrieve student progress data",
                "student_id": student_id
            }
        
        # Calculate additional metrics
        total_units_completed = progress_data.get('total_units_completed', 0)
        total_units_required = progress_data.get('total_units_required', 193)  # Default for CSE
        
        # Progress percentage
        progress_percentage = (total_units_completed / total_units_required) * 100 if total_units_required > 0 else 0
        
        # Estimate remaining quarters based on typical course load
        typical_units_per_quarter = 16
        remaining_units = max(0, total_units_required - total_units_completed)
        estimated_quarters_remaining = (remaining_units / typical_units_per_quarter) if remaining_units > 0 else 0
        
        # Enhanced progress summary
        enhanced_progress = {
            **progress_data,
            "progress_percentage": round(progress_percentage, 1),
            "remaining_units": remaining_units,
            "estimated_quarters_remaining": round(estimated_quarters_remaining, 1),
            "on_track_for_graduation": progress_percentage >= 75,  # Arbitrary threshold
            "academic_standing": "Good" if progress_percentage >= 50 else "At Risk"
        }
        
        return enhanced_progress
        
    except Exception as e:
        return {
            "error": f"Failed to evaluate student progress: {str(e)}",
            "student_id": student_id
        }