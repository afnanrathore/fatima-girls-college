import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { isBsProgram } from '../api';
import { useSettings } from '../context/SettingsContext';
import { withoutDigits } from '../utils/nameInput';
import { FieldError, clearFieldError, emailError, requiredError } from '../components/FieldError';

const STEPS = ['Personal', 'Family', 'Academic', 'Documents'];

const empty = {
  full_name: '', date_of_birth: '', id_document_type: 'cnic', cnic: '', gender: 'Female',
  religion: 'Islam', religion_other: '', nationality: 'Pakistani', email: '', phone: '', address: '',
  province: '', domicile_district: '', district: '', tehsil: '',
  father_name: '', father_cnic: '', father_occupation: '', father_phone: '',
  mother_name: '', mother_occupation: '',
  previous_school: '', board: 'BISE Faisalabad', board_other: '', grade: 'Matric', grade_other: '',
  marks_obtained: '', total_marks: '', program_id: '', declaration: false,
};

export default function Apply() {
  const { college, admissionsOpen, districts, tehsils, loading } = useSettings();
  const [programs, setPrograms] = useState([]);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/apply/meta').then((r) => setPrograms(r.data.programs || []));
  }, []);

  const program = programs.find((p) => p._id === form.program_id);
  const bs = isBsProgram(program);
  const provinceDistricts = districts[form.province] || [];
  const tehsilOptions = tehsils[form.district] || tehsils[form.domicile_district] || [];

  const percentage = useMemo(() => {
    const m = Number(form.marks_obtained);
    const t = Number(form.total_marks);
    if (!t || !(m >= 0) || !(t > m)) return null;
    return Math.round((m / t) * 10000) / 100;
  }, [form.marks_obtained, form.total_marks]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => clearFieldError(e, k));
  };

  const lettersOnly = (e) => {
    const cleaned = withoutDigits(e.target.value);
    set(e.target.name, cleaned);
  };

  const invalid = (key) => (fieldErrors[key] ? 'is-invalid' : '');

  if (loading) return null;
  if (!admissionsOpen) {
    return (
      <>
        <section className="page-hero"><div className="hero-content"><h1>Admissions Closed</h1><p>Online applications are not being accepted right now.</p></div></section>
        <section className="form-page"><div className="container"><div className="application-card card"><p>Please check the admissions page for updates.</p><Link className="btn btn-primary" to="/admission">Admissions Info</Link></div></div></section>
      </>
    );
  }

  const validateStep = async () => {
    setError('');
    const errors = {};

    if (step === 0) {
      errors.full_name = requiredError(form.full_name, 'Full name');
      errors.date_of_birth = requiredError(form.date_of_birth, 'Date of birth');
      errors.cnic = requiredError(form.cnic, 'CNIC / B-Form');
      errors.email = emailError(form.email);
      errors.phone = requiredError(form.phone, 'Phone');
      errors.address = requiredError(form.address, 'Address');
      if (form.religion === 'Other') errors.religion_other = requiredError(form.religion_other, 'Religion');

      const hasEmpty = Object.values(errors).some(Boolean);
      if (!hasEmpty) {
        const [{ data: idCheck }, { data: emailCheck }, { data: phoneCheck }] = await Promise.all([
          api.get('/apply/check-id', { params: { cnic: form.cnic } }),
          api.get('/apply/check-email', { params: { email: form.email } }),
          api.get('/apply/check-phone', { params: { phone: form.phone } }),
        ]);
        if (idCheck.taken) errors.cnic = 'An application with this CNIC / B-Form has already been submitted.';
        if (emailCheck.taken) errors.email = 'This email is already used on another application.';
        if (phoneCheck.taken) errors.phone = 'This phone number is already used on another application.';
      }
    }

    if (step === 1) {
      errors.father_name = requiredError(form.father_name, "Father's name");
      errors.father_cnic = requiredError(form.father_cnic, "Father's CNIC");
      errors.father_phone = requiredError(form.father_phone, "Father's phone");
      if (form.phone && form.father_phone
        && form.phone.replace(/\D/g, '') === form.father_phone.replace(/\D/g, '')) {
        errors.father_phone = 'Applicant and father cannot use the same phone number.';
      } else if (form.father_phone) {
        const { data } = await api.get('/apply/check-phone', { params: { phone: form.father_phone } });
        if (data.taken) errors.father_phone = "This father's phone number is already used on another application.";
      }
    }

    if (step === 2) {
      errors.previous_school = requiredError(form.previous_school, 'Previous school');
      errors.program_id = requiredError(form.program_id, 'Program');
      errors.marks_obtained = requiredError(form.marks_obtained, 'Marks obtained');
      errors.total_marks = requiredError(form.total_marks, 'Total marks');
      if (form.marks_obtained !== '' && form.total_marks !== '') {
        const m = Number(form.marks_obtained);
        const t = Number(form.total_marks);
        if (!(m >= 0) || !(t > m)) errors.total_marks = 'Total marks must be greater than marks obtained.';
      }
      if (form.board === 'Other') errors.board_other = requiredError(form.board_other, 'Board name');
      if (form.grade === 'Other') errors.grade_other = requiredError(form.grade_other, 'Qualification');
      if (bs) {
        errors.province = requiredError(form.province, 'Province');
        errors.domicile_district = requiredError(form.domicile_district, 'Domicile district');
        errors.district = requiredError(form.district, 'District');
        errors.tehsil = requiredError(form.tehsil, 'Tehsil');
      }
    }

    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  };

  const next = async () => {
    if (!(await validateStep())) return;
    const nextStep = Math.min(step + 1, 3);
    setMaxReached((m) => Math.max(m, nextStep));
    setStep(nextStep);
  };

  const goToStep = (i) => {
    if (i > maxReached) return;
    setFieldErrors({});
    setError('');
    setStep(i);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};
    if (!form.declaration) errors.declaration = 'You must accept the declaration.';
    if (!files.photo) errors.photo = 'Photograph is required.';
    if (!files.cnic_copy) errors.cnic_copy = 'ID front is required.';
    if (!files.marksheet) errors.marksheet = 'Marksheet is required.';
    if (form.id_document_type === 'cnic' && !files.cnic_back) errors.cnic_back = 'CNIC back is required.';
    if (bs && !files.domicile) errors.domicile = 'Domicile is required for BS programs.';

    const cleaned = Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
    setFieldErrors(cleaned);
    if (Object.keys(cleaned).length) return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'declaration') fd.append(k, v ? '1' : '0');
      else fd.append(k, v ?? '');
    });
    Object.entries(files).forEach(([k, file]) => { if (file) fd.append(k, file); });

    setBusy(true);
    try {
      const { data } = await api.post('/apply', fd);
      navigate('/status', { state: { success: `Application submitted. ID: ${data.application_id}` } });
    } catch (ex) {
      const msg = ex.response?.data?.message || 'Submission failed.';
      const field = ex.response?.data?.field;
      if (field) {
        setFieldErrors({ [field]: msg });
        if (['full_name', 'date_of_birth', 'cnic', 'email', 'phone', 'address'].includes(field)) setStep(0);
        else if (['father_name', 'father_cnic', 'father_phone'].includes(field)) setStep(1);
        else if (['photo', 'cnic_copy', 'cnic_back', 'domicile', 'marksheet', 'declaration'].includes(field)) setStep(3);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="page-hero"><div className="hero-content"><h1>Apply Online</h1><p>Complete all steps to submit your admission application.</p></div></section>
      <section className="form-page apply-page">
        <div className="container">
          <div className="application-card card">
            <ul className="apply-stepper" role="tablist" aria-label="Application steps">
              {STEPS.map((label, i) => {
                const locked = i > maxReached;
                return (
                  <li key={label}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={i === step}
                      aria-disabled={locked}
                      disabled={locked}
                      className={`apply-step-btn${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}${locked ? ' is-locked' : ''}`}
                      onClick={() => goToStep(i)}
                    >
                      <span>{i + 1}</span>
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="progress"><div className="progress-bar" style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={submit} noValidate>
              {step === 0 && (
                <div className="step-panel active">
                  <div className="step-intro">Tell us about the applicant.</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full name <em>*</em></label>
                      <input className={invalid('full_name')} name="full_name" value={form.full_name} onChange={lettersOnly} pattern="[^0-9]*" title="Digits are not allowed in the name" />
                      <FieldError message={fieldErrors.full_name} />
                    </div>
                    <div className="form-group">
                      <label>Date of birth <em>*</em></label>
                      <input className={invalid('date_of_birth')} type="date" value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
                      <FieldError message={fieldErrors.date_of_birth} />
                    </div>
                    <div className="form-group full">
                      <fieldset className="choice-set">
                        <legend>ID document <em>*</em></legend>
                        <label className="choice-card"><input type="radio" checked={form.id_document_type === 'cnic'} onChange={() => set('id_document_type', 'cnic')} /> CNIC</label>
                        <label className="choice-card"><input type="radio" checked={form.id_document_type === 'bform'} onChange={() => set('id_document_type', 'bform')} /> B-Form</label>
                      </fieldset>
                    </div>
                    <div className="form-group">
                      <label>CNIC / B-Form <em>*</em></label>
                      <input className={invalid('cnic')} value={form.cnic} onChange={(e) => set('cnic', e.target.value)} />
                      <span className="field-hint">Digits only</span>
                      <FieldError message={fieldErrors.cnic} />
                    </div>
                    <div className="form-group">
                      <label>Gender <em>*</em></label>
                      <select value={form.gender} onChange={(e) => set('gender', e.target.value)}><option>Female</option><option>Male</option></select>
                    </div>
                    <div className="form-group">
                      <label>Religion <em>*</em></label>
                      <select value={form.religion} onChange={(e) => set('religion', e.target.value)}>
                        {(college.religions || []).map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                    {form.religion === 'Other' && (
                      <div className="form-group">
                        <label>Specify religion</label>
                        <input className={invalid('religion_other')} name="religion_other" value={form.religion_other} onChange={lettersOnly} />
                        <FieldError message={fieldErrors.religion_other} />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Nationality <em>*</em></label>
                      <select value={form.nationality} onChange={(e) => set('nationality', e.target.value)}>
                        {(college.nationalities || []).map((n) => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Email <em>*</em></label>
                      <input className={invalid('email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                      <FieldError message={fieldErrors.email} />
                    </div>
                    <div className="form-group">
                      <label>Phone <em>*</em></label>
                      <input className={invalid('phone')} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                      <FieldError message={fieldErrors.phone} />
                    </div>
                    <div className="form-group full">
                      <label>Address <em>*</em></label>
                      <textarea className={invalid('address')} value={form.address} onChange={(e) => set('address', e.target.value)} />
                      <FieldError message={fieldErrors.address} />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="step-panel active">
                  <div className="step-intro">Parent / guardian information.</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Father’s name <em>*</em></label>
                      <input className={invalid('father_name')} name="father_name" value={form.father_name} onChange={lettersOnly} pattern="[^0-9]*" />
                      <FieldError message={fieldErrors.father_name} />
                    </div>
                    <div className="form-group">
                      <label>Father’s CNIC <em>*</em></label>
                      <input className={invalid('father_cnic')} value={form.father_cnic} onChange={(e) => set('father_cnic', e.target.value)} />
                      <FieldError message={fieldErrors.father_cnic} />
                    </div>
                    <div className="form-group">
                      <label>Father’s occupation</label>
                      <input name="father_occupation" value={form.father_occupation} onChange={lettersOnly} />
                    </div>
                    <div className="form-group">
                      <label>Father’s phone <em>*</em></label>
                      <input className={invalid('father_phone')} value={form.father_phone} onChange={(e) => set('father_phone', e.target.value)} />
                      <FieldError message={fieldErrors.father_phone} />
                    </div>
                    <div className="form-group">
                      <label>Mother’s name</label>
                      <input name="mother_name" value={form.mother_name} onChange={lettersOnly} pattern="[^0-9]*" />
                    </div>
                    <div className="form-group">
                      <label>Mother’s occupation</label>
                      <input name="mother_occupation" value={form.mother_occupation} onChange={lettersOnly} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-panel active">
                  <div className="step-intro">Academic background and program choice.</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Previous school <em>*</em></label>
                      <input className={invalid('previous_school')} name="previous_school" value={form.previous_school} onChange={lettersOnly} />
                      <FieldError message={fieldErrors.previous_school} />
                    </div>
                    <div className="form-group">
                      <label>Board <em>*</em></label>
                      <select value={form.board} onChange={(e) => set('board', e.target.value)}>
                        {(college.boards || []).map((b) => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    {form.board === 'Other' && (
                      <div className="form-group">
                        <label>Board name</label>
                        <input className={invalid('board_other')} name="board_other" value={form.board_other} onChange={lettersOnly} />
                        <FieldError message={fieldErrors.board_other} />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Last qualification <em>*</em></label>
                      <select value={form.grade} onChange={(e) => set('grade', e.target.value)}>
                        <option>Matric</option><option>Intermediate</option><option>Other</option>
                      </select>
                    </div>
                    {form.grade === 'Other' && (
                      <div className="form-group">
                        <label>Specify</label>
                        <input className={invalid('grade_other')} value={form.grade_other} onChange={(e) => set('grade_other', e.target.value)} />
                        <FieldError message={fieldErrors.grade_other} />
                      </div>
                    )}
                    <div className="form-group">
                      <label>Marks obtained <em>*</em></label>
                      <input className={invalid('marks_obtained')} type="number" value={form.marks_obtained} onChange={(e) => set('marks_obtained', e.target.value)} />
                      <FieldError message={fieldErrors.marks_obtained} />
                    </div>
                    <div className="form-group">
                      <label>Total marks <em>*</em></label>
                      <input className={invalid('total_marks')} type="number" value={form.total_marks} onChange={(e) => set('total_marks', e.target.value)} />
                      <FieldError message={fieldErrors.total_marks} />
                    </div>
                    {percentage !== null && <div className="form-group full"><div className="apply-percentage">Percentage: <strong>{percentage}%</strong></div></div>}
                    <div className="form-group full">
                      <label>Program <em>*</em></label>
                      <select className={invalid('program_id')} value={form.program_id} onChange={(e) => set('program_id', e.target.value)}>
                        <option value="">Select program</option>
                        {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <FieldError message={fieldErrors.program_id} />
                    </div>
                    {bs && (
                      <div className="form-group full bs-fields">
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Province <em>*</em></label>
                            <select className={invalid('province')} value={form.province} onChange={(e) => set('province', e.target.value)}>
                              <option value="">Select</option>
                              {Object.keys(districts).map((p) => <option key={p}>{p}</option>)}
                            </select>
                            <FieldError message={fieldErrors.province} />
                          </div>
                          <div className="form-group">
                            <label>Domicile district <em>*</em></label>
                            <select className={invalid('domicile_district')} value={form.domicile_district} onChange={(e) => set('domicile_district', e.target.value)}>
                              <option value="">Select</option>
                              {provinceDistricts.map((d) => <option key={d}>{d}</option>)}
                            </select>
                            <FieldError message={fieldErrors.domicile_district} />
                          </div>
                          <div className="form-group">
                            <label>District <em>*</em></label>
                            <select className={invalid('district')} value={form.district} onChange={(e) => set('district', e.target.value)}>
                              <option value="">Select</option>
                              {provinceDistricts.map((d) => <option key={d}>{d}</option>)}
                            </select>
                            <FieldError message={fieldErrors.district} />
                          </div>
                          <div className="form-group">
                            <label>Tehsil <em>*</em></label>
                            <select className={invalid('tehsil')} value={form.tehsil} onChange={(e) => set('tehsil', e.target.value)}>
                              <option value="">Select</option>
                              {(tehsilOptions.length ? tehsilOptions : ['Other']).map((t) => <option key={t}>{t}</option>)}
                            </select>
                            <FieldError message={fieldErrors.tehsil} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="step-panel active">
                  <div className="step-intro">Upload documents (jpg, png or pdf, max 2MB).</div>
                  <div className="apply-review">
                    <div><dt>Name</dt><dd>{form.full_name}</dd></div>
                    <div><dt>Program</dt><dd>{program?.name || '—'}</dd></div>
                    <div><dt>CNIC</dt><dd>{form.cnic}</dd></div>
                    <div><dt>Percentage</dt><dd>{percentage ?? '—'}%</dd></div>
                  </div>
                  <div className="upload-grid">
                    {[
                      ['photo', 'Photograph *'],
                      ['cnic_copy', 'ID front *'],
                      ['cnic_back', form.id_document_type === 'cnic' ? 'CNIC back *' : 'CNIC back'],
                      ['domicile', bs ? 'Domicile *' : 'Domicile'],
                      ['marksheet', 'Marksheet *'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className={`upload-tile${files[key] ? ' has-file' : ''}${fieldErrors[key] ? ' is-invalid' : ''}`}>
                          <strong>{label}</strong>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                              setFiles((f) => ({ ...f, [key]: e.target.files?.[0] }));
                              setFieldErrors((err) => clearFieldError(err, key));
                            }}
                          />
                          <span>{files[key]?.name || 'Choose file'}</span>
                        </label>
                        <FieldError message={fieldErrors[key]} />
                      </div>
                    ))}
                  </div>
                  <label className={`apply-declare${fieldErrors.declaration ? ' is-invalid' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.declaration}
                      onChange={(e) => set('declaration', e.target.checked)}
                    />
                    <span>I declare that the information provided is true and complete.</span>
                  </label>
                  <FieldError message={fieldErrors.declaration} />
                </div>
              )}

              <div className="button-group">
                <button type="button" className="btn btn-ghost" disabled={step === 0} onClick={() => { setFieldErrors({}); setStep((s) => s - 1); }}>Back</button>
                {step < 3 ? (
                  <button type="button" className="btn btn-primary" onClick={next}>Next</button>
                ) : (
                  <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
