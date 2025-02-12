import type { NextPage } from 'next'
import { Box, TextField, Button, Link, } from '@mui/material'
import Sign from '../components/Sign'
import { useRouter } from 'next/router'
import React, {useState} from 'react'
import { userService } from '../services'
import { Input } from '../constants'
import { useSnackbar } from 'notistack';


const SignIn: NextPage = () => {
  const history = useRouter()
  const { enqueueSnackbar } = useSnackbar();

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleInputChange = (type: Input) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> ) => {
    //console.log(ev.target.value)
    switch (type) {
      case Input.Email:
        setEmail(ev.target.value)
        break;

      case Input.Password:
        setPassword(ev.target.value)
        break;

      default:
        break;
    }
  }

  const submitHandler = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    if (email === "") {
      enqueueSnackbar("Email is required", { variant: "error" })
    } else if (password === "") {
      enqueueSnackbar("Password is required", { variant: "error" })
    } else {
      userService.login(email, password)
        .then(() => {
          const returnURL = '/'
          history.push(returnURL)
        }).catch((reason: any) => {
          console.log(`login api error: ${reason}`)
          enqueueSnackbar(`login api error: ${reason}`, { variant: "error" })
        })
    }
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
          label="Email"
          name="email"
          autoComplete="email"
          variant="standard"
          value={email}
          autoFocus
          onChange={handleInputChange(Input.Email)}
          // onChange={()}
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
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 10, mb: 2 }}
        >
          Sign In
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
            history.push("/signup")
          }}
          component={"h3"}
        >
          {"Not a member yet? Sign Up"}
        </Link>
      </Box>
    </Sign>
  )
}

export default SignIn