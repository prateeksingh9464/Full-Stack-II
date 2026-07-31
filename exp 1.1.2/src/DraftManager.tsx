import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  FilePlus2,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  X,
  ImagePlus,
  Paperclip,
} from "lucide-react";

/* ============================================================================
   TYPES
============================================================================ */

type AttachmentType = "image" | "video";
type AttachmentStatus = "uploading" | "ready" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";
type ToastType = "success" | "error";

interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  size: number;
  status: AttachmentStatus;
  url: string | null;
}

interface Draft {
  id: string;
  title: string;
  content: string;
  attachments: Attachment[];
  createdAt: number;
  updatedAt: number;
}

interface DraftInput {
  title: string;
  content: string;
  attachments: Attachment[];
}

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface UploadResult {
  url: string;
}

/* ============================================================================
   MOCK "BACKEND"
   ----------------------------------------------------------------------------
   Artifacts / sandboxed environments can't always use localStorage, so instead
   of persisting to the browser we simulate a real network-backed API: an
   in-memory store that every CRUD call reaches through an async function with
   artificial latency and a small random failure rate. This forces the UI to
   handle loading + error states honestly, for drafts AND for file uploads.

   To wire this up to a real backend later: keep the mockApi.* function
   signatures identical, and replace the bodies with fetch() calls — e.g.
   uploadFile would POST to a real upload endpoint and return a hosted URL
   instead of a local blob URL.
============================================================================ */

let _serverDrafts: Draft[] = [
  {
    id: "seed-1",
    title: "Why quorum reads matter",
    content:
      "Draft notes for the KV store README — need to explain read-repair and why W + R > N guarantees consistency...",
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    attachments: [],
  },
  {
    id: "seed-2",
    title: "Cross-validation talk outline",
    content:
      "Intro: why a single train/test split lies to you. K-fold. Stratified k-fold for imbalanced classes. Leave-one-out tradeoffs...",
    createdAt: Date.now() - 1000 * 60 * 60 * 50,
    updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    attachments: [],
  },
];
let _idCounter = 3;
let _attCounter = 1;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
const maybeFail = (rate = 0.12): boolean => Math.random() < rate;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const mockApi = {
  async list(): Promise<Draft[]> {
    await delay(650 + Math.random() * 400);
    return [..._serverDrafts].sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async create(input: DraftInput): Promise<Draft> {
    await delay(500 + Math.random() * 400);
    if (maybeFail())
      throw new Error("Network hiccup — draft wasn't saved. Try again.");
    const draft: Draft = {
      id: `d_${_idCounter++}`,
      title: input.title,
      content: input.content,
      attachments: input.attachments || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    _serverDrafts.push(draft);
    return draft;
  },
  async update(id: string, updates: Partial<DraftInput>): Promise<Draft> {
    await delay(450 + Math.random() * 350);
    if (maybeFail()) throw new Error("Network hiccup — changes weren't saved.");
    const idx = _serverDrafts.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("That draft no longer exists.");
    _serverDrafts[idx] = {
      ..._serverDrafts[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    return _serverDrafts[idx];
  },
  async remove(id: string): Promise<true> {
    await delay(400 + Math.random() * 300);
    if (maybeFail()) throw new Error("Network hiccup — delete failed.");
    _serverDrafts = _serverDrafts.filter((d) => d.id !== id);
    return true;
  },
  // Simulates uploading a single file to object storage and getting back a URL.
  async uploadFile(file: File): Promise<UploadResult> {
    await delay(600 + Math.random() * 700);
    if (maybeFail(0.1))
      throw new Error(`Upload failed for "${file.name}" — try again.`);
    return { url: URL.createObjectURL(file) };
  },
};

/* ============================================================================
   HELPERS
============================================================================ */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function snippet(text: string, len = 90): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > len
    ? clean.slice(0, len) + "…"
    : clean || "Empty draft";
}

/* ============================================================================
   STATUS PILL
============================================================================ */

interface StatusPillProps {
  state: SaveState;
}

function StatusPill({ state }: StatusPillProps) {
  const map: Record<SaveState, { label: string; cls: string }> = {
    idle: { label: "Unsaved", cls: "pill-idle" },
    saving: { label: "Saving…", cls: "pill-saving" },
    saved: { label: "Saved", cls: "pill-saved" },
    error: { label: "Couldn't save", cls: "pill-error" },
  };
  const { label, cls } = map[state] || map.idle;
  return (
    <div className={`status-pill ${cls}`}>
      <span className="pill-dot">
        {state === "saving" && <Loader2 size={11} className="spin" />}
        {state === "saved" && <Check size={11} />}
        {state === "error" && <AlertCircle size={11} />}
      </span>
      {label}
    </div>
  );
}

/* ============================================================================
   TOASTS
============================================================================ */

interface ToastsProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

function Toasts({ toasts, onDismiss }: ToastsProps) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="toast-close"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export default function DraftManager(): React.JSX.Element {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null); // null => composing a new draft
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lightbox, setLightbox] = useState<Attachment | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushToast = (type: ToastType, message: string): void => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  const dismissToast = (id: number): void =>
    setToasts((t) => t.filter((x) => x.id !== id));

  // Initial fetch — simulates loading drafts from a server on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await mockApi.list();
        if (!cancelled) {
          setDrafts(data);
          setListError(null);
        }
      } catch (e) {
        if (!cancelled) setListError(getErrorMessage(e));
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetSaveStateSoon = (next: SaveState, ms: number): void => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveState(next), ms);
  };

  const handleNew = (): void => {
    setActiveId(null);
    setTitle("");
    setContent("");
    setAttachments([]);
    setSaveState("idle");
  };

  const handleEdit = (draft: Draft): void => {
    setActiveId(draft.id);
    setTitle(draft.title);
    setContent(draft.content);
    setAttachments(draft.attachments);
    setSaveState("idle");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  };

  const handleFilesSelected = async (
    fileList: FileList | null,
  ): Promise<void> => {
    const files = Array.from(fileList || []);
    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        pushToast("error", `"${file.name}" isn't an image or video.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        pushToast("error", `"${file.name}" is over 25MB.`);
        continue;
      }
      const tempId = `att_${_attCounter++}`;
      const pending: Attachment = {
        id: tempId,
        name: file.name,
        type: isVideo ? "video" : "image",
        size: file.size,
        status: "uploading",
        url: null,
      };
      setAttachments((prev) => [...prev, pending]);
      try {
        const uploaded = await mockApi.uploadFile(file);
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === tempId ? { ...a, url: uploaded.url, status: "ready" } : a,
          ),
        );
      } catch (e) {
        setAttachments((prev) =>
          prev.map((a) => (a.id === tempId ? { ...a, status: "error" } : a)),
        );
        pushToast("error", getErrorMessage(e));
      }
    }
  };

  const removeAttachment = (id: string): void => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = async (): Promise<void> => {
    if (!title.trim() && !content.trim() && attachments.length === 0) {
      pushToast("error", "Write something or attach a file before saving.");
      return;
    }
    const readyAttachments = attachments.filter((a) => a.status === "ready");
    setSaveState("saving");
    try {
      if (activeId === null) {
        const created = await mockApi.create({
          title: title.trim() || "Untitled draft",
          content,
          attachments: readyAttachments,
        });
        setDrafts((prev) => [created, ...prev]);
        setActiveId(created.id);
        pushToast("success", "Draft saved.");
      } else {
        const updated = await mockApi.update(activeId, {
          title: title.trim() || "Untitled draft",
          content,
          attachments: readyAttachments,
        });
        setDrafts((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d)),
        );
        pushToast("success", "Draft updated.");
      }
      setSaveState("saved");
      resetSaveStateSoon("idle", 1800);
    } catch (e) {
      setSaveState("error");
      pushToast("error", getErrorMessage(e));
      resetSaveStateSoon("idle", 2200);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setDeletingId(id);
    setConfirmingId(null);
    try {
      await mockApi.remove(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (activeId === id) handleNew();
      pushToast("success", "Draft deleted.");
    } catch (e) {
      pushToast("error", getErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...drafts].sort((a, b) => b.updatedAt - a.updatedAt);
  const isEditingExisting = activeId !== null;
  const wc = wordCount(content);

  return (
    <div className="draft-app">
      <style>{`
        .draft-app {
          --ink: #1b1b1f;
          --surface: #242429;
          --surface-2: #2a2a30;
          --line: #38383f;
          --text: #f2f1ed;
          --muted: #93939c;
          --amber: #e0a339;
          --amber-dim: rgba(224,163,57,0.15);
          --sage: #6fbf8b;
          --sage-dim: rgba(111,191,139,0.15);
          --red: #d97a7a;
          --red-dim: rgba(217,122,122,0.15);
          font-family: 'Inter', -apple-system, sans-serif;
          background: var(--ink);
          color: var(--text);
          min-height: 100%;
          padding: 28px;
          border-radius: 16px;
          box-sizing: border-box;
        }
        .draft-app * { box-sizing: border-box; }
        .draft-serif { font-family: 'Georgia', 'Times New Roman', serif; }
        .draft-mono { font-family: 'SF Mono', 'Courier New', monospace; }

        .app-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .app-title { font-size: 26px; font-weight: 600; letter-spacing: -0.01em; }
        .app-subtitle { color: var(--muted); font-size: 13px; margin-top: 4px; }
        .new-btn {
          display: flex; align-items: center; gap: 7px;
          background: var(--amber); color: #1b1b1f; border: none;
          padding: 9px 16px; border-radius: 9px; font-weight: 600; font-size: 13.5px;
          cursor: pointer; transition: transform 0.15s ease, filter 0.15s ease;
        }
        .new-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .new-btn:active { transform: translateY(0); }

        .layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 860px) { .layout { grid-template-columns: 320px 1fr; } }

        .list-col { display: flex; flex-direction: column; gap: 10px; }
        .list-scroll { display: flex; flex-direction: column; gap: 10px; max-height: 620px; overflow-y: auto; padding-right: 4px; }

        .draft-card {
          background: var(--surface); border: 1px solid var(--line); border-radius: 12px;
          padding: 13px 14px; cursor: pointer;
          transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
          position: relative;
        }
        .draft-card:hover { transform: rotate(-0.4deg) translateY(-1px); border-color: #4a4a53; background: var(--surface-2); }
        .draft-card.active { border-color: var(--amber); background: var(--surface-2); }

        .card-title { font-weight: 600; font-size: 14.5px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .card-snippet {
          color: var(--muted); font-size: 12.5px; line-height: 1.4; margin-bottom: 10px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .card-meta { display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--muted); flex-wrap: wrap; gap: 6px; }
        .card-meta-left { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .card-attach-badge { display: flex; align-items: center; gap: 3px; color: var(--amber); }
        .card-actions { display: flex; gap: 6px; }
        .icon-btn {
          background: transparent; border: none; color: var(--muted); cursor: pointer; padding: 4px;
          border-radius: 6px; display: flex; align-items: center;
          transition: color 0.15s ease, background 0.15s ease;
        }
        .icon-btn:hover { color: var(--text); background: #38383f; }
        .icon-btn.danger:hover { color: var(--red); background: var(--red-dim); }

        .confirm-row { display: flex; gap: 6px; align-items: center; }
        .confirm-btn { font-size: 11px; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .confirm-btn.yes { background: var(--red-dim); color: var(--red); }
        .confirm-btn.no { background: #38383f; color: var(--muted); }

        .skeleton {
          background: var(--surface); border: 1px solid var(--line); border-radius: 12px; height: 78px;
          position: relative; overflow: hidden;
        }
        .skeleton::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          animation: shimmer 1.3s infinite;
        }
        @keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(100%); } }

        .empty-state { border: 1px dashed var(--line); border-radius: 12px; padding: 28px 16px; text-align: center; color: var(--muted); font-size: 13px; }

        .editor-col { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .editor-top { display: flex; justify-content: space-between; align-items: center; }
        .editor-eyebrow { font-size: 11.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }

        .status-pill { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; padding: 5px 10px; border-radius: 999px; }
        .pill-dot { display: flex; align-items: center; justify-content: center; }
        .pill-idle { background: #38383f; color: var(--muted); }
        .pill-saving { background: var(--amber-dim); color: var(--amber); }
        .pill-saved { background: var(--sage-dim); color: var(--sage); }
        .pill-error { background: var(--red-dim); color: var(--red); }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .title-input {
          background: transparent; border: none; border-bottom: 1px solid var(--line);
          padding: 6px 2px 12px; font-size: 20px; font-weight: 600; color: var(--text);
          outline: none; font-family: 'Georgia', serif;
        }
        .title-input::placeholder { color: #5a5a63; }
        .title-input:focus { border-bottom-color: var(--amber); }

        .content-area {
          background: repeating-linear-gradient(var(--surface), var(--surface) 27px, var(--line) 28px);
          border: 1px solid var(--line); border-radius: 8px; padding: 10px 14px; color: var(--text);
          font-size: 14.5px; line-height: 28px; min-height: 260px; resize: vertical; outline: none;
          font-family: 'Georgia', serif;
        }
        .content-area:focus { border-color: #4a4a53; }
        .content-area::placeholder { color: #5a5a63; line-height: 28px; }

        /* attachments */
        .attachments-section { display: flex; flex-direction: column; gap: 10px; }
        .attachments-header { display: flex; align-items: center; justify-content: space-between; }
        .add-media-btn {
          display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600;
          color: var(--text); background: #38383f; padding: 7px 12px; border-radius: 8px;
          cursor: pointer; transition: background 0.15s ease; width: fit-content;
        }
        .add-media-btn:hover { background: #45454e; }
        .add-media-btn input { display: none; }
        .attachments-count { font-size: 11.5px; color: var(--muted); }

        .attachments-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .attachment-tile {
          position: relative; width: 92px; border: 1px solid var(--line); border-radius: 9px;
          overflow: hidden; background: var(--surface-2);
        }
        .attachment-media { width: 92px; height: 72px; object-fit: cover; display: block; background: #000; }
        .attachment-loading, .attachment-error {
          width: 92px; height: 72px; display: flex; align-items: center; justify-content: center;
        }
        .attachment-loading { color: var(--amber); }
        .attachment-error { color: var(--red); }
        .attachment-name {
          font-size: 9.5px; color: var(--muted); padding: 4px 5px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .attachment-remove {
          position: absolute; top: 3px; right: 3px; background: rgba(0,0,0,0.55); border: none;
          color: #fff; border-radius: 999px; width: 18px; height: 18px; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
        }
        .attachment-remove:hover { background: rgba(0,0,0,0.8); }

        .lightbox-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.82); z-index: 60;
          display: flex; align-items: center; justify-content: center; padding: 32px;
        }
        .lightbox-img { max-width: 90vw; max-height: 85vh; border-radius: 8px; }
        .lightbox-close {
          position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.12); border: none;
          color: #fff; border-radius: 999px; width: 32px; height: 32px; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
        }
        .lightbox-close:hover { background: rgba(255,255,255,0.22); }

        .editor-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        .word-count { font-size: 11.5px; color: var(--muted); }

        .btn-row { display: flex; gap: 8px; }
        .btn-secondary {
          background: transparent; border: 1px solid var(--line); color: var(--muted);
          padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .btn-secondary:hover { border-color: #5a5a63; color: var(--text); }
        .btn-save {
          display: flex; align-items: center; gap: 7px; background: var(--amber); color: #1b1b1f;
          border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px;
          cursor: pointer; transition: filter 0.15s ease, opacity 0.15s ease;
        }
        .btn-save:hover:not(:disabled) { filter: brightness(1.08); }
        .btn-save:disabled { opacity: 0.55; cursor: not-allowed; }

        .list-error { border: 1px solid var(--red); background: var(--red-dim); color: var(--red); border-radius: 10px; padding: 12px; font-size: 12.5px; }

        .toast-stack { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 70; }
        .toast {
          display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 9px;
          font-size: 12.5px; font-weight: 500; box-shadow: 0 6px 18px rgba(0,0,0,0.35);
          animation: rise 0.2s ease; min-width: 200px;
        }
        @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .toast-success { background: #2a3a30; color: var(--sage); border: 1px solid #3d5544; }
        .toast-error { background: #3a2a2a; color: var(--red); border: 1px solid #553d3d; }
        .toast-close { margin-left: auto; background: none; border: none; color: inherit; opacity: 0.6; cursor: pointer; display: flex; }
        .toast-close:hover { opacity: 1; }
      `}</style>

      <div className="app-header">
        <div>
          <div className="app-title draft-serif">Drafts</div>
          <div className="app-subtitle">
            Autosaved to nothing yet — save when you're ready.
          </div>
        </div>
        <button className="new-btn" onClick={handleNew}>
          <FilePlus2 size={15} /> New draft
        </button>
      </div>

      <div className="layout">
        {/* LIST */}
        <div className="list-col">
          {isLoadingList && (
            <>
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </>
          )}

          {!isLoadingList && listError && (
            <div className="list-error">{listError}</div>
          )}

          {!isLoadingList && !listError && sorted.length === 0 && (
            <div className="empty-state">
              No drafts yet — write something and save it.
            </div>
          )}

          {!isLoadingList && !listError && sorted.length > 0 && (
            <div className="list-scroll">
              {sorted.map((d) => (
                <div
                  key={d.id}
                  className={`draft-card${activeId === d.id ? " active" : ""}`}
                  onClick={() => handleEdit(d)}
                >
                  <div className="card-title">
                    {d.title || "Untitled draft"}
                  </div>
                  <div className="card-snippet">{snippet(d.content)}</div>
                  <div className="card-meta">
                    <div className="card-meta-left">
                      <Clock size={11} />
                      {formatRelative(d.updatedAt)} · {wordCount(d.content)}w
                      {d.attachments.length > 0 && (
                        <span className="card-attach-badge">
                          <Paperclip size={11} /> {d.attachments.length}
                        </span>
                      )}
                    </div>

                    {confirmingId === d.id ? (
                      <div
                        className="confirm-row"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <button
                          className="confirm-btn yes"
                          onClick={() => handleDelete(d.id)}
                        >
                          {deletingId === d.id ? (
                            <Loader2 size={11} className="spin" />
                          ) : (
                            "Delete"
                          )}
                        </button>
                        <button
                          className="confirm-btn no"
                          onClick={() => setConfirmingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        className="card-actions"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <button
                          className="icon-btn"
                          onClick={() => handleEdit(d)}
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => setConfirmingId(d.id)}
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EDITOR */}
        <div className="editor-col">
          <div className="editor-top">
            <div className="editor-eyebrow">
              {isEditingExisting ? "Editing draft" : "New draft"}
            </div>
            <StatusPill state={saveState} />
          </div>

          <input
            className="title-input"
            placeholder="Untitled draft"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
          />

          <textarea
            className="content-area"
            placeholder="Start writing…"
            value={content}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setContent(e.target.value)
            }
            rows={10}
          />

          <div className="attachments-section">
            <div className="attachments-header">
              <label className="add-media-btn">
                <ImagePlus size={14} /> Add photos or video
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    handleFilesSelected(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {attachments.length > 0 && (
                <span className="attachments-count">
                  {attachments.length} file{attachments.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="attachments-grid">
                {attachments.map((a) => (
                  <div key={a.id} className="attachment-tile">
                    {a.status === "uploading" && (
                      <div className="attachment-loading">
                        <Loader2 size={16} className="spin" />
                      </div>
                    )}
                    {a.status === "error" && (
                      <div className="attachment-error">
                        <AlertCircle size={16} />
                      </div>
                    )}
                    {a.status === "ready" && a.type === "image" && a.url && (
                      <img
                        src={a.url}
                        alt={a.name}
                        title={a.name}
                        className="attachment-media"
                        onClick={() => setLightbox(a)}
                      />
                    )}
                    {a.status === "ready" && a.type === "video" && a.url && (
                      <video
                        src={a.url}
                        title={a.name}
                        className="attachment-media"
                        controls
                        preload="metadata"
                      />
                    )}
                    <button
                      className="attachment-remove"
                      onClick={() => removeAttachment(a.id)}
                      aria-label="Remove attachment"
                    >
                      <X size={11} />
                    </button>
                    <div className="attachment-name">
                      {a.name} · {formatSize(a.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="editor-footer">
            <div className="word-count draft-mono">
              {wc} word{wc === 1 ? "" : "s"}
            </div>
            <div className="btn-row">
              <button className="btn-secondary" onClick={handleNew}>
                Discard
              </button>
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={saveState === "saving"}
              >
                {saveState === "saving" ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Save size={14} />
                )}
                Save draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {lightbox && lightbox.url && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <img
            src={lightbox.url}
            alt={lightbox.name}
            className="lightbox-img"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
          <button
            className="lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
