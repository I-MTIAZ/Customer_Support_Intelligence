import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  FileSpreadsheet,
  Info,
  Layers3,
  Menu,
  MessageSquareText,
  Moon,
  ShieldCheck,
  Sun,
  UploadCloud,
  X,
} from "lucide-react";

type Mode = "message" | "csv";
type CsvRow = Record<string, string>;
type Prediction = {
  cluster: number;
  topic_name: string;
  review_status: string;
  confidence: number;
};
const API_URL = import.meta.env.VITE_API_URL;

async function analyzeMessage(message: string): Promise<Prediction> {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.detail || `Analysis failed (HTTP ${response.status})`
    );
  }
  return await response.json();
}

const SAMPLE = "My mobile app keeps crashing when I try to log in.";
const MAX_BYTES = 2 * 1024 * 1024;

function Mark({ size = "normal" }: { size?: "normal" | "large" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-forest font-extrabold text-white dark:bg-sage dark:text-forest ${
        size === "large" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm"
      }`}
    >
      CSI<span className="ml-[2px] text-jade dark:text-slatejade">.</span>
    </div>
  );
}
const sectionLink =
  "text-sm font-semibold text-forest transition hover:text-jade dark:text-sage";

export default function App() {
  const [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false),
    [mode, setMode] = useState<Mode>("message"),
    [message, setMessage] = useState(""),
    [notice, setNotice] = useState("");
  const [prediction, setPrediction] = useState<Prediction | null>(null),
    [loading, setLoading] = useState(false),
    [batchResults, setBatchResults] = useState<Prediction[]>([]),
    [batchLoading, setBatchLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null),
    [rows, setRows] = useState<CsvRow[]>([]),
    [columns, setColumns] = useState<string[]>([]),
    [column, setColumn] = useState(""),
    [csvError, setCsvError] = useState("");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const selectedPreview = useMemo(() => rows.slice(0, 6), [rows]);
  function loadCsv(f: File | undefined) {
    if (!f) return;
    setCsvError("");
    setBatchResults([]);
    setFile(null);
    setRows([]);
    setColumns([]);
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Please choose a .csv file.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setCsvError("File exceeds the 2 MB preview limit.");
      return;
    }
    Papa.parse<CsvRow>(f, {
      header: true,
      skipEmptyLines: true,
      preview: 101,
      complete: (r) => {
        const fields = r.meta.fields ?? [];
        if (!fields.length) {
          setCsvError("The CSV needs a header row.");
          return;
        }
        const parsed = r.data.filter((x) =>
          Object.values(x).some((y) => String(y ?? "").trim())
        );
        setColumns(fields);
        setColumn(
          fields.find((x) =>
            /^(message|text|body|customer_message|processed_text)$/i.test(x)
          ) ?? fields[0]
        );
        setRows(parsed);
        setFile(f);
      },
      error: () => setCsvError("Unable to read the CSV file."),
    });
  }
  async function analyze() {
    if (!message.trim()) {
      setNotice("Enter a message before analyzing.");
      return;
    }
    setNotice("");
    setPrediction(null);
    setLoading(true);
    try {
      setPrediction(await analyzeMessage(message.trim()));
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  }
  async function analyzeCsv() {
    const messages = rows
      .map((row) => String(row[column] ?? "").trim())
      .filter(Boolean);
    if (!messages.length) {
      setCsvError("No messages found in selected column.");
      return;
    }
    setBatchResults([]);
    setCsvError("");
    setBatchLoading(true);
    try {
      const response = await fetch(`${API_URL}/predict-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : `Batch analysis failed (HTTP ${response.status})`
        );
      }
      const data = await response.json();
      setBatchResults(data.results);
    } catch (error) {
      setCsvError(
        error instanceof Error ? error.message : "Batch analysis failed."
      );
    } finally {
      setBatchLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden transition-colors duration-300">
      <header className="sticky top-0 z-30 border-b border-[#dfe6da] bg-[#f8f9f5]/95 backdrop-blur-lg dark:border-[#3c5141] dark:bg-[#19241d]/95">
        <div className="page-shell flex h-[78px] items-center justify-between gap-5">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <Mark />
            <span className="truncate text-[13px] font-extrabold tracking-tight sm:text-[15px]">
              Customer_Support_Intelligence
            </span>
          </a>
          <nav className="hidden items-center gap-7 md:flex">
            <a className={sectionLink} href="#workspace">
              Workspace
            </a>
            <a className={sectionLink} href="#method">
              Method
            </a>
            <a className={sectionLink} href="#findings">
              Findings
            </a>
            <a className={sectionLink} href="#limitations">
              Limitations
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((x) => !x)}
              className="quiet !rounded-full !p-3"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="quiet !rounded-full !p-3 md:hidden"
              onClick={() => setMenu((x) => !x)}
              aria-label="Open navigation"
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="page-shell flex flex-col gap-4 border-t border-[#dfe6da] py-5 md:hidden dark:border-[#3c5141]">
            {[
              ["Workspace", "#workspace"],
              ["Method", "#method"],
              ["Findings", "#findings"],
              ["Limitations", "#limitations"],
            ].map(([t, l]) => (
              <a
                onClick={() => setMenu(false)}
                className={sectionLink}
                href={l}
                key={t}
              >
                {t}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="top">
        <section className="page-shell grid gap-10 pb-14 pt-16 md:grid-cols-[1.15fr_.85fr] md:items-center md:pb-20 md:pt-24">
          <div>
            <p className="eyebrow mb-5">NLP RESEARCH / INTERACTIVE WORKSPACE</p>
            <h1 className="max-w-[720px] text-[clamp(2.7rem,6vw,5.7rem)] font-extrabold leading-[1.09]">
              Make sense of{" "}
              <span className="text-jade dark:text-sage">
                customer conversations.
              </span>
            </h1>
            <p className="muted mt-7 max-w-[580px] text-[17px] leading-8">
              An open, honest look at customer support signals using
              unsupervised machine learning. Explore individual messages or
              bring a CSV to the workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="action" href="#workspace">
                Explore workspace <ArrowUpRight size={17} />
              </a>
              <a className="quiet" href="#findings">
                See research findings <ArrowDownRight size={17} />
              </a>
            </div>
            <p className="muted mt-7 flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-jade" /> Connected to
              local inference API when backend is running
            </p>
          </div>
          <div className="relative flex min-h-[380px] flex-col justify-between overflow-hidden rounded-[38px] bg-sage p-7 text-forest sm:min-h-[450px] sm:p-10 dark:bg-[#334737] dark:text-[#edf1e9]">
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-[.2em]">
                TEXT → SIGNAL
              </span>
              <Layers3 size={25} />
            </div>
            <div className="absolute left-[17%] top-[25%] h-56 w-56 rounded-full border-[22px] border-jade/50 sm:h-72 sm:w-72 dark:border-jade/20" />
            <div className="absolute left-[35%] top-[15%] h-56 w-56 rounded-full border border-forest/20 sm:h-80 sm:w-80 dark:border-sage/30" />
            <div className="relative z-10 mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-forest text-5xl font-black text-sage shadow-2xl dark:bg-sage dark:text-forest">
              19<span className="ml-1 mt-8 text-xs">GMM</span>
            </div>
            <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
              <span className="rounded-2xl bg-white/65 px-4 py-3 text-sm font-bold text-forest dark:bg-[#202e24] dark:text-sage">
                Explore clusters <ArrowUpRight className="inline" size={14} />
              </span>
              <span className="max-w-[160px] text-right text-xs font-semibold leading-5">
                Interpretation before automation
              </span>
            </div>
          </div>
        </section>
        <section className="border-y border-[#dbe3d8] bg-[#ecf1e9] dark:border-[#3c5141] dark:bg-[#223127]">
          <div className="page-shell grid grid-cols-2 gap-y-7 py-8 md:grid-cols-4">
            {[
              ["1.5M+", "Messages explored"],
              ["19", "GMM components"],
              ["5,000", "Held-out messages"],
              ["07", "Research notebooks"],
            ].map(([n, l]) => (
              <div key={l} className="border-l-2 border-jade/60 pl-4">
                <div className="display text-[29px] font-extrabold">{n}</div>
                <div className="muted text-xs">{l}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="page-shell py-20" id="workspace">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">01 / WORKSPACE</p>
              <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">
                Your analysis space.
              </h2>
              <p className="muted mt-4 max-w-xl leading-7">
                Analyze a support message or up to 100 messages from a CSV using
                the saved model.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#e7eee3] px-4 py-2 text-xs font-bold text-forest dark:bg-[#304334] dark:text-sage">
              <span className="h-2 w-2 rounded-full bg-jade" /> Model-assisted
              exploration
            </div>
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_.7fr]">
            <div className="panel overflow-hidden">
              <div
                className="flex border-b border-[#d7ded5] dark:border-[#3b4f40]"
                role="tablist"
                aria-label="Analysis input mode"
              >
                <button
                  onClick={() => {
                    setMode("message");
                    setNotice("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-5 text-sm font-bold ${
                    mode === "message"
                      ? "border-b-[3px] border-jade text-forest dark:text-sage"
                      : "muted"
                  }`}
                  role="tab"
                  aria-selected={mode === "message"}
                >
                  <MessageSquareText size={17} /> Single message
                </button>
                <button
                  onClick={() => {
                    setMode("csv");
                    setNotice("");
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-5 text-sm font-bold ${
                    mode === "csv"
                      ? "border-b-[3px] border-jade text-forest dark:text-sage"
                      : "muted"
                  }`}
                  role="tab"
                  aria-selected={mode === "csv"}
                >
                  <FileSpreadsheet size={17} /> CSV upload
                </button>
              </div>
              {mode === "message" ? (
                <div className="p-6 sm:p-8">
                  <div className="mb-3 flex justify-between gap-3">
                    <label htmlFor="message" className="text-sm font-bold">
                      Customer message
                    </label>
                    <span className="muted text-xs">
                      {message.length} / 2,000
                    </span>
                  </div>
                  <textarea
                    className="field min-h-[192px] resize-y leading-7"
                    id="message"
                    maxLength={2000}
                    placeholder="Example: I cannot log in after the latest app update..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setNotice("");
                      setPrediction(null);
                    }}
                  />
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      className="quiet"
                      onClick={() => {
                        setMessage(SAMPLE);
                        setNotice("");
                        setPrediction(null);
                      }}
                    >
                      Use example
                    </button>
                    <button
                      className="action"
                      onClick={analyze}
                      disabled={loading || !message.trim()}
                    >
                      {loading ? "Analyzing..." : "Analyze message"}{" "}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                  {notice && (
                    <p
                      role="status"
                      className="mt-5 rounded-xl bg-sage/40 px-4 py-3 text-sm text-forest dark:bg-sage/15 dark:text-sage"
                    >
                      {notice}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6 sm:p-8">
                  <label
                    className="flex min-h-[204px] cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-jade/70 bg-[#f5f8f2] px-4 text-center transition hover:bg-sage/30 dark:bg-[#29392e]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      loadCsv(e.dataTransfer.files[0]);
                    }}
                  >
                    <UploadCloud
                      size={31}
                      className="mb-4 text-slatejade dark:text-sage"
                    />
                    <strong className="text-base">
                      Drop a CSV or choose a file
                    </strong>
                    <span className="muted mt-2 text-sm">
                      Max 2 MB · first 100 rows previewed
                    </span>
                    <input
                      className="sr-only"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => loadCsv(e.target.files?.[0])}
                    />
                  </label>
                  {csvError && (
                    <p
                      role="alert"
                      className="mt-3 text-sm text-red-600 dark:text-red-300"
                    >
                      {csvError}
                    </p>
                  )}
                  {file && (
                    <div className="mt-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {file.name}
                          </p>
                          <p className="muted text-xs">
                            {rows.length} rows parsed for preview
                          </p>
                        </div>
                        <button
                          className="quiet !px-4 !py-2"
                          onClick={() => {
                            setFile(null);
                            setRows([]);
                            setColumns([]);
                            setBatchResults([]);
                          }}
                        >
                          Remove <X size={14} />
                        </button>
                      </div>
                      <label
                        htmlFor="csv-column"
                        className="mb-2 block text-sm font-bold"
                      >
                        Message column
                      </label>
                      <div className="relative">
                        <select
                          id="csv-column"
                          className="field appearance-none"
                          value={column}
                          onChange={(e) => {
                            setColumn(e.target.value);
                            setBatchResults([]);
                          }}
                        >
                          {columns.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-4 top-4"
                          size={19}
                        />
                      </div>
                      <div className="mt-4 overflow-auto rounded-2xl border border-[#d7ded5] dark:border-[#3b4f40]">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-sage/40 dark:bg-[#304334]">
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">{column}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPreview.map((r, i) => (
                              <tr
                                key={i}
                                className="border-t border-[#d7ded5] dark:border-[#3b4f40]"
                              >
                                <td className="p-3 align-top">{i + 1}</td>
                                <td className="max-w-[380px] break-words p-3">
                                  {r[column]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        className="action mt-5"
                        onClick={analyzeCsv}
                        disabled={batchLoading || !rows.length}
                      >
                        {batchLoading ? "Analyzing..." : "Analyze CSV"}{" "}
                        <ArrowRight size={17} />
                      </button>
                      {batchResults.length > 0 && (
                        <div className="mt-6 overflow-x-auto">
                          <h3 className="mb-3 text-lg font-bold">
                            Results ({batchResults.length} messages)
                          </h3>
                          <table className="w-full text-left text-sm">
                            <thead className="bg-sage/40 dark:bg-[#304334]">
                              <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Cluster</th>
                                <th className="p-3">Provisional topic</th>
                                <th className="p-3">Probability</th>
                              </tr>
                            </thead>
                            <tbody>
                              {batchResults.map((result, index) => (
                                <tr
                                  key={index}
                                  className="border-t border-[#d7ded5] dark:border-[#3b4f40]"
                                >
                                  <td className="p-3">{index + 1}</td>
                                  <td className="p-3">{result.cluster}</td>
                                  <td className="p-3">{result.topic_name}</td>
                                  <td className="p-3">
                                    {(result.confidence * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="muted mt-3 text-xs">
                            Probability is GMM component membership, not
                            category accuracy.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="panel flex min-h-[384px] flex-col p-7 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow">OUTPUT / PREVIEW</span>
                <span className="rounded-full bg-sage/40 px-3 py-1.5 text-[11px] font-bold dark:bg-sage/15">
                  {loading
                    ? "Analyzing"
                    : prediction
                    ? "Result ready"
                    : "Awaiting result"}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center py-7">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage/35 dark:bg-sage/15">
                  <BarChart3 className="text-forest dark:text-sage" size={28} />
                </div>
                {prediction ? (
                  <>
                    <h3 className="text-2xl font-extrabold">
                      {prediction.topic_name}
                    </h3>
                    <p className="mt-2 font-semibold">
                      Cluster {prediction.cluster}
                    </p>
                    <p className="muted mt-3 text-sm">
                      {prediction.review_status}
                    </p>
                    <p className="mt-4 text-sm">
                      Assignment probability:{" "}
                      <strong>
                        {(prediction.confidence * 100).toFixed(2)}%
                      </strong>
                    </p>
                    <p className="muted mt-3 text-xs leading-6">
                      This probability is not classification accuracy. Topics
                      are provisional, not verified issue labels.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-extrabold">
                      {loading
                        ? "Analyzing message..."
                        : "Results will appear here."}
                    </h3>
                    <p className="muted mt-3 text-sm leading-7">
                      Send a message to the Python model to receive a GMM
                      component, probability and provisional topic.
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {["Cluster ID", "Probability", "Review status"].map((x) => (
                  <span
                    className="rounded-full border border-[#d7ded5] px-3 py-2 text-[11px] font-semibold dark:border-[#526454]"
                    key={x}
                  >
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="bg-[#eaf0e6] py-20 dark:bg-[#223127]" id="method">
          <div className="page-shell">
            <p className="eyebrow">02 / HOW IT WORKS</p>
            <h2 className="mb-10 mt-3 text-4xl font-extrabold sm:text-5xl">
              From text to patterns.
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                [
                  "01",
                  "Prepare",
                  "Clean input consistently with the research preprocessing.",
                ],
                [
                  "02",
                  "Represent",
                  "TF-IDF converts language into numerical features.",
                ],
                [
                  "03",
                  "Reduce",
                  "SVD compresses the features to 100 dimensions.",
                ],
                [
                  "04",
                  "Interpret",
                  "GMM assigns components; human review gives context.",
                ],
              ].map(([n, t, d]) => (
                <div
                  key={n}
                  className="rounded-[24px] border border-[#d1dbce] bg-[#f8f9f5] p-6 dark:border-[#3b4f40] dark:bg-[#29382d]"
                >
                  <div className="mb-14 flex justify-between">
                    <span className="eyebrow">{n}</span>
                    <ArrowUpRight size={17} />
                  </div>
                  <h3 className="text-xl font-extrabold">{t}</h3>
                  <p className="muted mt-3 text-sm leading-7">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="page-shell py-20" id="findings">
          <p className="eyebrow">03 / RESEARCH FINDINGS</p>
          <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            Transparent by design.
          </h2>
          <p className="muted mt-4 max-w-[700px] leading-7">
            The experiment revealed recognizable acknowledgment and
            app-discussion patterns. Most components still need topic review.
          </p>
          <div className="mt-9 grid gap-4 md:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[30px] bg-forest p-9 text-white dark:bg-[#344d39]">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-sage">
                Held-out cosine silhouette
              </p>
              <p className="display my-8 text-6xl font-extrabold sm:text-7xl">
                −0.0350
              </p>
              <p className="max-w-md text-sm leading-7 text-[#e6ebe2]">
                Weak cluster separation on 5,000 messages excluded from GMM
                training. Not a classification accuracy score.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[26px] bg-sage p-7 text-forest">
                <p className="display text-4xl font-extrabold">2 patterns</p>
                <p className="mt-3 text-sm leading-6">
                  Customer acknowledgments and app/functionality discussions
                  appeared promising in manual review.
                </p>
              </div>
              <div className="rounded-[26px] border border-[#d7ded5] p-7 dark:border-[#526454]">
                <p className="display text-4xl font-extrabold">16 / 19</p>
                <p className="muted mt-3 text-sm leading-6">
                  Components remain mixed or unclear and require further
                  interpretation.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="page-shell pb-24" id="limitations">
          <p className="eyebrow">04 / RESPONSIBLE USE</p>
          <h2 className="mt-3 text-4xl font-extrabold sm:text-5xl">
            Limits & improvements.
          </h2>
          <div className="mt-9 grid gap-5 md:grid-cols-2">
            <div className="panel p-8">
              <div className="mb-5 flex items-center gap-2 text-sm font-bold text-slatejade dark:text-sage">
                <Info size={19} /> CURRENT LIMITS
              </div>
              <h3 className="text-2xl font-extrabold">
                What the results cannot prove
              </h3>
              <p className="muted mt-4 text-sm leading-8">
                GMM was trained without issue labels. Negative silhouette scores
                reflect weak overall separation. High assignment probability
                does not indicate accuracy, and many topics lack clear
                interpretation.
              </p>
            </div>
            <div className="panel p-8">
              <div className="mb-5 flex items-center gap-2 text-sm font-bold text-slatejade dark:text-sage">
                <ShieldCheck size={19} /> FUTURE IMPROVEMENTS
              </div>
              <h3 className="text-2xl font-extrabold">
                A stronger next version
              </h3>
              <p className="muted mt-4 text-sm leading-8">
                Gather human-reviewed examples, handle multilingual messages
                explicitly, assess new communication channels, and validate the
                complete text-processing pipeline before real-world automation.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-sage py-16 text-forest dark:bg-[#344737] dark:text-[#ecf2e8]">
          <div className="page-shell flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em]">
                Customer_Support_Intelligence
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Made for exploration.
              </h2>
            </div>
            <a className="action dark:!bg-sage" href="#workspace">
              Back to workspace <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>
      <footer className="page-shell flex flex-wrap items-center justify-between gap-4 py-8 text-xs">
        <span className="font-bold">Customer_Support_Intelligence</span>
        <span className="muted">Unsupervised NLP research prototype</span>
        <a href="#top" className="flex items-center gap-2 font-semibold">
          Back to top <ArrowUpRight size={15} />
        </a>
      </footer>
    </div>
  );
}
