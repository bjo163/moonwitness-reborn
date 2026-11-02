export class AttachmentError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "AttachmentError";
  }
}

export class PayloadTooLargeError extends AttachmentError {
  constructor(message = "The uploaded payload exceeds the allowed size.") {
    super(message, 413, "ATTACHMENT_TOO_LARGE");
    this.name = "PayloadTooLargeError";
  }
}

export class MediaTypeRejectedError extends AttachmentError {
  constructor(message = "The media type of this attachment is not allowed.") {
    super(message, 415, "ATTACHMENT_MEDIA_TYPE_REJECTED");
    this.name = "MediaTypeRejectedError";
  }
}

export class UploadStateError extends AttachmentError {
  constructor(message = "The upload session no longer accepts changes.") {
    super(message, 409, "ATTACHMENT_UPLOAD_STATE");
    this.name = "UploadStateError";
  }
}

export class UploadExpiredError extends AttachmentError {
  constructor(message = "The upload session has expired.") {
    super(message, 409, "ATTACHMENT_UPLOAD_EXPIRED");
    this.name = "UploadExpiredError";
  }
}

export class IntegrityError extends AttachmentError {
  constructor(message = "The assembled attachment did not match its declared size or digest.") {
    super(message, 409, "ATTACHMENT_INTEGRITY");
    this.name = "IntegrityError";
  }
}

export class QuotaReachedError extends AttachmentError {
  constructor(message = "The attachment storage quota for this account is reached.") {
    super(message, 507, "ATTACHMENT_QUOTA_REACHED");
    this.name = "QuotaReachedError";
  }
}

export class StorageUnavailableError extends AttachmentError {
  constructor(message = "Attachment storage is low on free space; try again later.") {
    super(message, 503, "ATTACHMENT_STORAGE_UNAVAILABLE");
    this.name = "StorageUnavailableError";
  }
}
