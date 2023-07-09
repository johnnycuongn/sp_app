import { useState } from 'react';

import {
  Button,
  FormControl,
  Grid,
  Grow,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../model';
import { useAuth } from '../model/Auth';


const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');

  const navigate = useNavigate()

  const { login, loading } = useAuth()

  const handleLogin = async () => {
    console.log('Username ' + email);
    await login(email, password)

    console.log('Successful lo gin ');
    // navigate('/');
  };

  return (
    <>
      <Grid
        container
        spacing={3}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* small device full, beyond that half */}
        <Grid item style={{ marginTop: 150 }}>
          <Grow in timeout={1500}>
            <Paper elevation={3} style={{ padding: 50, textAlign: 'center' }}>
              {/* if loading, show lottie, else display form */}
              {loading === false ? (
                <>
                  {/* <img
                    src={Logo}
                    alt="logo"
                    style={{ width: 200, alignSelf: 'center' }}
                  /> */}
                  <form style={{ flexGrow: 1 }} noValidate autoComplete="off">
                    <h4>Login</h4>
                    <div style={{ flexDirection: 'column', display: 'flex' }}>
                      <TextField
                        id="1"
                        label="Email"
                        variant="outlined"
                        value={email}
                        placeholder="johndoe@example.com"
                        onChange={(text) => setEmail(text.target.value)}
                        style={{ margin: 10 }}
                      />
                      <TextField
                        id="2"
                        label="Password"
                        variant="outlined"
                        value={password}
                        onChange={(text) => setPassword(text.target.value)}
                        type="password"
                        style={{ margin: 10 }}
                      />
                    </div>
                  </form>
                  <Button
                    variant="contained"
                    style={{ color: 'white' }}
                    onClick={handleLogin}
                  >
                    Login
                  </Button>
                </>
              ) : (
                <>Loading</>
              )}
            </Paper>
          </Grow>
        </Grid>
      </Grid>
    </>
  );
};

export default LoginPage;