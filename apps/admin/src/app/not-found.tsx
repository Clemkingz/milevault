import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@milevault/ui";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="lp dl sys">
      <div className="lnav dl"><Logo /><span className="adm-chip">Operator console</span></div>
      <div className="dlwrap">
        <div className="dlcard mv-page">
          <div className="hmedia"><img className="sky" src="/admin/images/sky.webp" alt="" /><img className="hil" src="/admin/images/e-01.webp" alt="" /><span className="knot" /></div>
          <span className="sys-code">404</span>
          <h3>Nothing in this vault</h3>
          <p>That admin page doesn’t exist.</p>
          <Link className="btn pri h44" href="/overview"><span>Back to overview</span></Link>
        </div>
      </div>
    </div>
  );
}
