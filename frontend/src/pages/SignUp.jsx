import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import LocationPhoneSelector from '../components/LocationPhoneSelector';
import client from '../api/client';

const PASSWORD_HINT = 'At least 8 characters, with an uppercase letter, a lowercase letter, and a number.';

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [registrationToken, setRegistrationToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryIso2, setCountryIso2] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [dialCode, setDialCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Step 2 fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const submitStep1 = async (e) => {
    e.preventDefault();
    setError('');
    if (!dialCode || !phoneNumber) {
      setError('Please select your country code and enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      const fullPhoneNumber = `${dialCode}${phoneNumber.replace(/^0+/, '')}`;
      const { data } = await client.post('/auth/register/step-1', {
        fullName, email, phoneNumber: fullPhoneNumber
      });
      setRegistrationToken(data.registrationToken);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not verify your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/register/step-2', {
        registrationToken, username, password
      });
      localStorage.setItem('jedida_access_token', data.accessToken);
      localStorage.setItem('jedida_refresh_token', data.refreshToken);
      localStorage.setItem('jedida_user', JSON.stringify(data.user));
      navigate('/marketplace');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="eyebrow">Get started — Step {step} of 2</div>

      {step === 1 ? (
        <>
          <h1>Create your buyer account</h1>
          <p className="hint">Tell us the basics. You'll set your username and password next.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submitStep1}>
            <div className="field-group">
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" placeholder="e.g. Joseph Nsubuga" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <LocationPhoneSelector
              countryIso2={countryIso2} onCountryChange={setCountryIso2}
              city={locationCity} onCityChange={setLocationCity}
              dialCode={dialCode} onDialCodeChange={setDialCode}
              phoneNumber={phoneNumber} onPhoneNumberChange={setPhoneNumber}
            />

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1>Set your username and password</h1>
          <p className="hint">This is what you'll use to sign in every time.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submitStep2}>
            <div className="field-group">
              <label htmlFor="username">Username</label>
              <input
                id="username" value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="lowercase letters, numbers, . or _ only"
                pattern="[a-z0-9_.]{3,30}"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder={PASSWORD_HINT} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => 
setConfirmPassword(e.target.value)} required minLength={8} />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating your account…' : 'Create account'}
            </button>
            <button type="button" className="btn-link" style={{ marginTop: 12 }} onClick={() => setStep(1)}>
              ← Back
            </button>
          </form>
        </>
      )}

      <p className="auth-footer-note">
        Already have an account? <Link to="/signin" className="btn-link">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
