"""
adaptive_ai.py - Prerana Adaptive AI & Cognitive Pacing Engine
Implements Bayesian Knowledge Tracing (BKT) and Cognitive Latency Modeling
to dynamically evaluate student mastery and recommend scaffolded support tiers.
"""

from typing import Dict, Any, List

class BayesianKnowledgeTracer:
    """
    Standard Bayesian Knowledge Tracing (BKT) model for assistive cognitive learning.
    Tracks latent mastery state P(L) across learning trials.
    """
    def __init__(self, p_l0: float = 0.25, p_transit: float = 0.18, p_slip: float = 0.08, p_guess: float = 0.33):
        self.p_l0 = p_l0            # Prior probability of knowing the concept
        self.p_transit = p_transit  # Probability of learning between trials
        self.p_slip = p_slip        # Probability of making a careless error despite mastery
        self.p_guess = p_guess      # Probability of guessing correctly without mastery

    def update(self, p_prev: float, is_correct: bool) -> float:
        """Computes posterior mastery probability P(L_t) after an observed trial."""
        if is_correct:
            num = p_prev * (1.0 - self.p_slip)
            den = num + (1.0 - p_prev) * self.p_guess
        else:
            num = p_prev * self.p_slip
            den = num + (1.0 - p_prev) * (1.0 - self.p_guess)

        p_learned = num / den if den > 0 else p_prev
        # Transition to next state
        p_next = p_learned + (1.0 - p_learned) * self.p_transit
        return max(0.01, min(0.99, p_next))

def evaluate_student_cognitive_state(student_id: int, activity_logs: List[Dict[str, Any]], current_tier: str = "moderate") -> Dict[str, Any]:
    """
    Analyzes student trial history and latency telemetry to compute:
    - Current Latent Mastery Score (0% - 100%)
    - Cognitive Attentional Latency Index (Normal, Elevated, High Strain)
    - AI-Recommended Support Tier (Mild / Moderate / High)
    - Actionable Special-Education Pedagogical Scaffolding Advice
    """
    bkt = BayesianKnowledgeTracer()
    p_mastery = bkt.p_l0

    if not activity_logs:
        return {
            "student_id": student_id,
            "mastery_probability": round(p_mastery * 100, 1),
            "mastery_level": "Foundational Baseline",
            "average_latency_sec": 2.2,
            "cognitive_load_state": "Optimal Attention Baseline",
            "recommended_tier": current_tier,
            "recommended_choices": 3 if current_tier == "moderate" else (4 if current_tier == "mild" else 2),
            "ai_insights": "Baseline assessment active. Recommend initial 3-choice multi-sensory presentation."
        }

    valid_latencies = []
    correct_count = 0
    total_trials = len(activity_logs)

    # Process trials in chronological sequence
    sorted_logs = sorted(activity_logs, key=lambda x: str(x.get("created_at", "")))
    for trial in sorted_logs:
        status = (trial.get("status") or "").lower()
        is_first_try = "first" in status or trial.get("attempts", 1) == 1
        if is_first_try:
            correct_count += 1

        latency = float(trial.get("response_time_sec") or trial.get("latency") or 2.0)
        valid_latencies.append(latency)

        # Update BKT mastery
        p_mastery = bkt.update(p_mastery, is_first_try)

    avg_latency = round(sum(valid_latencies) / len(valid_latencies), 2) if valid_latencies else 2.0
    first_try_acc = round((correct_count / total_trials) * 100) if total_trials > 0 else 85

    # Cognitive load & latency evaluation
    if avg_latency < 2.2:
        latency_state = "Autonomous Processing (Low Cognitive Latency)"
    elif avg_latency <= 4.0:
        latency_state = "Standard Scaffolding Latency (Stable Attention)"
    else:
        latency_state = "Elevated Processing Latency (Scaffolding Required)"

    # AI Recommendation for Cognitive Support Tier
    if p_mastery >= 0.80 and avg_latency <= 2.8 and first_try_acc >= 85:
        recommended_tier = "mild"
        recommended_choices = 4
        level_label = "Demonstrated Mastery (Level IV)"
        advice = "Learner demonstrates robust retention and rapid stimulus selection. Recommend advancing to 4-choice multimodal arrays."
    elif p_mastery >= 0.55 or (avg_latency <= 4.0 and first_try_acc >= 65):
        recommended_tier = "moderate"
        recommended_choices = 3
        level_label = "Proficient / Consolidated (Level III)"
        advice = "Learner benefits from structured 3-choice chromatic anchors. Maintain current moderate scaffolding."
    else:
        recommended_tier = "high"
        recommended_choices = 2
        level_label = "Emerging Competency (Level II)"
        advice = "Elevated response latency or retry patterns detected. Recommend reducing choice density to 2-choice high-contrast array."

    return {
        "student_id": student_id,
        "mastery_probability": round(p_mastery * 100, 1),
        "mastery_level": level_label,
        "first_try_accuracy": first_try_acc,
        "total_trials_evaluated": total_trials,
        "average_latency_sec": avg_latency,
        "cognitive_load_state": latency_state,
        "current_tier": current_tier,
        "recommended_tier": recommended_tier,
        "recommended_choices": recommended_choices,
        "tier_changed": recommended_tier != current_tier,
        "ai_insights": advice
    }
