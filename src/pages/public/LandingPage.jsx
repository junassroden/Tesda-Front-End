// Figma: Index page20 (Hero)
export default function LandingPage() {
  return (
    <main>
      <section className="hero">
        <div>
          <h1>TESDA NEXUS</h1>
          <p className="hero-tagline">
            CONNECTING
            <br />
            SERVICES.
            <br />
            EMPOWERING FUTURES.
          </p>
          <p className="hero-text">
            A centralized digital platform designed to streamline student services, organize resources, monitor allowance distribution, and secure important documents for a more efficient TESDA
            experience.
          </p>
        </div>
        <div className="ph" role="img" aria-label="Hero image placeholder" />
      </section>
      <section id="about" className="about">
        <h2>About Us</h2>
        <p className="hero-text" style={{ margin: '0 auto' }}>
          TESDA NEXUS connects the TESDA office and its learning centers: documents, inventory, programs and allowances in one place.
        </p>
      </section>
    </main>
  )
}
