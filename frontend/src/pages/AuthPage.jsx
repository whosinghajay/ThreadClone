import React from 'react'
import SignupCard from '../compoents/SignupCart'
import LoginCard from '../compoents/LoginCart'
import { useRecoilValue} from 'recoil'
import authScreenAtom from '../atoms/authAtom'

const AuthPage = () => {
    const authScreenState = useRecoilValue(authScreenAtom);
    console.log(authScreenState);
    return (
    <>
     { authScreenState === 'login' ? <LoginCard/> : <SignupCard/> } 
    </>
  )
}

export default AuthPage
