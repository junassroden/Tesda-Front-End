import PageHeader from '../../components/PageHeader/PageHeader.jsx'
import Workspace from '../../components/Workspace/Workspace.jsx'
import { LEARNING_CENTER_SUBTITLE } from '../../constants/navItems.js'

// Sidebar item with no Figma screen yet.
export default function DeliveryPersonnelPage() {
  return (
    <>
      <PageHeader title="Delivery Personnel" subtitle={LEARNING_CENTER_SUBTITLE} />
      <Workspace title="Delivery Personnel" description="This page has no design yet.">
        <div className="ph detail-media" style={{ margin: 0 }} role="img" aria-label="Placeholder" />
      </Workspace>
    </>
  )
}
