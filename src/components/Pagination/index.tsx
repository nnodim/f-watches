'use client'
import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/utilities/cn'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import React from 'react'

type PaginationProps = {
  className?: string
  page: number
  totalPages: number
  /**
   * If true, uses query params (?page=1) instead of route segments (/page/1)
   */
  useQueryParams?: boolean
  /**
   * Base path for route-based pagination (e.g., '/posts/page')
   */
  basePath?: string
}

export const Pagination: React.FC<PaginationProps> = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { className, page, totalPages, useQueryParams = false, basePath = '/posts/page' } = props

  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  const navigateToPage = (pageNum: number) => {
    if (useQueryParams) {
      // Create new URLSearchParams from current params
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', pageNum.toString())
      router.push(`${pathname}?${params.toString()}`)
    } else {
      // Use route-based navigation
      router.push(`${basePath}/${pageNum}`)
    }
  }

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={!hasPrevPage}
              onClick={() => {
                if (hasPrevPage) navigateToPage(page - 1)
              }}
            />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  navigateToPage(page - 1)
                }}
              >
                {page - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink
              isActive
              onClick={() => {
                navigateToPage(page)
              }}
            >
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink
                onClick={() => {
                  navigateToPage(page + 1)
                }}
              >
                {page + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              disabled={!hasNextPage}
              onClick={() => {
                if (hasNextPage) navigateToPage(page + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}
