from app.services.llm_service import (
    build_pre_visit_summary_payload,
    build_post_visit_summary_payload,
)


def test_pre_visit_summary_payload_has_structured_schema():
    payload = build_pre_visit_summary_payload(
        symptoms="Fever and cough for three days; mild shortness of breath.",
        urgency_level="Medium",
        chief_complaint="Fever and cough with mild dyspnea.",
        suggested_questions=[
            "When did the fever begin?",
            "Is the shortness of breath worsening?",
            "Any chest pain or dizziness?",
        ],
    )

    assert payload["status"] == "ok"
    assert payload["urgency_level"] == "Medium"
    assert payload["clinical_summary"]["chief_complaint"] == "Fever and cough with mild dyspnea."
    assert payload["summary_text"].startswith("Patient reported")
    assert payload["generated_at"]


def test_post_visit_summary_payload_handles_missing_fields():
    payload = build_post_visit_summary_payload(
        clinical_notes="Follow-up in two weeks; advised hydration and rest.",
        prescription="Ibuprofen 200mg twice daily",
    )

    assert payload["status"] == "ok"
    assert "visit_overview" in payload["summary"]
    assert payload["summary"]["follow_up_plan"]
    assert payload["summary_text"]
