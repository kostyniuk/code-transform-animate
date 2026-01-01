import type { SimpleStep } from "./magicMove/types";

export const DEFAULT_STEPS: SimpleStep[] = [
  {
    code: `// Step 1: Simple boolean state
import { useState } from 'react';

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoggedIn(true);
    setIsLoading(false);
  };

  return (
    <button onClick={handleLogin}>
      {isLoading ? 'Connecting...' : isLoggedIn ? 'Logout' : 'Login'}
    </button>
  );
}`,
  },
  {
    code: `// Step 2: Encapsulated Reducer Logic
import { useReducer } from 'react';

type State = { status: 'idle' | 'loading' | 'authenticated' };
type Action = { type: 'LOGIN_START' } | { type: 'LOGIN_SUCCESS' };

function authReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOGIN_START': return { status: 'loading' };
    case 'LOGIN_SUCCESS': return { status: 'authenticated' };
    default: return state;
  }
}

export function AuthButton() {
  const [state, dispatch] = useReducer(authReducer, { status: 'idle' });

  const handleLogin = async () => {
    dispatch({ type: 'LOGIN_START' });
    await new Promise(r => setTimeout(r, 1000));
    dispatch({ type: 'LOGIN_SUCCESS' });
  };

  return (
    <button onClick={handleLogin} disabled={state.status === 'loading'}>
      {state.status === 'loading' ? 'Connecting...' :
       state.status === 'authenticated' ? 'Logout' : 'Login'}
    </button>
  );
}`,
  },
];
