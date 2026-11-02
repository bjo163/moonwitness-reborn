import type { QlModelDefinition } from "ql_orm";
import { irAttachment } from "./ir_attachment.js";
import { irAttachmentUpload } from "./ir_attachment_upload.js";

export { irAttachment, irAttachmentUpload };

export const models: QlModelDefinition[] = [irAttachment, irAttachmentUpload];
