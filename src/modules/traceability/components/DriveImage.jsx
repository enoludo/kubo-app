import { extractFileId } from '../utils/traceabilityPhotos'

export default function DriveImage({ driveUrl, alt, className, onClick }) {
  const fileId = extractFileId(driveUrl)
  if (!fileId) return null

  return (
    <img
      src={`/api/drive-photo?id=${fileId}`}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  )
}
