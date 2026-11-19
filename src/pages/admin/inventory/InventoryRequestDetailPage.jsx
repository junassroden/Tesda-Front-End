import { useParams } from 'react-router-dom'
import Button from '../../../components/Button/Button.jsx'
import PageHeader from '../../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../../components/Workspace/Workspace.jsx'
import { ADMIN_SUBTITLE } from '../../../constants/navItems.js'
import { ROUTES } from '../../../constants/routes.js'

// Figma: Inventory Request Mesage 12
// Inventory requests have no backend yet, so this shows the layout with placeholder text.
export default function InventoryRequestDetailPage() {
  const { id } = useParams()
  return (
    <>
      <PageHeader title="Inventory Request" subtitle={ADMIN_SUBTITLE} />
      <Workspace back={ROUTES.ADMIN.INVENTORY_REQUESTS} sample flush>
        <div className="detail-head">
          <div>
            <h2>Request #{id}</h2>
            <p>The learning center&apos;s message about this request will appear here: the items, quantities, purpose and delivery details.</p>
          </div>
          <div className="workspace-actions">
            <Button disabled>Approve</Button>
            <Button className="btn-danger" disabled>
              Reject
            </Button>
          </div>
        </div>
        <div className="ph detail-media" role="img" aria-label="Request attachment placeholder" />
      </Workspace>
    </>
  )
}
