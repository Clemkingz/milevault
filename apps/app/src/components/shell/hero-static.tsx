import { imgUrl } from "../art";

/** Hero media outside a dialog (no close button) */
export function HeroMediaStatic({ k, err }: { k?: string; err?: boolean }) {
  return (
    <div className="hmedia">
      <img className="sky" src={imgUrl(err ? "BG-sunset2" : "sky")} alt="" />
      {k && <><img className="hil" src={imgUrl(k)} alt="" /><span className="knot" /></>}
    </div>
  );
}
