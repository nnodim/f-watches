"use client"

import React from 'react'
import { Button } from './ui/button'
import { ChevronLeftIcon } from 'lucide-react'

export const BackButton = () => {
  return (
    <Button onClick={() => history.back()} variant="ghost" className="mb-4">
      <ChevronLeftIcon />
      All products
    </Button>
  )
}