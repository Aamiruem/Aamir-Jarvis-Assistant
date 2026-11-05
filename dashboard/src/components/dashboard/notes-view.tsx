"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage, notesApi } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import type { UserNote } from "@/types/api";

const EMPTY_FORM = { title: "", content: "", category: "General" };

const COURSE_LIBRARY = [
  {
    slug: "ai-ml-complete-notes",
    title: "AI/ML complete notes",
    description: "A complete AIML roadmap with fundamentals, Python, ML lifecycle, deep learning, NLP and project-ready knowledge.",
    chapters: [
      { id: "01", title: "AI/ML Syllabus & Roadmap", summary: "Overview of the full learning flow and the study plan.", concepts: ["Career roadmap", "Phase-wise learning", "Project readiness"] },
      { id: "02", title: "Python for AI/ML", summary: "Core syntax, functions, loops, data structures, and interview-focused Python patterns.", concepts: ["Python basics", "Data structures", "Interview prep"] },
      { id: "03", title: "Math & Statistics for ML", summary: "Linear algebra, probability, statistics, and model understanding basics.", concepts: ["Probability", "Statistics", "Optimization"] },
      { id: "04", title: "ML Lifecycle & Models", summary: "Model training flow, evaluation, feature engineering, and use-case planning.", concepts: ["Preprocessing", "Evaluation", "Deployment"] },
    ],
  },
  {
    slug: "ml-basics-to-advanced",
    title: "ML basics to advanced",
    description: "Machine learning notes from basics to advanced topics, covering Python, NumPy, Pandas, statistics, and interviews.",
    chapters: [
      { id: "01", title: "ML Roadmap: Basics to Advanced", summary: "The complete machine learning study track and learning order.", concepts: ["Roadmap", "Roadmap order", "Interview strategy"] },
      { id: "02", title: "Python for ML interview", summary: "Python concepts commonly asked in machine learning interviews.", concepts: ["Strings", "Lists", "Functions"] },
      { id: "03", title: "NumPy for ML interview", summary: "Arrays, broadcasting, reshaping, and linear algebra essentials.", concepts: ["NumPy arrays", "Broadcasting", "Matrix ops"] },
      { id: "04", title: "Pandas and data cleaning", summary: "Dataframes, filtering, joins, missing values, and practical ML data prep.", concepts: ["DataFrame", "GroupBy", "Cleaning"] },
    ],
  },
  {
    slug: "aiml-244-lecture",
    title: "AIML 244 lecture notes",
    description: "The 244-lecture style AIML notes bank for structured teaching and revision in chapter-wise format.",
    chapters: [
      { id: "01", title: "Lecture 1: AI foundations", summary: "Defines AI, ML, deep learning, and how learning systems work.", concepts: ["AI overview", "History", "AI vs ML"] },
      { id: "02", title: "Lecture 2: Python & data practice", summary: "Python and data workflows for machine learning and real-world AI systems.", concepts: ["Python practice", "Data flow", "Problem framing"] },
      { id: "03", title: "Lecture 3: ML and model thinking", summary: "Model evaluation, training loop, and the reason behind machine learning decisions.", concepts: ["Training", "Evaluation", "Model thinking"] },
    ],
  },
  {
    slug: "campusx-ml-244-lecture",
    title: "CampusX ML 244 lecture notes",
    description: "Lecture-wise ML notes with Python foundations, supervised learning, deep learning, NLP, deployment, and project-ready code snippets.",
    chapters: [
      { id: "01", title: "Lecture 1: Python foundations", summary: "Python basics, loops, functions, and building blocks for ML workflows.", concepts: ["Python", "Variables", "Functions"] },
      { id: "02", title: "Lecture 2: ML core concepts", summary: "Supervised vs unsupervised learning and the model training workflow.", concepts: ["ML workflow", "Loss function", "Evaluation"] },
      { id: "03", title: "Lecture 3: Data preparation and EDA", summary: "Cleaning, missing values, outliers, feature engineering, and exploring data quality.", concepts: ["EDA", "Cleaning", "Feature engineering"] },
      { id: "04", title: "Lecture 4: Supervised models", summary: "Regression, classification, decision trees, and random forest basics.", concepts: ["Regression", "Trees", "Random forest"] },
      { id: "05", title: "Lecture 5: Clustering and ensembles", summary: "K-means, PCA, bagging, boosting, and modern ensemble techniques.", concepts: ["Clustering", "PCA", "XGBoost"] },
      { id: "06", title: "Lecture 6: Deep learning", summary: "Neural networks, activation functions, backpropagation, and CNNs.", concepts: ["Neural nets", "CNN", "Backprop"] },
      { id: "07", title: "Lecture 7: NLP and transformers", summary: "Tokenization, embeddings, transformers, and LLM basics.", concepts: ["NLP", "Transformers", "LLM"] },
      { id: "08", title: "Lecture 8: Deployment and projects", summary: "Deployment patterns, monitoring, MLOps, and real-world ML project structure.", concepts: ["Deployment", "MLOps", "Projects"] },
    ],
  },
] as const;

export function NotesView() {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<(typeof COURSE_LIBRARY)[number]>(COURSE_LIBRARY[0]);
  const [chapterIndex, setChapterIndex] = useState(0);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const rows = await notesApi.list();
      setNotes(rows);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const currentChapter = selectedCourse.chapters[chapterIndex] ?? selectedCourse.chapters[0];

  const openCourse = (course: (typeof COURSE_LIBRARY)[number]) => {
    setSelectedCourse(course);
    setChapterIndex(0);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      setError("Please add a title and note content.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const updated = await notesApi.update(editingId, { title, content, category: form.category });
        setNotes((current) => current.map((note) => (note.id === editingId ? updated : note)));
      } else {
        const created = await notesApi.add(title, content, form.category);
        setNotes((current) => [created, ...current]);
      }
      resetForm();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await notesApi.remove(id);
      setNotes((current) => current.filter((note) => note.id !== id));
      if (editingId === id) resetForm();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Notes" description="Write, edit, and delete personal notes. Saved in MongoDB.">
        <div className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground">{notes.length} saved</div>
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="mb-5">
            <h2 className="mb-2 text-lg font-semibold">Lecture chapter notes</h2>
            <p className="text-sm text-muted-foreground">Browse chapter-wise AIML and ML study notes, then use the previous/next controls to read the full sequence.</p>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {COURSE_LIBRARY.map((course) => (
              <Button
                key={course.slug}
                type="button"
                variant={selectedCourse.slug === course.slug ? "default" : "outline"}
                size="sm"
                onClick={() => openCourse(course)}
              >
                {course.title}
              </Button>
            ))}
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current course</p>
                <h3 className="text-xl font-semibold">{selectedCourse.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={chapterIndex === 0} onClick={() => setChapterIndex((idx) => Math.max(0, idx - 1))}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={chapterIndex === selectedCourse.chapters.length - 1} onClick={() => setChapterIndex((idx) => Math.min(selectedCourse.chapters.length - 1, idx + 1))}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-lg border bg-background p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">Chapter {currentChapter.id}</p>
                <h4 className="mb-2 text-lg font-semibold">{currentChapter.title}</h4>
                <p className="mb-3 text-sm text-muted-foreground">{currentChapter.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {currentChapter.concepts.map((concept) => (
                    <span key={concept} className="rounded-full border bg-secondary px-2 py-1 text-xs text-muted-foreground">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Course summary</h5>
                <p className="text-sm leading-6 text-foreground/90">{selectedCourse.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-2">
                <label htmlFor="note-title" className="text-sm font-medium">Title</label>
                <Input
                  id="note-title"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Quarterly release plan"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="note-category" className="text-sm font-medium">Category</label>
                <select
                  id="note-category"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Ideas">Ideas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="note-content" className="text-sm font-medium">Content</label>
              <textarea
                id="note-content"
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                rows={7}
                placeholder="Write your note here..."
                className="flex min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {editingId ? <Save className="size-4" /> : <Plus className="size-4" />}
                {saving ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update note" : "Save note"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="size-4" /> Clear
              </Button>
            </div>
          </form>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your notes…</p>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No notes yet. Create your first note above.</div>
        ) : (
          notes.map((note) => (
            <article key={note.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {note.category}
                    </span>
                    <span className="text-xs text-muted-foreground">Updated {formatDateTime(note.updatedAt)}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{note.title}</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(note.id);
                      setForm({ title: note.title, content: note.content, category: note.category });
                    }}
                  >
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(note.id)}>
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{note.content}</p>
              <p className="mt-4 text-xs text-muted-foreground">Created {formatDateTime(note.createdAt)}</p>
            </article>
          ))
        )}
      </div>
    </>
  );
}
