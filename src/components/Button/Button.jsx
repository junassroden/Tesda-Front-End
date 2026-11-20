import { Link } from 'react-router-dom'
import Icon from '../Icon/Icon.jsx'

/**
 * Pill button. variant: 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger'.
 * Pass `to` for a router link. `trailingIcon` puts an icon in its own circle on the right.
 */
export default function Button({ variant = 'primary', to, type = 'button', className = '', trailingIcon, children, ...props }) {
  const classes = ['btn', `btn-${variant}`, trailingIcon ? 'has-orb' : '', className].filter(Boolean).join(' ')
  const content = (
    <>
      {children}
      {trailingIcon && (
        <span className="btn-orb" aria-hidden="true">
          <Icon name={trailingIcon} size={16} />
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  )
}
