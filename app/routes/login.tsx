import React, {useState} from 'react'
import {Layout} from '~/components/layout'
import {FormField} from '~/components/form-field'
import {ActionFunction, json, LoaderFunction, redirect} from '@remix-run/node'
import {validateConfirmPassword, validateEmail, validateName, validatePassword} from '~/utils/validators.server'
import {login, register, getUser} from '~/utils/auth.server'
import {useActionData} from '@remix-run/react'
import {useRef, useEffect} from 'react'

import ReactFlagsSelect from 'react-flags-select';

export const loader: LoaderFunction = async ({request}) => {
    // If there's already a user in the session, redirect to the home page
    return (await getUser(request)) ? redirect('/') : null
}

export const action: ActionFunction = async ({request}) => {
    const form = await request.formData()
    const action = form.get('_action')
    const email = form.get('email')
    const password = form.get('password')
    const confirmpassword = form.get('confirmpassword')
    // let because later they will be changed
    let firstName = form.get('firstName')
    let lastName = form.get('lastName')
    let country = form.get('country')

    // if you're logging in, check whether only the e-mail & the password are strings
    if (typeof action !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return json({error: `Invalid Form Data - action, email or password are not strings`, form: action}, {status: 400})
    }

    // in case you're registering, perform checks on the extra fields
    if (action === 'register' && (typeof confirmpassword !== 'string' || typeof firstName !== 'string' || typeof lastName !== 'string' || typeof country !== 'string')) {
        return json({error: `Invalid Form Data - confirmpassword, firstname, lastname or country are not strings`, form: action}, {status: 400})
    }

    // Object: contains boolean values for whether there was an error in the given field
    const errors = {
        email: validateEmail(email),
        password: validatePassword(password),
        ...(action === 'register'
            ? {
                confirmpassword: validateConfirmPassword(password, (confirmpassword as string) || ''),
                firstName: validateName((firstName as string) || ''),
                lastName: validateName((lastName as string) || ''),
                country: validateName((country as string) || ''),
            }
            : {}),
    }

    // throw an error if going through all keys in the created object there is found a true value
    if (Object.values(errors).some(Boolean))
        return json({errors, fields: {email, password, firstName, lastName}, form: action}, {status: 400})

    // handle the form
    switch (action) {
        case 'login': {
            return await login({email, password})
        }
        case 'register': {
            firstName = firstName as string
            lastName = lastName as string
            country = country as string
            return await register({email, password, firstName, lastName, country})
        }
        default: // Somehow an invalid action was submitted
            return json({error: `Invalid Form Data - invalid action was submitted`}, {status: 400});
    }
}

export default function Login() {
    // Returns the JSON parsed data from the current route's action.
    const actionData = useActionData()
    // whether the page has loaded
    const firstLoad = useRef(true)
    const [errors, setErrors] = useState(actionData?.errors || {})
    const [formError, setFormError] = useState(actionData?.error || '')
    const [formData, setFormData] = useState({
        email: actionData?.fields?.email || '',
        password: actionData?.fields?.password || '',
        confirmpassword: actionData?.fields?.confirmpassword || '',
        firstName: actionData?.fields?.lastName || '',
        lastName: actionData?.fields?.firstName || '',
        country: actionData?.fields?.country || '',
    })
    const [action, setAction] = useState((errors?.firstName || errors?.lastName || errors?.confirmpassword || errors?.country) ? 'register' : 'login')
    //const [selectedCountry, setSelectedCountry] = useState("PH");

    // Updates the form data when an input changes
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setFormData(form => ({...form, [field]: event.target.value}))
    }

    // whenever the action state changes
    // (whenever the forms are switched
    useEffect(() => {
        // Clear the form
        if (!firstLoad.current) {
            const newState = {
                email: '',
                password: '',
                confirmpassword: '',
                firstName: '',
                lastName: '',
                country: 'PH',
            }
            setErrors(newState)
            setFormError('')
            setFormData(newState)
        }
    }, [action])

    // whenever formData changes
    useEffect(() => {
        if (!firstLoad.current) {
            // clear the form errors
            setFormError('')
        }
    }, [formData])

    // useEffect(() => {
    //     // We don't want to reset errors on page load because we want to keep those
    //     firstLoad.current = false
    // }, [])

    // useEffect( () => {
    //     setFormData(form => ({...form, country: selectedCountry}))
    //     console.log(formData)
    // }, [selectedCountry])

    return (
        <Layout>
            <div className="h-full justify-center items-center flex flex-col gap-y-4">
                <button
                    onClick={() => setAction(action == 'login' ? 'register' : 'login')}
                    className="absolute top-8 right-8 rounded-xl bg-yellow-300 font-semibold text-blue-600 px-3 py-2 transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1"
                >
                    {action === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
                <div className="font-semibold text-slate-300">
                    <h2 className="text-5xl font-extrabold text-yellow-300">Welcome to my website!</h2>
                    {action === 'login' ? 'Log In To Check Out The Team!' : 'Sign Up To Get Started!'}
                </div>
                {/*Submit the form to the created ActionFunction, by adding method="POST" */}
                <form method="POST" className="rounded-2xl bg-gray-200 p-6 w-96">
                    <div
                        className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">{formError}</div>
                    <FormField
                        htmlFor="email"
                        label="Email"
                        value={formData.email}
                        onChange={e => handleInputChange(e, 'email')}
                        error={errors?.email}
                    />
                    <FormField
                        htmlFor="password"
                        type="password"
                        label="Password"
                        value={formData.password}
                        onChange={e => handleInputChange(e, 'password')}
                        error={errors?.password}
                    />
                    {/* show extra fields if the state of action is 'register*/}
                    {action === 'register' && (
                        <>
                            <FormField
                                htmlFor="confirmpassword"
                                type="password"
                                label="Confirm Password"
                                value={formData.confirmpassword}
                                onChange={e => handleInputChange(e, 'confirmpassword')}
                                error={errors?.confirmpassword}
                            />
                            {/*<label htmlFor="country" className="text-blue-600 font-semibold">Country</label>*/}
                            {/*<ReactFlagsSelect*/}
                            {/*    selected={formData.country}*/}
                            {/*    onSelect={e => {*/}
                            {/*        setSelectedCountry(e)*/}
                            {/*    }}*/}
                            {/*    searchable*/}
                            {/*    searchPlaceholder="Search countries"*/}
                            {/*    placeholder="Select Language"*/}
                            {/*/>*/}
                            <FormField
                                htmlFor="firstName"
                                label="First Name"
                                onChange={e => handleInputChange(e, 'firstName')}
                                value={formData.firstName}
                                error={errors?.firstName}
                            />
                            <FormField
                                htmlFor="lastName"
                                label="Last Name"
                                onChange={e => handleInputChange(e, 'lastName')}
                                value={formData.lastName}
                                error={errors?.lastName}
                            />
                            <FormField
                                htmlFor="country"
                                label="Country"
                                onChange={e => handleInputChange(e, 'country')}
                                value={formData.country}
                                error={errors?.country}
                            />
                        </>
                    )}
                    <div className="w-full text-center">
                        <button type="submit" name="_action" value={action}
                                className="rounded-xl mt-2 bg-yellow-300 px-3 py-2 text-blue-600 font-semibold transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1">
                            {
                                action === 'login' ? "Sign In" : "Sign Up"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}
