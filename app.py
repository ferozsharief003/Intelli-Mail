import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from ai_engine import analyze_email_content, generate_tone_reply

# Point Flask to serve static files from the 'static' directory
app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

SAMPLE_EMAILS = [
    {
        "id": "email-1",
        "sender": "Ramesh Sharma (Senior Client)",
        "subject": "URGENT: Confirmation needed for Q4 Project Proposal",
        "timestamp": "Today, 09:15 AM",
        "category": "critical",
        "content": "Hi Anwar, I am waiting for the final confirmation and cost estimation breakdown on the Q4 proposal. We have a board meeting at 5 PM today and need this cleared by finance. Please send it over ASAP."
    },
    {
        "id": "email-2",
        "sender": "Dev Team Lead",
        "subject": "Sprint Progress & API Specs Sync",
        "timestamp": "Today, 10:30 AM",
        "category": "reply_today",
        "content": "Hey Anwar, hope you are doing well. Could you update us on the user endpoint API specs? Jayasri needs them to start the screen integration by Friday noon. Let me know if you need help."
    },
    {
        "id": "email-3",
        "sender": "GitHub Security Alerts",
        "subject": "Dependabot alert: High vulnerability in lodash < 4.17.21",
        "timestamp": "Yesterday",
        "category": "reply_today",
        "content": "GitHub detected a high-severity vulnerability in your repository dependencies. Path traversal vulnerability allows attackers to compromise application integrity. Please update your package configuration."
    },
    {
        "id": "email-4",
        "sender": "CFO Enterprise Client",
        "subject": "Contract Renewal & Invoice Discrepancy for Q4 Licensing",
        "timestamp": "Yesterday",
        "category": "reply_today",
        "content": "Hello, reviewing our Q4 invoice, we noticed an extra charge for 50 unused seat licenses. We need this corrected before we can sign the annual renewal agreement by Friday."
    },
    {
        "id": "email-5",
        "sender": "Jessica Marketing (Growth Co)",
        "subject": "Partnership Proposal: Joint Webinar on AI Productivity Tools",
        "timestamp": "2 days ago",
        "category": "fyi",
        "content": "Hi team, we love what you're building with Intelli-Mail. Would you be interested in co-hosting a live developer webinar next month focusing on AI-driven email workflows?"
    },
    {
        "id": "email-6",
        "sender": "Tech Digest Newsletter",
        "subject": "Top 10 AI Tools Transforming Workflows in 2026",
        "timestamp": "2 days ago",
        "category": "fyi",
        "content": "Here is this week's newsletter covering top emerging AI automation tools, autonomous agentic workflows, and developer productivity hacks for 2026."
    },
    {
        "id": "email-7",
        "sender": "David Sales (GlobalCorp)",
        "subject": "Urgent Demo Request for Enterprise Procurement Board",
        "timestamp": "3 days ago",
        "category": "critical",
        "content": "Our board of directors wants to see a live walkthrough of your email intelligence system this Thursday at 2 PM. Please let me know if your lead engineer can join the call."
    },
    {
        "id": "email-8",
        "sender": "Office Facilities Management",
        "subject": "Scheduled Network Maintenance this Saturday",
        "timestamp": "3 days ago",
        "category": "fyi",
        "content": "Please note that high-speed fiber lines will undergo routine maintenance this Saturday between 1 AM and 4 AM. Office Wi-Fi access might experience brief interruptions."
    },
    {
        "id": "email-9",
        "sender": "Liam Design Studio",
        "subject": "Feedback on new dark-mode contrast palette",
        "timestamp": "4 days ago",
        "category": "fyi",
        "content": "Hey! Checked out the latest staging build. The typography looks much cleaner, but the secondary border contrast on mobile could use a tiny adjustment. Thoughts?"
    },
    {
        "id": "email-10",
        "sender": "Cloud Provider Billing",
        "subject": "Account Notice: Automatic Payment Failed for Server Cluster",
        "timestamp": "5 days ago",
        "category": "reply_today",
        "content": "Your automatic credit card payment for server hosting cluster #4 failed due to expiration. Please update your billing details within 48 hours to prevent service suspension."
    }
]

# --- ROUTE FOR MAIN HTML ---
@app.route("/")
def index():
    return app.send_static_file("index.html")

# --- API ENDPOINTS ---
@app.route("/api/emails", methods=["GET"])
@app.route("/emails", methods=["GET"])
def get_emails():
    return jsonify(SAMPLE_EMAILS)

@app.route("/api/analyze", methods=["POST"])
@app.route("/analyze", methods=["POST"])
def analyze_email():
    data = request.get_json() or {}
    content = data.get("content", "")
    analysis = analyze_email_content(content)
    return jsonify(analysis)

@app.route("/api/reply", methods=["POST"])
@app.route("/reply", methods=["POST"])
def reply_email():
    data = request.get_json() or {}
    email_content = data.get("email_content", "")
    voice_note = data.get("voice_note", "")
    tone = data.get("tone", "Professional")
    
    draft = generate_tone_reply(email_content, voice_note, tone)
    return jsonify({"draft": draft})

if __name__ == "__main__":
    app.run(debug=True, port=5000)