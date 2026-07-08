import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },
  meshBg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    background: `
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99, 102, 241, 0.08), transparent),
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.06), transparent),
      radial-gradient(ellipse 70% 60% at 50% 80%, rgba(34, 211, 238, 0.05), transparent),
      radial-gradient(ellipse 50% 50% at 70% 60%, rgba(99, 102, 241, 0.04), transparent)
    `,
    animation: 'gradientShift 20s ease infinite',
    backgroundSize: '200% 200%',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '480px',
  },
};

export default function Login() {
  const navigate = useNavigate();

  const handleAuth = () => {
    navigate('/');
  };

  return (
    <div style={styles.page}>
      <div style={styles.meshBg} />
      <div style={styles.content}>
        <AuthForm onAuth={handleAuth} />
      </div>
    </div>
  );
}
