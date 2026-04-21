import type { LandingSectionInstance } from "@/modules/landing/config/landing-sections";
import type {
  LandingPreviewBindings,
  LandingTextMap,
} from "@/modules/landing/types/landing-text";

export type LandingSectionComponentProps = {
  section: LandingSectionInstance;
  textMap: LandingTextMap;
} & LandingPreviewBindings;

