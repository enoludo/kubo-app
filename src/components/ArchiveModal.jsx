export default function ArchiveModal({ employee, mode, onConfirm, onCancel }) {
  const firstName = employee.name.split(' ')[0]
  const isDelete  = mode === 'delete'

  const title = isDelete
    ? `Supprimer définitivement ${firstName} ?`
    : `Archiver ${firstName} ?`

  const body = isDelete
    ? `Tous ses shifts seront également supprimés. Cette action est irréversible.`
    : `Il n'apparaîtra plus dans le planning actif.`

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal-emp-form-title">{title}</div>
        <div className="archive-modal-body">{body}</div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>Annuler</button>
          {isDelete
            ? <button className="modal-delete" onClick={onConfirm}>Supprimer définitivement</button>
            : <button className="modal-archive-confirm" onClick={onConfirm}>Archiver</button>
          }
        </div>

      </div>
    </div>
  )
}
