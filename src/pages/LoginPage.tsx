import { useState } from "react"
import {
  Alert,
  Box,
  Button,
  Grow,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"

import { useAuth } from "../api"

export default function LoginPage() {
  const { login, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Grow in timeout={600}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, width: "100%", maxWidth: 400 }}>
          <Stack spacing={3} component="form" onSubmit={onSubmit}>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h2" sx={{ mb: 0.5 }}>
                Sinh Phu
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Receipt tracker — sign in to continue
              </Typography>
            </Box>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              fullWidth
              disabled={loading || submitting}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
              disabled={loading || submitting}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || submitting || !email || !password}
              fullWidth
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </Paper>
      </Grow>
    </Box>
  )
}
