"""The specialist agents the orchestrator can assign work to.

Each is the same Azarvis agent loop (app/agent/agent.py) with a narrower tool list and a role note,
so it stays focused and can only touch what its job needs. "assistant" keeps every tool.
"""

AGENTS: dict[str, dict] = {
    "research": {
        "name": "Research Agent",
        "does": "Searches the web and your documents, reads pages, compares sources.",
        "tools": {"web_search", "web_fetch", "wikipedia", "search_knowledge", "get_weather", "get_time", "calculate"},
    },
    "career": {
        "name": "Career & Writing Agent",
        "does": "Matches skills to roles, drafts resumes, cover letters and professional text.",
        "tools": {"search_knowledge", "web_search", "web_fetch", "copy_to_clipboard", "get_time"},
    },
    "email": {
        "name": "Email Agent",
        "does": "Finds contacts and prepares email drafts (sending needs your approval).",
        "tools": {"compose_email", "find_contact", "add_contact", "get_time"},
    },
    "calendar": {
        "name": "Calendar & Reminder Agent",
        "does": "Creates and reviews tasks, reminders and your schedule.",
        "tools": {"create_task", "list_tasks", "complete_task", "get_time"},
    },
    "memory": {
        "name": "Memory Agent",
        "does": "Recalls and saves lasting facts about you.",
        "tools": {"remember", "forget", "search_knowledge"},
    },
    "data": {
        "name": "Data Science Agent",
        "does": "Exact maths and predictions with your trained ML models.",
        "tools": {"calculate", "predict_house_price", "predict_crop_yield", "list_ml_models", "predict_with_model"},
    },
    "coding": {
        "name": "Software Engineering Agent",
        "does": "Writes, explains and debugs code; can read the clipboard or the screen for errors.",
        "tools": {"web_search", "web_fetch", "calculate", "read_clipboard", "copy_to_clipboard", "look_at_screen"},
    },
    "system": {
        "name": "System Agent",
        "does": "PC health, files, apps and websites on this computer (actions need your approval).",
        "tools": {"system_status", "find_files", "open_file", "system_control", "open_website", "read_clipboard", "look_at_screen"},
    },
    "security": {
        "name": "Cybersecurity Defense Agent",
        "does": "Read-only security checks of this PC, its Wi-Fi, open ports, files and websites; explains risks and fixes.",
        "tools": {"run_diagnostic", "web_search", "web_fetch", "get_time"},
    },
    "devices": {
        "name": "Hardware & Device Intelligence Agent",
        "does": "Finds devices on the user's own network and Bluetooth, checks the PC's hardware and IP (network scans need the owner's OK).",
        "tools": {"run_diagnostic", "get_time"},
    },
    "troubleshoot": {
        "name": "Troubleshooting Agent",
        "does": "Diagnoses a slow or misbehaving PC: load, disks, crashes, network; can look at the screen for an error.",
        "tools": {"run_diagnostic", "system_status", "look_at_screen", "web_search", "web_fetch"},
    },
    "ethical_hacker": {
        "name": "Ethical Hacker Agent",
        "does": "Authorized audits only: the user's own network (with their OK), passive website and public-records checks, dependency CVEs, code secrets. Never attacks or exploits.",
        "tools": {"run_diagnostic", "web_search", "web_fetch", "get_time"},
    },
    "network": {
        "name": "Network Engineering Agent",
        "does": "Internet, Wi-Fi and DNS faults, latency and packet loss, traceroutes, live connections, IP configuration.",
        "tools": {"run_diagnostic", "web_search", "calculate"},
    },
    "ml_research": {
        "name": "AI/ML Research Agent",
        "does": "Model and algorithm research, comparing papers and methods, using the user's ML Lab models.",
        "tools": {"web_search", "web_fetch", "search_knowledge", "list_ml_models", "predict_with_model", "calculate"},
    },
    "electronics": {
        "name": "Electronics Research Agent",
        "does": "Circuits, components, datasheets and hardware calculations (Ohm's law, power, battery life).",
        "tools": {"web_search", "web_fetch", "wikipedia", "calculate"},
    },
    "math": {
        "name": "Mathematics Agent",
        "does": "Exact calculations, step-by-step derivations, statistics and unit conversions.",
        "tools": {"calculate", "wikipedia"},
    },
    "science": {
        "name": "Scientific Research Agent",
        "does": "Scientific questions from sources: finds studies, compares findings, states uncertainty and conflicting evidence.",
        "tools": {"web_search", "web_fetch", "wikipedia", "search_knowledge", "calculate"},
    },
    "database": {
        "name": "Database Agent",
        "does": "SQL and NoSQL design, queries, indexing and migrations (PostgreSQL, MongoDB, Redis, SQLite).",
        "tools": {"web_search", "web_fetch", "calculate"},
    },
    "automation": {
        "name": "Automation Agent",
        "does": "Turns routines into reminders and tasks, opens apps and sites (actions need the user's approval).",
        "tools": {"create_task", "list_tasks", "system_control", "open_website", "get_time"},
    },
    "qa": {
        "name": "Quality Assurance Agent",
        "does": "Double-checks other agents' important conclusions against real evidence: re-runs checks, verifies sources and numbers.",
        "tools": {"run_diagnostic", "web_fetch", "web_search", "calculate"},
    },
    "assistant": {
        "name": "Personal Assistant Agent",
        "does": "Anything that doesn't fit a specialist; has every tool.",
        "tools": None,
    },
}


def role_note(agent_id: str, title: str) -> str:
    agent = AGENTS.get(agent_id, AGENTS["assistant"])
    return (
        f"You are the {agent['name']} in a team of Azarvis agents working on one request; your job here: {title}. "
        "Do only your part, using your tools, then reply with a short, factual result another agent can use. "
        "Never claim something happened unless a tool result shows it. Actions that act for the user "
        "(email, opening apps, files or sites, PC control, clipboard writes, new contacts) are only prepared: "
        "say they are waiting for the user's approval."
    )
