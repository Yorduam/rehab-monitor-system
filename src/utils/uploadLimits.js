export const MAX_UPLOAD_MB = 30;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_REQUEST_MB = Math.max(50, Math.ceil((MAX_UPLOAD_MB * 4) / 3) + 10);
