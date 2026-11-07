import type { TranslationSchema } from "../types";

// Indic / South Asian
import { en } from "./en";
import { hi } from "./hi";
import { ml } from "./ml";
import { ta } from "./ta";
import { te } from "./te";
import { kn } from "./kn";
import { bn } from "./bn";
import { pa } from "./pa";
import { mr } from "./mr";
import { gu } from "./gu";
import { or } from "./or";
import { as } from "./as";
import { ur } from "./ur";
import { ne } from "./ne";
import { si } from "./si";

// European
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";
import { it } from "./it";
import { pt } from "./pt";
import { nl } from "./nl";
import { ru } from "./ru";
import { pl } from "./pl";
import { uk } from "./uk";
import { tr } from "./tr";

// Middle Eastern / RTL
import { ar } from "./ar";
import { he } from "./he";
import { fa } from "./fa";

// East & Southeast Asian
import { zhCN } from "./zh-CN";
import { zhTW } from "./zh-TW";
import { ja } from "./ja";
import { ko } from "./ko";
import { th } from "./th";
import { vi } from "./vi";
import { id } from "./id";
import { ms } from "./ms";

// African
import { sw } from "./sw";

export const translations: Record<string, TranslationSchema> = {
  en,
  hi,
  ml,
  ta,
  te,
  kn,
  bn,
  pa,
  mr,
  gu,
  or,
  as,
  ur,
  ne,
  si,
  es,
  fr,
  de,
  it,
  pt,
  nl,
  ru,
  pl,
  uk,
  tr,
  ar,
  he,
  fa,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ja,
  ko,
  th,
  vi,
  id,
  ms,
  sw,
};
