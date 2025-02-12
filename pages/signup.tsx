import type { NextPage } from 'next'
import { Box, TextField, Button, Link, } from '@mui/material'
import Sign from '../components/Sign'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { Input } from '../constants'
import { register } from '../apis'
import { useSnackbar } from 'notistack';


const SignUp: NextPage = () => {
  const history = useRouter()
  const { enqueueSnackbar } = useSnackbar();

  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const handleInputChange = (type: Input) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> ) => {
    //console.log(ev.target.value)
    switch (type) {
      case Input.Email:
        setEmail(ev.target.value)
        break;

      case Input.Username:
        setUsername(ev.target.value)
        break;

      case Input.Password:
        setPassword(ev.target.value)
        break;

      case Input.Confirm:
        setConfirm(ev.target.value)
        break;

      default:
        break;
    }
  }

  const submitHandler = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (email === "") {
      enqueueSnackbar("Email is required", { variant: "error" })
    } else if (username === "") {
      enqueueSnackbar("Username is required", { variant: "error" })
    } else if (password === "") {
      enqueueSnackbar("Password is required", { variant: "error" })
    } else if (confirm === "") {
      enqueueSnackbar("Confirm is required", { variant: "error" })
    } else if (password !== confirm) {
      enqueueSnackbar("Please check passowrd and confirm", { variant: "error" })
    }
    register({ email, name: username, password })
      .then(() => {
        enqueueSnackbar("Register success", { variant: "success" })
        console.log("registered")
      })
      .catch((reason: any) => {
        enqueueSnackbar("Register faild", { variant: "error" })
        console.log(reason)
      })
  }

  return (
    <Sign>
      <Box component="form" noValidate onSubmit={submitHandler} sx={{
        mt: 1,
        position: 'relative'
      }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="EMAIL"
          name="email"
          autoComplete="email"
          variant="standard"
          autoFocus
          value={email}
          onChange={handleInputChange(Input.Email)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="USERNAME"
          name="username"
          autoComplete="username"
          variant="standard"
          value={username}
          onChange={handleInputChange(Input.Username)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="PASSWORD"
          type="password"
          id="password"
          autoComplete="current-password"
          variant="standard"
          value={password}
          onChange={handleInputChange(Input.Password)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirm-password"
          label="CONFIRM PASSWORD"
          type="password"
          id="confirm-password"
          autoComplete=""
          variant="standard"
          value={confirm}
          onChange={handleInputChange(Input.Confirm)}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 4, mb: 2 }}
        >
          Sign Up
        </Button>
        <Link
          variant="body2"
          underline='hover'
          sx={{
            cursor: "pointer",
            color: "#000",
            mt: 2,
            textAlign: "center"
          }}
          onClick={() => {
            history.push("/signin")
          }}
          component={"h3"}
        >
          {"Already have an account? Sign In"}
        </Link>
      </Box>
    </Sign>
  )
}

export default SignUp