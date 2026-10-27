import type {
  BackgroundType,
  UpdateAppearanceRequest,
} from "@/shared/types/api";

// A imagem de fundo só muda pelo upload: com "image" o PUT mantém o arquivo atual,
// então a URL nunca é reenviada (docs/api/FEATURE_LOGO_UPLOAD.md, seção 3.6)
export function buildBackgroundPayload(
  backgroundType: BackgroundType,
  backgroundColor: string,
): Pick<UpdateAppearanceRequest, "backgroundType" | "backgroundValue"> {
  return backgroundType === "image"
    ? { backgroundType: "image" }
    : { backgroundType: "color", backgroundValue: backgroundColor };
}
