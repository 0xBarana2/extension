import React, { useState } from "react"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ETHEREUM } from "@tallyho/tally-background/constants"
import { FungibleAsset } from "@tallyho/tally-background/assets"
import SharedAssetInput, { PriceDetails } from "../SharedAssetInput"

const label = "Test label"
const asset: FungibleAsset = {
  symbol: "FAKE",
  name: "Fake token",
  decimals: 2,
}
const assetsAndAmounts = [
  {
    asset,
    amount: 100n,
    localizedDecimalAmount: "1",
  },
  {
    asset: {
      symbol: "TST",
      name: "Test token",
      decimals: 2,
    },
    amount: 300n,
    localizedDecimalAmount: "3",
  },
]

function SharedAssetInputWithState() {
  const [amount, setAmount] = useState("")
  const [currentAsset, setCurrent] = useState(asset)
  return (
    <SharedAssetInput
      currentNetwork={ETHEREUM}
      selectedAsset={currentAsset}
      assetsAndAmounts={assetsAndAmounts}
      label={label}
      amount={amount}
      onAmountChange={(value) => setAmount(value)}
      showMaxButton
      showPriceDetails
      amountMainCurrency="1"
      onAssetSelect={(value) => setCurrent(value)}
    />
  )
}

describe("SharedAssetInput", () => {
  test("should render component", async () => {
    const ui = render(
      <SharedAssetInput
        currentNetwork={ETHEREUM}
        selectedAsset={undefined}
        assetsAndAmounts={[]}
        label={label}
      />
    )

    expect(ui.getByText(label)).toBeInTheDocument()
    expect(ui.getByText("Select token")).toBeInTheDocument()
  })

  test("should display predefined asset", () => {
    const ui = render(<SharedAssetInputWithState />)

    expect(ui.getByText("FAKE")).toBeInTheDocument()
    expect(ui.getByText("Balance: 1")).toBeInTheDocument()
  })

  test("should allow to open assets selector", async () => {
    const ui = render(<SharedAssetInputWithState />)

    const assetButton = ui.getByText("FAKE")

    await userEvent.click(assetButton)
    expect(ui.queryByText("Select token")).toBeVisible()
  })

  test("should allow to search for assets with a searchbox", async () => {
    const ui = render(<SharedAssetInputWithState />)
    const assetButton = ui.getByText("FAKE")

    await userEvent.click(assetButton)
    expect(ui.queryByText("Fake token")).toBeVisible()
    expect(ui.queryByText("Test token")).toBeVisible()

    const searchbox = ui.getByPlaceholderText("Search by name or address")
    expect(searchbox).toHaveValue("")

    await userEvent.type(searchbox, "Fake")

    expect(searchbox).toHaveValue("Fake")
    expect(ui.queryByText("Fake token")).toBeVisible()
    expect(ui.queryByText("Test token")).not.toBeInTheDocument()
  })

  test("should allow to select different asset", async () => {
    const ui = render(<SharedAssetInputWithState />)
    const assetButton = ui.getByText("FAKE")
    await userEvent.click(assetButton)

    const anotherToken = ui.getByText("Test token")
    await userEvent.click(anotherToken)

    expect(anotherToken).not.toBeVisible() // menu should autoclose
    expect(assetButton).toBeVisible()
    expect(assetButton).toHaveTextContent("TST")
  })

  test("should display asset balance", () => {
    const ui = render(<SharedAssetInputWithState />)

    expect(ui.queryByText("Balance: 1")).toBeInTheDocument()
  })

  test("should allow to select max amount of the asset", async () => {
    const ui = render(<SharedAssetInputWithState />)
    const inputElement = ui.getByLabelText(label)
    const maxButton = ui.getByText("Max")

    expect(inputElement).toHaveDisplayValue("")
    await userEvent.click(maxButton)
    expect(inputElement).toHaveDisplayValue("1")
  })

  test("should be able to type asset amount", async () => {
    const ui = render(<SharedAssetInputWithState />)
    const inputElement = ui.getByLabelText(label)

    expect(inputElement).toHaveDisplayValue("")
    await userEvent.type(inputElement, "0.5")
    expect(inputElement).toHaveDisplayValue("0.5")
  })

  test("should display asset price", () => {
    const ui = render(<SharedAssetInputWithState />)

    expect(ui.getByText("$1")).toBeVisible()
  })

  test("should show insufficient balance error", async () => {
    const ui = render(<SharedAssetInputWithState />)
    const inputElement = ui.getByLabelText(label)

    await userEvent.type(inputElement, "10")
    const errorMessage = ui.getByText("Insufficient balance")

    expect(errorMessage).toBeVisible()
  })

  test("should be able to disable assets selector", async () => {
    const ui = render(
      <SharedAssetInput
        currentNetwork={ETHEREUM}
        selectedAsset={asset}
        assetsAndAmounts={assetsAndAmounts}
        label={label}
        disableDropdown
      />
    )

    const assetButton = ui.getByText("FAKE")

    expect(assetButton).toHaveAttribute("disabled")
    await userEvent.click(assetButton)
    expect(ui.queryByText("Select token")).not.toBeInTheDocument()
  })
})

const currencySymbol = "$"

describe("PriceDetails for SharedAssetInput", () => {
  test("should display amount main currency", () => {
    const amount = "1"
    const ui = render(
      <PriceDetails amountMainCurrency={amount} priceImpact={undefined} />
    )
    expect(ui.getByText(`${currencySymbol}${amount}`)).toBeVisible()
  })

  test("should display that amount is lower than 0", () => {
    const amount = "0.00"
    const ui = render(
      <PriceDetails amountMainCurrency={amount} priceImpact={undefined} />
    )
    expect(ui.getByText(`<${currencySymbol}${amount}`)).toBeVisible()
  })

  test("should display 0.00 when amount is undefined", () => {
    const amount = "0.00"
    const ui = render(
      <PriceDetails amountMainCurrency={undefined} priceImpact={undefined} />
    )
    expect(ui.getByText(`${currencySymbol}${amount}`)).toBeVisible()
  })

  test("should display price impact", () => {
    const priceImpact = 1

    const ui = render(
      <PriceDetails amountMainCurrency={undefined} priceImpact={priceImpact} />
    )

    expect(ui.getByText(`(${priceImpact}%)`)).toBeVisible()
  })

  test("should not display price impact when is undefined", () => {
    const ui = render(
      <PriceDetails amountMainCurrency={undefined} priceImpact={undefined} />
    )

    expect(ui.queryByTestId("price_impact_percent")).not.toBeInTheDocument()
  })

  test("should not display price impact when is 0", () => {
    const ui = render(
      <PriceDetails amountMainCurrency={undefined} priceImpact={0} />
    )

    expect(ui.queryByTestId("price_impact_percent")).not.toBeInTheDocument()
  })
})
