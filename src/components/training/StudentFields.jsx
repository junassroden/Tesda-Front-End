import TextInput from '../form/TextInput.jsx'
import { CIVIL_STATUSES } from '../../utils/training.js'

/** Student profile fields for creating or editing a record. form/set as in BatchFields. */
export default function StudentFields({ form, set, withPassword = false }) {
  const field = (key) => ({ value: form[key] ?? '', onChange: (e) => set(key, e.target.value) })
  return (
    <>
      <fieldset className="form-group">
        <legend>Name</legend>
        <div className="form-row three">
          <TextInput id="first_name" label="First name" required maxLength={80} {...field('first_name')} />
          <TextInput id="middle_name" label="Middle name" maxLength={80} {...field('middle_name')} />
          <TextInput id="last_name" label="Last name" required maxLength={80} {...field('last_name')} />
        </div>
      </fieldset>
      <fieldset className="form-group">
        <legend>Personal details</legend>
        <div className="form-row three">
          <TextInput id="birthdate" label="Birthdate" type="date" {...field('birthdate')} />
          <label className="field" htmlFor="sex">
            <span>Sex</span>
            <select id="sex" {...field('sex')}>
              <option value="">Not set</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="field" htmlFor="civil_status">
            <span>Civil status</span>
            <select id="civil_status" {...field('civil_status')}>
              <option value="">Not set</option>
              {CIVIL_STATUSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="field-hint">Married students also submit a marriage contract.</p>
        <TextInput id="highest_education" label="Highest educational attainment" maxLength={100} placeholder="e.g. High school graduate" {...field('highest_education')} />
        <TextInput id="address" label="Address" maxLength={255} {...field('address')} />
      </fieldset>
      <fieldset className="form-group">
        <legend>Contact</legend>
        <div className="form-row even">
          <TextInput id="email" label="Email" type="email" required maxLength={255} {...field('email')} />
          <TextInput id="contact_number" label="Contact number" type="tel" maxLength={30} {...field('contact_number')} />
        </div>
        <div className="form-row even">
          <TextInput id="guardian_name" label="Guardian or emergency contact" maxLength={150} {...field('guardian_name')} />
          <TextInput id="guardian_contact" label="Their contact number" type="tel" maxLength={30} {...field('guardian_contact')} />
        </div>
      </fieldset>
      {withPassword && (
        <fieldset className="form-group">
          <legend>Portal login</legend>
          <TextInput id="password" label="Initial password" type="text" required minLength={8} maxLength={72} autoComplete="new-password" {...field('password')} />
          <p className="field-hint">At least 8 characters. Give it to the student; they sign in with their email.</p>
        </fieldset>
      )}
    </>
  )
}
