import Modal from '../../../design-system/components/Modal/Modal'
import Button from '../../../design-system/components/Button/Button'

export default function ArchiveModal({ employee, mode, onConfirm, onCancel, title: titleProp, body: bodyProp, confirmLabel: confirmLabelProp }) {
  const firstName = employee?.name?.split(' ')[0] ?? ''
  const isDelete  = mode === 'delete'

  const title = titleProp ?? (isDelete
    ? `Supprimer définitivement ${firstName} ?`
    : `Archiver ${firstName} ?`)

  const body = bodyProp ?? (isDelete
    ? `Tous ses shifts seront également supprimés. Cette action est irréversible.`
    : `Il n'apparaîtra plus dans le planning actif.`)

  const confirmLabel = confirmLabelProp ?? (isDelete ? 'Supprimer définitivement' : 'Archiver')

  return (
    <Modal onClose={onCancel}>
      <div className="modal-emp-form-title">{title}</div>
      <div className="archive-modal-body">{body}</div>

      <div className="modal-actions">
        <Button variant="default" style={{ flex: 1 }} onClick={onCancel}>Annuler</Button>
        <Button variant="danger" style={{ flex: 2 }} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
