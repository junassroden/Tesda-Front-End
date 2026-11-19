import { useParams } from 'react-router-dom'
import Breadcrumb from '../../../components/Breadcrumb/Breadcrumb.jsx'
import Button from '../../../components/Button/Button.jsx'
import TextArea from '../../../components/form/TextArea.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import { ROUTES } from '../../../constants/routes.js'

// Figma: Inventory Request Mesage 12
// Inventory requests have no backend yet, so approve/reject are disabled.
export default function InventoryRequestDetailPage() {
  const { id } = useParams()
  return (
    <>
      <Breadcrumb items={[{ label: 'Resource Requests', to: ROUTES.ADMIN.INVENTORY_REQUESTS }, { label: `Request #${id}` }]} />
      <PageHeader title={`Request #${id}`} />
      <section className="panel">
        <h2>Message</h2>
        <TextArea id="reply" label="Reply to the learning center" disabled />
        <div className="form-actions">
          <Button disabled>Approve</Button>
          <Button variant="danger" disabled>
            Reject
          </Button>
        </div>
        <p className="notice">Inventory requests are not available yet.</p>
      </section>
    </>
  )
}
