import { useEffect } from 'react'

/**
 * Fades elements with a `data-reveal` attribute up into view as they scroll in.
 * Uses IntersectionObserver (no scroll listeners). Optional `data-delay="120"` staggers items.
 */
export function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll('[data-reveal]')
    items.forEach((el) => {
      if (el.dataset.delay) el.style.setProperty('--delay', `${el.dataset.delay}ms`)
    })

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    items.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
