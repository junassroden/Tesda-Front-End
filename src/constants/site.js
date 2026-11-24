// Public-site navigation and contact details, shared by the header, landing page, and footer.
// Check the contact values against the regional office's official channels before going live.

export const SERVICE_LINKS = ['Document archive', 'Supply requests', 'Training allowances', 'Programs and batches', 'Trainee records', 'Release ledger']

export const SITE_NAV = [
  { href: '#top', label: 'Home' },
  { href: '#about', label: 'About Us' },
  { href: '#services', label: 'Services', children: SERVICE_LINKS },
  { href: '#news', label: 'Updates' },
  { href: '#contact', label: 'Contact Us' },
]

export const CONTACT = {
  region: 'Region IV-B · MIMAROPA',
  email: 'contactcenter@tesda.gov.ph',
  phone: '(02) 8887-7777',
  phoneHref: 'tel:+63288877777',
  website: 'https://www.tesda.gov.ph',
  facebook: 'https://www.facebook.com/TESDAOfficial',
}

export const PROVINCES = ['Occidental Mindoro', 'Oriental Mindoro', 'Marinduque', 'Romblon', 'Palawan']
