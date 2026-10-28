// Logo e fundo do restaurante (docs/api/FEATURE_LOGO_UPLOAD.md, T2 e T4).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBackgroundPayload } from "../../src/features/admin/restaurant-settings/lib/appearance-payload.ts";
import { getUploadErrorMessage } from "../../src/shared/messages/errors.ts";

test("aparência: com fundo de imagem o PUT não leva backgroundValue", () => {
  const payload = buildBackgroundPayload("image", "#112233");
  assert.deepEqual(payload, { backgroundType: "image" });
  assert.equal("backgroundValue" in payload, false);
});

test("aparência: com cor sólida o PUT leva a cor hexadecimal", () => {
  assert.deepEqual(buildBackgroundPayload("color", "#112233"), {
    backgroundType: "color",
    backgroundValue: "#112233",
  });
});

test("upload: códigos do back viram as mensagens do passo 7", () => {
  assert.equal(
    getUploadErrorMessage({ code: "MISSING_FILE", status: 400 }),
    "Selecione um arquivo.",
  );
  assert.equal(
    getUploadErrorMessage({ code: "INVALID_IMAGE_FORMAT", status: 400 }),
    "Formato de imagem não suportado (use PNG, JPG ou WEBP).",
  );
  assert.equal(
    getUploadErrorMessage({ code: "FILE_TOO_LARGE", status: 400 }),
    "Imagem maior que 2 MB.",
  );
});

test("upload: 413 (com ou sem code) é o limite de 2 MB", () => {
  assert.equal(
    getUploadErrorMessage({ code: "PAYLOAD_TOO_LARGE", status: 413 }),
    "Imagem maior que 2 MB.",
  );
  assert.equal(
    getUploadErrorMessage({ status: 413 }),
    "Imagem maior que 2 MB.",
  );
});

test("upload: código desconhecido usa o detail da API", () => {
  assert.equal(
    getUploadErrorMessage({
      code: "ALGO_NOVO",
      status: 400,
      detail: "Mensagem do back.",
    }),
    "Mensagem do back.",
  );
});
