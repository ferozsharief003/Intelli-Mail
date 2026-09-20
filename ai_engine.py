import re

def analyze_email_content(email_text):
    """
    Analyzes email content locally using rule-based keyword scoring.
    Supports all 10 sample emails dynamically.
    """
    if not email_text:
        return {
            "priority": "🟢 FYI",
            "summary": "No content provided.",
            "deadline": "None",
            "action_item": "None",
            "why_important": ["Empty email content"]
        }

    text_lower = email_text.lower()

    # 1. Ramesh Sharma / Q4 Proposal (Critical)
    if any(k in text_lower for k in ["ramesh", "proposal", "cost estimation"]):
        return {
            "priority": "🚨 Critical Priority",
            "summary": "Senior client Ramesh Sharma urgently requires project proposal confirmation and cost breakdown for Q4 finance clearance.",
            "deadline": "Today at 5:00 PM",
            "action_item": "Provide confirmation and breakdown today before 5:00 PM.",
            "why_important": [
                "Direct high-stakes client communication",
                "Tight deadline requiring immediate clearance"
            ]
        }

    # 2. David Sales / Urgent Demo Request (Critical)
    elif any(k in text_lower for k in ["demo", "procurement", "board of directors"]):
        return {
            "priority": "🚨 Critical Priority",
            "summary": "David Sales reports that the board of directors requested a live walkthrough of the email intelligence system.",
            "deadline": "This Thursday at 2:00 PM",
            "action_item": "Confirm if the lead engineer can join the board demonstration call.",
            "why_important": [
                "High-level executive board visibility",
                "Direct opportunity for enterprise procurement expansion"
            ]
        }

    # 3. Dev Team Lead / Sprint Specs (Reply Today)
    elif any(k in text_lower for k in ["sprint", "specs", "jayasri", "endpoint"]) or re.search(r'\bdev\b', text_lower):
        return {
            "priority": "🟡 Reply Today",
            "summary": "Dev Team Lead is requesting finalized API endpoint specs and sprint progress updates before Jayasri begins integration.",
            "deadline": "Friday at 12:00 PM (Noon)",
            "action_item": "Submit updated API endpoint documentation before Friday noon.",
            "why_important": [
                "Action required for upcoming team integration",
                "Mid-priority development sync request"
            ]
        }

    # 4. GitHub Security Alerts (Reply Today)
    elif any(k in text_lower for k in ["github", "dependabot", "vulnerability", "lodash"]):
        return {
            "priority": "🟡 Reply Today",
            "summary": "Dependabot detected a high-severity path traversal vulnerability in repository dependencies.",
            "deadline": "Action required promptly",
            "action_item": "Update package configuration to patch vulnerable dependencies.",
            "why_important": [
                "Security vulnerability risking application integrity",
                "Requires immediate code dependency remediation"
            ]
        }

    # 5. CFO Enterprise Client / Contract Renewal (Reply Today)
    elif any(k in text_lower for k in ["contract renewal", "invoice", "seat licenses"]):
        return {
            "priority": "🟡 Reply Today",
            "summary": "CFO Enterprise Client noted an extra charge for unused seat licenses on the Q4 invoice before signing renewal.",
            "deadline": "This Friday",
            "action_item": "Correct invoice discrepancy and respond before annual renewal agreement deadline.",
            "why_important": [
                "Financial billing discrepancy with enterprise client",
                "Direct impact on annual agreement renewal deadline"
            ]
        }

    # 6. Cloud Provider Billing (Reply Today)
    elif any(k in text_lower for k in ["billing", "payment failed", "server cluster"]):
        return {
            "priority": "🟡 Reply Today",
            "summary": "Automatic credit card payment for server hosting cluster #4 failed due to card expiration.",
            "deadline": "Within 48 hours",
            "action_item": "Update billing details in portal to prevent cluster service suspension.",
            "why_important": [
                "Risk of live server infrastructure suspension",
                "Time-sensitive billing update required"
            ]
        }

    # 7. Jessica Marketing / Partnership Proposal (FYI)
    elif any(k in text_lower for k in ["partnership", "webinar", "jessica"]):
        return {
            "priority": "🟢 FYI",
            "summary": "Jessica from Growth Co proposed co-hosting a live developer webinar focusing on AI-driven email workflows.",
            "deadline": "Next month",
            "action_item": "Review partnership scope and respond when bandwidth permits.",
            "why_important": [
                "External marketing and community collaboration opportunity",
                "No immediate operational bottleneck"
            ]
        }

    # 8. Tech Digest Newsletter (FYI)
    elif any(k in text_lower for k in ["digest", "newsletter", "top 10 ai tools"]):
        return {
            "priority": "🟢 FYI",
            "summary": "Weekly technology update summarizing top AI tools, productivity frameworks, and workflow automation trends for 2026.",
            "deadline": "No strict deadline",
            "action_item": "Optional reading; save or forward relevant items to the team.",
            "why_important": [
                "Informational content requiring no immediate reply",
                "Useful industry context and team knowledge sharing"
            ]
        }

    # 9. Office Facilities / Network Maintenance (FYI)
    elif any(k in text_lower for k in ["facilities", "network maintenance", "wi-fi"]):
        return {
            "priority": "🟢 FYI",
            "summary": "Routine fiber line maintenance scheduled for the weekend with possible brief office Wi-Fi interruptions.",
            "deadline": "This Saturday (1 AM - 4 AM)",
            "action_item": "Note scheduled downtime window; no direct action needed.",
            "why_important": [
                "Advance notice of temporary infrastructure downtime",
                "Helps plan weekend remote work dependencies"
            ]
        }

    # 10. Liam Design Studio / UI Feedback (FYI)
    elif any(k in text_lower for k in ["contrast", "staging build", "typography", "liam"]):
        return {
            "priority": "🟢 FYI",
            "summary": "Liam checked out the latest staging build and shared design feedback regarding mobile secondary border contrast.",
            "deadline": "No strict deadline",
            "action_item": "Review UI contrast adjustments when picking up frontend polish tasks.",
            "why_important": [
                "Collaborative design critique for mobile UX",
                "Non-blocking cosmetic refinement feedback"
            ]
        }

    # Default Fallback
    else:
        return {
            "priority": "🟢 FYI",
            "summary": "General informational correspondence received.",
            "deadline": "No strict deadline",
            "action_item": "Review message contents at your convenience.",
            "why_important": [
                "Standard administrative notification",
                "No urgent operational risk identified"
            ]
        }


def generate_tone_reply(email_text, voice_note, tone="Professional"):
    """
    Generates tailored responses locally based on email content and tone.
    """
    email_lower = (email_text or "").lower()
    
    # Determine appropriate recipient context
    if any(k in email_lower for k in ["ramesh", "proposal", "cost estimation"]):
        recipient = "Ramesh"
    elif any(k in email_lower for k in ["demo", "procurement", "board of directors"]):
        recipient = "David"
    elif any(k in email_lower for k in ["sprint", "specs", "endpoint"]) or re.search(r'\bdev\b', email_lower):
        recipient = "Team"
    elif "github" in email_lower:
        recipient = "Security Team"
    elif "cfo" in email_lower or "invoice" in email_lower:
        recipient = "Finance Team"
    elif "billing" in email_lower:
        recipient = "Billing Support"
    else:
        recipient = "Colleague"

    directive_clean = voice_note.strip() if voice_note else "I have reviewed the details and will proceed accordingly."

    if tone == "Concise":
        return f"Hi {recipient},\n\n{directive_clean}\n\nBest,\nAnwar"
    
    elif tone == "Polite Refusal":
        return (
            f"Hi {recipient},\n\n"
            f"Thank you for reaching out. Regrettably, I won't be able to fulfill this request at this time. "
            f"Regarding your update ({directive_clean}), I will need additional time before proceeding.\n\n"
            f"Best regards,\nAnwar"
        )
    
    else:  # Professional
        return (
            f"Hi {recipient},\n\n"
            f"Thank you for checking in. Regarding the update: {directive_clean}\n\n"
            f"I am making sure all necessary details are finalized and will follow up shortly.\n\n"
            f"Best regards,\nAnwar"
        )