import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  return (
    <Button
      variant="nav"
      size="clear"
      aria-label={quantity ? `Cart, ${quantity} items` : 'Cart'}
      className="relative p-2 text-inherit hover:cursor-pointer"
      {...rest}
    >
      <ShoppingBag className="size-5" strokeWidth={1.5} />
      {quantity ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] leading-none text-primary-foreground">
          {quantity}
        </span>
      ) : null}
    </Button>
  )
}
