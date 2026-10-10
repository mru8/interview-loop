import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 20, fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontSize: 36 }}>InterviewLoop</h1>
      <p style={{ color: '#555', fontSize: 18 }}>
        Practice behavioral interviews with a voice AI interviewer, then get a scored
        feedback report with strengths and areas to improve.
      </p>
      <div style={{ marginTop: 30, display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link href="/signup" style={primary}>Sign up</Link>
        <Link href="/login" style={secondary}>Log in</Link>
        <Link href="/dashboard" style={secondary}>Dashboard</Link>
      </div>
    </div>
  );
}

const primary = {
  padding: '10px 20px',
  fontSize: 16,
  background: '#1976d2',
  color: 'white',
  borderRadius: 6,
  textDecoration: 'none',
};

const secondary = {
  padding: '10px 20px',
  fontSize: 16,
  border: '1px solid #1976d2',
  color: '#1976d2',
  borderRadius: 6,
  textDecoration: 'none',
};