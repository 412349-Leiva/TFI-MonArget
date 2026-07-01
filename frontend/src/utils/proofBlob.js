const DEFAULT_PROOF_TYPE = 'application/pdf';

export const resolveProofContentType = (headers, fallbackType) => {
  const headerType = headers?.['content-type'] || headers?.['Content-Type'];
  if (headerType) {
    return headerType.split(';')[0].trim();
  }
  if (fallbackType) {
    return fallbackType.split(';')[0].trim();
  }
  return DEFAULT_PROOF_TYPE;
};

export const openProofBlob = (data, contentType) => {
  const type = contentType || DEFAULT_PROOF_TYPE;
  const blob = data instanceof Blob && data.type
    ? data
    : new Blob([data], { type });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};
