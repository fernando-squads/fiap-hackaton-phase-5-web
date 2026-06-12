"use client";

import "@xyflow/react/dist/style.css";

import { ChangeEvent, DragEvent, RefObject, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Braces,
  CheckCircle2,
  Clipboard,
  Download,
  Expand,
  FileImage,
  Gauge,
  Layers3,
  LockKeyhole,
  Network,
  Radar,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { analyzeArchitecture, AnalysisResponse, GraphNode, sampleAnalysis, Threat } from "@/lib/threat-modeling";
import { cn, formatBytes } from "@/lib/utils";

const loadingMessages = [
  "Detecting architecture components...",
  "Building graph model...",
  "Analyzing trust boundaries...",
  "Generating STRIDE threats...",
  "Calculating risk score...",
];

const nodePalette: Record<string, string> = {
  service: "#2563eb",
  api_gateway: "#8b5cf6",
  gateway: "#8b5cf6",
  database: "#f97316",
  external: "#ef4444",
  queue: "#06b6d4",
  kafka: "#06b6d4",
  rabbitmq: "#06b6d4",
  client: "#ef4444",
};

function scoreTone(score: number) {
  if (score >= 90) return "green";
  if (score >= 70) return "yellow";
  if (score >= 50) return "orange";
  return "red";
}

function posture(architectureScore: number, riskScore: number) {
  if (architectureScore >= 90 && riskScore <= 15) return "Excellent";
  if (architectureScore >= 75 && riskScore <= 35) return "Good";
  if (architectureScore >= 60 && riskScore <= 55) return "Moderate";
  if (architectureScore >= 45) return "Poor";
  return "Critical";
}

function percent(value?: number) {
  if (value === undefined) return 0;
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function getNodeLabel(node: GraphNode) {
  return node.label ?? node.name ?? node.id ?? "Component";
}

function normalizeList(value?: string[] | string) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function ThreatModelingApp() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function selectFile(nextFile?: File) {
    if (!nextFile) return;
    setFile(nextFile);
    setError(null);
    setAnalysis(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(nextFile));
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function runAnalysis() {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setProgress(8);
    setMessageIndex(0);

    const interval = window.setInterval(() => {
      setProgress((value) => Math.min(value + 9, 92));
      setMessageIndex((value) => (value + 1) % loadingMessages.length);
    }, 900);

    try {
      const result = await analyzeArchitecture(file);
      setAnalysis(result);
      setProgress(100);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to analyze this diagram.");
      setAnalysis(sampleAnalysis);
    } finally {
      window.clearInterval(interval);
      setTimeout(() => setIsLoading(false), 350);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1020] text-slate-100">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,212,255,0.12),transparent_28%),radial-gradient(circle_at_80%_5%,rgba(255,176,32,0.08),transparent_24%)]" />
      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <Header />
        <AnimatePresence mode="wait">
          {!analysis && !isLoading ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid min-h-[calc(100vh-128px)] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]"
            >
              <Hero />
              <UploadPanel
                file={file}
                preview={preview}
                inputRef={inputRef}
                isDragging={isDragging}
                onBrowse={() => inputRef.current?.click()}
                onInputChange={onInputChange}
                onDrop={onDrop}
                onDragState={setIsDragging}
                onAnalyze={runAnalysis}
                error={error}
              />
            </motion.div>
          ) : isLoading ? (
            <LoadingScreen progress={progress} message={loadingMessages[messageIndex]} />
          ) : analysis ? (
            <Dashboard analysis={analysis} onReset={() => setAnalysis(null)} error={error} />
          ) : null}
        </AnimatePresence>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10">
          <ShieldCheck className="h-5 w-5 text-cyan-200" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">STRIDE Command Center</p>
          <p className="text-xs text-slate-400">Threat modeling intelligence</p>
        </div>
      </div>
      <Badge tone="cyan">Dark mode first</Badge>
    </header>
  );
}

function Hero() {
  return (
    <div className="space-y-7">
      <Badge tone="cyan" className="gap-2">
        <Sparkles className="h-3.5 w-3.5" /> AI security analysis
      </Badge>
      <div className="space-y-5">
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
          AI-Powered STRIDE Threat Modeling
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Upload architecture diagrams and automatically generate security threats, mitigations and recommendations.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Graph intelligence", Network],
          ["Trust boundaries", Layers3],
          ["Risk scoring", Gauge],
        ].map(([label, Icon]) => (
          <div key={String(label)} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <Icon className="mb-3 h-5 w-5 text-cyan-200" />
            <p className="text-sm font-medium text-slate-200">{String(label)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadPanel({
  file,
  preview,
  inputRef,
  isDragging,
  onBrowse,
  onInputChange,
  onDrop,
  onDragState,
  onAnalyze,
  error,
}: {
  file: File | null;
  preview: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  isDragging: boolean;
  onBrowse: () => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragState: (state: boolean) => void;
  onAnalyze: () => void;
  error: string | null;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Architecture Diagram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className={cn(
            "flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/20 p-6 text-center transition",
            isDragging && "border-cyan-300 bg-cyan-300/10",
          )}
          onClick={onBrowse}
          onDragOver={(event) => {
            event.preventDefault();
            onDragState(true);
          }}
          onDragLeave={() => onDragState(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload architecture diagram"
        >
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
            onChange={onInputChange}
          />
          {preview ? (
            <div className="w-full space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected architecture diagram preview" className="mx-auto max-h-64 rounded-lg object-contain" />
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left">
                <p className="font-medium text-white">{file?.name}</p>
                <p className="mt-1 text-sm text-slate-400">{formatBytes(file?.size ?? 0)}</p>
              </div>
            </div>
          ) : (
            <>
              <UploadCloud className="mb-4 h-12 w-12 text-cyan-200" />
              <p className="text-lg font-semibold text-white">Drop a diagram here</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">PNG, JPG, JPEG, or SVG architecture images are accepted.</p>
            </>
          )}
        </div>
        {error ? <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{error}</p> : null}
        <Button className="w-full" disabled={!file} onClick={onAnalyze}>
          <Radar className="h-4 w-4" /> Analyze Architecture
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingScreen({ progress, message }: { progress: number; message: string }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="grid min-h-[calc(100vh-128px)] place-items-center"
    >
      <Card className="w-full max-w-2xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 animate-spin items-center justify-center rounded-full border border-cyan-300/20 border-t-cyan-300">
          <ShieldAlert className="h-8 w-8 text-cyan-200" />
        </div>
        <h2 className="text-2xl font-semibold text-white">Analyzing attack surface</h2>
        <p className="mt-3 text-slate-300">{message}</p>
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full bg-cyan-300" animate={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-400">{progress}% complete</p>
      </Card>
    </motion.div>
  );
}

function Dashboard({ analysis, onReset, error }: { analysis: AnalysisResponse; onReset: () => void; error: string | null }) {
  const architectureScore = analysis.architecture_score ?? 0;
  const riskScore = analysis.risk_score ?? 0;
  const threatSummary = analysis.threat_summary ?? {};

  return (
    <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-semibold text-white">Executive Dashboard</h1>
          <p className="mt-2 text-slate-400">Commercial-grade view of STRIDE findings, architecture posture, and analyst evidence.</p>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <FileImage className="h-4 w-4" /> New Analysis
        </Button>
      </div>
      {error ? <p className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">Live API unavailable, showing representative dashboard data. {error}</p> : null}
      <KpiGrid architectureScore={architectureScore} riskScore={riskScore} threatSummary={threatSummary} />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <ArchitectureGraph graph={analysis.graph} />
        <SecurityInsights analysis={analysis} postureLabel={posture(architectureScore, riskScore)} />
      </div>
      <DetectedComponents nodes={analysis.graph?.nodes ?? []} />
      <ThreatTabs threats={analysis.threats ?? []} candidates={analysis.candidate_threats ?? []} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Mitigations items={analysis.mitigations ?? []} />
        <Recommendations items={analysis.recommendations ?? []} />
      </div>
      <RawJson analysis={analysis} />
    </motion.div>
  );
}

function KpiGrid({ architectureScore, riskScore, threatSummary }: { architectureScore: number; riskScore: number; threatSummary: AnalysisResponse["threat_summary"] }) {
  const summaryData = [
    { name: "Confirmed", value: threatSummary?.confirmed ?? 0, color: "#FF4D4F" },
    { name: "Candidate", value: threatSummary?.candidate ?? 0, color: "#FFB020" },
    { name: "Discarded", value: threatSummary?.discarded ?? 0, color: "#00E676" },
  ];
  const tone = scoreTone(architectureScore);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={ShieldCheck} title="Architecture Score" value={`${architectureScore} / 100`} tone={tone} subtitle="Security design quality" />
      <KpiCard icon={AlertTriangle} title="Risk Score" value={String(riskScore)} tone={riskScore > 60 ? "red" : riskScore > 30 ? "orange" : "green"} subtitle={riskScore > 60 ? "High severity" : riskScore > 30 ? "Elevated" : "Low exposure"} />
      <Card>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400">Threat Summary</p>
              <div className="mt-3 flex gap-3">
                {summaryData.map((item) => (
                  <div key={item.name}>
                    <p className="text-2xl font-semibold text-white">{item.value}</p>
                    <p className="text-xs text-slate-400">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-20 w-20">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={summaryData} dataKey="value" innerRadius={22} outerRadius={36} stroke="none">
                    {summaryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      <KpiCard icon={Activity} title="Security Posture" value={posture(architectureScore, riskScore)} tone={scoreTone(architectureScore)} subtitle="Based on risk and score" />
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, subtitle, tone }: { icon: typeof ShieldCheck; title: string; value: string; subtitle: string; tone: string }) {
  return (
    <Card className="transition hover:-translate-y-1 hover:border-cyan-300/30">
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className={cn("mt-3 text-3xl font-semibold", tone === "green" && "text-[#00E676]", tone === "yellow" && "text-[#FFB020]", tone === "orange" && "text-orange-300", tone === "red" && "text-[#FF4D4F]")}>{value}</p>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <Icon className="h-5 w-5 text-cyan-200" />
        </div>
      </CardContent>
    </Card>
  );
}

function ArchitectureGraph({ graph }: { graph?: AnalysisResponse["graph"] }) {
  const initial = useMemo(() => {
    const nodes = graph?.nodes?.length ? graph.nodes : sampleAnalysis.graph?.nodes ?? [];
    const edges = graph?.edges ?? graph?.relationships ?? sampleAnalysis.graph?.edges ?? [];
    return {
      nodes: nodes.map((node, index): Node => ({
        id: node.id ?? `node-${index}`,
        position: { x: 70 + (index % 3) * 230, y: 80 + Math.floor(index / 3) * 150 },
        data: { label: `${getNodeLabel(node)}\n${node.zone ?? "Unknown Zone"}` },
        style: {
          background: nodePalette[(node.type ?? "").toLowerCase()] ?? "#334155",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "white",
          borderRadius: 8,
          minWidth: 150,
          whiteSpace: "pre-line",
          fontSize: 12,
        },
      })),
      edges: edges.map((edge, index): Edge => ({
        id: edge.id ?? `edge-${index}`,
        source: edge.source ?? "",
        target: edge.target ?? "",
        label: edge.label ?? edge.protocol,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#00D4FF" },
        style: { stroke: "#00D4FF" },
      })).filter((edge) => edge.source && edge.target),
    };
  }, [graph]);
  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Architecture Visualization</CardTitle>
        <Button variant="ghost" size="icon" aria-label="Fullscreen graph">
          <Expand className="h-4 w-4" />
        </Button>
      </CardHeader>
      <div className="h-[460px]">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView proOptions={{ hideAttribution: true }}>
          <Background color="rgba(148,163,184,0.18)" />
          <MiniMap nodeColor={(node) => String(node.style?.background ?? "#334155")} />
          <Controls />
        </ReactFlow>
      </div>
    </Card>
  );
}

function SecurityInsights({ analysis, postureLabel }: { analysis: AnalysisResponse; postureLabel: string }) {
  const observations = [
    analysis.threats?.length ? `${analysis.threats.length} confirmed threats require triage.` : "No critical confirmed threats detected.",
    "The architecture contains trust-boundary crossings that may require further validation.",
    analysis.candidate_threats?.length ? "Threat confidence is currently insufficient to classify every finding as confirmed." : "Candidate backlog is clear for this analysis run.",
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-sm text-cyan-100">Security posture</p>
          <p className="mt-2 text-3xl font-semibold text-white">{postureLabel}</p>
        </div>
        {observations.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
            <p className="text-sm leading-6 text-slate-300">{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DetectedComponents({ nodes }: { nodes: GraphNode[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Components</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-white/10">
              <th className="py-3 font-medium">Component</th>
              <th className="py-3 font-medium">Type</th>
              <th className="py-3 font-medium">Confidence</th>
              <th className="py-3 font-medium">Zone</th>
            </tr>
          </thead>
          <tbody>
            {(nodes.length ? nodes : sampleAnalysis.graph?.nodes ?? []).map((node, index) => (
              <tr key={node.id ?? index} className="border-b border-white/5">
                <td className="py-4 font-medium text-white">{getNodeLabel(node)}</td>
                <td className="py-4"><Badge tone="purple">{node.type ?? "unknown"}</Badge></td>
                <td className="py-4 text-slate-300">{percent(node.confidence)}%</td>
                <td className="py-4 text-slate-300">{node.zone ?? node.trust_boundary ?? "Unknown Zone"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ThreatTabs({ threats, candidates }: { threats: Threat[]; candidates: Threat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          tabs={[
            {
              value: "confirmed",
              label: `Confirmed Threats (${threats.length})`,
              content: threats.length ? <ThreatCards threats={threats} /> : <EmptySuccess />,
            },
            {
              value: "candidates",
              label: `Candidate Threats (${candidates.length})`,
              content: <ThreatCards threats={candidates.length ? candidates : sampleAnalysis.candidate_threats ?? []} />,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function EmptySuccess() {
  return (
    <div className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-5">
      <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-300" />
      <p className="font-semibold text-emerald-100">No confirmed threats detected.</p>
      <p className="mt-1 text-sm text-emerald-100/75">Continue validating candidate findings and trust-boundary assumptions.</p>
    </div>
  );
}

function ThreatCards({ threats }: { threats: Threat[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {threats.map((threat, index) => (
        <details key={threat.id ?? index} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 open:border-cyan-300/30">
          <summary className="cursor-pointer list-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{threat.title ?? threat.name ?? "Potential STRIDE threat"}</p>
                <p className="mt-2 text-sm text-slate-400">{threat.description ?? threat.candidate_reason ?? threat.reason ?? "Review evidence for validation."}</p>
              </div>
              <Badge tone={threat.severity?.toLowerCase() === "critical" ? "red" : "yellow"}>{threat.severity ?? "candidate"}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="cyan">{threat.stride_category ?? threat.category ?? "STRIDE"}</Badge>
              <Badge tone="slate">{percent(threat.confidence)}% confidence</Badge>
            </div>
          </summary>
          <pre className="mt-4 max-h-56 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(threat.evidence ?? threat, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}

function Mitigations({ items }: { items: AnalysisResponse["mitigations"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mitigations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(items?.length ? items : sampleAnalysis.mitigations ?? []).map((item) => (
          <div key={item.id ?? item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-white">{item.title}</p>
              <Badge tone={item.priority?.toLowerCase() === "high" ? "red" : "yellow"}>{item.priority ?? "Medium"}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              <span>Owner: {item.owner ?? "Security"}</span>
              <span>Due: {item.due_date ?? "TBD"}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Recommendations({ items }: { items: AnalysisResponse["recommendations"] }) {
  const grouped = (items?.length ? items : sampleAnalysis.recommendations ?? []).reduce<Record<string, NonNullable<AnalysisResponse["recommendations"]>>>((acc, item) => {
    const category = item.category ?? "General";
    acc[category] = [...(acc[category] ?? []), item];
    return acc;
  }, {});
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {Object.entries(grouped).map(([category, recs]) => (
          <section key={category}>
            <Badge tone="cyan">{category}</Badge>
            <div className="mt-3 space-y-3">
              {recs.map((rec) => (
                <div key={rec.id ?? rec.description} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm leading-6 text-slate-200">{rec.description}</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-400">
                    {normalizeList(rec.implementation_steps).map((step) => <li key={step}>{step}</li>)}
                  </ul>
                  <p className="mt-3 text-xs text-slate-500">{normalizeList(rec.references).join(" | ")}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

function RawJson({ analysis }: { analysis: AnalysisResponse }) {
  const json = JSON.stringify(analysis, null, 2);
  function download() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "stride-analysis.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Advanced</CardTitle>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(json)}>
            <Clipboard className="h-4 w-4" /> Copy
          </Button>
          <Button variant="secondary" size="sm" onClick={download}>
            <Download className="h-4 w-4" /> JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          tabs={[
            {
              value: "json",
              label: "Raw JSON Viewer",
              content: (
                <pre className="max-h-[520px] overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs leading-5 text-cyan-50">
                  <code><Braces className="mb-3 inline h-4 w-4 text-cyan-200" /> {json}</code>
                </pre>
              ),
            },
            {
              value: "metrics",
              label: "Score Metrics",
              content: (
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={[{ name: "Architecture", value: analysis.architecture_score ?? 0 }, { name: "Risk", value: analysis.risk_score ?? 0 }]}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#131A2A", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#00D4FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}
