import { useTranslation } from 'react-i18next'
import {
  CARD_MONTH_NULL,
  CARD_QUARTER_NULL,
  CARD_YEAR_NULL,
  EXPLORER_URL,
  MAX_ETH_PER_ADDRESS,
  MAX_SUPPLY,
  MINT_PRICE_ETH,
  MINT_TARGET_ETH,
  LLNU_TOKENS_PER_SHARE,
  NETWORK_LABEL,
  TARGET_CHAIN_ID,
  TOKENS_PER_SHARE,
  getContracts,
  isProtocolLive,
  explorerAddress,
} from '../config/contracts'
import type { ContractSet } from '../config/contracts'
import { useMintCapUsd } from '../hooks/useEthUsdPrice'

const LABELS: { key: keyof ContractSet; label: string }[] = [
  { key: 'nullMint', label: 'NullMint' },
  { key: 'protocolHook', label: 'NullProtocolHook' },
  { key: 'nullToken', label: 'NullToken' },
  { key: 'llnuToken', label: 'LlnuToken' },
  { key: 'poolManager', label: 'PoolManager' },
]

type DocBodyProps = {
  pageId: string
}

export function DocBody({ pageId }: DocBodyProps) {
  switch (pageId) {
    case 'about':
      return <AboutPage />
    case 'tokens':
      return <TokensPage />
    case 'mint':
      return <MintPage />
    case 'linked-burn':
      return <LinkedBurnPage />
    case 'protection':
      return <ProtectionPage />
    case 'architecture':
      return <ArchitecturePage />
    case 'addresses':
      return <AddressesPage />
    case 'faq':
      return <FaqPage />
    case 'reference':
      return <ReferencePage />
    default:
      return <AboutPage />
  }
}

function AboutPage() {
  const { t } = useTranslation()
  const mintCapUsd = useMintCapUsd(MINT_TARGET_ETH)

  return (
    <>
      <h2 id="what-is">{t('docs.pages.about.whatIs')}</h2>
      <p>{t('docs.about.whatIsP1')}</p>
      <p>{t('docs.about.whatIsP2')}</p>

      <h2 id="flow">{t('docs.pages.about.flow')}</h2>
      <ol className="docs-list">
        <li>
          {t('docs.about.flow1', {
            price: MINT_PRICE_ETH,
            nullTokens: TOKENS_PER_SHARE.toLocaleString(),
            llnuTokens: LLNU_TOKENS_PER_SHARE.toLocaleString(),
          })}
        </li>
        <li>
          {t('docs.about.flow2', {
            cap: MINT_TARGET_ETH,
            usd: mintCapUsd,
          })}
        </li>
        <li>{t('docs.about.flow3')}</li>
        <li>{t('docs.about.flow4')}</li>
      </ol>
    </>
  )
}

function TokensPage() {
  const { t } = useTranslation()

  return (
    <>
      <h2 id="compare">{t('docs.pages.tokens.compare')}</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr>
              <th />
              <th>$null</th>
              <th>$llnu</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('docs.tokens.role')}</td>
              <td>{t('docs.tokens.primary')}</td>
              <td>{t('docs.tokens.strike')}</td>
            </tr>
            <tr>
              <td>{t('docs.tokens.dex')}</td>
              <td>{t('docs.tokens.dexNull')}</td>
              <td>{t('docs.tokens.dexLlnu')}</td>
            </tr>
            <tr>
              <td>{t('docs.tokens.p2p')}</td>
              <td>{t('docs.tokens.p2pNull')}</td>
              <td>{t('docs.tokens.p2pLlnu')}</td>
            </tr>
            <tr>
              <td>{t('docs.tokens.protection')}</td>
              <td>{t('docs.tokens.protectionNull')}</td>
              <td>{t('docs.tokens.protectionLlnu')}</td>
            </tr>
            <tr>
              <td>{t('docs.tokens.maxSupply')}</td>
              <td colSpan={2}>
                {t('docs.tokens.maxSupplyValue', { amount: MAX_SUPPLY.toLocaleString() })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="rules">{t('docs.pages.tokens.rules')}</h2>
      <p>{t('docs.tokens.rulesP')}</p>
    </>
  )
}

function MintPage() {
  const { t } = useTranslation()
  const mintCapUsd = useMintCapUsd(MINT_TARGET_ETH)
  const maxShares = MAX_ETH_PER_ADDRESS / MINT_PRICE_ETH

  return (
    <>
      <h2 id="presale">{t('docs.pages.mint.presale')}</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <tbody>
            <tr>
              <td>{t('docs.mintDoc.pricePerShare')}</td>
              <td>
                <code>{MINT_PRICE_ETH} ETH</code>
              </td>
            </tr>
            <tr>
              <td>{t('docs.mintDoc.perShare')}</td>
              <td>
                {t('docs.mintDoc.perShareValue', {
                  nullTokens: TOKENS_PER_SHARE.toLocaleString(),
                  llnuTokens: LLNU_TOKENS_PER_SHARE.toLocaleString(),
                })}
              </td>
            </tr>
            <tr>
              <td>{t('docs.mintDoc.perAddressCap')}</td>
              <td>
                {t('docs.mintDoc.perAddressCapValue', {
                  eth: MAX_ETH_PER_ADDRESS,
                  shares: maxShares,
                })}
              </td>
            </tr>
            <tr>
              <td>{t('docs.mintDoc.raiseCap')}</td>
              <td>
                {t('docs.mintDoc.raiseCapValue', {
                  eth: MINT_TARGET_ETH,
                  usd: mintCapUsd,
                })}
              </td>
            </tr>
            <tr>
              <td>{t('docs.mintDoc.progress')}</td>
              <td>{t('docs.mintDoc.progressValue')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>{t('docs.mintDoc.participate')}</p>

      <h2 id="liquidity">{t('docs.pages.mint.liquidity')}</h2>
      <p>{t('docs.mintDoc.liquidityIntro', { cap: MINT_TARGET_ETH })}</p>
      <ol className="docs-list">
        <li>{t('docs.mintDoc.liquidity1')}</li>
        <li>{t('docs.mintDoc.liquidity2')}</li>
        <li>{t('docs.mintDoc.liquidity3')}</li>
        <li>{t('docs.mintDoc.liquidity4')}</li>
        <li>{t('docs.mintDoc.liquidity5')}</li>
      </ol>
    </>
  )
}

function LinkedBurnPage() {
  const { t } = useTranslation()

  return (
    <>
      <h2 id="trigger">{t('docs.pages.linked-burn.trigger')}</h2>
      <ul className="docs-list">
        <li>{t('docs.linkedBurn.trigger1')}</li>
        <li>{t('docs.linkedBurn.trigger2')}</li>
        <li>{t('docs.linkedBurn.trigger3')}</li>
      </ul>
      <p>{t('docs.linkedBurn.mechanism')}</p>

      <h2 id="example">{t('docs.pages.linked-burn.example')}</h2>
      <p>{t('docs.linkedBurn.exampleIntro')}</p>
      <ol className="docs-list">
        <li>{t('docs.linkedBurn.example1')}</li>
        <li>{t('docs.linkedBurn.example2')}</li>
        <li>{t('docs.linkedBurn.example3')}</li>
        <li>{t('docs.linkedBurn.example4')}</li>
      </ol>

      <h2 id="exemptions">{t('docs.pages.linked-burn.exemptions')}</h2>
      <p>{t('docs.linkedBurn.exemptionsIntro')}</p>
      <ul className="docs-list">
        <li>{t('docs.linkedBurn.exemption1')}</li>
        <li>{t('docs.linkedBurn.exemption2')}</li>
        <li>{t('docs.linkedBurn.exemption3')}</li>
        <li>{t('docs.linkedBurn.exemption4')}</li>
      </ul>
    </>
  )
}

function ProtectionPage() {
  const { t } = useTranslation()

  return (
    <>
      <h2 id="cards">{t('docs.pages.protection.cards')}</h2>
      <p>{t('docs.protectionDoc.cardsIntro')}</p>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr>
              <th>{t('docs.protectionDoc.tier')}</th>
              <th>{t('docs.protectionDoc.duration')}</th>
              <th>{t('docs.protectionDoc.nullBurned')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('docs.protectionDoc.monthly')}</td>
              <td>{t('docs.protectionDoc.days30')}</td>
              <td>{CARD_MONTH_NULL.toLocaleString()}</td>
            </tr>
            <tr>
              <td>{t('docs.protectionDoc.quarterly')}</td>
              <td>{t('docs.protectionDoc.days90')}</td>
              <td>{CARD_QUARTER_NULL.toLocaleString()}</td>
            </tr>
            <tr>
              <td>{t('docs.protectionDoc.annual')}</td>
              <td>{t('docs.protectionDoc.days365')}</td>
              <td>{CARD_YEAR_NULL.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>{t('docs.protectionDoc.cardsNote')}</p>
    </>
  )
}

function ArchitecturePage() {
  const { t } = useTranslation()

  return (
    <>
      <h2 id="contracts">{t('docs.pages.architecture.contracts')}</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <thead>
            <tr>
              <th>{t('docs.architecture.contract')}</th>
              <th>{t('docs.architecture.role')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NullMint</td>
              <td>{t('docs.architecture.nullMint')}</td>
            </tr>
            <tr>
              <td>NullToken</td>
              <td>{t('docs.architecture.nullToken')}</td>
            </tr>
            <tr>
              <td>LlnuToken</td>
              <td>{t('docs.architecture.llnuToken')}</td>
            </tr>
            <tr>
              <td>NullProtocolHook</td>
              <td>{t('docs.architecture.protocolHook')}</td>
            </tr>
            <tr>
              <td>NullLiquiditySeeder</td>
              <td>{t('docs.architecture.liquiditySeeder')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="hook">{t('docs.pages.architecture.hook')}</h2>
      <p>{t('docs.architecture.hookP1')}</p>
      <p>{t('docs.architecture.hookP2')}</p>
    </>
  )
}

function AddressesPage() {
  const { t } = useTranslation()
  const contracts = getContracts(TARGET_CHAIN_ID)
  const live = isProtocolLive(contracts)

  return (
    <>
      <h2 id="mainnet">{NETWORK_LABEL}</h2>
      <p>
        {t('docs.addresses.verify')}{' '}
        <a href={EXPLORER_URL} target="_blank" rel="noreferrer">
          {t('docs.addresses.etherscan')}
        </a>{' '}
        {t('docs.addresses.verifySuffix')}
      </p>
      {live && contracts ? (
        <div className="docs-table-wrap">
          <table className="docs-table docs-table-mono">
            <thead>
              <tr>
                <th>{t('docs.addresses.contract')}</th>
                <th>{t('docs.addresses.address')}</th>
              </tr>
            </thead>
            <tbody>
              {LABELS.map(({ key, label }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td>
                    <a href={explorerAddress(contracts[key])} target="_blank" rel="noreferrer">
                      {contracts[key]}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="docs-muted">{t('docs.addresses.pending')}</p>
      )}
    </>
  )
}

function FaqPage() {
  const { t } = useTranslation()

  return (
    <>
      <h2 id="trading">{t('docs.pages.faq.trading')}</h2>
      <h3>{t('docs.faqDoc.dexQ')}</h3>
      <p>{t('docs.faqDoc.dexA')}</p>
      <h3>{t('docs.faqDoc.nullDexQ')}</h3>
      <p>{t('docs.faqDoc.nullDexA')}</p>

      <h2 id="safety">{t('docs.pages.faq.safety')}</h2>
      <h3>{t('docs.faqDoc.onlyNullQ')}</h3>
      <p>{t('docs.faqDoc.onlyNullA')}</p>
      <h3>{t('docs.faqDoc.eoaOnlyQ')}</h3>
      <p>{t('docs.faqDoc.eoaOnlyA')}</p>
      <h3>{t('docs.faqDoc.earlyEndQ')}</h3>
      <p>{t('docs.faqDoc.earlyEndA')}</p>
    </>
  )
}

function ReferencePage() {
  const { t } = useTranslation()
  const mintCapUsd = useMintCapUsd(MINT_TARGET_ETH)

  return (
    <>
      <h2 id="params">{t('docs.pages.reference.params')}</h2>
      <div className="docs-table-wrap">
        <table className="docs-table">
          <tbody>
            <tr>
              <td>{t('docs.reference.mintPrice')}</td>
              <td>
                {t('docs.reference.mintPriceValue', {
                  price: MINT_PRICE_ETH,
                  nullTokens: TOKENS_PER_SHARE.toLocaleString(),
                  llnuTokens: LLNU_TOKENS_PER_SHARE.toLocaleString(),
                })}
              </td>
            </tr>
            <tr>
              <td>{t('docs.reference.caps')}</td>
              <td>
                {t('docs.reference.capsValue', {
                  perAddress: MAX_ETH_PER_ADDRESS,
                  total: MINT_TARGET_ETH,
                  usd: mintCapUsd,
                })}
              </td>
            </tr>
            <tr>
              <td>{t('docs.reference.maxSupply')}</td>
              <td>{t('docs.reference.maxSupplyValue', { amount: MAX_SUPPLY.toLocaleString() })}</td>
            </tr>
            <tr>
              <td>{t('docs.reference.linkedBurn')}</td>
              <td>{t('docs.reference.linkedBurnValue')}</td>
            </tr>
            <tr>
              <td>{t('docs.reference.shieldCards')}</td>
              <td>
                {t('docs.reference.shieldCardsValue', {
                  month: CARD_MONTH_NULL.toLocaleString(),
                  quarter: CARD_QUARTER_NULL.toLocaleString(),
                  year: CARD_YEAR_NULL.toLocaleString(),
                })}
              </td>
            </tr>
            <tr>
              <td>{t('docs.reference.trading')}</td>
              <td>{t('docs.reference.tradingValue')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="docs-muted">{t('docs.reference.footer')}</p>
    </>
  )
}
