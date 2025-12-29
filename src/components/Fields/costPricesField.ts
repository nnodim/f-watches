import { amountField } from '@payloadcms/plugin-ecommerce'
import { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'
import { Field } from 'payload'
type Props = {
  currenciesConfig: CurrenciesConfig
}

export const costPricesField = ({ currenciesConfig }: Props): Field[] => {
  const currencies = currenciesConfig.supportedCurrencies

  return currencies.map((currency) => {
    const name = `costPriceIn${currency.code}`
    const enabledCheckboxName = `priceIn${currency.code}Enabled`

    return amountField({
      currenciesConfig,
      currency,
      overrides: {
        name,
        label: `Cost Price (${currency.code})`,
        defaultValue: 0,
        admin: {
          description: `Internal cost price in ${currency.code}`,
          condition: (_data, siblingData) => {
            return Boolean(siblingData?.[enabledCheckboxName])
          },
        },
      },
    })
  })
}
