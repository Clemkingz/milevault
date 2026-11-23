import type { Person, PersonKey } from "./types";

/** Demo cast from the design prototypes. Addresses are valid-format testnet public keys. */
export const PEOPLE: Record<PersonKey, Person> = {
  aryan: { key: "aryan", name: "Aryan Roy", first: "Aryan", addr: "GHBRPOIGF3CBFNOBM2O4RAK3VRJNVGFYGWWQC5HYFSXMECOSFOGYR7QX", img: "av-aryan", bg: "#FFE1E6" },
  kay: { key: "kay", name: "Kay Finley", first: "Kay", addr: "G5XKXWNREKPK5YROUDOCUZRENUN7Z5JQIPQ3ZXOI7FDHJK3EYY5QA4KD", img: "av-kay", bg: "#EFE6FF" },
  rhea: { key: "rhea", name: "Rhea Hull", first: "Rhea", addr: "GHRVHS3K5AQLGTMJXKAU7BHXTPDPFF7EII6KQ3NMTZX44HPOEVBOOJHL", bg: "#E1F1FF", fg: "#3B82C4" },
  abbas: { key: "abbas", name: "Abbas Ali", first: "Abbas", addr: "GAEDOECVEPR7NI6P62MGG3W325DGDZVGPMM4I3LR5PE4GDAFPK276ALI", bg: "#FFF1DC", fg: "#C9821C" },
  sophia: { key: "sophia", name: "Sophia Kent", first: "Sophia", addr: "GNZDKYAYQ5S37JMSNDDUDD6KDFLEEPZHPCF2UQNUPQZIT5UEA5GENKNT", bg: "#E3F7EA", fg: "#239A5A" },
};

export const ESCROW_CONTRACT = "CQIWEPXSK4TATGIQHGJRSNVNQ7QDF3RCAVIQK43AHEJCXJ3ICTXCWE2M";

/** Personas you can play in the demo (client journey / contributor journey). */
export const DEMO_PERSONAS: { key: PersonKey; role: string }[] = [
  { key: "aryan", role: "Client" },
  { key: "kay", role: "Contributor" },
];

export interface Profile {
  name?: string;
  /** Avatar as a small square data URL (resized client-side) */
  img?: string;
  updatedAt?: string;
}

/** Profile overrides are provided by the store (avoids a circular import). */
let profileSource: () => Partial<Record<PersonKey, Profile>> = () => ({});
export const registerProfileSource = (fn: typeof profileSource) => { profileSource = fn; };

/** A person with any saved profile (display name / photo) applied. Use this everywhere for display. */
export function getPerson(key: PersonKey): Person {
  const base = PEOPLE[key];
  const pr = profileSource()[key];
  if (!pr) return base;
  const name = pr.name?.trim() || base.name;
  return { ...base, name, first: name.split(/\s+/)[0] ?? name, img: pr.img ?? base.img, imgIsData: !!pr.img };
}

export const short = (addr: string) => `${addr.slice(0, 1)}…${addr.slice(-3)}`;
export const mid = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`;
export const personByAddr = (addr: string) => {
  const p = Object.values(PEOPLE).find((x) => x.addr === addr.trim());
  return p ? getPerson(p.key) : undefined;
};
