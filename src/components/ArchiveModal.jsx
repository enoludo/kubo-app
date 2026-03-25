import Modal from '../design-system/components/Modal/Modal'

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
        <button className="btn-secondary modal-cancel" onClick={onCancel}>Annuler</button>
        {isDelete || titleProp
          ? <button className="btn-danger modal-delete" onClick={onConfirm}>{confirmLabel}</button>
          : <button className="modal-archive-confirm" onClick={onConfirm}>{confirmLabel}</button>
        }
      </div>
    </Modal>
  )
}
