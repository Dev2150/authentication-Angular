import {useEffect, useState} from "react"

// interface for the properties that we can pass this component
interface FormFieldProps {
    htmlFor: string
    // the actual displayed label
    label: string
    // input type - e.g. text/password
    type?: string
    // the parent will store the state...
    value: any
    // ... and handle any changes that happen to the field
    onChange?: (...args: any) => any
    error?: string
}

export function FormField({
    htmlFor,
    label,
    type = "text",
    value,
    onChange = () => { },
    error = ""
}: FormFieldProps) {
    const [errorText, setErrorText] = useState(error)
    useEffect(() => {
            setErrorText(error)
    }, [error])

    return <>
        <label htmlFor={htmlFor} className="text-blue-600 font-semibold">{label}</label>
        <input onChange={e => {
                onChange(e)
            setErrorText('')
        }} type={type} id={htmlFor} name={htmlFor} className="w-full p-2 rounded-xl my-2" value={value} />
        {/*Render an error message if one is provided*/}
        <div className="text-xs font-semibold text-center tracking-wide text-red-500 w-full">
            {errorText || ''}
        </div>
    </>
}