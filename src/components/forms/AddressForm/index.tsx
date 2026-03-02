'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { City, Country, State } from 'country-state-city'

import { titles } from './constants'
import { Button } from '@/components/ui/button'
import { deepMergeSimple } from 'payload/shared'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Spinner } from '@/components/ui/spinner'

const NIGERIA_COUNTRY_CODE = 'NG'

type AddressFormValues = {
  title?: string | null
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Omit<Address, 'country' | 'id' | 'updatedAt' | 'createdAt'> & { country?: string }
  callback?: (data: Partial<Address>) => void
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
}

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callback,
  skipSubmission,
}) => {
  const initialStateCode = useMemo(() => {
    const initialState = initialData?.state
    if (!initialState) return ''

    const byCode = State.getStatesOfCountry(NIGERIA_COUNTRY_CODE).find(
      (state) => state.isoCode.toLowerCase() === initialState.toLowerCase(),
    )
    if (byCode) return byCode.isoCode

    const byName = State.getStatesOfCountry(NIGERIA_COUNTRY_CODE).find(
      (state) => state.name.toLowerCase() === initialState.toLowerCase(),
    )
    return byName?.isoCode || ''
  }, [initialData?.state])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddressFormValues>({
    defaultValues: {
      ...initialData,
      country: initialData?.country || NIGERIA_COUNTRY_CODE,
      state: initialStateCode,
    },
  })

  const { createAddress, updateAddress } = useAddresses()
  const [isLoading, setIsLoading] = useState(false)

  const selectedCountry = watch('country') || NIGERIA_COUNTRY_CODE
  const selectedState = watch('state') || ''
  const selectedCity = watch('city') || ''

  const nigeria = useMemo(() => Country.getCountryByCode(NIGERIA_COUNTRY_CODE), [])

  const states = useMemo(() => {
    return State.getStatesOfCountry(NIGERIA_COUNTRY_CODE)
  }, [])

  const cities = useMemo(() => {
    if (!selectedState) return []
    return City.getCitiesOfState(NIGERIA_COUNTRY_CODE, selectedState)
  }, [selectedState])

  useEffect(() => {
    if (selectedCountry !== NIGERIA_COUNTRY_CODE) {
      setValue('country', NIGERIA_COUNTRY_CODE, { shouldValidate: true })
    }
  }, [selectedCountry, setValue])

  useEffect(() => {
    if (selectedState && !states.some((state) => state.isoCode === selectedState)) {
      setValue('state', '', { shouldValidate: true })
      setValue('city', '', { shouldValidate: true })
    }
  }, [selectedState, setValue, states])

  useEffect(() => {
    if (selectedCity && !cities.some((city) => city.name === selectedCity)) {
      setValue('city', '', { shouldValidate: true })
    }
  }, [selectedCity, cities, setValue])

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      setIsLoading(true)
      const selectedStateObj = states.find((state) => state.isoCode === data.state)

      const newData = deepMergeSimple(initialData || {}, {
        ...data,
        country: NIGERIA_COUNTRY_CODE,
        state: selectedStateObj?.name || data.state,
      })

      if (!skipSubmission) {
        if (addressID) {
          await updateAddress(addressID, newData)
        } else {
          await createAddress(newData)
        }
      }

      if (callback) {
        callback(newData)
      }

      setIsLoading(false)
    },
    [initialData, skipSubmission, callback, addressID, updateAddress, createAddress, states],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <FormItem className="shrink">
            <Label htmlFor="title">Title</Label>

            <Select
              {...register('title')}
              onValueChange={(value) => {
                setValue('title', value, { shouldValidate: true })
              }}
              defaultValue={initialData?.title || ''}
            >
              <SelectTrigger id="title">
                <SelectValue placeholder="Title" />
              </SelectTrigger>
              <SelectContent>
                {titles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.title && <FormError message={errors.title.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor="firstName">First name*</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              {...register('firstName', { required: 'First name is required.' })}
            />
            {errors.firstName && <FormError message={errors.firstName.message} />}
          </FormItem>

          <FormItem>
            <Label htmlFor="lastName">Last name*</Label>
            <Input
              autoComplete="family-name"
              id="lastName"
              {...register('lastName', { required: 'Last name is required.' })}
            />
            {errors.lastName && <FormError message={errors.lastName.message} />}
          </FormItem>
        </div>

        <FormItem>
          <Label htmlFor="phone">Phone</Label>
          <Input type="tel" id="phone" autoComplete="mobile tel" {...register('phone')} />
          {errors.phone && <FormError message={errors.phone.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="company">Company</Label>
          <Input id="company" autoComplete="organization" {...register('company')} />
          {errors.company && <FormError message={errors.company.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="addressLine1">Address line 1*</Label>
          <Input
            id="addressLine1"
            autoComplete="address-line1"
            {...register('addressLine1', { required: 'Address line 1 is required.' })}
          />
          {errors.addressLine1 && <FormError message={errors.addressLine1.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input id="addressLine2" autoComplete="address-line2" {...register('addressLine2')} />
          {errors.addressLine2 && <FormError message={errors.addressLine2.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="state">State*</Label>
          <Select
            onValueChange={(value) => {
              setValue('state', value, { shouldValidate: true })
              setValue('city', '', { shouldValidate: true })
            }}
            value={selectedState}
          >
            <SelectTrigger id="state" className="w-full">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register('state', { required: 'State is required.' })} />
          {errors.state && <FormError message={errors.state.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="city">City*</Label>
          <Select
            disabled={!selectedState}
            onValueChange={(value) => {
              setValue('city', value, { shouldValidate: true })
            }}
            value={selectedCity}
          >
            <SelectTrigger id="city" className="w-full">
              <SelectValue placeholder={selectedState ? 'Select city' : 'Select state first'} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={`${city.stateCode}-${city.name}`} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register('city', { required: 'City is required.' })} />
          {errors.city && <FormError message={errors.city.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="postalCode">Zip Code*</Label>
          <Input
            id="postalCode"
            {...register('postalCode', { required: 'Postal code is required.' })}
          />
          {errors.postalCode && <FormError message={errors.postalCode.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="country">Country*</Label>
          <Select
            onValueChange={(value) => {
              setValue('country', value, { shouldValidate: true })
            }}
            value={NIGERIA_COUNTRY_CODE}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NIGERIA_COUNTRY_CODE}>{nigeria?.name || 'Nigeria'}</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register('country', { required: 'Country is required.' })} />
          {errors.country && <FormError message={errors.country.message} />}
        </FormItem>
      </div>

      <Button disabled={isLoading} type="submit" className="w-full">
        {isLoading ? <Spinner /> : 'Submit'}
      </Button>
    </form>
  )
}
