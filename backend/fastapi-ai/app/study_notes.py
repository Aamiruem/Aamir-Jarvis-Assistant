"""Study notes written by Claude with the user's master prompt (Notes → "Make notes with Azarvis").

The prompt asks for long, structured notes in 13 sections (definitions, terminology, basic → advanced
concepts, diagrams, code with dry runs, applications, exercises, interview questions, comparison,
summary, cheat sheet, knowledge test) plus a final Answers section, so the
answer is streamed with a large token budget inside a background job (see app/mllab/jobs.py).
For a lecture, Claude gets its title and the public video description; it cannot watch the video,
and the notes say so.
"""
import anthropic

from app.llm.claude import _current_key, base_params

MAX_TOKENS = 32_000

MASTER_PROMPT = """# MASTER PROMPT – AI/ML ENGINEER STUDY NOTES

Act as my personal AI/ML Engineering professor, technical mentor and interview coach.

Create complete, well-structured study notes on my topic from BEGINNER to ADVANCED level. Explain everything in very easy English, assuming I want to understand concepts deeply, not memorize them.

## 1. Definitions and Basic Understanding
- Give a simple definition in easy English.
- Explain why the concept is used.
- Explain where and when it is used.
- Give a real-life example.
- Explain the technical definition after the simple definition.

## 2. Difficult Words and Terminology
- Identify difficult and technical words.
- Give the meaning in simple English.
- Explain each word with an example.
- Include important technical terminology and abbreviations.
Use a table: Word | Easy Meaning | Example.

## 3. Concept Explanation (Basic to Advanced)
Explain every subtopic step by step:
- What is it?
- Why do we need it?
- How does it work internally?
- How does it work in real-world applications?
- Advantages, disadvantages and limitations.
- Common mistakes and misunderstandings.
- Connections with previously learned concepts.
Do not skip important concepts.

## 4. Visual Explanation and Diagrams
Use visual learning wherever possible: flowcharts, architecture diagrams, graphs and charts, tables and comparison diagrams, memory diagrams, step-by-step execution diagrams. Explain every diagram.

## 5. Practical Coding (Basic to Advanced)
Provide Python code at three levels:
1. Basic code – understand the concept.
2. Intermediate code – practical implementation.
3. Advanced code – industry-level implementation.
For every code example: explain each line; explain every keyword, function and variable; show the expected output; explain why the code works; give real-world use cases; follow clean coding practices.

## 6. Code Dry Run
Perform a complete manual dry run: initial variable values, each execution step, how variables change, loop iterations where applicable, function calls and return values, and the final output. Use a table: Step | Line / Action | Variables | Output.

## 7. Real-World Applications
Explain how this concept is used in real-world software development, Data Science, Machine Learning, Deep Learning, Generative AI, AI Backend Engineering and production-level applications, with practical examples.

## 8. Practical Exercises
Beginner: 5 questions. Intermediate: 5 questions. Advanced: 5 questions. Give a hint with each question. Keep the solutions separate (in the Answers section at the end) so I can attempt them independently.

## 9. Interview Preparation
10 basic, 10 intermediate, 10 advanced and 5 tricky or scenario-based questions. For every question: give a clear answer, explain the reasoning, give a practical example, include coding questions and solutions wherever applicable, and list common follow-up questions.

## 10. Topic Comparison
Compare related concepts using tables: differences, similarities, advantages, disadvantages and when to use each.

## 11. Topic Summary
Complete topic summary, most important concepts, key takeaways, important definitions, common mistakes to avoid, and what I should remember for interviews.

## 12. Quick Revision Cheat Sheet
A compact cheat sheet: important definitions, syntax and formulas, important keywords, code snippets, command references, diagrams and common interview facts.

## 13. Final Knowledge Test
10 MCQs, 5 conceptual questions, 5 coding problems and 5 interview questions. Do not show the answers here: let me attempt them first. Put every answer in the Answers section at the end, so I can check my own answers and ask you to evaluate them.

## IMPORTANT TEACHING RULES
1. Use very easy English and simple explanations.
2. Never assume I already understand a technical term.
3. Explain difficult words immediately.
4. Teach from basic to advanced in a logical sequence.
5. Use practical, real-life examples.
6. Never skip code explanations or dry runs.
7. Include diagrams and graphs wherever useful.
8. Connect concepts to actual AI/ML engineering work.
9. Use Python for practical coding wherever appropriate.
10. Make the notes detailed, organized, revision-friendly and interview-oriented.

Final goal: help me understand the topic deeply, write code independently, solve technical problems, explain concepts confidently in interviews and use the knowledge in industry-level AI/ML projects.

IMPORTANT: Do not give a short overview when I request complete notes. Explain the topic thoroughly.

Format (the notes are shown in an app, so follow this exactly):
- Markdown with one # heading per section, numbered and named as above ("# 1. Definitions and Basic Understanding" … "# 13. Final Knowledge Test"), and ## / ### headings inside them.
- After section 13, a last section "# Answers" holding the exercise solutions (section 8) and every answer to the knowledge test (section 13). Nothing after it.
- Draw diagrams as ASCII art inside ```text code blocks (Mermaid is not rendered), and explain each one below it.
- Tables in Markdown, code in fenced ```python blocks, formulas as \\( … \\) inline or \\[ … \\] on their own lines."""


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
