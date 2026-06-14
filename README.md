# FIAP Hackaton Phase 5 Web

Frontend Next.js para upload de diagramas de arquitetura e visualizacao de analise STRIDE retornada pela API de threat modeling.

## Stack

- Next.js `16.2.9`
- React `19.2.4`
- Tailwind CSS `4`
- React Flow, Recharts, Framer Motion e Lucide React
- Build estatico com `output: "export"` em `next.config.ts`

## Requisitos

- Node.js compativel com Next.js 16
- npm
- API de threat modeling disponivel em `NEXT_PUBLIC_API_BASE_URL`

## Configuracao

Crie um arquivo `.env` ou `.env.local` na raiz:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Para chamar a API publicada:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.segatto.tec.br
```

Como essa variavel usa o prefixo `NEXT_PUBLIC_`, o valor e embutido no bundle do browser no build. Altere a variavel antes de rodar `npm run build` quando trocar de ambiente.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Se a porta estiver ocupada, o Next usara outra porta disponivel.

## CORS em desenvolvimento

O frontend chama diretamente:

```txt
${NEXT_PUBLIC_API_BASE_URL}/analyze
```

Quando o app local (`http://localhost:3000`) chama a API publicada (`https://api.segatto.tec.br`), o browser exige que a API permita esse origin via CORS.

Para testar localmente contra producao, a API precisa liberar, por exemplo:

```txt
http://localhost:3000
http://localhost:3001
https://segatto.tec.br
```

Como o projeto usa `output: "export"`, ele e publicado como site estatico. Portanto, nao ha Route Handler dinamico do Next em producao para atuar como proxy de API.

## Scripts

```bash
npm run dev     # servidor local
npm run lint    # ESLint
npm run build   # build estatico
npm run start   # next start, util apenas fora do modo export/hosting estatico
```

## Fluxo da aplicacao

1. O usuario envia um arquivo PNG, JPG, JPEG ou SVG.
2. O frontend cria um `FormData` com a chave `file`.
3. O arquivo e enviado para `POST /analyze`.
4. A resposta JSON alimenta o dashboard:
   - KPIs de arquitetura, risco e resumo de ameacas
   - Grafo de arquitetura
   - Security insights
   - Componentes detectados
   - Ameacas confirmadas e candidatas
   - Mitigacoes
   - Recomendacoes
   - JSON bruto e metricas

Em caso de erro da API, a aplicacao exibe a mensagem de erro e nao substitui o resultado por dados demonstrativos.

## Contrato da API usado pelo frontend

O frontend aceita o schema canonico atual da API:

```ts
type AnalysisResponse = {
  graph?: {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    relationships?: GraphEdge[];
    trust_boundaries?: TrustBoundary[];
  };
  threats?: Threat[];
  candidate_threats?: Threat[];
  threat_summary?: {
    confirmed?: number;
    candidate?: number;
    discarded?: number;
  };
  mitigations?: Mitigation[];
  recommendations?: Recommendation[];
  optional_recommendations?: Recommendation[];
  architecture_score?: number;
  risk_score?: number;
};
```

Campos importantes aceitos em nos:

- `label`, `name`
- `type` ou `node_type`
- `zone`, `trust_boundary` ou `trust_boundary_id`
- `confidence` ou `attributes.confidence`
- `attributes.semantic_enrichment.canonical_component`

Campos importantes aceitos em arestas:

- `source` ou `source_node_id`
- `target` ou `target_node_id`
- `label`, `protocol` ou `edge_type`

## Normalizacao de componentes

A tabela `Detected Components` usa:

- Nome: `label`, exceto quando o label e generico (`Service`, `Component`, `External`) e existe `attributes.semantic_enrichment.canonical_component`.
- Tipo: `type` ou `node_type`.
- Confianca: `confidence`, `attributes.confidence` ou campos de `semantic_enrichment`.
- Zona: nome da `trust_boundary` associada por `trust_boundary_id` ou por inclusao em `node_ids`.

Quando a confianca nao vem no JSON, a UI mostra `N/A` em vez de `0%`.

## Scores exibidos

A API pode retornar scores brutos:

- `architecture_score`
- `risk_score`

O dashboard exibe scores efetivos, ajustados por `candidate_threats`, para nao comunicar risco inexistente quando ha achados candidatos relevantes.

### Architecture Score efetivo

Parte de `architecture_score` e subtrai uma penalidade para cada candidate threat, ponderada por severidade e confianca.

### Risk Score efetivo

Parte de `risk_score` e soma a mesma contribuicao ponderada das candidate threats.

Pesos por severidade:

| Severidade | Peso |
| --- | ---: |
| critical | 40 |
| high | 30 |
| medium | 18 |
| low | 8 |
| desconhecida | 12 |

Para candidate threats sem confianca ou com confianca muito baixa, o frontend usa peso minimo de `0.5`. Exemplo:

```txt
architecture_score bruto = 100
risk_score bruto = 0
candidate threat high com confidence 0.38

penalidade = 30 * 0.5 = 15
Architecture Score efetivo = 85
Risk Score efetivo = 15
```

O `Raw JSON Viewer` continua exibindo o JSON original retornado pela API. O grafico `Score Metrics` usa os mesmos scores efetivos exibidos nos KPIs.

## Mitigacoes e recomendacoes

Mitigacoes podem vir em dois lugares:

- `mitigations`
- `threats[].mitigations` ou `candidate_threats[].mitigations`

A secao `Mitigations` agrega esses itens reais. Se nenhum item vier no JSON, mostra estado vazio.

Recomendacoes usam `recommendations`. Se o array vier vazio, a UI mostra estado vazio e nao injeta exemplos.

## Validacao antes de publicar

```bash
npm run lint
npm run build
```

O build gera arquivos estaticos no diretorio configurado em `next.config.ts`.

## Observacoes para manutencao

Este projeto usa Next.js 16 com APIs e convencoes que podem diferir de versoes anteriores. Antes de alterar codigo de framework, consulte os guias locais em:

```txt
node_modules/next/dist/docs/
```
