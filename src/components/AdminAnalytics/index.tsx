import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter, SetStepNav, type StepNavItem } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { AnalyticsClient } from './index.client'
import { redirect } from 'next/navigation'

export const AnalyticsView: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { req } = initPageResult

  if (!req.user) {
    redirect(`/admin/login?redirect=/admin/analytics`)
  }

  const steps: StepNavItem[] = [
    {
      url: '/analytics',
      label: 'Analytics',
    },
  ]

  return (
    <DefaultTemplate
      visibleEntities={initPageResult.visibleEntities}
      i18n={initPageResult.req.i18n}
      payload={initPageResult.req.payload}
      locale={initPageResult.locale}
      params={params}
      permissions={initPageResult.permissions}
      user={initPageResult.req.user || undefined}
      searchParams={searchParams}
    >
      <SetStepNav nav={steps} />
      <Gutter>
        <h1 style={{ margin: '1rem 0 2rem' }}>Analytics Dashboard</h1>
        <AnalyticsClient />
      </Gutter>
    </DefaultTemplate>
  )
}

export default AnalyticsView
