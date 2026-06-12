export type GraphNode = {
  id?: string;
  label?: string;
  name?: string;
  type?: string;
  confidence?: number;
  zone?: string;
  trust_boundary?: string;
  metadata?: Record<string, unknown>;
};

export type GraphEdge = {
  id?: string;
  source?: string;
  target?: string;
  label?: string;
  protocol?: string;
};

export type ArchitectureGraph = {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  relationships?: GraphEdge[];
  trust_boundaries?: Array<{ id?: string; name?: string; zone?: string }>;
};

export type Threat = {
  id?: string;
  title?: string;
  name?: string;
  category?: string;
  stride_category?: string;
  severity?: string;
  confidence?: number;
  candidate_reason?: string;
  reason?: string;
  evidence?: unknown;
  description?: string;
};

export type Mitigation = {
  id?: string;
  title?: string;
  description?: string;
  priority?: string;
  owner?: string;
  due_date?: string;
};

export type Recommendation = {
  id?: string;
  category?: string;
  description?: string;
  implementation_steps?: string[] | string;
  references?: string[] | string;
};

export type AnalysisResponse = {
  graph?: ArchitectureGraph;
  threats?: Threat[];
  candidate_threats?: Threat[];
  threat_summary?: {
    confirmed?: number;
    candidate?: number;
    discarded?: number;
    [key: string]: number | undefined;
  };
  mitigations?: Mitigation[];
  recommendations?: Recommendation[];
  architecture_score?: number;
  risk_score?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function analyzeArchitecture(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { accept: "application/json" },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Analysis failed with status ${response.status}`);
  }

  return response.json();
}

export const sampleAnalysis: AnalysisResponse = {
  graph: {
    nodes: [
      { id: "client", label: "Web Client", type: "external", confidence: 0.98, zone: "External Zone" },
      { id: "gateway", label: "API Gateway", type: "api_gateway", confidence: 0.96, zone: "Edge Zone" },
      { id: "service", label: "Threat API", type: "service", confidence: 0.93, zone: "Application Security Zone" },
      { id: "queue", label: "Async Queue", type: "queue", confidence: 0.82, zone: "Application Security Zone" },
      { id: "db", label: "Analysis Store", type: "database", confidence: 0.9, zone: "Application Security Zone" },
    ],
    edges: [
      { id: "e1", source: "client", target: "gateway", label: "HTTPS" },
      { id: "e2", source: "gateway", target: "service", label: "REST" },
      { id: "e3", source: "service", target: "queue", label: "events" },
      { id: "e4", source: "service", target: "db", label: "SQL" },
    ],
  },
  threats: [],
  candidate_threats: [
    {
      id: "ct-1",
      title: "Data crosses trust boundaries",
      stride_category: "Information Disclosure",
      severity: "medium",
      confidence: 0.38,
      candidate_reason: "High unknown count",
      evidence: { boundary: "External Zone -> Edge Zone", protocol: "HTTPS", source: "Web Client" },
    },
  ],
  threat_summary: { confirmed: 0, candidate: 1, discarded: 17 },
  mitigations: [
    {
      id: "m-1",
      title: "Validate gateway authentication policy",
      description: "Confirm every external route requires strong authentication, request validation, and rate limits.",
      priority: "High",
      owner: "AppSec",
      due_date: "Next sprint",
    },
    {
      id: "m-2",
      title: "Document trust-boundary controls",
      description: "Capture encryption, identity propagation, and logging expectations for each boundary crossing.",
      priority: "Medium",
      owner: "Security Architecture",
      due_date: "30 days",
    },
  ],
  recommendations: [
    {
      id: "r-1",
      category: "Identity",
      description: "Use short-lived service credentials and explicit workload identity for service-to-service calls.",
      implementation_steps: ["Map every caller identity", "Enforce audience-bound tokens", "Rotate secrets into a vault"],
      references: ["OWASP ASVS V2", "NIST SP 800-204A"],
    },
    {
      id: "r-2",
      category: "Observability",
      description: "Add audit events for security decisions and rejected requests at gateway and service layers.",
      implementation_steps: ["Define audit schema", "Attach correlation IDs", "Alert on anomalous denial spikes"],
      references: ["MITRE ATT&CK detection engineering"],
    },
  ],
  architecture_score: 86,
  risk_score: 24,
};
