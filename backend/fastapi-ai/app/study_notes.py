"""Study notes written by Claude with the user's master prompt (Notes → "Make notes with Azarvis").

The prompt asks for long, structured notes (introduction, vocabulary, basic → advanced concepts,
code with dry runs, mistakes, exercises, interview questions, cheat sheet, assessment), so the
answer is streamed with a large token budget inside a background job (see app/mllab/jobs.py).
For a lecture, Claude gets its title and the public video description; it cannot watch the video,
and the notes say so.
"""
import anthropic

from app.llm.claude import _current_key, base_params

MAX_TOKENS = 32_000

MASTER_PROMPT = """# MASTER PROMPT – AI/ML ENGINEER NOTES MAKER

Act as my personal AI/ML professor, senior software engineer, Python instructor and technical interview mentor.

I am an intermediate Python learner preparing to become an industry-ready AI/ML Engineer.

Whenever I provide a topic, create complete, structured study notes using the following instructions.

## 1. Topic Introduction
- What is this topic?
- Simple definition in very easy English.
- Why do we need it?
- Where is it used in real life?
- Why is it important in AI/ML engineering?

## 2. Difficult Words and Vocabulary
Create a vocabulary table (Difficult Word | Easy Meaning | Example). Explain every difficult technical word in simple English.

## 3. Concept Explanation: Basic to Advanced
Divide the topic into Level 1: Absolute basics, Level 2: Fundamental concepts, Level 3: Intermediate concepts, Level 4: Advanced concepts, Level 5: Industry-level applications. Explain every concept step by step. Never skip important fundamentals.

## 4. Visual Learning
Use visual explanations wherever possible: flowcharts, architecture diagrams, concept maps, graphs, tables, real-world illustrations, step-by-step workflows. Explain what every diagram represents.

## 5. Real-Life Examples
Give at least 3 practical examples: a daily-life example, a software development example, an AI/ML engineering example.

## 6. Python Code: Conceptual to Advanced
For every important concept, provide basic syntax, a simple code example, intermediate code, advanced code, an industry-level practical example and the expected output. Explain every important line of code in simple English. Use proper Python naming conventions and clean coding practices.

## 7. Code Dry Run
Perform a complete manual dry run: initial values, variable changes, function execution, loop iterations, conditions, return values, final output, in a dry-run table (Step | Execution | Variable Value | Output). Never skip execution steps.

## 8. Common Mistakes and Debugging
Common beginner mistakes, common advanced mistakes, error messages and their meanings, why errors occur, how to fix them, best practices.

## 9. Practical Exercises
5 beginner, 5 intermediate and 5 advanced exercises, and 2 real-world mini-projects. Give hints first. Provide solutions separately so I can try independently.

## 10. Technical Interview Preparation
10 basic, 10 intermediate and 10 advanced interview questions, 5 coding interview problems, expected answers with explanations, code-based interview questions, tricky questions asked in IT companies, and follow-up questions an interviewer might ask.

## 11. Industry-Level Applications
How this topic is used in real-world software development, Data Science, Machine Learning, Deep Learning, Generative AI, AI Backend Engineering and production systems.

## 12. Topic Summary
Important definitions, core concepts, important formulas, important syntax, key differences, most important takeaways.

## 13. Quick Revision Cheat Sheet
A compact revision table (Concept | Syntax / Formula | Meaning | Example) with important syntax, short code snippets, important commands, common errors, interview reminders and must-remember concepts.

## 14. Knowledge Assessment
10 MCQs, 5 output-prediction questions, 5 debugging questions and 5 coding challenges. Do not reveal answers immediately: put all answers in a final "Answers" section.

## TEACHING RULES
1. Use very easy English.
2. Explain difficult words immediately.
3. Assume I want to understand, not memorize.
4. Teach from basic to advanced.
5. Never skip the logic behind code.
6. Use practical examples and visual diagrams.
7. Explain WHY, HOW and WHEN.
8. Explain every important line of code.
9. Include complete code and expected outputs.
10. Connect concepts to AI/ML engineering.
11. Keep notes properly structured with headings and tables.
12. Make notes suitable for future revision and technical interviews.

IMPORTANT: Do not give a short overview when I request complete notes. Explain the topic thoroughly.

Format: Markdown with # headings for the 14 sections, tables, fenced ```python code blocks, and formulas as \\( … \\) inline or \\[ … \\] on their own lines.

## MY LEARNING LEVEL:
Intermediate Python → Advanced → Industry Ready AI/ML Engineer."""


def request_text(topic: str, lecture: dict | None = None, context: str = "") -> str:
    """The user turn: the topic, and for a lecture what is publicly known about it."""
    parts = [f"## MY TOPIC:\n{topic.strip()}"]
    if lecture:
        parts.append(
            f"This topic is lecture {lecture.get('n')} of the {lecture.get('course', 'course')} playlist: "
            f"\"{lecture.get('title', topic)}\". You can't watch the video, so cover the topic as this lecture's "
            "title and description indicate, and begin the notes with one line saying they are based on the topic, "
            "not a transcript of the video."
        )
        if lecture.get("description"):
            parts.append(f"The video description, for context (links in it are where the lecture's code lives):\n<description>\n{lecture['description'][:6000]}\n</description>")
    if context.strip():
        parts.append(f"My own notes or what I remember from the lecture, to include and build on:\n<my_notes>\n{context.strip()[:20000]}\n</my_notes>")
    return "\n\n".join(parts)


def generate(topic: str, lecture: dict | None, context: str, progress) -> dict:
    """Runs in a background thread: a synchronous client, so no event loop is shared with the API."""
    key = _current_key()
    if not key:
        raise ValueError("No Claude API key is set. Run \"npm run set-key\" in the project folder.")
    client = anthropic.Anthropic(api_key=key)
    progress("Azarvis is writing your notes…", 3)
    chunks: list[str] = []
    try:
        with client.beta.messages.stream(
            system=MASTER_PROMPT,
            messages=[{"role": "user", "content": request_text(topic, lecture, context)}],
            **base_params(max_tokens=MAX_TOKENS),
        ) as stream:
            for text in stream.text_stream:
                chunks.append(text)
                written = sum(len(c) for c in chunks)
                progress(f"Writing… {written:,} characters so far", min(95, 3 + written // 900))
            final = stream.get_final_message()
    except anthropic.AuthenticationError:
        raise ValueError("Your Claude API key was rejected. Run \"npm run set-key\" with a new key.")
    except anthropic.APIStatusError as e:
        raise ValueError(f"Claude couldn't write the notes right now ({e.status_code}). Try again in a minute.")
    if final.stop_reason == "refusal":
        raise ValueError("Claude declined to write notes on this topic.")
    markdown = "".join(chunks).strip()
    if final.stop_reason == "max_tokens":
        markdown += "\n\n> The notes reached the length limit here. Ask again for the remaining sections."
    return {"markdown": markdown, "output_tokens": final.usage.output_tokens, "stop_reason": final.stop_reason}
