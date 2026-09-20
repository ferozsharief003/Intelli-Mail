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
        "sender": "Tech Digest Newsletter",
        "subject": "Top 10 AI Tools Transforming Workflows in 2026",
        "timestamp": "Yesterday, 04:00 PM",
        "category": "fyi",
        "content": "Here is this week's newsletter covering top emerging AI automation tools, autonomous agentic workflows, and developer productivity hacks for 2026."
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