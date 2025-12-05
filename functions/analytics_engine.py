# classes/analytics_engine.py

import pandas as pd
from typing import Dict, Any, List
from sqlalchemy import func
from db import db
from classes.student_model import Student
from classes.schedule_planner import SchedulePlanner


class AnalyticsEngine:
    """
    Provides admin-level analytics, alerts, and summaries
    about students, majors, and usage trends.
    """

    def __init__(self):
        self.planner = SchedulePlanner()

    # -----------------------------------------------------------
    # 📊 BASIC STUDENT STATISTICS
    # -----------------------------------------------------------
    def get_student_statistics(self) -> Dict[str, Any]:
        """
        Compute system-wide student analytics:
        - total number of students
        - breakdown by major
        - average grad year
        - most common pronouns (if available)
        """
        total_students = db.session.query(func.count(Student.id)).scalar()
        majors = db.session.query(Student.major, func.count(Student.id)).group_by(Student.major).all()
        avg_grad_year = db.session.query(func.avg(Student.grad_year)).scalar()

        # Convert to dict
        major_breakdown = {m: count for m, count in majors}

        # Optional pronoun count
        pronoun_counts = (
            db.session.query(Student.pronouns, func.count(Student.id))
            .filter(Student.pronouns.isnot(None))
            .group_by(Student.pronouns)
            .all()
        )
        pronoun_breakdown = {p or "unspecified": c for p, c in pronoun_counts}

        analytics = {
            "total_students": total_students,
            "major_breakdown": major_breakdown,
            "avg_grad_year": round(avg_grad_year, 1) if avg_grad_year else None,
            "pronoun_breakdown": pronoun_breakdown,
        }

        print("[ANALYTICS] Computed student statistics")
        return analytics

    # -----------------------------------------------------------
    # ⚠️ ALERT GENERATION
    # -----------------------------------------------------------
    def generate_alerts(self) -> List[str]:
        """
        Create alerts for admin dashboard.
        """
        alerts = []
        # Example: Identify students close to graduation
        graduating_soon = Student.query.filter(Student.grad_year <= 2026).all()
        if graduating_soon:
            alerts.append(f"{len(graduating_soon)} students are graduating soon!")

        # Example: Detect imbalance in major enrollment
        stats = self.get_student_statistics()
        major_counts = stats["major_breakdown"]
        if major_counts:
            max_major = max(major_counts, key=major_counts.get)
            min_major = min(major_counts, key=major_counts.get)
            if major_counts[max_major] > 3 * major_counts[min_major]:
                alerts.append(f"⚠ Major imbalance: {max_major} has 3× more students than {min_major}.")

        print("[ANALYTICS] Generated admin alerts")
        return alerts

    # -----------------------------------------------------------
    # 📅 SCHEDULE USAGE SUMMARY
    # -----------------------------------------------------------
    def get_schedule_usage_summary(self, schedules: List[pd.DataFrame]) -> Dict[str, Any]:
        """
        Aggregates usage statistics from multiple schedules.
        """
        total_courses = sum(df["Course"].nunique() for df in schedules)
        avg_hours = round(
            sum(self.planner.analyze_schedule(df)["total_hours"] for df in schedules) / len(schedules), 2
        )

        summary = {
            "total_schedules_analyzed": len(schedules),
            "total_unique_courses": total_courses,
            "avg_total_hours": avg_hours,
        }
        print(f"[ANALYTICS] Schedule usage summary: {summary}")
        return summary

    # -----------------------------------------------------------
    # 🧾 EXPORT REPORT
    # -----------------------------------------------------------
    def export_report(self, filename: str = "analytics_report.csv") -> None:
        """
        Export current analytics data to CSV for admins.
        """
        stats = self.get_student_statistics()
        alerts = self.generate_alerts()
        df = pd.DataFrame(
            {
                "metric": list(stats.keys()) + ["alerts"],
                "value": [str(v) for v in stats.values()] + [", ".join(alerts)],
            }
        )
        df.to_csv(filename, index=False)
        print(f"[EXPORT] Analytics report saved to {filename}")

    def __repr__(self):
        return "<AnalyticsEngine>"