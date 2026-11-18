'use client';

import {
  Network,
  Database,
  Leaf,
  Layers,
  FlaskConical,
  Activity,
  Target,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const NODE_DEFINITIONS = [
  {
    label: 'Plant_details',
    icon: <Leaf size={16} className="text-emerald-400" />,
    color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/30 text-emerald-300',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Core botanical taxonomic record (botanical name, family, vernacular names, habitat).',
    example: 'Ocimum tenuiflorum (Tulsi), Withania somnifera (Ashwagandha)',
  },
  {
    label: 'Plant_part',
    icon: <Layers size={16} className="text-lime-400" />,
    color: 'from-lime-500/10 to-emerald-500/5 border-lime-500/30 text-lime-300',
    badge: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
    description: 'Specific anatomical part of the plant used in medicinal formulations.',
    example: 'Leaves, Root, Bark, Seeds, Whole Plant',
  },
  {
    label: 'Phytochemicals',
    icon: <FlaskConical size={16} className="text-cyan-400" />,
    color: 'from-cyan-500/10 to-blue-500/5 border-cyan-500/30 text-cyan-300',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    description: 'Active biochemical molecules and secondary metabolites identified within plant parts.',
    example: 'Eugenol, Withaferin A, Curcumin, Ursolic Acid',
  },
  {
    label: 'Bioactivity',
    icon: <Activity size={16} className="text-amber-400" />,
    color: 'from-amber-500/10 to-orange-500/5 border-amber-500/30 text-amber-300',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Experimentally assayed pharmacological or biological effects (IC50, inhibition values).',
    example: 'Anti-inflammatory, Antioxidant, Immunomodulatory, Antimicrobial',
  },
  {
    label: 'Protein_Target',
    icon: <Target size={16} className="text-violet-400" />,
    color: 'from-violet-500/10 to-purple-500/5 border-violet-500/30 text-violet-300',
    badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    description: 'Human macromolecular protein or enzyme targeted by active phytochemicals.',
    example: 'COX-2 (PTGS2), NF-kB, Acetylcholinesterase (AChE)',
  },
  {
    label: 'Therapeutic_Uses',
    icon: <ShieldCheck size={16} className="text-rose-400" />,
    color: 'from-rose-500/10 to-pink-500/5 border-rose-500/30 text-rose-300',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Classical Ayurvedic indications and clinical therapeutic applications.',
    example: 'Kasa (Cough), Shwasa (Asthma), Jvara (Fever), Stress relief',
  },
  {
    label: 'Document',
    icon: <FileText size={16} className="text-neutral-400" />,
    color: 'from-neutral-500/10 to-neutral-500/5 border-neutral-500/30 text-neutral-300',
    badge: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
    description: 'Scientific publication, clinical trial, or pharmacological literature source.',
    example: 'PubMed research citations, monograph chapters, pharmacology papers',
  },
];

const RELATIONSHIPS = [
  { type: 'HAS_PART', from: 'Plant_details', to: 'Plant_part', desc: 'Links a botanical taxon to its medicinal parts' },
  { type: 'USED_FOR', from: 'Plant_details', to: 'Therapeutic_Uses', desc: 'Direct therapeutic indication from classical Ayurveda' },
  { type: 'CONTAINS', from: 'Plant_part', to: 'Phytochemicals', desc: 'Biochemical isolation of compounds from specific parts' },
  { type: 'HAS_BIOACTIVITY', from: 'Phytochemicals', to: 'Bioactivity', desc: 'Biological action demonstrated by a compound' },
  { type: 'MEASURED_ON', from: 'Bioactivity', to: 'Protein_Target', desc: 'Specific receptor/enzyme target for bioactivity' },
  { type: 'REPORTED_IN', from: 'Bioactivity', to: 'Document', desc: 'Scientific citation supporting the bioactivity' },
];

export default function SchemaPage() {
  return (
    <div className="flex flex-col h-full bg-[#0b0f14] text-neutral-200">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>Knowledge Graph</span>
          <ChevronRight size={13} className="text-neutral-600" />
          <span className="text-white font-medium">Schema</span>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
          <Database size={12} />
          <span>Graph Ontology</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col gap-10 max-w-5xl w-full mx-auto">
        {/* Title & Overview */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
            <Network size={14} />
            Ontology & Data Model
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Knowledge Graph Architecture
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
            The AI Assistant queries a connected property graph containing medicinal plants, their phytochemical constituents, molecular protein targets, and clinical therapeutic uses.
          </p>
        </div>

        {/* Nodes Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Graph Node Types (Entities)
            </h2>
            <span className="text-xs font-mono text-neutral-500">7 Primary Entity Labels</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {NODE_DEFINITIONS.map((node) => (
              <div
                key={node.label}
                className={`p-4 rounded-2xl bg-gradient-to-br ${node.color} border shadow-xs flex flex-col justify-between gap-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    {node.icon}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${node.badge}`}>
                    {node.label}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {node.description}
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono mt-1">
                    Ex: {node.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Relationships Flow Visualization */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Graph Relationships (Edges)
            </h2>
            <span className="text-xs font-mono text-neutral-500">6 Directed Relations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RELATIONSHIPS.map((rel) => (
              <div
                key={rel.type}
                className="p-4 rounded-xl bg-[#161b22] border border-white/[0.08] flex flex-col gap-2 hover:border-emerald-500/40 transition"
              >
                <div className="flex items-center gap-2 text-xs flex-wrap font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-neutral-200 font-medium">
                    ({rel.from})
                  </span>
                  <div className="flex items-center text-emerald-400 font-semibold gap-1">
                    <span className="text-[11px]">-[{rel.type}]-&gt;</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-neutral-200 font-medium">
                    ({rel.to})
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  {rel.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
