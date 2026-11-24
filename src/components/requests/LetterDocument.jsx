import { shortDate } from '../../utils/format.js'

/** A request letter written in the app, laid out as a formal letter (screen and print). */
export default function LetterDocument({ letter, centerName, centerAddress }) {
  const longDate = letter.letter_date
    ? new Date(`${letter.letter_date}T00:00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : shortDate(null)
  return (
    <article className="letter-doc" aria-label="Request letter">
      <header className="letter-head">
        <strong>{centerName || 'Learning center'}</strong>
        {centerAddress && <span>{centerAddress}</span>}
      </header>
      <p className="letter-date">{longDate}</p>
      <p className="letter-recipient pre-line">{letter.letter_recipient || 'Recipient not set'}</p>
      {letter.letter_subject && (
        <p className="letter-subject">
          <strong>Subject:</strong> {letter.letter_subject}
        </p>
      )}
      <div className="letter-body pre-line">{letter.letter_body || 'The letter body is empty.'}</div>
      <footer className="letter-sign">
        <p>Respectfully yours,</p>
        <strong>{letter.letter_signatory || 'Signatory not set'}</strong>
        {letter.letter_position && <span>{letter.letter_position}</span>}
      </footer>
    </article>
  )
}
