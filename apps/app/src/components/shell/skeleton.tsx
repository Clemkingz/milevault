/** Loading skeletons shaped like the real screens (shimmer via .sk) */
export function Sk({ w, h = 14, r, className, style }: { w?: number | string; h?: number; r?: number; className?: string; style?: React.CSSProperties }) {
  return <span className={`sk${className ? ` ${className}` : ""}`} style={{ display: "block", width: w ?? "100%", height: h, borderRadius: r, ...style }} />;
}

export function RowsSkeleton({ rows = 3, lead = 36 }: { rows?: number; lead?: number }) {
  return (
    <div className="card rows" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div className="row" key={i} style={{ height: 64 }}>
          <Sk w={lead} h={lead} r={lead > 40 ? 8 : 999} />
          <div className="tx" style={{ gap: 8 }}><Sk w="46%" h={12} /><Sk w="70%" h={10} /></div>
          <Sk w={84} h={12} />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="sk-wrap" aria-busy="true" aria-label="Loading dashboard">
      <div className="pt"><Sk w={140} h={24} /></div>
      <div className="card bal" style={{ gap: 16 }}>
        <Sk w={220} h={28} /><Sk w={260} h={12} />
        <div style={{ display: "flex", gap: 8 }}><Sk h={32} r={999} /><Sk h={32} r={999} /><Sk h={32} r={999} /></div>
        <div className="div" />
        <div style={{ display: "flex", gap: 2 }}><Sk h={56} r={16} /><Sk h={56} r={4} /><Sk h={56} r={16} /></div>
      </div>
      <div className="sh"><Sk w={150} h={16} /></div>
      <div className="agrid">{[0, 1, 2].map((i) => <div key={i} className="card pcard"><Sk w={56} h={44} r={8} /><div className="tx" style={{ gap: 8 }}><Sk w="70%" h={12} /><Sk w="50%" h={10} /></div></div>)}</div>
      <div className="sh"><Sk w={190} h={16} /></div>
      <RowsSkeleton rows={2} lead={50} />
    </div>
  );
}

export function ListSkeleton({ title = 120 }: { title?: number }) {
  return (
    <div className="sk-wrap" aria-busy="true" aria-label="Loading">
      <div className="pt"><Sk w={title} h={24} /></div>
      <Sk h={36} r={8} />
      <div style={{ display: "flex", gap: 8 }}>{[64, 88, 110, 92].map((w, i) => <Sk key={i} w={w} h={34} r={999} />)}</div>
      <RowsSkeleton rows={5} lead={50} />
    </div>
  );
}

export function AgreementSkeleton() {
  return (
    <div className="sk-wrap" aria-busy="true" aria-label="Loading">
      <Sk w={90} h={14} />
      <div className="ahead"><Sk w={260} h={28} /><Sk w={200} h={12} /></div>
      <RowsSkeleton rows={3} lead={40} />
      <div className="card fund"><Sk w={70} h={14} /><div style={{ display: "flex", gap: 32 }}><Sk w={120} h={36} /><Sk w={120} h={36} /><Sk w={120} h={36} /></div><Sk h={4} /></div>
      <div className="card next"><div className="top"><Sk w={48} h={48} r={12} /><div className="tx" style={{ gap: 8 }}><Sk w="60%" h={14} /><Sk w="90%" h={12} /></div></div></div>
    </div>
  );
}

/** Full-shell placeholder while the wallet session restores */
export function ShellSkeleton() {
  return (
    <div className="app" style={{ display: "flex" }}>
      <aside className="side" aria-hidden>
        <div className="top">
          <div className="user"><Sk w={32} h={32} r={999} /><div style={{ flex: 1, display: "grid", gap: 6 }}><Sk w="70%" h={12} /><Sk w="50%" h={10} /></div></div>
          <div className="nav">{[0, 1, 2, 3].map((i) => <Sk key={i} h={40} r={10} />)}</div>
        </div>
      </aside>
      <div className="main"><div className="scroll"><div className="col"><DashboardSkeleton /></div></div></div>
    </div>
  );
}
