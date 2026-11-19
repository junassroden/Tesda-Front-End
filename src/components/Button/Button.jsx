import { Link } from 'react-router-dom'

/** variant: 'primary' | 'secondary' | 'danger'. Pass `to` to render a router link. */
export default function Button({ variant = 'primary', to, type = 'button', className = '', children, ...props }) {
  const classes = `btn btn-${variant} ${className}`.trim()
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
